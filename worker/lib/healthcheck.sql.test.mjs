// R-HEALTH-CRON (D-188): loadHealthState/saveHealthState прогнаны на НАСТОЯЩЕМ
// SQLite и НАСТОЯЩИХ миграциях (включая новую 0012_health_check_state.sql),
// не на фейковом D1 — тот же приём и то же обоснование, что
// subscriptionCron.sql.test.mjs (один автор SQL и его "исполнителя" делает
// самопроверку фейком бессмысленной; здесь особенно важно для CHECK(id = 1) —
// ограничение живёт в реальном движке, фейк его просто не знает).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadHealthState, saveHealthState } from './healthcheck.js'

let DatabaseSync = null
try {
  ({ DatabaseSync } = await import('node:sqlite'))
} catch {
  /* Node без node:sqlite — тесты ниже скипаются */
}

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations/', import.meta.url))
const skip = DatabaseSync ? false : 'node:sqlite is not available in this Node build'

function realDb() {
  const db = new DatabaseSync(':memory:')
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(MIGRATIONS_DIR + file, 'utf8'))
  }
  return {
    raw: db,
    row: () => db.prepare('SELECT * FROM health_check_state WHERE id = 1').get(),
    prepare(sql) {
      // Реальный D1 разрешает звать .first()/.run() прямо на prepare(), без
      // .bind(), когда у запроса нет плейсхолдеров (loadHealthState — как раз
      // такой запрос, `WHERE id = 1` литерал). bind(...args) ниже — тот же
      // объект с уже применёнными параметрами для запросов, у которых они есть.
      const withArgs = (...args) => ({
        async run() {
          return { meta: { changes: db.prepare(sql).run(...args).changes } }
        },
        async first() {
          return db.prepare(sql).get(...args) ?? null
        },
      })
      return {
        ...withArgs(),
        bind(...args) {
          return withArgs(...args)
        },
      }
    },
  }
}

test('real SQLite: loadHealthState on an empty table returns null (no baked-in seed row)', { skip }, async () => {
  const db = realDb()
  assert.equal(await loadHealthState(db), null)
  assert.equal(db.row(), undefined)
})

test('real SQLite: saveHealthState creates the singleton row, loadHealthState reads it back byte for byte', { skip }, async () => {
  const db = realDb()
  await saveHealthState(db, {
    status: 'down',
    alertedStatus: 'down',
    failures: [{ name: 'database', detail: 'query failed: timeout' }],
    now: '2026-08-22T03:00:00.000Z',
    lastAlertSentAt: '2026-08-22T03:00:01.000Z',
  })

  const state = await loadHealthState(db)
  assert.deepEqual(state, {
    status: 'down',
    alertedStatus: 'down',
    updatedAt: '2026-08-22T03:00:00.000Z',
    lastAlertSentAt: '2026-08-22T03:00:01.000Z',
  })
  assert.equal(db.row().last_failures_json, JSON.stringify([{ name: 'database', detail: 'query failed: timeout' }]))
})

test('real SQLite: a second saveHealthState UPSERTs the same singleton row, never inserts a second one', { skip }, async () => {
  const db = realDb()
  await saveHealthState(db, { status: 'ok', alertedStatus: 'ok', failures: [], now: '2026-08-20T03:00:00.000Z', lastAlertSentAt: null })
  await saveHealthState(db, { status: 'down', alertedStatus: null, failures: [{ name: 'home_page', detail: 'HTTP 500' }], now: '2026-08-21T03:00:00.000Z', lastAlertSentAt: null })

  const count = db.raw.prepare('SELECT COUNT(*) AS n FROM health_check_state').get().n
  assert.equal(count, 1, 'CHECK(id = 1) must keep this a true singleton across repeated ticks')

  const state = await loadHealthState(db)
  assert.equal(state.status, 'down')
  assert.equal(state.updatedAt, '2026-08-21T03:00:00.000Z', 'the row reflects the LATEST tick')
})

test('real SQLite: a second physical row with a different id is rejected by CHECK(id = 1), proving the singleton constraint is real', { skip }, async () => {
  const db = realDb()
  assert.throws(() => {
    db.raw.prepare('INSERT INTO health_check_state (id, status, updated_at) VALUES (2, ?, ?)').run('ok', '2026-08-22T03:00:00.000Z')
  }, /CHECK/)
})

test('real SQLite: alertedStatus/lastAlertSentAt persist as NULL, not the string "null"', { skip }, async () => {
  const db = realDb()
  await saveHealthState(db, { status: 'ok', alertedStatus: null, failures: [], now: '2026-08-22T03:00:00.000Z', lastAlertSentAt: null })
  assert.equal(db.row().alerted_status, null)
  assert.equal(db.row().last_alert_sent_at, null)
  assert.equal((await loadHealthState(db)).alertedStatus, null)
})
