// FL-141 — Declaration Regarding Service of Declaration of Disclosure and
// Income and Expense Declaration.
//
// Unlike FL-140/142/150 (which are SERVED, not filed), FL-141 IS filed with the
// court — it is the proof that the disclosure documents were served (or that
// disclosure was waived). It carries no financial data: just the caption plus
// service/waiver checkboxes.
//
// Default scenario (uncontested "consent" divorce): the petitioner served the
// PRELIMINARY disclosure (FL-140 + FL-142 + FL-150) on the other party, and the
// parties mutually WAIVE the FINAL disclosure under Family Code § 2105(d) via
// FL-144 filed at the same time. Everything is overridable through the optional
// 'fl141_profile' answer.
//
// Single source: caption from buildPartyContact + CountyInfo (same as the rest
// of the packet); names identical to FL-100.

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
  return d
    ? `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
    : s || ''
}
const isTrue = (v) => v === true || v === 'true' || v === 'yes' || v === 1 || v === '1'
const json = (s) => {
  try {
    return JSON.parse(s || '{}') || {}
  } catch {
    return {}
  }
}

export function buildFL141Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)
  const court = countyInfo(user.county) || {}
  const fl = json(a.fl141_profile)

  const cityStateZip =
    [c.party_city, c.party_state].filter(Boolean).join(', ') +
    (c.party_zip ? ` ${c.party_zip}` : '')
  const partyBlock = [c.party_name, c.party_street, cityStateZip]
    .filter((s) => s && s.trim())
    .join('\n')

  const party = (a.disclosure_party || fl.disclosure_party || 'petitioner').toLowerCase()
  const isPet = party !== 'respondent'
  const method = (a.service_method || fl.service_method || 'mail').toLowerCase() // mail | personal

  // Service dates must be logical — never before the petition was filed.
  const clampDate = (d) => {
    const dd = parseDate(d)
    const pet = parseDate(a.petition_date || a.date_petition_filed)
    return fmtDateUS(dd && pet && dd < pet ? a.petition_date || a.date_petition_filed : d)
  }

  // Preliminary disclosure is served in every case (default true).
  const prelimServed =
    a.prelim_disclosure_served !== undefined ? isTrue(a.prelim_disclosure_served) : true
  const prelimDate = clampDate(a.prelim_served_date || fl.served_date || a.disclosure_served_date)

  // Final disclosure: either served, or waived (FC § 2105(d) mutual via FL-144).
  // Default for the consent scenario is waived.
  const finalServed = isTrue(a.final_disclosure_served) || fl.final_mode === 'served'
  const finalWaived =
    !finalServed &&
    (a.final_disclosure_waived === undefined ? true : isTrue(a.final_disclosure_waived))
  const finalDate = clampDate(a.final_served_date)

  return {
    // ---- caption (single source) ----
    party_block: partyBlock,
    party_phone: c.party_phone,
    party_email: c.party_email,
    attorney_for: c.attorney_for, // "Self (Pro Per)"
    court_county: user.county || '',
    court_street: court.street || '',
    court_mailing: court.mailing || '',
    court_city_zip: court.cityZip || '',
    court_branch: court.branch || '',
    petitioner_name: a.petitioner_name || '',
    respondent_name: a.respondent_name || '',
    case_number: '',

    // ---- form title ----
    title_party: isPet ? '1' : '2', // radio: 1 = Petitioner's, 2 = Respondent's
    title_preliminary: true,
    title_final: finalServed,

    // ---- item 1: I am the [party] (pro per, not attorney) ----
    i_am_attorney: false,
    i_am_petitioner: isPet,
    i_am_respondent: !isPet,

    // ---- item 2: preliminary disclosure served ----
    prelim_petitioner: prelimServed && isPet,
    prelim_respondent: prelimServed && !isPet,
    prelim_on_other_party: prelimServed,
    prelim_by_personal: prelimServed && method === 'personal',
    prelim_by_mail: prelimServed && method !== 'personal',
    prelim_date: prelimServed ? prelimDate : '',

    // ---- item 3: final disclosure served (only when not waived) ----
    final_petitioner: finalServed && isPet,
    final_respondent: finalServed && !isPet,
    final_on_other_party: finalServed,
    final_by_personal: finalServed && method === 'personal',
    final_by_mail: finalServed && method !== 'personal',
    final_date: finalServed ? finalDate : '',

    // ---- item 4: final service waived (FC § 2105(d) mutual, via FL-144) ----
    waive_service_of: finalWaived,
    waive_petitioner: finalWaived,
    waive_respondent: finalWaived, // mutual waiver
    waive_final: finalWaived,
    waive_2105d: finalWaived,
    waive_fl144_concurrent: finalWaived, // FL-144 filed at the same time
    waive_2110: false,

    // ---- signature ----
    signature_name: a.petitioner_printed_name || a.petitioner_name || '',
    signature_date: fmtDateUS(a.signature_date),
  }
}

// True when the final disclosure is waived under FC § 2105(d) — the packet must
// then also include FL-144 (Stipulation and Waiver of Final Declaration of
// Disclosure), filed at the same time as this FL-141.
export function fl141AddsFl144(state) {
  return buildFL141Profile(state).waive_2105d === true
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const S = (s) => `form1[0].#subform[0].${s}`
const H = (s) => S(`StdP1Header_sf[0].${s}`)

