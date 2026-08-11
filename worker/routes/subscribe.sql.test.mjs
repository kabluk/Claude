// Прогон роутов подписки по НАСТОЯЩЕМУ SQLite (node:sqlite) на НАСТОЯЩЕЙ схеме
// migrations/0010_subscriptions.sql — в дополнение к subscribe.test.mjs, где D1
// подменён заглушкой на регулярках.
//
// Зачем отдельный файл: в subscribe.test.mjs и SQL, и его «исполнитель»
// написаны одним автором и согласованы по построению — такой тест зелёный даже
// если запрос невалиден для SQLite (опечатка в CASE WHEN, неверный порядок
// bind-параметров, гейт в WHERE, который на самом деле ничего не гейтит).
// Здесь SQL исполняет реальный движок, а схему читает реальный файл миграции:
// расхождение между кодом и таблицей ломает тест, а не прод.
//
// D1 — это SQLite поверх Cloudflare Storage; диалект тот же, а API отличается
// (prepare().bind().run()/first()), поэтому ниже тонкий шим над node:sqlite.
// node:sqlite экспериментален и появился в Node 22 — если он недоступен,
// файл честно скипается целиком, а не падает и не притворяется пройденным.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { handlePostSubscribe, handleGetSubscribeVerify, handleUnsubscribe } from './subscribe.js'

let DatabaseSync = null
try {
  ({ DatabaseSync } = await import('node:sqlite'))
} catch {
  /* Node без node:sqlite — тесты ниже скипаются */
}

const SCHEMA_PATH = fileURLToPath(new URL('../../migrations/0010_subscriptions.sql', import.meta.url))
const skip = DatabaseSync ? false : 'node:sqlite is not available in this Node build'

// Шим D1 -> node:sqlite. Намеренно НЕ трогает SQL строкой: что написано в
// роуте, то и исполняется движком.
function realDb() {
  const db = new DatabaseSync(':memory:')
  db.exec(readFileSync(SCHEMA_PATH, 'utf8'))
  return {
    raw: db,
    row: () => db.prepare('SELECT * FROM subscriptions').get() ?? null,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              return { meta: { changes: db.prepare(sql).run(...args).changes } }
            },
            async first() {
              return db.prepare(sql).get(...args) ?? null
            },
          }
        },
      }
    },
  }
}

function env() {
  const store = new Map()
  return {
    DB: realDb(),
    RATE_LIMIT_KV: {
      async get(key) {
        return store.has(key) ? store.get(key) : null
      },
      async put(key, value) {
        store.set(key, value)
      },
    },
  }
}

function post(body = { email: 'real@example.com', url: 'https://example.com' }) {
  return new Request('https://worker.example/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4' },
    body: JSON.stringify(body),
  })
}

const verifyReq = (token) => new Request(`https://worker.example/api/subscribe/verify?token=${token}`)
const unsubReq = (token) => new Request(`https://worker.example/api/subscribe/unsubscribe?token=${token}`)

test('real SQLite: INSERT matches the real 0010_subscriptions.sql column list and defaults', { skip }, async () => {
  const e = env()
  const res = await handlePostSubscribe(post(), e)
  assert.equal(res.status, 201)
  const { subscriptionId } = await res.json()

  const row = e.DB.row()
  assert.equal(row.id, subscriptionId)
  assert.equal(row.status, 'pending')
  assert.equal(row.verified, 0)
  assert.equal(row.cadence, 'weekly')
  assert.equal(row.last_scan_id, null)
  assert.equal(row.unsubscribed_at, null)
  assert.equal(row.email, 'real@example.com')
  assert.equal(row.url, 'https://example.com')
  assert.ok(row.token.length >= 32)
})

test('real SQLite: the token is in the table but never in the POST response (D-023)', { skip }, async () => {
  const e = env()
  const rawBody = await (await handlePostSubscribe(post(), e)).text()
  const { token, id } = e.DB.row()
  assert.ok(token && token.length >= 32, 'a real token was persisted')
  assert.equal(rawBody.includes(token), false, 'token must not appear in the response body')
  assert.equal(rawBody, JSON.stringify({ subscriptionId: id }))
})

test('real SQLite: verify flips verified=1/status=active via the CASE WHEN update', { skip }, async () => {
  const e = env()
  await handlePostSubscribe(post(), e)
  const { token } = e.DB.row()

  const res = await handleGetSubscribeVerify(verifyReq(token), e)
  assert.equal(res.status, 200)
  const row = e.DB.row()
  assert.equal(row.verified, 1)
  assert.equal(row.status, 'active')
})

test('real SQLite: verify with the public id (not the token) finds nothing -> 404, row untouched', { skip }, async () => {
  const e = env()
  const { subscriptionId } = await (await handlePostSubscribe(post(), e)).json()
  assert.equal((await handleGetSubscribeVerify(verifyReq(subscriptionId), e)).status, 404)
  assert.equal(e.DB.row().verified, 0)
})

test('real SQLite: unsubscribe sets status/unsubscribed_at; the repeat is 200 and the WHERE gate keeps the first timestamp', { skip }, async () => {
  const e = env()
  await handlePostSubscribe(post(), e)
  const { token } = e.DB.row()
  await handleGetSubscribeVerify(verifyReq(token), e)

  const first = await handleUnsubscribe(unsubReq(token), e)
  assert.equal(first.status, 200)
  const afterFirst = e.DB.row()
  assert.equal(afterFirst.status, 'unsubscribed')
  assert.ok(!Number.isNaN(Date.parse(afterFirst.unsubscribed_at)))

  const second = await handleUnsubscribe(unsubReq(token), e)
  assert.equal(second.status, 200, 'repeat unsubscribe is not an error')
  assert.equal((await second.json()).alreadyUnsubscribed, true)
  assert.equal(e.DB.row().unsubscribed_at, afterFirst.unsubscribed_at)
})

test('real SQLite: an old verify link does not resurrect an unsubscribed row', { skip }, async () => {
  const e = env()
  await handlePostSubscribe(post(), e)
  const { token } = e.DB.row()
  await handleUnsubscribe(unsubReq(token), e)

  assert.equal((await handleGetSubscribeVerify(verifyReq(token), e)).status, 200)
  const row = e.DB.row()
  assert.equal(row.status, 'unsubscribed')
  assert.equal(row.verified, 1)
})

test('real SQLite: the token lookup uses the index created by the migration (no full scan)', { skip }, async () => {
  const e = env()
  await handlePostSubscribe(post(), e)
  const plan = e.DB.raw
    .prepare('EXPLAIN QUERY PLAN SELECT id, email, url, verified, status FROM subscriptions WHERE token = ?')
    .all('x')
  const detail = plan.map((p) => p.detail).join(' ')
  assert.match(detail, /idx_subscriptions_token/, `verify lookup must hit the token index, got: ${detail}`)
})
