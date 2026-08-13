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

// SCAN-RESILIENCE (2026-08-10). scan-meta-* — прозрачность качества скана
// («баннер снят перед проверкой», «страница пропущена»), а не дефект сайта.
// До этого фикса каждая такая пометка молча стоила сайту 1 балл: получалось,
// что мы штрафуем сайт за отказ НАШЕГО сканера и что честно признаться дороже,
// чем промолчать. Тот же принцип уже действует в смете (src/lib/costEstimate.ts).
test('scan-meta-* findings do not affect the score', () => {
  const real = [{ ruleId: 'image-alt', impact: 'serious' }]
  const meta = [
    { ruleId: 'scan-meta-cookie-banner-dismissed', impact: 'minor' },
    { ruleId: 'scan-meta-page-skipped', impact: 'minor' },
  ]
  assert.equal(scoreFromFindings(meta), 100)
  assert.equal(scoreFromFindings([...real, ...meta]), scoreFromFindings(real))
  assert.equal(scoreFromFindings([...real, ...meta]), 93)
})

// D-165: an unknown impact recorded first for a ruleId must not block a later 'critical'
// from taking over as the worst severity (guards the `> undefined` === false hole).
test('D-165: a later critical overrides an unknown impact seen first for the same rule', () => {
  const findings = [
    { ruleId: 'x', impact: 'weird' },     // unknown weight, seen first
    { ruleId: 'x', impact: 'critical' },  // must win → penalty 12 → score 88
  ]
  assert.equal(scoreFromFindings(findings), 100 - 12)
})
