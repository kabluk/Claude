// R-HEALTH-CRON (D-188): проверки на fetch-мокe и лёгком in-memory D1 —
// настоящая схема миграции 0012 проверена отдельно, в healthcheck.sql.test.mjs
// (тот же разрыв ответственности, что subscriptionCron.test.mjs /
// subscriptionCron.sql.test.mjs).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runHealthChecks,
  runHealthCheck,
  buildDownAlertEmail,
  buildRecoveredAlertEmail,
} from './healthcheck.js'

const ORIGIN = 'https://verscala.com'
const WORKER_ORIGIN = 'https://accessatlas-worker.zincroom.workers.dev'
const HOME_HTML = '<html><body>Check your website for accessibility issues.</body></html>'
const REPORT_HTML = '<html><head><title>Verscala — scan report</title></head><body></body></html>'

// --- fetch mock -------------------------------------------------------------
// Каждый тест сам решает, какие url на что отвечают; неописанный url — ошибка
// теста, а не тихий 200 (иначе сломанный маршрут молча прошёл бы проверку).
function mockFetch(t, routes) {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    // Самый длинный совпадающий префикс, а не первый: `${ORIGIN}/` иначе
    // перехватывал бы и `${ORIGIN}/report/...` (report — тоже под origin/).
    const key = Object.keys(routes)
      .filter((k) => String(url).startsWith(k))
      .sort((a, b) => b.length - a.length)[0]
    if (!key) throw new Error(`mockFetch: no route configured for ${url}`)
    const r = routes[key]
    if (r.throws) throw new Error(r.throws)
    return new Response(r.body ?? '', { status: r.status ?? 200 })
  }
  t.after(() => {
    globalThis.fetch = original
  })
  return calls
}

const OK_ROUTES = {
  [`${ORIGIN}/`]: { status: 200, body: HOME_HTML },
  [`${WORKER_ORIGIN}/api/scan/`]: { status: 404, body: '{"error":"not found"}' },
  [`${ORIGIN}/report/`]: { status: 200, body: REPORT_HTML },
}

// --- fake D1 ------------------------------------------------------------
// Понимает ровно два запроса, которые здесь исполняются, — «SELECT 1» и
// чтение/запись health_check_state. Любой другой SQL — ошибка теста.
function fakeDb({ dbOk = true, initialState = null } = {}) {
  let state = initialState
  const writes = []
  return {
    prepare(sql) {
      // Реальный D1 разрешает .first()/.run() прямо на prepare() без .bind()
      // для запросов без плейсхолдеров (checkDatabase's `SELECT 1 AS ok`,
      // loadHealthState's `WHERE id = 1` — оба литералы). withArgs() — общая
      // реализация что для этого случая, что для bind(...args) ниже.
      const withArgs = (...args) => ({
        async first() {
          if (sql.includes('SELECT 1 AS ok')) {
            if (!dbOk) throw new Error('simulated D1 outage')
            return { ok: 1 }
          }
          if (sql.includes('FROM health_check_state')) {
            if (!state) return null
            return {
              status: state.status,
              alerted_status: state.alertedStatus,
              updated_at: state.updatedAt,
              last_alert_sent_at: state.lastAlertSentAt,
            }
          }
          throw new Error(`fakeDb.first: unexpected query: ${sql}`)
        },
        async run() {
          if (sql.includes('INSERT INTO health_check_state')) {
            const [status, alertedStatus, now, , lastAlertSentAt] = args
            state = { status, alertedStatus, updatedAt: now, lastAlertSentAt }
            writes.push({ ...state })
            return { meta: { changes: 1 } }
          }
          throw new Error(`fakeDb.run: unexpected query: ${sql}`)
        },
      })
      return {
        ...withArgs(),
        bind(...args) {
          return withArgs(...args)
        },
      }
    },
    state: () => state,
    writes,
  }
}

// --- Resend mock ----------------------------------------------------------
function mockResend(t, { fails = false } = {}) {
  const sent = []
  const original = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('api.resend.com')) {
      if (fails) return new Response('{"message":"down"}', { status: 500 })
      sent.push(JSON.parse(options.body))
      return new Response(JSON.stringify({ id: 'evt_1' }), { status: 200 })
    }
    return original(url, options)
  }
  t.after(() => {
    globalThis.fetch = original
  })
  return sent
}

function envWith(db, overrides = {}) {
  return { ALLOWED_ORIGIN: ORIGIN, WORKER_ORIGIN, DB: db, RESEND_API_KEY: 're_test', ...overrides }
}

// ===========================================================================
// runHealthChecks — что видно ПРЯМО СЕЙЧАС, без состояния/писем.
// ===========================================================================

