// KV fixed-window rate limiter. Не заменяет Turnstile — это защита от количества,
// Turnstile — от ботов.

const WINDOW_SECONDS = 3600

async function checkFixedWindow(kv, key, max) {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `${key}:${now - (now % WINDOW_SECONDS)}`
  const countRaw = await kv.get(windowKey)
  const count = Number(countRaw ?? 0)
  if (count >= max) return false
  await kv.put(windowKey, String(count + 1), { expirationTtl: WINDOW_SECONDS })
  return true
}

// Скан: по IP и по целевому домену (R4/R5 в RISKS.md).
const SCAN_MAX_PER_IP = 5
const SCAN_MAX_PER_DOMAIN = 10

export async function checkRateLimit(kv, { ip, domain }) {
  if (!(await checkFixedWindow(kv, `rl:scan:ip:${ip}`, SCAN_MAX_PER_IP))) {
    return { allowed: false, reason: 'ip_limit' }
  }
  if (!(await checkFixedWindow(kv, `rl:scan:domain:${domain}`, SCAN_MAX_PER_DOMAIN))) {
    return { allowed: false, reason: 'domain_limit' }
  }
  return { allowed: true }
}

// Пояснения (A1-EXPLAIN, D-016): почти всегда cache-hit по ruleId×locale
// (worker/lib/explain.js) — лимит нужен только против намеренного забивания
// кэша мусорными ruleId, каждый промах — оплаченный вызов Anthropic.
const EXPLAIN_MAX_PER_IP = 30

export async function checkExplainRateLimit(kv, ip) {
  const allowed = await checkFixedWindow(kv, `rl:explain:ip:${ip}`, EXPLAIN_MAX_PER_IP)
  return allowed ? { allowed: true } : { allowed: false, reason: 'ip_limit' }
}
