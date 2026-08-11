import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  EUR_REFERENCE_RATES, EUR_REFERENCE_RATES_DATE, convertFromEur, conversionDisclaimer,
} from './currency.ts'

// D-126: exactly the 10 non-EUR currencies used by the 19-country taxonomy
// (data/a11y/taxonomies.json currency.code values, minus the 9 eurozone
// members which need no conversion at all). A rate silently missing here
// would make formatCostEstimate degrade to the raw EUR number for that
// currency — this test is the tripwire against that happening unnoticed.
test('every non-EUR currency used by taxonomies.json has a real rate', () => {
  const expected = ['USD', 'GBP', 'CHF', 'CAD', 'AUD', 'INR', 'NOK', 'SEK', 'PLN', 'DKK']
  for (const code of expected) {
    assert.equal(typeof EUR_REFERENCE_RATES[code], 'number', `${code} is missing a rate`)
    assert.ok(EUR_REFERENCE_RATES[code] > 0, `${code} rate must be positive`)
  }
  assert.equal(Object.keys(EUR_REFERENCE_RATES).length, expected.length, 'no stray/unused entries')
})

test('convertFromEur: EUR itself is the identity (not a table lookup)', () => {
  assert.equal(convertFromEur(30000, 'EUR'), 30000)
})

test('convertFromEur: multiplies by the real fetched rate', () => {
  assert.equal(convertFromEur(1000, 'USD'), 1000 * EUR_REFERENCE_RATES.USD)
  assert.equal(convertFromEur(1000, 'DKK'), 1000 * EUR_REFERENCE_RATES.DKK)
})

test('convertFromEur: unknown currency code returns null — never a wrong number, never a crash', () => {
  assert.equal(convertFromEur(1000, 'ZZZ'), null)
  assert.equal(convertFromEur(1000, ''), null)
})

test('conversionDisclaimer: honest about being an approximation with a dated source, not a live rate', () => {
  const text = conversionDisclaimer()
  assert.match(text, /ECB/)
  assert.match(text, new RegExp(EUR_REFERENCE_RATES_DATE))
  assert.match(text, /approximate|not a live rate/i)
})

test('conversionDisclaimer accepts a custom date without hardcoding the module constant', () => {
  assert.match(conversionDisclaimer('2030-01-01'), /2030-01-01/)
})
