// Worker mirror of src/lib/costEstimate.ts — basic self-consistency here;
// the actual mirror-drift gate lives in src/lib/costEstimate.workerMirror.test.mjs
// (only that side can import both the real .ts and this plain-JS file).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { effortScore, estimateCost, formatCostEstimate } from './costEstimate.js'

const f = (ruleId, impact) => ({ ruleId, impact, wcag: [], selector: 'x', page: 'p' })

test('estimateCost returns null for an empty finding set — nothing to estimate', () => {
  assert.equal(estimateCost([]), null)
})

test('effortScore counts distinct rules, double-weighting serious/critical, ignores meta/non-engineering', () => {
  const findings = [
    f('color-contrast', 'serious'),
    f('color-contrast', 'serious'), // same rule, second instance — must not double count
    f('image-alt', 'critical'),
    f('a11y-statement-missing', 'critical'), // non-engineering — excluded
    f('scan-meta-page-skipped', 'minor'), // meta — excluded
  ]
  // 2 distinct engineering rules (color-contrast, image-alt), both severe -> 2 + 2*2 = 6
  assert.equal(effortScore(findings), 6)
})

test('formatCostEstimate: budget lower bound reads "Under €Xk", enterprise upper bound reads "€X+"', () => {
  assert.equal(formatCostEstimate({ band: 'budget', lowerAmount: 0, upperAmount: 3000 }), 'Under €3k')
  assert.equal(formatCostEstimate({ band: 'enterprise', lowerAmount: 30000, upperAmount: null }), '€30k+')
  assert.equal(formatCostEstimate({ band: 'mid', lowerAmount: 3000, upperAmount: 10000 }), '€3k–10k')
})
