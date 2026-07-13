// FW-003 — Order on Court Fee Waiver (Judicial Council of California).
//
// The order the court issues on an FW-001 request. The court decides and signs
// it; the FILER pre-fills only the caption block (name, address, case), the date
// the request was filed, and any prior fee-waiver order date. We fill NAMED
// AcroForm fields only and NEVER touch the court's grant/deny decision fields.

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { countyInfo } from './../data/counties.js'
import { buildPartyContact } from './party.js'
import { fw001Required } from './fw001.js'

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

export function buildFW003Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)

  return {
    // ---- caption (filled by the filer) ----
    person_name: c.party_name,
    person_street: c.party_street,
    person_city: c.party_city,
    person_state: c.party_state,
    person_zip: c.party_zip,
    court_county: user.county || '',
    case_number: '',
    case_name: [a.petitioner_name, a.respondent_name].filter(Boolean).join(' and '),

    // ---- item at top: when the FW-001 request was filed ----
    request_filed_date: fmtDateUS(a.fee_waiver_sig_date || a.signature_date),
  }
}

// FW-003 accompanies every FW-001 request (blank order for the court to complete,
// caption pre-filled), so it is required exactly when FW-001 is.
export function fw003Required(state) {
  return fw001Required(state)
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const P1 = (s) => `FW-003[0].Page1[0].${s}`
const P2 = (s) => `FW-003[0].Page2[0].${s}`
const P3 = (s) => `FW-003[0].#subform[2].${s}`

export const FW003_MAPPING = {
  // caption block — the person who wants the fee waiver
  person_name: [
    P1('PersonWaivingName_ft[0]'),
    P2('PE_P2Header_gp[0].PersonWaivingName_ft[0]'),
    P3('PE_P2Header_gp[0].PersonWaivingName_ft[0]'),
  ],
  person_street: P1('FillText23[0]'),
  person_city: P1('FillText21[0]'),
  person_state: P1('FillText20[0]'),
  person_zip: P1('FillText22[0]'),
  court_county: P1('Stamp_court_case[0].CourtInfo_ft[0]'),
  case_number: [
    P1('Stamp_court_case[0].CaseNumber_ft[0]'),
    P2('PE_P2Header_gp[0].CaseNumber_ft[0]'),
    P3('PE_P2Header_gp[0].CaseNumber_ft[0]'),
  ],
  case_name: P1('Stamp_court_case[0].CaseName_ft[0]'),

  // "A request to waive court fees was filed on (date)"
  request_filed_date: P1('T29[0]'),
}

export const FW003_TEMPLATE = {
  id: 'FW-003',
  title: 'Order on Court Fee Waiver',
  url: '/forms/FW-003.pdf',
  revision: 'Rev. September 1, 2019',
  checkedOn: '07/13/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fw003.pdf',
  sourceSha256: '1fead5e966ed70879852c081f57463a916bc2e2a76777c5959712d298e5a4928',
  mapping: FW003_MAPPING,
}

registerForm(FW003_TEMPLATE)

export async function generateFW003(state) {
  const profile = buildFW003Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FW-003', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
