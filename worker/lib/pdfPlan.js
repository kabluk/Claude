// A2-PDF-PLAN: pure data assembly for the paid PDF remediation plan
// (GET /api/scan/:id/pdf, see worker/routes/scanPdf.js for the browser part).
// No browser, no D1, no network — a function of (scan row, resolved
// jurisdiction) plus the two static data sources below. Testable without
// Browser Rendering (worker/lib/pdfPlan.test.mjs).
//
// HARD RULE (per task spec, D-035/D-006): every line must trace to a source.
//   - findings/selectors/html/pages/score            -> the scan row itself
//   - ruleId -> WCAG SC -> EN 301 549 clause -> title -> data/a11y/en301549-coverage.json
//   - prose for OUR OWN (a11y-*) checks               -> worker/lib/oursDescriptions.js
//     (mirror of src/lib/wcag.ts::OURS_DESCRIPTIONS, gated — see that file)
//   - legal context                                   -> the jurisdiction object
//     the caller resolved via worker/lib/jurisdiction.js (not reproduced here)
//   - fix guidance for plain axe-core rules            -> the finding's own
//     help/helpUrl/failureSummary, captured verbatim from axe-core's result
//     object at scan time (worker/lib/axe.js, D-131) — Deque's text, not ours
// Before D-131 we had NO prose for plain axe-core rules — only the WCAG SC
// title — and scans made before it still don't: those degrade to that older
// behaviour, never to a guessed sentence or a constructed Deque URL. A ruleId
// with neither an OURS_DESCRIPTIONS entry, nor a coverage.json row, nor axe
// help (real example: 'landmark-one-main', 'region' — axe best-practice rules
// with no WCAG SC tag at all) degrades honestly: no invented title, just the
// ruleId.

import coverageJson from '../../data/a11y/en301549-coverage.json' with { type: 'json' }
import { OURS_DESCRIPTIONS } from './oursDescriptions.js'
import { isMetaFinding } from './score.js'
import { estimateCost, formatCostEstimate } from './costEstimate.js'

// Same public origin as USER_AGENT in worker/lib/axe.js — the "our reference"
// link target for WCAG criteria (src/lib/wcag.ts::wcagSlug generates the same
// slug shape for /wcag/[criterion]).
export const BASE_URL = 'https://verscala.com'

export function wcagSlug(wcag) {
  return wcag.replace(/\./g, '-')
}

function buildCoverageIndex(rows) {
  const index = new Map()
  for (const row of rows) {
    for (const ruleId of row.axeRules) index.set(ruleId, row)
    if (row.ours) index.set(row.ours, row)
  }
  return index
}
const COVERAGE_INDEX = buildCoverageIndex(coverageJson.rows)

// Real ruleId -> coverage.json row, or null if the mapping is unknown to us.
// Never invents a WCAG criterion for a ruleId we don't recognise.
export function resolveCoverage(ruleId) {
  return COVERAGE_INDEX.get(ruleId) ?? null
}

// Mirror of src/lib/coverage.ts::beyondStandard, keyed by the ruleId each entry
// actually corresponds to (the .ts array is positional prose for a page, not
// keyed — this is the same 4 facts, restated so code can look them up). These
// four checks are OUTSIDE EN 301 549 ch.9 numbering (statement/feedback/PDF are
// obligations from the directive itself, not a technical WCAG criterion), so
// they never appear in coverage.json's clause column — 'basis' replaces it.
const BEYOND_STANDARD_INFO = {
  'a11y-statement-missing': { label: 'Accessibility statement present and findable', basis: 'Directive (EU) 2019/882' },
  'a11y-statement-incomplete': { label: 'Statement actually covers what it must', basis: 'Directive (EU) 2019/882' },
  'a11y-feedback-missing': { label: 'An accessible way to report problems', basis: 'Directive (EU) 2019/882' },
  'a11y-pdf-present': { label: 'Linked PDF documents flagged', basis: 'EN 301 549 ch. 10' },
}

const SEVERITY_RANK = { minor: 0, moderate: 1, serious: 2, critical: 3 }

