// A3-CRON-SUBSCRIBE-FORM (D-135). Гейт двух вещей, которые ломаются молча:
// (1) клиентская валидация расходится с серверной и форма шлёт заведомо 400-й
// запрос; (2) ошибка API превращается в код/сырой текст на экране вместо
// человеческого объяснения. Сетевого слоя тут нет — interpretSubscribeResponse
// чистая, ей достаточно настоящего Response (тот же приём, что
// interpretCheckoutResponse в scanner.test.mjs).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  canMonitorUrl,
  interpretSubscribeResponse,
  subscribeErrorMessage,
  validateSubscribeForm,
} from './subscribeForm.ts'

const OK_URL = 'https://example.com/'

test('валидный email + url отчёта проходят, значения обрезаются', () => {
  const r = validateSubscribeForm({ email: '  owner@example.com  ', url: `  ${OK_URL} ` })
  assert.equal(r.valid, true)
  assert.deepEqual(r.value, { email: 'owner@example.com', url: OK_URL })
})

test('email проверяется тем же паттерном, что leadForm.ts и worker/routes/subscribe.js', () => {
  for (const bad of ['', '   ', 'owner', 'owner@', 'owner@example', 'ow ner@example.com', '@example.com']) {
    const r = validateSubscribeForm({ email: bad, url: OK_URL })
    assert.equal(r.valid, false, `должен быть отклонён: ${JSON.stringify(bad)}`)
    assert.ok(r.errors.email, 'ошибка привязана к полю email')
  }
})

test('url не из http(s) отклоняется тем же критерием, что isHttpUrl воркера', () => {
  for (const bad of ['', 'example.com', 'mailto:a@b.com', 'javascript:alert(1)', 'data:text/html,x']) {
    assert.equal(canMonitorUrl(bad), false, `должен быть отклонён: ${JSON.stringify(bad)}`)
    const r = validateSubscribeForm({ email: 'owner@example.com', url: bad })
    assert.equal(r.valid, false)
    assert.ok(r.errors.url)
  }
  assert.equal(canMonitorUrl('http://example.com'), true)
  assert.equal(canMonitorUrl(OK_URL), true)
})

test('201 {subscriptionId} — успех', async () => {
  const res = new Response(JSON.stringify({ subscriptionId: 'sub-1' }), { status: 201 })
  assert.deepEqual(await interpretSubscribeResponse(res), { kind: 'ok', subscriptionId: 'sub-1' })
})

test('2xx без разбираемого тела — всё равно успех (подписка уже создана, письмо ушло)', async () => {
  // Иначе UI сказал бы «не получилось» об успешной записи и толкнул человека
  // на повторную отправку — дедупа на сервере намеренно нет.
  const res = new Response('not json at all', { status: 201 })
  assert.deepEqual(await interpretSubscribeResponse(res), { kind: 'ok', subscriptionId: null })
})

test('400/403/429 — различимые коды, всё остальное не-ok — server', async () => {
  const cases = [
    [400, 'bad_request'],
    [403, 'forbidden'],
    [429, 'rate_limited'],
    [500, 'server'],
    [502, 'server'],
  ]
  for (const [status, code] of cases) {
    const res = new Response(JSON.stringify({ error: 'x', code: 'whatever' }), { status })
    assert.deepEqual(await interpretSubscribeResponse(res), { kind: 'failed', code })
  }
})

test('у каждого исхода есть человеческий текст — без кодов, статусов и жаргона', () => {
  const codes = ['bad_request', 'forbidden', 'rate_limited', 'server', 'network', 'unavailable']
  for (const code of codes) {
    const msg = subscribeErrorMessage(code)
    assert.ok(msg.length > 20, `сообщение для ${code} слишком короткое`)
    assert.doesNotMatch(msg, /\b\d{3}\b/, `сообщение для ${code} показывает HTTP-статус`)
    assert.doesNotMatch(msg, /_|turnstile|api|http/i, `сообщение для ${code} содержит жаргон`)
  }
})
