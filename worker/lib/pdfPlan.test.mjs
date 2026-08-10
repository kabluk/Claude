// A2-PDF-PLAN data assembly — no browser, no D1 (worker/lib/pdfPlan.js is pure).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPlanData, groupFindings, sortByPriority, describeRule, resolveCoverage,
  buildLegalContext, buildScanCoverage, MAX_INSTANCES_SHOWN,
} from './pdfPlan.js'

const f = (over) => ({ ruleId: 'x', impact: 'moderate', selector: 'body', page: 'https://x.test/', wcag: [], ...over })

function scanFixture(over = {}) {
  return {
    id: 's1', url: 'https://example.com', status: 'done',
    pages: ['https://example.com/'], findings: [], score: 90,
    error: null, errorCode: null, createdAt: '2026-08-10T00:00:00Z', completedAt: '2026-08-10T00:01:00Z',
    ...over,
  }
}

// --- ruleId -> WCAG/EN 301 549 mapping -------------------------------------

test('a real axe ruleId from coverage.json resolves to its clause/wcag/title', () => {
  // 'color-contrast' is a real axe-core rule mapped in en301549-coverage.json
  // (clause 9.1.4.3, WCAG 1.4.3) — not a synthetic name invented for this test.
  const row = resolveCoverage('color-contrast')
  assert.ok(row, 'color-contrast must resolve — if this fails, coverage.json changed shape')
  assert.equal(row.wcag, '1.4.3')
  assert.equal(row.clause, '9.1.4.3')
  assert.equal(typeof row.title, 'string')
})

test('an own (a11y-*) ruleId also resolves via its "ours" coverage.json entry', () => {
  const row = resolveCoverage('a11y-reflow-320')
  assert.ok(row)
  assert.equal(row.wcag, '1.4.10')
})

test('an unknown ruleId does NOT invent a criterion — honest null, real axe example', () => {
  // 'landmark-one-main' is a REAL axe-core best-practice rule (no WCAG SC tag —
  // confirmed against the installed axe-core package, not assumed) that has
  // genuinely fired on a live scan per domains/backend.md (example.com). It is
  // the actual production case this fallback exists for, not a made-up id.
  assert.equal(resolveCoverage('landmark-one-main'), null)
  const described = describeRule('landmark-one-main', undefined)
  assert.equal(described.kind, 'unknown')
  assert.equal(described.what, null)
  assert.match(described.caveat, /no automated description/)
})

test('describeRule uses OURS_DESCRIPTIONS prose for our own checks, not the WCAG title alone', () => {
  const described = describeRule('a11y-keyboard-trap', undefined)
  assert.equal(described.kind, 'ours')
  assert.match(described.what, /Tab key/)
  assert.equal(described.wcag, '2.1.2')
})

test('describeRule for a plain axe rule shows the criterion title, honestly labelled as not prose', () => {
  const described = describeRule('color-contrast', undefined)
  assert.equal(described.kind, 'axe')
  assert.equal(described.what, resolveCoverage('color-contrast').title)
  assert.match(described.caveat, /not the specific problem/)
})

test('describeRule for a beyond-standard rule uses the REAL finding text, not invented prose', () => {
  const described = describeRule('a11y-statement-missing', 'no accessibility statement link found on the home page')
  assert.equal(described.kind, 'beyond-standard')
  assert.equal(described.what, 'no accessibility statement link found on the home page')
  assert.equal(described.basis, 'Directive (EU) 2019/882')
})

// --- grouping / dedup / priority order --------------------------------------

test('groupFindings dedups by ruleId keeping the worst impact across instances', () => {
  const groups = groupFindings([
    f({ ruleId: 'r1', impact: 'minor' }),
    f({ ruleId: 'r1', impact: 'critical' }),
    f({ ruleId: 'r1', impact: 'moderate' }),
  ])
  assert.equal(groups.length, 1)
  assert.equal(groups[0].impact, 'critical')
  assert.equal(groups[0].instances.length, 3)
})

test('groupFindings excludes scan-meta-* findings entirely (D-113 invariant)', () => {
  const groups = groupFindings([
    f({ ruleId: 'scan-meta-page-skipped', impact: 'minor' }),
    f({ ruleId: 'scan-meta-cookie-banner-dismissed', impact: 'minor' }),
    f({ ruleId: 'real-rule', impact: 'serious' }),
  ])
  assert.deepEqual(groups.map((g) => g.ruleId), ['real-rule'])
})

test('sortByPriority: severity first, then how many distinct pages are affected', () => {
  const groups = groupFindings([
    f({ ruleId: 'widespread-moderate', impact: 'moderate', page: 'https://x.test/a' }),
    f({ ruleId: 'widespread-moderate', impact: 'moderate', page: 'https://x.test/b' }),
    f({ ruleId: 'widespread-moderate', impact: 'moderate', page: 'https://x.test/c' }),
    f({ ruleId: 'rare-critical', impact: 'critical', page: 'https://x.test/a' }),
    f({ ruleId: 'narrow-moderate', impact: 'moderate', page: 'https://x.test/a' }),
  ])
  const order = sortByPriority(groups).map((g) => g.ruleId)
  // Critical beats moderate regardless of prevalence...
  assert.equal(order[0], 'rare-critical')
  // ...and among equal severity, the rule seen on more pages ranks first.
  assert.equal(order[1], 'widespread-moderate')
  assert.equal(order[2], 'narrow-moderate')
})

