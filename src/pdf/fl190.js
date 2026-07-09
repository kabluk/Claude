// FL-190 — Notice of Entry of Judgment.
//
// Filed together with FL-180. The clerk fills in the entry date, clerk stamp and
// certificate of mailing and returns a conformed copy; the party only prepares
// the caption, the judgment type, and the parties' names/addresses so the clerk
// can mail conformed copies. Completion-stage form (with FL-180 + FL-141).
//
// Single source: caption + judgment type + parties are identical to FL-180.

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

export function buildFL190Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)
  const court = countyInfo(user.county) || {}

  const isDissolution = caseRec.type === 'uncontested' || caseRec.type === 'contested'

  // Mailing block for each party (name + address) so the clerk can mail
  // conformed copies. Petitioner's address comes from the shared profile;
  // respondent's only if we have it.
  const petCityStateZip =
    [c.party_city, c.party_state].filter(Boolean).join(', ') +
    (c.party_zip ? ` ${c.party_zip}` : '')
  const petitionerMailing = [c.party_name, c.party_street, petCityStateZip]
    .filter((s) => s && s.trim())
    .join('\n')

  const respCityStateZip =
    [a.respondent_city, a.respondent_state].filter(Boolean).join(', ') +
    (a.respondent_zip ? ` ${a.respondent_zip}` : '')
  const respondentMailing = [
    a.respondent_name || '',
    a.respondent_street || a.respondent_address || '',
    respCityStateZip,
  ]
    .filter((s) => s && s.trim())
    .join('\n')

  return {
    // ---- caption (single source, shared with FL-180) ----
    party_name: c.party_name,
    party_street: c.party_street,
    party_city: c.party_city,
    party_state: c.party_state,
    party_zip: c.party_zip,
    party_phone: c.party_phone,
    party_email: c.party_email,
    attorney_for: c.attorney_for, // "Self (Pro Per)"
    court_county: user.county || '',
    court_street: court.street || '',
    court_mailing: court.mailing || '',
    court_city_zip: court.cityZip || '',
    court_branch: court.branch || '',
    petitioner_name: a.petitioner_name || '',
    respondent_name: a.respondent_name || '', // NB: caption "Respondent 1" = Party3
    case_number: '',

    // ---- judgment type (matches FL-180) ----
    jt_dissolution: isDissolution,

    // ---- effective date of termination of marital status (from FL-180 source) ----
    marital_status_end_date: fmtDateUS(a.marital_status_end_date),

    // ---- mailing addresses of the parties (notice goes to both) ----
    petitioner_mailing: petitionerMailing,
    respondent_mailing: respondentMailing,

    // Entry date, clerk stamp and certificate of mailing are left EMPTY — the
    // court completes them when the judgment is entered / copies are mailed.
  }
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const P = (s) => `FL-190[0].Page1[0].${s}`

export const FL190_MAPPING = {
  // caption — party / attorney box (separate fields)
  party_name: P('PartyAtty[0].Name[0]'),
  party_street: P('PartyAtty[0].Street[0]'),
  party_city: P('PartyAtty[0].City[0]'),
  party_state: P('PartyAtty[0].State[0]'),
  party_zip: P('PartyAtty[0].Zip[0]'),
  party_phone: P('PartyAtty[0].Phone[0]'),
  party_email: P('PartyAtty[0].Email[0]'),
  attorney_for: P('PartyAtty[0].AttyFor[0]'),
  court_county: P('CourtInfo[0].CrtCounty[0]'),
  court_street: P('CourtInfo[0].CrtStreet[0]'),
  court_mailing: P('CourtInfo[0].CrtMailingAdd[0]'),
  court_city_zip: P('CourtInfo[0].CrtCityZip[0]'),
  court_branch: P('CourtInfo[0].CrtBranch[0]'),
  petitioner_name: P('TitlePartyName[0].Party1[0]'), // Petitioner 1
  respondent_name: P('TitlePartyName[0].Party3[0]'), // Respondent 1
  case_number: P('CaseNumber[0].CaseNumber[0]'),

  // judgment type entered
  jt_dissolution: P('List1[0].LI1[0].Dissolution_cb[0]'),

  // effective date of termination of marital status
  marital_status_end_date: P('Statements[0].Effective_date_terminate_marital_status_dt[0]'),

  // parties' names + addresses for mailing conformed copies
  petitioner_mailing: P('Name_and_address_of_petitioner1_or_attorney_ft[0]'),
  respondent_mailing: P('Name_and_address_of_respondent_or_attorney_ft[0]'),
}

export const FL190_TEMPLATE = {
  id: 'FL-190',
  title: 'Notice of Entry of Judgment',
  url: '/forms/FL-190.pdf',
  revision: 'Rev. July 1, 2026',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl190.pdf',
  sourceSha256: '2013355ba33e41ea143846f250a0c63cd6686c6eb96823e617d383c6ff8c6f59',
  mapping: FL190_MAPPING,
}

registerForm(FL190_TEMPLATE)

export async function generateFL190(state) {
  const profile = buildFL190Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-190', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
