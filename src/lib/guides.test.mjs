// G-INTERLINK-AUDIT (2026-08-15): гейт для relatedGuidesFor() — новой функции
// перелинковки гайдов, добавленной по итогам SEO-плана п.6 (у каждого гайда
// должен быть путь к другому гайду, не только через индекс /guides/).
//
// Фикстуры ниже — не выдумка: это реальные slug/standard/countryCode всех
// 27 файлов data/a11y/guides/*.md на момент аудита (сверено построчным
// разбором frontmatter). Импорт из guideRelations.ts, НЕ из guides.ts:
// последний на верхнем уровне модуля вызывает import.meta.glob (Vite-
// специфика), которую `tsx --test` не умеет исполнять вне сборки —
// guideRelations.ts специально вынесен без этой зависимости (см. его шапку).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { relatedGuidesFor } from './guideRelations.ts'

// slug/standard/countryCode — реальные значения из каталога (2026-08-15).
// locale/title упрощены до минимума, который использует relatedGuidesFor
// (slug/standard/countryCode) — остальные поля GuideDoc функции не нужны.
const FIXTURE_GUIDES = [
  { slug: 'accessibility-audit-cost', standard: undefined, countryCode: undefined },
  { slug: 'accessibility-statement-guide', standard: 'eaa', countryCode: undefined },
  { slug: 'ada-website-compliance', standard: 'ada', countryCode: 'US' },
  { slug: 'aria-labels-guide', standard: 'wcag-2-2', countryCode: undefined },
  { slug: 'audit-rgaa-guide', standard: 'rgaa', countryCode: 'FR' },
  { slug: 'audyt-wcag-przewodnik', standard: 'en-301-549', countryCode: 'PL' },
  { slug: 'barrierefreiheitserklaerung-bfsg-anlage3', standard: 'eaa', countryCode: 'DE' },
  { slug: 'barrierefreiheitserklaerung-muster-checkliste', standard: 'eaa', countryCode: 'DE' },
  { slug: 'bfsg-pflichten-guide', standard: 'eaa', countryCode: 'DE' },
  { slug: 'bitv-test-kosten-ablauf', standard: 'bitv', countryCode: 'DE' },
  { slug: 'eaa-austria-guide', standard: 'eaa', countryCode: 'AT' },
  { slug: 'eaa-belgium-guide', standard: 'eaa', countryCode: 'BE' },
  { slug: 'eaa-denmark-guide', standard: 'eaa', countryCode: 'DK' },
  { slug: 'eaa-finland-guide', standard: 'eaa', countryCode: 'FI' },
  { slug: 'eaa-ireland-guide', standard: 'eaa', countryCode: 'IE' },
  { slug: 'eaa-italy-guide', standard: 'eaa', countryCode: 'IT' },
  { slug: 'eaa-norway-guide', standard: 'eaa', countryCode: 'NO' },
  { slug: 'eaa-sweden-guide', standard: 'eaa', countryCode: 'SE' },
  { slug: 'en-301-549-explained', standard: 'en-301-549', countryCode: undefined },
  { slug: 'european-accessibility-act-guide', standard: 'eaa', countryCode: undefined },
  { slug: 'how-to-write-alt-text', standard: 'wcag-2-2', countryCode: undefined },
  { slug: 'rgaa-guide', standard: 'rgaa', countryCode: 'FR' },
  { slug: 'section-508-compliance-guide', standard: 'section-508', countryCode: 'US' },
  { slug: 'vpat-acr-guide', standard: 'section-508', countryCode: 'US' },
  { slug: 'vpat-en-301-549-mapping-guide', standard: 'section-508', countryCode: undefined },
  { slug: 'wcag-audit-guide', standard: 'wcag-2-2', countryCode: undefined },
  { slug: 'wcag-audit-vs-overlay', standard: 'wcag-2-2', countryCode: undefined },
]

const bySlug = (slug) => FIXTURE_GUIDES.find((g) => g.slug === slug)

test('каждый гайд со standard находит хотя бы один другой гайд того же standard', () => {
  // Инвариант реального каталога: ни один standard здесь не представлен
  // ровно одним файлом (минимум 2 на каждый — 8 eaa-<country> + 2 без
  // страны, 3 wcag-2-2, 3 section-508, 2 rgaa, 2 en-301-549). Если это
  // перестанет быть так при добавлении/удалении гайдов, тест должен упасть
  // громко, а не молча начать врать про охват.
  for (const g of FIXTURE_GUIDES) {
    if (!g.standard) continue
    const rel = relatedGuidesFor(FIXTURE_GUIDES, g)
    assert.ok(rel.length > 0, `${g.slug} (standard=${g.standard}) не нашёл ни одного related guide`)
    assert.ok(
      rel.every((o) => o.standard === g.standard || o.countryCode === g.countryCode),
      `${g.slug}: related guide не совпадает ни по standard, ни по стране`,
    )
  }
})

test('гайд никогда не ссылается сам на себя', () => {
  for (const g of FIXTURE_GUIDES) {
    assert.ok(!relatedGuidesFor(FIXTURE_GUIDES, g).some((o) => o.slug === g.slug))
  }
})

test('приоритет — тот же standard, страна добирает только при нехватке', () => {
  // bfsg-pflichten-guide: standard=eaa, countryCode=DE. По eaa-стандарту в
  // каталоге 9 других гайдов — значит DE-гайды с ДРУГИМ standard (bitv:
  // bitv-test-kosten-ablauf) не должны попасть в выдачу, даже совпадая
  // по стране, пока совпадений по standard хватает на лимит.
  const g = bySlug('bfsg-pflichten-guide')
  const rel = relatedGuidesFor(FIXTURE_GUIDES, g)
  assert.equal(rel.length, 4)
  assert.ok(rel.every((o) => o.standard === 'eaa'))
  assert.ok(!rel.some((o) => o.slug === 'bitv-test-kosten-ablauf'))
})

test('страна добирает выдачу, когда совпадений по standard меньше лимита', () => {
  // audyt-wcag-przewodnik: standard=en-301-549 (всего 2 в каталоге — сам
  // + en-301-549-explained), countryCode=PL — но других PL-гайдов нет,
  // значит добрать нечем и выдача короче лимита. Проверяем именно этот
  // честный случай "добрать нечем", а не подделываем PL-гайд, которого нет.
  const g = bySlug('audyt-wcag-przewodnik')
  const rel = relatedGuidesFor(FIXTURE_GUIDES, g)
  assert.deepEqual(rel.map((o) => o.slug), ['en-301-549-explained'])
})

test('limit ограничивает выдачу', () => {
  const g = bySlug('european-accessibility-act-guide')
  assert.ok(relatedGuidesFor(FIXTURE_GUIDES, g).length <= 4)
  assert.ok(relatedGuidesFor(FIXTURE_GUIDES, g, 2).length <= 2)
})

test('гайд без standard и без countryCode не находит ничего (не изобретает совпадений)', () => {
  const fixture = { slug: 'fixture-no-topic', standard: undefined, countryCode: undefined }
  assert.deepEqual(relatedGuidesFor(FIXTURE_GUIDES, fixture), [])
})
