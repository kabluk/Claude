// FL-115 — Proof of Service of Summons.
//
// Proves the respondent was served with the Summons + Petition (+ FL-105 when
// there are children). Filed after service; a prerequisite for requesting a
// default (FL-165). Completed and signed by the SERVER (a non-party adult), not
// by the petitioner.
//
// Data source: a shared "service of process" record (service_server_name,
// service_method, service_date, address where served) plus the standard packet
// document list. Caption/parties/court come from the single case source.

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

// Address where the respondent was served (defaults to their known address).
function servedAddress(a) {
  if (a.service_address) return a.service_address
  const csz =
    [a.respondent_city, a.respondent_state].filter(Boolean).join(', ') +
    (a.respondent_zip ? ` ${a.respondent_zip}` : '')
  return [a.respondent_street || a.respondent_address, csz].filter((s) => s && s.trim()).join(', ')
}

export function buildFL115Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)
  const court = countyInfo(user.county) || {}
  const method = (a.service_method || 'personal').toLowerCase() // personal | mail
  const personal = method !== 'mail'
  const hasChildren = !!caseRec.has_children

  return {
    // ---- caption: the filing party (petitioner) ----
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

    // ---- item 1: documents served ----
    docs_family_law: true, // FL-100 + FL-110 + blank FL-120
    docs_other: hasChildren, // "Other" group opened for FL-105
    docs_fl105: hasChildren, // completed + blank FL-105 (UCCJEA)

    // ---- item 2: address where served ----
    address_served: servedAddress(a),

    // ---- item 3: manner of service ----
    personal_service: personal,
    personal_date: personal ? fmtDateUS(a.service_date) : '',
    personal_time: personal ? a.service_time || '' : '',
    mail_service: !personal,
    mail_date: !personal ? fmtDateUS(a.service_date) : '',
    mail_city: !personal ? a.service_mail_city || '' : '',

    // ---- item 4: the server (a non-party adult; not a registered process server)
    server_name: a.service_server_name || '',
    server_address: a.service_server_address || '',
    server_phone: a.service_server_phone || '',
    server_not_registered: true,

    // ---- item 5: declaration under penalty of perjury ----
    declaration: true,
    sig_date: fmtDateUS(a.service_date),
    sig_name: a.service_server_name || '',
  }
}

// True whenever a summons must be proved served (every filed case).
export function fl115Required() {
  return true
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const P1 = (s) => `FL-115[0].Page1[0].Page1[0].${s}`
const P2 = (s) => `FL-115[0].Page2[0].Page2[0].${s}`

export const FL115_MAPPING = {
  // caption — AddInfo reuses Phone_ft[n] for name/address (mapped by /TU label)
  party_name: P1('AddInfo[0].Phone_ft[0]'),
  party_street: P1('AddInfo[0].Phone_ft[2]'),
  party_city: P1('AddInfo[0].Phone_ft[3]'),
  party_state: P1('AddInfo[0].Phone_ft[4]'),
  party_zip: P1('AddInfo[0].Phone_ft[5]'),
  party_phone: P1('AddInfo[0].Phone_ft[6]'),
  party_email: P1('AddInfo[0].Email_ft[0]'),
  attorney_for: P1('AddInfo[0].AttyFor_ft[0]'),
  court_county: P1('CourtInfo[0].CrtCounty_ft[0]'),
  court_street: P1('CourtInfo[0].Street_ft[0]'),
  court_mailing: P1('CourtInfo[0].MailingAdd_ft[0]'),
  court_city_zip: P1('CourtInfo[0].CityZip_ft[0]'),
  court_branch: P1('CourtInfo[0].Branch_ft[0]'),
  petitioner_name: [P1('TitlePartyName[0].Petitioner_tf[0]'), P2('Party[0].Petitioner_tf[0]')],
  respondent_name: [P1('TitlePartyName[0].Respondent_tf[0]'), P2('Party[0].Respondent_tf[0]')],
  case_number: [P1('CaseNumber[0].CaseNumber_ft[0]'), P2('CaseNumber[0].CaseNumber_ft[0]')],

  // item 1 documents served
  docs_family_law: P1('List1[0].LI1[0].Check1[0]'),
  docs_other: P1('List1[0].LI4[0].CheckBox1[0]'),
  docs_fl105: P1('List1[0].LI4[0].List1[0].LI1[0].CheckBox1[0]'),

  // item 2 address where served
  address_served: P1('List2[0].LI1[0].AddressWhereServed_tf[0]'),

  // item 3 manner of service
  personal_service: P1('List3[0].LI1[0].CheckBox1[0]'),
  personal_date: P1('List3[0].LI1[0].DatePersonalServiceCompleted_dt[0]'),
  personal_time: P1('List3[0].LI1[0].TimePersonalServiceCompleted_dt[0]'),
  mail_service: P2('List3[0].LI3[0].CheckBox1[0]'),
  mail_date: P2('List3[0].LI3[0].DateofMail_AcknowledgmentService_dt[0]'),
  mail_city: P2('List3[0].LI3[0].CityFromWhichSummonsMailed_tf[0]'),

  // item 4 the server
  server_name: P2('List4[0].NameofServer_tf[0]'),
  server_address: P2('List4[0].ServersAddress_tf[0]'),
  server_phone: P2('List4[0].ServersTelephoneNumber_tf[0]'),
  server_not_registered: P2('List4[0].LI2[0].CheckBox1[0]'),

  // item 5 declaration + signature (server)
  declaration: P2('List5[0].LI1[0].CheckBox1a[0]'),
  sig_date: P2('SigSub[0].SigDate[0]'),
  sig_name: P2('SigSub[0].Name[0]'),
}

export const FL115_TEMPLATE = {
  id: 'FL-115',
  title: 'Proof of Service of Summons',
  url: '/forms/FL-115.pdf',
  revision: 'Rev. January 1, 2021',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl115.pdf',
  sourceSha256: '3e5625e4dd2b9eb1724def0f19f8cd08c9e87f56659940e97707577285dcc176',
  mapping: FL115_MAPPING,
}

registerForm(FL115_TEMPLATE)

export async function generateFL115(state) {
  const profile = buildFL115Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-115', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
