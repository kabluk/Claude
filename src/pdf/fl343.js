// FL-343 — Spousal, Partner, or Family Support Order Attachment.
//
// Attachment to the judgment (FL-180 item 4l). The disposition type is the SAME
// single source as FL-180 (normalizeSpousalType) so the two can never disagree:
//   ordered    → item 4 monetary order (payer/payee/amount/terms) + Gavron + EWO
//   reserved   → item 3a jurisdiction reserved (both parties)
//   terminated → item 3b jurisdiction terminated (both parties)
//   waived     → shown as jurisdiction terminated by the parties' stipulation
// Goes in the packet only when the type is not none/empty.

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { buildPartyContact } from './party.js'
import { normalizeSpousalType } from './spousal.js'

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
const num = (v) => {
  const n = Number(String(v ?? '').replace(/[, $]/g, ''))
  return Number.isFinite(n) ? n : 0
}
const money = (v) => {
  const n = num(v)
  return n ? n.toLocaleString('en-US') : ''
}

// Months/years married, from the marriage/separation dates (same source as FL-100).
function timeMarried(a) {
  const m = parseDate(a.date_of_marriage || a.marriage_date)
  const s = parseDate(a.date_of_separation || a.separation_date)
  if (!m || !s || s < m) return { years: '', months: '' }
  let months = (s.getFullYear() - m.getFullYear()) * 12 + (s.getMonth() - m.getMonth())
  if (s.getDate() < m.getDate()) months -= 1
  return { years: String(Math.floor(months / 12)), months: String(months % 12) }
}

export function buildFL343Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  buildPartyContact(a) // FL-343 caption carries no contact block

  const type = normalizeSpousalType(a) // ordered | reserved | terminated | waived | none
  const ordered = type === 'ordered'
  const reserved = type === 'reserved'
  const terminated = type === 'terminated' || type === 'waived'

  // ORDER branch: who pays whom, how much.
  const payer = (a.spousal_payer || 'respondent').toLowerCase()
  const payerIsPet = payer === 'petitioner'
  const payee = (a.spousal_payee || (payerIsPet ? 'respondent' : 'petitioner')).toLowerCase()
  const payeeIsPet = payee === 'petitioner'
  const tm = timeMarried(a)

  return {
    // ---- caption ----
    petitioner_name: a.petitioner_name || '',
    respondent_name: a.respondent_name || '',
    case_number: '',

    // ---- TO / basis ----
    attaches_to_fl180: true,
    parties_stipulate: true, // consent judgment: the parties agree

    // ---- item 2: permanent support judgment attachment ----
    permanent_support: true,
    married_duration_cb: !!(tm.years || tm.months),
    married_years: tm.years,
    married_months: tm.months,

    // ---- item 3a: jurisdiction reserved (both parties) ----
    reserve_support: reserved,
    reserve_petitioner: reserved,
    reserve_respondent: reserved,

    // ---- item 3b: jurisdiction terminated (both parties) ----
    terminate_support: terminated,
    terminate_petitioner: terminated,
    terminate_respondent: terminated,

    // ---- item 4: monetary order ----
    order_payer_petitioner: ordered && payerIsPet,
    order_payer_respondent: ordered && !payerIsPet,
    order_payee_petitioner: ordered && payeeIsPet,
    order_payee_respondent: ordered && !payeeIsPet,
    order_permanent: ordered, // permanent spousal support in a judgment
    order_spousal: ordered,
    order_amount: ordered ? money(a.spousal_amount) : '',
    order_begin_date: ordered ? fmtDateUS(a.spousal_start_date) : '',
    order_payable_on_cb: ordered,
    order_payable_on_day: ordered ? a.spousal_payable_day || '1' : '',
    order_method_parent: ordered,
    order_method_check_cash: ordered,

    // ---- item 5: earnings assignment (requested by the payee) ----
    ewo_issue: ordered,
    ewo_by_petitioner: ordered && payeeIsPet,
    ewo_by_respondent: ordered && !payeeIsPet,

    // ---- item 9: Gavron warning — duty of the supported party to be self-supporting
    gavron: ordered,
    gavron_petitioner: ordered && payeeIsPet,
    gavron_respondent: ordered && !payeeIsPet,
  }
}

// True when FL-343 belongs in the packet (support is addressed on the attachment).
export function fl343Required({ answers = [] } = {}) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const t = normalizeSpousalType(a)
  return t !== 'none' && t !== ''
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const P1C = (s) => `FL-343[0].Page1[0].pxCaption[0].${s}`
const P1 = (s) => `FL-343[0].Page1[0].${s}`
const P2 = (s) => `FL-343[0].Page2[0].${s}`
const P3 = (s) => `FL-343[0].Page3[0].${s}`

