import { read, write, uid, now } from './storage.js'

// ---------------------------------------------------------------------------
// Entities
//   User    { id, email, county, language }
//   Case    { id, user_id, type, has_children, status, wizard_step }
//   Answer  { id, case_id, field_key, value }
//   Payment { id, case_id, amount, status }
// All collections are arrays persisted under their own storage key. A small
// `session` record tracks the current user + case so progress is restored on
// return.
// ---------------------------------------------------------------------------

const PRICE = 129 // fixed package price for the scaffold

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
}
