#!/usr/bin/env node
// Слияние партий сборщиков (data/a11y/collect/*.json) в основной
// data/a11y/agencies.json. Дедуп по домену (нормализованному) и slug:
// существующая запись всегда побеждает — сборщики не перезаписывают
// проверенные данные. Отчёт: сколько добавлено/пропущено и откуда.
// Запуск: node scripts/merge-a11y.mjs [--dry]

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const A11Y = join(ROOT, 'data', 'a11y')
const COLLECT = join(A11Y, 'collect')
const MAIN = join(A11Y, 'agencies.json')

const dry = process.argv.includes('--dry')
const domainOf = (w) =>
  String(w).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase()

const main = JSON.parse(readFileSync(MAIN, 'utf8'))
const haveDomain = new Set(main.map((a) => domainOf(a.website)))
const haveSlug = new Set(main.map((a) => a.slug))

// Надгробия: записи, осознанно исключённые из каталога (data/a11y/excluded.json).
// Без этого списка удалённое агентство воскресало бы при каждом слиянии —
// партии сборщиков остаются в репо как сырьё и всё ещё содержат его.
const EXCLUDED = join(A11Y, 'excluded.json')
const excluded = existsSync(EXCLUDED) ? JSON.parse(readFileSync(EXCLUDED, 'utf8')) : []
const denyDomain = new Set(excluded.map((e) => domainOf(e.domain)))
const denySlug = new Set(excluded.map((e) => e.slug).filter(Boolean))

if (!existsSync(COLLECT)) {
  console.error('Нет каталога data/a11y/collect/ — нечего сливать.')
  process.exit(1)
}

const files = readdirSync(COLLECT).filter((f) => f.endsWith('.json'))
let added = 0
const report = []

for (const f of files) {
  let batch
  try {
    batch = JSON.parse(readFileSync(join(COLLECT, f), 'utf8'))
  } catch (e) {
    report.push(`  ✗ ${f}: не парсится (${e.message}) — пропущен целиком`)
    continue
  }
  if (!Array.isArray(batch)) {
    report.push(`  ✗ ${f}: не массив — пропущен`)
    continue
  }
  let ok = 0, dupes = 0, bad = 0, denied = 0
  for (const rec of batch) {
    if (!rec || !rec.slug || !rec.name || !rec.website || !rec.sourceRefs?.length) { bad++; continue }
    const d = domainOf(rec.website)
    if (denyDomain.has(d) || denySlug.has(rec.slug)) { denied++; continue }
    if (haveDomain.has(d) || haveSlug.has(rec.slug)) { dupes++; continue }
    // минимальная нормализация: website — голый домен
    rec.website = d
    rec.offices ??= []
    rec.countriesServed ??= rec.hq?.countryCode ? [rec.hq.countryCode] : []
    rec.languages ??= []
    rec.services ??= []
    rec.standards ??= []
    rec.industries ??= []
    rec.certs ??= []
    rec.description ??= {}
    haveDomain.add(d)
    haveSlug.add(rec.slug)
    main.push(rec)
    ok++
  }
  added += ok
  report.push(
    `  ${f}: +${ok} (дубликатов ${dupes}, отброшено без обязательных полей ${bad}` +
      (denied ? `, исключено денилистом ${denied}` : '') + ')',
  )
}

console.log(`merge-a11y${dry ? ' [dry-run]' : ''}: +${added} → всего ${main.length}`)
for (const r of report) console.log(r)
if (!dry && added > 0) {
  writeFileSync(MAIN, JSON.stringify(main, null, 2) + '\n')
  console.log('Записано в data/a11y/agencies.json. Дальше: node scripts/build-a11y.mjs')
}
