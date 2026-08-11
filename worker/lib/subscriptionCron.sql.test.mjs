// A3-CRON-RESCAN-DELTA: прогон cron-выборки по НАСТОЯЩЕМУ SQLite (node:sqlite)
// на НАСТОЯЩИХ миграциях (migrations/*.sql), а не по фейковому D1.
//
// Зачем именно так (прецедент worker/routes/subscribe.sql.test.mjs): если и SQL,
// и его «исполнитель» написаны одним автором, тест зелёный даже когда запрос
// невалиден или гейт в WHERE ничего не гейтит. Здесь запрос исполняет реальный
// движок, а схему читает реальный файл миграции — расхождение ломает тест, а не
// прод. Для cadence это критично: весь смысл узла в том, что вчера сканированная
// подписка сегодня НЕ попадает в выборку, и проверять это подделкой D1 бессмысленно.
//
// node:sqlite экспериментален (Node 22+); если недоступен — файл честно
// скипается целиком, а не притворяется пройденным.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  runSubscriptionRescans,
  selectDueSubscriptions,
  MAX_RESCANS_PER_TICK,
} from './subscriptionCron.js'
import { SCAN_JOB_VERSION } from './scanJob.js'

let DatabaseSync = null
try {
  ({ DatabaseSync } = await import('node:sqlite'))
} catch {
  /* Node без node:sqlite — тесты ниже скипаются */
}

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations/', import.meta.url))
const skip = DatabaseSync ? false : 'node:sqlite is not available in this Node build'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date('2026-08-11T03:00:00.000Z')
const daysAgo = (n, from = NOW) => new Date(from.getTime() - n * DAY_MS).toISOString()

// Шим D1 -> node:sqlite. SQL НЕ трогается строкой: что написано в модуле, то и
// исполняет движок. .all() отдаёт {results}, как настоящий D1.
function realDb() {
  const db = new DatabaseSync(':memory:')
  // ВСЕ миграции по порядку — та же схема, что в проде (scans из 0001 + 0002/
  // 0007/0009 ALTER'ы, subscriptions из 0010).
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(MIGRATIONS_DIR + file, 'utf8'))
  }
  return {
    raw: db,
    subs: () => db.prepare('SELECT * FROM subscriptions ORDER BY id').all(),
    scans: () => db.prepare('SELECT * FROM scans ORDER BY created_at, id').all(),
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
            async all() {
              return { results: db.prepare(sql).all(...args) }
            },
          }
        },
      }
    },
  }
}

