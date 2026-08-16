import { createReadStream, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';

// Компактная сводка по снапшоту Census: агрегаты, по которым видно
// дельты между днями без хранения сырых файлов в git.
// Использование: node scripts/summarize.mjs [YYYY-MM-DD]

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const date = process.argv[2] || process.env.SNAPSHOT_DATE || new Date().toISOString().slice(0, 10);
const censusPath = join(ROOT, 'data', 'raw', date, 'census.csv.gz');
if (!existsSync(censusPath)) {
  console.error(`Нет файла ${censusPath} — сначала node scripts/snapshot.mjs`);
  process.exit(1);
}

// Простой CSV-парсер строки с учётом кавычек (поля Census содержат запятые).
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const rl = createInterface({ input: createReadStream(censusPath).pipe(createGunzip()) });
let header = null;
let idx = {};
const stats = {
  date,
  rows: 0,
  byStatus: {},
  byState: {},
  byOperation: {},
  priorRevoke: 0,
  fleet: { power_units_total: 0, with_power_units: 0 },
  addedByYear: {},
};

for await (const line of rl) {
  if (!header) {
    header = parseCsvLine(line).map((h) => h.trim().toLowerCase());
    header.forEach((h, i) => (idx[h] = i));
    continue;
  }
  if (!line) continue;
  const f = parseCsvLine(line);
  stats.rows++;
  const g = (name) => (idx[name] !== undefined ? f[idx[name]] : undefined);

  const status = (g('status_code') || '?').trim() || '?';
  stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  const st = (g('phy_state') || '?').trim().toUpperCase() || '?';
  stats.byState[st] = (stats.byState[st] || 0) + 1;
  const op = (g('carrier_operation') || '?').trim() || '?';
  stats.byOperation[op] = (stats.byOperation[op] || 0) + 1;
  if ((g('prior_revoke_flag') || '').trim().toUpperCase() === 'Y') stats.priorRevoke++;
  const pu = parseInt(g('power_units') || g('truck_units') || '', 10);
  if (Number.isFinite(pu) && pu > 0) {
    stats.fleet.power_units_total += pu;
    stats.fleet.with_power_units++;
  }
  const add = (g('add_date') || '').trim();
  const year = add.match(/(19|20)\d{2}/)?.[0];
  if (year) stats.addedByYear[year] = (stats.addedByYear[year] || 0) + 1;
}

// Топ-15 штатов, остальное — в OTHER, чтобы сводка оставалась компактной.
const top = Object.entries(stats.byState).sort((a, b) => b[1] - a[1]);
stats.byState = Object.fromEntries(top.slice(0, 15));
stats.byState.OTHER = top.slice(15).reduce((s, [, n]) => s + n, 0);
// Годы добавления: только последние 12.
stats.addedByYear = Object.fromEntries(
  Object.entries(stats.addedByYear).sort().slice(-12)
);

mkdirSync(join(ROOT, 'data', 'summaries'), { recursive: true });
const out = join(ROOT, 'data', 'summaries', `${date}.json`);
writeFileSync(out, JSON.stringify(stats, null, 1));
console.log(`${stats.rows.toLocaleString()} записей → ${out}`);
