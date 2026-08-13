// Проверки уровня сайта (D-036) — на РЕАЛЬНЫХ сохранённых страницах, не на
// выдуманных. Обе ошибки первой версии нашлись именно на них, а синтетика их бы
// пропустила (см. комментарии в siteChecks.js):
//   1) поиск bundesregierung.de монтируется React'ом — в отданном HTML <input>
//      нет вовсе, и точное совпадение имени поля его не находило;
//   2) consistent identification по ВСЕМ ссылкам страницы давала 5 ложных
//      срабатываний (логотип vs текстовая ссылка на ту же страницу).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  detectWayfindingSignals, checkMultipleWays, extractNavOrder,
  checkConsistentNavigation, checkConsistentIdentification, runSiteChecks,
} from './siteChecks.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => fs.readFileSync(path.join(dir, '__fixtures__', name), 'utf8')
const bregPages = () => [
  { url: 'https://www.bundesregierung.de/', html: fixture('statement-breg-home.html') },
  { url: 'https://www.bundesregierung.de/breg-de/barrierefreiheit', html: fixture('statement-breg-statement.html') },
  { url: 'https://www.bundesregierung.de/breg-de/service/publikationen', html: fixture('pdf-breg-pubs.html') },
]

// --- 9.2.4.5 Multiple ways ---------------------------------------------------

test('detects search + sitemap + nav on real commercial and government sites', () => {
  for (const name of ['links-manufactum-home.html', 'links-impots-home.html']) {
    const s = detectWayfindingSignals(fixture(name))
    assert.equal(s.hasSearch, true, `${name}: поиск`)
    assert.equal(s.hasNavMenu, true, `${name}: навигация`)
  }
})

// Регрессия на реальную находку: поиск, отрисованный JS. Ловится по ссылке на
// страницу поиска, а не по <input>, которого в отданном HTML нет.
test('detects JS-mounted search on bundesregierung.de via the search-page link (regression)', () => {
  const s = detectWayfindingSignals(fixture('statement-breg-home.html'))
  assert.equal(s.hasSearch, true, 'поиск есть на сайте, но монтируется React — должен находиться по ссылке /suche/')
  assert.equal(s.hasNavMenu, true)
})

test('a real multi-page site with search + navigation reports no 2.4.5 finding', () => {
  assert.equal(checkMultipleWays(bregPages()), null)
})

test('a site with only a navigation menu (no search, no sitemap) is flagged', () => {
  const html = '<nav><a href="/a">A</a><a href="/b">B</a><a href="/c">C</a></nav><p>no search here</p>'
  const f = checkMultipleWays([{ url: 'https://x.test/', html }, { url: 'https://x.test/a', html }])
  assert.equal(f.ruleId, 'a11y-multiple-ways')
  assert.equal(f.impact, 'moderate')
  assert.match(f.html, /navigation menu/)
})

test('a single-page scan is never flagged for 2.4.5 (the criterion is about a set of pages)', () => {
  assert.equal(checkMultipleWays([{ url: 'https://x.test/', html: '<p>nothing</p>' }]), null)
})

test('a nav block with fewer than 3 links does not count as a way to locate pages', () => {
  const html = '<nav><a href="/a">A</a><a href="/b">B</a></nav>'
  const f = checkMultipleWays([{ url: 'https://x.test/', html }, { url: 'https://x.test/a', html }])
  assert.equal(f.ruleId, 'a11y-multiple-ways')
  assert.match(f.html, /only 0 way/)
})

// --- 9.3.2.3 Consistent navigation -------------------------------------------

test('real site with a consistent template reports no navigation-order finding', () => {
  assert.deepEqual(checkConsistentNavigation(bregPages()), [])
})

test('extractNavOrder reads a real navigation block and dedupes repeats', () => {
  const order = extractNavOrder(fixture('statement-breg-home.html'))
  assert.ok(order.length >= 5, `ожидали содержательную навигацию, получили ${order.length}`)
  assert.equal(new Set(order).size, order.length, 'дубликаты не отфильтрованы')
})

test('reordered shared navigation items are flagged', () => {
  const a = '<nav><a href="/1">One</a><a href="/2">Two</a><a href="/3">Three</a><a href="/4">Four</a></nav>'
  const b = '<nav><a href="/3">Three</a><a href="/2">Two</a><a href="/1">One</a><a href="/4">Four</a></nav>'
  const out = checkConsistentNavigation([{ url: 'p1', html: a }, { url: 'p2', html: b }])
  assert.equal(out.length, 1)
  assert.equal(out[0].ruleId, 'a11y-inconsistent-navigation')
  assert.equal(out[0].page, 'p2')
})

test('extra or missing items are not a violation — only reordering of shared ones is', () => {
  const a = '<nav><a href="/1">One</a><a href="/2">Two</a><a href="/3">Three</a></nav>'
  const b = '<nav><a href="/1">One</a><a href="/new">New</a><a href="/2">Two</a><a href="/3">Three</a></nav>'
  assert.deepEqual(checkConsistentNavigation([{ url: 'p1', html: a }, { url: 'p2', html: b }]), [])
})

