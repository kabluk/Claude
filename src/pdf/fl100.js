// FL-100 — Petition (Marriage/Domestic Partnership).
//
// This module holds everything that does NOT depend on the official PDF's real
// field names: the value-side profile (logical field_key → value), date math,
// the FL-105 business rule, and form registration.
//
// The logical → REAL-PDF-field-name half of the mapping is filled in AFTER the
// official fillable PDF is committed to public/forms/FL-100.pdf and its fields
// are read with inspectFormFields('FL-100').

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { countyInfo } from '../data/counties.js'
import { buildPartyContact } from './party.js'

// ---- date helpers (wizard date inputs store ISO yyyy-mm-dd) ----
function parseDate(s) {
  if (!s) return null
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s) // mm/dd/yyyy
  if (m) return new Date(+m[3], +m[1] - 1, +m[2])
  m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s) // dd.mm.yyyy
  if (m) return new Date(+m[3], +m[2] - 1, +m[1])
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

// Whole months between two dates (calendar-aware), then split into years+months.
export function computeTimeMarried(marriage, separation) {
  const a = parseDate(marriage)
  const b = parseDate(separation)
  if (!a || !b || b < a) return { years: '', months: '', total: '', text: '' }
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  if (b.getDate() < a.getDate()) months -= 1
  if (months < 0) months = 0
  const years = Math.floor(months / 12)
  const rem = months % 12
  return { years, months: rem, total: months, text: `${years} yr ${rem} mo` }
}

