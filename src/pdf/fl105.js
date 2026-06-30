// FL-105 / GC-120 — Declaration Under UCCJEA.
//
// Same engine path as FL-100: registerForm + real AcroForm field names (no
// coordinate drawing). Children name/DOB come from the SAME case data as FL-100
// (the 'children' answer), so the two forms stay consistent. FL-105 is only
// generated when there are minor children, alongside FL-100.

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { countyInfo } from './counties.js'

// ---- shared date helpers (wizard stores ISO yyyy-mm-dd; court forms use US) ----
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
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}
const parseList = (raw) => {
  try {
    const r = JSON.parse(raw || '[]')
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}
// Split "08/21/2021 – present" into { from, to } (only on spaced separators so
// ISO dates aren't broken).
function splitPeriod(p) {
  if (!p) return { from: '', to: '' }
  const parts = String(p).split(/\s+(?:–|—|to|по|до)\s+|\s+-\s+/i)
  return { from: (parts[0] || '').trim(), to: (parts[1] || '').trim() }
}
// Tolerant date parse for clamping/sorting (MM/DD/YYYY, ISO, MM/YYYY, YYYY).
function parseLoose(s) {
  if (!s) return null
  s = String(s).trim()
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s)
  if (m) return new Date(+m[3], +m[1] - 1, +m[2])
  m = /^(\d{1,2})\/(\d{4})$/.exec(s)
  if (m) return new Date(+m[2], +m[1] - 1, 1)
  m = /^(\d{4})$/.exec(s)
  if (m) return new Date(+m[1], 0, 1)
  return null
}
function dateUS(d) {
  if (!d) return ''
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}
const isPresent = (to) => !to || /present|now|current|настоящ|по наст/i.test(to)

// Build residence rows for one table, clamped so nothing starts before
// `lowerBound` (a child's — or the youngest child's — date of birth). Rows are
// ordered most-recent first; row 1 is the current address (the form preprints
// "to present", so it has no To cell).
function buildResidenceRows(residences, lowerBound) {
  return (residences || [])
    .map((r) => {
      const { from, to } = splitPeriod(r.period)
      return { r, from, to, fromDate: parseLoose(from), toDate: parseLoose(to), present: isPresent(to) }
    })
    .filter((x) => !(x.toDate && lowerBound && x.toDate < lowerBound)) // drop pre-birth segments
    .sort((a, b) => (b.fromDate?.getTime() || 0) - (a.fromDate?.getTime() || 0))
    .map((x) => {
      const clamp = x.fromDate && lowerBound && x.fromDate < lowerBound
      return {
        ...x,
        fromDisp: clamp ? dateUS(lowerBound) : fmtDateUS(x.from),
        toDisp: x.present ? 'Present' : fmtDateUS(x.to),
      }
    })
}

// FL-105 must include this form when there are minor children.
export function fl105Required({ caseRec = {} } = {}) {
  return !!caseRec.has_children
}

// Does the case exceed what a single FL-105 can hold (needs a continuation copy)?
export function fl105NeedsContinuation({ answers = [] } = {}) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const children = parseList(a.children)
  if (children.length > 4) return true // item 2 table holds 4 children
  // Different residence histories ⇒ a separate item 3 per child is required.
  const ref = JSON.stringify(children[0]?.residences || [])
  const allSame = children.every((c) => JSON.stringify(c.residences || []) === ref)
  if (!allSame) return true
  if ((children[0]?.residences || []).length > 5) return true // item 3 has 5 rows
  return false
}

function applyOtherCase(p, c) {
  const t = (c.type || '').toLowerCase()
  const court = [c.court, c.state].filter(Boolean).join(', ')
  const fam = ['family', 'divorce', 'dissolution', 'custody', 'dv', 'restraining']
  if (fam.includes(t)) {
    p.case_family_on = true
    p.case_family_caseno = c.caseno || ''
    p.case_family_court = court
    p.case_family_date = fmtDateUS(c.date)
    p.case_family_child = c.child || ''
    p.case_family_role = c.role || ''
    p.case_family_status = c.status || ''
  } else if (['guardianship', 'probate'].includes(t)) {
    p.case_guard_on = true
    p.case_guard_caseno = c.caseno || ''
    p.case_guard_court = court
    p.case_guard_date = fmtDateUS(c.date)
    p.case_guard_child = c.child || ''
    p.case_guard_role = c.role || ''
    p.case_guard_status = c.status || ''
  } else if (t === 'juvenile') {
    p.case_juv_on = true
    p.case_juv_caseno = c.caseno || ''
    p.case_juv_court = court
  } else if (t === 'adoption') {
    p.case_adopt_on = true
    p.case_adopt_caseno = c.caseno || ''
    p.case_adopt_court = court
  } else {
    p.case_other_on = true
    p.case_other_caseno = c.caseno || ''
    p.case_other_court = court
    p.case_other_date = fmtDateUS(c.date)
    p.case_other_child = c.child || ''
    p.case_other_role = c.role || ''
    p.case_other_status = c.status || ''
  }
}

