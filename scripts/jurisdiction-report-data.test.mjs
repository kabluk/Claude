// CN-RESEARCH-JURISDICTION-COVERAGE: gate for the third report's aggregator.
//
// Same discipline as scripts/reports-data.test.mjs and
// scripts/en301549-report-data.test.mjs (neither of which this file touches —
// each gates its own report). This test recomputes the stats from the live
// data/a11y/agencies.json joined against the scanner's own jurisdiction list
// (worker/lib/jurisdiction.js) and asserts the committed snapshot
// data/a11y/jurisdiction-report.json is byte-identical, then checks internal
// consistency the snapshot comparison alone cannot: every one of the 13
// jurisdictions jurisdiction.js knows about must land in exactly one of
// uncovered/covered, and the two groups must sum to 13.
//
// Verified negatively while writing: temporarily editing a single count in the
// committed snapshot (e.g. bumping DE's agencyCount from 42 to 43, or moving PL
// from covered into uncovered) turns the equality assertion red with an exact
// diff; reverting turns it green again.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { computeStats, serialize } from './jurisdiction-report-data.mjs'
import { supportedJurisdictions } from '../worker/lib/jurisdiction.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

const agencies = JSON.parse(read('data/a11y/agencies.json'))
const taxonomies = JSON.parse(read('data/a11y/taxonomies.json'))
const jurisdictionList = supportedJurisdictions()
const fresh = computeStats(agencies, taxonomies, jurisdictionList)
const committed = read('data/a11y/jurisdiction-report.json')

test('the committed snapshot matches a fresh recompute — no drift, no hand-edited numbers', () => {
  assert.equal(
    serialize(fresh),
    committed,
    'data/a11y/jurisdiction-report.json устарел или правлен руками — перегенерируй: node scripts/jurisdiction-report-data.mjs',
  )
})

test('the law list is the same 13 jurisdictions worker/lib/jurisdiction.js exports — no drift, no invented country', () => {
  assert.equal(jurisdictionList.length, 13, 'jurisdiction.js должен экспортировать ровно 13 юрисдикций (см. GRAPH.yaml узел)')
  assert.equal(fresh.totalJurisdictions, jurisdictionList.length, 'totalJurisdictions ≠ числу юрисдикций из jurisdiction.js')

  const fromModule = jurisdictionList.map((j) => j.country).sort()
  const fromReport = [...fresh.uncovered.jurisdictions, ...fresh.covered.jurisdictions].map((r) => r.country).sort()
  assert.deepEqual(fromReport, fromModule, 'набор юрисдикций в отчёте отличается от worker/lib/jurisdiction.js — рассинхрон')
})

test('every jurisdiction lands in exactly one of uncovered/covered, and the groups sum to the total', () => {
  assert.equal(
    fresh.uncovered.count + fresh.covered.count,
    fresh.totalJurisdictions,
    'uncovered.count + covered.count ≠ totalJurisdictions (13)',
  )
  assert.equal(fresh.uncovered.count, fresh.uncovered.jurisdictions.length, 'uncovered.count ≠ длине списка')
  assert.equal(fresh.covered.count, fresh.covered.jurisdictions.length, 'covered.count ≠ длине списка')

  const codes = new Set()
  for (const r of [...fresh.uncovered.jurisdictions, ...fresh.covered.jurisdictions]) {
    assert.ok(!codes.has(r.country), `юрисдикция ${r.country} встречается больше одного раза`)
    codes.add(r.country)
  }
  assert.equal(codes.size, fresh.totalJurisdictions, 'после дедупликации число юрисдикций ≠ totalJurisdictions')

  for (const r of fresh.uncovered.jurisdictions) {
    assert.equal(r.agencyCount, 0, `юрисдикция ${r.country} в uncovered, но agencyCount ≠ 0`)
  }
  for (const r of fresh.covered.jurisdictions) {
    assert.ok(r.agencyCount > 0, `юрисдикция ${r.country} в covered, но agencyCount не > 0`)
  }
})

