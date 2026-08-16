import { createHash } from 'node:crypto';
import { createWriteStream, mkdirSync, writeFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { setTimeout as sleep } from 'node:timers/promises';
import { SOURCES, exportUrl, metaUrl } from './sources.mjs';

// Ежедневный снапшот открытых данных FMCSA.
// Raw-файлы (gzip) кладутся в data/raw/<дата>/ (вне git),
// манифест с контрольными суммами — в data/manifests/<дата>.json (в git),
// чтобы происхождение каждого снимка было доказуемо и воспроизводимо.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const today = process.env.SNAPSHOT_DATE || new Date().toISOString().slice(0, 10);
const RAW_DIR = join(ROOT, 'data', 'raw', today);
const only = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',')
  : null;

mkdirSync(RAW_DIR, { recursive: true });
mkdirSync(join(ROOT, 'data', 'manifests'), { recursive: true });

const manifest = { date: today, fetchedAt: new Date().toISOString(), sources: [] };

// Socrata генерирует полный CSV-экспорт на лету — на многосотмегабайтных файлах
// соединение изредка рвётся на её стороне (SocketError: other side closed).
// Ретраим с бэкоффом; ни один сбой источника не должен ронять весь прогон —
// иначе уже скачанные до него источники теряются зря.
async function downloadOnce(url, outPath) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`http ${res.status}`);

  const hash = createHash('sha256');
  let rawBytes = 0;
  let lines = 0;
  const counter = new Transform({
    transform(chunk, _enc, cb) {
      rawBytes += chunk.length;
      hash.update(chunk);
      for (let i = 0; i < chunk.length; i++) if (chunk[i] === 10) lines++;
      cb(null, chunk);
    },
  });

  await pipeline(res.body, counter, createGzip({ level: 6 }), createWriteStream(outPath));
  return { rawBytes, lines, sha256: hash.digest('hex') };
}

async function downloadWithRetry(url, outPath, attempts = 4) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await downloadOnce(url, outPath);
    } catch (err) {
      lastErr = err;
      if (existsSync(outPath)) rmSync(outPath); // не оставлять обрезанный файл
      if (attempt < attempts) {
        const delayMs = 5000 * 2 ** (attempt - 1); // 5s, 10s, 20s
        process.stdout.write(`retry ${attempt}/${attempts - 1} after "${err.message}", waiting ${delayMs / 1000}s ... `);
        await sleep(delayMs);
      }
    }
  }
  throw lastErr;
}

for (const src of SOURCES) {
  if (only && !only.includes(src.id)) continue;
  const url = exportUrl(src);
  const outPath = join(RAW_DIR, `${src.id}.csv.gz`);
  process.stdout.write(`↓ ${src.id} (${src.datasetId}) ... `);

  let meta = {};
  try {
    const m = await (await fetch(metaUrl(src))).json();
    meta = {
      rowsUpdatedAt: m.rowsUpdatedAt ? new Date(m.rowsUpdatedAt * 1000).toISOString() : null,
      blobFilename: m.blobFilename || null,
      blobFileSize: m.blobFileSize || null,
    };
  } catch {}

  const started = Date.now();
  try {
    const { rawBytes, lines, sha256 } = await downloadWithRetry(url, outPath);
    const entry = {
      id: src.id,
      datasetId: src.datasetId,
      name: src.name,
      url,
      ...meta,
      rawBytes,
      gzBytes: statSync(outPath).size,
      lines,
      sha256,
      seconds: Math.round((Date.now() - started) / 1000),
    };
    manifest.sources.push(entry);
    console.log(`${(rawBytes / 1e6).toFixed(0)}MB raw → ${(entry.gzBytes / 1e6).toFixed(0)}MB gz, ${lines.toLocaleString()} lines, ${entry.seconds}s`);
  } catch (err) {
    console.log(`FAILED after retries: ${err.message}`);
    manifest.sources.push({ id: src.id, datasetId: src.datasetId, name: src.name, url, ...meta, error: err.message });
  }
}

writeFileSync(join(ROOT, 'data', 'manifests', `${today}.json`), JSON.stringify(manifest, null, 1));
const failed = manifest.sources.filter((s) => s.error).length;
console.log(`Manifest: data/manifests/${today}.json${failed ? ` (${failed} источник(ов) не удалось скачать)` : ''}`);
if (failed === manifest.sources.length) process.exitCode = 1; // все источники упали — это провал прогона
