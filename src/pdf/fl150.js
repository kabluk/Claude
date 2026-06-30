// FL-150 — Income and Expense Declaration (the petitioner's own declaration).
//
// Full mapping of the substantive sections (items 1–3 employment/age/tax,
// 5 income, 6 investment, 7 self-employment, 10 deductions, 11 assets,
// 13 expenses line-by-line, 16–17 children) — not just the caption.
//
// Data sources (single source, no duplication):
//   - calculator / finance_profile  → salary, other-party income, timeshare
//   - 'children' answer             → number of children
//   - 'assets' answer               → community property total (item 11)
//   - 'fl150_profile' answer (JSON) → the rest (employment, income breakdown,
//     deductions, per-category expenses, children health) — these would be
//     collected by a future wizard section; absent values are simply left blank.
// All totals (income, expenses) are computed here in the app.

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
  return d ? `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}` : s || ''
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
// Dollar amounts: "$" is preprinted, output the number only (with separators).
const money = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return ''
  const n = num(v)
  return n ? n.toLocaleString('en-US') : ''
}

export function buildFL150Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)
  const court = countyInfo(user.county) || {}
  const fl = json(a.fl150_profile) // employment/income/deductions/expenses/children extras
  const finance = json(a.finance_profile)
  const emp = fl.employment || {}
  const inc = fl.income || {}
  const ded = fl.deductions || {}
  const ast = fl.assets || {}
  const exp = fl.expenses || {}
  const ch = fl.children || {}

  const children = list(a.children)
  const assets = list(a.assets)
  const propertyTotal = assets.reduce((s, x) => s + num(x.value), 0)

  // item 5a salary defaults to the calculator's petitioner income.
  const salary = inc.salary ?? a.petitioner_income ?? ''

  // item 13 expenses — per category; total computed in-app.
  const E = {
    home: exp.home, // rent or mortgage
    proptax: exp.property_tax,
    homeins: exp.home_insurance,
    maint: exp.maintenance,
    healthcare: exp.healthcare,
    childcare: exp.childcare,
    groceries: exp.groceries,
    eatingout: exp.eating_out,
    utilities: exp.utilities,
    phone: exp.phone,
    laundry: exp.laundry,
    clothes: exp.clothes,
    education: exp.education,
    entertainment: exp.entertainment,
    auto: exp.auto,
    insurance: exp.insurance,
    savings: exp.savings,
    charity: exp.charity,
    installments: exp.installments,
    other: exp.other,
  }
  const expensesTotal = Object.values(E).reduce((s, v) => s + num(v), 0)

  // item 16b timeshare — finance_profile.timeshareA is % of time with petitioner.
  const tsMe = ch.timeshare_me ?? finance.timeshareA ?? ''
  const tsOther = String(tsMe).trim() !== '' ? 100 - num(tsMe) : ''

  return {
    // ---- caption (single source) ----
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

    // ---- §1 employment ----
    emp_employer: emp.employer || '',
    emp_address: emp.address || '',
    emp_phone: emp.phone || '',
    emp_occupation: emp.occupation || '',
    emp_date_started: fmtDateUS(emp.date_started),
    emp_hours: emp.hours_per_week || '',
    gross_pay: money(salary),
    income_per_month: String(salary).trim() !== '',

    // ---- §2 age & education ----
    age: emp.age ?? fl.age ?? '',
    hs_yes: (fl.education?.high_school ?? true) === true,
    hs_no: (fl.education?.high_school ?? true) === false,
    college_years: fl.education?.college_years ?? '',

    // ---- §3 tax information ----
    tax_year: fl.tax?.year ?? '',
    tax_single: fl.tax?.status === 'single',
    tax_hoh: fl.tax?.status === 'head_of_household',
    tax_mfs: fl.tax?.status === 'married_separately',
    tax_mfj: fl.tax?.status === 'married_jointly',
    tax_ca: (fl.tax?.state ?? 'CA') === 'CA',
    exemptions: fl.tax?.exemptions ?? '',

    // ---- §4 other party's income ----
    respondent_income: money(a.respondent_income),

    // ---- §5 income (Average monthly column) ----
    inc_salary: money(salary),
    inc_overtime: money(inc.overtime),
    inc_commissions: money(inc.commissions),
    inc_public_assistance: money(inc.public_assistance),
    inc_spousal: money(inc.spousal_support),
    inc_partner: money(inc.partner_support),
    inc_pension: money(inc.pension),
    inc_ss: money(inc.social_security),
    inc_disability: money(inc.disability),
    inc_unemployment: money(inc.unemployment),
    inc_workers_comp: money(inc.workers_comp),
    inc_other: money(inc.other),
    inc_other_label: inc.other_label || '',

    // ---- §6 investment income ----
    inv_dividends: money(inc.dividends),
    inv_rental: money(inc.rental),
    inv_trust: money(inc.trust),

    // ---- §7 self-employment ----
    self_emp_income: money(inc.self_employment),
    self_emp_name: inc.business_name || '',
    self_emp_type: inc.business_type || '',

    // ---- §10 deductions (lines a–g, in form order) ----
    ded_union: money(ded.union_dues),
    ded_retirement: money(ded.retirement),
    ded_health: money(ded.health_premiums),
    ded_child_support: money(ded.child_support_paid),
    ded_spousal_support: money(ded.spousal_support_paid),
    ded_partner_support: money(ded.partner_support_paid),
    ded_job: money(ded.job_expenses),

    // ---- §11 assets ----
    asset_cash: money(ast.cash),
    asset_stocks: money(ast.stocks),
    asset_property: money(ast.property ?? propertyTotal),
    asset_property_real: propertyTotal > 0 || ast.property,
    asset_property_personal: propertyTotal > 0 || ast.property,

    // ---- §13 expenses (line-by-line + total) ----
    exp_home: money(E.home),
    exp_is_rent: (exp.home_type ?? 'rent') === 'rent',
    exp_is_mortgage: exp.home_type === 'mortgage',
    exp_proptax: money(E.proptax),
    exp_homeins: money(E.homeins),
    exp_maint: money(E.maint),
    exp_healthcare: money(E.healthcare),
    exp_childcare: money(E.childcare),
    exp_groceries: money(E.groceries),
    exp_eatingout: money(E.eatingout),
    exp_utilities: money(E.utilities),
    exp_phone: money(E.phone),
    exp_laundry: money(E.laundry),
    exp_clothes: money(E.clothes),
    exp_education: money(E.education),
    exp_entertainment: money(E.entertainment),
    exp_auto: money(E.auto),
    exp_insurance: money(E.insurance),
    exp_savings: money(E.savings),
    exp_charity: money(E.charity),
    exp_installments: money(E.installments),
    exp_other: money(E.other),
    exp_other_label: exp.other_label || '',
    exp_total: money(expensesTotal),
    expenses_actual: expensesTotal > 0,

    // ---- §16–17 children ----
    num_children: children.length ? String(children.length) : '',
    ts_me: String(tsMe).trim() !== '' ? `${num(tsMe)}` : '',
    ts_other: tsOther === '' ? '' : `${tsOther}`,
    hc_have: ch.health_insurance === true,
    hc_no: ch.health_insurance === false,
    hc_company: ch.health_company || '',
    hc_cost: money(ch.health_cost),

    // ---- signature ----
    signature_date: fmtDateUS(a.signature_date),
    petitioner_printed_name: a.petitioner_name || '',
  }
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const P1 = (s) => `FL-150[0].Page1[0].${s}`
const P2 = (s) => `FL-150[0].Page2[0].${s}`
const P3 = (s) => `FL-150[0].Page3[0].${s}`
const P4 = (s) => `FL-150[0].Page4[0].${s}`
const H = (s) => P1(`StdP1Header_sf[0].${s}`)
const PX = (n, s) => `FL-150[0].Page${n}[0].PxCaption_sf[0].${s}`
const EXPN = (li) => P3(`List13[0].Li${li}[0].EXPN[0]`)