test('runHealthChecks: all four checks pass -> status ok, no failures', async (t) => {
  mockFetch(t, OK_ROUTES)
  const db = fakeDb()
  const { status, failures } = await runHealthChecks(envWith(db))
  assert.equal(status, 'ok')
  assert.deepEqual(failures, [])
})

test('runHealthChecks: home page missing its marker is a failure, others still run', async (t) => {
  mockFetch(t, { ...OK_ROUTES, [`${ORIGIN}/`]: { status: 200, body: '<html>something else</html>' } })
  const db = fakeDb()
  const { status, failures } = await runHealthChecks(envWith(db))
  assert.equal(status, 'down')
  assert.deepEqual(failures.map((f) => f.name), ['home_page'])
  assert.match(failures[0].detail, /missing marker/)
})

test('runHealthChecks: worker /api/scan/:id answering non-404 is a failure (500 = worker up but broken; 200 = it actually found something)', async (t) => {
  mockFetch(t, { ...OK_ROUTES, [`${WORKER_ORIGIN}/api/scan/`]: { status: 500 } })
  const db = fakeDb()
  const { status, failures } = await runHealthChecks(envWith(db))
  assert.equal(status, 'down')
  assert.deepEqual(failures.map((f) => f.name), ['worker_scan_route'])
})

test('runHealthChecks: a network failure (DNS/timeout/expired token) on the worker route is reported by name, not thrown', async (t) => {
  mockFetch(t, { ...OK_ROUTES, [`${WORKER_ORIGIN}/api/scan/`]: { throws: 'fetch failed' } })
  const db = fakeDb()
  const { status, failures } = await runHealthChecks(envWith(db))
  assert.equal(status, 'down')
  assert.deepEqual(failures.map((f) => f.name), ['worker_scan_route'])
  assert.match(failures[0].detail, /request failed/)
})

test('runHealthChecks: D1 outage is caught as its own named failure, distinct from the worker route', async (t) => {
  mockFetch(t, OK_ROUTES)
  const db = fakeDb({ dbOk: false })
  const { status, failures } = await runHealthChecks(envWith(db))
  assert.equal(status, 'down')
  assert.deepEqual(failures.map((f) => f.name), ['database'])
})

test('runHealthChecks: report shell returning non-200 (functions/report/[[path]].js broken) is a failure independent of the home page', async (t) => {
  mockFetch(t, { ...OK_ROUTES, [`${ORIGIN}/report/`]: { status: 500 } })
  const db = fakeDb()
  const { status, failures } = await runHealthChecks(envWith(db))
  assert.equal(status, 'down')
  assert.deepEqual(failures.map((f) => f.name), ['report_shell'])
})

test('runHealthChecks: missing ALLOWED_ORIGIN fails home_page and report_shell but not the worker-only checks', async (t) => {
  mockFetch(t, OK_ROUTES)
  const db = fakeDb()
  const { status, failures } = await runHealthChecks(envWith(db, { ALLOWED_ORIGIN: undefined }))
  assert.equal(status, 'down')
  assert.deepEqual(failures.map((f) => f.name).sort(), ['home_page', 'report_shell'])
})

// ===========================================================================
// runHealthCheck — переход состояния + подавление повторов (edge-triggered,
// LEARNING_LOG термин дня этого узла).
// ===========================================================================

test('runHealthCheck: first-ever tick, everything healthy -> baseline recorded, no email', async (t) => {
  mockFetch(t, OK_ROUTES)
  const sent = mockResend(t)
  const db = fakeDb()

  const summary = await runHealthCheck(envWith(db), new Date('2026-08-22T03:00:00.000Z'))

  assert.equal(summary.status, 'ok')
  assert.equal(summary.alert, null)
  assert.equal(sent.length, 0)
  assert.equal(db.state().alertedStatus, 'ok')
})

test('runHealthCheck: first-ever tick already broken DOES alert — an outage predating the first check must not be silent', async (t) => {
  mockFetch(t, { ...OK_ROUTES, [`${ORIGIN}/`]: { status: 500 } })
  const sent = mockResend(t)
  const db = fakeDb()

  const summary = await runHealthCheck(envWith(db), new Date('2026-08-22T03:00:00.000Z'))

  assert.equal(summary.status, 'down')
  assert.equal(summary.alert, 'down')
  assert.equal(summary.alertSent, true)
  assert.equal(sent.length, 1)
  assert.deepEqual(sent[0].to, ['info@verscala.com'])
  assert.equal(sent[0].from, 'Verscala <notify@verscala.com>')
  assert.match(sent[0].subject, /FAILED/)
  assert.equal(db.state().alertedStatus, 'down')
})

