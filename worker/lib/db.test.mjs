// CN-SCAN-PHASES (D-067): контракт хранения прогресса скана.
// Мини-D1 в памяти по образцу worker/routes/claim.test.mjs::fakeDb — эмулирует
// ровно те SQL-формы, которые пишет db.js, включая гейт `status = 'running'`.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { insertScanPending, updateScanProgress, completeScan, failScan, getScan } from './db.js'

function fakeScansDb(initialRows = []) {
  const rows = [...initialRows]
  const calls = []
  const find = (id) => rows.find((r) => r.id === id)
  return {
    rows,
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              calls.push({ sql, args })
              if (/^INSERT INTO scans/.test(sql)) {
                const [id, url, email, created_at] = args
                rows.push({ id, url, status: 'running', email, created_at, progress_json: null,
                  pages_json: null, findings_json: null, score: null, error: null, error_code: null, completed_at: null })
              } else if (/^UPDATE scans SET progress_json = \? WHERE id = \? AND status = 'running'/.test(sql)) {
                const [progress, id] = args
                const row = find(id)
                // гейт из реального SQL: только running-строка принимает прогресс
                if (row && row.status === 'running') row.progress_json = progress
              } else if (/^UPDATE scans SET status = 'done'/.test(sql)) {
                const [pages, findings, score, completed, id] = args
                const row = find(id)
                assert.match(sql, /progress_json = NULL/, 'completeScan обязан перезаписывать прогресс')
                Object.assign(row, { status: 'done', pages_json: pages, findings_json: findings, score, completed_at: completed, progress_json: null })
              } else if (/^UPDATE scans SET status = 'error'/.test(sql)) {
                const [error, code, completed, id] = args
                const row = find(id)
                assert.match(sql, /progress_json = NULL/, 'failScan обязан перезаписывать прогресс')
                Object.assign(row, { status: 'error', error, error_code: code, completed_at: completed, progress_json: null })
              }
              return { meta: { changes: 1 } }
            },
            async first() {
              calls.push({ sql, args })
              if (/^SELECT \* FROM scans WHERE id/.test(sql)) return find(args[0]) ?? null
              return null
            },
          }
        },
      }
    },
  }
}

test('progress is written mid-scan and returned by getScan', async () => {
  const db = fakeScansDb()
  await insertScanPending(db, { id: 's1', url: 'https://example.com', createdAt: '2026-08-07T00:00:00Z' })
  await updateScanProgress(db, { id: 's1', phase: 'axe', pagesDone: 2, pagesTotal: 6 })

  const scan = await getScan(db, 's1')
  assert.equal(scan.status, 'running')
  assert.equal(scan.progress.phase, 'axe')
  assert.equal(scan.progress.pagesDone, 2)
  assert.equal(scan.progress.pagesTotal, 6)
  assert.ok(Date.parse(scan.progress.updatedAt), 'updatedAt — валидная серверная метка')
})

test('completeScan overwrites progress with NULL — a finished scan has no progress', async () => {
  const db = fakeScansDb()
  await insertScanPending(db, { id: 's2', url: 'https://example.com', createdAt: '2026-08-07T00:00:00Z' })
  await updateScanProgress(db, { id: 's2', phase: 'aggregating', pagesDone: 6, pagesTotal: 6 })
  await completeScan(db, { id: 's2', pages: ['https://example.com'], findings: [], score: 100 })

  const scan = await getScan(db, 's2')
  assert.equal(scan.status, 'done')
  assert.equal(scan.progress, null)
})

test('failScan also clears progress', async () => {
  const db = fakeScansDb()
  await insertScanPending(db, { id: 's3', url: 'https://example.com', createdAt: '2026-08-07T00:00:00Z' })
  await updateScanProgress(db, { id: 's3', phase: 'discovering', pagesDone: 0, pagesTotal: null })
  await failScan(db, { id: 's3', error: 'boom', errorCode: 'internal' })

  const scan = await getScan(db, 's3')
  assert.equal(scan.status, 'error')
  assert.equal(scan.progress, null)
})

test('a late progress write never revives on a finished scan (WHERE status = running gate)', async () => {
  const db = fakeScansDb()
  await insertScanPending(db, { id: 's4', url: 'https://example.com', createdAt: '2026-08-07T00:00:00Z' })
  await completeScan(db, { id: 's4', pages: [], findings: [], score: null })
  await updateScanProgress(db, { id: 's4', phase: 'axe', pagesDone: 1, pagesTotal: 6 })

  const scan = await getScan(db, 's4')
  assert.equal(scan.progress, null, 'запоздавший прогресс не должен ожить на завершённом скане')
})

test('backward compatibility: rows without the progress column read as progress: null', async () => {
  // Строка «из старой БД»: колонки progress_json нет вовсе (undefined, не null) —
  // ровно то, что вернёт задеплоенный воркер со старой схемой.
  const legacy = { id: 'old1', url: 'https://old.example', status: 'done', pages_json: '[]',
    findings_json: '[]', score: 90, error: null, error_code: null,
    created_at: '2026-08-01T00:00:00Z', completed_at: '2026-08-01T00:01:00Z' }
  const db = fakeScansDb([legacy])
  const scan = await getScan(db, 'old1')
  assert.equal(scan.progress, null)
  assert.equal(scan.score, 90)
})
