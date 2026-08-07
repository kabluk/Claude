// CN-SCAN-STREAM: модель шагов deploy-потока обязана строиться только из
// реальных состояний контракта GET /api/scan/:id (running|done|error) и не
// выдумывать фаз, которых воркер не отдаёт. Тест фиксирует ИНВАРИАНТЫ:
// ровно 3 шага, их статусы на каждое состояние API, и то, что длительность
// завершённого скана считается по серверным меткам (createdAt/completedAt),
// а не по часам клиента.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatElapsed, scanStreamSteps } from './scanStream.ts'

const base = {
  id: 'x',
  url: 'https://example.com',
  pages: [],
  findings: [],
  score: null,
  error: null,
  errorCode: null,
  createdAt: '2026-08-07T10:00:00.000Z',
  completedAt: null,
}

const f = (ruleId) => ({ ruleId, impact: 'serious', wcag: [], selector: 'x', page: 'p' })

test('running: requested done, scanning active, report pending — и ни одного выдуманного шага', () => {
  const steps = scanStreamSteps({ ...base, status: 'running' })
  assert.deepEqual(
    steps.map((s) => [s.id, s.status]),
    [
      ['requested', 'done'],
      ['scanning', 'active'],
      ['report', 'pending'],
    ],
  )
  // Гранулярности по фазам у API нет — шаг обязан говорить об этом честно,
  // а не притворяться живым счётчиком страниц.
  assert.match(steps[1].detail, /progress is not reported/i)
})

test('done: все шаги done, report показывает реальные счётчики, длительность — по серверным меткам', () => {
  const steps = scanStreamSteps({
    ...base,
    status: 'done',
    pages: ['a', 'b', 'c'],
    findings: [f('color-contrast'), f('image-alt')],
    score: 87,
    completedAt: '2026-08-07T10:00:42.000Z',
  })
  assert.deepEqual(
    steps.map((s) => s.status),
    ['done', 'done', 'done'],
  )
  assert.match(steps[1].detail, /42s/)
  assert.match(steps[2].detail, /3 pages scanned, 2 issue instances/)
})

test('error: scanning failed, report failed, без дублирования текста ошибки', () => {
  const steps = scanStreamSteps({ ...base, status: 'error', error: 'boom', errorCode: 'timeout', completedAt: '2026-08-07T10:01:00.000Z' })
  assert.deepEqual(
    steps.map((s) => s.status),
    ['done', 'failed', 'failed'],
  )
})

test('formatElapsed: секунды, минуты с ведущим нулём, отрицательное прижимается к нулю', () => {
  assert.equal(formatElapsed(0), '0s')
  assert.equal(formatElapsed(-5000), '0s') // рассинхрон часов — не мусор на экране
  assert.equal(formatElapsed(59_999), '59s')
  assert.equal(formatElapsed(60_000), '1m 00s')
  assert.equal(formatElapsed(125_000), '2m 05s')
})
