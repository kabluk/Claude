// Синтетические фикстуры Stripe checkout.session.completed события + тестовый
// webhook-секрет — НЕ реальный STRIPE_WEBHOOK_SECRET (A2-STRIPE-WEBHOOK-CODE).
// Живая проверка (реальная D1 через wrangler dev --local + wrangler d1 execute
// --local) — отдельно, не заменяется этими тестами (D-020).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { handlePostStripeHook, extractFeaturedFromSession } from './stripeHook.js'

const SECRET = 'whsec_test_synthetic_0000000000000000000000'

function sign(secret, timestamp, payload) {
  return createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
}

function signedHeader(payload, { secret = SECRET, timestamp = Math.floor(Date.now() / 1000) } = {}) {
  return `t=${timestamp},v1=${sign(secret, timestamp, payload)}`
}

// Мини-D1: только упрощённо записывает INSERT ... ON CONFLICT вызовы, как в
// worker/routes/lead.test.mjs::fakeDb. Реальное поведение ON CONFLICT DO
// UPDATE (что второй апсерт того же agency_slug реально продлевает until, не
// плодит вторую строку) проверяется живьём в настоящей SQLite/D1, не здесь —
// см. verify в GRAPH.yaml.
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

function env(overrides = {}) {
  return { DB: fakeDb(), STRIPE_WEBHOOK_SECRET: SECRET, ...overrides }
}

function req(rawBody, { signature, headers = {} } = {}) {
  const h = { 'content-type': 'application/json', ...headers }
  if (signature !== null) h['stripe-signature'] = signature ?? signedHeader(rawBody)
  return new Request('https://worker.example/api/stripe-hook', { method: 'POST', headers: h, body: rawBody })
}

function checkoutSessionCompletedEvent({ agencySlug = 'acme-a11y', until = '2027-01-01', sessionId = 'cs_test_1' } = {}) {
  return JSON.stringify({
    id: 'evt_test_1',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        metadata: { agency_slug: agencySlug, until },
      },
    },
  })
}

// --- extractFeaturedFromSession -------------------------------------------

test('extractFeaturedFromSession: valid metadata -> {agencySlug, until}', () => {
  const session = { metadata: { agency_slug: 'acme', until: '2027-01-01' } }
  assert.deepEqual(extractFeaturedFromSession(session), { agencySlug: 'acme', until: '2027-01-01' })
})

test('extractFeaturedFromSession: missing metadata -> null', () => {
  assert.equal(extractFeaturedFromSession({}), null)
  assert.equal(extractFeaturedFromSession(null), null)
})

test('extractFeaturedFromSession: missing/blank agency_slug -> null', () => {
  assert.equal(extractFeaturedFromSession({ metadata: { until: '2027-01-01' } }), null)
  assert.equal(extractFeaturedFromSession({ metadata: { agency_slug: '  ', until: '2027-01-01' } }), null)
})

test('extractFeaturedFromSession: missing/malformed until -> null', () => {
  assert.equal(extractFeaturedFromSession({ metadata: { agency_slug: 'acme' } }), null)
  assert.equal(extractFeaturedFromSession({ metadata: { agency_slug: 'acme', until: 'not-a-date' } }), null)
})

// --- handlePostStripeHook ---------------------------------------------------

test('no STRIPE_WEBHOOK_SECRET configured -> 503, body never even inspected', async () => {
  const res = await handlePostStripeHook(req(checkoutSessionCompletedEvent()), env({ STRIPE_WEBHOOK_SECRET: undefined }))
  assert.equal(res.status, 503)
  const data = await res.json()
  assert.equal(data.code, 'unavailable')
})

test('missing Stripe-Signature header -> 400 bad_request, D1 untouched', async () => {
  const e = env()
  const res = await handlePostStripeHook(req(checkoutSessionCompletedEvent(), { signature: null }), e)
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.code, 'bad_request')
  assert.equal(e.DB.rows.length, 0)
})

