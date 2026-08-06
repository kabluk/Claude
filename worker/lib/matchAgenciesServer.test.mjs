import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isFeatured, sortListing, agenciesIn, withService, withStandard, matchAgencies } from './matchAgenciesServer.js'

const TODAY = '2026-08-06'

function agency(overrides = {}) {
  return {
    slug: 'a',
    name: 'A',
    hq: { city: 'Berlin', countryCode: 'DE' },
    countriesServed: [],
    services: ['audit'],
    standards: ['bitv'],
    certs: [],
    description: {},
    sourceRefs: [{ url: 'https://example.com', label: 'x' }],
    lastVerified: '2026-01-01',
    ...overrides,
  }
}

const FIXTURE_TAXONOMIES = {
  countries: {
    DE: { name: { en: 'Germany' }, region: 'eu', law: { name: 'BFSG', slug: 'bitv' } },
    FR: { name: { en: 'France' }, region: 'eu', law: { name: 'RGAA', slug: 'rgaa' } },
    US: { name: { en: 'United States' }, region: 'us' }, // без law — граница "стандарт неизвестен"
  },
}

test('isFeatured: true only while featured.until is today or later', () => {
  assert.equal(isFeatured(agency({ featured: { until: '2026-08-06' } }), TODAY), true)
  assert.equal(isFeatured(agency({ featured: { until: '2026-08-05' } }), TODAY), false)
  assert.equal(isFeatured(agency({}), TODAY), false)
})

test('sortListing: featured first, then more certs, then has description, then name', () => {
  const plain = agency({ slug: 'plain', name: 'Zed Agency' })
  const certified = agency({ slug: 'certified', name: 'Beta', certs: [{ kind: 'iaap-org-member' }] })
  const described = agency({ slug: 'described', name: 'Alpha', description: { en: 'x' } })
  const featured = agency({ slug: 'featured', name: 'Omega', featured: { until: '2099-01-01' } })

  const sorted = sortListing([plain, certified, described, featured]).map((a) => a.slug)
  assert.deepEqual(sorted, ['featured', 'certified', 'described', 'plain'])
})

test('sortListing: ties broken alphabetically by name', () => {
  const b = agency({ slug: 'b', name: 'Bravo' })
  const a = agency({ slug: 'a', name: 'Alpha' })
  assert.deepEqual(sortListing([b, a]).map((x) => x.slug), ['a', 'b'])
})

test('agenciesIn: matches on hq.countryCode or countriesServed', () => {
  const hqDe = agency({ slug: 'hq-de', hq: { city: 'Berlin', countryCode: 'DE' } })
  const servesDe = agency({ slug: 'serves-de', hq: { city: 'Paris', countryCode: 'FR' }, countriesServed: ['DE'] })
  const elsewhere = agency({ slug: 'elsewhere', hq: { city: 'Rome', countryCode: 'IT' } })

  const result = agenciesIn([hqDe, servesDe, elsewhere], 'DE').map((a) => a.slug).sort()
  assert.deepEqual(result, ['hq-de', 'serves-de'])
})

test('withService / withStandard filter and keep sortListing order', () => {
  const auditOnly = agency({ slug: 'audit-only', services: ['audit'], standards: ['bitv'] })
  const remediationOnly = agency({ slug: 'remediation-only', services: ['remediation'], standards: ['rgaa'] })

  assert.deepEqual(withService([auditOnly, remediationOnly], 'audit').map((a) => a.slug), ['audit-only'])
  assert.deepEqual(withStandard([auditOnly, remediationOnly], 'rgaa').map((a) => a.slug), ['remediation-only'])
})

