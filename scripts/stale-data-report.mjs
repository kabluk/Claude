#!/usr/bin/env node
// R-STALE-DATA: report "N profiles not re-verified for > 180 days" from the
// lastVerified field of data/a11y/agencies.json (the catalog's source of
// truth — see data/a11y/types.ts: every Agency carries an ISO lastVerified).
//
// Same discipline as reports-data.mjs / en301549-report-data.mjs:
// computeStaleReport is pure (no I/O, no Date.now() inside) — deterministic
// input → deterministic output — so scripts/stale-data-report.test.mjs can
// exercise it against the real agencies.json shape without touching the clock.
//
// This is a read-only report: it never edits agencies.json and always exits 0
// when the data is readable (staleness is a fact to surface, not a build
// failure). Unparseable/missing lastVerified values are listed separately as
// `invalid` — those are data defects, still exit 0 but loudly reported.
//
// Run:  node scripts/stale-data-report.mjs            (threshold 180 days)
//       node scripts/stale-data-report.mjs --days 30  (custom threshold)
//       node scripts/stale-data-report.mjs --json     (machine-readable)

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const AGENCIES_PATH = join(ROOT, 'data', 'a11y', 'agencies.json')

export const DEFAULT_THRESHOLD_DAYS = 180

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Strict ISO calendar date (the only form agencies.json uses for lastVerified).
// Date.parse alone is too permissive ("2026" parses); we demand YYYY-MM-DD and
// then verify the parts round-trip (rejects 2026-02-31 etc.).
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseIsoDate(value) {
  if (typeof value !== 'string') return null
  const m = ISO_DATE_RE.exec(value)
  if (!m) return null
  const [, y, mo, d] = m
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)))
  if (Number.isNaN(date.getTime())) return null
  // Round-trip check: JS Date silently rolls over invalid days (Feb 31 → Mar 3).
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(mo) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    return null
  }
  return date
}

/**
 * Pure report builder.
 * @param {Array<{slug?: string, name?: string, lastVerified?: string}>} agencies
 * @param {{ now: Date, thresholdDays?: number }} opts — `now` is required so
 *   callers (and tests) own the clock; the CLI passes new Date().
 * @returns {{ generatedAt: string, thresholdDays: number, total: number,
 *   stale: Array<{slug: string, name: string, lastVerified: string, daysSince: number}>,
 *   invalid: Array<{slug: string, name: string, lastVerified: unknown}> }}
 */
export function computeStaleReport(agencies, { now, thresholdDays = DEFAULT_THRESHOLD_DAYS }) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError('computeStaleReport: opts.now must be a valid Date')
  }
  if (!Number.isFinite(thresholdDays) || thresholdDays < 0) {
    throw new TypeError('computeStaleReport: thresholdDays must be a non-negative number')
  }

  const stale = []
  const invalid = []

  for (const agency of agencies) {
    const slug = agency.slug ?? '(no slug)'
    const name = agency.name ?? '(no name)'
    const parsed = parseIsoDate(agency.lastVerified)
    if (parsed === null) {
      invalid.push({ slug, name, lastVerified: agency.lastVerified ?? null })
      continue
    }
    const daysSince = Math.floor((now.getTime() - parsed.getTime()) / MS_PER_DAY)
    if (daysSince > thresholdDays) {
      stale.push({ slug, name, lastVerified: agency.lastVerified, daysSince })
    }
  }

  // Oldest first — the entries most in need of re-verification lead the list.
  stale.sort((a, b) => b.daysSince - a.daysSince || a.slug.localeCompare(b.slug))
  invalid.sort((a, b) => a.slug.localeCompare(b.slug))

  return {
    generatedAt: now.toISOString(),
    thresholdDays,
    total: agencies.length,
    stale,
    invalid,
  }
}

function parseArgs(argv) {
  const opts = { thresholdDays: DEFAULT_THRESHOLD_DAYS, json: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--json') {
      opts.json = true
    } else if (arg === '--days') {
      const value = Number(argv[++i])
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`--days expects a non-negative number, got: ${argv[i]}`)
      }
      opts.thresholdDays = value
    } else if (arg.startsWith('--days=')) {
      const value = Number(arg.slice('--days='.length))
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`--days expects a non-negative number, got: ${arg}`)
      }
      opts.thresholdDays = value
    } else {
      throw new Error(`Unknown argument: ${arg} (supported: --days N, --json)`)
    }
  }
  return opts
}

function printHuman(report) {
  const { thresholdDays, total, stale, invalid } = report
  console.log(`Stale-data report — profiles not re-verified for > ${thresholdDays} days`)
  console.log(`Catalog: ${total} profiles · checked ${report.generatedAt.slice(0, 10)}`)
  console.log('')
  if (stale.length === 0) {
    console.log(`OK: no profile exceeds the ${thresholdDays}-day threshold.`)
  } else {
    console.log(`STALE (${stale.length}):`)
    for (const row of stale) {
      console.log(`  ${String(row.daysSince).padStart(4)}d  ${row.lastVerified}  ${row.slug} — ${row.name}`)
    }
  }
  if (invalid.length > 0) {
    console.log('')
    console.log(`INVALID lastVerified (${invalid.length}) — data defects, fix in agencies.json:`)
    for (const row of invalid) {
      console.log(`  ${row.slug} — ${row.name}: ${JSON.stringify(row.lastVerified)}`)
    }
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const agencies = JSON.parse(readFileSync(AGENCIES_PATH, 'utf8'))
  const report = computeStaleReport(agencies, {
    now: new Date(),
    thresholdDays: opts.thresholdDays,
  })
  if (opts.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printHuman(report)
  }
}

// Only run the CLI when invoked directly (node scripts/stale-data-report.mjs),
// not when imported by the test.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
