// A2-STRIPE-CHECKOUT route: POST /api/scan/:id/checkout. Stripe is never called
// for real — env.__stripeFetch injects a fake (same seam pattern as
// env.__launchBrowser in scanPdf.js). The €19.99 amount is asserted to be
// SERVER-set and NOT taken from the client's request body.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handlePostPlanCheckout } from './planCheckout.js'

// Mini-D1: getScan + reapStaleScan + the two unlock SELECTs (leads,
// plan_purchases). Same shape as scanPdf.test.mjs::fakeScansDb.
function fakeScansDb(initialRows = [], leadScanIds = [], paidScanIds = []) {
  const rows = [...initialRows]
  const find = (id) => rows.find((r) => r.id === id)
  return {
    rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (/^SELECT \* FROM scans WHERE id/.test(sql)) return find(args[0]) ?? null
              if (/^SELECT 1 FROM leads WHERE scan_id = \? LIMIT 1/.test(sql)) {
                return leadScanIds.includes(args[0]) ? { 1: 1 } : null
              }
              if (/^SELECT 1 FROM plan_purchases WHERE scan_id = \? LIMIT 1/.test(sql)) {
                return paidScanIds.includes(args[0]) ? { 1: 1 } : null
              }
              return null
            },
            async run() {
              if (/^UPDATE scans SET status = 'error'.*AND status = 'running'/s.test(sql)) {
                const [error, completed, id] = args
                const row = find(id)
                if (row && row.status === 'running') {
                  Object.assign(row, { status: 'error', error, error_code: 'timeout', completed_at: completed })
                  return { meta: { changes: 1 } }
                }
                return { meta: { changes: 0 } }
              }
              return { meta: { changes: 0 } }
            },
          }
        },
      }
    },
  }
}

function scanRow(over = {}) {
  return {
    id: 's1', url: 'https://example.com', status: 'done', pages_json: JSON.stringify(['https://example.com/']),
    findings_json: JSON.stringify([{ ruleId: 'color-contrast', impact: 'serious', selector: 'body', page: 'https://example.com/', wcag: [] }]),
    score: 88, error: null, error_code: null, email: null,
    created_at: '2026-08-10T00:00:00.000Z', completed_at: '2026-08-10T00:01:00.000Z', progress_json: null,
    ...over,
  }
}

// Fake Stripe API. Captures the request and returns a session with a URL.
function fakeStripe({ ok = true, status = 200, body = { id: 'cs_test_123', url: 'https://checkout.stripe.com/c/pay/cs_test_123' } } = {}) {
  const calls = []
  const fn = async (url, init) => {
    calls.push({ url, init })
    const text = ok ? JSON.stringify(body) : JSON.stringify({ error: { message: 'bad key' } })
    return new Response(text, { status, headers: { 'content-type': 'application/json' } })
  }
  return { fn, calls }
}

const KEY = 'sk_test_synthetic_0000'

// A request carrying a FORGED price in its body — the route must ignore it.
function req(bodyObj) {
  return new Request('https://worker.example/api/scan/s1/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://verscala.com' },
    body: bodyObj ? JSON.stringify(bodyObj) : undefined,
  })
}

test('no STRIPE_SECRET_KEY -> 503 checkout_unavailable, Stripe never touched', async () => {
  const stripe = fakeStripe()
  const env = { DB: fakeScansDb([scanRow()]), __stripeFetch: stripe.fn, ALLOWED_ORIGIN: 'https://verscala.com' }
  const res = await handlePostPlanCheckout('s1', req(), env)
  assert.equal(res.status, 503)
  assert.equal((await res.json()).code, 'checkout_unavailable')
  assert.equal(stripe.calls.length, 0)
})

test('unknown scan id -> 404', async () => {
  const stripe = fakeStripe()
  const env = { DB: fakeScansDb([]), STRIPE_SECRET_KEY: KEY, __stripeFetch: stripe.fn }
  const res = await handlePostPlanCheckout('missing', req(), env)
  assert.equal(res.status, 404)
  assert.equal(stripe.calls.length, 0)
})

test('scan still running -> 409 scan_not_ready, no session created', async () => {
  const stripe = fakeStripe()
  const env = {
    DB: fakeScansDb([scanRow({ status: 'running', findings_json: null, score: null, completed_at: null, created_at: new Date().toISOString() })]),
    STRIPE_SECRET_KEY: KEY, __stripeFetch: stripe.fn,
  }
  const res = await handlePostPlanCheckout('s1', req(), env)
  assert.equal(res.status, 409)
  assert.equal((await res.json()).code, 'scan_not_ready')
  assert.equal(stripe.calls.length, 0)
})

test('scan failed -> 422 scan_failed, no session created', async () => {
  const stripe = fakeStripe()
  const env = {
    DB: fakeScansDb([scanRow({ status: 'error', error: 'boom', error_code: 'internal', findings_json: null, score: null })]),
    STRIPE_SECRET_KEY: KEY, __stripeFetch: stripe.fn,
  }
  const res = await handlePostPlanCheckout('s1', req(), env)
  assert.equal(res.status, 422)
  assert.equal((await res.json()).code, 'scan_failed')
  assert.equal(stripe.calls.length, 0)
})

