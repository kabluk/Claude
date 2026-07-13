// Case timeline — MECHANICAL date arithmetic for California dissolution
// milestones. Pure functions (no I/O, no "now") so the same code runs in the
// app, in the unit test, and in the notify-milestone Edge Function.
//
// FACTUAL only: each milestone is a statutory date or a procedural step. We never
// tell the user what to do — we state the deadline and name the form. Copy lives
// in i18n (`t.milestones`); this module returns keys + computed dates.
//
// Verified statutory anchors (see research.md, checked 2026-07-13 against
// leginfo.legislature.ca.gov):
//   - Response deadline: 30 calendar days after the respondent is served
//     (Code Civ. Proc. §412.20(a)(3); stated on the FL-110 Summons).
//   - Preliminary declarations of disclosure: served concurrently with the
//     petition or within 60 days of FILING the petition (Fam. Code §2104(f)).
//   - Earliest judgment: the dissolution cannot be final before 6 months + 1 day
//     from the date the respondent was served or appeared (Fam. Code §2339(a)).

// --- date helpers on "YYYY-MM-DD" strings, computed in UTC to avoid TZ drift ---
export function parseISO(s) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(s || ''))
  if (!m) return null
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
}
const pad = (n) => String(n).padStart(2, '0')
export function toISO(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
export function addDays(d, n) {
  const r = new Date(d.getTime())
  r.setUTCDate(r.getUTCDate() + n)
  return r
}
export function addMonths(d, n) {
  const r = new Date(d.getTime())
  const day = r.getUTCDate()
  r.setUTCDate(1)
  r.setUTCMonth(r.getUTCMonth() + n)
  // Clamp to the last valid day of the target month (e.g. Aug 31 + 6mo → Feb 28).
  const lastDay = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate()
  r.setUTCDate(Math.min(day, lastDay))
  return r
}

// Milestone definitions. `anchor` chooses which input date they count from.
// `compute(d)` returns the due Date. `forms` is a factual reference only.
export const MILESTONE_DEFS = [
  { key: 'proof_of_service', anchor: 'service', forms: ['FL-115'], compute: (d) => d },
  { key: 'response_deadline', anchor: 'service', compute: (d) => addDays(d, 30) },
  {
    key: 'disclosures_due',
    anchor: 'filing',
    forms: ['FL-140', 'FL-142', 'FL-150'],
    compute: (d) => addDays(d, 60),
  },
  {
    key: 'judgment_prep',
    anchor: 'service',
    forms: ['FL-180', 'FL-190'],
    compute: (d) => addDays(addMonths(d, 6), 1 - 30), // ~30 days before eligibility
  },
  { key: 'waiting_period_end', anchor: 'service', compute: (d) => addDays(addMonths(d, 6), 1) },
]

/**
 * generateMilestones({ serviceDate, petitionFiledDate }) → [{ key, dueDate, forms }]
 * - serviceDate: ISO date the respondent was served (primary anchor).
 * - petitionFiledDate: ISO date the petition was filed (anchor for disclosures);
 *   falls back to serviceDate when absent.
 * Returns [] when serviceDate is missing. Sorted ascending by dueDate.
 */
export function generateMilestones({ serviceDate, petitionFiledDate } = {}) {
  const service = parseISO(serviceDate)
  if (!service) return []
  const filing = parseISO(petitionFiledDate) || service
  const out = []
  for (const def of MILESTONE_DEFS) {
    const anchor = def.anchor === 'filing' ? filing : service
    out.push({
      key: def.key,
      dueDate: toISO(def.compute(anchor)),
      forms: def.forms || [],
    })
  }
  out.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
  return out
}
