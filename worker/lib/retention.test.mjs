import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deleteExpiredScans, cutoffIso, RETENTION_DAYS } from './retention.js'

const DAY_MS = 24 * 60 * 60 * 1000

// Мини-D1: только DELETE ... WHERE created_at < ? нужен этому модулю.
function fakeDb(rows) {
  return {
    prepare(sql) {
      return {
        bind(cutoff) {
          return {
            async run() {
              const before = rows.length
              for (let i = rows.length - 1; i >= 0; i--) {
                if (rows[i].created_at < cutoff) rows.splice(i, 1)
              }
              return { meta: { changes: before - rows.length } }
            },
          }
        },
      }
    },
  }
}

test('cutoffIso subtracts RETENTION_DAYS days from now', () => {
  const now = new Date('2026-08-06T12:00:00.000Z')
  assert.equal(cutoffIso(now), new Date(now.getTime() - RETENTION_DAYS * DAY_MS).toISOString())
})

test('deletes only scans older than the retention window', async () => {
  const now = new Date('2026-08-06T00:00:00.000Z')
  const old = new Date(now.getTime() - (RETENTION_DAYS + 1) * DAY_MS).toISOString()
  const recent = new Date(now.getTime() - (RETENTION_DAYS - 1) * DAY_MS).toISOString()
  const rows = [
    { id: 'old', created_at: old },
    { id: 'recent', created_at: recent },
  ]
  const result = await deleteExpiredScans(fakeDb(rows), now)
  assert.equal(result.deleted, 1)
  assert.deepEqual(rows.map((r) => r.id), ['recent'])
})

test('a scan exactly at the cutoff is kept (strict "<", not "<=")', async () => {
  const now = new Date('2026-08-06T00:00:00.000Z')
  const cutoff = cutoffIso(now)
  const rows = [{ id: 'boundary', created_at: cutoff }]
  const result = await deleteExpiredScans(fakeDb(rows), now)
  assert.equal(result.deleted, 0)
  assert.equal(rows.length, 1)
})

test('empty table: nothing to delete, no throw', async () => {
  const rows = []
  const result = await deleteExpiredScans(fakeDb(rows), new Date('2026-08-06T00:00:00.000Z'))
  assert.equal(result.deleted, 0)
})

test('multiple expired scans are all deleted in one pass', async () => {
  const now = new Date('2026-08-06T00:00:00.000Z')
  const veryOld = new Date(now.getTime() - 200 * DAY_MS).toISOString()
  const rows = [
    { id: 'a', created_at: veryOld },
    { id: 'b', created_at: veryOld },
    { id: 'c', created_at: veryOld },
  ]
  const result = await deleteExpiredScans(fakeDb(rows), now)
  assert.equal(result.deleted, 3)
  assert.equal(rows.length, 0)
})
