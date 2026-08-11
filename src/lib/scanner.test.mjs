// D-107: границы шкалы score → грейд. Пороги — явное решение владельца
// (90/70/50), не подобраны программой; тест фиксирует их как контракт, а не
// как деталь реализации — следующая правка не должна тихо сдвинуть границу.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  scoreGrade, scoreGradeLabel, scoreGradeChipClass, parsePlanUnlocked, decidePlanPanel,
  interpretCheckoutResponse, parseCountryCode, parseCountrySource,
} from './scanner.ts'

function jsonResponse(status, body) {
  return new Response(body === undefined ? '' : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('границы 90/70/50 — ровно на пороге ещё верхний грейд, на 1 ниже — уже нижний', () => {
  assert.equal(scoreGrade(100), 'excellent')
  assert.equal(scoreGrade(90), 'excellent')
  assert.equal(scoreGrade(89), 'good')
  assert.equal(scoreGrade(70), 'good')
  assert.equal(scoreGrade(69), 'needs-work')
  assert.equal(scoreGrade(50), 'needs-work')
  assert.equal(scoreGrade(49), 'poor')
  assert.equal(scoreGrade(0), 'poor')
})

test('label и chip-класс покрывают все 4 грейда без пропуска', () => {
  const grades = ['excellent', 'good', 'needs-work', 'poor']
  for (const g of grades) {
    assert.equal(typeof scoreGradeLabel(g), 'string')
    assert.ok(scoreGradeLabel(g).length > 0)
    assert.match(scoreGradeChipClass(g), /^chip-(success|moderate|critical)$/)
  }
})

test('верхние два грейда используют success-токен, нижние — различимые moderate/critical', () => {
  assert.equal(scoreGradeChipClass('excellent'), 'chip-success')
  assert.equal(scoreGradeChipClass('good'), 'chip-success')
  assert.equal(scoreGradeChipClass('needs-work'), 'chip-moderate')
  assert.equal(scoreGradeChipClass('poor'), 'chip-critical')
})

// A2-REPORT-PAYWALL: planUnlocked must default to LOCKED for anything that
// isn't the literal boolean `true` — an older deployed worker (D-022/D-064)
// simply omits the field, and that must never read as unlocked.
test('parsePlanUnlocked: only literal `true` unlocks; missing/garbage stays locked', () => {
  assert.equal(parsePlanUnlocked(true), true)
  assert.equal(parsePlanUnlocked(undefined), false)
  assert.equal(parsePlanUnlocked(null), false)
  assert.equal(parsePlanUnlocked('true'), false)
  assert.equal(parsePlanUnlocked(1), false)
  assert.equal(parsePlanUnlocked({}), false)
})

// A2-REPORT-PAYWALL: which panel ReportPage renders, as a pure decision so it
// is testable without rendering. A scan with zero issue groups has nothing to
// build a plan from — must hide, never sell an empty plan, regardless of
// planUnlocked.
// A4-SITE-COUNTRY: same strict-to-garbage rubric as parsePlanUnlocked above —
// an older deployed worker (D-022) simply won't send these fields at all.
test('parseCountryCode: valid non-empty string uppercased/trimmed; garbage/absent -> null', () => {
  assert.equal(parseCountryCode('US'), 'US')
  assert.equal(parseCountryCode('de'), 'DE')
  assert.equal(parseCountryCode(' fr '), 'FR')
  assert.equal(parseCountryCode(''), null)
  assert.equal(parseCountryCode('   '), null)
  assert.equal(parseCountryCode(undefined), null)
  assert.equal(parseCountryCode(null), null)
  assert.equal(parseCountryCode(42), null)
  assert.equal(parseCountryCode({}), null)
})

test('parseCountrySource: only the 4 known source strings pass; anything else (incl. a future worker\'s new source) -> null', () => {
  assert.equal(parseCountrySource('user-override'), 'user-override')
  assert.equal(parseCountrySource('schema-org'), 'schema-org')
  assert.equal(parseCountrySource('tld'), 'tld')
  assert.equal(parseCountrySource('unknown'), 'unknown')
  assert.equal(parseCountrySource('geo-ip'), null) // hypothetical future source — not silently trusted
  assert.equal(parseCountrySource(undefined), null)
  assert.equal(parseCountrySource(null), null)
  assert.equal(parseCountrySource(123), null)
})

test('decidePlanPanel: zero finding groups always hides the panel', () => {
  assert.equal(decidePlanPanel({ planUnlocked: true }, 0), 'hidden')
  assert.equal(decidePlanPanel({ planUnlocked: false }, 0), 'hidden')
})

test('decidePlanPanel: with findings, planUnlocked selects unlocked vs locked', () => {
  assert.equal(decidePlanPanel({ planUnlocked: true }, 3), 'unlocked')
  assert.equal(decidePlanPanel({ planUnlocked: false }, 3), 'locked')
})

// A2-STRIPE-CHECKOUT: response→outcome mapping. 503 must be a distinguishable
// result (UI degrades to the free branch), never a thrown error.
test('interpretCheckoutResponse: 503 -> {kind:"unavailable"}, not an exception', async () => {
  const result = await interpretCheckoutResponse(jsonResponse(503, { code: 'checkout_unavailable' }))
  assert.deepEqual(result, { kind: 'unavailable' })
})

test('interpretCheckoutResponse: {url} -> redirect', async () => {
  const result = await interpretCheckoutResponse(jsonResponse(200, { url: 'https://checkout.stripe.com/x' }))
  assert.deepEqual(result, { kind: 'redirect', url: 'https://checkout.stripe.com/x' })
})

test('interpretCheckoutResponse: {alreadyUnlocked:true} -> already-unlocked (do not pay again)', async () => {
  const result = await interpretCheckoutResponse(jsonResponse(200, { alreadyUnlocked: true }))
  assert.deepEqual(result, { kind: 'already-unlocked' })
})

test('interpretCheckoutResponse: other non-2xx throws (real error surfaced, never swallowed)', async () => {
  await assert.rejects(() => interpretCheckoutResponse(jsonResponse(502, { error: 'boom', code: 'checkout_failed' })), /boom/)
})

test('interpretCheckoutResponse: 200 without a url throws (never redirect to nothing)', async () => {
  await assert.rejects(() => interpretCheckoutResponse(jsonResponse(200, { id: 'cs_x' })), /no URL/)
})
