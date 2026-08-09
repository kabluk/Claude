// D-107: границы шкалы score → грейд. Пороги — явное решение владельца
// (90/70/50), не подобраны программой; тест фиксирует их как контракт, а не
// как деталь реализации — следующая правка не должна тихо сдвинуть границу.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scoreGrade, scoreGradeLabel, scoreGradeChipClass } from './scanner.ts'

test('границы 90/70/50 — ровно на пороге ещё верхний грейд, на 1 ниже — уже нижний', () => {
  assert.equal(scoreGrade(100), 'excellent')
  assert.equal(scoreGrade(90), 'excellent')
  assert.equal(scoreGrade(89), 'good')
  assert.equal(scoreGrade(70), 'good')
  assert.equal(scoreGrade(69), 'needs-work')
  assert.equal(scoreGrade(50), 'needs-work')
  assert.equal(scoreGrade(49), 'poor')
  assert.equal(scoreGrade(0), 'poor')
})

test('label и chip-класс покрывают все 4 грейда без пропуска', () => {
  const grades = ['excellent', 'good', 'needs-work', 'poor']
  for (const g of grades) {
    assert.equal(typeof scoreGradeLabel(g), 'string')
    assert.ok(scoreGradeLabel(g).length > 0)
    assert.match(scoreGradeChipClass(g), /^chip-(success|moderate|critical)$/)
  }
})

test('верхние два грейда используют success-токен, нижние — различимые moderate/critical', () => {
  assert.equal(scoreGradeChipClass('excellent'), 'chip-success')
  assert.equal(scoreGradeChipClass('good'), 'chip-success')
  assert.equal(scoreGradeChipClass('needs-work'), 'chip-moderate')
  assert.equal(scoreGradeChipClass('poor'), 'chip-critical')
})
