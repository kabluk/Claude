#!/usr/bin/env node
// Накладывает D1-оверлей (claims/featured) на data/a11y/agencies.json перед
// сборкой (A2-CLAIM-REBUILD, INTERFACES.md §4: "D1-оверлеи подхватываются
// ежедневным ребилдом; статический сайт никогда не читает D1 в рантайме").
//
// Патчит ТОЛЬКО два поля, которые уже есть в Agency (data/a11y/types.ts) и не
// требуют валидации произвольного контента:
//   - claimed: true, если есть verified claim на этот agency_slug
//   - featured: {until}, если есть featured-запись с until >= сегодня (иначе
//     снимается — истёкшее размещение не должно оставаться в статике)
// claims.patch_json (предложенные правки профиля агентства) НАМЕРЕННО не
// применяется этим скриптом — ни один узел ещё не собирает и не валидирует
// такие патчи (A2-CLAIM-API создаёт заявку без патча), применять произвольный
// непроверенный JSON к каталогу было бы нарушением R1 ("ничего не выдумывать/
// не проверенное") — это отдельная будущая задача, не молчаливый пропуск.
//
// Идемпотентно по конструкции: каждый прогон читает ТЕКУЩЕЕ состояние D1 и
// ПЕРЕЗАПИСЫВАЕТ поля claimed/featured с нуля (не инкрементирует/не тоглит) —
// повторный прогон с тем же состоянием D1 даёт тот же результат.
//
// Мутирует data/a11y/agencies.json ПРЯМО В РАБОЧЕЙ КОПИИ CI-раннера — этот
// патч НЕ коммитится обратно в git (иначе размылась бы граница между
// проверенными фактами, которые правят руками, и операционным оверлеем).
// Локальный прогон разработчика тоже мутирует файл на диске — если это
// нежелательно, откатите правку `git checkout -- data/a11y/agencies.json`.
//
// Запуск: node scripts/apply-d1-overlay.mjs [--remote]
// --remote — читает настоящую прод-D1 (нужен CLOUDFLARE_API_TOKEN в env, как
//   в живых прогонах этой сессии); без флага — локальная D1 (wrangler dev
//   --local же наполняет её), для разработки/теста.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const AGENCIES_PATH = join(ROOT, 'data', 'a11y', 'agencies.json')
const D1_DATABASE = 'accessatlas-scans'

const remote = process.argv.includes('--remote')

function d1Query(sql) {
  const args = [
    'wrangler', 'd1', 'execute', D1_DATABASE,
    remote ? '--remote' : '--local',
    '--json', '--command', sql,
  ]
  const raw = execFileSync('npx', args, { cwd: ROOT, encoding: 'utf8' })
  const parsed = JSON.parse(raw)
  return parsed[0]?.results ?? []
}

export function computeOverlay({ claimedRows, featuredRows, today }) {
  const claimedSlugs = new Set(claimedRows.map((r) => r.agency_slug))
  const featuredBySlug = new Map(
    featuredRows.filter((r) => r.until >= today).map((r) => [r.agency_slug, { until: r.until }]),
  )
  return { claimedSlugs, featuredBySlug }
}

export function applyOverlay(agencies, { claimedSlugs, featuredBySlug }) {
  let claimedCount = 0
  let featuredCount = 0
  const patched = agencies.map((a) => {
    const claimed = claimedSlugs.has(a.slug)
    const featured = featuredBySlug.get(a.slug)
    if (claimed) claimedCount++
    if (featured) featuredCount++
    const next = { ...a }
    if (claimed) next.claimed = true
    else delete next.claimed
    if (featured) next.featured = featured
    else delete next.featured
    return next
  })
  return { patched, claimedCount, featuredCount }
}

async function main() {
  const claimedRows = d1Query(`SELECT agency_slug FROM claims WHERE verified = 1`)
  const featuredRows = d1Query(`SELECT agency_slug, until FROM featured`)
  const today = new Date().toISOString().slice(0, 10)

  const agencies = JSON.parse(readFileSync(AGENCIES_PATH, 'utf8'))
  const overlay = computeOverlay({ claimedRows, featuredRows, today })
  const { patched, claimedCount, featuredCount } = applyOverlay(agencies, overlay)

  writeFileSync(AGENCIES_PATH, JSON.stringify(patched, null, 2) + '\n')
  console.log(
    `✓ apply-d1-overlay (${remote ? '--remote' : '--local'}): ${claimedCount} claimed, ${featuredCount} featured (of ${agencies.length} agencies)`,
  )
}

// Не запускать при импорте из тестов (computeOverlay/applyOverlay — чистые
// функции, тестируются отдельно без wrangler/сети).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('✗ apply-d1-overlay failed:', err.message)
    process.exit(1)
  })
}
