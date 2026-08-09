// D-106: гейт логики опроса /report/:id. Риск, ради которого функция вообще
// вынесена в чистый модуль: единичный сетевой сбой во время долгого скана НЕ
// должен схлопывать живой прогресс в ошибку, но и бесконечно ретраить 404 /
// «сканер не настроен» тоже нельзя. Тест фиксирует ровно эти терминальные и
// ретрай-границы.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  decidePollNext,
  POLL_INTERVAL_MS,
  POLL_ERROR_BACKOFF_MS,
  MAX_CONSECUTIVE_POLL_ERRORS,
} from './reportPolling.ts'

test('running → показываем прогресс, опрашиваем дальше, серию сбоев обнуляем', () => {
  const d = decidePollNext({ kind: 'ok', status: 'running' }, 3)
  assert.deepEqual(d, {
    show: 'report',
    keepPolling: true,
    retryDelayMs: POLL_INTERVAL_MS,
    consecutiveErrors: 0,
  })
})

test('done → терминально, опрос прекращаем', () => {
  assert.deepEqual(decidePollNext({ kind: 'ok', status: 'done' }, 0), {
    show: 'report',
    keepPolling: false,
  })
})

test('error → терминально, опрос прекращаем (как и done)', () => {
  assert.deepEqual(decidePollNext({ kind: 'ok', status: 'error' }, 0), {
    show: 'report',
    keepPolling: false,
  })
})

test('404 (not-found) НЕ ретраится — строка отчёта правда исчезла', () => {
  assert.deepEqual(decidePollNext({ kind: 'not-found' }, 0), { show: 'not-found' })
  // даже с накопленными сбоями это остаётся терминальным, не превращается в retry
  assert.deepEqual(decidePollNext({ kind: 'not-found' }, 2), { show: 'not-found' })
})

test('unavailable НЕ ретраится — конфигурационная ошибка сама не пройдёт', () => {
  assert.deepEqual(decidePollNext({ kind: 'unavailable' }, 0), { show: 'unavailable' })
})

test('первый транзиентный сбой — ретрай с backoff, счётчик = 1, прогресс на экране сохраняется', () => {
  const d = decidePollNext({ kind: 'transient-error' }, 0)
  assert.deepEqual(d, {
    show: 'retry',
    delayMs: POLL_ERROR_BACKOFF_MS,
    consecutiveErrors: 1,
  })
})

test('сбои подряд ретраятся вплоть до предела, затем — честная ошибка', () => {
  // 0→1, 1→2, 2→3 ретраятся; на пороге (3→4 == MAX) сдаёмся
  for (let n = 0; n < MAX_CONSECUTIVE_POLL_ERRORS - 1; n++) {
    const d = decidePollNext({ kind: 'transient-error' }, n)
    assert.equal(d.show, 'retry', `при ${n} сбоях подряд ещё ретраим`)
    assert.equal(d.consecutiveErrors, n + 1)
  }
  const giveUp = decidePollNext({ kind: 'transient-error' }, MAX_CONSECUTIVE_POLL_ERRORS - 1)
  assert.deepEqual(giveUp, { show: 'load-error' })
})

test('успех после серии сбоев обнуляет счётчик (running с накопленными ошибками)', () => {
  // running всегда возвращает consecutiveErrors: 0 независимо от входного числа —
  // именно это позволяет пережить сколько угодно ОТДЕЛЬНЫХ блипов за длинный скан.
  const d = decidePollNext({ kind: 'ok', status: 'running' }, MAX_CONSECUTIVE_POLL_ERRORS - 1)
  assert.equal(d.show, 'report')
  assert.equal(d.consecutiveErrors, 0)
})
