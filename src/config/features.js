// Feature flags.
//
// REVIEWED_TIER_ENABLED — gates the entire attorney-review tier (checkout step 2,
// the review queue, the /attorney screen). It stays OFF in production until a CA
// attorney confirms the two-transaction structure is clean of fee-splitting
// (see docs/DECISIONS.md, docs/research.md). Turn on in dev via either:
//   - Vite env:      VITE_REVIEWED_TIER_ENABLED=true
//   - browser flag:  localStorage['califormis.flags.reviewed'] = 'true'
// Default (both unset) = false → the tier is invisible in prod.

function envOn() {
  try {
    return String(import.meta.env?.VITE_REVIEWED_TIER_ENABLED) === 'true'
  } catch {
    return false
  }
}
function lsOn() {
  try {
    return localStorage.getItem('califormis.flags.reviewed') === 'true'
  } catch {
    return false
  }
}

export const REVIEWED_TIER_ENABLED = envOn() || lsOn()