// Court forms use US date format MM/DD/YYYY (wizard stores ISO yyyy-mm-dd).
function fmtDateUS(s) {
  const d = parseDate(s)
  if (!d) return s || ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

// Money with thousands separators: 450000 → $450,000
function fmtMoney(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return v || ''
  return '$' + n.toLocaleString('en-US')
}

function ageFrom(dob) {
  const d = parseDate(dob)
  if (!d) return ''
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a -= 1
  return a >= 0 ? a : ''
}

const parseList = (raw) => {
  try {
    const r = JSON.parse(raw || '[]')
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}

const PETITION_TYPE = {
  uncontested: 'Dissolution of Marriage',
  contested: 'Dissolution of Marriage',
  supportOnly: 'Petition for Support',
}

// Whether the packet must include FL-105 (UCCJEA) — required when minor children.
export function fl105Required({ caseRec = {} } = {}) {
  return !!caseRec.has_children
}

// Build the FL-100 value profile (logical field_key → value) from the case.
export function buildFL100Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const children = parseList(a.children)
  const assets = parseList(a.assets)
  const court = countyInfo(user.county) || {}
  const tm = computeTimeMarried(a.date_of_marriage || a.marriage_date, a.date_of_separation || a.separation_date)

  const communityProperty = assets
    .map((x) => [x.description, x.value ? fmtMoney(x.value) : ''].filter(Boolean).join(' — '))
    .filter(Boolean)
    .join('; ')

  const isDissolution = caseRec.type === 'uncontested' || caseRec.type === 'contested'
  const contact = buildPartyContact(a) // single-source petitioner contact block

  // §2 residency — driven by user choice; default: Petitioner only.
  const residency = (a.residency_party || 'petitioner').toLowerCase()
  const petitionerResident = residency === 'petitioner' || residency === 'both'
  const respondentResident = residency === 'respondent' || residency === 'both'

  const profile = {
    // --- caption / header ---
    petitioner_name: a.petitioner_name || '',
    respondent_name: a.respondent_name || '',
    court_county: user.county || '',
    court_name: court.courtName || '',
    court_street: court.street || '',
    court_mailing: court.mailing || '',
    court_city_zip: court.cityZip || '',
    court_branch: court.branch || '',
    // self-represented party contact (structured, single source)
    party_name: contact.party_name,
    party_street: contact.party_street,
    party_city: contact.party_city,
    party_state: contact.party_state,
    party_zip: contact.party_zip,
    party_phone: contact.party_phone,
    party_email: contact.party_email,
    attorney_for: contact.attorney_for,
    petition_type: PETITION_TYPE[caseRec.type] || 'Dissolution of Marriage',
    case_number: '', // assigned by the court at filing

    // --- §1 relationship / petition type (string + checkbox flags) ---
    relationship_type: 'Marriage',
    rel_marriage: true, // FormTitle "Marriage" (Dissolution of Marriage)
    rel_married: true, // §1a "We are married"
    rel_dp_ca: false, // §1b domestic partnership established in CA
    rel_dp_notca: false, // §1c domestic partnership NOT established in CA
    pt_dissolution: isDissolution,

    // --- §2 residence (only the chosen party/parties) ---
    petitioner_ca_resident: petitionerResident,
    respondent_ca_resident: respondentResident,

    // --- §3 statistical facts (dates formatted MM/DD/YYYY) ---
    marriage_stats: true, // §3a checkbox (marriage statistical facts)
    date_of_marriage: fmtDateUS(a.date_of_marriage || a.marriage_date),
    date_of_separation: fmtDateUS(a.date_of_separation || a.separation_date),
    time_married_years: tm.years,
    time_married_months: tm.months,

    // --- §4 minor children ---
    has_minor_children: !!caseRec.has_children,
    no_minor_children: !caseRec.has_children,
    num_children: children.length,

    // --- §5 grounds ---
    grounds: 'Irreconcilable differences',
    gd_divorce: isDissolution,

    // --- §6 child custody/visitation ---
    custody_request: caseRec.has_children ? 'yes' : '',

    // --- §7 separate property ---
    separate_property: '',

    // --- §8 community property ---
    community_property: communityProperty,
    community_property_listed: communityProperty !== '',

    // --- §9 spousal support ---
    spousal_support_request: '',

    // --- §10 other relief ---
    restore_former_name: '',
    other_requests: '',

    // --- signature (date formatted MM/DD/YYYY) ---
    signature_date: fmtDateUS(a.signature_date),
    petitioner_printed_name: a.petitioner_name || '',
  }

  // Children table: child_1_name / _dob (US) / _age / _sex, …
  children.forEach((c, i) => {
    const p = `child_${i + 1}`
    profile[`${p}_name`] = c.name || ''
    profile[`${p}_dob`] = fmtDateUS(c.dob)
    profile[`${p}_age`] = ageFrom(c.dob)
    profile[`${p}_sex`] = c.sex || ''
  })

  return profile
}

// Real PDF field names live under FL-100[0].Page{1,2,3}[0].* — short helpers:
const p1 = (s) => `FL-100[0].Page1[0].${s}`
const p2 = (s) => `FL-100[0].Page2[0].${s}`
const p3 = (s) => `FL-100[0].Page3[0].${s}`

// logical field_key (from buildFL100Profile) → REAL PDF field name(s).
// Field names were extracted with inspectFormFields('FL-100') and disambiguated
// via each field's /TU tooltip. A value may target multiple fields (e.g. the
// caption party names repeated on every page).
export const FL100_MAPPING = {
  // caption — parties (running header on every page)
  petitioner_name: [
    p1('CaptionP1_sf[0].TitlePartyName[0].Party1_ft[0]'),
    p2('Parties[0].Party1_ft[0]'),
    p3('Parties[0].Party1_ft[0]'),
  ],
  respondent_name: [
    p1('CaptionP1_sf[0].TitlePartyName[0].Party2_ft[0]'),
    p2('Parties[0].Party2_ft[0]'),
    p3('Parties[0].Party2_ft[0]'),
  ],
  // caption — court (Los Angeles)
  court_county: p1('CaptionP1_sf[0].CourtInfo[0].CrtCounty_ft[0]'),
  court_street: p1('CaptionP1_sf[0].CourtInfo[0].Street_ft[0]'),
  court_mailing: p1('CaptionP1_sf[0].CourtInfo[0].MailingAdd_ft[0]'),
  court_city_zip: p1('CaptionP1_sf[0].CourtInfo[0].CityZip_ft[0]'),
  court_branch: p1('CaptionP1_sf[0].CourtInfo[0].Branch_ft[0]'),
  // caption — self-represented party block (structured contact)
  party_name: p1('CaptionP1_sf[0].AttyInfo[0].AttyName_ft[0]'),
  party_street: p1('CaptionP1_sf[0].AttyInfo[0].AttyStreet_ft[0]'),
  party_city: p1('CaptionP1_sf[0].AttyInfo[0].AttyCity_ft[0]'),
  party_state: p1('CaptionP1_sf[0].AttyInfo[0].AttyState_ft[0]'),
  party_zip: p1('CaptionP1_sf[0].AttyInfo[0].AttyZip_ft[0]'),
  party_phone: p1('CaptionP1_sf[0].AttyInfo[0].Phone_ft[0]'),
  party_email: p1('CaptionP1_sf[0].AttyInfo[0].Email_ft[0]'),
  attorney_for: p1('CaptionP1_sf[0].AttyInfo[0].AttyFor_ft[0]'),
  case_number: [
    p1('CaptionP1_sf[0].CaseNumber[0].CaseNumber_ft[0]'),
    p2('CaseNumber[0].CaseNumber_ft[0]'),
    p3('CaseNumber[0].CaseNumber_ft[0]'),
  ],
  // title checkboxes: Dissolution (Divorce) of Marriage
  pt_dissolution: p1('CaptionP1_sf[0].FormTitle[0].DissolutionOf_cb[0]'),
  rel_marriage: p1('CaptionP1_sf[0].FormTitle[0].Marriage_cb[0]'),
  // §1 legal relationship
  rel_married: p1('WeAreMarried_cb[0]'), // §1a We are married
  rel_dp_ca: p1('DPEstablishedInCalifornia[0]'), // §1b
  rel_dp_notca: p1('DPNOTEstablishedinCA_cb[0]'), // §1c
  // §3a marriage statistical-facts checkbox
  marriage_stats: p1('CheckBox61[0]'),
  // §2 residency requirements
  petitioner_ca_resident: p1('PetitionerMeetsResidencyReqs_cb[0]'),
  respondent_ca_resident: p1('RespondentMeetsResidencyReqs_cb[0]'),
  // §3 statistical facts (+ computed time married)
  date_of_marriage: p1('DateOfMarriage_dt[0]'),
  date_of_separation: p1('DateOfSeparation_dt[0]'),
  time_married_years: p1('MonthsSeparated_tf[0]'), // TU: "Years"
  time_married_months: p1('MonthsSeparated_tf[1]'), // TU: "Months"
  // §4 minor children
  has_minor_children: p1('MinorChildren_sf[0].MinorChildrenList_cb[0]'),
  no_minor_children: p1('ThereAreNoMinorChildren_cb[0]'),
  child_1_name: p1('MinorChildren_sf[0].Child1Name_tf[0]'),
  child_1_dob: p1('MinorChildren_sf[0].Child1Birthdate_dt[0]'),
  child_1_age: p1('MinorChildren_sf[0].Child1Age_tf[0]'),
  child_2_name: p1('MinorChildren_sf[0].Child2Name_tf[0]'),
  child_2_dob: p1('MinorChildren_sf[0].Child2Birthdate_dt[0]'),
  child_2_age: p1('MinorChildren_sf[0].Child2Age_tf[0]'),
  child_3_name: p1('MinorChildren_sf[0].Child3Name_tf[0]'),
  child_3_dob: p1('MinorChildren_sf[0].Child3Date_dt[0]'), // note: "Child3Date"
  child_3_age: p1('MinorChildren_sf[0].Child3Age_tf[0]'),
  child_4_name: p1('MinorChildren_sf[0].Child4Name_tf[0]'),
  child_4_dob: p1('MinorChildren_sf[0].Child4Birthdate_dt[0]'),
  child_4_age: p1('MinorChildren_sf[0].Child4Age_tf[0]'),
  // §5 grounds: Divorce based on irreconcilable differences
  gd_divorce: p2('SepTypeDef_cb[1]'), // TU: "Divorce"
  grounds: p2('SepBasis_cb[0]'), // TU: "irreconcilable differences."
  // §6 custody/visitation — joint
  custody_request: [p2('ToBothJointly_cb[0]'), p2('ToBothJointly_cb[1]')],
  // §9 spousal/partner support
  spousal_support_request: p2('PaySupport_cb[0]'),
  // §7 separate property (list)
  separate_property: p2('ConfirmSeparateProperty_sf[0].SeparatePropertyList1_tf[0]'),
  // §8 community property (determine rights; listed as follows)
  community_property: p3('CommQuasiProperty_sf[0].ListProperty_ft[0]'),
  community_property_listed: [
    p3('CommQuasiProperty_sf[0].PropertyListed_cb[0]'),
    p3('CommQuasiProperty_sf[0].WhereCPListed_cb[2]'),
  ],
  // §10 other relief
  restore_former_name: [p3('SpecifyFormerName_tf[0]'), p3('RestoreFormerName_cb[0]')],
  other_requests: [p3('SpecifyOtherRequests_tf[0]'), p3('OtherRequests_cb[0]')],
  // signature
  signature_date: p3('SigDate[0]'),
  petitioner_printed_name: p3('PrintPetitionerName_tf[0]'),
}

// FormTemplate — pins the official form version in the repo.
export const FL100_TEMPLATE = {
  id: 'FL-100',
  title: 'Petition — Marriage/Domestic Partnership',
  url: '/forms/FL-100.pdf',
  // Revision date printed on the official form (pins the version in-repo).
  // Footer reads: "FL-100 [Rev. January 1, 2020]".
  revision: 'Rev. January 1, 2020',
  // Upstream official source — used by `npm run check-forms` to detect a new
  // publication (hash change ⇒ re-check revision & field mapping).
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl100.pdf',
  sourceSha256: 'fa30a2916677af5aecbd555aeceb06ef410eb1221da1b5f928348a5e7b17b6b6',
  mapping: FL100_MAPPING,
  // §10b community-property list: shrink the font and lower the field's top edge
  // so its text sits inside the box instead of overlapping the printed
  // "as follows (specify)" label (verified on flatten).
  fontSizes: {
    [p3('CommQuasiProperty_sf[0].ListProperty_ft[0]')]: 9,
  },
  rectAdjust: {
    [p3('CommQuasiProperty_sf[0].ListProperty_ft[0]')]: { dh: -20 },
  },
}

registerForm(FL100_TEMPLATE)

// Generate a filled, DRAFT-watermarked FL-100 from the current case state.
// Returns { bytes, fields, report }. Throws if the PDF/template isn't ready.
export async function generateFL100(state) {
  const profile = buildFL100Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-100', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