// Dedup by ruleId, worst impact wins — same principle as worker/lib/score.js
// (imported isMetaFinding straight from there, not reimplemented) and
// src/lib/wcag.ts::groupFindingsByRule, reimplemented here in plain JS for the
// same reason as costEstimate.js (worker can't import scanner.ts).
export function groupFindings(findings) {
  const map = new Map()
  for (const f of findings) {
    if (isMetaFinding(f)) continue
    const g = map.get(f.ruleId)
    if (!g) {
      map.set(f.ruleId, { ruleId: f.ruleId, impact: f.impact, instances: [f] })
    } else {
      g.instances.push(f)
      if (SEVERITY_RANK[f.impact] > SEVERITY_RANK[g.impact]) g.impact = f.impact
    }
  }
  return [...map.values()]
}

function distinctPageCount(group) {
  return new Set(group.instances.map((i) => i.page)).size
}

// Priorities order (per spec): real severity first, then prevalence — how many
// distinct pages carry the rule, then raw instance count as the final
// tie-breaker, then ruleId for a stable, reproducible order.
export function sortByPriority(groups) {
  return [...groups].sort(
    (a, b) =>
      SEVERITY_RANK[b.impact] - SEVERITY_RANK[a.impact] ||
      distinctPageCount(b) - distinctPageCount(a) ||
      b.instances.length - a.instances.length ||
      a.ruleId.localeCompare(b.ruleId),
  )
}

// What to fix, for one ruleId. `firstInstanceHtml` is used only for the 4
// beyond-standard checks, whose `html` field is already a real descriptive
// sentence written by worker/lib/axe.js at scan time (e.g. "no accessibility
// statement link found on the home page") — not prose we invent here.
//
// `axeHelp` (D-131) is axe-core's OWN rule-level fix guidance, captured at scan
// time (worker/lib/axe.js) from the same results object the findings come from:
// { help, helpUrl }. Rule-level means identical for every instance of one
// ruleId, so the caller may take it from any instance of the group. It is
// present only on axe-core findings and only on scans made after D-131 — when
// it is absent this function degrades to exactly its pre-D-131 output, never to
// a guess (no constructed Deque URL from a ruleId, no invented sentence).
export function describeRule(ruleId, firstInstanceHtml, axeHelp = null) {
  const coverage = resolveCoverage(ruleId)
  const ours = OURS_DESCRIPTIONS[ruleId]
  const beyond = BEYOND_STANDARD_INFO[ruleId]

  if (ours) {
    return {
      kind: 'ours',
      what: ours.does,
      caveat: ours.caveat ?? null,
      wcag: coverage?.wcag ?? null,
      wcagTitle: coverage?.title ?? null,
      clause: coverage?.clause ?? null,
      link: coverage ? `${BASE_URL}/wcag/${wcagSlug(coverage.wcag)}` : null,
    }
  }
  if (beyond) {
    return {
      kind: 'beyond-standard',
      what: firstInstanceHtml || beyond.label,
      caveat: null,
      wcag: null,
      wcagTitle: beyond.label,
      clause: null,
      basis: beyond.basis,
      link: null,
    }
  }
  const help = axeHelp?.help || null
  const helpUrl = axeHelp?.helpUrl || null

  if (coverage) {
    // D-131: with axe-core's own `help` we finally have a real "what to fix"
    // line for a plain axe rule, so it becomes `what`, and the WCAG criterion
    // name moves to the context it always was (it stays in wcagTitle/link,
    // rendered on its own line — it is not removed, just no longer pretending
    // to be fix guidance). Without it: exactly the pre-D-131 output, including
    // the caveat that admits `what` is only the criterion name.
    return {
      kind: 'axe',
      what: help ?? coverage.title,
      caveat: help
        ? null
        : 'this names the WCAG criterion, not the specific problem on the page — see the html/selector below for that',
      wcag: coverage.wcag,
      wcagTitle: coverage.title,
      clause: coverage.clause,
      link: `${BASE_URL}/wcag/${wcagSlug(coverage.wcag)}`,
      helpUrl,
    }
  }
  // No coverage row (real case: axe best-practice rules with no WCAG SC tag —
  // 'region', 'landmark-one-main'). Pre-D-131 this was a dead end; axe's own
  // help still describes the fix, so it is used when it is really there.
  if (help) {
    return {
      kind: 'axe',
      what: help,
      caveat: 'axe-core flags this rule outside the WCAG criteria we map — it is a best-practice check, not a conformance failure',
      wcag: null,
      wcagTitle: null,
      clause: null,
      link: null,
      helpUrl,
    }
  }
  return {
    kind: 'unknown',
    what: null,
    caveat: 'no automated description available for this check',
    wcag: null,
    wcagTitle: null,
    clause: null,
    link: null,
  }
}

