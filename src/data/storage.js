// Low-level persistence: namespaced JSON read/write over localStorage with
// safe fallbacks (private mode / disabled storage won't crash the app).
const PREFIX = 'califormis.db.'

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable — keep state in memory for this session only */
  }
}

const now = () => new Date().toISOString()

export function uid(prefix = 'id') {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`
    }
  } catch {
    /* fall through */
  }
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export { now }
