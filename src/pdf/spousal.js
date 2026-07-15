// Single source of truth for the spousal/partner support disposition, shared by
// FL-180 (item 4l) and FL-343 so the two forms can never disagree.
//
// Canonical values: 'ordered' | 'reserved' | 'terminated' | 'waived' | 'none'.
// User-facing aliases (order/reserve/terminate/waive) normalize to these.
// Default when nothing is set: 'ordered' if support was requested on FL-100
// (spousal_support_request) or spousal_support is truthy, otherwise 'reserved'.

const isTrue = (v) => v === true || v === 'true' || v === 'yes' || v === 1 || v === '1'

const ALIAS = {
  order: 'ordered',
  ordered: 'ordered',
  reserve: 'reserved',
  reserved: 'reserved',
  terminate: 'terminated',
  terminated: 'terminated',
  waive: 'waived',
  waived: 'waived',
  none: 'none',
}

// `a` is the flat answers map ({ field_key: value }).
export function normalizeSpousalType(a = {}) {
  const raw = String(a.spousal_support_type ?? '').trim().toLowerCase()
  if (raw) return ALIAS[raw] || raw
  return isTrue(a.spousal_support ?? a.spousal_support_request) ? 'ordered' : 'reserved'
}