export const FL343_MAPPING = {
  // caption (page 1 nested under pxCaption; pages 2/3 direct)
  petitioner_name: [
    P1C('TitlePartyName[0].Party1[0]'),
    P2('TitlePartyName[0].Party1[0]'),
    P3('TitlePartyName[0].Party1[0]'),
  ],
  respondent_name: [
    P1C('TitlePartyName[0].Party2[0]'),
    P2('TitlePartyName[0].Party2[0]'),
    P3('TitlePartyName[0].Party2[0]'),
  ],
  case_number: [
    P1C('CaseNumber[0].CaseNumber[0]'),
    P2('CaseNumber[0].CaseNumber[0]'),
    P3('CaseNumber[0].CaseNumber[0]'),
  ],

  // TO + basis
  attaches_to_fl180: P1('ToSub[0].CheckBox2[0]'), // Judgment (FL-180)
  parties_stipulate: P1('ToSub[0].CheckBox7[0]'), // The Parties Stipulate (Agree)

  // item 2 permanent support attachment + marriage duration
  permanent_support: P1('List2[0].CheckBox1[0]'),
  married_duration_cb: P1('List2[0].LI2[0].CheckBox1[0]'),
  married_years: P1('List2[0].LI2[0].on_date2[0]'),
  married_months: P1('List2[0].LI2[0].on_date1[0]'),

  // item 3a jurisdiction reserved
  reserve_support: P2('List3[0].LI1[0].CheckBox1[0]'),
  reserve_petitioner: P2('List3[0].LI1[0].CheckBox2[0]'),
  reserve_respondent: P2('List3[0].LI1[0].CheckBox3[0]'),
  // item 3b jurisdiction terminated
  terminate_support: P2('List3[0].LI2[0].CheckBox1[0]'),
  terminate_petitioner: P2('List3[0].LI2[0].CheckBox2[0]'),
  terminate_respondent: P2('List3[0].LI2[0].CheckBox3[0]'),

  // item 4 monetary order
  order_payer_petitioner: P2('List4[0].LI1[0].Check1[0]'),
  order_payer_respondent: P2('List4[0].LI1[0].Check1[1]'),
  order_payee_petitioner: P2('List4[0].LI1[0].Check2[0]'),
  order_payee_respondent: P2('List4[0].LI1[0].Check2[1]'),
  order_permanent: P2('List4[0].LI1[0].Check3[1]'), // [0]=temporary, [1]=permanent
  order_spousal: P2('List4[0].LI1[0].Check4[0]'), // spousal support
  order_amount: P2('List4[0].LI1[0].NumericField6[0]'),
  order_begin_date: P2('List4[0].LI2[0].on_date_ft[0]'),
  order_payable_on_cb: P2('List4[0].LI3[0].List1[0].LI2[0].CheckBoxCaption[0]'),
  order_payable_on_day: P2('List4[0].LI3[0].List1[0].LI2[0].on_date_ft[0]'),
  order_method_parent: P2('List4[0].LI4[0].#area[0].CheckBoxCaption1[0]'),
  order_method_check_cash: P2('List4[0].LI4[0].#area[1].CheckBoxCaption2[0]'),

  // item 5 earnings assignment
  ewo_issue: P2('List5[0].LI1[0].CheckBox1[0]'),
  ewo_by_petitioner: P2('List5[0].LI1[0].CheckB1[0]'),
  ewo_by_respondent: P2('List5[0].LI1[0].CheckB1[1]'),

  // item 9 Gavron (duty to become self-supporting)
  gavron: P3('List9[0].CheckBox1[0]'),
  gavron_petitioner: P3('List9[0].LI2[0].CheckBo[0]'),
  gavron_respondent: P3('List9[0].LI2[0].CheckBo[1]'),
}

export const FL343_TEMPLATE = {
  id: 'FL-343',
  title: 'Spousal, Partner, or Family Support Order Attachment',
  url: '/forms/FL-343.pdf',
  revision: 'Rev. July 1, 2025',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl343.pdf',
  sourceSha256: 'e40e1cefaf0f41edf65344054d7b3c93038df630c11991d5f09ce2ca70d77034',
  mapping: FL343_MAPPING,
}

registerForm(FL343_TEMPLATE)

export async function generateFL343(state) {
  const profile = buildFL343Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-343', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
