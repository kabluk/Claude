import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handlePostClaim } from './claim.js'
import { agencies } from '../lib/matchAgenciesServer.js'

const REAL_SLUG = agencies[0].slug

// Мини-D1: только INSERT INTO claims (...) VALUES (...) нужен этому модулю.
// Записывает bind()-параметры позиционно, как в insertClaim (worker/routes/claim.js).
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
  return new Request('https://worker.example/api/claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4', ...headers },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { agencySlug: REAL_SLUG, email: 'owner@example.com' }

test('invalid JSON body -> 400 bad_request', async () => {
  const res = await handlePostClaim(
    new Request('https://worker.example/api/claim', { method: 'POST', body: '{not json' }),
    env(),
  )
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.code, 'bad_request')
})

test('missing fields -> 400 lists each missing field', async () => {
  const res = await handlePostClaim(req({}), env())
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.code, 'bad_request')
  for (const field of ['agencySlug', 'email']) {
    assert.match(data.error, new RegExp(field))
  }
})

test('unknown agencySlug (not in real catalog) -> 400', async () => {
  const res = await handlePostClaim(req({ ...VALID_BODY, agencySlug: 'not-a-real-agency-slug' }), env())
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.code, 'bad_request')
  assert.match(data.error, /agencySlug/)
})

test('invalid email -> 400', async () => {
  const res = await handlePostClaim(req({ ...VALID_BODY, email: 'not-an-email' }), env())
  assert.equal(res.status, 400)
})

test('valid body -> 201 {claimId}, row written to D1 with status "pending", verified=0, non-empty token', async () => {
  const e = env()
  const res = await handlePostClaim(req(VALID_BODY), e)
  assert.equal(res.status, 201)
  const data = await res.json()
  assert.equal(typeof data.claimId, 'string')
  assert.ok(data.claimId.length > 0)

  assert.equal(e.DB.rows.length, 1)
  const [{ sql, args }] = e.DB.rows
  assert.match(sql, /INSERT INTO claims/)
  assert.match(sql, /'pending'/)
  const [id, agencySlug, email, token, createdAt] = args
  assert.equal(id, data.claimId)
  assert.equal(agencySlug, REAL_SLUG)
  assert.equal(email, 'owner@example.com')
  assert.equal(typeof token, 'string')
  assert.ok(token.length >= 32, 'token should be a long, non-guessable secret')
  assert.ok(typeof createdAt === 'string' && !Number.isNaN(Date.parse(createdAt)))
})

test('the verify token is never returned in the API response (only claimId is)', async () => {
  const e = env()
  const res = await handlePostClaim(req(VALID_BODY), e)
  const data = await res.json()
  assert.deepEqual(Object.keys(data), ['claimId'])

  const [{ args }] = e.DB.rows
  const [, , , token] = args
  // claimId (returned) must differ from token (D1-only, mailed later by A2-CLAIM-EMAIL) —
  // see docs/project/DECISIONS.md D-023.
  assert.notEqual(data.claimId, token)
})

test('two claims for the same agency/email get different, unpredictable tokens', async () => {
  const e = env()
  await handlePostClaim(req(VALID_BODY), e)
  await handlePostClaim(req(VALID_BODY), e)
  const [row1, row2] = e.DB.rows
  assert.notEqual(row1.args[0], row2.args[0]) // different claimId
  assert.notEqual(row1.args[3], row2.args[3]) // different token
})

test('email domain is NOT checked against the agency website domain at this step (GRAPH.yaml A2-CLAIM-API)', async () => {
  // deque-systems.com is the real website for REAL_SLUG's fixture in this test file;
  // an email on a completely unrelated domain must still be accepted here — domain
  // matching is deferred to the future verify-link step (A2-CLAIM-EMAIL).
  const res = await handlePostClaim(req({ agencySlug: REAL_SLUG, email: 'someone@totally-unrelated-domain.example' }), env())
  assert.equal(res.status, 201)
})

test('email is not sent by this endpoint (no fetch call happens on the happy path)', async (t) => {
  let fetchCalled = false
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (...fetchArgs) => {
    fetchCalled = true
    return originalFetch(...fetchArgs)
  }
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const res = await handlePostClaim(req(VALID_BODY), env())
  assert.equal(res.status, 201)
  assert.equal(fetchCalled, false, 'handlePostClaim must not make any network call (no Resend yet, A2-CLAIM-EMAIL)')
})

test('rate limit: blocks the 6th request from the same IP within the window', async () => {
  const e = env()
  for (let i = 0; i < 5; i++) {
    const res = await handlePostClaim(req(VALID_BODY), e)
    assert.equal(res.status, 201, `request ${i} should succeed`)
  }
  const sixth = await handlePostClaim(req(VALID_BODY), e)
  assert.equal(sixth.status, 429)
  const data = await sixth.json()
  assert.equal(data.code, 'rate_limited')
})

test('rate limit is tracked independently per IP', async () => {
  const e = env()
  for (let i = 0; i < 5; i++) {
    await handlePostClaim(req(VALID_BODY, { 'cf-connecting-ip': '9.9.9.9' }), e)
  }
  const otherIp = await handlePostClaim(req(VALID_BODY, { 'cf-connecting-ip': '8.8.8.8' }), e)
  assert.equal(otherIp.status, 201)
})

test('turnstile: no TURNSTILE_SECRET_KEY configured -> verification is skipped (dev mode)', async () => {
  const res = await handlePostClaim(req(VALID_BODY), env())
  assert.equal(res.status, 201)
})

test('turnstile: secret configured, token rejected by Cloudflare -> 403', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false }), { status: 200 })
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const res = await handlePostClaim(
    req({ ...VALID_BODY, turnstileToken: 'bad-token' }),
    env({ TURNSTILE_SECRET_KEY: 'secret' }),
  )
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

  const res = await handlePostClaim(
    req({ ...VALID_BODY, turnstileToken: 'good-token' }),
    env({ TURNSTILE_SECRET_KEY: 'secret' }),
  )
  assert.equal(res.status, 201)
})
