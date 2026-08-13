import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rgbToHsl } from './contrast.ts'
import { generatePalette, generateSwatches, bestTextColor, normalizeHue } from './palette.ts'

const near = (a, b, eps = 2) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b} (±${eps})`)

// Разница двух углов по кругу (0..180), чтобы 350 и 10 считались «на 20° apart».
const hueDiff = (a, b) => {
  const d = Math.abs(normalizeHue(a) - normalizeHue(b))
  return d > 180 ? 360 - d : d
}

// --- complementary: h+180.
test('complementary of hue 0 (red) returns the base plus hue 180', () => {
  const red = { r: 255, g: 0, b: 0 }
  const palette = generatePalette(red, 'complementary')
  assert.equal(palette.length, 2)
  assert.deepEqual(palette[0], red)
  const hue2 = rgbToHsl(palette[1]).h
  near(hue2, 180)
})

test('complementary includes the base colour unchanged as the first entry', () => {
  const base = { r: 18, g: 120, b: 200 }
  const palette = generatePalette(base, 'complementary')
  assert.deepEqual(palette[0], base)
})

// --- analogous: h-30, h+30.
test('analogous returns the base plus hues 30° either side', () => {
  const base = { r: 60, g: 140, b: 40 } // hue ≈ 100
  const baseHue = rgbToHsl(base).h
  const palette = generatePalette(base, 'analogous')
  assert.equal(palette.length, 3)
  near(rgbToHsl(palette[1]).h, normalizeHue(baseHue - 30))
  near(rgbToHsl(palette[2]).h, normalizeHue(baseHue + 30))
})

// --- triadic: 3 colours, each pair 120° apart.
test('triadic returns 3 colours, each adjacent pair 120° apart', () => {
  const base = { r: 40, g: 90, b: 200 }
  const palette = generatePalette(base, 'triadic')
  assert.equal(palette.length, 3)
  const hues = palette.map((c) => rgbToHsl(c).h)
  near(hueDiff(hues[0], hues[1]), 120)
  near(hueDiff(hues[1], hues[2]), 120)
  near(hueDiff(hues[2], hues[0]), 120)
})

// --- tetradic: 4 colours, 90° apart (rectangle).
test('tetradic returns 4 colours at 90°, 180° and 270° from the base', () => {
  const base = { r: 200, g: 60, b: 30 }
  const baseHue = rgbToHsl(base).h
  const palette = generatePalette(base, 'tetradic')
  assert.equal(palette.length, 4)
  const offsets = [90, 180, 270]
  palette.slice(1).forEach((c, i) => {
    near(rgbToHsl(c).h, normalizeHue(baseHue + offsets[i]))
  })
})

// --- split-complementary: h+150, h+210.
test('split-complementary returns the base plus hues 150° and 210° away', () => {
  const base = { r: 10, g: 200, b: 90 }
  const baseHue = rgbToHsl(base).h
  const palette = generatePalette(base, 'split-complementary')
  assert.equal(palette.length, 3)
  near(rgbToHsl(palette[1]).h, normalizeHue(baseHue + 150))
  near(rgbToHsl(palette[2]).h, normalizeHue(baseHue + 210))
})

// --- hue wraps past 360 correctly (base hue near the top of the wheel).
test('hue offsets wrap past 360 back into 0..360', () => {
  const base = { r: 255, g: 0, b: 140 } // hue ≈ 328
  const baseHue = rgbToHsl(base).h
  assert.ok(baseHue > 300, `test fixture should have a high base hue, got ${baseHue}`)
  const palette = generatePalette(base, 'tetradic')
  const hue270 = rgbToHsl(palette[3]).h // base + 270, wraps well past 360
  const expected = normalizeHue(baseHue + 270)
  assert.ok(expected < baseHue, 'expected offset should have wrapped below the base hue')
  near(hue270, expected)
  // Never negative, never >= 360.
  for (const c of palette) {
    const h = rgbToHsl(c).h
    assert.ok(h >= 0 && h < 360, `hue ${h} out of range`)
  }
})

// --- monochromatic: same hue, different lightness.
test('monochromatic keeps the hue constant and varies lightness', () => {
  const base = { r: 200, g: 60, b: 60 } // saturated red-ish, hue is meaningful
  const baseHsl = rgbToHsl(base)
  const palette = generatePalette(base, 'monochromatic')
  assert.equal(palette.length, 5)
  assert.deepEqual(palette[0], base)
  const hsls = palette.map(rgbToHsl)
  for (const hsl of hsls) near(hsl.h, baseHsl.h, 3)
  const lightnesses = hsls.map((hsl) => hsl.l)
  const distinctLightness = new Set(lightnesses)
  assert.ok(distinctLightness.size >= 4, `expected varied lightness, got ${lightnesses.join(', ')}`)
})

// --- best-text-colour: picks white on dark, black on light, with correct AA verdict.
test('bestTextColor picks white text on a very dark swatch and it passes AA', () => {
  const dark = { r: 10, g: 10, b: 20 }
  const choice = bestTextColor(dark)
  assert.equal(choice.name, 'white')
  assert.ok(choice.ratio >= 4.5, `expected AA-passing ratio, got ${choice.ratio}`)
  assert.equal(choice.passesAA, true)
})

test('bestTextColor picks black text on a very light swatch and it passes AA', () => {
  const light = { r: 245, g: 245, b: 235 }
  const choice = bestTextColor(light)
  assert.equal(choice.name, 'black')
  assert.ok(choice.ratio >= 4.5, `expected AA-passing ratio, got ${choice.ratio}`)
  assert.equal(choice.passesAA, true)
})

test('bestTextColor always passes AA normal text, even on mid-grey (math invariant)', () => {
  // contrastRatio(c, white) * contrastRatio(c, black) === 21 for any colour c
  // (their luminances multiply out to the black/white ratio), so
  // max(ratioWhite, ratioBlack) >= sqrt(21) ≈ 4.58, always above the 4.5 AA
  // threshold. There is no colour where the better of black/white text fails AA.
  for (const mid of [
    { r: 128, g: 128, b: 128 },
    { r: 117, g: 117, b: 117 }, // near the worst-case grey for this invariant
    { r: 90, g: 140, b: 160 },
  ]) {
    const choice = bestTextColor(mid)
    assert.ok(choice.ratio >= Math.sqrt(21) - 0.01, `expected ratio >= sqrt(21), got ${choice.ratio}`)
    assert.equal(choice.passesAA, true)
  }
})

// --- generateSwatches wires the palette + best-text-colour together.
test('generateSwatches returns one text choice per palette colour', () => {
  const base = { r: 30, g: 90, b: 180 }
  const swatches = generateSwatches(base, 'triadic')
  assert.equal(swatches.length, 3)
  for (const s of swatches) {
    assert.ok(s.text.name === 'black' || s.text.name === 'white')
    assert.ok(typeof s.text.ratio === 'number')
  }
})

// --- normalizeHue itself.
test('normalizeHue wraps negative and over-360 values into 0..360', () => {
  assert.equal(normalizeHue(-30), 330)
  assert.equal(normalizeHue(400), 40)
  assert.equal(normalizeHue(360), 0)
  assert.equal(normalizeHue(0), 0)
})
