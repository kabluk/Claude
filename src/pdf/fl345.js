// FL-345 — Property Order Attachment to Judgment.
//
// Attachment to the judgment (FL-180 item 4m). Divides the community estate:
// which assets/debts each party receives (free-text lists, one item per line),
// plus an equalization payment computed in the app.
//
// Single source: the assets/debts themselves come from the SAME data as FL-142
// (fl142_profile); only the assignment (who gets what) is added here via
// fl345_profile. Totals must reconcile with FL-142 (assets 467,400 / debts 11,700).
//
// NB: FL-345 has no "attaches to (FL-180)" checkbox in its caption — the parent
// form is identified on FL-180 itself (item 4m).

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { buildPartyContact } from './party.js'

const json = (s) => {
  try {
    return JSON.parse(s || '{}') || {}
  } catch {
    return {}
  }
}
const num = (v) => {
  const n = Number(String(v ?? '').replace(/[, $]/g, ''))
  return Number.isFinite(n) ? n : 0
}
const money = (v) => {
  const n = num(v)
  return n ? n.toLocaleString('en-US') : n === 0 ? '0' : ''
}
const dollars = (v) => (money(v) ? `$${money(v)}` : '')

// Asset categories carry a `value`; debt categories carry an `amount`.
const ASSET_CATS = ['real_estate', 'furniture', 'jewelry', 'vehicles', 'savings', 'checking', 'credit_union', 'cash', 'tax_refund', 'life_insurance', 'stocks', 'retirement', 'profit_sharing', 'receivables', 'business', 'other_assets']
const DEBT_CATS = ['student_loans', 'taxes', 'support_arrears', 'loans_unsecured', 'credit_cards', 'other_debts']

export function buildFL345Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  buildPartyContact(a) // FL-345 caption carries no contact block

  const fl142 = json(a.fl142_profile)
  const assign = json(a.fl345_profile) // { assets:{cat:'petitioner'|'respondent'}, debts:{...}, equalization_payable? }
  const assetsSrc = fl142.assets || {}
  const debtsSrc = fl142.debts || {}
  const aAssign = assign.assets || {}
  const dAssign = assign.debts || {}

  // Build per-party asset/debt lists (one line per item) + running totals.
  const petAssets = []
  const respAssets = []
  let petAssetTotal = 0
  let respAssetTotal = 0
  for (const cat of ASSET_CATS) {
    const items = Array.isArray(assetsSrc[cat]) ? assetsSrc[cat] : []
    const who = (aAssign[cat] || '').toLowerCase()
    for (const it of items) {
      const line = `${it.description || cat}: ${dollars(it.value)}`
      if (who === 'respondent') {
        respAssets.push(line)
        respAssetTotal += num(it.value)
      } else if (who === 'petitioner') {
        petAssets.push(line)
        petAssetTotal += num(it.value)
      }
    }
  }

  const petDebts = []
  const respDebts = []
  let petDebtTotal = 0
  let respDebtTotal = 0
  for (const cat of DEBT_CATS) {
    const items = Array.isArray(debtsSrc[cat]) ? debtsSrc[cat] : []
    const who = (dAssign[cat] || '').toLowerCase()
    for (const it of items) {
      const line = `${it.description || cat}: ${dollars(it.amount)}`
      if (who === 'respondent') {
        respDebts.push(line)
        respDebtTotal += num(it.amount)
      } else if (who === 'petitioner') {
        petDebts.push(line)
        petDebtTotal += num(it.amount)
      }
    }
  }

  const hasAssets = petAssets.length + respAssets.length > 0
  const hasDebts = petDebts.length + respDebts.length > 0

  // Equalization: bring both parties to an equal NET share of the community.
  const petNet = petAssetTotal - petDebtTotal
  const respNet = respAssetTotal - respDebtTotal
  const diff = Math.abs(petNet - respNet)
  const equalize = hasAssets && diff > 0
  const equalizePayerIsPet = petNet > respNet // the party who received more pays
  const equalizeAmount = Math.round(diff / 2)

  const withTotal = (lines, total) =>
    lines.length ? `${lines.join('\n')}\n(Total: ${dollars(total)})` : ''

  return {
    // ---- caption ----
    petitioner_name: a.petitioner_name || '',
    respondent_name: a.respondent_name || '',
    case_number: '',

    // ---- item 1: division of community ASSETS ----
    no_assets: !hasAssets,
    pet_receives_assets: petAssets.length > 0,
    pet_assets_text: withTotal(petAssets, petAssetTotal),
    resp_receives_assets: respAssets.length > 0,
    resp_assets_text: withTotal(respAssets, respAssetTotal),
    assets_as_separate: hasAssets, // 1g: each takes their share as sole & separate

    // ---- item 2: division of community DEBTS ----
    no_debts: !hasDebts,
    pet_takes_debts: petDebts.length > 0,
    pet_debts_text: withTotal(petDebts, petDebtTotal),
    resp_takes_debts: respDebts.length > 0,
    resp_debts_text: withTotal(respDebts, respDebtTotal),

    // ---- item 3: equalization payment (computed) ----
    equalize,
    equalize_payer_pet: equalize && equalizePayerIsPet,
    equalize_payer_resp: equalize && !equalizePayerIsPet,
    equalize_amount: equalize ? money(equalizeAmount) : '',
    equalize_payable: equalize ? assign.equalization_payable || 'in full within 30 days of entry of judgment' : '',
  }
}

