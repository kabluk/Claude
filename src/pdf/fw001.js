// FW-001 — Request to Waive Court Fees (Judicial Council of California).
//
// The filer's own request to have the superior-court filing fee (and related
// fees) waived. Eligibility basis comes from the shared fee-waiver evaluation
// (src/data/feeWaiver.js): a listed public benefit (item 5a), income at/below
// the published limit (item 5b), or a declared inability to pay (item 5c).
//
// Single source: caption/parties from the case profile; benefits/income from the
// fee-waiver step. We fill NAMED AcroForm fields only.

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { countyInfo } from './../data/counties.js'
import { buildPartyContact } from './party.js'
import { evaluateFeeWaiver, FEE_WAIVER_BENEFITS } from '../data/feeWaiver.js'

function parseDate(s) {
  if (!s) return null
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s)
  if (m) return new Date(+m[3], +m[1] - 1, +m[2])
  return null
}
const fmtDateUS = (s) => {
  const d = parseDate(s)
  return d
    ? `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
    : s || ''
}
const money = (n) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '')

const parseList = (raw) => {
  try {
    const r = JSON.parse(raw || '[]')
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}

export function buildFW001Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)
  const court = countyInfo(user.county) || {}

  const benefits = parseList(a.fee_waiver_benefits)
  const evalResult = evaluateFeeWaiver({
    benefits,
    monthlyIncome: a.fee_waiver_income,
    householdSize: a.fee_waiver_household,
  })
  const wantsAll = (a.fee_waiver_request || 'all').toLowerCase() // all | some | payments

  const profile = {
    // ---- caption ----
    court_county: user.county || '',
    court_street: court.street || '',
    court_city_zip: court.cityZip || '',
    case_number: '',
    case_name: [a.petitioner_name, a.respondent_name].filter(Boolean).join(' and '),

    // ---- item 1: your information (the filer) ----
    party_name: c.party_name,
    party_street: c.party_street,
    party_city: c.party_city,
    party_state: c.party_state,
    party_zip: c.party_zip,
    party_phone: c.party_phone,

    // ---- item 4: fees to waive (dissolution is filed in superior court) ----
    waive_superior: true,

    // ---- item 5a: public benefits ----
    benefit_received: evalResult.basis === 'benefits',

    // ---- item 5b: income at/below the published limit ----
    income_below: evalResult.basis === 'income',

    // ---- item 5c: request type (only when neither 5a nor 5b applies) ----
    insufficient_income: evalResult.basis === null && !!a.fee_waiver_requested,
    request_waive_all: evalResult.basis === null && wantsAll === 'all',
    request_waive_some: evalResult.basis === null && wantsAll === 'some',
    request_payments: evalResult.basis === null && wantsAll === 'payments',

    // ---- signature ----
    sig_date: fmtDateUS(a.fee_waiver_sig_date || a.signature_date),
    sig_name: c.party_name,

    // ---- page 2 caption ----
    p2_name: c.party_name,
    p2_case_number: '',

    // ---- page 2 income (only meaningful when 5b/5c chosen; harmless otherwise) ----
    total_income: money(a.fee_waiver_income),
    household_total: money(a.fee_waiver_income),
  }

  // Per-benefit checkboxes (item 5a).
  for (const b of FEE_WAIVER_BENEFITS) {
    profile[`benefit_${b.key}`] = benefits.includes(b.key)
  }

  return profile
}

// FW-001 is added to the packet when the filer qualifies for, or explicitly
// requests, a fee waiver.
export function fw001Required({ answers = [] } = {}) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  if (a.fee_waiver_requested) return true
  const benefits = parseList(a.fee_waiver_benefits)
  return evaluateFeeWaiver({
    benefits,
    monthlyIncome: a.fee_waiver_income,
    householdSize: a.fee_waiver_household,
  }).eligible
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const P1 = (s) => `FW-001[0].Page1[0].${s}`
const P2 = (s) => `FW-001[0].Page2[0].${s}`
const B = (s) => `FW-001[0].Page1[0].List5[0].Lia[0].${s}`

export const FW001_MAPPING = {
  // caption
  court_county: P1('RightCaption[0].CourtInfo[0]'),
  case_number: [P1('RightCaption[0].CaseNumber[0]'), P2('pXCaption[0].CaseNumber[0]')],
  case_name: P1('RightCaption[0].CaseName[0]'),

  // item 1
  party_name: P1('List1[0].item1[0].PetitionerName1[0]'),
  party_street: P1('List1[0].item1[0].PetitionerStrAddress[0]'),
  party_city: P1('List1[0].item1[0].PetitionerCity[0]'),
  party_state: P1('List1[0].item1[0].PetitionerState[0]'),
  party_zip: P1('List1[0].item1[0].PetitionerZip[0]'),
  party_phone: P1('List1[0].item1[0].PetitionerTel[0]'),

  // item 4
  waive_superior: P1('List4[0].item4[0].WaiveSuperiorCrtFee[0]'),

  // item 5a benefits
  benefit_received: B('PublicBenefitReceived[0]'),
  benefit_snap: B('PublicBenefitSNAP[0]'),
  benefit_ssi: B('PublicBenefitSSI[0]'),
  benefit_ssp: B('PublicBenefitSSP[0]'),
  benefit_medical: B('PublicBenefitMediCal[0]'),
  benefit_county_ga: B('PublicBenefitCtyGA[0]'),
  benefit_ihss: B('PublicBenefitIHHS[0]'),
  benefit_calworks: B('PublicBenefitCalWORKSTANF[0]'),
  benefit_capi: B('PublicBenefitCAPI11[0]'),
  benefit_wic: B('PublicBenefitCAPI12[0]'),
  benefit_unemployment: B('PublicBenefitCAPI13[0]'),

  // item 5b income
  income_below: P1('List5[0].Lib[0].GrossMonthIncomeLess[0]'),

  // item 5c request
  insufficient_income: P1('List5[0].Lic[0].IncomeInsufficientRequest[0]'),
  request_waive_all: P1('List5[0].Lic[0].FeeRequestDef[0]'),
  request_waive_some: P1('List5[0].Lic[0].FeeRequestDef[1]'),
  request_payments: P1('List5[0].Lic[0].FeeRequestDef[2]'),

  // signature (item at bottom of page 1)
  sig_date: P1('Sign[0].SigDate[0]'),
  sig_name: P1('Sign[0].PetitionerName[0]'),

  // page 2 caption + income totals
  p2_name: P2('pXCaption[0].PetitionerName1[0]'),
  total_income: P2('List8[0].Lib[0].TotalIncome[0]'),
  household_total: P2('List9[0].Lib[0].TotalAllIncome[0]'),
}

export const FW001_TEMPLATE = {
  id: 'FW-001',
  title: 'Request to Waive Court Fees',
  url: '/forms/FW-001.pdf',
  revision: 'Rev. March 1, 2026',
  checkedOn: '07/13/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fw001.pdf',
  sourceSha256: '8673409dc980bade5c3c534d0b6523e1abde4355f3fa72128dee85dc8ac3ce66',
  mapping: FW001_MAPPING,
}

registerForm(FW001_TEMPLATE)

export async function generateFW001(state) {
  const profile = buildFW001Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FW-001', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
