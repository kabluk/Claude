// FL-342 — Child Support Information and Order Attachment.
//
// A DIRECT EXPORT of the guideline child-support calculator (§4055). Every
// number here is pulled from the single financial profile (finance_profile,
// the same source that feeds FL-150) — nothing is re-entered. If the stored
// calculator result is missing, it is recomputed here from the same inputs, so
// the value always flows automatically from the calculator into FL-342.
//
// Attachment to the judgment (FL-180 item 4.k(2)); generated only when the case
// has minor children. Children (names + DOBs) are identical to FL-105/180/341.

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { buildPartyContact } from './party.js'
import { computeGuideline } from '../data/childSupport.js'

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
const list = (s) => {
  try {
    const r = JSON.parse(s || '[]')
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}
const num = (v) => {
  const n = Number(String(v ?? '').replace(/[, $]/g, ''))
  return Number.isFinite(n) ? n : 0
}
const money = (v) => {
  const n = num(v)
  return n ? n.toLocaleString('en-US') : v === 0 || v === '0' ? '0' : ''
}

export function buildFL342Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  buildPartyContact(a) // (FL-342 caption carries no contact block)
  const petitioner = a.petitioner_name || ''
  const respondent = a.respondent_name || ''

  const fin = json(a.finance_profile) // { incomeA, incomeB, timeshareA, children, result }
  const fl150 = json(a.fl150_profile)
  const children = list(a.children)

  // ---- pull the guideline result straight from the calculator (auto-transfer)
  const incomeA = num(fin.incomeA ?? a.petitioner_income)
  const incomeB = num(fin.incomeB ?? a.respondent_income)
  const timeshareA = num(fin.timeshareA)
  const nKids = children.length || num(fin.children)
  const result =
    fin.result && fin.result.total != null
      ? fin.result
      : computeGuideline({ incomeA, incomeB, timeshareA, children: nKids }) || {}

  const total = num(result.total)
  const perChild = num(result.perChild)
  // Obligor = higher earner (calculator's payer: 'A' petitioner / 'B' respondent).
  const payerIsPetitioner = result.payer === 'A'
  const payeeName = payerIsPetitioner ? respondent : petitioner // support paid to the other parent

  const tsA = timeshareA
  const tsB = timeshareA ? 100 - timeshareA : ''

  // Health insurance: the parent who carries it (from FL-150 §17). Default: the
  // petitioner, who holds the policy in the demo profile.
  const ch = fl150.children || {}
  const insurancePetitioner = ch.health_insurance === true || ch.health_insurance === undefined

  const out = {
    // ---- caption ----
    petitioner_name: petitioner,
    respondent_name: respondent,
    case_number: '',
    attaches_to_fl180: true,

    // ---- item 2: income (net monthly, from the calculator) ----
    item2: true,
    petitioner_net: money(incomeA),
    respondent_net: money(incomeB),

    // ---- item 3: children + timeshare (MUST match FL-150 item 16b) ----
    item3: true,
    children_count: nKids ? String(nKids) : '',
    timeshare_petitioner: tsA !== '' && tsA != null ? `${tsA}` : '',
    timeshare_respondent: tsB !== '' ? `${tsB}` : '',

    // ---- item 6: child support ----
    item6: true,
    support_basis_guideline: true,
    payer_petitioner: payerIsPetitioner,
    payer_respondent: !payerIsPetitioner,
    support_start_date: fmtDateUS(a.support_start_date),
    support_on_first: true, // payable on the 1st of the month
    total_support: money(total),

    // ---- item 6b: mandatory add-ons split 50/50 (child care, uninsured health)
    item6b: true,
    addon_childcare_pet_cb: true,
    addon_childcare_resp_cb: true,
    addon_uninsured_pet_cb: true,
    addon_uninsured_resp_cb: true,
    addon_childcare_pet_pct: '50',
    addon_childcare_resp_pct: '50',
    addon_uninsured_pet_pct: '50',
    addon_uninsured_resp_pct: '50',

    // ---- item 7a: health insurance carried by ----
    health_petitioner: insurancePetitioner,
    health_respondent: !insurancePetitioner,
  }

  // per-child support rows (name / DOB / monthly amount / payable to)
  children.slice(0, 4).forEach((c, i) => {
    const n = i + 1
    out[`child${n}_name`] = c.name || ''
    out[`child${n}_dob`] = fmtDateUS(c.dob)
    out[`child${n}_amount`] = money(perChild)
    out[`child${n}_payable_to`] = payeeName
  })

  return out
}