// D-131: the ~19 WCAG criteria in coverage.json that NOTHING automated checks
// (status 'none' — neither an axe-core rule nor one of our own). One-line
// mirror of src/lib/coverage.ts::uncoveredRows(), restated here because the
// worker is plain ESM and cannot import the .ts (same reason as costEstimate /
// oursDescriptions above, D-010).
export const uncoveredRows = () => coverageJson.rows.filter((r) => r.status === 'none')

// W3C's own "Understanding SC" page slug per criterion. NOT derivable from the
// title: W3C writes "prerecorded" where our coverage.json title says
// "pre-recorded", and drops the parenthesised list in 3.3.4 entirely — a
// mechanical lowercase-and-hyphenate would produce dead links in a document
// people pay for. Every slug below was read out of W3C's own index HTML
// (https://www.w3.org/WAI/WCAG22/Understanding/, the <a href> next to the
// matching <span class="secno">) and then each final URL was fetched live
// (HTTP 200, page <title> = "Understanding Success Criterion <n>: <title>",
// 2026-08-11) — same live-fact-check discipline as the legal citations,
// D-057/D-058. A criterion missing from this map gets NO link, never a
// constructed one.
const UNDERSTANDING_SLUG = {
  '1.2.3': 'audio-description-or-media-alternative-prerecorded',
  '1.2.4': 'captions-live',
  '1.2.5': 'audio-description-prerecorded',
  '1.3.2': 'meaningful-sequence',
  '1.3.3': 'sensory-characteristics',
  '1.4.5': 'images-of-text',
  '1.4.11': 'non-text-contrast',
  '1.4.13': 'content-on-hover-or-focus',
  '2.1.4': 'character-key-shortcuts',
  '2.3.1': 'three-flashes-or-below-threshold',
  '2.5.1': 'pointer-gestures',
  '2.5.2': 'pointer-cancellation',
  '2.5.4': 'motion-actuation',
  '3.2.1': 'on-focus',
  '3.2.2': 'on-input',
  '3.3.1': 'error-identification',
  '3.3.3': 'error-suggestion',
  '3.3.4': 'error-prevention-legal-financial-data',
  '4.1.3': 'status-messages',
}

export function understandingUrl(wcag) {
  const slug = UNDERSTANDING_SLUG[wcag]
  return slug ? `https://www.w3.org/WAI/WCAG22/Understanding/${slug}.html` : null
}

// Same content as /report/:id's "Check these yourself" (D-130) — the paid plan
// repeats it because a printable document is what someone actually works
// through, and the free page is not. wcag/title/clause are taken verbatim from
// coverage.json; nothing is rephrased or invented per criterion.
export function buildCheckYourself() {
  return uncoveredRows().map((r) => ({
    wcag: r.wcag,
    title: r.title,
    clause: r.clause,
    understandingUrl: understandingUrl(r.wcag),
  }))
}

