// FL-144 — Stipulation and Waiver of Final Declaration of Disclosure.
//
// A two-party AGREEMENT: both spouses stipulate to waive the FINAL declaration
// of disclosure under Family Code § 2105(d). The body (items 1–2) is entirely
// preprinted — there are no checkboxes to set — so the form only needs the
// caption plus BOTH parties' printed names in the signature block.
//
// Paired with FL-141: generate FL-144 only when the final disclosure is waived
// (fl141AddsFl144(state) === true). Names/court are the same single source as
// the rest of the packet.
//
// NOTE: this 2007-revision form has a SINGLE shared "Date:" field for the
// signature block (not one per party), so respondent_signature_date has no
// separate field — both parties sign as of that one date.

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
const fmtDateUS = (s) => {
  const d = parseDate(s)
  return d
    ? `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
    : s || ''
}

export function buildFL144Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)
  const court = countyInfo(user.county) || {}

  const cityStateZip =
    [c.party_city, c.party_state].filter(Boolean).join(', ') +
    (c.party_zip ? ` ${c.party_zip}` : '')
  const partyBlock = [c.party_name, c.party_street, cityStateZip]
    .filter((s) => s && s.trim())
    .join('\n')

  return {
    // ---- caption (single source) ----
    party_block: partyBlock,
    party_phone: c.party_phone,
    party_email: c.party_email,
    attorney_for: c.attorney_for, // "Self (Pro Per)"
    court_county: user.county || '',
    court_street: court.street || '',
    court_mailing: court.mailing || '',
    court_city_zip: court.cityZip || '',
    court_branch: court.branch || '',
    petitioner_name: a.petitioner_name || '',
    respondent_name: a.respondent_name || '',
    case_number: '',

    // ---- signature block: BOTH parties (the crux of a stipulation) ----
    signature_date: fmtDateUS(a.petitioner_signature_date || a.signature_date),
    petitioner_printed_name: a.petitioner_printed_name || a.petitioner_name || '',
    respondent_printed_name: a.respondent_printed_name || a.respondent_name || '',
  }
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const CAP = (s) => `FL-144[0].Page1[0].P1Caption[0].${s}`
const P = (s) => `FL-144[0].Page1[0].${s}`

export const FL144_MAPPING = {
  // caption
  party_block: CAP('AttyPartyInfo[0].TextField1[0]'),
  party_phone: CAP('AttyPartyInfo[0].Phone[0]'),
  party_email: CAP('AttyPartyInfo[0].Email[1]'), // Email[1] = e-mail; Email[0] = "attorney for"
  attorney_for: CAP('AttyPartyInfo[0].Email[0]'),
  court_county: CAP('CourtInfo[0].CrtCounty[0]'),
  court_street: CAP('CourtInfo[0].CrtStreet[0]'),
  court_mailing: CAP('CourtInfo[0].CrtMailingAdd[0]'),
  court_city_zip: CAP('CourtInfo[0].CrtCityZip[0]'),
  court_branch: CAP('CourtInfo[0].CrtBranch[0]'),
  petitioner_name: CAP('TitlePartyName[0].Party1[0]'),
  respondent_name: CAP('TitlePartyName[0].Party2[0]'),
  case_number: CAP('CaseNumber[0].CaseNumber[0]'),

  // signature block — one shared date, two printed names (petitioner then respondent)
  signature_date: P('SigDate[0]'),
  petitioner_printed_name: P('SigName[0]'), // upper row (SIGNATURE OF PETITIONER)
  respondent_printed_name: P('SigName[1]'), // lower row (SIGNATURE OF RESPONDENT)
}

export const FL144_TEMPLATE = {
  id: 'FL-144',
  title: 'Stipulation and Waiver of Final Declaration of Disclosure',
  url: '/forms/FL-144.pdf',
  revision: 'Rev. January 1, 2007',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl144.pdf',
  sourceSha256: '102991083d5e64762afd0161d797ac5329a6891cbf315d1ac59c51ffc021cb6c',
  mapping: FL144_MAPPING,
}

registerForm(FL144_TEMPLATE)

export async function generateFL144(state) {
  const profile = buildFL144Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-144', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
