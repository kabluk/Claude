import { test } from 'node:test'
import assert from 'node:assert/strict'
import { simulate, MATRICES, CVD_TYPES } from './cvd.ts'

const near = (a, b, eps = 0.001) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b} (±${eps})`)

// --- Матрицы дословно из задания (Wickline/HCIRN web-standard set): каждая
// строка — веса вклада (r,g,b) в один выходной канал, сумма строки ≈ 1 (ни
// прироста, ни потери «энергии» канала).
test('each CVD matrix row sums to ~1 for all three types', () => {
  for (const type of CVD_TYPES) {
    const [m11, m12, m13, m21, m22, m23, m31, m32, m33] = MATRICES[type]
    near(m11 + m12 + m13, 1)
    near(m21 + m22 + m23, 1)
    near(m31 + m32 + m33, 1)
  }
})

// --- Красный пиксель должен сместиться РОВНО туда, куда предсказывает
// матрица (посчитано вручную по тем же коэффициентам) — не просто «стал
// другим», а именно к ожидаемому значению.
test('pure red {255,0,0} shifts to the matrix-predicted value under protanopia', () => {
  const [m11, , , m21, , , m31] = MATRICES.protanopia
  const expected = { r: Math.round(m11 * 255), g: Math.round(m21 * 255), b: Math.round(m31 * 255) }
  assert.deepEqual(simulate({ r: 255, g: 0, b: 0 }, 'protanopia'), expected)
})

test('pure red {255,0,0} shifts to the matrix-predicted value under deuteranopia', () => {
  const [m11, , , m21, , , m31] = MATRICES.deuteranopia
  const expected = { r: Math.round(m11 * 255), g: Math.round(m21 * 255), b: Math.round(m31 * 255) }
  assert.deepEqual(simulate({ r: 255, g: 0, b: 0 }, 'deuteranopia'), expected)
})

// --- Серый (равные каналы) должен остаться серым при любой из трёх матриц:
// строка суммируется в ≈1, значит out = 128 * rowSum ≈ 128 на каждом канале.
test('grey {128,128,128} stays ~grey under all three CVD types', () => {
  for (const type of CVD_TYPES) {
    const out = simulate({ r: 128, g: 128, b: 128 }, type)
    near(out.r, 128, 1)
    near(out.g, 128, 1)
    near(out.b, 128, 1)
  }
})

// --- Выход за диапазон (может случиться при отрицательных/зашкаливающих
// входах — тестовые данные, не реальный пиксель) обязан клампиться, не
// давать невалидный RGB.
test('an out-of-range result clamps to 0..255 instead of overflowing', () => {
  const out = simulate({ r: 300, g: -20, b: 999 }, 'tritanopia')
  for (const channel of [out.r, out.g, out.b]) {
    assert.ok(channel >= 0 && channel <= 255, `${channel} is within 0..255`)
  }
})
