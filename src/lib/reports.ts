// CN-RESEARCH (§23, D-071) / CN-RESEARCH-EN301549-AUTOMATION: the reports layer.
//
// Two things are deliberately kept apart, per report:
//   - the STATS (data/a11y/reports.json, data/a11y/en301549-report.json) are
//     computed from their own source data by their own aggregator scripts
//     (scripts/reports-data.mjs, scripts/en301549-report-data.mjs) and each
//     guarded by its own test — no number here is typed by hand;
//   - the EDITORIAL metadata below (slug, title, framing prose, JSON-LD
//     variables) is authored.
//
// This module now backs MORE THAN ONE report, each with a DIFFERENT data
// shape (ReportStats vs En301549Stats) — verified-audit-market reads
// data/a11y/agencies.json, en301549-automation-coverage reads
// data/a11y/en301549-coverage.json. Rather than force both into one flat
// structure, each report keeps its own stats export and its own body content
// in src/pages/ReportDocPage.tsx, which dispatches on `meta.slug` — the same
// "data → per-slug content" shape already used by DEMOS in
// src/lib/componentsLib.tsx and by the coverage-driven pages in
// src/lib/wcag.ts. ReportMeta only carries what the SHARED page shell (JSON-LD,
// title, dateline, dek) needs from every report, regardless of its data shape.
//
// verified-audit-market's stats/meta values are UNCHANGED from before this
// refactor — reports-data.mjs, reports-data.test.mjs and data/a11y/reports.json
// are untouched, and this file still reads reports.json the same way it always
// did, so the page they feed renders byte-identical output.

import reportsData from '@data/a11y/reports.json'
import en301549ReportData from '@data/a11y/en301549-report.json'

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
    dek: `Who is listed across ${stats.hqCountries.count} countries, by what proof, and what we could and could not verify — read directly from the ${stats.total} records in the AccessAtlas catalog.`,
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
      'Coverage mapping of EN 301 549 chapter 9 success criteria against axe-core 4.13.0 rule metadata and AccessAtlas worker check modules',
    variableMeasured: [
      'EN 301 549 clause',
      'WCAG 2.x success criterion',
      'Automation status (axe rule / our own check / both / manual only)',
      'WCAG POUR principle (Perceivable, Operable, Understandable, Robust)',
    ],
  },
]

export const reportBySlug = (slug: string): ReportMeta | undefined => reports.find((r) => r.slug === slug)
