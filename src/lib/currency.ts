// A4-SITE-COUNTRY (D-126): EUR reference exchange rates, for converting the
// repair-cost estimate (always computed in EUR internally, src/lib/
// costEstimate.ts) into the scanned site's local currency for display on
// /report/:id. Owner-reported bug: a US site (ladwp.com) showed "€30k+" —
// confusing for an American visitor who has never used a euro.
//
// These are REAL rates from a citable public source — never invented. This
// project has a hard rule against fabricating numbers where a wrong one would
// be dishonest, not just buggy (see DECISIONS.md D-035/D-046 and the D-057/058
// pattern: a live fact-check before hardcoding a figure, with source + date
// recorded in a comment, exactly like this one).
//
// SOURCE: European Central Bank, euro foreign exchange reference rates.
//   https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
// Fetched 2026-08-11. The feed's own <Cube time="..."> date is 2026-08-10 —
// the ECB's most recently published business-day rate at fetch time (the
// daily feed does not always have same-day rates available yet, and does not
// publish on weekends/EU holidays). Units are [foreign currency] per 1 EUR,
// exactly as the ECB quotes them (EUR itself is never in this table — see
// convertFromEur below for why).
//
// THIS IS A POINT-IN-TIME SNAPSHOT, NOT A LIVE FEED. Nothing in this codebase
// re-fetches it on a schedule — a rate here can drift from the real market
// rate as time passes. Every UI surface that shows a converted amount MUST
// say so in the visible text (conversionDisclaimer below), not bury the
// caveat in this code comment alone — an honest currency conversion is
// useful; a conversion presented as live/current when it is a snapshot is not.
export const EUR_REFERENCE_RATES: Record<string, number> = {
  USD: 1.1555,
  GBP: 0.85565,
  CHF: 0.934,
  CAD: 1.6108,
  AUD: 1.6359,
  INR: 110.1228,
  NOK: 10.986,
  SEK: 10.9655,
  PLN: 4.2993,
  DKK: 7.4758,
}

export const EUR_REFERENCE_RATES_DATE = '2026-08-10'
export const EUR_REFERENCE_RATES_SOURCE_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'

// Converts a EUR amount into `code`. EUR has an implicit rate of 1 and is
// deliberately NOT a key in EUR_REFERENCE_RATES — the ECB quotes every other
// currency against EUR, not EUR against itself, and hardcoding "EUR: 1" next
// to real fetched numbers would blur which entries are real external data and
// which is a trivial identity — better kept as an explicit branch below.
// Returns null for any currency code this table has no rate for (e.g. a
// currency added to taxonomies.json in the future before this table is
// updated) — the caller must degrade honestly, never silently show a wrong
// number or crash.
export function convertFromEur(amountEur: number, code: string): number | null {
  if (code === 'EUR') return amountEur
  const rate = EUR_REFERENCE_RATES[code]
  return typeof rate === 'number' ? amountEur * rate : null
}

// Honest, user-facing disclaimer — every place a converted (non-EUR) amount
// is shown must surface wording like this, not just this file's code comment.
// `date` defaults to the rate table's own date but is a parameter so a caller
// showing several converted figures need not repeat the literal string.
export function conversionDisclaimer(date: string = EUR_REFERENCE_RATES_DATE): string {
  return `Converted from EUR at the ECB reference rate on ${date} — an approximate, point-in-time conversion, not a live rate.`
}
