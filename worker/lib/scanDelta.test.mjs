import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeScanDelta, findingKey, isEmptyDelta, AGGREGATE_RULE_IDS } from './scanDelta.js'
import { scoreFromFindings } from './score.js'

// Синтетические находки, но форма — не выдуманная: те же поля, что реально
// пишет worker/lib/axe.js (`selector: node.target.join(' ')`, `page: pageUrl`)
// и наши собственные проверки в domChecks.js/siteChecks.js.
const f = (over = {}) => ({
  ruleId: 'color-contrast',
  wcag: ['wcag143'],
  impact: 'serious',
  selector: 'main > p:nth-child(2)',
  page: 'https://example.com/',
  html: '<p>hello</p>',
  ...over,
})

test('empty vs empty: nothing new, nothing resolved, score unchanged', () => {
  const d = computeScanDelta([], [])
  assert.deepEqual(d.new, [])
  assert.deepEqual(d.resolved, [])
  assert.equal(d.scoreChange, 0)
  assert.equal(isEmptyDelta(d), true)
})

test('empty previous scan: every current finding is new, score drops', () => {
  const current = [f(), f({ ruleId: 'image-alt', selector: 'img[src="/a.png"]', impact: 'critical' })]
  const d = computeScanDelta([], current)
  assert.equal(d.new.length, 2)
  assert.equal(d.resolved.length, 0)
  assert.equal(d.scoreBefore, 100)
  assert.equal(d.scoreAfter, scoreFromFindings(current))
  assert.ok(d.scoreChange < 0, 'appearing findings must make scoreChange negative')
})

test('empty current scan: everything is resolved, score rises (positive scoreChange = improvement)', () => {
  const previous = [f(), f({ ruleId: 'image-alt', selector: 'img' })]
  const d = computeScanDelta(previous, [])
  assert.equal(d.new.length, 0)
  assert.equal(d.resolved.length, 2)
  assert.equal(d.scoreAfter, 100)
  assert.ok(d.scoreChange > 0, 'fixing everything must make scoreChange positive')
})

test('identical scans: empty delta', () => {
  const findings = [f(), f({ ruleId: 'link-name', selector: 'a[href="/x"]' })]
  // Разные объекты с теми же значениями — сравнение обязано быть по значению
  // ключа, а не по ссылке (после JSON.parse из D1 объекты в любом случае новые).
  const d = computeScanDelta(findings, JSON.parse(JSON.stringify(findings)))
  assert.equal(isEmptyDelta(d), true)
})

test('partial overlap: only the changed part shows up on each side', () => {
  const stays = f()
  const gone = f({ ruleId: 'image-alt', selector: 'img[src="/old.png"]' })
  const appeared = f({ ruleId: 'label', selector: 'input#search' })

  const d = computeScanDelta([stays, gone], [stays, appeared])
  assert.deepEqual(d.new.map((x) => x.ruleId), ['label'])
  assert.deepEqual(d.resolved.map((x) => x.ruleId), ['image-alt'])
})

test('array order does not matter: the same findings shuffled produce an empty delta', () => {
  const a = [
    f({ selector: 'p1' }),
    f({ ruleId: 'image-alt', selector: 'img1' }),
    f({ ruleId: 'label', selector: 'input1' }),
  ]
  const b = [a[2], a[0], a[1]]
  const d = computeScanDelta(a, b)
  assert.equal(isEmptyDelta(d), true, `order-sensitive comparison would report ${d.new.length} new`)
})

test('same ruleId on a different page is a DIFFERENT finding (page is part of the key)', () => {
  const home = f({ page: 'https://example.com/' })
  const about = f({ page: 'https://example.com/about' })
  const d = computeScanDelta([home], [about])
  assert.equal(d.new.length, 1)
  assert.equal(d.resolved.length, 1)
  assert.equal(d.new[0].page, 'https://example.com/about')
})

test('same ruleId+page on a different element is a DIFFERENT finding (selector is part of the key)', () => {
  const d = computeScanDelta([f({ selector: 'img#a' })], [f({ selector: 'img#b' })])
  assert.equal(d.new.length, 1)
  assert.equal(d.resolved.length, 1)
})

