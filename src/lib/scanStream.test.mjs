// CN-SCAN-STREAM: модель шагов deploy-потока обязана строиться только из
// реальных состояний контракта GET /api/scan/:id (running|done|error) и не
// выдумывать фаз, которых воркер не отдаёт. Тест фиксирует ИНВАРИАНТЫ:
// без progress — ровно 3 шага и их статусы на каждое состояние API;
// с progress (CN-SCAN-PHASES, D-067) — реальные фазовые шаги; длительность
// завершённого скана считается по серверным меткам, а не по часам клиента.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatElapsed, scanStreamSteps } from './scanStream.ts'
import { parseScanProgress } from './scanner.ts'

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

// --- CN-SCAN-PHASES (D-067): реальные фазы, когда воркер их отдаёт ---------

const progress = (phase, pagesDone = 0, pagesTotal = 6) => ({ phase, pagesDone, pagesTotal })

test('running + progress: фазовые шаги вместо трёхшагового fallback', () => {
  const steps = scanStreamSteps({ ...base, status: 'running', progress: progress('axe', 2, 6) })
  assert.deepEqual(
    steps.map((s) => [s.id, s.status]),
    [
      ['requested', 'done'],
      ['discovering', 'done'],
      ['statement', 'done'],
      ['pages', 'active'],
      ['aggregating', 'pending'],
      ['report', 'pending'],
    ],
  )
  // Живой счётчик — только из реальных чисел воркера: pagesDone=2 → «page 3 of 6».
  assert.match(steps[3].detail, /axe-core/i)
  assert.match(steps[3].detail, /page 3 of 6/)
})

test('running + progress: dom-checks — тот же видимый шаг pages, другой текст', () => {
  const steps = scanStreamSteps({ ...base, status: 'running', progress: progress('dom-checks', 0, 4) })
  assert.equal(steps[3].status, 'active')
  assert.match(steps[3].detail, /browser checks/i)
  assert.match(steps[3].detail, /page 1 of 4/)
})

test('running + progress: discovering и aggregating дают правильные статусы краёв', () => {
  const early = scanStreamSteps({ ...base, status: 'running', progress: { phase: 'discovering', pagesDone: 0, pagesTotal: null } })
  assert.deepEqual(early.map((s) => s.status), ['done', 'active', 'pending', 'pending', 'pending', 'pending'])

  const late = scanStreamSteps({ ...base, status: 'running', progress: progress('aggregating', 6, 6) })
  assert.deepEqual(late.map((s) => s.status), ['done', 'done', 'done', 'done', 'active', 'pending'])
})

test('done/error игнорируют progress: итог всегда трёхшаговый, даже с устаревшим полем', () => {
  const done = scanStreamSteps({
    ...base, status: 'done', pages: ['a'], findings: [], score: 100,
    completedAt: '2026-08-07T10:00:10.000Z', progress: progress('axe', 1, 6),
  })
  assert.equal(done.length, 3)
  const err = scanStreamSteps({ ...base, status: 'error', errorCode: 'timeout', progress: progress('statement') })
  assert.equal(err.length, 3)
})

test('running без progress (старый задеплоенный воркер): прежний трёхшаговый поток D-064', () => {
  const steps = scanStreamSteps({ ...base, status: 'running', progress: null })
  assert.equal(steps.length, 3)
  assert.equal(steps[1].id, 'scanning')
})

test('parseScanProgress: контрактная форма проходит, чужие формы дают null, счётчики чистятся поштучно', () => {
  assert.deepEqual(parseScanProgress({ phase: 'axe', pagesDone: 2, pagesTotal: 6, updatedAt: 't' }), {
    phase: 'axe', pagesDone: 2, pagesTotal: 6, updatedAt: 't',
  })
  // отсутствие/мусор/неизвестная фаза (в т.ч. от более нового воркера) → null → честный fallback
  assert.equal(parseScanProgress(undefined), null)
  assert.equal(parseScanProgress(null), null)
  assert.equal(parseScanProgress('axe'), null)
  assert.equal(parseScanProgress({ phase: 'quantum-phase', pagesDone: 1, pagesTotal: 6 }), null)
  // счётчики вне смысла обнуляются по одному, фаза живёт
  const dirty = parseScanProgress({ phase: 'dom-checks', pagesDone: -1, pagesTotal: 2.5 })
  assert.deepEqual(dirty, { phase: 'dom-checks', pagesDone: null, pagesTotal: null, updatedAt: undefined })
})

test('formatElapsed: секунды, минуты с ведущим нулём, отрицательное прижимается к нулю', () => {
  assert.equal(formatElapsed(0), '0s')
  assert.equal(formatElapsed(-5000), '0s') // рассинхрон часов — не мусор на экране
  assert.equal(formatElapsed(59_999), '59s')
  assert.equal(formatElapsed(60_000), '1m 00s')
  assert.equal(formatElapsed(125_000), '2m 05s')
})