export const FL150_MAPPING = {
  // caption
  party_name: H('AttyInfo[0].AttyName_ft[0]'),
  party_street: H('AttyInfo[0].AttyStreet_ft[0]'),
  party_city: H('AttyInfo[0].AttyCity_ft[0]'),
  party_state: H('AttyInfo[0].AttyState_ft[0]'),
  party_zip: H('AttyInfo[0].AttyZip_ft[0]'),
  party_phone: H('AttyInfo[0].Phone_ft[0]'),
  party_email: H('AttyInfo[0].Email_ft[0]'),
  attorney_for: H('AttyInfo[0].AttyFor_ft[0]'),
  court_county: H('CourtInfo[0].CrtCounty_ft[0]'),
  court_street: H('CourtInfo[0].Street_ft[0]'),
  court_mailing: H('CourtInfo[0].MailingAdd_ft[0]'),
  court_city_zip: H('CourtInfo[0].CityZip_ft[0]'),
  court_branch: H('CourtInfo[0].Branch_ft[0]'),
  petitioner_name: [
    H('TitlePartyName[0].Party1_ft[0]'),
    PX(2, 'TitlePartyName[0].Party1_ft[0]'),
    PX(3, 'TitlePartyName[0].Party1_ft[0]'),
    PX(4, 'TitlePartyName[0].Party1_ft[0]'),
  ],
  respondent_name: [
    H('TitlePartyName[0].Party2_ft[0]'),
    PX(2, 'TitlePartyName[0].Party2_ft[0]'),
    PX(3, 'TitlePartyName[0].Party2_ft[0]'),
    PX(4, 'TitlePartyName[0].Party2_ft[0]'),
  ],
  case_number: [
    H('CaseNumber[0].CaseNumber_ft[0]'),
    PX(2, 'CaseNumber[0].CaseNumber_ft[0]'),
    PX(3, 'CaseNumber[0].CaseNumber_ft[0]'),
    PX(4, 'CaseNumber[0].CaseNumber_ft[0]'),
  ],

  // §1 employment
  emp_employer: P1('List1[0].Li1[0].Employer_tf[0]'),
  emp_address: P1('List1[0].Li2[0].Employer_address_tf[0]'),
  // NB: this field's partial name contains a literal dot — pdf-lib's getField
  // needs it backslash-escaped so it isn't treated as a name separator.
  emp_phone: P1('List1[0].Li3[0].Employer_phone\\.ft[0]'),
  emp_occupation: P1('List1[0].Li4[0].Party_occupation_tf[0]'),
  emp_date_started: P1('List1[0].Li5[0].Date_started_job_tf[0]'),
  emp_hours: P1('List1[0].Li7[0].hours_tf[0]'),
  gross_pay: P1('List1[0].Li8[0].gross_tf[0]'),
  income_per_month: P1('List1[0].Li8[0].Gross_cb[0]'),

  // §2 age & education
  age: P1('List2[0].Li1[0].FillText1[0]'),
  hs_yes: P1('List2[0].Li2[0].HSchl_cb[0]'),
  hs_no: P1('List2[0].Li2[0].HSchl_cb[1]'),
  college_years: P1('List2[0].Li3[0].FillText1[0]'),

  // §3 tax
  tax_year: P1('List3[0].Li1[0].FillText109[0]'),
  tax_single: P1('List3[0].Li2[0].Tax_cb1[0]'),
  tax_hoh: P1('List3[0].Li2[0].Tax_cb2[0]'),
  tax_mfs: P1('List3[0].Li2[0].Tax_cb3[0]'),
  tax_mfj: P1('List3[0].Li2[0].RB2Choices[0]'),
  tax_ca: P1('List3[0].Li3[0].TaxSt_cb[0]'),
  exemptions: P1('List3[0].Li4[0].FillText1[0]'),

  // §4 other party's income
  respondent_income: P1('List4[0].Li1[0].FillTextincm[0]'),

  // §5 income (Average monthly column)
  inc_salary: P2('List5[0].Li1[0].TextField7[0]'),
  inc_overtime: P2('List5[0].Li2[0].TextField8[0]'),
  inc_commissions: P2('List5[0].Li3[0].TextField9[0]'),
  inc_public_assistance: P2('List5[0].Li4[0].TextField10[0]'),
  inc_spousal: P2('List5[0].Li5[0].TextField11[0]'),
  inc_partner: P2('List5[0].Li6[0].TextField12[0]'),
  inc_pension: P2('List5[0].Li7[0].TextField13[0]'),
  inc_ss: P2('List5[0].Li8[0].TextField14[0]'),
  inc_disability: P2('List5[0].Li9[0].TextField15[0]'),
  inc_unemployment: P2('List5[0].Li10[0].TextField16[0]'),
  inc_workers_comp: P2('List5[0].Li11[0].TextField17[0]'),
  inc_other: P2('List5[0].Li12[0].TextField18[0]'),
  inc_other_label: P2('List5[0].Li12[0].FillText1[0]'),

  // §6 investment income
  inv_dividends: P2('List6[0].Li1[0].TextField23[0]'),
  inv_rental: P2('List6[0].L2[0].TextField22[0]'),
  inv_trust: P2('List6[0].L3[0].TextField21[0]'),

  // §7 self-employment
  self_emp_income: P2('List7[0].L1[0].TextField[0]'),
  self_emp_name: P2('List7[0].L1[0].FillText2[0]'),
  self_emp_type: P2('List7[0].L1[0].FillText3[0]'),

  // §10 deductions — lines a–g map straight to L1–L7 (L5 carries the
  // "federally tax deductible" checkbox, i.e. line e = spousal support).
  ded_union: P2('List10[0].L1[0].FillText1[0]'),
  ded_retirement: P2('List10[0].L2[0].FillText1[0]'),
  ded_health: P2('List10[0].L3[0].FillText1[0]'),
  ded_child_support: P2('List10[0].L4[0].FillText1[0]'),
  ded_spousal_support: P2('List10[0].L5[0].FillText1[0]'),
  ded_partner_support: P2('List10[0].L6[0].FillText1[0]'),
  ded_job: P2('List10[0].L7[0].FillText1[0]'),

  // §11 assets
  asset_cash: P2('List11[0].L1[0].FillText1[0]'),
  asset_stocks: P2('List11[0].L2[0].FillText1[0]'),
  asset_property: P2('List11[0].L3[0].FillText1[0]'),
  asset_property_real: P2('List11[0].L3[0].realcb[0]'),
  asset_property_personal: P2('List11[0].L3[0].persncb[0]'),

  // §13 expenses (line-by-line)
  exp_home: P3('List13[0].Li1[0].List[0].L1[0].EXPN[0]'),
  exp_is_rent: P3('List13[0].Li1[0].List[0].L1[0].CBChoice1_cb[0]'),
  exp_is_mortgage: P3('List13[0].Li1[0].List[0].L1[0].CBChoice1_cb1[0]'),
  exp_proptax: P3('List13[0].Li1[0].List[0].L2[0].EXPN[0]'),
  exp_homeins: P3('List13[0].Li1[0].List[0].L3[0].EXPN[0]'),
  exp_maint: P3('List13[0].Li1[0].List[0].L4[0].EXPN[0]'),
  exp_healthcare: EXPN(2),
  exp_childcare: EXPN(3),
  exp_groceries: EXPN(4),
  exp_eatingout: EXPN(5),
  exp_utilities: EXPN(6),
  exp_phone: EXPN(7),
  exp_laundry: EXPN(8),
  exp_clothes: EXPN(9),
  exp_education: EXPN(10),
  exp_entertainment: EXPN(11),
  exp_auto: EXPN(12),
  exp_insurance: EXPN(13),
  exp_savings: EXPN(14),
  exp_charity: EXPN(15),
  exp_installments: EXPN(16),
  exp_other_label: P3('List13[0].Li17[0].FillText1[0]'),
  exp_other: EXPN(17),
  exp_total: P3('List13[0].Li18[0].TOTAL[0]'),
  expenses_actual: P3('List13[0].MonthEx_cb[1]'),

  // §16 number of children + timeshare
  num_children: P4('List16[0].L1[0].TextField6[0]'),
  ts_me: P4('List16[0].L2[0].TextField[0]'),
  ts_other: P4('List16[0].L2[0].TextField1[0]'),
  // §17 children's health insurance
  hc_have: P4('List17[0].L1[0].ChildHC_cb[0]'),
  hc_no: P4('List17[0].L1[0].ChildHC_cb[1]'),
  hc_company: P4('List17[0].L2[0].FillText1[0]'),
  hc_cost: P4('List17[0].L4[0].FillText1[0]'),

  // signature
  signature_date: P1('Signdate[0]'),
  petitioner_printed_name: P1('FillText56[0]'),
}

export const FL150_TEMPLATE = {
  id: 'FL-150',
  title: 'Income and Expense Declaration',
  url: '/forms/FL-150.pdf',
  revision: 'Rev. September 1, 2024',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl150.pdf',
  sourceSha256: '46ca00246ae0f26ad893ce3ded2bd502fd6df299258b02070395cc597a3f68b4',
  mapping: FL150_MAPPING,
}

registerForm(FL150_TEMPLATE)

export async function generateFL150(state) {
  const profile = buildFL150Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-150', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
