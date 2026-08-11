// A2-PDF-PLAN data assembly — no browser, no D1 (worker/lib/pdfPlan.js is pure).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPlanData, groupFindings, sortByPriority, describeRule, resolveCoverage,
  buildLegalContext, buildScanCoverage, MAX_INSTANCES_SHOWN,
  buildCheckYourself, understandingUrl,
} from './pdfPlan.js'
import coverageJson from '../../data/a11y/en301549-coverage.json' with { type: 'json' }

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

// --- D-131: axe-core's own fix guidance (help/helpUrl/failureSummary) --------
//
// The strings below are REAL axe-core 4.x output, copied from a live run
// against en.zebrakita.de (the same site as D-129) — not plausible-looking
// prose written for a test. If axe ever stops emitting them, describeRule's
// no-help branch (asserted below) is what production falls back to.
const REAL_IMAGE_ALT_HELP = 'Images must have alternative text'
const REAL_IMAGE_ALT_HELP_URL = 'https://dequeuniversity.com/rules/axe/4.13/image-alt?application=axeAPI'
const REAL_REGION_HELP = 'All page content should be contained by landmarks'

test('D-131: describeRule prefers axe-core help over the bare WCAG title, and keeps the criterion', () => {
  const described = describeRule('image-alt', undefined, {
    help: REAL_IMAGE_ALT_HELP,
    helpUrl: REAL_IMAGE_ALT_HELP_URL,
  })
  assert.equal(described.kind, 'axe')
  assert.equal(described.what, REAL_IMAGE_ALT_HELP)
  assert.equal(described.helpUrl, REAL_IMAGE_ALT_HELP_URL)
  // The WCAG criterion is CONTEXT, not fix guidance — it must survive, not be
  // replaced (owner's requirement: add real guidance alongside, don't remove).
  assert.equal(described.wcag, resolveCoverage('image-alt').wcag)
  assert.equal(described.wcagTitle, resolveCoverage('image-alt').title)
  assert.equal(described.clause, resolveCoverage('image-alt').clause)
  assert.match(described.link, /verscala\.com\/wcag\//)
  // The old caveat ("this names the WCAG criterion, not the problem") is a lie
  // once `what` is real guidance — it must be gone, not kept for safety.
  assert.equal(described.caveat, null)
})

test('D-131: without help, describeRule degrades to EXACTLY the pre-D-131 output (no fabrication)', () => {
  const before = describeRule('color-contrast', undefined)
  const withEmptyHelp = describeRule('color-contrast', undefined, { help: null, helpUrl: null })
  for (const described of [before, withEmptyHelp]) {
    assert.equal(described.kind, 'axe')
    assert.equal(described.what, resolveCoverage('color-contrast').title)
    assert.match(described.caveat, /not the specific problem/)
    // No Deque URL is ever constructed from the ruleId when axe didn't give one.
    assert.ok(!described.helpUrl, 'helpUrl must stay absent, never guessed from the ruleId')
  }
})

test('D-131: a ruleId with no coverage row still gets axe help, honestly labelled best-practice', () => {
  // 'region' is a real axe rule with no WCAG SC tag (asserted above via
  // landmark-one-main); before D-131 it had no description at all.
  assert.equal(resolveCoverage('region'), null)
  const described = describeRule('region', undefined, { help: REAL_REGION_HELP, helpUrl: null })
  assert.equal(described.kind, 'axe')
  assert.equal(described.what, REAL_REGION_HELP)
  assert.equal(described.wcag, null)
  assert.match(described.caveat, /best-practice/)
})

test('D-131: our own a11y-* checks keep their own prose — axe help never overrides it', () => {
  const described = describeRule('a11y-keyboard-trap', undefined, { help: 'axe would never say this', helpUrl: 'https://x.test/' })
  assert.equal(described.kind, 'ours')
  assert.match(described.what, /Tab key/)
})

test('D-131: buildPlanData carries help/helpUrl per group and failureSummary per instance', () => {
  const scan = scanFixture({
    findings: [
      f({
        ruleId: 'image-alt', impact: 'critical', page: 'https://example.com/a', selector: 'img:nth-child(1)',
        help: REAL_IMAGE_ALT_HELP, helpUrl: REAL_IMAGE_ALT_HELP_URL,
        failureSummary: 'Fix any of the following:\n  Element does not have an alt attribute',
      }),
      f({
        ruleId: 'image-alt', impact: 'critical', page: 'https://example.com/b', selector: 'img:nth-child(2)',
        help: REAL_IMAGE_ALT_HELP, helpUrl: REAL_IMAGE_ALT_HELP_URL,
        failureSummary: 'Fix any of the following:\n  Element has no title attribute',
      }),
    ],
  })
  const plan = buildPlanData(scan, DE_JURISDICTION)
  assert.equal(plan.devBrief[0].what, REAL_IMAGE_ALT_HELP)
  assert.equal(plan.devBrief[0].helpUrl, REAL_IMAGE_ALT_HELP_URL)
  assert.equal(plan.priorities[0].what, REAL_IMAGE_ALT_HELP)
  // Per-INSTANCE, not per-rule: the two rows must keep their own summaries.
  assert.deepEqual(
    plan.devBrief[0].instances.map((i) => i.failureSummary),
    [
      'Fix any of the following:\n  Element does not have an alt attribute',
      'Fix any of the following:\n  Element has no title attribute',
    ],
  )
})

test('D-131: help on a LATER instance is still found (group help is not blindly instances[0])', () => {
  const scan = scanFixture({
    findings: [
      f({ ruleId: 'image-alt', impact: 'critical', page: 'https://example.com/a' }), // pre-D-131 shape
      f({ ruleId: 'image-alt', impact: 'critical', page: 'https://example.com/b', help: REAL_IMAGE_ALT_HELP, helpUrl: REAL_IMAGE_ALT_HELP_URL }),
    ],
  })
  const plan = buildPlanData(scan, DE_JURISDICTION)
  assert.equal(plan.devBrief[0].what, REAL_IMAGE_ALT_HELP)
})

test('D-131: an old scan (no help anywhere) produces a plan with null summaries and no helpUrl', () => {
  const scan = scanFixture({ findings: [f({ ruleId: 'image-alt', impact: 'critical' })] })
  const plan = buildPlanData(scan, DE_JURISDICTION)
  assert.equal(plan.devBrief[0].instances[0].failureSummary, null)
  assert.ok(!plan.devBrief[0].helpUrl)
  assert.equal(plan.devBrief[0].what, resolveCoverage('image-alt').title)
})

// --- D-131: "Check these yourself" data --------------------------------------

test('D-131: buildCheckYourself is exactly coverage.json status==="none", verbatim', () => {
  const rows = buildCheckYourself()
  const expected = coverageJson.rows.filter((r) => r.status === 'none')
  assert.equal(rows.length, expected.length)
  assert.ok(rows.length > 0, 'coverage.json must still have uncovered criteria')
  assert.deepEqual(rows.map((r) => r.wcag), expected.map((r) => r.wcag))
  // Titles are copied, never rephrased for the paid document.
  assert.deepEqual(rows.map((r) => r.title), expected.map((r) => r.title))
  assert.deepEqual(rows.map((r) => r.clause), expected.map((r) => r.clause))
})

test('D-131: every uncovered criterion carries a REAL W3C Understanding URL', () => {
  // The slugs were read out of W3C's own index and each URL fetched live
  // (HTTP 200, title matched the criterion) on 2026-08-11 — see
  // pdfPlan.js::UNDERSTANDING_SLUG. This test guards the shape and the
  // completeness, and is the canary if coverage.json gains a new 'none' row.
  for (const row of buildCheckYourself()) {
    assert.ok(row.understandingUrl, `no verified W3C URL for ${row.wcag} — add it or leave the row link-less on purpose`)
    assert.match(row.understandingUrl, /^https:\/\/www\.w3\.org\/WAI\/WCAG22\/Understanding\/[a-z0-9-]+\.html$/)
  }
})

test('D-131: slugs are NOT mechanically derived from titles (the trap this guards)', () => {
  // Two real W3C exceptions: "pre-recorded" in our title vs "prerecorded" in
  // W3C's slug, and 3.3.4's parenthesised list dropped entirely. A
  // lowercase-and-hyphenate helper would produce dead links for both.
  assert.equal(
    understandingUrl('1.2.3'),
    'https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html',
  )
  assert.equal(
    understandingUrl('3.3.4'),
    'https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html',
  )
})

test('D-131: an unknown criterion gets NO link rather than a constructed one', () => {
  assert.equal(understandingUrl('9.9.9'), null)
})

test('D-131: buildPlanData exposes checkYourself even for a scan with zero findings', () => {
  const plan = buildPlanData(scanFixture({ findings: [] }), DE_JURISDICTION)
  assert.equal(plan.checkYourself.length, buildCheckYourself().length)
})
