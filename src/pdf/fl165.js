// FL-165 — Request to Enter Default.
//
// After the respondent is served (proved by FL-115) and files no response, the
// petitioner asks the clerk to enter the respondent's default. Includes the
// request, a declaration of mailing to the respondent, a memorandum of costs
// (waived here), and a declaration of the respondent's non-military status.
//
// Data source: parties/court (single case source) + the service-of-process
// record for the respondent's mailing address. The clerk's "For court use"
// boxes are left empty.

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { countyInfo } from './../data/counties.js'
import { buildPartyContact } from './party.js'

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

function respondentMailing(a) {
  const csz =
    [a.respondent_city, a.respondent_state].filter(Boolean).join(', ') +
    (a.respondent_zip ? ` ${a.respondent_zip}` : '')
  return [a.respondent_name, a.respondent_street || a.respondent_address, csz]
    .filter((s) => s && s.trim())
    .join(', ')
}

export function buildFL165Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)
  const court = countyInfo(user.county) || {}
  const name = a.petitioner_name || ''
  const sigDate = fmtDateUS(a.default_request_date || a.signature_date)

  return {
    // ---- caption (both pages) ----
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
    case_number: '',

    // ---- item 2/3: declaration re disclosure/financial attachments ----
    fl150_attached: true, // Income & Expense Declaration is attached (support at issue)
    fl160_not_attached: true, // we use FL-142, not FL-160
    decl_written_agreement: true, // consent case: issues resolved by written agreement (MSA)

    // ---- request signature ----
    request_date: sigDate,
    request_name: name,

    // ---- item 4: declaration of mailing to the respondent ----
    mailing_to_clerk: true,
    mailing_address: respondentMailing(a),
    mailing_date: sigDate,
    mailing_name: name,

    // ---- memorandum of costs (waived) ----
    costs_waived: true,
    costs_date: sigDate,
    costs_name: name,

    // ---- declaration of non-military status (parties in communication) ----
    nonmilitary_communication: true,
  }
}

// True for a default proceeding (no response filed).
export function fl165Required({ caseRec = {} } = {}) {
  return caseRec.type === 'uncontested' || caseRec.type === 'default'
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const CAP = (s) => `FL-165[0].Page1[0].P1Caption[0].${s}`
const P1 = (s) => `FL-165[0].Page1[0].${s}`
const P2 = (s) => `FL-165[0].Page2[0].${s}`

export const FL165_MAPPING = {
  // caption
  party_name: CAP('Wrap1[0].AttyPartyInfo[0].Name[0]'),
  party_street: CAP('Wrap1[0].AttyPartyInfo[0].Street[0]'),
  party_city: CAP('Wrap1[0].AttyPartyInfo[0].City[0]'),
  party_state: CAP('Wrap1[0].AttyPartyInfo[0].State[0]'),
  party_zip: CAP('Wrap1[0].AttyPartyInfo[0].Zip[0]'),
  party_phone: CAP('Wrap1[0].AttyPartyInfo[0].Phone[0]'),
  party_email: CAP('Wrap1[0].AttyPartyInfo[0].Email[0]'),
  attorney_for: CAP('Wrap1[0].AttyPartyInfo[0].AttyFor[0]'),
  court_county: CAP('Wrap2[0].CourtInfo[0].CrtCounty[0]'),
  court_street: CAP('Wrap2[0].CourtInfo[0].CrtStreet[0]'),
  court_mailing: CAP('Wrap2[0].CourtInfo[0].CrtMailingAdd[0]'),
  court_city_zip: CAP('Wrap2[0].CourtInfo[0].CrtCityZip[0]'),
  court_branch: CAP('Wrap2[0].CourtInfo[0].CrtBranch[0]'),
  petitioner_name: [CAP('Wrap3[0].TitlePartyName[0].Party1[0]'), P2('PxCaption[0].TitlePartyName[0].Party1[0]')],
  respondent_name: [CAP('Wrap3[0].TitlePartyName[0].Party2[0]'), P2('PxCaption[0].TitlePartyName[0].Party2[0]')],
  case_number: [CAP('Wrap6[0].CaseNumber[0].CaseNumber[0]'), P2('PxCaption[0].CaseNumber[0].CaseNumber[0]')],

  // item 2/3 declaration
  fl150_attached: P1('List2[0].Li1[0].Attached1[0]'),
  fl160_not_attached: P1('List3[0].Attached2[1]'),
  decl_written_agreement: P1('List3[0].Li2[0].CheckBox2[0]'),

  // request signature
  request_date: P1('SignSub1[0].SigDate[0]'),
  request_name: P1('SignSub1[0].SigName[0]'),

  // item 4 declaration of mailing
  mailing_to_clerk: P1('List4[0].Li2[0].CheckBox7[0]'),
  mailing_address: P1('List4[0].Li2[0].FillText1[0]'),
  mailing_date: P1('SignSub2[0].SigDate2[0]'),
  mailing_name: P1('SignSub2[0].SigName2[0]'),

  // memorandum of costs (waived) — page 2
  costs_waived: P2('List5[0].LI1[0].CheckBox1[0]'),
  costs_date: P2('List5[0].Signsub[0].SigDate5[0]'),
  costs_name: P2('List5[0].Signsub[0].SigName1[0]'),

  // declaration of non-military status — page 2
  nonmilitary_communication: P2('List6[0].LI2[0].CheckBox2[0]'),
}

export const FL165_TEMPLATE = {
  id: 'FL-165',
  title: 'Request to Enter Default',
  url: '/forms/FL-165.pdf',
  revision: 'Rev. July 1, 2025',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl165.pdf',
  sourceSha256: 'b548e04ff60828968cba241263cdf9dde750a4e52c965b91d2b4aa8c56ff193f',
  mapping: FL165_MAPPING,
}

registerForm(FL165_TEMPLATE)

export async function generateFL165(state) {
  const profile = buildFL165Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-165', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