// True when there is community property to divide (FL-345 belongs in the packet).
export function fl345Required({ answers = [] } = {}) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const fl142 = json(a.fl142_profile)
  const assets = fl142.assets || {}
  return ASSET_CATS.some((c) => Array.isArray(assets[c]) && assets[c].length > 0)
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const capP1 = (s) => `FL-345[0].Page1[0].P1[0].pxCaption[0].${s}`
const capP2 = (s) => `FL-345[0].Page2[0].pxCaption[0].${s}`
const A = (s) => `FL-345[0].Page1[0].P1[0].SubSet[0].List1[0].${s}` // item 1 assets
const D1 = (s) => `FL-345[0].Page1[0].P1[0].List2[0].${s}` // item 2 debts (page 1)
const D2 = (s) => `FL-345[0].Page2[0].LIst2[0].${s}` // item 2 debts (page 2)
const EQ = (s) => `FL-345[0].Page2[0].SetSub[0].List3[0].${s}` // item 3 equalization

export const FL345_MAPPING = {
  // caption (both pages)
  petitioner_name: [capP1('TitlePartyName[0].Party1[0]'), capP2('TitlePartyName[0].Party1[0]')],
  respondent_name: [capP1('TitlePartyName[0].Party2[0]'), capP2('TitlePartyName[0].Party2[0]')],
  case_number: [capP1('CaseNumber[0].CaseNumber[0]'), capP2('CaseNumber[0].CaseNumber[0]')],

  // item 1 — community property assets
  no_assets: A('LI1[0].CheckMark1[0]'),
  pet_receives_assets: A('LI3[0].CheckMark1[0]'),
  pet_assets_text: A('LI3[0].FillText1[0]'),
  resp_receives_assets: A('LI4[0].CheckMark1[0]'),
  resp_assets_text: A('LI4[0].FillText1[0]'),
  assets_as_separate: A('LI7[0].CheckBox1[0]'),

  // item 2 — community property debts
  no_debts: D1('LI1[0].CheckBox1[0]'),
  pet_takes_debts: D1('LI3[0].CheckBox1[0]'), // "The petitioner [will not hold the respondent responsible for]"
  pet_debts_text: D1('LI3[0].List1[0].LI3[0].FillText1[0]'),
  resp_takes_debts: D2('LI4[0].CheckBox1[0]'), // "The respondent …"
  resp_debts_text: D2('LI4[0].List1[0].LI3[0].FillText1[0]'),

  // item 3 — equalization payment
  equalize: EQ('LI1[0].CheckBox1[0]'),
  equalize_payer_pet: EQ('LI1[0].Check[0]'),
  equalize_payer_resp: EQ('LI1[0].Check[1]'),
  equalize_amount: EQ('LI1[0].FillText2[0]'),
  equalize_payable: EQ('LI1[0].FillText3[0]'),
}

export const FL345_TEMPLATE = {
  id: 'FL-345',
  title: 'Property Order Attachment to Judgment',
  url: '/forms/FL-345.pdf',
  revision: 'Rev. January 1, 2021',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl345.pdf',
  sourceSha256: '4c341c2f9df9544e880364965b5bb07cc7bc8180b6037c877795beb42b0575df',
  mapping: FL345_MAPPING,
}

registerForm(FL345_TEMPLATE)

export async function generateFL345(state) {
  const profile = buildFL345Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-345', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
