#!/usr/bin/env node
// CN-RESEARCH-EN301549-AUTOMATION: aggregator for the second data product —
// "what automated accessibility testing can and cannot prove", built from
// data/a11y/en301549-coverage.json (EN 301 549 V3.2.1 chapter 9, mapped against
// axe-core 4.13.0 rule metadata and the AccessAtlas worker's own checks — the
// same source that already backs /methodology/ and /wcag/[criterion], D-066).
//
// This is a SEPARATE aggregator from scripts/reports-data.mjs, on purpose: it
// must not touch that file, its test, or data/a11y/reports.json, which gate the
// first report (verified-audit-market) and must stay green untouched.
//
// Same discipline as reports-data.mjs: computeStats is pure (no I/O, no
// Date.now()/Math.random()) — deterministic input → byte-identical output —
// which is what lets scripts/en301549-report-data.test.mjs recompute and
// compare against the committed snapshot data/a11y/en301549-report.json.
//
// Run: node scripts/en301549-report-data.mjs   (writes data/a11y/en301549-report.json)

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// The four WCAG principles, keyed by the first digit of the SC number — the
// same objective, publicly documented grouping used by src/lib/coverage.ts for
// /methodology/. Order matters only for display; it mirrors the WCAG spec.
const PRINCIPLES = [
  { key: '1', title: 'Perceivable' },
  { key: '2', title: 'Operable' },
  { key: '3', title: 'Understandable' },
  { key: '4', title: 'Robust' },
]

const STATUSES = ['axe', 'ours', 'both', 'none']
// "Automated in some form" = an axe-core rule and/or our own worker check
// exists for the criterion. 'none' means the standard has no automated check
// at all for that success criterion — manual review is the only option.
const AUTOMATED_STATUSES = ['axe', 'ours', 'both']

const emptyStatusCounts = () => Object.fromEntries(STATUSES.map((s) => [s, 0]))

const bumpStatus = (counts, row) => {
  counts[row.status] = (counts[row.status] ?? 0) + 1
}

const pct = (n, total) => (total === 0 ? 0 : Math.round((n / total) * 100))

/**
 * Pure aggregator: the parsed en301549-coverage.json → deterministic stats.
 * No I/O, no clock — same input always yields byte-identical output.
 */
export function computeStats(coverageData) {
  const rows = coverageData.rows ?? []
  const total = rows.length

  const byStatus = emptyStatusCounts()
  for (const r of rows) bumpStatus(byStatus, r)

  const automatedCount = AUTOMATED_STATUSES.reduce((s, k) => s + (byStatus[k] ?? 0), 0)
  const manualOnlyCount = byStatus.none ?? 0

  const principles = PRINCIPLES.map((p) => {
    const prows = rows.filter((r) => r.wcag.split('.')[0] === p.key)
    const pByStatus = emptyStatusCounts()
    for (const r of prows) bumpStatus(pByStatus, r)
    const pAutomated = AUTOMATED_STATUSES.reduce((s, k) => s + (pByStatus[k] ?? 0), 0)
    return {
      key: p.key,
      title: p.title,
      total: prows.length,
      byStatus: pByStatus,
      automated: pAutomated,
      automatedPercent: pct(pAutomated, prows.length),
    }
  })

  // What automation cannot prove at all: every criterion with no axe rule and
  // no worker module, in the order the source data lists them.
  const manualCriteria = rows
    .filter((r) => r.status === 'none')
    .map((r) => ({ clause: r.clause, wcag: r.wcag, title: r.title }))

  // Criteria where AccessAtlas's own worker code goes beyond bare axe-core
  // (status 'ours' or 'both' — anywhere `ours` names a real module).
  const ownModules = rows
    .filter((r) => r.ours)
    .map((r) => ({ clause: r.clause, wcag: r.wcag, title: r.title, status: r.status, ours: r.ours }))

  return {
    source: 'data/a11y/en301549-coverage.json',
    generatedFrom: coverageData.generatedFrom ?? null,
    total,
    byStatus,
    automated: { count: automatedCount, percent: pct(automatedCount, total) },
    manualOnly: { count: manualOnlyCount, percent: pct(manualOnlyCount, total) },
    principles,
    manualCriteria,
    ownModules,
  }
}

export function loadInputs() {
  const coverageData = JSON.parse(readFileSync(join(ROOT, 'data/a11y/en301549-coverage.json'), 'utf8'))
  return { coverageData }
}

// Stable 2-space JSON with a trailing newline, so regeneration produces a
// minimal, reviewable diff.
export const serialize = (stats) => JSON.stringify(stats, null, 2) + '\n'

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const { coverageData } = loadInputs()
  const stats = computeStats(coverageData)
  const out = join(ROOT, 'data/a11y/en301549-report.json')
  writeFileSync(out, serialize(stats))
  console.log(
    `✓ en301549-report-data: ${stats.total} criteria · ${stats.automated.count} automated (${stats.automated.percent}%) · ` +
      `${stats.manualOnly.count} manual-only · → data/a11y/en301549-report.json`,
  )
}
