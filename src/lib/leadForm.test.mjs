// A2-LEAD-FORM / A2-LEAD-API-подключение (2026-08-14). Гейт двух вещей, что
// ломаются молча: (1) клиентская валидация расходится с серверной
// (invalidLeadFields, worker/routes/lead.js) и форма шлёт заведомо 400-й
// запрос; (2) ошибка API превращается в код/сырой текст на экране вместо
// человеческого объяснения. Сетевого слоя тут нет — interpretLeadResponse
// чистая, ей достаточно настоящего Response (тот же приём, что
// interpretSubscribeResponse в subscribeForm.test.mjs).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { interpretLeadResponse, leadErrorMessage, validateLeadForm } from './leadForm.ts'

const VALID_VALUES = {
  country: 'DE',
  standard: 'wcag-2-2',
  service: 'audit',
  budget: 'budget',
  deadline: '',
  email: 'owner@example.com',
  company: '',
}

test('валидные значения проходят, email/company обрезаются', () => {
  const r = validateLeadForm({ ...VALID_VALUES, email: '  owner@example.com  ', company: '  Acme  ' })
  assert.equal(r.valid, true)
  assert.equal(r.value.contact.email, 'owner@example.com')
  assert.equal(r.value.contact.company, 'Acme')
})

test('неизвестный код страны отклоняется — matchAgencies не должен молча получить страну без агентств', () => {
  const r = validateLeadForm({ ...VALID_VALUES, country: 'ZZ' })
  assert.equal(r.valid, false)
  assert.ok(r.errors.country)
})

test('email проверяется тем же паттерном, что subscribeForm.ts и worker/routes/lead.js', () => {
  for (const bad of ['', '   ', 'owner', 'owner@', 'owner@example', 'ow ner@example.com', '@example.com']) {
    const r = validateLeadForm({ ...VALID_VALUES, email: bad })
    assert.equal(r.valid, false, `должен быть отклонён: ${JSON.stringify(bad)}`)
    assert.ok(r.errors.email)
  }
})

test('дедлайн в прошлом отклоняется, пустой — валиден (поле опционально)', () => {
  assert.equal(validateLeadForm({ ...VALID_VALUES, deadline: '2000-01-01' }).valid, false)
  assert.equal(validateLeadForm({ ...VALID_VALUES, deadline: '' }).valid, true)
})

test('201 {leadId, matched} — успех, matched фильтрует не-строки', async () => {
  const res = new Response(JSON.stringify({ leadId: 'lead-1', matched: ['a', 'b', 42, null] }), { status: 201 })
  assert.deepEqual(await interpretLeadResponse(res), { kind: 'ok', leadId: 'lead-1', matched: ['a', 'b'] })
})

test('2xx без разбираемого тела — всё равно успех (лид уже записан в D1)', async () => {
  const res = new Response('not json at all', { status: 201 })
  assert.deepEqual(await interpretLeadResponse(res), { kind: 'ok', leadId: '', matched: [] })
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
    const res = new Response(JSON.stringify({ error: 'x' }), { status })
    assert.deepEqual(await interpretLeadResponse(res), { kind: 'failed', code })
  }
})

test('каждый код ошибки имеет человеческий текст без сырых кодов/статусов', () => {
  for (const code of ['bad_request', 'forbidden', 'rate_limited', 'server', 'network', 'unavailable']) {
    const msg = leadErrorMessage(code)
    assert.ok(msg.length > 0)
    assert.ok(!/^\d+$/.test(msg))
  }
})
