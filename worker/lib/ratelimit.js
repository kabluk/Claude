// KV fixed-window rate limiter. Не заменяет Turnstile — это защита от количества,
// Turnstile — от ботов.

const WINDOW_SECONDS = 3600
// A5-ABUSE-LIMITS: второе, более широкое окно поверх часового — часовой лимит
// сам по себе не мешает 5 сканам в час * 24 часа = 120/сутки с одного IP.
// Отдельная длина окна, а не второй вызов с тем же WINDOW_SECONDS: суточное и
// часовое окно обязаны считаться независимо друг от друга по времени.
const DAY_WINDOW_SECONDS = 86400

// windowSeconds — необязательный четвёртый параметр (по умолчанию час), чтобы
// ключи и поведение для УЖЕ существующих часовых лимитов (scan ip/domain,
// explain ip) остались байт-в-байт такими же, как до этого узла: тот же ключ
// `${key}:${windowStart}`, тот же TTL. Суточная проверка передаёт свой key с
// отдельным сегментом (`...:day`), а не тот же key с другим windowSeconds —
// иначе при совпадении windowStart (полночь UTC, now % 3600 === now % 86400
// одновременно) часовой и суточный счётчик читали бы и писали один и тот же
// ключ KV.
async function checkFixedWindow(kv, key, max, windowSeconds = WINDOW_SECONDS) {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `${key}:${now - (now % windowSeconds)}`
  const countRaw = await kv.get(windowKey)
  const count = Number(countRaw ?? 0)
  if (count >= max) return false
  await kv.put(windowKey, String(count + 1), { expirationTtl: windowSeconds })
  return true
}

// Скан: по IP (час + сутки) и по целевому домену (R4/R5 в RISKS.md).
const SCAN_MAX_PER_IP = 5
const SCAN_MAX_PER_IP_DAY = 10
const SCAN_MAX_PER_DOMAIN = 10

// Порядок проверок: часовой IP -> суточный IP -> домен. Первые два — один и
// тот же субъект (IP), от самого узкого окна к самому широкому; домен —
// отдельный, разделяемый между IP ресурс, проверяется последним. Возвращает
// ПЕРВУЮ провалившуюся проверку с отдельной причиной на каждое окно —
// вызывающий (scan.js) кладёт reason прямо в текст ошибки 429.
export async function checkRateLimit(kv, { ip, domain }) {
  if (!(await checkFixedWindow(kv, `rl:scan:ip:${ip}`, SCAN_MAX_PER_IP))) {
    return { allowed: false, reason: 'ip_limit' }
  }
  if (!(await checkFixedWindow(kv, `rl:scan:ip:${ip}:day`, SCAN_MAX_PER_IP_DAY, DAY_WINDOW_SECONDS))) {
    return { allowed: false, reason: 'ip_daily_limit' }
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
