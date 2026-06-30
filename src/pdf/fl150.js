// FL-150 — Income and Expense Declaration (the petitioner's own declaration).
//
// Same engine path as the other forms: registerForm + real AcroForm fields.
// We fill only what the case reliably provides (caption, petitioner's gross
// monthly pay, the other party's estimated income, total monthly expenses,
// signature). The detailed item-11 income grid is left for the filer; aggregate
// figures come from the single financial source (wizard income/expenses).

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { countyInfo } from '../data/counties.js'
import { buildPartyContact } from './party.js'

function parseDate(s) {
  if (!s) return null
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s)
  if (m) return new Date(+m[3], +m[1] - 1, +m[2])
  return null
}
function fmtDateUS(s) {
  const d = parseDate(s)
  if (!d) return s || ''
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}
// Dollar amounts: the "$" is preprinted on the form, so output the number only.
function money(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || !String(v).trim()) return ''
  return n.toLocaleString('en-US')
}

export function buildFL150Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a) // single-source petitioner contact
  const court = countyInfo(user.county) || {}

  return {
    // caption
    party_name: c.party_name,
    party_street: c.party_street,
    party_city: c.party_city,
    party_state: c.party_state,
    party_zip: c.party_zip,
    party_phone: c.party_phone,
    party_email: c.party_email,
    attorney_for: c.attorney_for,
    court_county: user.county || '',
    court_street: court.street || '',
    court_mailing: court.mailing || '',
    court_city_zip: court.cityZip || '',
    court_branch: court.branch || '',
    petitioner_name: a.petitioner_name || '',
    respondent_name: a.respondent_name || '',
    case_number: '', // assigned by the court at filing

    // §8 employment — gross pay
    petitioner_income: money(a.petitioner_income),
    income_per_month: !!String(a.petitioner_income || '').trim(),

    // other party's estimated gross monthly income
    respondent_income: money(a.respondent_income),

    // total monthly expenses (aggregate from the wizard)
    monthly_expenses: money(a.monthly_expenses),
    expenses_actual: !!String(a.monthly_expenses || '').trim(),

    // signature
    signature_date: fmtDateUS(a.signature_date),
    petitioner_printed_name: a.petitioner_name || '',
  }
}

// ---- real PDF field names (inspectFormFields('FL-150'); /TU-verified) ----
const P1 = (s) => `FL-150[0].Page1[0].${s}`
const H = (s) => P1(`StdP1Header_sf[0].${s}`) // page-1 caption
const PX = (n, s) => `FL-150[0].Page${n}[0].PxCaption_sf[0].${s}` // pages 2–4 caption

export const FL150_MAPPING = {
  // caption — petitioner contact (single source, same as other forms)
  party_name: H('AttyInfo[0].AttyName_ft[0]'),
  party_street: H('AttyInfo[0].AttyStreet_ft[0]'),
  party_city: H('AttyInfo[0].AttyCity_ft[0]'),
  party_state: H('AttyInfo[0].AttyState_ft[0]'),
  party_zip: H('AttyInfo[0].AttyZip_ft[0]'),
  party_phone: H('AttyInfo[0].Phone_ft[0]'),
  party_email: H('AttyInfo[0].Email_ft[0]'),
  attorney_for: H('AttyInfo[0].AttyFor_ft[0]'),
  // caption — court
  court_county: H('CourtInfo[0].CrtCounty_ft[0]'),
  court_street: H('CourtInfo[0].Street_ft[0]'),
  court_mailing: H('CourtInfo[0].MailingAdd_ft[0]'),
  court_city_zip: H('CourtInfo[0].CityZip_ft[0]'),
  court_branch: H('CourtInfo[0].Branch_ft[0]'),
  // caption — parties + case number (running header on all 4 pages)
  petitioner_name: [
    H('TitlePartyName[0].Party1_ft[0]'),
    PX(2, 'TitlePartyName[0].Party1_ft[0]'),
    PX(3, 'TitlePartyName[0].Party1_ft[0]'),
    PX(4, 'TitlePartyName[0].Party1_ft[0]'),
  ],
  respondent_name: [
    H('TitlePartyName[0].Party2_ft[0]'),
    PX(2, 'TitlePartyName[0].Party2_ft[0]'),
    PX(3, 'TitlePartyName[0].Party2_ft[0]'),
    PX(4, 'TitlePartyName[0].Party2_ft[0]'),
  ],
  case_number: [
    H('CaseNumber[0].CaseNumber_ft[0]'),
    PX(2, 'CaseNumber[0].CaseNumber_ft[0]'),
    PX(3, 'CaseNumber[0].CaseNumber_ft[0]'),
    PX(4, 'CaseNumber[0].CaseNumber_ft[0]'),
  ],

  // §8 "I get paid $___ per month" (employment gross pay)
  petitioner_income: P1('List1[0].Li8[0].gross_tf[0]'),
  income_per_month: P1('List1[0].Li8[0].Gross_cb[0]'), // "per month"
  // other party's estimated gross monthly income
  respondent_income: P1('List4[0].Li1[0].FillTextincm[0]'),
  // total monthly expenses + "Actual expenses" checkbox (page 3, item 17)
  monthly_expenses: 'FL-150[0].Page3[0].List13[0].Li18[0].TOTAL[0]',
  expenses_actual: 'FL-150[0].Page3[0].List13[0].MonthEx_cb[1]',

  // signature
  signature_date: P1('Signdate[0]'),
  petitioner_printed_name: P1('FillText56[0]'), // (TYPE OR PRINT NAME)
}

export const FL150_TEMPLATE = {
  id: 'FL-150',
  title: 'Income and Expense Declaration',
  url: '/forms/FL-150.pdf',
  revision: 'Rev. September 1, 2024', // confirmed from footer
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl150.pdf',
  sourceSha256: '46ca00246ae0f26ad893ce3ded2bd502fd6df299258b02070395cc597a3f68b4',
  mapping: FL150_MAPPING,
}

registerForm(FL150_TEMPLATE)

export async function generateFL150(state) {
  const profile = buildFL150Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-150', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