test('agencyCount per jurisdiction matches an independent recount straight from agencies.json', () => {
  const servesCountry = (agency, code) =>
    (agency.countriesServed ?? []).some((c) => !c.startsWith('remote-') && c === code)

  for (const r of [...fresh.uncovered.jurisdictions, ...fresh.covered.jurisdictions]) {
    const expected = agencies.filter((a) => servesCountry(a, r.country)).length
    assert.equal(r.agencyCount, expected, `agencyCount для ${r.country} ≠ независимому пересчёту по countriesServed`)
  }
})

// D-154: топ-5 рынков сверены с первоисточниками — DE + FR/NL/IT/ES verified
// (частный сектор EAA подтверждён), PL и IE/AT/BE/SE/DK/FI/NO пока indicative.
test('verified/unverified law counts reconcile; DE + FR/NL/IT/ES verified (D-154)', () => {
  assert.equal(
    fresh.verifiedLawCount + fresh.unverifiedLawCount,
    fresh.totalJurisdictions,
    'verifiedLawCount + unverifiedLawCount ≠ totalJurisdictions',
  )
  const allRows = [...fresh.uncovered.jurisdictions, ...fresh.covered.jurisdictions]
  const verifiedCodes = allRows.filter((r) => r.verified).map((r) => r.country).sort()
  assert.deepEqual(verifiedCodes, ['DE', 'ES', 'FR', 'IT', 'NL'], 'DE + топ-4 рынка (FR/NL/IT/ES) verified после сверки первоисточников (D-154); остальные legal-basis indicative')
})

test('thinnest/deepest coverage figures are consistent with the covered list', () => {
  if (fresh.covered.count === 0) {
    assert.equal(fresh.thinnestCoverage, null)
    assert.equal(fresh.deepestCoverage, null)
    return
  }
  const counts = fresh.covered.jurisdictions.map((r) => r.agencyCount)
  assert.equal(fresh.thinnestCoverage.agencyCount, Math.min(...counts), 'thinnestCoverage.agencyCount ≠ реальному минимуму')
  assert.equal(fresh.deepestCoverage.agencyCount, Math.max(...counts), 'deepestCoverage.agencyCount ≠ реальному максимуму')

  const thinnestExpected = fresh.covered.jurisdictions
    .filter((r) => r.agencyCount === fresh.thinnestCoverage.agencyCount)
    .map((r) => r.country)
    .sort()
  assert.deepEqual([...fresh.thinnestCoverage.jurisdictions].sort(), thinnestExpected, 'thinnestCoverage.jurisdictions не совпадает со списком юрисдикций при минимуме')

  const deepestExpected = fresh.covered.jurisdictions
    .filter((r) => r.agencyCount === fresh.deepestCoverage.agencyCount)
    .map((r) => r.country)
    .sort()
  assert.deepEqual([...fresh.deepestCoverage.jurisdictions].sort(), deepestExpected, 'deepestCoverage.jurisdictions не совпадает со списком юрисдикций при максимуме')
})

// D-035, абсолютный инвариант проекта: ни в данных, ни в этом тесте, ни в
// тексте отчёта не должно быть сумм штрафов. jurisdiction.js уже не содержит
// их в структуре — эта проверка защищает от их появления здесь по неосторожности.
test('no penalty amounts anywhere in the aggregator output (D-035)', () => {
  const text = committed
  // Word-boundary so this does not false-positive on "Finland" (contains
  // "fine") — the manual pre-flight grep in the task instructions is
  // intentionally broader/dumber for a human to eyeball; this automated
  // assertion needs to actually pass on legitimate country names.
  assert.doesNotMatch(text, /€|\bEUR\b|\bfine\b|\bpenalty\b|Bußgeld/i, 'в снапшоте отчёта обнаружена сумма/упоминание штрафа — нарушение D-035')
})
