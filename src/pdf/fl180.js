// FL-180 — Judgment (Family Law).
//
// The final judgment. FL-180 itself carries almost no substantive terms — it
// RECITES the type/basis of the judgment and then points to the order
// attachments (FL-341 custody, FL-342 child support, FL-343 spousal support,
// FL-345 property). Without the matching attachments a judge will not sign it.
//
// Single source: caption/dates/former-name come from the same answers that feed
// FL-100 (date_of_marriage / date_of_separation live on FL-100 — FL-180 has no
// fields for them; the only date here is when marital status ends). Attachment
// checkboxes are driven by the case facts (children → FL-341+FL-342, property
// division → FL-345).

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
import { countyInfo } from '../data/counties.js'
import { buildPartyContact } from './party.js'
import { normalizeSpousalType } from './spousal.js'

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
const list = (s) => {
  try {
    const r = JSON.parse(s || '[]')
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}
const isTrue = (v) => v === true || v === 'true' || v === 'yes' || v === 1 || v === '1'

export function buildFL180Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  const c = buildPartyContact(a)
  const court = countyInfo(user.county) || {}

  const cityStateZip =
    [c.party_city, c.party_state].filter(Boolean).join(', ') +
    (c.party_zip ? ` ${c.party_zip}` : '')
  const partyBlock = [c.party_name, c.party_street, cityStateZip]
    .filter((s) => s && s.trim())
    .join('\n')

  // Judgment type — dissolution for a divorce case.
  const isDissolution = caseRec.type === 'uncontested' || caseRec.type === 'contested'

  // Basis (item 2). Default for an uncontested case: "Default or uncontested"
  // resolved "By declaration under Family Code section 2336" (the no-hearing
  // paperwork path). A stipulated judgment uses "Agreement in court".
  const basis = (a.judgment_basis || (caseRec.type === 'contested' ? 'contested' : 'default')).toLowerCase()

  // Attachments — driven by the case facts.
  const hasChildren = !!caseRec.has_children
  const hasProperty = list(a.assets).length > 0 || isTrue(a.property_division)

  // Spousal/partner support disposition (item 4l). A judgment MUST address it:
  //   ordered    → 4l(3) "as set forth in the attached FL-343" (FL-343 in packet)
  //   reserved   → 4l(1) reserved for future determination (both parties)
  //   terminated → 4l(2) jurisdiction terminated (both parties)
  // Single source shared with FL-343 (normalizeSpousalType); a "waived" type is
  // shown here as jurisdiction terminated. Default: "reserved".
  const ssType = normalizeSpousalType(a)
  const spousalOrdered = ssType === 'ordered'
  const spousalReserved = ssType === 'reserved'
  const spousalTerminated = ssType === 'terminated' || ssType === 'waived'

  const attachFl341 = hasChildren
  const attachFl342 = hasChildren
  const attachFl343 = spousalOrdered
  const attachFl345 = hasProperty
  const pages = [attachFl341, attachFl342, attachFl343, attachFl345].filter(Boolean).length

  // Case name (page 2): "Last, First" of each party.
  const caseName = [a.petitioner_name, a.respondent_name].filter(Boolean).join(' / ')

  // Children of the marriage (item 4i) — names + DOBs from the single source
  // (same list that feeds FL-105/FL-150). The Name/Birthdate cells are multiline,
  // so children are listed one per line.
  const children = list(a.children)
  const childNames = children.map((x) => x.name || '').filter(Boolean).join('\n')
  const childDobs = children.map((x) => fmtDateUS(x.dob)).filter(Boolean).join('\n')

  return {
    // ---- caption (single source, shared with FL-100) ----
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
    case_name: caseName,
    case_number: '',

    // ---- judgment type (form title) ----
    jt_dissolution: isDissolution,

    // ---- item 2: basis of judgment ----
    basis_default: basis === 'default' || basis === 'uncontested' || basis === 'declaration',
    basis_declaration: basis === 'default' || basis === 'declaration',
    basis_contested: basis === 'contested',
    basis_agreement: basis === 'stipulation' || basis === 'agreement',

    // ---- item 4a: dissolution entered + when status ends ----
    diss_entered: isDissolution,
    diss_on_date: isDissolution && !!fmtDateUS(a.marital_status_end_date),
    marital_status_end_date: fmtDateUS(a.marital_status_end_date),

    // ---- children of the marriage (page 2) ----
    children_are: hasChildren,
    children_name_cb: hasChildren && !!childNames,
    children_names: childNames,
    children_dobs: childDobs,

    // ---- item 3: jurisdiction over respondent (3a served, by default) ----
    respondent_served: true,

    // ---- item 4l: spousal/partner support disposition ----
    spousal_parent: spousalOrdered || spousalReserved || spousalTerminated,
    spousal_fl343: spousalOrdered,
    spousal_reserved: spousalReserved,
    spousal_reserved_pet: spousalReserved,
    spousal_reserved_resp: spousalReserved,
    spousal_terminated: spousalTerminated,
    spousal_terminated_pet: spousalTerminated,
    spousal_terminated_resp: spousalTerminated,

    // ---- restore former name (item 4, reused from FL-100 source) ----
    restore_former_petitioner: isTrue(a.restore_former_name),
    former_name: isTrue(a.restore_former_name) ? a.former_name || '' : '',

    // ---- FL-191/192 notice (present whenever child/family support ordered) ----
    support_notice: attachFl342,

    // ---- order attachments (the crux — judge won't sign without them) ----
    attach_fl341: attachFl341,
    attach_fl342: attachFl342,
    attach_fl343: attachFl343,
    attach_fl345: attachFl345,
    pages_attached: pages ? String(pages) : '',

    // ---- signature ----
    signature_date: fmtDateUS(a.signature_date),
  }
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const CAP = (s) => `FL-180[0].Page1[0].P1Caption[0].${s}`
const P1 = (s) => `FL-180[0].Page1[0].${s}`
const P2 = (s) => `FL-180[0].Page2[0].${s}`

export const FL180_MAPPING = {
  // caption
  party_block: CAP('Subform1[0].AttyPartyInfo[0].TextField1[0]'),
  party_phone: CAP('Subform1[0].AttyPartyInfo[0].Phone[0]'),
  party_email: CAP('Subform1[0].AttyPartyInfo[0].Email[0]'),
  attorney_for: CAP('Subform1[0].AttyPartyInfo[0].Name[0]'),
  court_county: CAP('CourtInfo[0].CrtCounty[0]'),
  court_street: CAP('CourtInfo[0].CrtStreet[0]'),
  court_mailing: CAP('CourtInfo[0].CrtMailingAdd[0]'),
  court_city_zip: CAP('CourtInfo[0].CrtCityZip[0]'),
  court_branch: CAP('CourtInfo[0].CrtBranch[0]'),
  petitioner_name: CAP('TitlePartyName[0].Party1[0]'),
  respondent_name: CAP('TitlePartyName[0].Party2[0]'),
  case_name: P2('PxCaption[0].TitlePartyName[0].Party1w[0]'),
  case_number: [
    CAP('Subform1[0].CaseNumber[0].CaseNumber[0]'),
    P2('PxCaption[0].CaseNumber[0].CaseNumber[0]'),
  ],

  // form title — judgment of dissolution + date status ends (caption summary)
  jt_dissolution: CAP('FormTitle[0].limited[0]'),
  marital_status_end_date: [
    CAP('FormTitle[0].FillText1[0]'),
    P1('List4[0].LI1[0].List1[0].LI1[0].FillText1[0]'),
  ],

  // item 2 — basis
  basis_default: P1('List2[0].limited[0]'),
  basis_declaration: P1('List2[0].limited[1]'),
  basis_contested: P1('List2[0].limited[2]'),
  basis_agreement: P1('List2[0].CBChoice1[0]'),

  // item 4a — dissolution entered, status ends on date
  diss_entered: P1('List4[0].LI1[0].limited[0]'),
  diss_on_date: P1('List4[0].LI1[0].List1[0].LI1[0].CheckBox03[0]'),

  // item 4 — restore former name (petitioner)
  restore_former_petitioner: P1('List4[0].LI6[0].CheckBoxqd[0]'),
  former_name: P1('List4[0].LI6[0].FillText1[0]'),

  // item 3 — jurisdiction acquired over respondent (3a: served with process)
  respondent_served: P1('List3[0].LI1[0].CheckBox03[0]'),

  // FL-191/192 support notice (page 1)
  support_notice: P1('List4[0].LI8[0].limited[0]'),

  // page 2 — children of the marriage (item 4i): checkbox + name/DOB (multiline)
  children_are: P2('List4[0].LI1[0].RB2Choices[0]'),
  children_name_cb: P2('List4[0].LI1[0].List1[0].Li1[0].CheckBox03[0]'),
  children_names: P2('List4[0].LI1[0].List1[0].Li1[0].FillText1[0]'),
  children_dobs: P2('List4[0].LI1[0].List1[0].Li1[0].FillText2[0]'),

  // page 2 — order attachments (each bool checks "ordered as set forth in
  // attached" AND the specific form's sub-box)
  attach_fl341: [
    P2('List4[0].LI2[0].limited[0]'),
    P2('List4[0].LI2[0].List2[0].LI1[0].unlimited[0]'),
  ],
  attach_fl342: [
    P2('List4[0].LI3[0].limited[0]'),
    P2('List4[0].LI3[0].List2[0].LI1[0].unlimited[0]'),
  ],

  // item 4l — spousal/partner/family support disposition
  spousal_parent: P2('List4[0].LI4[0].limited[0]'),
  spousal_reserved: P2('List4[0].LI4[0].LI1[0].limited[0]'),
  spousal_reserved_pet: P2('List4[0].LI4[0].LI1[0].RB2Choice1[0]'),
  spousal_reserved_resp: P2('List4[0].LI4[0].LI1[0].RB2Choice1[1]'),
  spousal_terminated: P2('List4[0].LI4[0].LI2[0].unlimited[0]'),
  spousal_terminated_pet: P2('List4[0].LI4[0].LI2[0].RB2Choice22[0]'),
  spousal_terminated_resp: P2('List4[0].LI4[0].LI2[0].RB2Choice2[0]'),
  spousal_fl343: P2('List4[0].LI4[0].LI3[0].limited[0]'),

  attach_fl345: [
    P2('List4[0].LI5[0].limited[0]'),
    P2('List4[0].LI5[0].List2[0].LI1[0].unlimited[0]'),
  ],
  pages_attached: P2('List5[0].LI1[0].DateofHearing_dt[0]'),

  // signature
  signature_date: P2('NoticeSub[0].SigDate[0]'),
}

export const FL180_TEMPLATE = {
  id: 'FL-180',
  title: 'Judgment',
  url: '/forms/FL-180.pdf',
  revision: 'Rev. July 1, 2012',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl180.pdf',
  sourceSha256: '8811320b5678a1c17c79c1996b753443365107203a7b2b1bb2983d854eb2f7df',
  mapping: FL180_MAPPING,
}

registerForm(FL180_TEMPLATE)

export async function generateFL180(state) {
  const profile = buildFL180Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-180', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