test('CANARY: good -> bad sends exactly one email even across three consecutive still-broken ticks (no daily spam)', async (t) => {
  const db = fakeDb()
  const day = (n) => new Date(new Date('2026-08-20T03:00:00.000Z').getTime() + n * 86400000)

  // Ночь 1: всё хорошо, baseline.
  mockFetch(t, OK_ROUTES)
  await runHealthCheck(envWith(db), day(0))

  // Ночи 2, 3, 4: главная лежит три тика подряд.
  const routesFail = { ...OK_ROUTES, [`${ORIGIN}/`]: { status: 500 } }
  let sentTotal = 0
  for (let n = 1; n <= 3; n++) {
    mockFetch(t, routesFail)
    const sent = mockResend(t)
    const summary = await runHealthCheck(envWith(db), day(n))
    sentTotal += sent.length
    assert.equal(summary.status, 'down')
    if (n === 1) {
      assert.equal(summary.alert, 'down', 'the FIRST broken tick after healthy must alert')
      assert.equal(sent.length, 1)
    } else {
      assert.equal(summary.alert, null, `tick ${n}, still down, must NOT alert again`)
      assert.equal(sent.length, 0, `tick ${n} must send no email while already-alerted-down`)
    }
  }
  assert.equal(sentTotal, 1, 'exactly one email across the whole four-day outage, not one per tick')

  // Ночь 5: восстановилось -> ровно одно письмо о восстановлении.
  mockFetch(t, OK_ROUTES)
  const recoverySent = mockResend(t)
  const recoverySummary = await runHealthCheck(envWith(db), day(4))
  assert.equal(recoverySummary.alert, 'recovered')
  assert.equal(recoverySent.length, 1)
  assert.match(recoverySent[0].subject, /recovered/)

  // Ночь 6: всё ещё хорошо -> тишина.
  mockFetch(t, OK_ROUTES)
  const quietSent = mockResend(t)
  const quietSummary = await runHealthCheck(envWith(db), day(5))
  assert.equal(quietSummary.alert, null)
  assert.equal(quietSent.length, 0)
})

test('runHealthCheck: a failed alert send (Resend down) does not consume the transition — retried next tick', async (t) => {
  const db = fakeDb()
  mockFetch(t, { ...OK_ROUTES, [`${ORIGIN}/`]: { status: 500 } })
  const failedSend = mockResend(t, { fails: true })

  const first = await runHealthCheck(envWith(db), new Date('2026-08-22T03:00:00.000Z'))
  assert.equal(first.alert, 'down')
  assert.equal(first.alertSent, false)
  assert.equal(failedSend.length, 0)
  assert.equal(db.state().alertedStatus, null, 'unconfirmed send must not advance the idempotency marker')

  mockFetch(t, { ...OK_ROUTES, [`${ORIGIN}/`]: { status: 500 } })
  const retrySend = mockResend(t)
  const second = await runHealthCheck(envWith(db), new Date('2026-08-23T03:00:00.000Z'))
  assert.equal(second.alert, 'down', 'still not confirmed as alerted -> tried again')
  assert.equal(second.alertSent, true)
  assert.equal(retrySend.length, 1)
  assert.equal(db.state().alertedStatus, 'down')
})

test('runHealthCheck: no RESEND_API_KEY does not throw and does not falsely mark the alert as sent', async (t) => {
  mockFetch(t, { ...OK_ROUTES, [`${ORIGIN}/`]: { status: 500 } })
  const db = fakeDb()
  const summary = await runHealthCheck(envWith(db, { RESEND_API_KEY: undefined }), new Date('2026-08-22T03:00:00.000Z'))
  assert.equal(summary.alert, 'down')
  assert.equal(summary.alertSent, false)
  assert.equal(db.state().alertedStatus, null)
})

test('runHealthCheck: no DB binding returns db_unavailable and does not throw', async () => {
  const summary = await runHealthCheck({ ALLOWED_ORIGIN: ORIGIN, WORKER_ORIGIN })
  assert.equal(summary.error, 'db_unavailable')
})

// ===========================================================================
// Email builders — контент, не транспорт.
// ===========================================================================

test('buildDownAlertEmail: lists every failed check by name and names the dead-man-switch caveat', () => {
  const { subject, text } = buildDownAlertEmail({
    failures: [{ name: 'database', detail: 'query failed: timeout' }],
    checkedAt: '2026-08-22T03:00:00.000Z',
  })
  assert.match(subject, /FAILED \(1\/4\)/)
  assert.match(text, /database: query failed: timeout/)
  assert.match(text, /will NOT repeat every night/)
  assert.match(text, /same worker it is checking/, 'the email must be honest about the dead-man-switch gap')
})

test('buildRecoveredAlertEmail: short confirmation, no failure list', () => {
  const { subject, text } = buildRecoveredAlertEmail({ checkedAt: '2026-08-22T04:00:00.000Z' })
  assert.match(subject, /recovered/)
  assert.match(text, /2026-08-22T04:00:00.000Z/)
})
