// Court fee-waiver eligibility — MECHANICAL evaluation, single source for FW-001.
//
// California waives superior-court filing fees for filers who (a) receive a
// listed public benefit, OR (b) whose gross monthly household income is at or
// below the published limit (125% of the federal poverty level), OR (c) who
// declare their income is insufficient for basic needs + fees (a self-assessment
// that requires the page-2 financials and a court judgment call).
//
// This module reports the FACTS (which basis applies, the income limit for the
// household size) — it never advises. Thresholds are VERIFIED in research.md.
//
// SOURCE of the income table: form FW-001 "Request to Waive Court Fees"
// (Judicial Council of California), item 5b, Rev. March 1, 2026. Checked
// 07/13/2026 against courts.ca.gov/documents/fw001.pdf.

export const FEE_WAIVER_INCOME = {
  source: 'FW-001 Request to Waive Court Fees (Judicial Council of California), item 5b',
  revision: 'Rev. March 1, 2026',
  checkedOn: '07/13/2026',
  // Monthly gross household income limit by family size.
  base: { 1: 2660.0, 2: 3606.67, 3: 4553.33, 4: 5500.0, 5: 6446.67, 6: 7393.33 },
  eachAdditional: 946.67,
}

// The public benefits listed on FW-001 item 5a → their PDF checkbox suffix.
export const FEE_WAIVER_BENEFITS = [
  { key: 'snap', field: 'PublicBenefitSNAP' },
  { key: 'ssi', field: 'PublicBenefitSSI' },
  { key: 'ssp', field: 'PublicBenefitSSP' },
  { key: 'medical', field: 'PublicBenefitMediCal' },
  { key: 'county_ga', field: 'PublicBenefitCtyGA' },
  { key: 'ihss', field: 'PublicBenefitIHHS' },
  { key: 'calworks', field: 'PublicBenefitCalWORKSTANF' },
  { key: 'capi', field: 'PublicBenefitCAPI11' },
  { key: 'wic', field: 'PublicBenefitCAPI12' },
  { key: 'unemployment', field: 'PublicBenefitCAPI13' },
]
const BENEFIT_KEYS = new Set(FEE_WAIVER_BENEFITS.map((b) => b.key))

// Monthly gross household income limit for a given household size.
export function monthlyIncomeLimit(householdSize) {
  const n = Math.max(1, Math.floor(Number(householdSize) || 1))
  if (n <= 6) return FEE_WAIVER_INCOME.base[n]
  return FEE_WAIVER_INCOME.base[6] + (n - 6) * FEE_WAIVER_INCOME.eachAdditional
}

// evaluate({ benefits: string[], monthlyIncome, householdSize }) →
//   { eligible, basis: 'benefits'|'income'|null, limit, benefits, monthlyIncome, householdSize }
// basis 'insufficient' (FW-001 item 5c) is a self-declaration + court call, so it
// is NOT auto-derived here — it is offered as an explicit choice in the UI.
export function evaluateFeeWaiver({ benefits = [], monthlyIncome, householdSize = 1 } = {}) {
  const chosen = (Array.isArray(benefits) ? benefits : []).filter((b) => BENEFIT_KEYS.has(b))
  const hasBenefit = chosen.length > 0
  const limit = monthlyIncomeLimit(householdSize)
  const income = Number(monthlyIncome)
  const incomeQualifies = Number.isFinite(income) && income > 0 && income <= limit
  return {
    eligible: hasBenefit || incomeQualifies,
    basis: hasBenefit ? 'benefits' : incomeQualifies ? 'income' : null,
    limit,
    benefits: chosen,
    monthlyIncome: Number.isFinite(income) ? income : null,
    householdSize: Math.max(1, Math.floor(Number(householdSize) || 1)),
  }
}
