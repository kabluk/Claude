// CN-RESEARCH-EN301549-AUTOMATION: gate for the second report's aggregator.
//
// Same discipline as scripts/reports-data.test.mjs (which this file must NOT
// touch — it gates the first report). This test recomputes the stats from the
// live data/a11y/en301549-coverage.json and asserts the committed snapshot
// data/a11y/en301549-report.json is byte-identical, then checks internal
// consistency the snapshot comparison alone cannot: sums across status and
// across WCAG principles must reconcile with the total.
//
// Verified negatively while writing: temporarily editing a single count in the
// committed snapshot (e.g. bumping `total` or `byStatus.axe` by one) turns the
// equality assertion red with an exact diff; reverting turns it green again.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { computeStats, serialize } from './en301549-report-data.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

const coverageData = JSON.parse(read('data/a11y/en301549-coverage.json'))
const fresh = computeStats(coverageData)
const committed = read('data/a11y/en301549-report.json')

test('the committed snapshot matches a fresh recompute — no drift, no hand-edited numbers', () => {
  assert.equal(
    serialize(fresh),
    committed,
    'data/a11y/en301549-report.json устарел или правлен руками — перегенерируй: node scripts/en301549-report-data.mjs',
  )
})

test('total and per-status counts are internally consistent', () => {
  assert.equal(fresh.total, coverageData.rows.length, 'total ≠ числу строк en301549-coverage.json')

  const statusSum = Object.values(fresh.byStatus).reduce((s, n) => s + n, 0)
  assert.equal(statusSum, fresh.total, 'сумма по статусам (axe/ours/both/none) ≠ total')

  assert.equal(
    fresh.automated.count,
    fresh.byStatus.axe + fresh.byStatus.ours + fresh.byStatus.both,
    'automated.count ≠ axe+ours+both',
  )
  assert.equal(fresh.manualOnly.count, fresh.byStatus.none, 'manualOnly.count ≠ byStatus.none')
  assert.equal(fresh.automated.count + fresh.manualOnly.count, fresh.total, 'automated + manualOnly ≠ total')
})

test('the four WCAG principle groups partition all 50 criteria exactly once', () => {
  const principleSum = fresh.principles.reduce((s, p) => s + p.total, 0)
  assert.equal(principleSum, fresh.total, 'сумма критериев по принципам ≠ total (каждый критерий должен попасть ровно в одну группу)')

  assert.equal(fresh.principles.length, 4, 'должно быть ровно 4 принципа WCAG (P/O/U/R)')
  assert.deepEqual(
    fresh.principles.map((p) => p.key),
    ['1', '2', '3', '4'],
    'принципы должны быть в порядке 1..4',
  )

  for (const p of fresh.principles) {
    const pStatusSum = Object.values(p.byStatus).reduce((s, n) => s + n, 0)
    assert.equal(pStatusSum, p.total, `сумма по статусам внутри принципа ${p.title} ≠ его total`)
    assert.equal(
      p.automated,
      p.byStatus.axe + p.byStatus.ours + p.byStatus.both,
      `automated ≠ axe+ours+both внутри принципа ${p.title}`,
    )
  }

  // Every row's WCAG number must start with one of the four known principle
  // digits — otherwise a row would silently vanish from the partition above
  // instead of failing loudly.
  for (const r of coverageData.rows) {
    assert.ok(['1', '2', '3', '4'].includes(r.wcag.split('.')[0]), `критерий ${r.wcag} не попадает ни в один из 4 принципов WCAG`)
  }
})

test('manualCriteria lists exactly the status=none rows, and ownModules exactly the rows with a non-null ours', () => {
  assert.equal(fresh.manualCriteria.length, fresh.byStatus.none, 'длина manualCriteria ≠ числу критериев со статусом none')
  assert.ok(
    fresh.manualCriteria.every((r) => coverageData.rows.some((row) => row.wcag === r.wcag && row.status === 'none')),
    'manualCriteria содержит критерий, который не является status=none в источнике',
  )

  const expectedOwnModules = coverageData.rows.filter((r) => r.ours).length
  assert.equal(fresh.ownModules.length, expectedOwnModules, 'длина ownModules ≠ числу строк с непустым ours')
  assert.ok(
    fresh.ownModules.every((r) => r.ours && (r.status === 'ours' || r.status === 'both')),
    'ownModules содержит запись без ours или с недопустимым статусом',
  )
})
