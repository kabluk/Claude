// CN-RESEARCH (§23, D-071): gate for the report aggregator.
//
// The report's whole claim to honesty is that every number is computed from
// data/a11y/agencies.json, not typed by hand. This test enforces exactly that:
// it recomputes the stats from the live catalog and asserts the committed
// snapshot data/a11y/reports.json is byte-identical. Hand-edit a figure in the
// snapshot, or let it go stale after agencies.json changes, and this fails with
// a diff — the failure-capable check the graph rules demand (a verify that
// cannot fail proves nothing). Verified negatively while writing: bumping any
// count in reports.json by one turns the equality assertion red.
//
// The internal-consistency assertions below are a second, independent guard:
// they would catch a bug in the aggregator itself that the snapshot comparison
// (which trusts the aggregator) cannot.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { computeStats, serialize } from './reports-data.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

const agencies = JSON.parse(read('data/a11y/agencies.json'))
const taxonomies = JSON.parse(read('data/a11y/taxonomies.json'))
const fresh = computeStats(agencies, taxonomies)
const committed = read('data/a11y/reports.json')

test('the committed snapshot matches a fresh recompute — no drift, no hand-edited numbers', () => {
  assert.equal(serialize(fresh), committed, 'data/a11y/reports.json устарел или правлен руками — перегенерируй: node scripts/reports-data.mjs')
})

test('the totals are internally consistent, not just self-agreeing', () => {
  assert.equal(fresh.total, agencies.length, 'total ≠ числу агентств')

  const hqSum = fresh.hqCountries.distribution.reduce((s, r) => s + r.count, 0)
  assert.equal(hqSum, fresh.total, 'сумма по HQ-странам ≠ total (каждое агентство имеет ровно один HQ)')
  assert.equal(fresh.hqCountries.count, fresh.hqCountries.distribution.length, 'count ≠ длине распределения')

  assert.equal(fresh.priceBands.withBand + fresh.priceBands.withoutBand, fresh.total, 'withBand + withoutBand ≠ total')
  const bandSum = Object.values(fresh.priceBands.distribution).reduce((s, n) => s + n, 0)
  assert.equal(bandSum, fresh.priceBands.withBand, 'сумма распределения ценовых полос ≠ withBand')

  assert.equal(fresh.founded.withYear + fresh.founded.withoutYear, fresh.total, 'founded withYear + withoutYear ≠ total')
})

test('the evidence figures reconcile with each other', () => {
  const declSum = Object.values(fresh.evidence.namedAuditorByDeclarant).reduce((s, n) => s + n, 0)
  // Each named-auditor record carries exactly one such cert in the current data,
  // so the declarant breakdown and the statement-cert count must agree.
  assert.equal(declSum, fresh.evidence.certKinds['statement-named-auditor'], 'сумма по декларантам ≠ числу statement-сертификатов')
  assert.ok(
    fresh.evidence.recordsWithNamedAuditorStatement <= fresh.evidence.recordsWithAnyCert,
    'записей с декларацией-аудитором не может быть больше, чем записей с любым сертификатом',
  )
  assert.ok(
    fresh.evidence.recordsWithAnyCert <= fresh.total,
    'записей с сертификатом не может быть больше общего числа',
  )
})

test('the schema invariant holds: every record carries at least one source', () => {
  // If this is ever false, agencies.json violates its own contract (sourceRefs
  // ≥ 1) — the report must not claim it otherwise.
  assert.equal(fresh.sources.everyRecordHasAtLeastOne, true, 'найдена запись без sourceRefs — нарушен инвариант схемы')
  assert.ok(fresh.sources.minPerRecord >= 1, 'minPerRecord < 1')
})
