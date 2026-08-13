import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkRateLimit, checkExplainRateLimit } from './ratelimit.js'

// Мини-KV в памяти — реализует только get/put(..., {expirationTtl}), как в
// worker/lib/*.js. TTL не моделируем (тесты укладываются в одно "окно").
function fakeKv() {
  const store = new Map()
  return {
    async get(key) {
      return store.has(key) ? store.get(key) : null
    },
    async put(key, value) {
      store.set(key, value)
    },
    _store: store,
  }
}

test('checkRateLimit allows requests under both limits', async () => {
  const kv = fakeKv()
  const result = await checkRateLimit(kv, { ip: '1.2.3.4', domain: 'example.com' })
  assert.deepEqual(result, { allowed: true })
})

test('checkRateLimit blocks the 6th request from the same IP within the window', async () => {
  const kv = fakeKv()
  for (let i = 0; i < 5; i++) {
    const r = await checkRateLimit(kv, { ip: '1.2.3.4', domain: `site${i}.example` })
    assert.equal(r.allowed, true, `request ${i} should be allowed`)
  }
  const sixth = await checkRateLimit(kv, { ip: '1.2.3.4', domain: 'site6.example' })
  assert.deepEqual(sixth, { allowed: false, reason: 'ip_limit' })
})

test('checkRateLimit blocks the 11th request targeting the same domain (different IPs)', async () => {
  const kv = fakeKv()
  for (let i = 0; i < 10; i++) {
    const r = await checkRateLimit(kv, { ip: `1.2.3.${i}`, domain: 'popular.example' })
    assert.equal(r.allowed, true, `request ${i} should be allowed`)
  }
  const eleventh = await checkRateLimit(kv, { ip: '1.2.3.99', domain: 'popular.example' })
  assert.deepEqual(eleventh, { allowed: false, reason: 'domain_limit' })
})

// A5-ABUSE-LIMITS: суточный IP-лимит (10/сутки) поверх часового (5/час).
// Часовой лимит один сам по себе не мешает 5*24=120 сканов/сутки с одного IP —
// нужен второй, более широкий, счётчик. Тест продвигает часы через MockTimers
// (Node node:test), чтобы 10 разрешённых сканов накопились через несколько
// часовых окон одного и того же UTC-дня, а не упёрлись в часовой лимит на 6-м.
test('checkRateLimit: daily IP cap blocks the 11th scan within a day, across hourly window resets', async (t) => {
  const DAY_START = Date.UTC(2026, 0, 1, 0, 0, 0) // UTC-полночь: суточное окно начинается ровно тут
  t.mock.timers.enable({ apis: ['Date'], now: DAY_START })
  const kv = fakeKv()
  const ip = '4.4.4.4'

  for (let hour = 0; hour < 10; hour++) {
    t.mock.timers.setTime(DAY_START + hour * 3_600_000)
    const r = await checkRateLimit(kv, { ip, domain: `d${hour}.example` })
    assert.equal(r.allowed, true, `scan ${hour} (hour ${hour}) should be allowed`)
  }

  t.mock.timers.setTime(DAY_START + 10 * 3_600_000)
  const eleventh = await checkRateLimit(kv, { ip, domain: 'd10.example' })
  assert.deepEqual(eleventh, { allowed: false, reason: 'ip_daily_limit' })
})

test('checkRateLimit: the hourly IP cap still independently blocks the 6th scan within one hour (daily cap is 10, not a replacement)', async () => {
  const kv = fakeKv()
  for (let i = 0; i < 5; i++) {
    const r = await checkRateLimit(kv, { ip: '4.4.4.5', domain: `e${i}.example` })
    assert.equal(r.allowed, true)
  }
  const sixth = await checkRateLimit(kv, { ip: '4.4.4.5', domain: 'e6.example' })
  assert.deepEqual(sixth, { allowed: false, reason: 'ip_limit' })
})

test('checkRateLimit: the daily IP cap is tracked independently per IP', async (t) => {
  const DAY_START = Date.UTC(2026, 0, 2, 0, 0, 0)
  t.mock.timers.enable({ apis: ['Date'], now: DAY_START })
  const kv = fakeKv()
  for (let hour = 0; hour < 10; hour++) {
    t.mock.timers.setTime(DAY_START + hour * 3_600_000)
    await checkRateLimit(kv, { ip: '6.6.6.6', domain: `f${hour}.example` })
  }
  t.mock.timers.setTime(DAY_START + 10 * 3_600_000)
  const otherIp = await checkRateLimit(kv, { ip: '7.7.7.7', domain: 'f10.example' })
  assert.equal(otherIp.allowed, true, 'a different IP must not be affected by another IP exhausting its daily cap')
})

test('checkRateLimit keeps scan and explain counters independent (different key prefixes)', async () => {
  const kv = fakeKv()
  for (let i = 0; i < 5; i++) await checkRateLimit(kv, { ip: '9.9.9.9', domain: `s${i}.example` })
  const scanBlocked = await checkRateLimit(kv, { ip: '9.9.9.9', domain: 'more.example' })
  assert.equal(scanBlocked.allowed, false)

  const explainStillAllowed = await checkExplainRateLimit(kv, '9.9.9.9')
  assert.deepEqual(explainStillAllowed, { allowed: true })
})

test('checkExplainRateLimit allows up to 30 requests per IP, blocks the 31st', async () => {
  const kv = fakeKv()
  for (let i = 0; i < 30; i++) {
    const r = await checkExplainRateLimit(kv, '5.5.5.5')
    assert.equal(r.allowed, true, `request ${i} should be allowed`)
  }
  const thirtyFirst = await checkExplainRateLimit(kv, '5.5.5.5')
  assert.deepEqual(thirtyFirst, { allowed: false, reason: 'ip_limit' })
})

test('checkExplainRateLimit tracks IPs independently', async () => {
  const kv = fakeKv()
  for (let i = 0; i < 30; i++) await checkExplainRateLimit(kv, '1.1.1.1')
  const otherIp = await checkExplainRateLimit(kv, '2.2.2.2')
  assert.deepEqual(otherIp, { allowed: true })
})
