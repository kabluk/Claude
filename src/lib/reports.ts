// CN-RESEARCH (§23, D-071) / CN-RESEARCH-EN301549-AUTOMATION /
// CN-RESEARCH-JURISDICTION-COVERAGE: the reports layer.
//
// Two things are deliberately kept apart, per report:
//   - the STATS (data/a11y/reports.json, data/a11y/en301549-report.json,
//     data/a11y/jurisdiction-report.json) are computed from their own source
//     data by their own aggregator scripts (scripts/reports-data.mjs,
//     scripts/en301549-report-data.mjs, scripts/jurisdiction-report-data.mjs)
//     and each guarded by its own test — no number here is typed by hand;
//   - the EDITORIAL metadata below (slug, title, framing prose, JSON-LD
//     variables) is authored.
//
// This module now backs THREE reports, each with a DIFFERENT data shape
// (ReportStats / En301549Stats / JurisdictionStats) — verified-audit-market
// reads data/a11y/agencies.json, en301549-automation-coverage reads
// data/a11y/en301549-coverage.json, jurisdiction-coverage-gap SYNTHESISES the
// first report's source (agencies.json) with worker/lib/jurisdiction.js — it
// is not a third new dataset, it is a new angle on the two already in use.
// Rather than force all three into one flat structure, each report keeps its
// own stats export and its own body content in src/pages/ReportDocPage.tsx,
// which dispatches on `meta.slug` — the same "data → per-slug content" shape
// already used by DEMOS in src/lib/componentsLib.tsx and by the
// coverage-driven pages in src/lib/wcag.ts. ReportMeta only carries what the
// SHARED page shell (JSON-LD, title, dateline, dek) needs from every report,
// regardless of its data shape.
//
// verified-audit-market's and en301549-automation-coverage's stats/meta
// values are UNCHANGED by this addition — their aggregators, tests and
// snapshots are untouched, and this file still reads their JSON the same way
// it always did, so the pages they feed render byte-identical output.

import reportsData from '@data/a11y/reports.json'
import en301549ReportData from '@data/a11y/en301549-report.json'
import jurisdictionReportData from '@data/a11y/jurisdiction-report.json'

// ---------------------------------------------------------------------------
// Report 1: verified-audit-market (data/a11y/agencies.json). Unchanged.
// ---------------------------------------------------------------------------

export interface CountryCount {
  code: string
  name: string
  count: number
}
export interface StandardCount {
  slug: string
  label: string
  count: number
}
export interface ReportStats {
  source: string
  total: number
  hqCountries: { count: number; distribution: CountryCount[] }
  countriesCovered: number
  standards: StandardCount[]
  priceBands: {
    withBand: number
    withoutBand: number
    distribution: Record<string, number>
  }
  evidence: {
    recordsWithAnyCert: number
    recordsWithNamedAuditorStatement: number
    namedAuditorByDeclarant: Record<string, number>
    certKinds: Record<string, number>
  }
  founded: {
    withYear: number
    withoutYear: number
    oldest: number | null
    newest: number | null
    median: number | null
  }
  sources: {
    totalRefs: number
    recordsWithMultiple: number
    minPerRecord: number
    everyRecordHasAtLeastOne: boolean
  }
}

export const stats = reportsData as ReportStats

// ---------------------------------------------------------------------------
// Report 2: en301549-automation-coverage (data/a11y/en301549-coverage.json).
// Computed by scripts/en301549-report-data.mjs, gated by
// scripts/en301549-report-data.test.mjs — a separate aggregator/gate pair that
// does not touch the first report's.
// ---------------------------------------------------------------------------

export interface En301549StatusCounts {
  axe: number
  ours: number
  both: number
  none: number
}
export interface En301549Criterion {
  clause: string
  wcag: string
  title: string
}
export interface En301549OwnModule extends En301549Criterion {
  status: 'ours' | 'both'
  ours: string
}
export interface En301549Principle {
  key: string
  title: string
  total: number
  byStatus: En301549StatusCounts
  automated: number
  automatedPercent: number
}
export interface En301549Stats {
  source: string
  generatedFrom: string | null
  total: number
  byStatus: En301549StatusCounts
  automated: { count: number; percent: number }
  manualOnly: { count: number; percent: number }
  principles: En301549Principle[]
  manualCriteria: En301549Criterion[]
  ownModules: En301549OwnModule[]
}

export const en301549Stats = en301549ReportData as En301549Stats

// ---------------------------------------------------------------------------
// Report 3: jurisdiction-coverage-gap — a SYNTHESIS of data/a11y/agencies.json
// (report 1's source) and worker/lib/jurisdiction.js (the scanner's own
// jurisdiction list), computed by scripts/jurisdiction-report-data.mjs and
// gated by scripts/jurisdiction-report-data.test.mjs — a third
// aggregator/gate pair that does not touch either of the first two.
// ---------------------------------------------------------------------------

