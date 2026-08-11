// A3-CRON-RESCAN-DELTA: то, что НЕ проверяется движком SQLite —
// арифметика cadence, поведение без биндингов, и два гейта против молчаливого
// дрейфа (cadence в схеме/роуте, retention в scheduled).
// Семантика самой выборки живёт в subscriptionCron.sql.test.mjs, на настоящем
// SQLite и настоящих миграциях — здесь она намеренно НЕ дублируется фейком.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  cadenceCutoffIso,
  runSubscriptionRescans,
  SUPPORTED_CADENCES,
  DEFAULT_CADENCE,
  MAX_RESCANS_PER_TICK,
} from './subscriptionCron.js'
import worker from '../index.js'

const DAY_MS = 24 * 60 * 60 * 1000
const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

test('cadenceCutoffIso: weekly cutoff is exactly 7 days before now', () => {
  const now = new Date('2026-08-11T03:00:00.000Z')
  assert.equal(cadenceCutoffIso(now), '2026-08-04T03:00:00.000Z')
  assert.equal(cadenceCutoffIso(now), new Date(now.getTime() - 7 * DAY_MS).toISOString())
})

test('cadenceCutoffIso: an unknown cadence falls back to the default (less often, never more often)', () => {
  const now = new Date('2026-08-11T03:00:00.000Z')
  assert.equal(cadenceCutoffIso(now, 'hourly'), cadenceCutoffIso(now, DEFAULT_CADENCE))
  assert.equal(cadenceCutoffIso(now, undefined), cadenceCutoffIso(now, DEFAULT_CADENCE))
  assert.ok(SUPPORTED_CADENCES[DEFAULT_CADENCE] >= 7, 'the fallback must not scan more often than weekly')
})

// ГЕЙТ ПРОТИВ ДРЕЙФА (тот же приём, что MAX_DELIVERIES vs wrangler.jsonc в
// scanJob.test.mjs): один cutoff на всю выборку корректен ровно до тех пор, пока
// значение cadence ровно одно. Как только в схему или в роут подписки попадёт
// второе значение, этот тест покраснеет и заставит переделать запрос, а не даст
// подписке молча сканироваться не с той периодичностью.
// Значение, которое реально пишется в колонку cadence при INSERT в
// worker/routes/subscribe.js. Разбирается СТРУКТУРНО (позиция колонки в списке →
// тот же индекс в VALUES), а не регуляркой «cadence.*'(\w+)'»: наивная регулярка
// ловит слово `cadence` из СОСЕДНЕГО комментария и остаётся зелёной, даже когда
// сам INSERT уже пишет другое значение (проверено на этом файле — литерал в
// VALUES стоит на другой строке, чем имя колонки).
function cadenceLiteralWrittenBySubscribeRoute(source) {
  const stmt = source.slice(source.indexOf('INSERT INTO subscriptions'))
  const columns = stmt.match(/INSERT INTO subscriptions \(([^)]*)\)/)?.[1]
  const values = stmt.match(/VALUES \(([^)]*)\)/)?.[1]
  assert.ok(columns && values, 'INSERT INTO subscriptions must be parseable — did the route change shape?')

  const cols = columns.split(',').map((c) => c.trim())
  const vals = values.split(',').map((v) => v.trim())
  assert.equal(cols.length, vals.length, 'column list and VALUES tuple must have the same arity')

  const at = cols.indexOf('cadence')
  assert.ok(at >= 0, 'the INSERT must still name the cadence column explicitly')
  return vals[at].replace(/^'|'$/g, '')
}

// ГЕЙТ ПРОТИВ ДРЕЙФА (тот же приём, что MAX_DELIVERIES vs wrangler.jsonc в
// scanJob.test.mjs): один cutoff на всю выборку корректен ровно до тех пор, пока
// значение cadence ровно одно. Как только в схему или в роут подписки попадёт
// второе значение, этот тест покраснеет и заставит переделать запрос, а не даст
// подписке молча сканироваться не с той периодичностью.
test('gate: weekly is still the only cadence written anywhere (migration default + subscribe.js INSERT)', () => {
  assert.deepEqual(Object.keys(SUPPORTED_CADENCES), ['weekly'])

  const migrationDefault = read('../../migrations/0010_subscriptions.sql')
    .match(/cadence TEXT NOT NULL DEFAULT '(\w+)'/)?.[1]
  assert.ok(
    Object.hasOwn(SUPPORTED_CADENCES, migrationDefault),
    `migration 0010 defaults cadence to '${migrationDefault}', unknown to SUPPORTED_CADENCES`,
  )

  const written = cadenceLiteralWrittenBySubscribeRoute(read('../routes/subscribe.js'))
  assert.ok(
    Object.hasOwn(SUPPORTED_CADENCES, written),
    `subscribe.js writes cadence '${written}', unknown to SUPPORTED_CADENCES — the single-cutoff query in subscriptionCron.js must be reworked before that ships`,
  )
})

