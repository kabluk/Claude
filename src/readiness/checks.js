// Court-Readiness Check — MECHANICAL validation of the assembled packet.
//
// This module NEVER evaluates the *content* of an answer (is this a good idea?
// is this the right form?). It only checks two mechanical properties:
//   1) PRESENCE  — every field/form the case procedurally needs is filled/included.
//   2) CONSISTENCY — the same datum reads identically everywhere it appears
//                    (separation date, party names, case number across forms).
// Plus factual county requirements and a factual list of signature locations.
//
// It is UPL-safe by construction: it reports facts ("«X» is not filled in",
// "separation date differs: A vs B"), never advice ("you should…"). All display
// copy lives in i18n (`t.readiness`); this module returns i18n KEYS + params.
//
// Pure JS (no React) so it runs both in the /review screen and in the
// scripts/readiness-selftest.mjs node self-test.

import { buildFL100Profile } from '../pdf/fl100.js'
import { buildFL110Profile } from '../pdf/fl110.js'
import { buildFL150Profile } from '../pdf/fl150.js'
import { buildFL105Profile, fl105Required } from '../pdf/fl105.js'
import { buildFL141Profile } from '../pdf/fl141.js'
import { buildFL165Profile, fl165Required } from '../pdf/fl165.js'
import { fl341Required } from '../pdf/fl341.js'
import { fl342Required } from '../pdf/fl342.js'
import { fl343Required } from '../pdf/fl343.js'
import { fw001Required } from '../pdf/fw001.js'
import { fw003Required } from '../pdf/fw003.js'
import { countyInfo } from '../data/counties.js'

const isBlank = (v) => v === undefined || v === null || String(v).trim() === ''