test('matchAgencies: filters by country + service, derives standard from country law', () => {
  const matchDe = agency({ slug: 'match-de', hq: { city: 'Berlin', countryCode: 'DE' }, services: ['audit'], standards: ['bitv'] })
  const wrongStandard = agency({ slug: 'wrong-standard', hq: { city: 'Munich', countryCode: 'DE' }, services: ['audit'], standards: ['rgaa'] })
  const wrongService = agency({ slug: 'wrong-service', hq: { city: 'Hamburg', countryCode: 'DE' }, services: ['training'], standards: ['bitv'] })
  const pool = [matchDe, wrongStandard, wrongService]

  const result = matchAgencies({ countryCode: 'DE', service: 'audit' }, 5, pool, FIXTURE_TAXONOMIES)
  assert.deepEqual(result.map((a) => a.slug), ['match-de'])
})

test('matchAgencies: standard narrowing is skipped (not a hard filter) if it would empty the pool', () => {
  const onlyRgaa = agency({ slug: 'only-rgaa', hq: { city: 'Berlin', countryCode: 'DE' }, services: ['audit'], standards: ['rgaa'] })
  const result = matchAgencies({ countryCode: 'DE', service: 'audit' }, 5, [onlyRgaa], FIXTURE_TAXONOMIES)
  // DE law is bitv, no bitv-certified agency in pool -> falls back to unnarrowed
  // country+service pool instead of returning 0 results.
  assert.deepEqual(result.map((a) => a.slug), ['only-rgaa'])
})

test('matchAgencies: country with no known law (US in fixture) does not filter by standard at all', () => {
  const usAgency = agency({ slug: 'us-agency', hq: { city: 'NYC', countryCode: 'US' }, services: ['audit'], standards: ['ada'] })
  const result = matchAgencies({ countryCode: 'US', service: 'audit' }, 5, [usAgency], FIXTURE_TAXONOMIES)
  assert.deepEqual(result.map((a) => a.slug), ['us-agency'])
})

test('matchAgencies: without countryCode, matches across the whole pool by service only', () => {
  const de = agency({ slug: 'de', hq: { city: 'Berlin', countryCode: 'DE' }, services: ['audit'] })
  const fr = agency({ slug: 'fr', hq: { city: 'Paris', countryCode: 'FR' }, services: ['audit'] })
  const result = matchAgencies({ service: 'audit' }, 5, [de, fr], FIXTURE_TAXONOMIES).map((a) => a.slug).sort()
  assert.deepEqual(result, ['de', 'fr'])
})

test('matchAgencies: priceBand is a soft tie-breaker, not a hard filter', () => {
  const budget = agency({ slug: 'budget', hq: { city: 'Berlin', countryCode: 'DE' }, services: ['audit'], priceBand: 'budget' })
  const mid = agency({ slug: 'mid', hq: { city: 'Munich', countryCode: 'DE' }, services: ['audit'], priceBand: 'mid' })
  const result = matchAgencies({ countryCode: 'DE', service: 'audit', priceBand: 'mid' }, 5, [budget, mid], FIXTURE_TAXONOMIES)
  assert.deepEqual(result.map((a) => a.slug), ['mid', 'budget']) // exact priceBand match sorted first
  assert.equal(result.length, 2) // budget agency is still included, not filtered out
})

test('matchAgencies: respects limit', () => {
  const pool = Array.from({ length: 8 }, (_, i) =>
    agency({ slug: `a${i}`, name: `Agency ${i}`, hq: { city: 'Berlin', countryCode: 'DE' }, services: ['audit'] }),
  )
  const result = matchAgencies({ countryCode: 'DE', service: 'audit' }, 5, pool, FIXTURE_TAXONOMIES)
  assert.equal(result.length, 5)
})

test('matchAgencies: default export data is the real catalog (smoke test)', () => {
  // Без фикстур — реальный data/a11y/agencies.json/taxonomies.json. Германия
  // (DE) и услуга audit заведомо непустая комбинация в реальном каталоге
  // (см. data/a11y/agencies.json).
  const result = matchAgencies({ countryCode: 'DE', service: 'audit' })
  assert.ok(Array.isArray(result))
  assert.ok(result.length > 0, 'expected at least one real DE/audit agency in the live catalog')
  for (const a of result) {
    assert.equal(typeof a.slug, 'string')
  }
})
