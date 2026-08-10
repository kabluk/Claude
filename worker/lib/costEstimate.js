// Worker-side mirror of src/lib/costEstimate.ts (frontend, TypeScript).
//
// WHY duplicated instead of imported: worker/ is a plain-ESM Cloudflare Worker
// bundled by wrangler's esbuild, which CAN technically transpile a .ts import —
// but src/lib/costEstimate.ts itself imports `./scanner` WITHOUT an extension
// (standard TS/bundler resolution style), which plain `node --test` (how
// `npm run worker:test` runs, no bundler) cannot resolve. A module that only
// loads under wrangler's bundler but not under the test runner would make this
// file untestable in CI — same constraint that produced src/lib/jurisdictions.ts
// as a deliberate mirror of worker/lib/jurisdiction.js (D-032), just in the
// opposite direction: THERE the worker is the source of truth, HERE the
// frontend is.
//
// WHY this duplication is dangerous enough to need a gate (not just a comment):
// the free report on /report/:id and the paid PDF plan must show the exact same
// "€3k–10k" figure for the exact same finding set — a silent drift here would
// be charging two different prices for identical work to the same customer.
// Gate: src/lib/costEstimate.workerMirror.test.mjs runs BOTH implementations on
// identical synthetic finding fixtures and asserts identical output — it reads
// this file directly (plain JS import works fine from the tsx-run test), not a
// copy of the numbers, so this file drifting from the real formula fails loudly.

const BAND_BOUNDS = {
  budget: [0, 3000],
  mid: [3000, 10000],
  premium: [10000, 30000],
  enterprise: [30000, null],
}

// Mirrors src/lib/costEstimate.ts::NON_ENGINEERING_RULES (D-046) — findings that
// are not engineering work and don't scale with site size.
const NON_ENGINEERING_RULES = new Set([
  'a11y-statement-missing',
  'a11y-statement-incomplete',
  'a11y-feedback-missing',
  'a11y-pdf-present',
])

const SCAN_META_PREFIX = 'scan-meta-'

// Same dedup principle as worker/lib/score.js::scoreFromFindings — worst impact
// per distinct ruleId, not per instance. Not imported from score.js because
// score.js exposes only the impact-weighted score, not per-rule dedup, and the
// severity ranking here (critical/serious count double) is a different formula
// (see effortScore below), not the score.js weights.
const SEVERITY_RANK = { minor: 0, moderate: 1, serious: 2, critical: 3 }

function dedupeByRule(findings) {
  const worst = new Map()
  for (const f of findings) {
    const current = worst.get(f.ruleId)
    if (!current || SEVERITY_RANK[f.impact] > SEVERITY_RANK[current]) worst.set(f.ruleId, f.impact)
  }
  return [...worst.entries()].map(([ruleId, impact]) => ({ ruleId, impact }))
}

// Mirrors src/lib/costEstimate.ts::effortScore exactly: number of distinct
// engineering-relevant rules + double weight for serious/critical rules.
export function effortScore(findings) {
  const groups = dedupeByRule(findings).filter(
    (g) => !NON_ENGINEERING_RULES.has(g.ruleId) && !g.ruleId.startsWith(SCAN_META_PREFIX),
  )
  const severe = groups.filter((g) => g.impact === 'critical' || g.impact === 'serious').length
  return groups.length + severe * 2
}

// Mirrors src/lib/costEstimate.ts::pickBand thresholds exactly (D-046 calibration).
function pickBand(score) {
  if (score <= 4) return 'budget'
  if (score <= 12) return 'mid'
  if (score <= 24) return 'premium'
  return 'enterprise'
}

export function estimateCost(findings) {
  if (findings.length === 0) return null
  const band = pickBand(effortScore(findings))
  const [lowerAmount, upperAmount] = BAND_BOUNDS[band]
  return { band, lowerAmount, upperAmount }
}

function formatAmount(amount) {
  return amount >= 1000 ? `${Math.round(amount / 1000)}k` : String(amount)
}

export function formatCostEstimate(estimate) {
  if (estimate.upperAmount === null) return `€${formatAmount(estimate.lowerAmount)}+`
  if (estimate.lowerAmount === 0) return `Under €${formatAmount(estimate.upperAmount)}`
  return `€${formatAmount(estimate.lowerAmount)}–${formatAmount(estimate.upperAmount)}`
}
