// CN-SCAN-PHASES (D-067): репортер прогресса — фазы валидируются, порядок
// записей сохраняется, ошибка записи в D1 не роняет скан (best-effort).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SCAN_PHASES, makeProgressReporter } from './progress.js'

function captureDb({ failOnRun = false } = {}) {
  const writes = []
  return {
    writes,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (failOnRun) throw new Error('D1 down')
              writes.push({ sql, args })
              return { meta: { changes: 1 } }
            },
          }
        },
      }
    },
  }
}

test('reporter writes phases in call order with counters', async () => {
  const db = captureDb()
  const report = makeProgressReporter(db, 'scan-1')
  await report('discovering', 0, null)
  await report('statement', 0, 6)
  await report('axe', 0, 6)
  await report('dom-checks', 0, 6)
  await report('axe', 1, 6)
  await report('aggregating', 6, 6)

  const phases = db.writes.map((w) => JSON.parse(w.args[0]).phase)
  assert.deepEqual(phases, ['discovering', 'statement', 'axe', 'dom-checks', 'axe', 'aggregating'])
  const last = JSON.parse(db.writes.at(-1).args[0])
  assert.equal(last.pagesDone, 6)
  assert.equal(last.pagesTotal, 6)
  // все записи адресованы этому скану и защищены гейтом running
  for (const w of db.writes) {
    assert.equal(w.args[1], 'scan-1')
    assert.match(w.sql, /status = 'running'/)
  }
})

test('unknown phase is a programmer error and throws before touching D1', async () => {
  const db = captureDb()
  const report = makeProgressReporter(db, 'scan-2')
  await assert.rejects(() => report('fantasy-phase', 0, 6), /unknown scan phase/)
  assert.equal(db.writes.length, 0)
})

test('a failing D1 write is swallowed — the scan must not die for telemetry', async () => {
  const report = makeProgressReporter(captureDb({ failOnRun: true }), 'scan-3')
  await assert.doesNotReject(() => report('axe', 1, 6))
})

test('SCAN_PHASES matches the emission points in axe.js — no phantom or missing phases', () => {
  // Источник эмиссии — worker/lib/axe.js; если фаза добавится/уйдёт там,
  // этот тест требует синхронизировать контракт (SCAN_PHASES + INTERFACES.md §3).
  assert.deepEqual(SCAN_PHASES, ['discovering', 'statement', 'axe', 'dom-checks', 'aggregating'])
  const axeSrc = new URL('./axe.js', import.meta.url)
  return import('node:fs/promises').then(async (fs) => {
    const src = await fs.readFile(axeSrc, 'utf8')
    const emitted = [...src.matchAll(/onProgress\('([a-z-]+)'/g)].map((m) => m[1])
    for (const phase of new Set(emitted)) {
      assert.ok(SCAN_PHASES.includes(phase), `axe.js эмитит фазу вне контракта: ${phase}`)
    }
    for (const phase of SCAN_PHASES) {
      assert.ok(emitted.includes(phase), `фаза контракта не эмитится в axe.js: ${phase}`)
    }
  })
})
