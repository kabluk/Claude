// FL-140 — Declaration of Disclosure (Family Law).
//
// This is the COVER declaration that lists which disclosure documents are
// attached. IMPORTANT: FL-140 and its financial attachments are SERVED on the
// other party and are *not* filed with the court — only FL-141 (which states
// that service was completed) is filed. The form itself carries little data:
// the caption (single source, identical to the rest of the packet) plus a set
// of checkboxes for who is disclosing, the disclosure type, and which documents
// are attached.
//
// Data sources (single source, no duplication):
//   - buildPartyContact(answers)  → petitioner contact (same as FL-150/110/…)
//   - CountyInfo(user.county)     → court block
//   - 'fl140_profile' answer (JSON, optional) → overrides for disclosure_party,
//     disclosure_type and which attachments are checked.

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
const json = (s) => {
  try {
    return JSON.parse(s || '{}') || {}
  } catch {
    return {}
  }
}
// Default true unless explicitly disabled in the profile.
const onByDefault = (v) => v !== false && v !== 'false' && v !== 'no'

export function buildFL140Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)
  const court = countyInfo(user.county) || {}
  const fl = json(a.fl140_profile)

  // "ATTORNEY OR PARTY WITHOUT ATTORNEY" box: name + address, multi-line.
  const cityStateZip =
    [c.party_city, c.party_state].filter(Boolean).join(', ') +
    (c.party_zip ? ` ${c.party_zip}` : '')
  const partyBlock = [c.party_name, c.party_street, cityStateZip]
    .filter((s) => s && s.trim())
    .join('\n')

  // Who is disclosing — defaults to the app's user (the petitioner).
  const party = (fl.disclosure_party || 'Petitioner').toLowerCase()
  // Disclosure type — Preliminary by default (served with the Petition/Response).
  const type = (fl.disclosure_type || 'Preliminary').toLowerCase()

  // FL-142 (Schedule of Assets and Debts) is the usual choice for item 1; the
  // alternative is FL-160 (Property Declaration). Default to FL-142.
  const useFl160 = fl.attach_fl160 === true || fl.attach_fl160 === 'true'
  const useFl142 = fl.attach_fl142 === undefined ? !useFl160 : onByDefault(fl.attach_fl142)

  return {
    // ---- caption (single source) ----
    party_block: partyBlock,
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
    case_number: '', // assigned by the clerk; disclosure isn't filed anyway

    // ---- form title: whose / which declaration ----
    party_petitioner: party === 'petitioner',
    party_respondent: party === 'respondent',
    type_preliminary: type === 'preliminary',
    type_final: type === 'final',

    // ---- attached documents (item 1–6) ----
    attach_fl142: useFl142, // 1. Schedule of Assets and Debts (FL-142) …
    attach_fl160: useFl160, // 1. … or a Property Declaration (FL-160)
    fl160_community: useFl160 && onByDefault(fl.fl160_community),
    fl160_separate: useFl160 && fl.fl160_separate === true,
    attach_fl150: onByDefault(fl.attach_fl150), // 2. Income and Expense (FL-150)
    attach_tax_returns: onByDefault(fl.attach_tax_returns), // 3. tax returns
    attach_valuation_stmt: onByDefault(fl.attach_valuation_stmt), // 4. asset valuation
    attach_obligations_stmt: onByDefault(fl.attach_obligations_stmt), // 5. obligations
    attach_investment_disclosure: onByDefault(fl.attach_investment_disclosure), // 6. opportunities

    // ---- signature ----
    signature_date: fmtDateUS(a.signature_date),
    petitioner_printed_name: a.petitioner_name || '',
  }
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const H = (s) => `form1[0].Page1[0].StdP1Header_sf[0].${s}`
const D = (s) => `form1[0].Page1[0].Disclose_cb[0].${s}`

export const FL140_MAPPING = {
  // caption
  party_block: H('AddInfo[0].PartyAttyAddInfo_ft[0]'),
  party_phone: H('OtherContact[0].Phone_ft[0]'),
  party_email: H('OtherContact[0].Email_ft[0]'),
  attorney_for: H('OtherContact[0].AttyFor_ft[0]'),
  court_county: H('CourtInfo[0].CrtCounty_ft[0]'),
  court_street: H('CourtInfo[0].Street_ft[0]'),
  court_mailing: H('CourtInfo[0].MailingAdd_ft[0]'),
  court_city_zip: H('CourtInfo[0].CityZip_ft[0]'),
  court_branch: H('CourtInfo[0].Branch_ft[0]'),
  petitioner_name: H('TitlePartyName[0].Party1_ft[0]'),
  respondent_name: H('TitlePartyName[0].Party2_ft[0]'),
  case_number: H('CaseNumber[0].CaseNumber_ft[0]'),

  // form title — "[Petitioner's/Respondent's] [Preliminary/Final] Declaration"
  party_petitioner: H('FormTitle[0].caption_cb[0].CheckBox61[0]'),
  party_respondent: H('FormTitle[0].caption_cb[1].respondent_cb[0]'),
  type_preliminary: H('FormTitle[0].caption_cb[2].preliminary_cb[0]'),
  type_final: H('FormTitle[0].caption_cb[3].final_cb[0]'),

  // attached documents (verified by widget Y-coordinate → numbered row)
  attach_fl142: D('#area[2].Schedule_or_Prop_cb[0]'), // 1. FL-142
  attach_fl160: D('caption_cb[0].petitioner_cb[0]'), // 1. or FL-160
  fl160_community: D('#area[7].CheckBox61[1]'), // 1. Community & Quasi-Community
  fl160_separate: D('#area[8].CheckBox61[2]'), // 1. Separate Property
  attach_fl150: 'form1[0].Page1[0].Date_name_gp[0].IandE_cb[0]', // 2. FL-150
  attach_tax_returns: D('#area[3].taxreturns_cb[0]'), // 3. tax returns
  attach_valuation_stmt: D('#area[6].CheckBox61[0]'), // 4. asset valuation stmt
  attach_obligations_stmt: D('#area[4].obligations_stmt_cb[0]'), // 5. obligations stmt
  attach_investment_disclosure: D('#area[4].#area[5].investment_opp_db[0]'), // 6. opportunities

  // signature
  signature_date: 'form1[0].Page1[0].Date[0]',
  petitioner_printed_name: 'form1[0].Page1[0].print_name_ft[0]',
}

export const FL140_TEMPLATE = {
  id: 'FL-140',
  title: 'Declaration of Disclosure',
  url: '/forms/FL-140.pdf',
  revision: 'Rev. July 1, 2013',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl140.pdf',
  sourceSha256: 'cc2bf41e0debe1553d9fa202feb746f59c56440c8acecd098f6c903d4aaaba7d',
  mapping: FL140_MAPPING,
}

registerForm(FL140_TEMPLATE)

export async function generateFL140(state) {
  const profile = buildFL140Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-140', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
