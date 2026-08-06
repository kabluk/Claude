// Синтетические фикстуры Stripe-событий и тестовый секрет — НЕ реальный
// STRIPE_WEBHOOK_SECRET (docs/project/GRAPH.yaml, A2-STRIPE-WEBHOOK-CODE, D-020
// принцип: синтетика проверяет код, живой прогон — отдельно, A2-STRIPE-LIVE).
//
// Подписи строятся здесь через node:crypto (createHmac), НЕЗАВИСИМО от
// crypto.subtle, которым пользуется сам verifyStripeSignature — так тест
// проверяет совместимость с реальным алгоритмом Stripe, а не то, что модуль
// согласен сам с собой.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { verifyStripeSignature } from './stripeSig.js'

const SECRET = 'whsec_test_synthetic_0000000000000000000000'

function sign(secret, timestamp, payload) {
  return createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
}

function header(timestamp, sig) {
  return `t=${timestamp},v1=${sig}`
}

test('valid signature with fresh timestamp -> valid', async () => {
  const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' })
  const now = Math.floor(Date.now() / 1000)
  const result = await verifyStripeSignature(payload, header(now, sign(SECRET, now, payload)), SECRET)
  assert.equal(result.valid, true)
})

test('tampered payload after signing -> signature_mismatch', async () => {
  const payload = JSON.stringify({ amount: 100 })
  const now = Math.floor(Date.now() / 1000)
  const sig = sign(SECRET, now, payload)
  const tampered = JSON.stringify({ amount: 100000 })
  const result = await verifyStripeSignature(tampered, header(now, sig), SECRET)
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'signature_mismatch')
})

test('signature computed with the wrong secret -> signature_mismatch (forged webhook rejected)', async () => {
  const payload = JSON.stringify({ id: 'evt_2' })
  const now = Math.floor(Date.now() / 1000)
  const sig = sign('attacker-guessed-secret', now, payload)
  const result = await verifyStripeSignature(payload, header(now, sig), SECRET)
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'signature_mismatch')
})

test('missing Stripe-Signature header -> missing_header', async () => {
  const result = await verifyStripeSignature('{}', null, SECRET)
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'missing_header')
})

test('header without t= -> malformed_header', async () => {
  const result = await verifyStripeSignature('{}', 'v1=' + 'a'.repeat(64), SECRET)
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'malformed_header')
})

test('header without v1= (e.g. only legacy v0) -> malformed_header', async () => {
  const now = Math.floor(Date.now() / 1000)
  const result = await verifyStripeSignature('{}', `t=${now},v0=${'b'.repeat(40)}`, SECRET)
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'malformed_header')
})

test('timestamp older than tolerance (default 5 min) -> timestamp_out_of_tolerance', async () => {
  const payload = '{}'
  const old = Math.floor(Date.now() / 1000) - 3600
  const result = await verifyStripeSignature(payload, header(old, sign(SECRET, old, payload)), SECRET)
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'timestamp_out_of_tolerance')
})

test('caller can widen tolerance explicitly', async () => {
  const payload = '{}'
  const old = Math.floor(Date.now() / 1000) - 3600
  const result = await verifyStripeSignature(payload, header(old, sign(SECRET, old, payload)), SECRET, {
    toleranceSeconds: 7200,
  })
  assert.equal(result.valid, true)
})

test('multiple v1 entries (secret rotation window): any matching one is accepted', async () => {
  const payload = '{}'
  const now = Math.floor(Date.now() / 1000)
  const correct = sign(SECRET, now, payload)
  const bogus = 'f'.repeat(64)
  const result = await verifyStripeSignature(payload, `t=${now},v1=${bogus},v1=${correct}`, SECRET)
  assert.equal(result.valid, true)
})

test('no secret provided -> missing_secret (caller must 503 before calling this, see stripeHook.js)', async () => {
  const now = Math.floor(Date.now() / 1000)
  const result = await verifyStripeSignature('{}', header(now, sign(SECRET, now, '{}')), undefined)
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'missing_secret')
})
