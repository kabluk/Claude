import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectCountryFromHtml, countryFromTld, resolveCountry } from './siteCountry.js'

// Small fixture — proves the module doesn't hardcode a country list (D-*: no
// duplicate dataset), and keeps test fixtures readable. Shape matches
// data/a11y/types.ts CountryMeta closely enough for these functions (only
// `.name.en` is ever read).
const FIXTURE_COUNTRIES = {
  US: { name: { en: 'United States' } },
  DE: { name: { en: 'Germany' } },
  GB: { name: { en: 'United Kingdom' } },
  FR: { name: { en: 'France' } },
}

// ── detectCountryFromHtml: schema-org JSON-LD ────────────────────────────────

test('schema-org: bare 2-letter addressCountry string', () => {
  const html = `<html><head><script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Organization","name":"Acme",
     "address":{"@type":"PostalAddress","addressCountry":"US"}}
  </script></head></html>`
  assert.equal(detectCountryFromHtml(html, FIXTURE_COUNTRIES), 'US')
})

test('schema-org: full English country name string, case-insensitive', () => {
  const html = `<script type="application/ld+json">
    {"address":{"addressCountry":"united states"}}
  </script>`
  assert.equal(detectCountryFromHtml(html, FIXTURE_COUNTRIES), 'US')
})

test('schema-org: addressCountry as a Country object ({"name": "..."})', () => {
  const html = `<script type="application/ld+json">
    {"address":{"addressCountry":{"@type":"Country","name":"Germany"}}}
  </script>`
  assert.equal(detectCountryFromHtml(html, FIXTURE_COUNTRIES), 'DE')
})

test('schema-org: Country object with a 2-letter code as .name also matches', () => {
  const html = `<script type="application/ld+json">
    {"address":{"addressCountry":{"name":"GB"}}}
  </script>`
  assert.equal(detectCountryFromHtml(html, FIXTURE_COUNTRIES), 'GB')
})

test('malformed JSON-LD does not crash the scan — just skipped, real-world block right after it still matches', () => {
  const html = `
    <script type="application/ld+json">{ this is not valid JSON at all </script>
    <script type="application/ld+json">{"address":{"addressCountry":"FR"}}</script>
  `
  assert.equal(detectCountryFromHtml(html, FIXTURE_COUNTRIES), 'FR')
})

test('multiple JSON-LD blocks: a WebSite node with no address is skipped, Organization node with address matches', () => {
  const html = `
    <script type="application/ld+json">{"@type":"WebSite","name":"Acme site","url":"https://acme.test/"}</script>
    <script type="application/ld+json">{"@type":"Organization","address":{"addressCountry":"DE"}}</script>
  `
  assert.equal(detectCountryFromHtml(html, FIXTURE_COUNTRIES), 'DE')
})

test('"@graph" array of nodes under one script block — matches the node that has an address', () => {
  const html = `<script type="application/ld+json">
    {"@context":"https://schema.org","@graph":[
      {"@type":"WebSite","name":"Acme"},
      {"@type":"Organization","address":{"addressCountry":"US"}}
    ]}
  </script>`
  assert.equal(detectCountryFromHtml(html, FIXTURE_COUNTRIES), 'US')
})

test('no JSON-LD at all, or address without a recognizable country, returns null (not a guess)', () => {
  assert.equal(detectCountryFromHtml('<html><body>no ld+json here</body></html>', FIXTURE_COUNTRIES), null)
  assert.equal(detectCountryFromHtml('', FIXTURE_COUNTRIES), null)
  const html = `<script type="application/ld+json">{"address":{"addressCountry":"Narnia"}}</script>`
  assert.equal(detectCountryFromHtml(html, FIXTURE_COUNTRIES), null)
})

// ── countryFromTld: ccTLD heuristic ──────────────────────────────────────────

test('ccTLD maps to the matching country code', () => {
  assert.equal(countryFromTld('https://shop.example.de/', FIXTURE_COUNTRIES), 'DE')
  assert.equal(countryFromTld('https://boutique.example.fr/', FIXTURE_COUNTRIES), 'FR')
})

test('the .uk exception: United Kingdom uses .uk, not .gb (GB has no ccTLD of its own)', () => {
  assert.equal(countryFromTld('https://shop.example.co.uk/', FIXTURE_COUNTRIES), 'GB')
  assert.equal(countryFromTld('https://shop.example.uk/', FIXTURE_COUNTRIES), 'GB')
})

