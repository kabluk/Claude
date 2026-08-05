// KV fixed-window rate limiter: по IP и по целевому домену (R4/R5 в RISKS.md).
// Не заменяет Turnstile — это защита от количества, Turnstile — от ботов.

const WINDOW_SECONDS = 3600
const MAX_PER_IP = 5
const MAX_PER_DOMAIN = 10

export async function checkRateLimit(kv, { ip, domain }) {
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - (now % WINDOW_SECONDS)
  const ipKey = `rl:ip:${ip}:${windowStart}`
  const domainKey = `rl:domain:${domain}:${windowStart}`

  const [ipCountRaw, domainCountRaw] = await Promise.all([kv.get(ipKey), kv.get(domainKey)])
  const ipCount = Number(ipCountRaw ?? 0)
  const domainCount = Number(domainCountRaw ?? 0)

  if (ipCount >= MAX_PER_IP) return { allowed: false, reason: 'ip_limit' }
  if (domainCount >= MAX_PER_DOMAIN) return { allowed: false, reason: 'domain_limit' }

  await Promise.all([
    kv.put(ipKey, String(ipCount + 1), { expirationTtl: WINDOW_SECONDS }),
    kv.put(domainKey, String(domainCount + 1), { expirationTtl: WINDOW_SECONDS }),
  ])
  return { allowed: true }
}
