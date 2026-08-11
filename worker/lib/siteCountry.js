// A4-SITE-COUNTRY: detects which country a scanned site belongs to, so the
// REPAIR-COST estimate on the report can show a currency that matches the
// site instead of always €. This is a SEPARATE module from jurisdiction.js —
// do NOT merge them. jurisdiction.js's TLD table is deliberately narrow for a
// LEGAL reason (only jurisdictions with a confirmed EAA-transposition
// statement requirement, see its header); this module's job is purely "which
// of our 19 markets does this site most likely serve", for currency display —
// a much lower-stakes, best-effort question, so its TLD map can (and does)
// cover all 19 countries, not just the legally-verified subset.
//
// Same "explicit override always wins" pattern as jurisdiction.js's
// resolveJurisdiction (D-032): user-override > schema-org > TLD > unknown.
// Country data is NOT reinvented here — `countries` is taxonomies.json's
// `countries` object (data/a11y/types.ts CountryMeta), passed as a parameter
// with a default from the real import, same style as
// worker/lib/matchAgenciesServer.js (pool/tax params) and pdfPlan.js — tests
// can inject small fixtures instead of depending on the live 19-country file.

import taxonomiesJson from '../../data/a11y/taxonomies.json' with { type: 'json' }

const DEFAULT_COUNTRIES = taxonomiesJson.countries

const JSON_LD_BLOCK_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

// schema.org allows a single node OR a top-level array OR an "@graph" array
// of nodes under one <script> block (all three are seen in the wild — a
// WebSite node next to an Organization node is a common real-world pairing).
// We don't invent support for anything beyond that: a node that is neither an
// array nor has @graph is just itself.
function candidateNodes(parsed) {
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed['@graph'])) return parsed['@graph']
  return [parsed]
}

// addressCountry may be a bare 2-letter/full-name string, or a schema.org
// Country object ({"@type":"Country","name":"United States"}) — both shapes
// are legal schema.org, both seen in real Organization/LocalBusiness markup.
function normalizeCountryValue(raw, countries) {
  let value = raw
  if (value && typeof value === 'object') value = value.name
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const upper = trimmed.toUpperCase()
  if (countries[upper]) return upper
  const lower = trimmed.toLowerCase()
  for (const [code, meta] of Object.entries(countries)) {
    if (meta?.name?.en && meta.name.en.toLowerCase() === lower) return code
  }
  return null
}

// Extracts address.addressCountry from JSON-LD <script> blocks in crawled
// HTML. Real-world JSON-LD is often malformed (trailing commas, truncated
// blocks, unrelated JS mistakenly tagged) — a parse failure on one block must
// never crash the scan, it just means we keep scanning the rest.
export function detectCountryFromHtml(html, countries = DEFAULT_COUNTRIES) {
  if (typeof html !== 'string' || !html) return null
  const blocks = html.matchAll(JSON_LD_BLOCK_RE)
  for (const [, raw] of blocks) {
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      continue // malformed block — not this one's problem, keep scanning
    }
    for (const node of candidateNodes(parsed)) {
      const addressCountry = node?.address?.addressCountry
      if (addressCountry == null) continue // e.g. a WebSite node with no address at all
      const code = normalizeCountryValue(addressCountry, countries)
      if (code) return code
    }
  }
  return null
}

// ccTLD -> country code, built FROM the countries map passed in (not a
// hardcoded duplicate of it) so a test fixture with fewer countries gets a
// correspondingly smaller map. lowercased country code == ccTLD for every one
// of our 19 markets except the United Kingdom, which uses .uk, not .gb — the
// one explicit exception, not a general rule. Generic TLDs (.com/.org/.net/
// .io/…) are deliberately absent: same principle jurisdiction.js documents
// for why a .com site can't be identified by domain at all.
function buildCcTldMap(countries) {
  const map = {}
  for (const code of Object.keys(countries)) {
    if (code === 'GB') {
      map.uk = 'GB'
      continue
    }
    map[code.toLowerCase()] = code
  }
  return map
}

export function countryFromTld(url, countries = DEFAULT_COUNTRIES) {
  let hostname
  try {
    hostname = new URL(url).hostname
  } catch {
    return null
  }
  const tld = hostname.split('.').pop()?.toLowerCase()
  if (!tld) return null
  return buildCcTldMap(countries)[tld] ?? null
}

// The single entry point scanSite() calls. Priority order mirrors
// resolveJurisdiction (D-032): an explicit user-supplied country (the same
// countryCode field already accepted by POST /api/scan for jurisdiction, see
// worker/routes/scan.js) always wins over any inference, because the person
// running the scan knows their own site better than any heuristic can.
// Validation is the same "case/whitespace-insensitive, unknown code silently
// ignored" shape as resolveJurisdiction — a select value, not a strict
// contract worth failing a scan over.
export function resolveCountry({ html, url, countryCodeOverride } = {}, countries = DEFAULT_COUNTRIES) {
  if (typeof countryCodeOverride === 'string') {
    const code = countryCodeOverride.trim().toUpperCase()
    if (countries[code]) return { code, source: 'user-override' }
  }
  const schemaCode = detectCountryFromHtml(html, countries)
  if (schemaCode) return { code: schemaCode, source: 'schema-org' }
  const tldCode = countryFromTld(url, countries)
  if (tldCode) return { code: tldCode, source: 'tld' }
  return { code: null, source: 'unknown' } // honest fallback — never guess
}