export interface JurisdictionRow {
  country: string
  name: string
  law: string
  lawFull: string | null
  statementRequired: boolean
  verified: boolean
  citation: string | null
  agencyCount: number
}
export interface JurisdictionCoverageExtreme {
  agencyCount: number
  jurisdictions: string[]
}
export interface JurisdictionStats {
  source: string
  totalJurisdictions: number
  uncovered: { count: number; jurisdictions: JurisdictionRow[] }
  covered: { count: number; jurisdictions: JurisdictionRow[] }
  verifiedLawCount: number
  unverifiedLawCount: number
  thinnestCoverage: JurisdictionCoverageExtreme | null
  deepestCoverage: JurisdictionCoverageExtreme | null
}

export const jurisdictionStats = jurisdictionReportData as JurisdictionStats

// ---------------------------------------------------------------------------
// Shared editorial metadata — what the common page shell in ReportDocPage.tsx
// needs regardless of which report it renders. The body content itself (every
// section past the dateline/dek/what-this-is box) is per-slug, authored
// directly in ReportDocPage.tsx.
// ---------------------------------------------------------------------------

export interface ReportMeta {
  slug: string
  title: string
  // One-line dek shown on the index and as the meta description seed.
  dek: string
  updated: string // ISO date
  // schema.org Dataset fields — differ per report because the underlying
  // dataset and what was measured differ.
  measurementTechnique: string
  variableMeasured: string[]
}

// The index and routing already iterate this array, so a further data product
// is added here with its page section in ReportDocPage.tsx — no plumbing
// changes to routes.tsx, data.ts, gen-a11y-sitemap.mjs, or audit-own-a11y.mjs
// beyond adding the new route to the a11y sample list.
export const reports: ReportMeta[] = [
  {
    slug: 'verified-audit-market',
    title: 'The verified accessibility-audit market, by the evidence',
    dek: `Who is listed across ${stats.hqCountries.count} countries, by what proof, and what we could and could not verify — read directly from the ${stats.total} records in the Verscala catalog.`,
    updated: '2026-08-08',
    measurementTechnique: 'Aggregated from verified public sources cited per catalog record',
    variableMeasured: [
      'Headquarters country',
      'Declared standards',
      'Third-party accessibility-statement evidence',
      'Declarant type (public body vs. private)',
      'Founding year',
      'Price band',
    ],
  },
  {
    slug: 'en301549-automation-coverage',
    title: 'Automated accessibility testing: what it can and cannot prove',
    dek: `Of the ${en301549Stats.total} web success criteria in EN 301 549 chapter 9, ${en301549Stats.automated.count} (${en301549Stats.automated.percent}%) have an automated check — axe-core, our own worker code, or both. The other ${en301549Stats.manualOnly.count} need a human, always.`,
    updated: '2026-08-08',
    measurementTechnique:
      'Coverage mapping of EN 301 549 chapter 9 success criteria against axe-core 4.13.0 rule metadata and Verscala worker check modules',
    variableMeasured: [
      'EN 301 549 clause',
      'WCAG 2.x success criterion',
      'Automation status (axe rule / our own check / both / manual only)',
      'WCAG POUR principle (Perceivable, Operable, Understandable, Robust)',
    ],
  },
  {
    slug: 'jurisdiction-coverage-gap',
    title: 'Where the law requires a specialist — and where our catalog is thinnest',
    dek:
      jurisdictionStats.uncovered.count > 0
        ? `${jurisdictionStats.uncovered.count} of the ${jurisdictionStats.totalJurisdictions} EU/EEA jurisdictions where Verscala's own scanner treats an accessibility statement as legally required currently have zero catalog specialists serving them.`
        : `All ${jurisdictionStats.totalJurisdictions} EU/EEA jurisdictions where Verscala's own scanner treats an accessibility statement as legally required have at least one catalog specialist — but coverage ranges from ${jurisdictionStats.deepestCoverage?.agencyCount ?? 0} down to just ${jurisdictionStats.thinnestCoverage?.agencyCount ?? 0}.`,
    updated: '2026-08-08',
    measurementTechnique:
      'Join of the Verscala catalog (data/a11y/agencies.json, filtered by agencies[].countriesServed) against the 13 jurisdictions the Verscala scanner itself treats as requiring an accessibility statement (worker/lib/jurisdiction.js)',
    variableMeasured: [
      'Jurisdiction (country)',
      'Applicable law transposing the European Accessibility Act (or, for Norway, its EEA equivalent)',
      'Whether the law citation is verified against a primary source',
      'Number of catalog specialists serving that jurisdiction',
    ],
  },
]

export const reportBySlug = (slug: string): ReportMeta | undefined => reports.find((r) => r.slug === slug)
