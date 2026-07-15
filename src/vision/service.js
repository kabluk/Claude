// Served-documents photo → FL-115 (Proof of Service) + service_date.
// (§8.4 step 2 — same MECHANICAL, client-directed contract as paystub.js.)
//
// A photo of the completed proof-of-service note / server's declaration is only
// ever a DRAFT source. The vision model returns strict JSON; this module
// validates it, refuses to invent anything (unread → null), turns it into
// per-field draft suggestions, and writes ONLY the values the client confirms
// into the flat service_* answers that FL-115 and the case timeline read.

export const SERVICE_SCHEMA = {
  readable: 'boolean', // false ⇒ not a legible proof-of-service; all else null
  service_date: 'date|null', // YYYY-MM-DD — when the respondent was served
  service_method: 'enum|null', // personal | mail
  service_time: 'string|null', // e.g. "6:15 p.m." (personal service)
  address_served: 'string|null',
  server_name: 'string|null',
  server_address: 'string|null',
}

const METHOD = new Set(['personal', 'mail'])
const isStr = (v) => typeof v === 'string' && v.trim() !== ''
const isISO = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

// Validate a raw extraction object. Returns { ok, errors:[], value }.
// A field may be null (not read) or well-typed; anything else is an error.
export function validateServiceExtraction(obj) {
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
    service_date: nullable('service_date', isISO),
    service_method: nullable('service_method', (v) => METHOD.has(v)),
    service_time: nullable('service_time', isStr),
    address_served: nullable('address_served', isStr),
    server_name: nullable('server_name', isStr),
    server_address: nullable('server_address', isStr),
  }
  if (!value.readable) {
    for (const k of Object.keys(value)) if (k !== 'readable') value[k] = null
  }
  return { ok: errors.length === 0, errors, value }
}

// Per-field draft list for confirmation. Each item names the flat answer key it
// writes. Null (unread) fields are omitted. `value` is what the UI shows.
const DRAFT_FIELDS = [
  { key: 'service_date', answer: 'service_date' },
  { key: 'service_method', answer: 'service_method' },
  { key: 'service_time', answer: 'service_time' },
  { key: 'address_served', answer: 'service_address' },
  { key: 'server_name', answer: 'service_server_name' },
  { key: 'server_address', answer: 'service_server_address' },
]

export function serviceToDraft(ext) {
  const v = validateServiceExtraction(ext).value
  if (!v || !v.readable) return []
  return DRAFT_FIELDS.filter((f) => v[f.key] != null).map((f) => ({
    key: f.key,
    answer: f.answer,
    value: v[f.key],
  }))
}

// Apply the client-confirmed draft items → { answers: { field_key: value } } for
// the caller to persist. Only confirmed keys are written; nothing else is touched.
export function applyConfirmedService(draft, confirmedKeys) {
  const answers = {}
  for (const item of draft) {
    if (confirmedKeys.includes(item.key)) answers[item.answer] = String(item.value)
  }
  return { answers }
}
