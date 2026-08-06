// Синтетические фикстуры Stripe checkout.session.completed события + тестовый
// webhook-секрет — НЕ реальный STRIPE_WEBHOOK_SECRET (A2-STRIPE-WEBHOOK-CODE).
// A2-STRIPE-LIVE (D-027): Payment Link создан вручную в Dashboard, поэтому
// agency_slug приходит через session.custom_fields (custom field на странице
// оплаты), не через session.metadata — Dashboard-ссылка не умеет нести
// динамическую metadata, одна и та же для всех покупателей. until больше не
// приходит извне вообще — считается на сервере (computeFeaturedUntil).
// REAL_CUSTOM_FIELD_KEY ниже — не выдумка, а буквальный key из настоящего
// оплаченного события (см. stripeHook.js/CUSTOM_FIELD_KEY) — Stripe не равен
// видимому в Dashboard тексту label.
// Живая проверка (реальная D1 через wrangler dev --local + wrangler d1 execute
// --local) — отдельно, не заменяется этими тестами (D-020).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { handlePostStripeHook, extractFeaturedFromSession, computeFeaturedUntil } from './stripeHook.js'

const SECRET = 'whsec_test_synthetic_0000000000000000000000'
// Реальные slug'и из data/a11y/agencies.json — extractFeaturedFromSession
// валидирует против настоящего каталога (AGENCY_SLUGS), выдуманный slug
// должен отклоняться так же, как опечатка агентства.
const REAL_SLUG_1 = 'deque-systems'
const REAL_SLUG_2 = 'marc-haunschild-accessibility-consulting'
const UNKNOWN_SLUG = 'acme-a11y-does-not-exist'
// Настоящий key custom field из живого оплаченного checkout.session.completed
// (cs_live_a12o7c..., проверка A2-STRIPE-LIVE 2026-08-06) — Stripe сгенерировал
// его из более раннего черновика label и не пересчитал при переименовании
// label на "agency_slug"; см. CUSTOM_FIELD_KEY в stripeHook.js и D-027.
const REAL_CUSTOM_FIELD_KEY = 'yourslugaccessatlas'

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

function customField(key, value) {
  return { key, label: { type: 'custom', custom: key }, optional: false, type: 'text', text: { value } }
}

function checkoutSessionCompletedEvent({ agencySlug = REAL_SLUG_1, sessionId = 'cs_test_1', customFields } = {}) {
  return JSON.stringify({
    id: 'evt_test_1',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        custom_fields: customFields !== undefined ? customFields : [customField(REAL_CUSTOM_FIELD_KEY, agencySlug)],
      },
    },
  })
}

// --- computeFeaturedUntil ----------------------------------------------------

test('computeFeaturedUntil: today + 365 days, ISO date only', () => {
  const now = new Date('2026-08-06T12:34:56.000Z')
  assert.equal(computeFeaturedUntil(now), '2027-08-06')
})

test('computeFeaturedUntil: defaults to real "now" when called with no argument', () => {
  const result = computeFeaturedUntil()
  assert.match(result, /^\d{4}-\d{2}-\d{2}$/)
})

// --- extractFeaturedFromSession -----------------------------------------------

test('extractFeaturedFromSession: valid custom_fields with the real field key -> {agencySlug, until}', () => {
  const now = new Date('2026-08-06T00:00:00.000Z')
  const session = { custom_fields: [customField(REAL_CUSTOM_FIELD_KEY, REAL_SLUG_1)] }
  assert.deepEqual(extractFeaturedFromSession(session, now), { agencySlug: REAL_SLUG_1, until: '2027-08-06' })
})

test('extractFeaturedFromSession: until is server-computed, never trusted from the session', () => {
  // even if a session somehow carried its own "until"-looking field, it must be ignored
  const now = new Date('2026-08-06T00:00:00.000Z')
  const session = { custom_fields: [customField(REAL_CUSTOM_FIELD_KEY, REAL_SLUG_1)], until: '2099-01-01' }
  assert.deepEqual(extractFeaturedFromSession(session, now), { agencySlug: REAL_SLUG_1, until: '2027-08-06' })
})

test('extractFeaturedFromSession: missing/malformed custom_fields -> null', () => {
  assert.equal(extractFeaturedFromSession({}), null)
  assert.equal(extractFeaturedFromSession(null), null)
  assert.equal(extractFeaturedFromSession({ custom_fields: null }), null)
  assert.equal(extractFeaturedFromSession({ custom_fields: 'not-an-array' }), null)
})

test('extractFeaturedFromSession: field with the real key missing from custom_fields -> null', () => {
  const session = { custom_fields: [customField('some_other_field', 'value')] }
  assert.equal(extractFeaturedFromSession(session), null)
})

