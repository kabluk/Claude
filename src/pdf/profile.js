// Builds the single "case/financial profile": a flat { field_key: value } map
// that PDF forms map from. ALL totals (assets, debts, expenses, support) are
// computed here in the app — never inside the PDF form.

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const parseList = (raw) => {
  try {
    const r = JSON.parse(raw || '[]')
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}

// answers: array of { field_key, value } (as stored by AppState).
// caseRec / user: the Case and User records.
export function buildCaseProfile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))

  const children = parseList(a.children)
  const assets = parseList(a.assets)
  const debts = parseList(a.debts)

  let finance = {}
  try {
    finance = JSON.parse(a.finance_profile || '{}') || {}
  } catch {
    finance = {}
  }
  const support = finance.result || null

  // --- computed totals (app-side arithmetic) ---
  const assets_total = assets.reduce((s, x) => s + num(x.value), 0)
  const debts_total = debts.reduce((s, x) => s + num(x.balance), 0)
  const net_estate = assets_total - debts_total
  const monthly_expenses = num(a.monthly_expenses)
  const deductions = num(a.deductions)

  const profile = {
    // parties
    petitioner_name: a.petitioner_name || '',
    petitioner_address: a.petitioner_address || '',
    respondent_name: a.respondent_name || '',
    respondent_address: a.respondent_address || '',
    marriage_date: a.marriage_date || '',
    separation_date: a.separation_date || '',

    // jurisdiction / case
    county: user.county || '',
    case_type: caseRec.type || '',
    has_children: !!caseRec.has_children,
    num_children: children.length,

    // income (raw)
    petitioner_income: a.petitioner_income || '',
    respondent_income: a.respondent_income || '',
    monthly_expenses: a.monthly_expenses || '',
    deductions: a.deductions || '',

    // computed totals
    assets_total,
    debts_total,
    net_estate,
    expenses_total: monthly_expenses + deductions,

    // support (computed in the calculator)
    child_support_total: support ? support.total : '',
    child_support_per_child: support ? support.perChild : '',
    child_support_payer: support ? support.payer : '',

    // spouse consent / signature
    respondent_consent: a.respondent_consent || '',
    respondent_name_confirm: a.respondent_name_confirm || '',
    respondent_signature: a.respondent_signature || '',
    signature_date: a.signature_date || '',
  }

  // Flatten each child into indexed keys: child_1_name, child_1_dob, …
  children.forEach((c, i) => {
    const p = `child_${i + 1}`
    profile[`${p}_name`] = c.name || ''
    profile[`${p}_dob`] = c.dob || ''
    profile[`${p}_birthplace`] = c.birthplace || ''
    profile[`${p}_sex`] = c.sex || ''
  })

  return profile
}
