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
// We do NOT have prose for plain axe-core rules — only the WCAG SC title. A
// ruleId with neither an OURS_DESCRIPTIONS entry nor a coverage.json row (real
// example: 'landmark-one-main', 'region' — axe best-practice rules with no WCAG
// SC tag at all) degrades honestly: no invented title, just the ruleId.

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
export function describeRule(ruleId, firstInstanceHtml) {
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
  if (coverage) {
    // Honest naming: this is the WCAG criterion NAME, not a prose explanation
    // of the specific issue — we don't have prose for plain axe-core rules
    // (see file header). Calling it "what to fix" in the UI, not "explanation".
    return {
      kind: 'axe',
      what: coverage.title,
      caveat: 'this names the WCAG criterion, not the specific problem on the page — see the html/selector below for that',
      wcag: coverage.wcag,
      wcagTitle: coverage.title,
      clause: coverage.clause,
      link: `${BASE_URL}/wcag/${wcagSlug(coverage.wcag)}`,
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
export function buildPlanData(scan, jurisdiction) {
  const groups = groupFindings(scan.findings)
  const ordered = sortByPriority(groups)

  const priorities = ordered.map((g) => ({
    ruleId: g.ruleId,
    impact: g.impact,
    instanceCount: g.instances.length,
    pageCount: distinctPageCount(g),
    ...describeRule(g.ruleId, g.instances[0]?.html),
  }))

  const devBrief = ordered.map((g) => ({
    ruleId: g.ruleId,
    impact: g.impact,
    ...describeRule(g.ruleId, g.instances[0]?.html),
    instances: g.instances.slice(0, MAX_INSTANCES_SHOWN).map((i) => ({
      page: i.page,
      selector: i.selector,
      html: i.html ?? null,
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
    effort: cost ? { band: cost.band, formatted: formatCostEstimate(cost) } : null,
  }
}
