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
import { countyInfo } from './counties.js'

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
    .map((x) => [x.description, x.value ? `$${x.value}` : ''].filter(Boolean).join(' — '))
    .filter(Boolean)
    .join('; ')

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
    party_name: a.petitioner_name || '', // self-represented party
    party_address: a.petitioner_address || '',
    party_phone: a.petitioner_phone || '',
    attorney_for: 'Self (Pro Per)',
    petition_type: PETITION_TYPE[caseRec.type] || 'Dissolution of Marriage',
    case_number: '', // assigned by the court at filing

    // --- §1 relationship ---
    relationship_type: 'Marriage',

    // --- §2 residence ---
    petitioner_ca_resident: a.petitioner_ca_resident || '',
    respondent_ca_resident: a.respondent_ca_resident || '',

    // --- §3 statistical facts ---
    date_of_marriage: a.date_of_marriage || a.marriage_date || '',
    date_of_separation: a.date_of_separation || a.separation_date || '',
    time_married_years: tm.years,
    time_married_months: tm.months,

    // --- §4 minor children ---
    has_minor_children: !!caseRec.has_children,
    num_children: children.length,

    // --- §5 grounds ---
    grounds: 'Irreconcilable differences',

    // --- §6 child custody/visitation ---
    custody_request: caseRec.has_children ? 'yes' : '',

    // --- §7 separate property ---
    separate_property: '',

    // --- §8 community property ---
    community_property: communityProperty,

    // --- §9 spousal support ---
    spousal_support_request: '',

    // --- §10 other relief ---
    restore_former_name: '',
    other_requests: '',

    // --- signature ---
    signature_date: a.signature_date || '',
    petitioner_printed_name: a.petitioner_name || '',
  }

  // Children table: child_1_name / _dob / _age / _sex, …
  children.forEach((c, i) => {
    const p = `child_${i + 1}`
    profile[`${p}_name`] = c.name || ''
    profile[`${p}_dob`] = c.dob || ''
    profile[`${p}_age`] = ageFrom(c.dob)
    profile[`${p}_sex`] = c.sex || ''
  })

  return profile
}

// FormTemplate — pins the official form version in the repo.
export const FL100_TEMPLATE = {
  id: 'FL-100',
  title: 'Petition — Marriage/Domestic Partnership',
  url: '/forms/FL-100.pdf',
  // Revision date of the official Judicial Council form (set once the PDF is
  // downloaded and committed, so the form version is fixed in the repo).
  revision: null,
  // logical field_key → REAL PDF field name.
  // TODO: populate from inspectFormFields('FL-100') after the official fillable
  // PDF is committed to public/forms/FL-100.pdf. Empty until then.
  mapping: {},
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