export const FL141_MAPPING = {
  // caption
  party_block: H('AddInfo[0].PartyAttyAddInfo_ft[0]'),
  party_phone: H('OtherContact[0].Phone_ft[0]'),
  party_email: H('OtherContact[0].Email_ft[0]'),
  attorney_for: H('OtherContact[0].AttyFor_ft[0]'),
  court_county: H('CourtInfo[0].CrtCounty_ft[0]'),
  court_street: H('CourtInfo[0].Street_ft[0]'),
  court_mailing: H('CourtInfo[0].MailingAdd_ft[0]'),
  court_city_zip: H('CourtInfo[0].CityZip_ft[0]'),
  court_branch: H('CourtInfo[0].Branch_ft[0]'),
  petitioner_name: H('TitlePartyName[0].Party1_ft[0]'),
  respondent_name: H('TitlePartyName[0].Party2_ft[0]'),
  case_number: H('CaseNumber[0].CaseNumber_ft[0]'),

  // form title
  title_party: H('FormTitle[0].CapPetResp_gp[0].Choose_Party[0]'),
  title_preliminary: H('FormTitle[0].CapPrelim_gp[0].preliminary_cb[0]'),
  title_final: H('FormTitle[0].CapFinal_gp[0].final_cb[0]'),

  // item 1 — I am the [attorney for] [petitioner] [respondent]
  i_am_attorney: S('AttyFor_gp[0].attorney_for_cb[0]'),
  i_am_petitioner: S('AttyForPet_gp[0].petitioner_cb[1]'),
  i_am_respondent: S('AttyForResp_gp[0].respondent_cb[1]'),

  // item 2 — preliminary declaration served
  prelim_petitioner: S('PrePaperPetSvd_gp[0].petitioner_cb[0]'),
  prelim_respondent: S('PrePapersRespSvd_gp[0].respondent_cb[0]'),
  prelim_on_other_party: S('PreOtherParty_gp[0].other_party[0]'),
  prelim_on_attorney: S('PreOtherPartyAtty_gp[0].op_attorney-cb[0]'),
  prelim_by_personal: S('PrePersonalSvc_gp[0].personalservice_cb[0]'),
  prelim_by_mail: S('PreMailSvc_gp[0].bymail_cb[0]'),
  prelim_other: S('PreOther_gp[0].PreOtherSpecify_cb[0]'),
  prelim_other_specify: S('PreOtherSpecify_ft[0]'),
  prelim_date: S('PreOnDate_ft[0]'),

  // item 3 — final declaration served
  final_petitioner: S('FinPapersPetSvd_gp[0].petitioner_cb[2]'),
  final_respondent: S('FinPapersRespSvd_gp[0].petitioner_cb[3]'),
  final_on_other_party: S('FinOtherParty_gp[0].other_party_cb[0]'),
  final_on_attorney: S('FinOtherPartyAtty_gp[0].other_party_atttorney_cb[0]'),
  final_by_personal: S('FinPersSvc_gp[0].personal_svc_cb[0]'),
  final_by_mail: S('FinMailSvc_gp[0].petitioner_cb[4]'),
  final_other: S('FinOther_gp[0].FinOther_cb[0]'),
  final_other_specify: S('FinSpecify_ft[0]'),
  final_date: S('FinOnDate_ft[0]'),

  // item 4 — service of disclosure waived
  waive_service_of: S('SvcOf_gp[0].service_of_cb[0]'),
  waive_petitioner: S('DODPet_gp[0].petitioner_cb[5]'),
  waive_respondent: S('DODResp_gp[0].petitioner_cb[6]'),
  waive_preliminary: S('DODPre_gp[0].preliminary_cb[0]'),
  waive_final: S('DODFin_gp[0].final_cb[0]'),
  waive_ie: S('IAndEDec_gp[0].IandEDec_cb[0]'),
  waive_2105d: S('DODWaiveFin2105d_gp[0].DODWaiveFin2105d_cb[0]'),
  waive_fl144_filed_on: S('DODWaiveFile_gp[0].CheckBox61[0]'),
  waive_fl144_filed_date: S('DODWaiveFileDate_ft[0]'),
  waive_fl144_concurrent: S('DODWaiveFileConc_gp[0].DODWaiveFileConc_gp_cb[0]'),
  waive_2107: S('ReceiptWaive_gp[0].WaiveReceipt_cb[0]'),
  waive_2107_date: S('on_date_ff[0]'),
  waive_2110: S('DODWaiveFin2110_gp[0].DODWaiveFin2110_cb[0]'),

  // signature
  signature_name: S('NameDate_gp[0].YourName_ft[0]'),
  signature_date: S('NameDate_gp[0].DateTimeField1[0]'),
}

export const FL141_TEMPLATE = {
  id: 'FL-141',
  title: 'Declaration Regarding Service of Disclosure',
  url: '/forms/FL-141.pdf',
  revision: 'Rev. July 1, 2013',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl141.pdf',
  sourceSha256: 'de3e79605350670bf4e7759af3d4ddc1a6e84b6608e958d1f3a568dd2e8e8f23',
  mapping: FL141_MAPPING,
}

registerForm(FL141_TEMPLATE)

export async function generateFL141(state) {
  const profile = buildFL141Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-141', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