function addSubscription(db, { id, url, verified = 1, status = 'active', lastScanId = null, cadence = 'weekly' }) {
  db.raw
    .prepare(
      `INSERT INTO subscriptions (id, email, url, token, verified, status, last_scan_id, cadence, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, `${id}@example.com`, url, `token-${id}`, verified, status, lastScanId, cadence, daysAgo(30))
}

function addScan(db, { id, url, createdAt, status = 'done', completedAt = createdAt }) {
  db.raw
    .prepare(`INSERT INTO scans (id, url, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?)`)
    .run(id, url, status, createdAt, completedAt)
}

// env с очередью-шпионом: запоминает ровно то, что ушло бы в SCAN_QUEUE.
function envWith(db, { sendFails = false } = {}) {
  const sent = []
  return {
    sent,
    DB: db,
    SCAN_QUEUE: {
      async send(message) {
        if (sendFails) throw new Error('queue is down')
        sent.push(message)
      },
    },
  }
}

test('real SQLite: only verified+active subscriptions are due (pending/unverified/unsubscribed are skipped)', { skip }, async () => {
  const db = realDb()
  addSubscription(db, { id: 'active', url: 'https://a.example/' })
  addSubscription(db, { id: 'unverified', url: 'https://b.example/', verified: 0 })
  addSubscription(db, { id: 'pending', url: 'https://c.example/', status: 'pending' })
  addSubscription(db, { id: 'gone', url: 'https://d.example/', status: 'unsubscribed' })
  // Отписавшийся, но верифицированный — самый опасный случай: verified=1 остаётся
  // фактом навсегда (шапка 0010), фильтровать обязан именно status.
  addSubscription(db, { id: 'verified-but-gone', url: 'https://e.example/', verified: 1, status: 'unsubscribed' })

  const due = await selectDueSubscriptions(db, NOW)
  assert.deepEqual(due.map((s) => s.id), ['active'])
})

test('real SQLite: a subscription re-scanned YESTERDAY is not re-scanned today (weekly cadence)', { skip }, async () => {
  const db = realDb()
  addScan(db, { id: 'scan-yesterday', url: 'https://a.example/', createdAt: daysAgo(1) })
  addSubscription(db, { id: 'fresh', url: 'https://a.example/', lastScanId: 'scan-yesterday' })

  assert.deepEqual(await selectDueSubscriptions(db, NOW), [])
})

test('real SQLite: 8 days since the last re-scan makes it due again; 7 days exactly does not (strict "<")', { skip }, async () => {
  const db = realDb()
  addScan(db, { id: 'scan-8d', url: 'https://old.example/', createdAt: daysAgo(8) })
  addSubscription(db, { id: 'old', url: 'https://old.example/', lastScanId: 'scan-8d' })
  addScan(db, { id: 'scan-7d', url: 'https://edge.example/', createdAt: daysAgo(7) })
  addSubscription(db, { id: 'edge', url: 'https://edge.example/', lastScanId: 'scan-7d' })

  const due = await selectDueSubscriptions(db, NOW)
  assert.deepEqual(due.map((s) => s.id), ['old'], 'the row exactly on the cutoff waits one more tick')
})

test('real SQLite: never scanned (last_scan_id NULL) is due immediately — the first tick builds the baseline', { skip }, async () => {
  const db = realDb()
  addSubscription(db, { id: 'brand-new', url: 'https://new.example/' })
  const due = await selectDueSubscriptions(db, NOW)
  assert.deepEqual(due.map((s) => s.id), ['brand-new'])
  assert.equal(due[0].lastScanId, null)
  assert.equal(due[0].lastScanAt, null)
})

test('real SQLite: a last_scan_id pointing at a scan deleted by retention behaves as "never scanned" (LEFT JOIN)', { skip }, async () => {
  const db = realDb()
  addSubscription(db, { id: 'dangling', url: 'https://x.example/', lastScanId: 'deleted-by-retention' })
  const due = await selectDueSubscriptions(db, NOW)
  assert.deepEqual(due.map((s) => s.id), ['dangling'], 'INNER JOIN here would silently stop re-scanning this subscription forever')
})

test('real SQLite: a still-RUNNING re-scan from yesterday blocks today (created_at is the marker, not completed_at)', { skip }, async () => {
  const db = realDb()
  db.raw
    .prepare(`INSERT INTO scans (id, url, status, created_at, completed_at) VALUES (?, ?, 'running', ?, NULL)`)
    .run('scan-running', 'https://slow.example/', daysAgo(1))
  addSubscription(db, { id: 'slow', url: 'https://slow.example/', lastScanId: 'scan-running' })

  assert.deepEqual(await selectDueSubscriptions(db, NOW), [], 'completed_at IS NULL must not read as "never scanned"')
})

test('real SQLite: a FAILED re-scan from yesterday also blocks today (no daily retry storm on a broken site)', { skip }, async () => {
  const db = realDb()
  addScan(db, { id: 'scan-error', url: 'https://broken.example/', createdAt: daysAgo(1), status: 'error' })
  addSubscription(db, { id: 'broken', url: 'https://broken.example/', lastScanId: 'scan-error' })

  assert.deepEqual(await selectDueSubscriptions(db, NOW), [])
})

test('real SQLite: never-scanned rows come first, then the longest-waiting ones; LIMIT caps the tick', { skip }, async () => {
  const db = realDb()
  addScan(db, { id: 'scan-30d', url: 'https://oldest.example/', createdAt: daysAgo(30) })
  addSubscription(db, { id: 'oldest', url: 'https://oldest.example/', lastScanId: 'scan-30d' })
  addScan(db, { id: 'scan-10d', url: 'https://newer.example/', createdAt: daysAgo(10) })
  addSubscription(db, { id: 'newer', url: 'https://newer.example/', lastScanId: 'scan-10d' })
  addSubscription(db, { id: 'never', url: 'https://never.example/' })

  assert.deepEqual((await selectDueSubscriptions(db, NOW)).map((s) => s.id), ['never', 'oldest', 'newer'])
  assert.deepEqual((await selectDueSubscriptions(db, NOW, 2)).map((s) => s.id), ['never', 'oldest'])
})

test('real SQLite: the due query SEARCHes scans by primary key instead of scanning the whole table', { skip }, async () => {
  const db = realDb()
  addSubscription(db, { id: 'any', url: 'https://a.example/' })
  await selectDueSubscriptions(db, NOW)
  const plan = db.raw
    .prepare(`EXPLAIN QUERY PLAN
      SELECT s.id, sc.created_at FROM subscriptions s
      LEFT JOIN scans sc ON sc.id = s.last_scan_id
      WHERE s.verified = 1 AND s.status = 'active' AND (sc.created_at IS NULL OR sc.created_at < ?)`)
    .all('x')
  const detail = plan.map((p) => p.detail).join(' | ')
  assert.match(detail, /SEARCH sc/, `scans must be joined by id, not full-scanned; got: ${detail}`)
})

test('real SQLite, end to end: a due subscription gets a running scan row, a queue job and a fresh last_scan_id', { skip }, async () => {
  const db = realDb()
  addSubscription(db, { id: 'sub-1', url: 'https://site.example/' })
  const env = envWith(db)

  const summary = await runSubscriptionRescans(env, NOW)
  assert.equal(summary.due, 1)
  assert.equal(summary.enqueued, 1)
  assert.equal(summary.failed, 0)

  const [scan] = db.scans()
  assert.equal(scan.url, 'https://site.example/')
  assert.equal(scan.status, 'running')
  assert.equal(scan.created_at, NOW.toISOString())
  assert.equal(scan.email, null, 'the subscriber email must not be copied into every weekly scan row (R6)')

  // Ровно то же сообщение, что кладёт POST /api/scan (buildScanJobMessage).
  assert.deepEqual(env.sent, [{ v: SCAN_JOB_VERSION, id: scan.id, url: 'https://site.example/', countryCode: null }])

  assert.equal(db.subs()[0].last_scan_id, scan.id)
  assert.deepEqual(summary.pairs, [
    { subscriptionId: 'sub-1', email: 'sub-1@example.com', url: 'https://site.example/', previousScanId: null, scanId: scan.id },
  ])
})

test('real SQLite: the second tick on the SAME day enqueues nothing — the cadence gate reads what the first tick wrote', { skip }, async () => {
  const db = realDb()
  addSubscription(db, { id: 'sub-1', url: 'https://site.example/' })
  const env = envWith(db)

  await runSubscriptionRescans(env, NOW)
  const later = new Date(NOW.getTime() + DAY_MS) // следующая ночь
  const second = await runSubscriptionRescans(env, later)

  assert.equal(second.due, 0)
  assert.equal(second.enqueued, 0)
  assert.equal(env.sent.length, 1, 'a second scan of the same URL within the week is paid Browser Rendering for nothing')
  assert.equal(db.scans().length, 1)

  // ...а через 8 дней — снова.
  const nextWeek = new Date(NOW.getTime() + 8 * DAY_MS)
  const third = await runSubscriptionRescans(env, nextWeek)
  assert.equal(third.enqueued, 1)
  assert.equal(env.sent.length, 2)
  assert.equal(third.pairs[0].previousScanId, env.sent[0].id, 'the digest node gets the previous scan id in the pair')
  assert.equal(db.subs()[0].last_scan_id, env.sent[1].id)
})

test('real SQLite: a queue failure closes the orphan scan row and leaves last_scan_id alone (retry next tick)', { skip }, async () => {
  const db = realDb()
  addSubscription(db, { id: 'sub-1', url: 'https://site.example/' })
  const env = envWith(db, { sendFails: true })

  const summary = await runSubscriptionRescans(env, NOW)
  assert.equal(summary.enqueued, 0)
  assert.equal(summary.failed, 1)

  const [scan] = db.scans()
  assert.equal(scan.status, 'error', 'an orphan `running` row would never be reaped: nobody GETs a cron scan')
  assert.equal(scan.error_code, 'internal')
  assert.match(scan.error, /re-scan enqueue failed/)

  assert.equal(db.subs()[0].last_scan_id, null, 'a failed enqueue must not consume the weekly slot')
  assert.equal((await selectDueSubscriptions(db, NOW)).length, 1, 'still due on the next tick')
})

test('real SQLite: one broken subscription does not stop the others in the same tick', { skip }, async () => {
  const db = realDb()
  addSubscription(db, { id: 'sub-ok-1', url: 'https://one.example/' })
  addSubscription(db, { id: 'sub-bad', url: 'https://two.example/' })
  addSubscription(db, { id: 'sub-ok-2', url: 'https://three.example/' })

  const env = envWith(db)
  let calls = 0
  env.SCAN_QUEUE.send = async (message) => {
    calls += 1
    if (calls === 2) throw new Error('transient queue error')
    env.sent.push(message)
  }

  const summary = await runSubscriptionRescans(env, NOW)
  assert.equal(summary.enqueued, 2)
  assert.equal(summary.failed, 1)
  assert.equal(db.subs().filter((s) => s.last_scan_id).length, 2)
})

test('real SQLite: unsupported cadence is still re-scanned weekly (never silently dropped)', { skip }, async () => {
  const db = realDb()
  addSubscription(db, { id: 'daily-sub', url: 'https://d.example/', cadence: 'daily' })
  const env = envWith(db)
  const summary = await runSubscriptionRescans(env, NOW)
  assert.equal(summary.enqueued, 1, 'an unknown cadence must not exclude a paying-attention subscriber from monitoring')
})

test('real SQLite: MAX_RESCANS_PER_TICK caps one tick, the rest are picked up on the next one', { skip }, async () => {
  const db = realDb()
  for (let i = 0; i < MAX_RESCANS_PER_TICK + 3; i++) {
    addSubscription(db, { id: `sub-${String(i).padStart(3, '0')}`, url: `https://s${i}.example/` })
  }
  const env = envWith(db)
  const first = await runSubscriptionRescans(env, NOW)
  assert.equal(first.enqueued, MAX_RESCANS_PER_TICK)

  const second = await runSubscriptionRescans(env, new Date(NOW.getTime() + DAY_MS))
  assert.equal(second.enqueued, 3, 'the leftovers must come first on the next tick, not starve')
})
