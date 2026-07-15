// Paystub photo → FL-150 income (MECHANICAL, client-directed).
//
// A photo is only ever a DRAFT source. The vision model (see the extract-paystub
// Edge Function) returns a strict JSON object; this module validates it, refuses
// to invent anything, converts it to per-field draft suggestions, and — only for
// the values the CLIENT explicitly confirms — writes them into the FL-150 profile.
// Manual entry is always an equal, first-class path.
//
// No-fabrication rule: every field the model cannot read must be `null`. This
// validator REJECTS non-null values that aren't well-typed, so a hallucinated or
// malformed value can never reach a form.

// The contract the Edge Function must satisfy (mirrored in its system prompt).
export const PAYSTUB_SCHEMA = {
  readable: 'boolean', // false ⇒ not a legible paystub; all other fields null
  employer_name: 'string|null',
  employer_address: 'string|null',
  pay_period_start: 'date|null', // YYYY-MM-DD
  pay_period_end: 'date|null',
  pay_frequency: 'enum|null', // weekly | biweekly | semimonthly | monthly
  gross_pay: 'number|null', // this pay period
  net_pay: 'number|null',
  ytd_gross: 'number|null',
}

const FREQ = new Set(['weekly', 'biweekly', 'semimonthly', 'monthly'])
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0
const isISO = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const isStr = (v) => typeof v === 'string' && v.trim() !== ''

// Validate a raw extraction object. Returns { ok, errors:[], value }.
// A field may be null (not read) or well-typed; anything else is an error —
// that is what stops fabricated/garbled values from flowing into a form.
export function validateExtraction(obj) {
  const errors = []
  if (!obj || typeof obj !== 'object') return { ok: false, errors: ['not an object'], value: null }
  if (typeof obj.readable !== 'boolean') errors.push('readable must be boolean')

  const nullable = (key, pred) => {
    const v = obj[key]
    if (v === null || v === undefined) return null
    if (!pred(v)) {
      errors.push(`${key} is not valid (got ${JSON.stringify(v)})`)
      return null
    }
    return v
  }

  const value = {
    readable: obj.readable === true,
    employer_name: nullable('employer_name', isStr),
    employer_address: nullable('employer_address', isStr),
    pay_period_start: nullable('pay_period_start', isISO),
    pay_period_end: nullable('pay_period_end', isISO),
    pay_frequency: nullable('pay_frequency', (v) => FREQ.has(v)),
    gross_pay: nullable('gross_pay', isNum),
    net_pay: nullable('net_pay', isNum),
    ytd_gross: nullable('ytd_gross', isNum),
  }
  // A non-readable image must not carry data (guards against contradiction).
  if (!value.readable) {
    for (const k of Object.keys(value)) if (k !== 'readable') value[k] = null
  }
  return { ok: errors.length === 0, errors, value }
}

// Convert a paystub gross to a monthly gross. Returns null if we can't do it
// mechanically (missing amount or frequency) — we never guess a period.
export function normalizeMonthly(gross_pay, pay_frequency) {
  if (!isNum(gross_pay) || !FREQ.has(pay_frequency)) return null
  const factor = { weekly: 52 / 12, biweekly: 26 / 12, semimonthly: 2, monthly: 1 }[pay_frequency]
  return Math.round(gross_pay * factor * 100) / 100
}

// Build the per-field draft list the UI shows for confirmation. Each item is a
// candidate the client must tick before it is written. `target` names the FL-150
// destination. Fields that are null (unread) are omitted.
export function extractionToDraft(ext) {
  const v = validateExtraction(ext).value
  if (!v || !v.readable) return []
  const draft = []
  if (v.employer_name) draft.push({ key: 'employer_name', target: 'employment.employer', value: v.employer_name })
  if (v.employer_address) draft.push({ key: 'employer_address', target: 'employment.address', value: v.employer_address })
  const monthly = normalizeMonthly(v.gross_pay, v.pay_frequency)
  if (monthly != null) {
    draft.push({ key: 'monthly_salary', target: 'income.salary', value: monthly, from: { gross: v.gross_pay, frequency: v.pay_frequency } })
  }
  return draft
}

// Apply the client-confirmed draft items into an existing fl150_profile object.
// Returns { fl150_profile, petitioner_income } — callers persist both. Only keys
// present in `confirmedKeys` are written; nothing else is touched.
export function applyConfirmed(fl150Profile, draft, confirmedKeys) {
  const profile = JSON.parse(JSON.stringify(fl150Profile || {}))
  profile.employment = profile.employment || {}
  profile.income = profile.income || {}
  let petitioner_income = null
  for (const item of draft) {
    if (!confirmedKeys.includes(item.key)) continue
    if (item.target === 'employment.employer') profile.employment.employer = item.value
    else if (item.target === 'employment.address') profile.employment.address = item.value
    else if (item.target === 'income.salary') {
      profile.income.salary = item.value
      petitioner_income = item.value
    }
  }
  return { fl150_profile: profile, petitioner_income }
}