test('gate self-check: the cadence gate really fails on a drifted INSERT (not a vacuous loop)', () => {
  const drifted = read('../routes/subscribe.js').replace(
    /VALUES \(\?, \?, \?, \?, 0, 'pending', NULL, 'weekly'/,
    `VALUES (?, ?, ?, ?, 0, 'pending', NULL, 'daily'`,
  )
  assert.equal(cadenceLiteralWrittenBySubscribeRoute(drifted), 'daily')
  assert.equal(Object.hasOwn(SUPPORTED_CADENCES, 'daily'), false)
})

test('no SCAN_QUEUE binding: loud, no throw, nothing enqueued', async () => {
  const summary = await runSubscriptionRescans({ DB: {} })
  assert.equal(summary.error, 'queue_unavailable')
  assert.equal(summary.enqueued, 0)
  assert.deepEqual(summary.pairs, [])
})

test('no DB binding: loud, no throw', async () => {
  const summary = await runSubscriptionRescans({ SCAN_QUEUE: { send: async () => {} } })
  assert.equal(summary.error, 'db_unavailable')
})

test('a failing due-query is reported, not thrown (retention shares this cron tick)', async () => {
  const env = {
    DB: { prepare: () => ({ bind: () => ({ all: async () => { throw new Error('D1 unavailable') } }) }) },
    SCAN_QUEUE: { send: async () => assert.fail('nothing may be enqueued when the query failed') },
  }
  const summary = await runSubscriptionRescans(env)
  assert.equal(summary.error, 'query_failed')
  assert.equal(summary.enqueued, 0)
})

test('MAX_RESCANS_PER_TICK is a sane positive cap (paid Browser Rendering per re-scan)', () => {
  assert.ok(Number.isInteger(MAX_RESCANS_PER_TICK) && MAX_RESCANS_PER_TICK > 0)
})

// ГЕЙТ ПРОТИВ РЕГРЕССИИ RETENTION: ре-скан добавлен В ТОТ ЖЕ обработчик
// scheduled, что и deleteExpiredScans (D-019). Самый дешёвый способ сломать
// retention — заменить его вызов вместо того, чтобы добавить свой рядом.
test('scheduled() runs retention, the re-scan AND the digest on one tick', async () => {
  const seen = { deleteSql: null, dueSql: null, digestSql: null }
  const env = {
    // digest-проход строит ссылки от боевого origin — без него он отказывается
    // рано и до выборки не доходит (см. resolveSiteOrigin), поэтому в тестовом
    // env он задан, иначе гейт «digest бежит на этом тике» был бы вакуумным.
    ALLOWED_ORIGIN: 'https://verscala.com',
    DB: {
      prepare(sql) {
        if (sql.includes('DELETE FROM scans')) seen.deleteSql = sql
        if (sql.includes('last_digest_scan_id')) seen.digestSql = sql
        else if (sql.includes('FROM subscriptions')) seen.dueSql = sql
        return {
          bind: () => ({
            run: async () => ({ meta: { changes: 0 } }),
            all: async () => ({ results: [] }),
          }),
        }
      },
    },
    SCAN_QUEUE: { send: async () => {} },
  }

  const pending = []
  await worker.scheduled({ cron: '0 3 * * *' }, env, { waitUntil: (p) => pending.push(p) })
  assert.equal(pending.length, 3, 'all three tasks must be kept alive by their own waitUntil')
  await Promise.all(pending)

  assert.ok(seen.deleteSql, 'retention (D-019) must still run on the cron tick')
  assert.ok(seen.dueSql, 'the subscription re-scan must run on the same tick')
  assert.ok(seen.digestSql, 'the digest pass (D-137) must run on the same tick')
})

test('scheduled(): a broken re-scan never takes retention down with it', async () => {
  let retentionRan = false
  const env = {
    DB: {
      prepare(sql) {
        if (sql.includes('DELETE FROM scans')) retentionRan = true
        if (sql.includes('FROM subscriptions')) throw new Error('subscriptions table is gone')
        return { bind: () => ({ run: async () => ({ meta: { changes: 0 } }), all: async () => ({ results: [] }) }) }
      },
    },
    SCAN_QUEUE: { send: async () => {} },
  }

  const pending = []
  await worker.scheduled({ cron: '0 3 * * *' }, env, { waitUntil: (p) => pending.push(p) })
  await Promise.all(pending) // не должно отвергнуться
  assert.equal(retentionRan, true)
})
