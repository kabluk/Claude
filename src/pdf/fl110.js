// FL-110 — Summons (Family Law).
//
// Same engine path as FL-100/FL-105: registerForm + real AcroForm fields (no
// coordinate drawing). FL-110 is part of EVERY packet (with or without children).
//
// The form has only a handful of fillable fields; the bilingual notice and the
// Standard Family Law Restraining Orders (ATROS) are STATIC preprinted text and
// are never touched. The court address and the petitioner's pro-per contact are
// each a single multi-line field, composed here from structured case data
// (single source — same names/address as FL-100/FL-105).

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { countyInfo } from './counties.js'
import { buildPartyContact } from './party.js'

export function buildFL110Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a) // single-source petitioner contact
  const court = countyInfo(user.county) || {}

  const cityStateZip =
    [c.party_city, c.party_state].filter(Boolean).join(', ') +
    (c.party_zip ? ` ${c.party_zip}` : '')
  const partyAddr = [c.party_street, cityStateZip].filter((s) => s && s.trim()).join(', ')

  // Item 2: petitioner without an attorney — name / address / phone (+ email).
  const partyBlock = [
    c.party_name,
    partyAddr,
    [c.party_phone, c.party_email].filter(Boolean).join(' · '),
  ]
    .filter((s) => s && s.trim())
    .join('\n')

  // Item 1: name and address of the court.
  const courtBlock = [
    court.courtName,
    [court.branch, court.street].filter(Boolean).join(' — '),
    court.cityZip,
  ]
    .filter((s) => s && s.trim())
    .join('\n')

  return {
    respondent_name: a.respondent_name || '', // NOTICE TO RESPONDENT
    petitioner_name: a.petitioner_name || '', // Petitioner's name is
    court_block: courtBlock,
    party_block: partyBlock,
    case_number: '', // assigned by the clerk at filing
    // Date / Clerk / Deputy are completed by the court — left empty.
  }
}

const P = (s) => `topmostSubform[0].Page1[0].${s}`

export const FL110_MAPPING = {
  // NOTICE TO RESPONDENT / AVISO AL DEMANDADO (English + Spanish duplicate)
  respondent_name: [P('TextField2[0]'), P('#field[7]')],
  // Petitioner's name is / Nombre del demandante (English + Spanish duplicate)
  petitioner_name: [P('TextField2[1]'), P('#field[8]')],
  // 1. The name and address of the court are
  court_block: P('OtherSpecify_tf[0]'),
  // 2. Petitioner without an attorney: name, address, telephone
  party_block: P('T89[0]'),
  // case number (left empty — clerk assigns)
  case_number: P('T33[0]'),
}

// FormTemplate — pins the official form version in the repo.
export const FL110_TEMPLATE = {
  id: 'FL-110',
  title: 'Summons (Family Law)',
  url: '/forms/FL-110.pdf',
  // Footer reads: "FL-110 [Rev. January 1, 2015]".
  revision: 'Rev. January 1, 2015',
  checkedOn: '06/30/2026', // date the upstream revision was last verified
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl110.pdf',
  sourceSha256: '81acbb9eb92d48735bb6fdabbbe6c500d92807550cab9d1e211faa8d29e44e05',
  mapping: FL110_MAPPING,
  // Multi-line court / contact blocks — shrink so 3 lines fit the boxes.
  fontSizes: {
    [P('OtherSpecify_tf[0]')]: 9,
    [P('T89[0]')]: 9,
  },
}

registerForm(FL110_TEMPLATE)

export async function generateFL110(state) {
  const profile = buildFL110Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-110', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