test('already unlocked by a lead -> 200 alreadyUnlocked, Stripe NOT called (no double charge)', async () => {
  const stripe = fakeStripe()
  const env = { DB: fakeScansDb([scanRow()], ['s1']), STRIPE_SECRET_KEY: KEY, __stripeFetch: stripe.fn }
  const res = await handlePostPlanCheckout('s1', req(), env)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { alreadyUnlocked: true })
  assert.equal(stripe.calls.length, 0, 'must not create a session for an already-accessible plan')
})

test('already unlocked by a prior payment -> 200 alreadyUnlocked, Stripe NOT called', async () => {
  const stripe = fakeStripe()
  const env = { DB: fakeScansDb([scanRow()], [], ['s1']), STRIPE_SECRET_KEY: KEY, __stripeFetch: stripe.fn }
  const res = await handlePostPlanCheckout('s1', req(), env)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { alreadyUnlocked: true })
  assert.equal(stripe.calls.length, 0)
})

test('happy path: Stripe called with SERVER-set unit_amount=1999 eur + metadata.scan_id; client-supplied price ignored; returns {url}', async () => {
  const stripe = fakeStripe()
  const env = { DB: fakeScansDb([scanRow()]), STRIPE_SECRET_KEY: KEY, __stripeFetch: stripe.fn, ALLOWED_ORIGIN: 'https://verscala.com' }

  // The client tries to dictate a price of 0 in the request body — it must be ignored.
  const res = await handlePostPlanCheckout('s1', req({ unit_amount: 0, 'line_items[0][price_data][unit_amount]': 1 }), env)

  assert.equal(res.status, 200)
  assert.equal((await res.json()).url, 'https://checkout.stripe.com/c/pay/cs_test_123')

  assert.equal(stripe.calls.length, 1)
  const call = stripe.calls[0]
  assert.equal(call.url, 'https://api.stripe.com/v1/checkout/sessions')
  assert.equal(call.init.method, 'POST')
  assert.match(call.init.headers.Authorization, /^Bearer sk_test_synthetic_0000$/)
  assert.match(call.init.headers['Content-Type'], /application\/x-www-form-urlencoded/)

  const form = new URLSearchParams(call.init.body)
  assert.equal(form.get('mode'), 'payment')
  assert.equal(form.get('line_items[0][price_data][currency]'), 'eur')
  assert.equal(form.get('line_items[0][price_data][unit_amount]'), '1999', 'amount must be the server constant, never the client body')
  assert.equal(form.get('line_items[0][price_data][product_data][name]'), 'Accessibility remediation plan')
  assert.equal(form.get('line_items[0][quantity]'), '1')
  assert.equal(form.get('metadata[scan_id]'), 's1')
  assert.match(form.get('success_url'), /verscala\.com\/report\/s1\//)
  assert.match(form.get('cancel_url'), /verscala\.com\/report\/s1\//)
})

test('origin falls back to the request Origin header when ALLOWED_ORIGIN is unset', async () => {
  const stripe = fakeStripe()
  const env = { DB: fakeScansDb([scanRow()]), STRIPE_SECRET_KEY: KEY, __stripeFetch: stripe.fn } // no ALLOWED_ORIGIN
  const res = await handlePostPlanCheckout('s1', req(), env)
  assert.equal(res.status, 200)
  const form = new URLSearchParams(stripe.calls[0].init.body)
  assert.match(form.get('success_url'), /^https:\/\/verscala\.com\/report\/s1\//)
})

test('Stripe answers non-2xx -> 502 checkout_failed, not passed off as success', async () => {
  // The error body deliberately carries a url-shaped field: only the non-2xx
  // guard (not the later no-url check) can stop this from becoming a bogus 200.
  const stripe = fakeStripe({ ok: true, status: 401, body: { url: 'https://evil.example/not-a-real-session' } })
  const env = { DB: fakeScansDb([scanRow()]), STRIPE_SECRET_KEY: KEY, __stripeFetch: stripe.fn, ALLOWED_ORIGIN: 'https://verscala.com' }
  const res = await handlePostPlanCheckout('s1', req(), env)
  assert.equal(res.status, 502)
  assert.equal((await res.json()).code, 'checkout_failed')
})

test('Stripe 2xx but no url in response -> 502 checkout_failed', async () => {
  const stripe = fakeStripe({ body: { id: 'cs_x' } }) // no url
  const env = { DB: fakeScansDb([scanRow()]), STRIPE_SECRET_KEY: KEY, __stripeFetch: stripe.fn, ALLOWED_ORIGIN: 'https://verscala.com' }
  const res = await handlePostPlanCheckout('s1', req(), env)
  assert.equal(res.status, 502)
  assert.equal((await res.json()).code, 'checkout_failed')
})

test('network failure reaching Stripe -> 502 checkout_failed', async () => {
  const env = {
    DB: fakeScansDb([scanRow()]), STRIPE_SECRET_KEY: KEY, ALLOWED_ORIGIN: 'https://verscala.com',
    __stripeFetch: async () => { throw new Error('ECONNRESET') },
  }
  const res = await handlePostPlanCheckout('s1', req(), env)
  assert.equal(res.status, 502)
  assert.equal((await res.json()).code, 'checkout_failed')
})