test('forged signature (wrong secret) -> 400 bad_request, D1 untouched', async () => {
  const e = env()
  const body = checkoutSessionCompletedEvent()
  const forged = signedHeader(body, { secret: 'attacker-guessed-secret' })
  const res = await handlePostStripeHook(req(body, { signature: forged }), e)
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.code, 'bad_request')
  assert.match(data.error, /signature/)
  assert.equal(e.DB.rows.length, 0)
})

test('tampered body vs. an otherwise-valid signature -> 400 bad_request, D1 untouched', async () => {
  const e = env()
  const body = checkoutSessionCompletedEvent()
  const validHeaderForOriginalBody = signedHeader(body)
  const tamperedBody = checkoutSessionCompletedEvent({ until: '2099-01-01' })
  const res = await handlePostStripeHook(req(tamperedBody, { signature: validHeaderForOriginalBody }), e)
  assert.equal(res.status, 400)
  assert.equal(e.DB.rows.length, 0)
})

test('expired timestamp (>5min old) with an otherwise-correct signature -> 400 bad_request', async () => {
  const e = env()
  const body = checkoutSessionCompletedEvent()
  const oldHeader = signedHeader(body, { timestamp: Math.floor(Date.now() / 1000) - 3600 })
  const res = await handlePostStripeHook(req(body, { signature: oldHeader }), e)
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.match(data.error, /timestamp_out_of_tolerance/)
})

test('valid signature but body is not valid JSON -> 400 bad_request', async () => {
  const e = env()
  const body = '{not valid json'
  const res = await handlePostStripeHook(req(body), e)
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.code, 'bad_request')
  assert.equal(e.DB.rows.length, 0)
})

test('valid signature + checkout.session.completed with valid metadata -> 200, featured upserted in D1', async () => {
  const e = env()
  const body = checkoutSessionCompletedEvent({ agencySlug: 'acme-a11y', until: '2027-01-01', sessionId: 'cs_test_42' })
  const res = await handlePostStripeHook(req(body), e)
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.deepEqual(data, { received: true })

  assert.equal(e.DB.rows.length, 1)
  const [{ sql, args }] = e.DB.rows
  assert.match(sql, /INSERT INTO featured/)
  assert.match(sql, /ON CONFLICT\(agency_slug\) DO UPDATE/)
  assert.deepEqual(args, ['acme-a11y', '2027-01-01', 'cs_test_42'])
})

test('valid signature + checkout.session.completed but no agency_slug/until metadata -> 200, D1 untouched (bad Payment Link config is not a delivery failure)', async () => {
  const e = env()
  const body = JSON.stringify({
    id: 'evt_test_2',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_no_meta', object: 'checkout.session', metadata: {} } },
  })
  const res = await handlePostStripeHook(req(body), e)
  assert.equal(res.status, 200)
  assert.equal(e.DB.rows.length, 0)
})

test('valid signature + unhandled event type -> 200 (acknowledged, no-op), D1 untouched', async () => {
  const e = env()
  const body = JSON.stringify({ id: 'evt_test_3', type: 'invoice.paid', data: { object: {} } })
  const res = await handlePostStripeHook(req(body), e)
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.deepEqual(data, { received: true })
  assert.equal(e.DB.rows.length, 0)
})

test('renewal: a second checkout.session.completed for the same agency_slug issues another upsert (ON CONFLICT extends until, verified live against real D1 per GRAPH.yaml)', async () => {
  const e = env()
  const first = checkoutSessionCompletedEvent({ agencySlug: 'acme-a11y', until: '2027-01-01', sessionId: 'cs_1' })
  const second = checkoutSessionCompletedEvent({ agencySlug: 'acme-a11y', until: '2027-02-01', sessionId: 'cs_2' })

  assert.equal((await handlePostStripeHook(req(first), e)).status, 200)
  assert.equal((await handlePostStripeHook(req(second), e)).status, 200)

  assert.equal(e.DB.rows.length, 2)
  assert.deepEqual(e.DB.rows[1].args, ['acme-a11y', '2027-02-01', 'cs_2'])
})