test('fewer than 3 shared items is treated as statistically insignificant, not a finding', () => {
  const a = '<nav><a href="/1">One</a><a href="/2">Two</a></nav>'
  const b = '<nav><a href="/2">Two</a><a href="/1">One</a></nav>'
  assert.deepEqual(checkConsistentNavigation([{ url: 'p1', html: a }, { url: 'p2', html: b }]), [])
})

// --- 9.3.2.4 Consistent identification ---------------------------------------

// Регрессия на реальное ложное срабатывание первой версии.
test('real government pages produce no identification findings (logo vs text link is not a violation)', () => {
  assert.deepEqual(checkConsistentIdentification(bregPages()), [])
})

test('the same nav destination labelled incompatibly on two pages is flagged', () => {
  const a = '<nav><a href="/contact">Contact</a></nav>'
  const b = '<nav><a href="/contact">Impressum</a></nav>'
  const out = checkConsistentIdentification([{ url: 'p1', html: a }, { url: 'p2', html: b }])
  assert.equal(out.length, 1)
  assert.equal(out[0].ruleId, 'a11y-inconsistent-identification')
  assert.equal(out[0].impact, 'minor')
})

test('a longer form of the same label is not a violation ("Contact" vs "Contact us")', () => {
  const a = '<nav><a href="/contact">Contact</a></nav>'
  const b = '<nav><a href="/contact">Contact us</a></nav>'
  assert.deepEqual(checkConsistentIdentification([{ url: 'p1', html: a }, { url: 'p2', html: b }]), [])
})

// D-165: the check is locale-aware. A multilingual site labels the same destination
// differently per language by design — that is a translation, not a 3.2.4 violation.
// verscala.com's own scan produced 5 false positives here (countries/länder,
// knowledge/wissen, experts/experten…) before this fix.
test('the same destination across two site languages is not a violation (locale-aware, D-165)', () => {
  const en = '<html lang="en"><nav><a href="/countries/">Countries</a></nav></html>'
  const de = '<html lang="de"><nav><a href="/countries/">Länder</a></nav></html>'
  assert.deepEqual(checkConsistentIdentification([{ url: 'p1', html: en }, { url: 'p2', html: de }]), [])
})

test('conflicting labels WITHIN one language are still flagged (D-165 regression guard)', () => {
  const a = '<html lang="en"><nav><a href="/contact">Contact</a></nav></html>'
  const b = '<html lang="en"><nav><a href="/contact">Support</a></nav></html>'
  const out = checkConsistentIdentification([{ url: 'p1', html: a }, { url: 'p2', html: b }])
  assert.equal(out.length, 1)
  assert.equal(out[0].ruleId, 'a11y-inconsistent-identification')
})

// D-165 hole: on a MULTILINGUAL site, pages that omit <html lang> could be any language,
// so their labels must not be cross-compared (else the fix's '' bucket re-collapsed them).
test('multilingual site: pages missing <html lang> are not cross-compared', () => {
  const enExplicit = '<html lang="en"><nav><a href="/x/">X</a></nav></html>'
  const deExplicit = '<html lang="de"><nav><a href="/x/">X</a></nav></html>'
  const noLangEn = '<nav><a href="/countries/">Countries</a></nav>'
  const noLangDe = '<nav><a href="/countries/">Länder</a></nav>'
  const out = checkConsistentIdentification([
    { url: 'p1', html: enExplicit }, { url: 'p2', html: deExplicit },
    { url: 'p3', html: noLangEn }, { url: 'p4', html: noLangDe },
  ])
  assert.deepEqual(out, [])
})

// But a monolingual site with no lang attr at all is still compared (check preserved).
test('monolingual site without <html lang>: a real conflict is still flagged', () => {
  const a = '<nav><a href="/contact">Contact</a></nav>'
  const b = '<nav><a href="/contact">Support</a></nav>'
  const out = checkConsistentIdentification([{ url: 'p1', html: a }, { url: 'p2', html: b }])
  assert.equal(out.length, 1)
  assert.equal(out[0].ruleId, 'a11y-inconsistent-identification')
})

test('links outside <nav> are ignored — that is what caused the real false positives', () => {
  const a = '<a href="/">Bundesregierung | Startseite</a>'
  const b = '<a href="/">Der Bundesadler, die Flagge</a>'
  assert.deepEqual(checkConsistentIdentification([{ url: 'p1', html: a }, { url: 'p2', html: b }]), [])
})

// --- интеграция --------------------------------------------------------------

test('runSiteChecks on real pages returns no findings and never throws', () => {
  assert.deepEqual(runSiteChecks(bregPages()), [])
})

test('runSiteChecks tolerates empty/absent input without throwing', () => {
  assert.deepEqual(runSiteChecks([]), [])
  assert.deepEqual(runSiteChecks(null), [])
})