// Build the FL-105 value profile (logical field_key → value) from the case.
export function buildFL105Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const children = parseList(a.children)
  const court = countyInfo(user.county) || {}
  const otherCases = parseList(a.other_cases)
  const otherPersons = parseList(a.other_persons)

  const p = {
    // caption
    petitioner_name: a.petitioner_name || '',
    respondent_name: a.respondent_name || '',
    party_name: a.petitioner_name || '',
    attorney_for: 'Self (Pro Per)',
    court_county: user.county || '',
    court_street: court.street || '',
    court_mailing: court.mailing || '',
    court_city_zip: court.cityZip || '',
    court_branch: court.branch || '',
    case_number: '', // assigned by the court at filing

    // §1 declarant is a party to this custody proceeding
    declarant_is_party: true,

    // §2 number of children
    children_count: String(children.length),
    more_children: children.length > 4,

    // §3 single shared residence table (children lived together)
    one_residence:
      children.length <= 1 ||
      children.every(
        (c) =>
          JSON.stringify(c.residences || []) ===
          JSON.stringify(children[0]?.residences || []),
      ),

    // §4 other court cases — default No
    other_case_yes: otherCases.length > 0,
    other_case_no: otherCases.length === 0,

    // §6 other persons claiming custody/visitation — default No
    other_person_yes: otherPersons.length > 0,
    other_person_no: otherPersons.length === 0,

    // signature
    signature_date: fmtDateUS(a.signature_date),
    petitioner_printed_name: a.petitioner_name || '',
  }

  // §2 children table (name / DOB[US] / place) — DOB matches FL-100 (same source)
  children.slice(0, 4).forEach((c, i) => {
    const k = `child_${i + 1}`
    p[`${k}_name`] = c.name || ''
    p[`${k}_dob`] = fmtDateUS(c.dob)
    p[`${k}_place`] = c.birthplace || ''
  })

  // §3 residence history (single shared table). Built per-child and clamped so
  // no segment starts before the relevant child's birth. When the children lived
  // together (one_residence) the table is the shared history clamped to the
  // YOUNGEST child's DOB; otherwise it's the first child's own history (the rest
  // go on a continuation copy — see fl105NeedsContinuation).
  const youngestDob = children.reduce((max, c) => {
    const d = parseLoose(c.dob)
    return d && (!max || d > max) ? d : max
  }, null)
  const lowerBound = p.one_residence ? youngestDob : parseLoose(children[0]?.dob)
  const rows = buildResidenceRows(children[0]?.residences || [], lowerBound)
  rows.slice(0, 5).forEach((x, i) => {
    const n = i + 1
    p[`res_${n}_from`] = x.fromDisp // From: start date only (MM/DD/YYYY)
    if (n > 1) p[`res_${n}_to`] = x.toDisp // To: end date or "Present"; row 1's "present" is preprinted
    p[`res_${n}_residence`] = x.r.city_state || ''
    p[`res_${n}_person`] = x.r.lived_with || ''
    p[`res_${n}_relationship`] = x.r.relationship || ''
  })

  // §4 other cases (route each to its type's row)
  otherCases.forEach((c) => applyOtherCase(p, c))

  // §6 other persons (up to 3 → a/b/c)
  const slots = ['a', 'b', 'c']
  otherPersons.slice(0, 3).forEach((person, i) => {
    const s = slots[i]
    const claim = (person.claim || '').toLowerCase()
    p[`person_${s}_name`] = person.name_address || ''
    p[`person_${s}_child`] = person.child || ''
    p[`person_${s}_physical`] = claim === 'physical'
    p[`person_${s}_custody`] = claim === 'custody'
    p[`person_${s}_visitation`] = claim === 'visitation'
  })

  return p
}

