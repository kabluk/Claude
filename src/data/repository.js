import { read, write, uid, now } from './storage.js'
import { PRICING } from '../config/pricing.js'

// ---------------------------------------------------------------------------
// Entities
//   User    { id, email, county, language }
//   Case    { id, user_id, type, has_children, status, wizard_step }
//   Answer  { id, case_id, field_key, value }
//   Payment { id, case_id, amount, status }
//   Review  { id, case_id, attorney_id, status, sla_deadline, review_notes,
//             approved_at, engagement_accepted_at } — attorney-review tier only
// All collections are arrays persisted under their own storage key. A small
// `session` record tracks the current user + case so progress is restored on
// return.
// ---------------------------------------------------------------------------

// Baseline platform fee for a new case's payment record (Essentials tier). The
// per-case price (Essentials vs Family) is resolved from src/config/pricing.js.
const PRICE = PRICING.essentials
// Attorney review fee band — a SEPARATE transaction paid directly to the
// attorney; it never passes through the platform (Rule 5.4, see DECISIONS.md).
const ATTORNEY_FEE_RANGE = [PRICING.attorneyReview.min, PRICING.attorneyReview.max]
const REVIEW_SLA_DAYS = 5 // target turnaround for a review

function collection(name) {
  const all = () => read(name, [])
  const persist = (items) => write(name, items)
  return {
    all,
    get: (id) => all().find((x) => x.id === id) || null,
    where: (pred) => all().filter(pred),
    insert: (data) => {
      const items = all()
      const rec = { id: uid(name.slice(0, 2)), createdAt: now(), ...data }
      items.push(rec)
      persist(items)
      return rec
    },
    update: (id, patch) => {
      const items = all()
      const i = items.findIndex((x) => x.id === id)
      if (i === -1) return null
      items[i] = { ...items[i], ...patch, updatedAt: now() }
      persist(items)
      return items[i]
    },
  }
}

const users = collection('users')
const cases = collection('cases')
const answers = collection('answers')
const payments = collection('payments')
const reviews = collection('reviews')

function addDaysISO(days) {
  // Deterministic-enough for a prototype SLA (no business-day math).
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function getSession() {
  return read('session', { userId: null, caseId: null })
}
function setSession(patch) {
  const next = { ...getSession(), ...patch }
  write('session', next)
  return next
}

export const store = {
  PRICE,
  ATTORNEY_FEE_RANGE,

  // --- User -----------------------------------------------------------------
  getOrCreateUser() {
    const { userId } = getSession()
    const existing = userId && users.get(userId)
    if (existing) return existing
    const user = users.insert({ email: '', county: '', language: 'en' })
    setSession({ userId: user.id })
    return user
  },
  updateUser(id, patch) {
    return users.update(id, patch)
  },

  // --- Case -----------------------------------------------------------------
  getOrCreateCase(userId) {
    const { caseId } = getSession()
    const existing = caseId && cases.get(caseId)
    if (existing) return existing
    return this.newCase(userId)
  },
  newCase(userId) {
    const rec = cases.insert({
      user_id: userId,
      type: null,
      has_children: false,
      status: 'in_progress',
      wizard_step: 0,
    })
    setSession({ caseId: rec.id })
    // Every case gets an unpaid payment record (no payment flow yet).
    payments.insert({ case_id: rec.id, amount: PRICE, status: 'unpaid' })
    return rec
  },
  updateCase(id, patch) {
    return cases.update(id, patch)
  },

  // --- Answers (autosave) ---------------------------------------------------
  getAnswers(caseId) {
    return answers.where((a) => a.case_id === caseId)
  },
  upsertAnswer(caseId, fieldKey, value) {
    const found = answers
      .where((a) => a.case_id === caseId)
      .find((a) => a.field_key === fieldKey)
    if (found) return answers.update(found.id, { value })
    return answers.insert({ case_id: caseId, field_key: fieldKey, value })
  },

  // --- Payment --------------------------------------------------------------
  getOrCreatePayment(caseId) {
    const found = payments.where((p) => p.case_id === caseId)[0]
    if (found) return found
    return payments.insert({ case_id: caseId, amount: PRICE, status: 'unpaid' })
  },
  // Transaction 1 ONLY: the platform software fee ($99) → our Stripe. The
  // attorney's fee is a SEPARATE transaction and is never recorded as revenue
  // here (see markEngagementAccepted).
  markPlatformPaid(caseId) {
    const p = this.getOrCreatePayment(caseId)
    return payments.update(p.id, { status: 'paid', paid_at: now() })
  },

  // --- Review (attorney-review tier) ---------------------------------------
  getReviewByCase(caseId) {
    return reviews.where((r) => r.case_id === caseId)[0] || null
  },
  listReviews() {
    return reviews.all()
  },
  // Created only after the platform fee is paid and the client has accepted the
  // attorney's engagement letter (transaction 2, direct to the attorney).
  createReview(caseId, { attorneyId = null } = {}) {
    const existing = this.getReviewByCase(caseId)
    if (existing) return existing
    return reviews.insert({
      case_id: caseId,
      attorney_id: attorneyId,
      status: 'pending', // pending | in_review | approved | returned_for_correction
      sla_deadline: addDaysISO(REVIEW_SLA_DAYS),
      review_notes: '',
      approved_at: null,
      engagement_accepted_at: now(),
    })
  },
  updateReview(id, patch) {
    return reviews.update(id, patch)
  },
}
