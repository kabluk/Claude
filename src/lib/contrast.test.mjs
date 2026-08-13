import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  relativeLuminance,
  contrastRatio,
  roundRatio,
  passes,
  parseColor,
  hslToRgb,
  rgbToHsl,
  toHex,
  toRgbString,
  toHslString,
} from './contrast.ts'

const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b} (±${eps})`)

// --- Формула контраста: якорные значения, сверенные с WebAIM/axe-core.
test('black on white is exactly 21:1 (the maximum)', () => {
  near(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }), 21, 0.001)
})

test('a color against itself is exactly 1:1', () => {
  near(contrastRatio({ r: 18, g: 52, b: 86 }, { r: 18, g: 52, b: 86 }), 1, 0.0001)
})

test('order of arguments does not matter (lighter/darker resolved internally)', () => {
  const fg = { r: 40, g: 40, b: 40 }
  const bg = { r: 240, g: 240, b: 240 }
  assert.equal(contrastRatio(fg, bg), contrastRatio(bg, fg))
})

test('#777777 on #ffffff ≈ 4.48:1 (WebAIM reference value)', () => {
  near(contrastRatio({ r: 0x77, g: 0x77, b: 0x77 }, { r: 255, g: 255, b: 255 }), 4.48, 0.01)
})

test('relative luminance: white is 1, black is 0', () => {
  near(relativeLuminance({ r: 255, g: 255, b: 255 }), 1, 0.0001)
  near(relativeLuminance({ r: 0, g: 0, b: 0 }), 0, 0.0001)
})

// --- Пороги WCAG 2.2 и согласованность вердикта с округлённым числом.
test('WCAG thresholds: normal AA 4.5 / AAA 7, large AA 3 / AAA 4.5, non-text AA 3', () => {
  // 4.5 ровно проходит normal AA, но не normal AAA
  assert.equal(passes(4.5, 'normal', 'AA'), true)
  assert.equal(passes(4.5, 'normal', 'AAA'), false)
  // 3.0 проходит large AA и non-text AA, но не normal AA
  assert.equal(passes(3.0, 'large', 'AA'), true)
  assert.equal(passes(3.0, 'nonText', 'AA'), true)
  assert.equal(passes(3.0, 'normal', 'AA'), false)
  // large AAA = 4.5
  assert.equal(passes(4.5, 'large', 'AAA'), true)
  // 7 проходит normal AAA
  assert.equal(passes(7, 'normal', 'AAA'), true)
})

test('non-text has no AAA level (returns null, not a boolean)', () => {
  assert.equal(passes(21, 'nonText', 'AAA'), null)
})

test('verdict uses the rounded ratio, so it never contradicts the shown number', () => {
  // 4.497 округляется до 4.50 → показанное «4.50» обязано читаться как проход AA.
  assert.equal(roundRatio(4.497), 4.5)
  assert.equal(passes(4.497, 'normal', 'AA'), true)
})

// --- Парсинг цвета во всех поддерживаемых нотациях.
test('parseColor: 3- and 6-digit hex, with or without #', () => {
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255 })
  assert.deepEqual(parseColor('fff'), { r: 255, g: 255, b: 255 })
  assert.deepEqual(parseColor('#ffffff'), { r: 255, g: 255, b: 255 })
  assert.deepEqual(parseColor('#1a2b3c'), { r: 26, g: 43, b: 60 })
})

test('parseColor: rgb() and hsl() notations', () => {
  assert.deepEqual(parseColor('rgb(255, 0, 0)'), { r: 255, g: 0, b: 0 })
  assert.deepEqual(parseColor('rgba(0, 128, 255, 0.5)'), { r: 0, g: 128, b: 255 }) // альфа игнор
  assert.deepEqual(parseColor('hsl(0, 100%, 50%)'), { r: 255, g: 0, b: 0 })
  assert.deepEqual(parseColor('hsl(120, 100%, 50%)'), { r: 0, g: 255, b: 0 })
})

test('parseColor: bare "r, g, b" triples', () => {
  assert.deepEqual(parseColor('255, 255, 255'), { r: 255, g: 255, b: 255 })
  assert.deepEqual(parseColor('0 0 0'), { r: 0, g: 0, b: 0 })
})

test('parseColor: junk and empty return null (caller shows "—", never crashes)', () => {
  assert.equal(parseColor(''), null)
  assert.equal(parseColor('not a color'), null)
  assert.equal(parseColor('#12'), null)
  assert.equal(parseColor('rgb(255)'), null)
})

// --- Конвертации HSL round-trip и форматтеры.
test('hslToRgb / rgbToHsl round-trip on primary colors', () => {
  assert.deepEqual(hslToRgb({ h: 0, s: 100, l: 50 }), { r: 255, g: 0, b: 0 })
  assert.deepEqual(hslToRgb({ h: 240, s: 100, l: 50 }), { r: 0, g: 0, b: 255 })
  assert.deepEqual(rgbToHsl({ r: 255, g: 0, b: 0 }), { h: 0, s: 100, l: 50 })
  assert.deepEqual(rgbToHsl({ r: 255, g: 255, b: 255 }), { h: 0, s: 0, l: 100 })
})

test('formatters produce canonical strings', () => {
  assert.equal(toHex({ r: 26, g: 43, b: 60 }), '#1a2b3c')
  assert.equal(toHex({ r: 5, g: 5, b: 5 }), '#050505')
  assert.equal(toRgbString({ r: 255, g: 0, b: 0 }), 'rgb(255, 0, 0)')
  assert.equal(toHslString({ r: 255, g: 0, b: 0 }), 'hsl(0, 100%, 50%)')
})

test('toHex clamps out-of-range channels instead of producing invalid hex', () => {
  assert.equal(toHex({ r: 300, g: -5, b: 128 }), '#ff0080')
})
