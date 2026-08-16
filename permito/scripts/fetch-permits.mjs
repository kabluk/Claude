import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Обновление снапшотов: запускает все адаптеры из scripts/adapters/ и
// перезаписывает data/cities/<slug>.json. Падение одного города не
// останавливает остальные.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ADAPTERS_DIR = join(ROOT, 'scripts', 'adapters');
const OUT_DIR = join(ROOT, 'data', 'cities');
mkdirSync(OUT_DIR, { recursive: true });

const adapters = readdirSync(ADAPTERS_DIR).filter((f) => f.endsWith('.mjs'));
let failures = 0;

for (const file of adapters) {
  const slug = file.replace(/\.mjs$/, '');
  try {
    const mod = await import(join(ADAPTERS_DIR, file));
    const data = await mod.fetchCity();
    if (!data?.permits?.length) throw new Error('adapter returned no permits');
    writeFileSync(join(OUT_DIR, `${slug}.json`), JSON.stringify(data, null, 1));
    console.log(`✓ ${slug}: ${data.permits.length} permits (newest ${data.permits[0]?.issuedDate})`);
  } catch (err) {
    failures++;
    console.error(`✗ ${slug}: ${err.message}`);
  }
}

process.exitCode = failures === adapters.length && adapters.length > 0 ? 1 : 0;