test('html/impact drift on the same element is NOT a change (they are not part of the key)', () => {
  const before = f({ html: '<p>old copy</p>', impact: 'serious' })
  const after = f({ html: '<p>new copy, rewritten</p>', impact: 'critical' })
  const d = computeScanDelta([before], [after])
  assert.deepEqual(d.new, [])
  assert.deepEqual(d.resolved, [])
  // Но score при этом меняется — и дельта это честно показывает.
  assert.ok(d.scoreChange < 0, 'serious -> critical must still move the score')
  assert.equal(isEmptyDelta(d), false, 'a severity bump is news for the site owner')
})

test('duplicates are counted as a multiset: 2 -> 1 resolves exactly one', () => {
  const dup = f()
  const d = computeScanDelta([dup, { ...dup }], [dup])
  assert.equal(d.resolved.length, 1)
  assert.equal(d.new.length, 0)
})

test('duplicates are counted as a multiset: 1 -> 3 adds exactly two', () => {
  const dup = f()
  const d = computeScanDelta([dup], [dup, { ...dup }, { ...dup }])
  assert.equal(d.new.length, 2)
  assert.equal(d.resolved.length, 0)
})

test('scan-meta-* findings never appear in the delta (they are not site violations, D-113)', () => {
  const meta = f({ ruleId: 'scan-meta-page-skipped', selector: 'body', impact: 'minor' })
  const d = computeScanDelta([], [meta])
  assert.deepEqual(d.new, [])
  assert.equal(d.scoreChange, 0)
  assert.equal(isEmptyDelta(d), true, 'a scan-meta-only difference must not trigger a digest email')
})

test('a11y-pdf-present: the PDF count in the selector must not fake a new+resolved pair', () => {
  // Реальная форма из worker/lib/axe.js: selector это "N pdf link(s)".
  const before = f({ ruleId: 'a11y-pdf-present', selector: '3 pdf link(s)', impact: 'moderate', html: 'a.pdf, b.pdf, c.pdf' })
  const after = f({ ruleId: 'a11y-pdf-present', selector: '4 pdf link(s)', impact: 'moderate', html: 'a.pdf, b.pdf, c.pdf, d.pdf' })
  assert.ok(AGGREGATE_RULE_IDS.has('a11y-pdf-present'))
  const d = computeScanDelta([before], [after])
  assert.deepEqual(d.new, [], 'the same unresolved PDF problem must not be reported as new')
  assert.deepEqual(d.resolved, [], 'and must not be reported as resolved either')
})

test('a11y-pdf-present on another page is still a separate finding', () => {
  const home = f({ ruleId: 'a11y-pdf-present', selector: '3 pdf link(s)', page: 'https://example.com/' })
  const docs = f({ ruleId: 'a11y-pdf-present', selector: '3 pdf link(s)', page: 'https://example.com/docs' })
  const d = computeScanDelta([home], [docs])
  assert.equal(d.new.length, 1)
  assert.equal(d.resolved.length, 1)
})

test('findings with no stable identifier at all do not throw and do not cross-match by position', () => {
  // Битая/старая строка findings_json: полей может не быть вовсе.
  const nothing = { impact: 'minor' }
  const alsoNothing = { impact: 'critical' }
  assert.equal(findingKey(nothing), findingKey(alsoNothing), 'both collapse to the same empty key')
  const d = computeScanDelta([nothing], [alsoNothing])
  assert.deepEqual(d.new, [], 'two unidentifiable findings must not produce phantom churn')
  assert.deepEqual(d.resolved, [])

  // А вот появление ВТОРОЙ безымянной находки видно как новая — счёт честный.
  const d2 = computeScanDelta([nothing], [nothing, alsoNothing])
  assert.equal(d2.new.length, 1)
})

test('null/undefined/garbage input degrades to an empty delta instead of throwing', () => {
  for (const bad of [null, undefined, 'nope', 42, {}]) {
    const d = computeScanDelta(bad, bad)
    assert.deepEqual(d.new, [])
    assert.deepEqual(d.resolved, [])
    assert.equal(d.scoreChange, 0)
  }
  // null внутри массива (битый JSON из D1) не роняет ни ключ, ни score.
  const d = computeScanDelta([null, f()], [f()])
  assert.deepEqual(d.new, [])
  assert.deepEqual(d.resolved, [])
})