// True when FL-342 belongs in the packet (minor children in the case).
export function fl342Required({ caseRec = {} } = {}) {
  return !!caseRec.has_children
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const cap = (suf) => [1, 2, 3].map((n) => `FL-342[0].Page${n}[0].Page${n}Caption[0].${suf}`)
const P1 = (s) => `FL-342[0].Page1[0].${s}`
const P2 = (s) => `FL-342[0].Page2[0].${s}`
const P3 = (s) => `FL-342[0].Page3[0].${s}`
const INC = (r, kind) =>
  P1(`List2[0].LI1[0].Item2a[0].Item2aTable[0].Item2aTableRow${r}[0].${kind}IncomeCurrencyField${r}[0]`)
const ROW6 = (r, f) =>
  P2(`List6[0].LI1[0].Item6a[0].Item6aTable[0].Item6aTableRow${r}[0].${f}${r}[0]`)

export const FL342_MAPPING = {
  // caption (all 3 pages)
  petitioner_name: cap('CaseTitle[0].PetitionerTextField[0]'),
  respondent_name: cap('CaseTitle[0].RespondentTextField[0]'),
  case_number: cap('CaseNumber[0].CaseNumberTextField[0]'),

  // attaches to Judgment (FL-180)
  attaches_to_fl180: P1('AttachmentTo[0].AttachmentToCheckbox2[0]'),

  // item 2 income (net)
  item2: P1('List2[0].Item2Checkbox[0]'),
  petitioner_net: INC(1, 'Net'),
  respondent_net: INC(2, 'Net'),

  // item 3 children + timeshare
  item3: P1('List3[0].Item3Checkbox[0]'),
  children_count: P1('List3[0].LI1[0].Item3aTextField[0]'),
  timeshare_petitioner: P1('List3[0].LI2[0].Item3b[0].Item3bPercentField1[0]'),
  timeshare_respondent: P1('List3[0].LI2[0].Item3b[0].Item3bPercentField2[0]'),

  // item 6 child support
  item6: P2('List6[0].Item6Checkbox[0]'),
  payer_petitioner: P2('List6[0].LI1[0].Item6a[0].Item6aCheckbox1[0]'),
  payer_respondent: P2('List6[0].LI1[0].Item6a[0].Item6aCheckbox1[1]'),
  support_start_date: P2('List6[0].LI1[0].Item6a[0].Item6aDateField[0]'),
  support_on_first: P2('List6[0].LI1[0].Item6a[0].Item6aCheckbox2[0]'),
  total_support: P2('TotalChildSupportCalcCurrencyField[0]'),

  // item 6a per-child rows
  child1_name: ROW6(1, 'ChildNameTextField'),
  child1_dob: ROW6(1, 'DateOfBirthDateField'),
  child1_amount: ROW6(1, 'MonthlyAmountCurrencyField'),
  child1_payable_to: ROW6(1, 'PayableToTextField'),
  child2_name: ROW6(2, 'ChildNameTextField'),
  child2_dob: ROW6(2, 'DateOfBirthDateField'),
  child2_amount: ROW6(2, 'MonthlyAmountCurrencyField'),
  child2_payable_to: ROW6(2, 'PayableToTextField'),
  child3_name: ROW6(3, 'ChildNameTextField'),
  child3_dob: ROW6(3, 'DateOfBirthDateField'),
  child3_amount: ROW6(3, 'MonthlyAmountCurrencyField'),
  child3_payable_to: ROW6(3, 'PayableToTextField'),
  child4_name: ROW6(4, 'ChildNameTextField'),
  child4_dob: ROW6(4, 'DateOfBirthDateField'),
  child4_amount: ROW6(4, 'MonthlyAmountCurrencyField'),
  child4_payable_to: ROW6(4, 'PayableToTextField'),

  // item 6b mandatory additional support (child care = 6b1, uninsured health = 6b2)
  item6b: P2('List6[0].LI2[0].Item6bCheckbox[0]'),
  addon_childcare_pet_pct: P2('List6[0].LI2[0].LI2List1[0].LI1[0].Item6b1[0].LI1List1[0].LI1[0].Item6b1a[0].Item6b1aPercentField[0]'),
  addon_childcare_resp_pct: P2('List6[0].LI2[0].LI2List1[0].LI1[0].Item6b1[0].LI1List1[0].LI2[0].Item6b1b[0].Item6b1bPercentField[0]'),
  addon_uninsured_pet_pct: P2('List6[0].LI2[0].LI2List1[0].LI2[0].Item6b2[0].LI2List1[0].LI1[0].Item6b2a[0].Item6b2aPercentField[0]'),
  addon_uninsured_resp_pct: P2('List6[0].LI2[0].LI2List1[0].LI2[0].Item6b2[0].LI2List1[0].LI2[0].Item6b2b[0].Item6b2bPercentField[0]'),
  // "must pay" checkboxes next to the percentages
  addon_childcare_pet_cb: P2('List6[0].LI2[0].LI2List1[0].LI1[0].Item6b1[0].LI1List1[0].LI1[0].Item6b1a[0].Item6b1aCheckbox1[0]'),
  addon_childcare_resp_cb: P2('List6[0].LI2[0].LI2List1[0].LI1[0].Item6b1[0].LI1List1[0].LI2[0].Item6b1b[0].Item6b1bCheckbox1[0]'),
  addon_uninsured_pet_cb: P2('List6[0].LI2[0].LI2List1[0].LI2[0].Item6b2[0].LI2List1[0].LI1[0].Item6b2a[0].Item6b2aCheckbox1[0]'),
  addon_uninsured_resp_cb: P2('List6[0].LI2[0].LI2List1[0].LI2[0].Item6b2[0].LI2List1[0].LI2[0].Item6b2b[0].Item6b2bCheckbox1[0]'),

  // item 7a health insurance carried by
  health_petitioner: P3('List7[0].LI1[0].Item7a[0].Item7aCheckbox1[0]'),
  health_respondent: P3('List7[0].LI1[0].Item7a[0].Item7aCheckbox2[0]'),
}

export const FL342_TEMPLATE = {
  id: 'FL-342',
  title: 'Child Support Information and Order Attachment',
  url: '/forms/FL-342.pdf',
  revision: 'Rev. September 1, 2024',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl342.pdf',
  sourceSha256: '96e23993713bcea39e8e2f02d91bc689fa327cbc17add27a21fc93b11bee1e25',
  mapping: FL342_MAPPING,
}

registerForm(FL342_TEMPLATE)

export async function generateFL342(state) {
  const profile = buildFL342Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-342', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