// --- legal context -----------------------------------------------------------

const DE_JURISDICTION = {
  country: 'DE', law: 'BFSG', lawFull: 'Barrierefreiheitsstärkungsgesetz',
  statementRequired: true, verified: true, citation: 'Anlage 3 zu §14 BFSG',
}

test('legal block reflects the REAL findings, not an assumption from the law alone: missing', () => {
  const legal = buildLegalContext([f({ ruleId: 'a11y-statement-missing', impact: 'critical' })], DE_JURISDICTION)
  assert.equal(legal.known, true)
  assert.equal(legal.country, 'DE')
  assert.equal(legal.statementStatus, 'missing')
})

test('legal block: no statement-missing/incomplete finding present -> present', () => {
  const legal = buildLegalContext([f({ ruleId: 'color-contrast', impact: 'serious' })], DE_JURISDICTION)
  assert.equal(legal.statementStatus, 'present')
})

test('legal block: unknown jurisdiction is left honestly blank, not guessed', () => {
  const legal = buildLegalContext([], { country: 'unknown', law: null, statementRequired: null, verified: false })
  assert.equal(legal.known, false)
})

test('legal block NEVER carries a fine amount, in any field, for any jurisdiction shape (D-035)', () => {
  const jurisdictions = [
    DE_JURISDICTION,
    { country: 'FR', law: 'RGAA', lawFull: "Référentiel général d'amélioration de l'accessibilité", statementRequired: true, verified: false },
  ]
  const moneyRe = /(?:€|EUR)\s?\d/i
  for (const j of jurisdictions) {
    const legal = buildLegalContext([f({ ruleId: 'a11y-statement-missing', impact: 'critical' })], j)
    const flat = JSON.stringify(legal)
    assert.doesNotMatch(flat, moneyRe, `fine amount leaked into legal block for ${j.country}`)
  }
})

// --- scan coverage honesty ---------------------------------------------------

test('a skipped page is reported honestly, with the real reason from the finding', () => {
  const scan = scanFixture({
    findings: [f({ ruleId: 'scan-meta-page-skipped', page: 'https://example.com/kontakt', html: 'page skipped, scan continued without it: nav timeout' })],
  })
  const coverage = buildScanCoverage(scan)
  assert.equal(coverage.skipped.length, 1)
  assert.equal(coverage.skipped[0].page, 'https://example.com/kontakt')
  assert.match(coverage.skipped[0].reason, /nav timeout/)
})

test('no skipped pages -> empty list, not a fabricated "all good" claim beyond the fact', () => {
  const coverage = buildScanCoverage(scanFixture())
  assert.deepEqual(coverage.skipped, [])
})

// --- full buildPlanData integration -----------------------------------------

test('buildPlanData: dev brief excludes scan-meta-*, caps instances honestly, keeps priorities/devBrief order aligned', () => {
  const findings = [
    ...Array.from({ length: MAX_INSTANCES_SHOWN + 3 }, (_, i) => f({ ruleId: 'image-alt', impact: 'critical', page: `https://example.com/p${i}` })),
    f({ ruleId: 'scan-meta-page-skipped', page: 'https://example.com/skipped', html: 'boom' }),
  ]
  const scan = scanFixture({ findings })
  const plan = buildPlanData(scan, DE_JURISDICTION)

  assert.deepEqual(plan.priorities.map((p) => p.ruleId), ['image-alt'])
  assert.equal(plan.devBrief.length, 1)
  assert.equal(plan.devBrief[0].instances.length, MAX_INSTANCES_SHOWN)
  assert.equal(plan.devBrief[0].moreInstances, 3)
  assert.equal(plan.coverage.skipped.length, 1)
  assert.equal(plan.legal.country, 'DE')
  assert.ok(plan.effort) // image-alt is engineering work, not in NON_ENGINEERING_RULES
})

test('buildPlanData: no findings at all -> effort is null, not a fabricated figure', () => {
  const scan = scanFixture({ findings: [] })
  const plan = buildPlanData(scan, DE_JURISDICTION)
  assert.equal(plan.effort, null)
})

// This mirrors src/lib/costEstimate.ts::estimateCost exactly (see
// worker/lib/costEstimate.js sync gate): findings.length > 0 is enough to get a
// (lowest) band even when every finding is non-engineering — that is the REAL
// existing product behaviour on /report/:id today, not a new quirk introduced
// by the PDF. Asserted here so the mirror can't silently "fix" it and drift
// from the free report.
test('buildPlanData: only non-engineering findings still yields the lowest band, matching the free report', () => {
  const scan = scanFixture({ findings: [f({ ruleId: 'a11y-statement-missing', impact: 'critical' })] })
  const plan = buildPlanData(scan, DE_JURISDICTION)
  assert.equal(plan.effort.band, 'budget')
})