test('scoreBefore/scoreAfter equal what scans.score would hold for the same findings', () => {
  const previous = [f(), f({ ruleId: 'image-alt', selector: 'img', impact: 'critical' })]
  const current = [f({ ruleId: 'scan-meta-cookie-banner-dismissed', selector: 'body', impact: 'minor' })]
  const d = computeScanDelta(previous, current)
  assert.equal(d.scoreBefore, scoreFromFindings(previous))
  assert.equal(d.scoreAfter, scoreFromFindings(current))
  assert.equal(d.scoreChange, d.scoreAfter - d.scoreBefore)
})

// Набор обойдённых страниц НЕ фиксирован: pickPriorityLinks выбирает ≤6 ссылок
// по ключевым словам из живой главной (живой прогон 2026-08-11 по
// bundesregierung.de дал главную + /service/kontakt?view=). Меняется шапка сайта
// — меняется набор страниц, и без page-scope дельта врёт целыми страницами.
test('page scope off (default): findings on a page only one scan visited look new/resolved', () => {
  const kept = f({ page: 'https://example.com/' })
  const onlyBefore = f({ ruleId: 'label', selector: 'input', page: 'https://example.com/kontakt?view=' })
  const onlyAfter = f({ ruleId: 'label', selector: 'input', page: 'https://example.com/warenkorb' })

  const d = computeScanDelta([kept, onlyBefore], [kept, onlyAfter])
  assert.equal(d.new.length, 1)
  assert.equal(d.resolved.length, 1)
  assert.deepEqual(d.scopedOutPages, [])
})

test('page scope on: pages visited by only one of the two scans are excluded and named', () => {
  const kept = f({ page: 'https://example.com/' })
  const onlyBefore = f({ ruleId: 'label', selector: 'input', page: 'https://example.com/kontakt?view=' })
  const onlyAfter = f({ ruleId: 'label', selector: 'input', page: 'https://example.com/warenkorb' })

  const d = computeScanDelta([kept, onlyBefore], [kept, onlyAfter], {
    previousPages: ['https://example.com/', 'https://example.com/kontakt?view='],
    currentPages: ['https://example.com/', 'https://example.com/warenkorb'],
  })
  assert.deepEqual(d.new, [], 'a page the previous scan never visited is not evidence of a new problem')
  assert.deepEqual(d.resolved, [], 'a page this scan never visited is not evidence of a fix')
  assert.deepEqual(d.scopedOutPages.sort(), ['https://example.com/kontakt?view=', 'https://example.com/warenkorb'])
})

test('page scope on: a real change on a commonly visited page still shows up', () => {
  const pages = { previousPages: ['https://example.com/'], currentPages: ['https://example.com/'] }
  const d = computeScanDelta([], [f()], pages)
  assert.equal(d.new.length, 1)
  assert.deepEqual(d.scopedOutPages, [])
})

test('page scope with a missing/empty pages list is ignored (old D1 rows have no pages_json)', () => {
  const d = computeScanDelta([f()], [], { previousPages: [], currentPages: ['https://example.com/'] })
  assert.equal(d.resolved.length, 1, 'an unusable scope must not silently swallow the whole delta')
})

test('score is computed on the FULL findings even when the page scope is on (it must equal scans.score)', () => {
  const previous = [f({ page: 'https://example.com/gone' })]
  const d = computeScanDelta(previous, [], {
    previousPages: ['https://example.com/', 'https://example.com/gone'],
    currentPages: ['https://example.com/'],
  })
  assert.deepEqual(d.resolved, [])
  assert.equal(d.scoreBefore, scoreFromFindings(previous))
  assert.equal(d.scoreAfter, 100)
})

test('computeScanDelta is pure: it does not mutate either input array or its objects', () => {
  const previous = [f()]
  const current = [f({ ruleId: 'label', selector: 'input' })]
  const snapshot = JSON.stringify([previous, current])
  computeScanDelta(previous, current)
  assert.equal(JSON.stringify([previous, current]), snapshot)
})
