// Feature flags.
//
// REVIEWED_TIER_ENABLED — gates the entire attorney-review tier (checkout step 2,
// the review queue, the /attorney screen). It stays OFF in production until a CA
// attorney confirms the two-transaction structure is clean of fee-splitting
// (see docs/DECISIONS.md, research.md). How it turns on:
//   - PROD: ONLY the Vite env VITE_REVIEWED_TIER_ENABLED=true (baked at build).
//   - DEV : also a browser flag localStorage['califormis.flags.reviewed']='true'
//           (convenience toggle — has NO effect in a production build).
// Default = false → the tier is invisible in prod.

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

// `import.meta.env.DEV` is inlined by Vite (true in dev, false in a prod build),
// so in production `false && lsOn()` is dead-code-eliminated — localStorage can
// never enable the flag in prod; only VITE_REVIEWED_TIER_ENABLED can.
export const REVIEWED_TIER_ENABLED = envOn() || (import.meta.env.DEV && lsOn())
