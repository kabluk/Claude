import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handlePostLead } from './lead.js'

// Мини-D1: только INSERT INTO leads (...) VALUES (...) нужен этому модулю.
// Записывает bind()-параметры позиционно, как в insertLead (worker/routes/lead.js).
function fakeDb() {
  const rows = []
  return {
    rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              rows.push({ sql, args })
              return { meta: { changes: 1 } }
            },
          }
        },
      }
    },
  }
}

// Мини-KV в памяти — тот же контракт, что worker/lib/ratelimit.test.mjs::fakeKv.
function fakeKv() {
  const store = new Map()
  return {
    async get(key) {
      return store.has(key) ? store.get(key) : null
    },
    async put(key, value) {
      store.set(key, value)
    },
  }
}

function env(overrides = {}) {
  return { DB: fakeDb(), RATE_LIMIT_KV: fakeKv(), ...overrides }
}

function req(body, headers = {}) {
  return new Request('https://worker.example/api/lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4', ...headers },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  country: 'DE',
  standard: 'bitv',
  service: 'audit',
  budget: 'mid',
  contact: { email: 'buyer@example.com' },
}

test('invalid JSON body -> 400 bad_request', async () => {
  const e = env()
  const res = await handlePostLead(
    new Request('https://worker.example/api/lead', { method: 'POST', body: '{not json' }),
    e,
  )
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.code, 'bad_request')
})

test('missing required fields -> 400 lists each missing field', async () => {
  const e = env()
  const res = await handlePostLead(req({}), e)
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.code, 'bad_request')
  for (const field of ['country', 'standard', 'service', 'budget', 'contact.email']) {
    assert.match(data.error, new RegExp(field.replace('.', '\\.')))
  }
})

test('unknown country code -> 400', async () => {
  const res = await handlePostLead(req({ ...VALID_BODY, country: 'ZZ' }), env())
  assert.equal(res.status, 400)
})

test('unknown standard/service/budget slug -> 400', async () => {
  const bad1 = await handlePostLead(req({ ...VALID_BODY, standard: 'not-a-standard' }), env())
  assert.equal(bad1.status, 400)
  const bad2 = await handlePostLead(req({ ...VALID_BODY, service: 'not-a-service' }), env())
  assert.equal(bad2.status, 400)
  const bad3 = await handlePostLead(req({ ...VALID_BODY, budget: 'not-a-budget' }), env())
  assert.equal(bad3.status, 400)
})

test('invalid email -> 400', async () => {
  const res = await handlePostLead(req({ ...VALID_BODY, contact: { email: 'not-an-email' } }), env())
  assert.equal(res.status, 400)
})

test('deadline in the past -> 400; deadline in the future is accepted', async () => {
  const past = await handlePostLead(req({ ...VALID_BODY, deadline: '2000-01-01' }), env())
  assert.equal(past.status, 400)

  const future = await handlePostLead(req({ ...VALID_BODY, deadline: '2099-01-01' }), env())
  assert.equal(future.status, 201)
})

test('valid body -> 201 {leadId, matched[]}, row written to D1 with status "sent"', async () => {
  const e = env()
  const res = await handlePostLead(req(VALID_BODY), e)
  assert.equal(res.status, 201)
  const data = await res.json()
  assert.equal(typeof data.leadId, 'string')
  assert.ok(Array.isArray(data.matched))

  assert.equal(e.DB.rows.length, 1)
  const [{ sql, args }] = e.DB.rows
  assert.match(sql, /INSERT INTO leads/)
  const [id, scanId, country, standard, service, budget, deadline, contactJson, matchedJson, createdAt] = args
  assert.equal(id, data.leadId)
  assert.equal(scanId, null)
  assert.equal(country, 'DE')
  assert.equal(standard, 'bitv')
  assert.equal(service, 'audit')
  assert.equal(budget, 'mid')
  assert.equal(deadline, null)
  assert.deepEqual(JSON.parse(contactJson), { email: 'buyer@example.com' })
  assert.deepEqual(JSON.parse(matchedJson), data.matched)
  assert.ok(typeof createdAt === 'string' && !Number.isNaN(Date.parse(createdAt)))
})

test('scanId is persisted when provided', async () => {
  const e = env()
  const res = await handlePostLead(req({ ...VALID_BODY, scanId: 'scan-123' }), e)
  assert.equal(res.status, 201)
  const [{ args }] = e.DB.rows
  assert.equal(args[1], 'scan-123')
})

test('email is not sent to agencies by this endpoint (no fetch call happens on the happy path)', async (t) => {
  let fetchCalled = false
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (...fetchArgs) => {
    fetchCalled = true
    return originalFetch(...fetchArgs)
  }
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const res = await handlePostLead(req(VALID_BODY), env())
  assert.equal(res.status, 201)
  assert.equal(fetchCalled, false, 'handlePostLead must not make any network call (no Resend yet, A2-LEAD-EMAIL)')
})

test('rate limit: blocks the 6th request from the same IP within the window', async () => {
  const e = env()
  for (let i = 0; i < 5; i++) {
    const res = await handlePostLead(req(VALID_BODY), e)
    assert.equal(res.status, 201, `request ${i} should succeed`)
  }
  const sixth = await handlePostLead(req(VALID_BODY), e)
  assert.equal(sixth.status, 429)
  const data = await sixth.json()
  assert.equal(data.code, 'rate_limited')
})

test('rate limit is tracked independently per IP', async () => {
  const e = env()
  for (let i = 0; i < 5; i++) {
    await handlePostLead(req(VALID_BODY, { 'cf-connecting-ip': '9.9.9.9' }), e)
  }
  const otherIp = await handlePostLead(req(VALID_BODY, { 'cf-connecting-ip': '8.8.8.8' }), e)
  assert.equal(otherIp.status, 201)
})

test('turnstile: no TURNSTILE_SECRET_KEY configured -> verification is skipped (dev mode)', async () => {
  const res = await handlePostLead(req(VALID_BODY), env())
  assert.equal(res.status, 201)
})

test('turnstile: secret configured, token rejected by Cloudflare -> 403', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false }), { status: 200 })
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const res = await handlePostLead(req({ ...VALID_BODY, turnstileToken: 'bad-token' }), env({ TURNSTILE_SECRET_KEY: 'secret' }))
  assert.equal(res.status, 403)
  const data = await res.json()
  assert.equal(data.code, 'forbidden')
})

test('turnstile: secret configured, token accepted -> proceeds to 201', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 })
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const res = await handlePostLead(
    req({ ...VALID_BODY, turnstileToken: 'good-token' }),
    env({ TURNSTILE_SECRET_KEY: 'secret' }),
  )
  assert.equal(res.status, 201)
})
