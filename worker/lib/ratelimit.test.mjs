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
