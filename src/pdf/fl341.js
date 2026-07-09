// FL-341 — Child Custody and Visitation (Parenting Time) Order Attachment.
//
// Attachment to the judgment (FL-180 item 4.j(2)). Generated only when the case
// has minor children. Its caption is compact (no court/contact block — the court
// is identified on the parent form), then a per-child custody table, a visitation
// section, and optional transportation / travel / holiday provisions.
//
// Single source: children (names + DOBs) are identical to FL-105/FL-180.

import { registerForm, fillForm, loadWatermarkFont, DRAFT_WATERMARK } from './forms.js'
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
const list = (s) => {
  try {
    const r = JSON.parse(s || '[]')
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}
const isTrue = (v) => v === true || v === 'true' || v === 'yes' || v === 1 || v === '1'

export function buildFL341Profile({ user = {}, caseRec = {}, answers = [] }) {
  const a = Object.fromEntries(answers.map((x) => [x.field_key, x.value]))
  buildPartyContact(a) // (kept for parity; FL-341 caption carries no contact block)
  const petitioner = a.petitioner_name || ''
  const respondent = a.respondent_name || ''

  // "Legal/physical custody to:" is a free-text cell — Joint, or a parent's name.
  const custodyText = (who) => {
    const w = (who || 'joint').toLowerCase()
    if (w === 'joint') return 'Joint'
    if (w === 'petitioner') return petitioner
    if (w === 'respondent') return respondent
    return who || 'Joint'
  }
  const legalTo = custodyText(a.legal_custody_to || 'joint')
  const physTo = custodyText(a.physical_custody_to || 'joint')

  const children = list(a.children).slice(0, 4)

  const out = {
    // ---- caption (compact: parties + case number only) ----
    petitioner_name: petitioner,
    respondent_name: respondent,
    case_number: '',

    // this attachment is to the Judgment (FL-180)
    attaches_to_fl180: true,

    // ---- item 7: child custody ----
    custody_parent: children.length > 0,
  }

  // per-child rows (name / DOB / legal custody / physical custody)
  children.forEach((ch, i) => {
    const n = i + 1
    out[`child${n}_name`] = ch.name || ''
    out[`child${n}_dob`] = fmtDateUS(ch.dob)
    out[`child${n}_legal`] = legalTo
    out[`child${n}_physical`] = physTo
  })

  // ---- item 9: visitation (parenting time) ----
  const vis = (a.visitation_type || 'reasonable').toLowerCase()
  const schedule = a.visitation_schedule || ''
  // A free-text schedule can't fill the structured weekend grid → reference an
  // attached page (item 9b) instead.
  const scheduledAsAttachment = vis === 'scheduled' && !!schedule.trim()
  out.vis_parent = true
  out.vis_reasonable = vis === 'reasonable'
  out.vis_none = vis === 'none'
  out.vis_supervised = vis === 'supervised'
  out.vis_attachment = vis === 'attachment' || vis === 'per_attachment' || scheduledAsAttachment
  out.vis_attachment_pages = out.vis_attachment && schedule ? '1' : ''
  out.vis_scheduled = vis === 'scheduled' && !scheduledAsAttachment
  out.vis_for_petitioner = out.vis_scheduled && (a.visitation_party || 'respondent') === 'petitioner'
  out.vis_for_respondent = out.vis_scheduled && (a.visitation_party || 'respondent') === 'respondent'

  // ---- item 11: transportation / place of exchange (only if provided) ----
  const exchange = a.transportation_exchange || ''
  out.transport_parent = !!exchange.trim()
  out.exchange_begin = !!exchange.trim()
  out.exchange_begin_addr = exchange

  // ---- item 12: travel with children (usually none for uncontested) ----
  const travel = isTrue(a.travel_restrictions)
  out.travel_parent = travel
  out.travel_petitioner_perm = travel // both parties need permission
  out.travel_respondent_perm = travel
  out.travel_out_of_ca = travel

  return out
}

// True when FL-341 belongs in the packet (minor children in the case).
export function fl341Required({ caseRec = {} } = {}) {
  return !!caseRec.has_children
}

// ---------------- real PDF field names (inspectFormFields + /TU) ----------------
const CAPP = (n, s) => `FL-341[0].Page${n}[0].PxCaption[0].${s}`
const cap = (s) => [1, 2, 3, 4].map((n) => CAPP(n, s)) // caption repeats on all 4 pages
const P1 = (s) => `FL-341[0].Page1[0].${s}`
const P2 = (s) => `FL-341[0].Page2[0].${s}`
const P3 = (s) => `FL-341[0].Page3[0].${s}`
// child row r, field suffix (Name_ft / BirthDate_dt / LegalCustody_ft / PhysicalCustody_ft)
const CH = (r, suf) => P1(`List7[0].li1[0].tblChildren[0].row${r}[0].Child${r}${suf}[0]`)

export const FL341_MAPPING = {
  // caption (all 4 pages)
  petitioner_name: cap('TitlePartyName[0].Petitioner_ft[0]'),
  respondent_name: cap('TitlePartyName[0].Respondent_ft[0]'),
  case_number: cap('CaseNumber[0].CaseNumber_ft[0]'),

  // attaches to the Judgment (FL-180)
  attaches_to_fl180: P1('TitleSub[0].Response_cb1[0]'),

  // item 7 custody
  custody_parent: P1('List7[0].Custodycb[0]'),
  child1_name: CH(1, 'Name_ft'),
  child1_dob: CH(1, 'BirthDate_dt'),
  child1_legal: CH(1, 'LegalCustody_ft'),
  child1_physical: CH(1, 'PhysicalCustody_ft'),
  child2_name: CH(2, 'Name_ft'),
  child2_dob: CH(2, 'BirthDate_dt'),
  child2_legal: CH(2, 'LegalCustody_ft'),
  child2_physical: CH(2, 'PhysicalCustody_ft'),
  child3_name: CH(3, 'Name_ft'),
  child3_dob: CH(3, 'BirthDate_dt'),
  child3_legal: CH(3, 'LegalCustody_ft'),
  child3_physical: CH(3, 'PhysicalCustody_ft'),
  child4_name: CH(4, 'Name_ft'),
  child4_dob: CH(4, 'BirthDate_dt'),
  child4_legal: CH(4, 'LegalCustody_ft'),
  child4_physical: CH(4, 'PhysicalCustody_ft'),

  // item 9 visitation
  vis_parent: P2('List9[0].Visitation_cb[0]'),
  vis_reasonable: P2('List9[0].lia[0].ReasonableVisitation_cb[0]'),
  vis_attachment: P2('List9[0].lib[0].CheckBox2b[0]'),
  vis_attachment_pages: P2('List9[0].lib[0].SpecifyNumberPagesAttached_ft[0]'),
  vis_none: P2('List9[0].lic[0].NoVisitation_cb[0]'),
  vis_supervised: P2('List9[0].lid[0].NoVisitation_cb[0]'),
  vis_scheduled: P2('List9[0].lie[0].VisitationFor_cb[0]'),
  vis_for_petitioner: P2('List9[0].lie[0].VisitsFor_cb[0]'),
  vis_for_respondent: P2('List9[0].lie[0].VisitsFor_cb[1]'),

  // item 11 transportation / exchange
  transport_parent: P3('List11[0].CheckBox61[0]'),
  exchange_begin: P3('List11[0].Li4[0].#area[0].BeginVisitationExchangePoint_cb[0]'),
  exchange_begin_addr: P3('List11[0].Li4[0].#area[0].SpecifyAddressOfBeginningExchangePoint_ft[0]'),

  // item 12 travel with children
  travel_parent: P3('List12[0].TravelWithChildren_cb[0]'),
  travel_petitioner_perm: P3('List12[0].PetitionerMustHaveWrittenPermission_cb[0]'),
  travel_respondent_perm: P3('List12[0].RespondentMustHaveWrittenPermission_cb[0]'),
  travel_out_of_ca: P3('List12[0].Li1[0].TakeChilrenOutOfCalifornia_cb[0]'),
}

export const FL341_TEMPLATE = {
  id: 'FL-341',
  title: 'Child Custody and Visitation (Parenting Time) Order Attachment',
  url: '/forms/FL-341.pdf',
  revision: 'Rev. July 1, 2026',
  checkedOn: '06/30/2026',
  upstreamUrl: 'https://www.courts.ca.gov/documents/fl341.pdf',
  sourceSha256: '15153e5eb18a848486302592bb22fc5087fae848d8735e3e8a27fd008bf4c215',
  mapping: FL341_MAPPING,
}

registerForm(FL341_TEMPLATE)

export async function generateFL341(state) {
  const profile = buildFL341Profile(state)
  const fontBytes = await loadWatermarkFont()
  return fillForm('FL-341', profile, {
    watermark: { text: DRAFT_WATERMARK, fontBytes },
  })
}
