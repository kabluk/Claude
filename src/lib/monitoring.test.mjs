// A3-CRON-MONITORING-PAGES (D-139). Гейт исхода брендовых страниц
// confirm/unsubscribe: 2xx → success (с адресом из тела), 404 → «неизвестный/
// просроченный токен», прочее не-ok → server. Как и у subscribeForm.test.mjs,
// сетевого слоя тут нет — interpretMonitoringResponse чистая, ей достаточно
// настоящего Response (API_BASE в tsx-тестах пуст, apiFetch не запускается).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { interpretMonitoringResponse } from './monitoring.ts'

test('200 с url в теле — success, адрес прокинут на экран', async () => {
  const res = new Response(JSON.stringify({ subscriptionId: 's', url: 'https://example.com/', verified: true, status: 'active' }), { status: 200 })
  assert.deepEqual(await interpretMonitoringResponse(res), { kind: 'ok', url: 'https://example.com/' })
})

test('2xx без разбираемого url — всё равно success (действие уже совершено на сервере)', async () => {
  // url — украшение сообщения, а не условие успеха: verify/unsubscribe уже
  // сработали на сервере к моменту 2xx. Сказать «ошибка» из-за формы тела
  // означало бы соврать о состоянии подписки.
  const noUrl = new Response(JSON.stringify({ subscriptionId: 's', status: 'unsubscribed' }), { status: 200 })
  assert.deepEqual(await interpretMonitoringResponse(noUrl), { kind: 'ok', url: null })
  const garbage = new Response('not json at all', { status: 200 })
  assert.deepEqual(await interpretMonitoringResponse(garbage), { kind: 'ok', url: null })
})

test('404 — неизвестный/просроченный/чужой токен, различимый код not-found', async () => {
  const res = new Response(JSON.stringify({ code: 'not_found' }), { status: 404 })
  assert.deepEqual(await interpretMonitoringResponse(res), { kind: 'error', reason: 'not-found' })
})

test('400 — bad-request (токена нет/битый); всё прочее не-ok — server', async () => {
  assert.deepEqual(await interpretMonitoringResponse(new Response('{}', { status: 400 })), {
    kind: 'error',
    reason: 'bad-request',
  })
  for (const status of [500, 502, 503]) {
    assert.deepEqual(await interpretMonitoringResponse(new Response('{}', { status })), {
      kind: 'error',
      reason: 'server',
    })
  }
})