const parseList = (raw) => {
  try {
    const r = JSON.parse(raw || '[]')
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}

// Wizard section anchors — { route, section }. `section` maps to a wizard step;
// the /review screen resolves it to a wizard_step index before navigating.
const A = {
  parties: { route: '/wizard', section: 'parties' },
  children: { route: '/wizard', section: 'children' },
  income: { route: '/wizard', section: 'income' },
  consent: { route: '/wizard', section: 'consent' },
  county: { route: '/county' },
  caseType: { route: '/' },
  calculator: { route: '/calculator' },
  fees: { route: '/wizard', section: 'fees' },
}

// Always-required petitioner/party fields → their fix anchor.
const REQUIRED_FIELDS = [
  ['petitioner_name', A.parties],
  ['respondent_name', A.parties],
  ['party_street', A.parties],
  ['party_city', A.parties],
  ['party_state', A.parties],
  ['party_zip', A.parties],
  ['respondent_address', A.parties],
  ['marriage_date', A.parties],
  ['separation_date', A.parties],
]

// Factual signature registry for the core packet (who signs, on which page).
// Purely informational — presence of a signature line, not advice about signing.
const SIGNATURES = [
  { form: 'FL-100', who: 'petitioner', page: 3 },
  { form: 'FL-105', who: 'petitioner', page: 2, when: 'children' },
  { form: 'FL-150', who: 'petitioner', page: 4 },
  { form: 'FL-141', who: 'petitioner', page: 1 },
  { form: 'FL-165', who: 'petitioner', page: 1, when: 'default' },
]

// The set of forms this case procedurally requires.
export function requiredForms(state) {
  const forms = ['FL-100', 'FL-110', 'FL-150', 'FL-141'] // statewide core
  if (fl105Required(state)) forms.push('FL-105')
  if (fl165Required(state)) forms.push('FL-165')
  if (fl341Required(state)) forms.push('FL-341')
  if (fl342Required(state)) forms.push('FL-342')
  if (fl343Required(state)) forms.push('FL-343')
  if (fw001Required(state)) forms.push('FW-001')
  if (fw003Required(state)) forms.push('FW-003')
  return forms
}

// Build the caption of each active form so we can compare shared data across
// forms (single-source guarantee: petitioner/respondent name + case number must
// be byte-identical everywhere). Guarded so one bad builder can't sink the check.
function buildActiveProfiles(state) {
  const out = []
  const add = (form, fn) => {
    try {
      out.push({ form, profile: fn(state) })
    } catch {
      /* a builder throwing is a code bug, not a readiness finding — skip it */
    }
  }
  add('FL-100', buildFL100Profile)
  add('FL-110', buildFL110Profile)
  add('FL-150', buildFL150Profile)
  add('FL-141', buildFL141Profile)
  if (fl105Required(state)) add('FL-105', buildFL105Profile)
  if (fl165Required(state)) add('FL-165', buildFL165Profile)
  return out
}

// case_number can be a scalar or an array (multi-page caption) in a profile.
const flatCaseNo = (v) => (Array.isArray(v) ? v : [v]).map((x) => String(x ?? '').trim())

// Return the first pair of distinct non-empty values across profiles for `field`.
function firstDivergence(profiles, field) {
  let seen = null
  for (const { profile } of profiles) {
    const raw = profile[field]
    const vals = field === 'case_number' ? flatCaseNo(raw) : [String(raw ?? '').trim()]
    for (const v of vals) {
      if (!v) continue
      if (seen === null) seen = v
      else if (v !== seen) return { a: seen, b: v }
    }
  }
  return null
}

/**
 * runReadiness(state) → { items, counts }
 *   state: { user, caseRec, answers, packet? }
 *     - answers: array of { field_key, value } (as stored by AppState)
 *     - packet: OPTIONAL array of form codes actually assembled. Defaults to the
 *       procedurally-required set (so the app's own packet always covers it);
 *       pass an explicit list to validate a hand-built packet (used by tests).
 *   items: [{ key, severity: 'ok'|'warn'|'error', params, anchor, group }]
 *   counts: { ok, warn, error }
 */
export function runReadiness(state = {}) {
  const { user = {}, caseRec = {}, answers = [] } = state
  const a = Object.fromEntries((answers || []).map((x) => [x.field_key, x.value]))
  const items = []
  const push = (group, key, severity, params = {}, anchor = null) =>
    items.push({ group, key, severity, params, anchor })

  // ---- 1. Required-field completeness ----------------------------------------
  const missing = REQUIRED_FIELDS.filter(([k]) => isBlank(a[k]))
  for (const [k, anchor] of missing) {
    push('fields', 'field_missing', 'error', { field: k }, anchor)
  }
  // County lives on the County screen, not the wizard.
  if (isBlank(user.county)) push('fields', 'county_missing', 'error', {}, A.county)

  // Children present ⇒ each child needs a name + date of birth.
  if (caseRec.has_children) {
    const children = parseList(a.children)
    if (children.length === 0) {
      push('fields', 'field_missing', 'error', { field: 'children' }, A.children)
    } else {
      const incomplete = children.some((c) => isBlank(c?.name) || isBlank(c?.dob))
      if (incomplete) push('fields', 'field_missing', 'error', { field: 'children' }, A.children)
    }
  }

  // Uncontested/default path ⇒ the respondent's consent signature is required.
  if (caseRec.type === 'uncontested' || caseRec.type === 'default') {
    if (isBlank(a.respondent_signature))
      push('fields', 'field_missing', 'error', { field: 'respondent_signature' }, A.consent)
    if (isBlank(a.signature_date))
      push('fields', 'field_missing', 'error', { field: 'signature_date' }, A.consent)
  }

  const fieldErrors = items.filter((i) => i.group === 'fields').length
  if (fieldErrors === 0) push('fields', 'fields_ok', 'ok')

  // ---- 2. Cross-form consistency --------------------------------------------
  // 2a. Separation / marriage date: two answer keys feed the forms
  //     (date_of_separation || separation_date). If both are set and differ,
  //     the packet would carry inconsistent dates.
  if (!isBlank(a.date_of_separation) && !isBlank(a.separation_date) &&
      String(a.date_of_separation).trim() !== String(a.separation_date).trim()) {
    push('consistency', 'sep_mismatch', 'error',
      { a: a.date_of_separation, b: a.separation_date }, A.parties)
  }
  if (!isBlank(a.date_of_marriage) && !isBlank(a.marriage_date) &&
      String(a.date_of_marriage).trim() !== String(a.marriage_date).trim()) {
    push('consistency', 'marr_mismatch', 'error',
      { a: a.date_of_marriage, b: a.marriage_date }, A.parties)
  }

  // 2b. Shared caption data must be identical across every built form.
  const profiles = buildActiveProfiles(state)
  const nameDiv = firstDivergence(profiles, 'petitioner_name')
  if (nameDiv) push('consistency', 'name_mismatch', 'error', nameDiv, A.parties)
  const respDiv = firstDivergence(profiles, 'respondent_name')
  if (respDiv) push('consistency', 'name_mismatch', 'error', respDiv, A.parties)
  const caseNoDiv = firstDivergence(profiles, 'case_number')
  if (caseNoDiv) push('consistency', 'caseno_mismatch', 'error', caseNoDiv, A.parties)

  const consistencyErrors = items.filter((i) => i.group === 'consistency').length
  if (consistencyErrors === 0) push('consistency', 'consistency_ok', 'ok')

  // ---- 3. Required-form coverage --------------------------------------------
  const needed = requiredForms(state)
  const packet = Array.isArray(state.packet) ? state.packet : needed
  const anchorForForm = (form) => {
    if (form === 'FL-105' || form === 'FL-341' || form === 'FL-342') return A.children
    if (form === 'FL-165') return A.caseType
    if (form === 'FL-343') return A.calculator
    if (form === 'FW-001' || form === 'FW-003') return A.fees
    return null
  }
  const absent = needed.filter((f) => !packet.includes(f))
  for (const form of absent) {
    push('forms', 'form_missing', 'error', { form }, anchorForForm(form))
  }
  if (absent.length === 0) push('forms', 'forms_ok', 'ok')

  // ---- 4. County requirements (factual, from CountyInfo) ---------------------
  const ci = user.county ? countyInfo(user.county) : null
  if (ci) {
    if (ci.stub) {
      push('county', 'county_stub', 'warn', { county: ci.name }, A.county)
    } else {
      if (ci.copies_needed)
        push('county', 'county_copies', 'ok', { county: ci.name, n: ci.copies_needed })
      const locals = (ci.local_forms || []).map((f) => f.code).join(', ')
      if (locals) push('county', 'county_localforms', 'ok', { county: ci.name, list: locals })
      push('county', ci.efiling_required ? 'county_efiling_required' : 'county_efiling_optional',
        'ok', { county: ci.name })
    }
  }

  // ---- 5. Signature locations (factual list) --------------------------------
  const activeForms = new Set(needed)
  for (const s of SIGNATURES) {
    if (s.when === 'children' && !caseRec.has_children) continue
    if (s.when === 'default' && !(caseRec.type === 'uncontested' || caseRec.type === 'default')) continue
    if (!activeForms.has(s.form)) continue
    push('signatures', 'signature', 'ok', { form: s.form, who: s.who, page: s.page })
  }

  const counts = { ok: 0, warn: 0, error: 0 }
  for (const it of items) counts[it.severity]++
  return { items, counts }
}
