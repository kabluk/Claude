import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handlePostClaim, handleGetClaimVerify, buildVerifyEmail } from './claim.js'
import { agencies } from '../lib/matchAgenciesServer.js'

const REAL_SLUG = agencies[0].slug

// Мини-D1: INSERT/UPDATE/SELECT над claims в памяти — покрывает и insertClaim
// (POST /api/claim), и SELECT+UPDATE в handleGetClaimVerify (GET /api/claim/verify).
function fakeDb(initialRows = []) {
  const rows = [...initialRows]
  const calls = []
  return {
    rows,
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              calls.push({ sql, args })
              if (/^INSERT INTO claims/.test(sql)) {
                const [id, agency_slug, email, token, created_at] = args
                rows.push({ id, agency_slug, email, verified: 0, status: 'pending', token, created_at })
              } else if (/^UPDATE claims SET verified = 1/.test(sql)) {
                const [token] = args
                const row = rows.find((r) => r.token === token)
                if (row) {
                  row.verified = 1
                  row.status = 'verified'
                }
              }
              return { meta: { changes: 1 } }
            },
            async first() {
              calls.push({ sql, args })
              if (/^SELECT .* FROM claims WHERE token/.test(sql)) {
                const [token] = args
                return rows.find((r) => r.token === token) ?? null
              }
              return null
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
  const [row] = e.DB.rows
  assert.equal(row.id, data.claimId)
  assert.equal(row.status, 'pending')
  assert.equal(row.agency_slug, REAL_SLUG)
  assert.equal(row.email, 'owner@example.com')
  assert.equal(typeof row.token, 'string')
  assert.ok(row.token.length >= 32, 'token should be a long, non-guessable secret')
  assert.ok(typeof row.created_at === 'string' && !Number.isNaN(Date.parse(row.created_at)))
})

test('the verify token is never returned in the API response (only claimId is)', async () => {
  const e = env()
  const res = await handlePostClaim(req(VALID_BODY), e)
  const data = await res.json()
  assert.deepEqual(Object.keys(data), ['claimId'])

  const [row] = e.DB.rows
  // claimId (returned) must differ from token (D1-only, mailed later by A2-CLAIM-EMAIL) —
  // see docs/project/DECISIONS.md D-023.
  assert.notEqual(data.claimId, row.token)
})

test('two claims for the same agency/email get different, unpredictable tokens', async () => {
  const e = env()
  await handlePostClaim(req(VALID_BODY), e)
  await handlePostClaim(req(VALID_BODY), e)
  const [row1, row2] = e.DB.rows
  assert.notEqual(row1.id, row2.id) // different claimId
  assert.notEqual(row1.token, row2.token) // different token
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

test('buildVerifyEmail embeds the token and origin in a working-looking link, not a placeholder', () => {
  const { subject, text } = buildVerifyEmail({ agencyName: 'Deque Systems', token: 'abc123', origin: 'https://worker.example' })
  assert.match(subject, /Deque Systems/)
  assert.match(text, /https:\/\/worker\.example\/api\/claim\/verify\?token=abc123/)
})

test('RESEND_API_KEY configured: happy path sends exactly one email to the claim email, link uses the request origin', async (t) => {
  const calls = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) })
    return new Response(JSON.stringify({ id: 'evt_1' }), { status: 200 })
  }
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const res = await handlePostClaim(req(VALID_BODY), env({ RESEND_API_KEY: 're_test' }))
  assert.equal(res.status, 201)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://api.resend.com/emails')
  assert.deepEqual(calls[0].body.to, ['owner@example.com'])
  assert.match(calls[0].body.text, /https:\/\/worker\.example\/api\/claim\/verify\?token=/)
})

test('RESEND_API_KEY configured but Resend API fails: claim still succeeds (best-effort, not 5xx)', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'down' }), { status: 500 })
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const e = env({ RESEND_API_KEY: 're_test' })
  const res = await handlePostClaim(req(VALID_BODY), e)
  assert.equal(res.status, 201, 'a Resend outage must not turn an already-persisted claim into an error response')
  assert.equal(e.DB.rows.length, 1, 'the claim row must still exist in D1 despite the email failure')
})

test('GET /api/claim/verify: missing token query param -> 400', async () => {
  const res = await handleGetClaimVerify(new Request('https://worker.example/api/claim/verify'), env())
  assert.equal(res.status, 400)
})

test('GET /api/claim/verify: unknown token -> 404', async () => {
  const res = await handleGetClaimVerify(
    new Request('https://worker.example/api/claim/verify?token=does-not-exist'),
    env(),
  )
  assert.equal(res.status, 404)
})

test('GET /api/claim/verify: valid token -> flips verified=1/status=verified in D1, not just in the response', async () => {
  const e = env()
  const createRes = await handlePostClaim(req(VALID_BODY), e)
  const { claimId } = await createRes.json()
  const [row] = e.DB.rows
  assert.equal(row.verified, 0, 'sanity check: starts unverified')

  const verifyRes = await handleGetClaimVerify(
    new Request(`https://worker.example/api/claim/verify?token=${row.token}`),
    e,
  )
  assert.equal(verifyRes.status, 200)
  const data = await verifyRes.json()
  assert.equal(data.verified, true)
  assert.equal(data.agencySlug, REAL_SLUG)

  const [updatedRow] = e.DB.rows
  assert.equal(updatedRow.verified, 1)
  assert.equal(updatedRow.status, 'verified')
  assert.equal(updatedRow.id, claimId, 'sanity check: same claim row')
})