// Регрессия конкретно под находку D-027: label этого custom field в Dashboard
// показывает текст "agency_slug", но НАСТОЯЩИЙ key поля другой
// (REAL_CUSTOM_FIELD_KEY) — код обязан матчить по key, а не по видимому label,
// иначе поле с key буквально "agency_slug" (которого в реальности нет, но
// легко могло бы появиться при следующей ручной правке в Dashboard) молча
// перекрыло бы правильное значение.
test('extractFeaturedFromSession: a field whose key literally equals the visible label text ("agency_slug") is not mistaken for the real field', () => {
  const session = { custom_fields: [customField('agency_slug', REAL_SLUG_1)] }
  assert.equal(extractFeaturedFromSession(session), null)
})

test('extractFeaturedFromSession: blank/whitespace-only value -> null', () => {
  assert.equal(extractFeaturedFromSession({ custom_fields: [customField(REAL_CUSTOM_FIELD_KEY, '')] }), null)
  assert.equal(extractFeaturedFromSession({ custom_fields: [customField(REAL_CUSTOM_FIELD_KEY, '   ')] }), null)
})

test('extractFeaturedFromSession: agency slug not present in the real catalog (typo) -> null', () => {
  const session = { custom_fields: [customField(REAL_CUSTOM_FIELD_KEY, UNKNOWN_SLUG)] }
  assert.equal(extractFeaturedFromSession(session), null)
})

// Label теперь "Your agency name" (не "your slug"), не все заявители знают,
// что такое slug — поэтому значение также резолвится по названию агентства
// (data/a11y/agencies.json::name), не только по точному slug.
test('extractFeaturedFromSession: value matches by agency display name (not just slug) -> resolves to the real slug', () => {
  const now = new Date('2026-08-06T00:00:00.000Z')
  const session = { custom_fields: [customField(REAL_CUSTOM_FIELD_KEY, 'Deque Systems')] }
  assert.deepEqual(extractFeaturedFromSession(session, now), { agencySlug: REAL_SLUG_1, until: '2027-08-06' })
})

test('extractFeaturedFromSession: name match is case-insensitive and tolerates extra whitespace', () => {
  const session = { custom_fields: [customField(REAL_CUSTOM_FIELD_KEY, '  deque   systems  ')] }
  assert.deepEqual(extractFeaturedFromSession(session), { agencySlug: REAL_SLUG_1, until: computeFeaturedUntil() })
})

test('extractFeaturedFromSession: a name-like value that matches no real agency name or slug -> null', () => {
  const session = { custom_fields: [customField(REAL_CUSTOM_FIELD_KEY, 'Some Agency That Does Not Exist LLC')] }
  assert.equal(extractFeaturedFromSession(session), null)
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
  const tamperedBody = checkoutSessionCompletedEvent({ agencySlug: REAL_SLUG_2 })
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

test('valid signature + checkout.session.completed with a real agency_slug custom field -> 200, featured upserted in D1 with server-computed until', async () => {
  const e = env()
  const body = checkoutSessionCompletedEvent({ agencySlug: REAL_SLUG_1, sessionId: 'cs_test_42' })
  const res = await handlePostStripeHook(req(body), e)
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.deepEqual(data, { received: true })

  assert.equal(e.DB.rows.length, 1)
  const [{ sql, args }] = e.DB.rows
  assert.match(sql, /INSERT INTO featured/)
  assert.match(sql, /ON CONFLICT\(agency_slug\) DO UPDATE/)
  assert.equal(args[0], REAL_SLUG_1)
  assert.match(args[1], /^\d{4}-\d{2}-\d{2}$/)
  assert.equal(args[2], 'cs_test_42')
})

test('valid signature + checkout.session.completed but agency_slug custom field missing -> 200, D1 untouched (bad Payment Link config is not a delivery failure)', async () => {
  const e = env()
  const body = checkoutSessionCompletedEvent({ customFields: [] })
  const res = await handlePostStripeHook(req(body), e)
  assert.equal(res.status, 200)
  assert.equal(e.DB.rows.length, 0)
})

test('valid signature + checkout.session.completed with an unrecognized agency_slug (typo) -> 200, D1 untouched', async () => {
  const e = env()
  const body = checkoutSessionCompletedEvent({ agencySlug: UNKNOWN_SLUG })
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
  const first = checkoutSessionCompletedEvent({ agencySlug: REAL_SLUG_1, sessionId: 'cs_1' })
  const second = checkoutSessionCompletedEvent({ agencySlug: REAL_SLUG_1, sessionId: 'cs_2' })

  assert.equal((await handlePostStripeHook(req(first), e)).status, 200)
  assert.equal((await handlePostStripeHook(req(second), e)).status, 200)

  assert.equal(e.DB.rows.length, 2)
  assert.equal(e.DB.rows[1].args[0], REAL_SLUG_1)
  assert.equal(e.DB.rows[1].args[2], 'cs_2')
})