// ---- real PDF field names (inspectFormFields('FL-105'); disambiguated via /TU) ----
const P1 = (s) => `FL-105[0].Page1[0].${s}`
const P2 = (s) => `FL-105[0].Page2[0].${s}`
const CAP = 'P1Caption[0].'
const T2 = (row, f) => P1(`List2[0].Li1[0].Table[0].Row${row}[0].${f}[0]`)
const T3 = (row, f) => P1(`List3[0].Li1[0].Table3a[0].Row${row}[0].${f}[0]`)
const I4 = (s) => P2(`Item4subformset[0].List4[0].Li1[0].${s}`)
const ABC = (row, s) => I4(`Table4abc[0].Row4${row}[0].${s}`)
const DE = (row, s) => I4(`Table4de[0].Row4${row}[0].${s}`)
const L6 = (s) => P2(`List6[0].${s}`)

export const FL105_MAPPING = {
  // caption
  petitioner_name: P1(`${CAP}ProbateParty[0].Party1[0]`),
  respondent_name: P1(`${CAP}ProbateParty[0].Party2[0]`),
  party_name: P1(`${CAP}AttyInfo[0].AttyName_ft[0]`),
  attorney_for: P1(`${CAP}AttyInfo[0].Name[0]`),
  court_county: P1(`${CAP}CrtInfo[0].CrtCounty[0]`),
  court_street: P1(`${CAP}CrtInfo[0].CrtStreet[0]`),
  court_mailing: P1(`${CAP}CrtInfo[0].CrtMailingAdd[0]`),
  court_city_zip: P1(`${CAP}CrtInfo[0].CrtCityZip[0]`),
  court_branch: P1(`${CAP}CrtInfo[0].CrtBranch[0]`),
  case_number: P1(`${CAP}CaseNo[0].CaseNumber[0]`),

  // §1 declarant
  declarant_is_party: P1('List1[0].Li1[0].Party[0].PartyRepCB[0]'),

  // §2 children
  children_count: P1('List2[0].Li1[0].NumChildren[0]'),
  child_1_name: T2(1, 'TextField7'),
  child_1_dob: T2(1, 'TextField1'),
  child_1_place: T2(1, 'TextField2'),
  child_2_name: T2(2, 'TextField8'),
  child_2_dob: T2(2, 'TextField1'),
  child_2_place: T2(2, 'TextField2'),
  child_3_name: T2(3, 'TextField8'),
  child_3_dob: T2(3, 'TextField1'),
  child_3_place: T2(3, 'TextField2'),
  child_4_name: T2(4, 'TextField8'),
  child_4_dob: T2(4, 'TextField1'),
  child_4_place: T2(4, 'TextField2'),
  more_children: P1('List2[0].Li1[0].CheckBox19[0]'),

  // §3 residence history (shared table)
  one_residence: P1('List3[0].Li1[0].OneManyCB[0]'),
  res_1_from: T3(1, 'From1'),
  res_1_residence: T3(1, 'Residence1'),
  res_1_person: T3(1, 'PersonStreet1'),
  res_1_relationship: T3(1, 'Relationship1'),
  res_2_from: T3(2, 'From2'),
  res_2_to: T3(2, 'To2'),
  res_2_residence: T3(2, 'Residence2'),
  res_2_person: T3(2, 'PersonStreet2'),
  res_2_relationship: T3(2, 'Relationship2'),
  res_3_from: T3(3, 'From3'),
  res_3_to: T3(3, 'To3'),
  res_3_residence: T3(3, 'Residence3'),
  res_3_person: T3(3, 'PersonStreet3'),
  res_3_relationship: T3(3, 'Relationship3'),
  res_4_from: T3(4, 'From4'),
  res_4_to: T3(4, 'To4'),
  res_4_residence: T3(4, 'Residence4'),
  res_4_person: T3(4, 'PersonStreet4'),
  res_4_relationship: T3(4, 'Relationship4'),
  res_5_from: T3(5, 'From5'),
  res_5_to: T3(5, 'To5'),
  res_5_residence: T3(5, 'Residence5'),
  res_5_person: T3(5, 'PersonStreet5'),
  res_5_relationship: T3(5, 'Relationship5'),

  // §4 other court cases (Yes/No + one row per type)
  other_case_yes: I4('OtherCaseYN[0]'),
  other_case_no: I4('OtherCaseYN[1]'),
  case_family_on: ABC('a', 'PGCell4a[0].FamilyCB[0]'),
  case_family_caseno: ABC('a', 'CaseNo4a[0]'),
  case_family_court: ABC('a', 'Court4a[0]'),
  case_family_date: ABC('a', 'Date4a[0]'),
  case_family_child: ABC('a', 'ChildName4a[0]'),
  case_family_role: ABC('a', 'YourRole4a[0]'),
  case_family_status: ABC('a', 'CaseStatus4a[0]'),
  case_guard_on: ABC('b', 'PGCell4b[0].PGCB4b[0]'),
  case_guard_caseno: ABC('b', 'CaseNo4b[0]'),
  case_guard_court: ABC('b', 'Court4b[0]'),
  case_guard_date: ABC('b', 'Date4b[0]'),
  case_guard_child: ABC('b', 'ChildName4b[0]'),
  case_guard_role: ABC('b', 'YourRole4b[0]'),
  case_guard_status: ABC('b', 'CaseStatus4b[0]'),
  case_other_on: ABC('c', 'PGCell4c[0].OtherCB[0]'),
  case_other_caseno: ABC('c', 'CaseNo4c[0]'),
  case_other_court: ABC('c', 'Court4c[0]'),
  case_other_date: ABC('c', 'Date4c[0]'),
  case_other_child: ABC('c', 'ChildName4c[0]'),
  case_other_role: ABC('c', 'YourRole4c[0]'),
  case_other_status: ABC('c', 'CaseStatus4c[0]'),
  case_juv_on: DE('d', 'PGCell4d[0].JuvCB[0]'),
  case_juv_caseno: DE('d', 'CaseNo4d[0]'),
  case_juv_court: DE('d', 'Court4d[0]'),
  case_adopt_on: DE('e', 'PGCell4e[0].AdoptCB[0]'),
  case_adopt_caseno: DE('e', 'CaseNo4e[0]'),
  case_adopt_court: DE('e', 'Court4e[0]'),

  // §6 other persons claiming custody/visitation
  other_person_yes: L6('OtherPersonYN[0]'),
  other_person_no: L6('OtherPersonYN[1]'),
  person_a_name: L6('Li1[0].Name6a[0]'),
  person_a_physical: L6('Li1[0].CheckBox6a1[0]'),
  person_a_custody: L6('Li1[0].CheckBox6a2[0]'),
  person_a_visitation: L6('Li1[0].CheckBox6a3[0]'),
  person_a_child: L6('Li1[0].Child6a[0]'),
  person_b_name: L6('Li2[0].Name6b[0]'),
  person_b_physical: L6('Li2[0].CheckBox6b1[0]'),
  person_b_custody: L6('Li2[0].CheckBox6b2[0]'),
  person_b_visitation: L6('Li2[0].CheckBox6b3[0]'),
  person_b_child: L6('Li2[0].Child6b[0]'),
  person_c_name: L6('Li3[0].Name6c[0]'),
  person_c_physical: L6('Li3[0].CheckBox6c1[0]'),
  person_c_custody: L6('Li3[0].CheckBox6c2[0]'),
  person_c_visitation: L6('Li3[0].CheckBox6c3[0]'),
  person_c_child: L6('Li3[0].Child6c[0]'),

  // signature
  signature_date: P2('PoPDec[0].SigDate[0]'),
  petitioner_printed_name: P2('PoPDec[0].PrintName[0]'),
}

// FormTemplate — pins the official form version in the repo.
export const FL105_TEMPLATE = {
  id: 'FL-105',
  title: 'Declaration Under UCCJEA',
  url: '/forms/FL-105.pdf',
  // Footer reads: "FL-105/GC-120 [Rev. January 1, 2025]".
  revision: 'Rev. January 1, 2025',
  mapping: FL105_MAPPING,
  // Shrink the residence "person/address" and "residence" cells so long values
  // (name + full address) don't overflow the narrow columns when flattened.
  fontSizes: Object.fromEntries(
    [1, 2, 3, 4, 5].flatMap((n) => [
      [FL105_MAPPING[`res_${n}_person`], 8],
      [FL105_MAPPING[`res_${n}_residence`], 8],
    ]),
  ),
}

registerForm(FL105_TEMPLATE)

// Generate a filled, DRAFT-watermarked FL-105 from the current case state.
export async function generateFL105(state) {
  const profile = buildFL105Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-105', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
