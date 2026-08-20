// R-STALE-DATA: gate for the stale-data report.
//
// Per D-040, tests run against the REAL data shape: the live
// data/a11y/agencies.json is loaded and fed to computeStaleReport unchanged,
// with only the clock (`now`) controlled — that is the parameter the pure
// function exists to expose. The canary cases below plant a lastVerified in
// the distant past / an invalid value on top of a real record and assert the
// report catches them.
//
// Verified negatively while writing: flipping the threshold comparison in
// computeStaleReport from `>` to `<` turns the boundary tests red.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { computeStaleReport, parseIsoDate, DEFAULT_THRESHOLD_DAYS } from './stale-data-report.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const agencies = JSON.parse(readFileSync(join(ROOT, 'data', 'a11y', 'agencies.json'), 'utf8'))

// A fixed clock: "today" as of writing the node. Tests never call Date.now().
const NOW = new Date('2026-08-20T12:00:00Z')

test('real catalog: every record has a parseable ISO lastVerified (no invalid rows)', () => {
  const report = computeStaleReport(agencies, { now: NOW })
  assert.equal(report.total, agencies.length)
  assert.deepEqual(
    report.invalid,
    [],
    'agencies.json содержит записи с нечитаемым lastVerified — это дефект данных',
  )
})

test('real catalog today: nothing exceeds 180 days (freshest data is Aug 2026)', () => {
  // This documents the current state; when it eventually goes red with the
  // real clock advancing, that is the report doing its job — the fixed NOW
  // here keeps the test deterministic regardless.
  const report = computeStaleReport(agencies, { now: NOW })
  assert.deepEqual(report.stale, [])
  assert.equal(report.thresholdDays, DEFAULT_THRESHOLD_DAYS)
})

test('canary: a real record with lastVerified pushed into the distant past lands in the report', () => {
  const doctored = agencies.map((a, i) =>
    i === 0 ? { ...a, lastVerified: '2020-01-01' } : a,
  )
  const report = computeStaleReport(doctored, { now: NOW })
  assert.equal(report.stale.length, 1)
  assert.equal(report.stale[0].slug, agencies[0].slug)
  assert.equal(report.stale[0].lastVerified, '2020-01-01')
  assert.ok(report.stale[0].daysSince > 2000, `daysSince=${report.stale[0].daysSince}`)
})

test('boundary: exactly threshold days is fresh, threshold+1 is stale (spec says "> 180")', () => {
  const base = agencies[0]
  const mk = (lastVerified) => [{ ...base, lastVerified }]
  // NOW is 2026-08-20; 180 days earlier is 2026-02-21.
  const atThreshold = computeStaleReport(mk('2026-02-21'), { now: NOW })
  assert.deepEqual(atThreshold.stale, [], '180 days exactly must NOT be stale (strict >)')
  const overThreshold = computeStaleReport(mk('2026-02-20'), { now: NOW })
  assert.equal(overThreshold.stale.length, 1, '181 days must be stale')
  assert.equal(overThreshold.stale[0].daysSince, 181)
})

test('stale list is sorted oldest-first', () => {
  const doctored = [
    { ...agencies[0], slug: 'aaa-newer', lastVerified: '2025-06-01' },
    { ...agencies[1], slug: 'bbb-oldest', lastVerified: '2020-01-01' },
    { ...agencies[2], slug: 'ccc-middle', lastVerified: '2023-01-01' },
  ]
  const report = computeStaleReport(doctored, { now: NOW })
  assert.deepEqual(
    report.stale.map((r) => r.slug),
    ['bbb-oldest', 'ccc-middle', 'aaa-newer'],
  )
})

test('invalid lastVerified values are reported separately, never counted stale', () => {
  const doctored = [
    { ...agencies[0], lastVerified: 'not-a-date' },
    { ...agencies[1], lastVerified: '2026-02-31' }, // rolls over in naive Date parsing
    { ...agencies[2], lastVerified: undefined },
  ]
  const report = computeStaleReport(doctored, { now: NOW })
  assert.deepEqual(report.stale, [])
  assert.equal(report.invalid.length, 3)
  const values = report.invalid.map((r) => r.lastVerified)
  assert.ok(values.includes('not-a-date'))
  assert.ok(values.includes('2026-02-31'))
  assert.ok(values.includes(null)) // undefined normalized to null
})

test('custom threshold via thresholdDays option', () => {
  // Freshest real data is 2026-08-13 (7 days before NOW): with --days 5 the
  // whole catalog is stale, with --days 30 none of it is.
  const tight = computeStaleReport(agencies, { now: NOW, thresholdDays: 5 })
  assert.equal(tight.stale.length, agencies.length)
  const loose = computeStaleReport(agencies, { now: NOW, thresholdDays: 30 })
  assert.deepEqual(loose.stale, [])
})

test('parseIsoDate: strict calendar dates only', () => {
  assert.notEqual(parseIsoDate('2026-08-20'), null)
  assert.equal(parseIsoDate('2026'), null)
  assert.equal(parseIsoDate('2026-8-20'), null)
  assert.equal(parseIsoDate('2026-13-01'), null)
  assert.equal(parseIsoDate('2026-02-30'), null)
  assert.equal(parseIsoDate(''), null)
  assert.equal(parseIsoDate(20260820), null)
})

test('computeStaleReport rejects a missing or invalid clock', () => {
  assert.throws(() => computeStaleReport(agencies, {}), TypeError)
  assert.throws(() => computeStaleReport(agencies, { now: new Date('nope') }), TypeError)
})