// Legal context (block 2). `jurisdiction` is whatever
// worker/lib/jurisdiction.js::resolveJurisdiction() returned for this scan's
// URL — this module does not recompute it, only reads it. statementStatus is
// derived from REAL findings (was a11y-statement-missing/incomplete actually
// present in this scan?), never assumed from the law alone.
export function buildLegalContext(findings, jurisdiction) {
  if (!jurisdiction || jurisdiction.country === 'unknown' || !jurisdiction.law) {
    return { known: false }
  }
  const missing = findings.find((f) => f.ruleId === 'a11y-statement-missing')
  const incomplete = findings.find((f) => f.ruleId === 'a11y-statement-incomplete')
  let statementStatus = 'present'
  if (!jurisdiction.statementRequired) statementStatus = 'not-required'
  else if (missing) statementStatus = 'missing'
  else if (incomplete) statementStatus = 'incomplete'

  return {
    known: true,
    country: jurisdiction.country,
    law: jurisdiction.law,
    lawFull: jurisdiction.lawFull ?? null,
    citation: jurisdiction.citation ?? null,
    verified: !!jurisdiction.verified,
    statementRequired: !!jurisdiction.statementRequired,
    statementStatus,
    incompleteDetail: incomplete?.html ?? null,
  }
}

// Block: scan coverage honesty (SCAN-RESILIENCE / D-113). A page can be
// skipped without failing the whole scan — the buyer of a €19.99 plan must be
// told which pages were NOT checked, not just shown a clean-looking report.
export function buildScanCoverage(scan) {
  const skipped = scan.findings
    .filter((f) => f.ruleId === 'scan-meta-page-skipped')
    .map((f) => ({ page: f.page, reason: f.html ?? 'unknown reason' }))
  return { pagesScanned: scan.pages, skipped }
}

// How many individual instances of one rule get a "where" line in the dev
// brief before we truncate with an honest "+N more" count. Not a data
// invariant — a readability choice for a printable document: a rule with 200
// instances of the same fix does not need 200 rows to be actionable, and the
// prevalence (page/instance count) is already shown in Priorities.
export const MAX_INSTANCES_SHOWN = 8

// Single entry point: (scan row from D1, resolved jurisdiction) -> plan data.
// No I/O, no Date.now() dependence beyond stamping when the document was built.
// D-131: help/helpUrl are rule-level in axe-core — identical on every node of
// one violation — so any instance of the group carries the same pair. Taken
// from the FIRST instance that actually has one (not blindly instances[0]):
// findings for one ruleId can be merged across pages, and a scan made partly
// before D-131 could have a help-less instance first.
function groupAxeHelp(group) {
  const withHelp = group.instances.find((i) => i.help || i.helpUrl)
  if (!withHelp) return null
  return { help: withHelp.help ?? null, helpUrl: withHelp.helpUrl ?? null }
}

export function buildPlanData(scan, jurisdiction) {
  const groups = groupFindings(scan.findings)
  const ordered = sortByPriority(groups)

  const priorities = ordered.map((g) => ({
    ruleId: g.ruleId,
    impact: g.impact,
    instanceCount: g.instances.length,
    pageCount: distinctPageCount(g),
    ...describeRule(g.ruleId, g.instances[0]?.html, groupAxeHelp(g)),
  }))

  const devBrief = ordered.map((g) => ({
    ruleId: g.ruleId,
    impact: g.impact,
    ...describeRule(g.ruleId, g.instances[0]?.html, groupAxeHelp(g)),
    instances: g.instances.slice(0, MAX_INSTANCES_SHOWN).map((i) => ({
      page: i.page,
      selector: i.selector,
      html: i.html ?? null,
      // Per-instance, unlike help/helpUrl: two elements failing the same rule
      // get different "Fix any of the following" bullets from axe-core.
      failureSummary: i.failureSummary ?? null,
    })),
    moreInstances: Math.max(0, g.instances.length - MAX_INSTANCES_SHOWN),
  }))

  const cost = estimateCost(scan.findings)

  return {
    url: scan.url,
    scanId: scan.id,
    score: scan.score,
    generatedAt: new Date().toISOString(),
    scanCompletedAt: scan.completedAt,
    coverage: buildScanCoverage(scan),
    legal: buildLegalContext(scan.findings, jurisdiction),
    priorities,
    devBrief,
    checkYourself: buildCheckYourself(),
    effort: cost ? { band: cost.band, formatted: formatCostEstimate(cost) } : null,
  }
}
