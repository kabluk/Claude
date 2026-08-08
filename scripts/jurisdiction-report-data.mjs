#!/usr/bin/env node
// CN-RESEARCH-JURISDICTION-COVERAGE: aggregator for the third data product —
// where EU/EEA law requires an accessibility statement, and how many catalog
// specialists actually serve that jurisdiction.
//
// This is a SYNTHESIS of the two datasets the first two reports already used —
// not a third new source (scripts/reports-data.mjs reads data/a11y/agencies.json
// for report 1; scripts/en301549-report-data.mjs reads
// data/a11y/en301549-coverage.json for report 2). This aggregator instead joins:
//   - data/a11y/agencies.json           — who is actually listed, and which
//                                          countries each one serves
//                                          (agencies[].countriesServed)
//   - worker/lib/jurisdiction.js        — the 13 jurisdictions the scanner
//                                          itself already treats as requiring
//                                          an accessibility statement, with
//                                          their law citation and a `verified`
//                                          flag (see the long comment at the
//                                          top of that file for what `verified`
//                                          does and does NOT mean, and why no
//                                          penalty amount ever appears there —
//                                          D-034/D-035)
//
// The law list is NEVER retyped by hand here: it is imported directly from
// worker/lib/jurisdiction.js (a plain ESM module with no browser APIs, so a
// Node build script can import it as-is — unlike src/lib/jurisdictions.ts,
// which is a SEPARATE copy that exists only because the browser bundle for
// /scan cannot import server/worker code, D-010; that duplication is not
// needed here and is not used here).
//
// jurisdiction.js exports `supportedJurisdictions()` for the UI selector, which
// deliberately strips each record down to { country, law } — not enough for
// this report, which also needs `lawFull` and `verified`. Rather than add a
// new export to a file outside this task's scope, this aggregator reads the
// full record the same way the worker itself does at scan time: through
// `jurisdictionForUrl()`, the module's own public TLD lookup. Every one of the
// 13 jurisdictions' TLD key equals its lowercased country code (see
// TLD_TO_JURISDICTION in jurisdiction.js), so `jurisdictionForUrl('https://
// example.<tld>')` returns the exact same object the scanner would attach to a
// finding for a site on that TLD — no separate/duplicated data path.
//
// Same discipline as the other two aggregators: computeStats is pure (no I/O,
// no Date.now()/Math.random()) — deterministic input → byte-identical output —
// which is what lets scripts/jurisdiction-report-data.test.mjs recompute and
// compare against the committed snapshot data/a11y/jurisdiction-report.json.
//
// Run: node scripts/jurisdiction-report-data.mjs   (writes data/a11y/jurisdiction-report.json)

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { supportedJurisdictions, jurisdictionForUrl } from '../worker/lib/jurisdiction.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// Same "does this country marker mean an actual country" filter as the
// `served` set in scripts/reports-data.mjs (`!c.startsWith('remote-')`) — not
// reinvented here. Every jurisdiction code below is a real ISO country code,
// so a remote-* marker can never match one; the filter is applied anyway, for
// the same reason reports-data.mjs applies it: honesty about what counts as
// "serves this country", not an assumption that today's data will never carry
// a code that could collide.
const servesCountry = (agency, code) =>
  (agency.countriesServed ?? []).some((c) => !c.startsWith('remote-') && c === code)

/**
 * Pure aggregator: agencies + taxonomies + the scanner's own jurisdiction list
 * → deterministic stats. No I/O, no clock — same input always yields
 * byte-identical output, which is what lets the test assert the committed
 * snapshot against a fresh recompute.
 */
export function computeStats(agencies, taxonomies, jurisdictionList) {
  const countryName = (code) => taxonomies?.countries?.[code]?.name?.en ?? code

  const rows = jurisdictionList.map((j) => {
    // Full record (law/lawFull/verified/citation) via the module's own public
    // TLD lookup — see the file-header comment for why this is not a
    // hand-copied duplicate of jurisdiction.js's law list.
    const full = jurisdictionForUrl(`https://example.${j.country.toLowerCase()}`)
    const agencyCount = agencies.filter((a) => servesCountry(a, j.country)).length
    return {
      country: j.country,
      name: countryName(j.country),
      law: full.law,
      lawFull: full.lawFull ?? null,
      statementRequired: full.statementRequired,
      verified: full.verified,
      citation: full.citation ?? null,
      agencyCount,
    }
  })

  // The report's central honest split: jurisdictions the law covers where the
  // catalog currently has zero listed specialists serving them, versus
  // jurisdictions where it has at least one. Computed, not assumed — an empty
  // `uncovered` group is a real, reportable finding in its own right, not an
  // error.
  const uncovered = rows
    .filter((r) => r.agencyCount === 0)
    .sort((a, b) => a.country.localeCompare(b.country))
  const covered = rows
    .filter((r) => r.agencyCount > 0)
    .sort((a, b) => b.agencyCount - a.agencyCount || a.country.localeCompare(b.country))

  const verifiedLawCount = rows.filter((r) => r.verified).length

  // Thinnest / deepest coverage among the covered jurisdictions, reported as
  // "which jurisdictions sit at this count" rather than picking one arbitrary
  // jurisdiction when several tie — a tie is itself part of the honest
  // picture, not a detail to collapse away.
  const coveredCounts = covered.map((r) => r.agencyCount)
  const thinnestCount = coveredCounts.length ? Math.min(...coveredCounts) : null
  const deepestCount = coveredCounts.length ? Math.max(...coveredCounts) : null

  return {
    source: 'data/a11y/agencies.json + worker/lib/jurisdiction.js',
    totalJurisdictions: rows.length,
    uncovered: { count: uncovered.length, jurisdictions: uncovered },
    covered: { count: covered.length, jurisdictions: covered },
    verifiedLawCount,
    unverifiedLawCount: rows.length - verifiedLawCount,
    thinnestCoverage:
      thinnestCount === null
        ? null
        : {
            agencyCount: thinnestCount,
            jurisdictions: covered.filter((r) => r.agencyCount === thinnestCount).map((r) => r.country),
          },
    deepestCoverage:
      deepestCount === null
        ? null
        : {
            agencyCount: deepestCount,
            jurisdictions: covered.filter((r) => r.agencyCount === deepestCount).map((r) => r.country),
          },
  }
}

export function loadInputs() {
  const agencies = JSON.parse(readFileSync(join(ROOT, 'data/a11y/agencies.json'), 'utf8'))
  const taxonomies = JSON.parse(readFileSync(join(ROOT, 'data/a11y/taxonomies.json'), 'utf8'))
  const jurisdictionList = supportedJurisdictions()
  return { agencies, taxonomies, jurisdictionList }
}

// Stable 2-space JSON with a trailing newline, so regeneration produces a
// minimal, reviewable diff.
export const serialize = (stats) => JSON.stringify(stats, null, 2) + '\n'

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const { agencies, taxonomies, jurisdictionList } = loadInputs()
  const stats = computeStats(agencies, taxonomies, jurisdictionList)
  const out = join(ROOT, 'data/a11y/jurisdiction-report.json')
  writeFileSync(out, serialize(stats))
  console.log(
    `✓ jurisdiction-report-data: ${stats.totalJurisdictions} jurisdictions · ` +
      `${stats.uncovered.count} with zero catalog coverage · ` +
      `${stats.covered.count} covered (thinnest ${stats.thinnestCoverage?.agencyCount ?? 'n/a'}, deepest ${stats.deepestCoverage?.agencyCount ?? 'n/a'}) · ` +
      `→ data/a11y/jurisdiction-report.json`,
  )
}
