// CN-RESEARCH (§23, D-071): the reports layer.
//
// Two things are deliberately kept apart:
//   - the STATS (data/a11y/reports.json) are computed from agencies.json by
//     scripts/reports-data.mjs and guarded by scripts/reports-data.test.mjs —
//     no number here is typed by hand;
//   - the EDITORIAL metadata below (slug, title, framing prose) is authored.
//
// A report page renders authored prose around computed numbers, and every
// number it shows reads out of `stats`. The framing is scrupulously honest
// about what the dataset is: an analysis of THIS catalog's own records, not a
// benchmark of external websites — AccessAtlas has no scan corpus of third-party
// sites (the sandbox browser cannot reach external HTTPS, D-010), so a "top-100
// accessibility index" would require invented figures, which D-045/D-047 forbid.

import reportsData from '@data/a11y/reports.json'

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

export interface ReportMeta {
  slug: string
  title: string
  // One-line dek shown on the index and as the meta description seed.
  dek: string
  updated: string // ISO date
}

// One report for now; the index and routing already iterate the array, so the
// next data product is added here with its page section — no plumbing changes.
export const reports: ReportMeta[] = [
  {
    slug: 'verified-audit-market',
    title: 'The verified accessibility-audit market, by the evidence',
    dek: `Who is listed across ${stats.hqCountries.count} countries, by what proof, and what we could and could not verify — read directly from the ${stats.total} records in the AccessAtlas catalog.`,
    updated: '2026-08-08',
  },
]

export const reportBySlug = (slug: string): ReportMeta | undefined => reports.find((r) => r.slug === slug)