test('generic TLDs (.com/.org/.net/.io) are NOT ccTLDs and resolve to null, never a guess', () => {
  for (const url of ['https://example.com/', 'https://example.org/', 'https://example.net/', 'https://example.io/']) {
    assert.equal(countryFromTld(url, FIXTURE_COUNTRIES), null, url)
  }
})

test('invalid URL does not throw', () => {
  assert.equal(countryFromTld('not a url', FIXTURE_COUNTRIES), null)
})

test('countryFromTld only knows the ccTLDs present in the countries map it is given', () => {
  // FIXTURE_COUNTRIES has no Poland — .pl must stay unmapped with this fixture,
  // proving the map is built FROM the parameter, not a hardcoded duplicate of
  // the full 19-country list.
  assert.equal(countryFromTld('https://example.pl/', FIXTURE_COUNTRIES), null)
})

test('against the REAL taxonomies.json countries (default param): every one of the 19 markets ccTLDs, plus the .uk exception', () => {
  const cases = [
    ['https://example.at/', 'AT'], ['https://example.com.au/', 'AU'], ['https://example.be/', 'BE'],
    ['https://example.ca/', 'CA'], ['https://example.ch/', 'CH'], ['https://example.de/', 'DE'],
    ['https://example.dk/', 'DK'], ['https://example.es/', 'ES'], ['https://example.fi/', 'FI'],
    ['https://example.fr/', 'FR'], ['https://example.co.uk/', 'GB'], ['https://example.ie/', 'IE'],
    ['https://example.co.in/', 'IN'], ['https://example.it/', 'IT'], ['https://example.nl/', 'NL'],
    ['https://example.no/', 'NO'], ['https://example.pl/', 'PL'], ['https://example.se/', 'SE'],
    ['https://example.us/', 'US'],
  ]
  for (const [url, code] of cases) assert.equal(countryFromTld(url), code, url)
})

// ── resolveCountry: priority order, override wins over everything ──────────

test('resolveCountry: no html/url signal at all falls back to honest unknown', () => {
  assert.deepEqual(resolveCountry({}, FIXTURE_COUNTRIES), { code: null, source: 'unknown' })
})

test('resolveCountry: TLD used when no override and no schema-org match', () => {
  const out = resolveCountry({ html: '<html></html>', url: 'https://shop.example.de/' }, FIXTURE_COUNTRIES)
  assert.deepEqual(out, { code: 'DE', source: 'tld' })
})

test('resolveCountry: schema-org wins over TLD when both are present and disagree', () => {
  const html = `<script type="application/ld+json">{"address":{"addressCountry":"US"}}</script>`
  const out = resolveCountry({ html, url: 'https://shop.example.de/' }, FIXTURE_COUNTRIES)
  assert.deepEqual(out, { code: 'US', source: 'schema-org' })
})

test('resolveCountry: user override wins over schema-org AND TLD, even when both disagree with it', () => {
  const html = `<script type="application/ld+json">{"address":{"addressCountry":"US"}}</script>`
  const out = resolveCountry(
    { html, url: 'https://shop.example.de/', countryCodeOverride: 'FR' },
    FIXTURE_COUNTRIES,
  )
  assert.deepEqual(out, { code: 'FR', source: 'user-override' })
})

test('resolveCountry: override is case/whitespace-insensitive, same rubric as jurisdiction.js', () => {
  for (const raw of ['de', ' DE ', 'De']) {
    assert.deepEqual(resolveCountry({ countryCodeOverride: raw }, FIXTURE_COUNTRIES), { code: 'DE', source: 'user-override' })
  }
})

test('resolveCountry: unknown/empty/non-string override silently falls back, never fails the scan', () => {
  for (const bad of ['ZZ', '', '   ', null, undefined, 42, {}]) {
    const out = resolveCountry(
      { html: '<html></html>', url: 'https://shop.example.de/', countryCodeOverride: bad },
      FIXTURE_COUNTRIES,
    )
    assert.deepEqual(out, { code: 'DE', source: 'tld' }, String(bad))
  }
})

test('resolveCountry: final honest unknown when nothing matches at all', () => {
  const out = resolveCountry({ html: '<html></html>', url: 'https://example.com/' }, FIXTURE_COUNTRIES)
  assert.deepEqual(out, { code: null, source: 'unknown' })
})

test('resolveCountry: default countries parameter is the real taxonomies.json (US override resolves without a fixture)', () => {
  assert.deepEqual(resolveCountry({ countryCodeOverride: 'US' }), { code: 'US', source: 'user-override' })
})
