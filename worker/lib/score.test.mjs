import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scoreFromFindings } from './score.js'

test('no findings -> perfect score', () => {
  assert.equal(scoreFromFindings([]), 100)
})

test('40 instances of the same rule count once (dedup by ruleId)', () => {
  const findings = Array.from({ length: 40 }, () => ({ ruleId: 'image-alt', impact: 'serious' }))
  assert.equal(scoreFromFindings(findings), 93) // 100 - 7
})

test('worst severity wins when a rule has mixed-impact instances', () => {
  const findings = [
    { ruleId: 'color-contrast', impact: 'minor' },
    { ruleId: 'color-contrast', impact: 'critical' },
  ]
  assert.equal(scoreFromFindings(findings), 88) // 100 - 12, not 100 - 1
})

test('nine distinct critical rules floor the score at 0, not negative', () => {
  const findings = Array.from({ length: 9 }, (_, i) => ({ ruleId: `rule-${i}`, impact: 'critical' }))
  assert.equal(scoreFromFindings(findings), 0) // 9 * 12 = 108, clamped
})

test('unknown impact string defaults to weight 1 rather than throwing', () => {
  assert.equal(scoreFromFindings([{ ruleId: 'x', impact: 'unknown' }]), 99)
})
