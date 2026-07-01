// FL-142 — Schedule of Assets and Debts (Family Law).
//
// The COMPLETE itemized list of assets and debts (FL-150 only carries a 3-bucket
// summary). Like FL-140, this is SERVED on the other party and NOT filed with
// the court. Single page-per-category layout: the official form gives ONE row
// per category, so when a category holds several items we fold them into that
// row (subtotal + joined description) and flag that a continuation sheet is
// needed — totals are always computed in the app from every item.
//
// Data sources (single source, shared with FL-150):
//   - a.assets                 → real-estate / property items (same as FL-100 §8)
//   - fl150_profile.assets     → cash / stocks summary (reconciles with FL-150 §11)
//   - 'fl142_profile' (JSON)   → the full itemization (all 16 asset categories +
//     6 debt categories); when absent we derive a minimal list from the two
//     sources above so the totals still reconcile with FL-150.
//
// IMPORTANT: field roles are read from the form's /TU labels, NOT positionally —
// the column order is inconsistent (item 2 is reversed; items 4 & 11 put the
// "amount owed" column in TextField5). The per-category config below encodes the
// verified role→field for each row.

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { countyInfo } from '../data/counties.js'
import { buildPartyContact } from './party.js'

function parseDate(s) {
  if (!s) return null
  let m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/.exec(s)
  if (m) return new Date(+m[1], +m[2] - 1, +(m[3] || 1))
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
  if (v === undefined || v === null || String(v).trim() === '') return ''
  const n = num(v)
  return n ? n.toLocaleString('en-US') : n === 0 ? '0' : ''
}

