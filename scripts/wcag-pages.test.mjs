// CN-WCAG-PAGES (D-066): гейт согласованности справочника /wcag/.
//
// Порог осмысленности (страница только при status !== 'none') реализован в ДВУХ
// местах — src/lib/wcag.ts (сами страницы) и scripts/gen-a11y-sitemap.mjs
// (sitemap). Обе реализации читают один JSON, но могут разъехаться правкой
// одной из них. Этот тест проверяет источник правды и, когда dist/ собран,
// фактический результат обеих реализаций.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const coverage = JSON.parse(readFileSync(join(ROOT, 'data/a11y/en301549-coverage.json'), 'utf8'))
const rows = coverage.rows

const slugOf = (wcag) => wcag.replace(/\./g, '-')
const coveredSlugs = rows.filter((r) => r.status !== 'none').map((r) => slugOf(r.wcag))
const uncoveredSlugs = rows.filter((r) => r.status === 'none').map((r) => slugOf(r.wcag))

test('coverage data yields unique, non-empty page slugs above the thin-content threshold', () => {
  assert.ok(coveredSlugs.length >= 20, `порог дал подозрительно мало страниц: ${coveredSlugs.length}`)
  assert.equal(new Set(coveredSlugs).size, coveredSlugs.length, 'слаги /wcag/ не уникальны')
  for (const s of coveredSlugs) assert.match(s, /^[0-9]+(-[0-9]+)+$/, `странный слаг: ${s}`)
})

test('every own check referenced by coverage data has a grounded description in src/lib/wcag.ts', () => {
  const src = readFileSync(join(ROOT, 'src/lib/wcag.ts'), 'utf8')
  const oursIds = [...new Set(rows.map((r) => r.ours).filter(Boolean))]
  const missing = oursIds.filter((id) => !src.includes(`'${id}'`))
  assert.deepEqual(missing, [], `нет описания в OURS_DESCRIPTIONS: ${missing.join(', ')}`)
})

test('sitemap generator applies the same threshold as the pages (source check)', () => {
  const gen = readFileSync(join(ROOT, 'scripts/gen-a11y-sitemap.mjs'), 'utf8')
  assert.ok(gen.includes("'/wcag/'"), 'индекс /wcag/ не в списке sitemap')
  assert.ok(gen.includes("r.status !== 'none'"), 'sitemap-генератор потерял порог thin-content для /wcag/')
})

// Фактический результат — только когда сборка есть; без dist/ тест не претендует
// на проверку того, чего не было (open-world: «не проверено» ≠ «проверено, ок»).
test('built dist/ contains exactly the covered criterion pages, none for status=none', (t) => {
  const wcagDir = join(ROOT, 'dist/wcag')
  if (!existsSync(wcagDir)) {
    t.diagnostic('dist/wcag отсутствует — фактическая проверка возможна только после npm run build')
    return
  }
  const dirs = readdirSync(wcagDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
  assert.deepEqual(dirs, [...coveredSlugs].sort(), 'набор собранных /wcag/* не совпадает с порогом из данных')
  for (const s of uncoveredSlugs) {
    assert.ok(!dirs.includes(s), `страница для непокрытого критерия существует: /wcag/${s}/`)
  }

  const sitemapPath = join(ROOT, 'dist/sitemap.xml')
  if (existsSync(sitemapPath)) {
    const xml = readFileSync(sitemapPath, 'utf8')
    for (const s of coveredSlugs) assert.ok(xml.includes(`/wcag/${s}/`), `нет в sitemap: /wcag/${s}/`)
    for (const s of uncoveredSlugs) assert.ok(!xml.includes(`/wcag/${s}/`), `в sitemap лишний /wcag/${s}/`)
  }
})
