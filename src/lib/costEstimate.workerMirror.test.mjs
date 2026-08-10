// Gate: worker/lib/costEstimate.js is a hand-duplicated mirror of THIS file
// (worker/ is plain ESM and cannot reliably load costEstimate.ts under
// `node --test` — see worker/lib/costEstimate.js header for the full reason).
// The free report on /report/:id (this file) and the paid PDF plan
// (worker/lib/costEstimate.js) must show the exact same remediation estimate
// for the exact same finding set — a silent drift here is charging two
// different prices for identical work to the same customer.
//
// Same technique as src/lib/jurisdictions.test.mjs (D-032): this file is the
// only side able to import both a real .ts module (via tsx) and a plain
// worker .js module (plain ESM import, no transform needed) in the same
// process — so the sync gate has to live here regardless of which side is the
// "source of truth" for this particular pair.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimateCost as tsEstimateCost, effortScore as tsEffortScore } from './costEstimate.ts'
import { estimateCost as workerEstimateCost, effortScore as workerEffortScore } from '../../worker/lib/costEstimate.js'

const f = (ruleId, impact, page = 'https://x.test/') => ({ ruleId, impact, wcag: [], selector: 'body', page })

// score = distinctRuleCount + severeRuleCount * 2 (both formulas, by
// construction) — so N distinct moderate-impact rules score exactly N. Used
// below to land EXACTLY on the pickBand thresholds (4/12/24, D-046): a
// fixture list that never lands on a boundary would let the two
// implementations disagree right at the threshold and still pass every test.
const distinctModerateFindings = (n) =>
  Array.from({ length: n }, (_, i) => f(`boundary-rule-${i}`, 'moderate'))

// Realistic-shaped combinations, not exhaustive fuzzing — enough to exercise
// every branch of both formulas (empty, single rule, dedup by ruleId, mixed
// severities, non-engineering-only, meta-only, large instance counts, and the
// exact pickBand boundaries below).
const FIXTURES = [
  distinctModerateFindings(4), // exactly on the budget/mid boundary
  distinctModerateFindings(12), // exactly on the mid/premium boundary
  distinctModerateFindings(24), // exactly on the premium/enterprise boundary
  // ...and one step PAST each boundary. Sitting only ON the threshold guards
  // half the drift: shifting `score <= 12` DOWN to 11 moves the score-12
  // fixture and reddens, but shifting it UP to 13 moves nothing a fixture
  // covers — score 12 stays 'mid' either way, and only score 13 changes band.
  // Found by a parent-session canary that shifted exactly that threshold and
  // kept every test green.
  distinctModerateFindings(5), // first score past budget/mid
  distinctModerateFindings(13), // first score past mid/premium
  distinctModerateFindings(25), // first score past premium/enterprise
  [],
  [f('color-contrast', 'serious')],
  [f('image-alt', 'critical'), f('image-alt', 'critical'), f('image-alt', 'minor')], // dedup: worst wins
  [
    f('color-contrast', 'serious'), f('image-alt', 'critical'), f('link-name', 'moderate'),
    f('region', 'moderate'), f('landmark-one-main', 'moderate'), f('html-has-lang', 'moderate'),
  ],
  [f('a11y-statement-missing', 'critical'), f('a11y-feedback-missing', 'serious'), f('a11y-pdf-present', 'moderate')],
  [f('scan-meta-page-skipped', 'minor'), f('scan-meta-cookie-banner-dismissed', 'minor')],
  [
    ...Array.from({ length: 12 }, (_, i) => f('image-alt', 'critical', `https://x.test/p${i}`)),
    f('a11y-statement-missing', 'critical'),
    f('color-contrast', 'serious'),
  ],
]

test('worker/lib/costEstimate.js::effortScore matches src/lib/costEstimate.ts::effortScore on every fixture', () => {
  for (const findings of FIXTURES) {
    assert.equal(
      workerEffortScore(findings), tsEffortScore(findings),
      `effortScore diverged for: ${JSON.stringify(findings.map((f) => [f.ruleId, f.impact]))}`,
    )
  }
})

test('worker/lib/costEstimate.js::estimateCost matches src/lib/costEstimate.ts::estimateCost on every fixture', () => {
  for (const findings of FIXTURES) {
    assert.deepEqual(
      workerEstimateCost(findings), tsEstimateCost(findings),
      `estimateCost diverged for: ${JSON.stringify(findings.map((f) => [f.ruleId, f.impact]))}`,
    )
  }
})

// Canary: prove the gate can actually fail, not just pass by construction.
test('canary: the two formulas WOULD be caught diverging (sanity on the comparison itself)', () => {
  const fakeWorkerResult = { band: 'enterprise', lowerAmount: 30000, upperAmount: null }
  const realResult = tsEstimateCost([f('color-contrast', 'minor')])
  assert.notDeepEqual(fakeWorkerResult, realResult, 'canary fixture must actually differ from the real result')
})