// ---- per-category field roles (verified against /TU labels) ----
// Each asset category: { key, page, list, desc, sep, date, value, owed }
const ASSET_CATS = [
  { key: 'real_estate', page: 1, list: 'List1', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'furniture', page: 1, list: 'List2', desc: 'TextField6', sep: 'TextField4', date: 'TextField3', value: 'TextField2', owed: 'TextField1' }, // reversed
  { key: 'jewelry', page: 1, list: 'List3', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'vehicles', page: 2, list: 'List4', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField5' },
  { key: 'savings', page: 2, list: 'List5', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'checking', page: 2, list: 'List6', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'credit_union', page: 2, list: 'List7', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'cash', page: 2, list: 'List8', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'tax_refund', page: 2, list: 'List9', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'life_insurance', page: 2, list: 'List10', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'stocks', page: 3, list: 'List11', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField5' },
  { key: 'retirement', page: 3, list: 'List12', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'profit_sharing', page: 3, list: 'List13', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'receivables', page: 3, list: 'List14', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'business', page: 3, list: 'List15', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
  { key: 'other_assets', page: 3, list: 'List16', desc: 'TextField1', sep: 'TextField2', date: 'TextField3', value: 'TextField4', owed: 'TextField6' },
]

// Each debt category: { key, page, list, desc, sep, owing, date }
const DEBT_CATS = [
  { key: 'student_loans', page: 4, list: 'List19', desc: 'TextField1', sep: 'TextField2', owing: 'TextField3', date: 'TextField4' },
  { key: 'taxes', page: 4, list: 'List20', desc: 'TextField1', sep: 'TextField2', owing: 'TextField3', date: 'TextField6' },
  { key: 'support_arrears', page: 4, list: 'List21', desc: 'TextField1', sep: 'TextField2', owing: 'TextField3', date: 'TextField6' },
  { key: 'loans_unsecured', page: 4, list: 'List22', desc: 'TextField1', sep: 'TextField2', owing: 'TextField3', date: 'TextField6' },
  { key: 'credit_cards', page: 4, list: 'List23', desc: 'TextField1', sep: 'TextField2', owing: 'TextField3', date: 'TextField6' },
  { key: 'other_debts', page: 4, list: 'List24', desc: 'TextField1', sep: 'TextField2', owing: 'TextField3', date: 'TextField6' },
]

const fq = (cat, role) => `FL-142[0].Page${cat.page}[0].${cat.list}[0].Li1[0].${cat[role]}[0]`

// Fold every item of a category into the one available row (subtotal + joined
// description). Returns the row fields plus how many items overflowed (>1).
function foldCategory(items) {
  const arr = (items || []).filter((x) => x && (x.description || x.value != null || x.amount != null))
  if (!arr.length) return null
  const value = arr.reduce((s, x) => s + num(x.value), 0)
  const owed = arr.reduce((s, x) => s + num(x.owed), 0)
  const amount = arr.reduce((s, x) => s + num(x.amount), 0)
  const desc = arr.map((x) => x.description).filter(Boolean).join('; ')
  return {
    desc,
    sep: arr[0].sep || '',
    date: fmtDateUS(arr[0].date),
    value,
    owed,
    amount,
    extra: arr.length - 1,
  }
}

export function buildFL142Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)
  const court = countyInfo(user.county) || {}
  const fl = json(a.fl142_profile)
  const flAssets = fl.assets || {}
  const flDebts = fl.debts || {}
  const fl150 = json(a.fl150_profile)
  const summary = fl150.assets || {}

  const cityStateZip =
    [c.party_city, c.party_state].filter(Boolean).join(', ') +
    (c.party_zip ? ` ${c.party_zip}` : '')
  const partyBlock = [c.party_name, c.party_street, cityStateZip]
    .filter((s) => s && s.trim())
    .join('\n')

  // Fallback derivation (only used where fl142_profile omits a category) so the
  // schedule still reconciles with FL-150's summary buckets.
  const genericAssets = list(a.assets) // e.g. [{ description, value, owed?, date? }]
  const assetItems = (cat) => {
    if (flAssets[cat.key] !== undefined) return flAssets[cat.key]
    if (cat.key === 'real_estate' && genericAssets.length) return genericAssets
    if (cat.key === 'savings' && !flAssets.savings && !flAssets.checking && summary.cash != null)
      return [{ description: 'Deposit accounts', value: summary.cash }]
    if (cat.key === 'stocks' && summary.stocks != null)
      return [{ description: 'Stocks / mutual funds', value: summary.stocks }]
    return []
  }

  const out = {
    // ---- caption (single source) ----
    party_block: partyBlock,
    party_phone: c.party_phone,
    attorney_for: c.attorney_for,
    court_county: user.county || '',
    petitioner_name: a.petitioner_name || '',
    respondent_name: a.respondent_name || '',
    case_number: '',

    // ---- whose schedule ----
    party_petitioner: (fl.disclosure_party || 'Petitioner').toLowerCase() === 'petitioner',
    party_respondent: (fl.disclosure_party || 'Petitioner').toLowerCase() === 'respondent',

    // ---- signature ----
    signature_date: fmtDateUS(a.signature_date),
    petitioner_printed_name: a.petitioner_name || '',
  }

  // ---- assets ----
  let assetsValueTotal = 0
  let assetsOwedTotal = 0
  let extraRows = 0
  for (const cat of ASSET_CATS) {
    const folded = foldCategory(assetItems(cat))
    if (!folded) continue
    assetsValueTotal += folded.value
    assetsOwedTotal += folded.owed
    extraRows += folded.extra
    out[`${cat.key}_desc`] = folded.extra ? `${folded.desc} (see continuation)` : folded.desc
    out[`${cat.key}_sep`] = folded.sep
    out[`${cat.key}_date`] = folded.date
    out[`${cat.key}_value`] = money(folded.value)
    out[`${cat.key}_owed`] = folded.owed ? money(folded.owed) : ''
  }
  out.assets_value_total = money(assetsValueTotal)
  out.assets_owed_total = assetsOwedTotal ? money(assetsOwedTotal) : ''

  // ---- debts ----
  let debtsTotal = 0
  for (const cat of DEBT_CATS) {
    const folded = foldCategory(flDebts[cat.key])
    if (!folded) continue
    debtsTotal += folded.amount
    extraRows += folded.extra
    out[`${cat.key}_desc`] = folded.extra ? `${folded.desc} (see continuation)` : folded.desc
    out[`${cat.key}_sep`] = folded.sep
    out[`${cat.key}_owing`] = money(folded.amount)
    out[`${cat.key}_date`] = folded.date
  }
  out.debts_total = money(debtsTotal)

  // ---- continuation sheets (item 27) ----
  out.continuation_flag = extraRows > 0
  out.continuation_pages = extraRows > 0 ? String(extraRows) : ''

  return out
}

// True when the schedule needs a continuation sheet (any category has >1 item).
export function fl142NeedsContinuation(state) {
  const p = buildFL142Profile(state)
  return p.continuation_flag === true
}

// ---------------- mapping (built from the verified per-category config) --------
const CAP = (s) => `FL-142[0].Page1[0].P1Caption[0].${s}`

const FL142_MAPPING = {
  // caption
  party_block: CAP('AttyPartyInfo[0].TextField1[0]'),
  party_phone: CAP('AttyPartyInfo[0].Phone[0]'),
  attorney_for: CAP('AttyPartyInfo[0].Email[0]'), // field named "Email" but /TU = ATTORNEY FOR (Name)
  court_county: CAP('CourtInfo[0].CrtCounty[0]'),
  petitioner_name: CAP('TitlePartyName[0].Party1[0]'),
  respondent_name: CAP('TitlePartyName[0].Party2[0]'),
  case_number: CAP('CaseNumber[0].CaseNumber[0]'),
  party_petitioner: CAP('FormTitle[0].RB2Choice2[0]'),
  party_respondent: CAP('FormTitle[0].RB2Choice2[1]'),

  // totals + signature
  assets_value_total: 'FL-142[0].Page3[0].List18[0].Li1[0].total1[0]',
  assets_owed_total: 'FL-142[0].Page3[0].List18[0].Li1[0].total2[0]',
  debts_total: 'FL-142[0].Page4[0].List26[0].Li1[0].TotalDebts[0]',
  signature_date: 'FL-142[0].Page4[0].SignSub[0].SigDate[0]',
  petitioner_printed_name: 'FL-142[0].Page4[0].SignSub[0].SigName[0]',
  continuation_flag: 'FL-142[0].Page4[0].List27[0].Li1[0].ChoiceNumber[0]',
  continuation_pages: 'FL-142[0].Page4[0].List27[0].Li1[0].FillText1[0]',
}
for (const cat of ASSET_CATS) {
  FL142_MAPPING[`${cat.key}_desc`] = fq(cat, 'desc')
  FL142_MAPPING[`${cat.key}_sep`] = fq(cat, 'sep')
  FL142_MAPPING[`${cat.key}_date`] = fq(cat, 'date')
  FL142_MAPPING[`${cat.key}_value`] = fq(cat, 'value')
  FL142_MAPPING[`${cat.key}_owed`] = fq(cat, 'owed')
}
for (const cat of DEBT_CATS) {
  FL142_MAPPING[`${cat.key}_desc`] = fq(cat, 'desc')
  FL142_MAPPING[`${cat.key}_sep`] = fq(cat, 'sep')
  FL142_MAPPING[`${cat.key}_owing`] = fq(cat, 'owing')
  FL142_MAPPING[`${cat.key}_date`] = fq(cat, 'date')
}

export { FL142_MAPPING }

export const FL142_TEMPLATE = {
  id: 'FL-142',
  title: 'Schedule of Assets and Debts',
  url: '/forms/FL-142.pdf',
  revision: 'Rev. July 1, 2025',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl142.pdf',
  sourceSha256: 'f5d50b2aee505127139cc8f2f3638b1942a0cc85db05d9ece2e7949df29ead67',
  mapping: FL142_MAPPING,
}

registerForm(FL142_TEMPLATE)

export async function generateFL142(state) {
  const profile = buildFL142Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-142', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
