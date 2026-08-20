import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scaledSize, clampPoint, moveCrosshair, mapClientToCanvas, extractPalette } from './colorPicker.ts'

// --- scaledSize -------------------------------------------------------

test('scaledSize leaves an image untouched when both dimensions fit', () => {
  assert.deepEqual(scaledSize(300, 200, 600), { width: 300, height: 200 })
})

test('scaledSize downscales a landscape image, preserving aspect ratio', () => {
  const { width, height } = scaledSize(6000, 3000, 600)
  assert.equal(width, 600)
  assert.equal(height, 300)
})

test('scaledSize downscales a portrait image against the taller dimension', () => {
  const { width, height } = scaledSize(1200, 4000, 400)
  assert.equal(height, 400)
  assert.equal(width, 120) // 1200 * (400/4000)
})

test('scaledSize never returns zero or negative dimensions on degenerate input', () => {
  assert.deepEqual(scaledSize(0, 0, 400), { width: 1, height: 1 })
})

// --- clampPoint ---------------------------------------------------------

test('clampPoint keeps in-range points unchanged (rounding fractional input)', () => {
  assert.deepEqual(clampPoint(10.4, 20.6, 100, 100), { x: 10, y: 21 })
})

test('clampPoint clamps negative coordinates to 0', () => {
  assert.deepEqual(clampPoint(-5, -1, 100, 100), { x: 0, y: 0 })
})

test('clampPoint clamps coordinates past the far edge to width-1/height-1', () => {
  assert.deepEqual(clampPoint(500, 500, 100, 50), { x: 99, y: 49 })
})

// --- moveCrosshair --------------------------------------------------------

test('moveCrosshair steps 1px per arrow key without Shift', () => {
  const pos = { x: 10, y: 10 }
  assert.deepEqual(moveCrosshair(pos, 'ArrowRight', false, 100, 100), { x: 11, y: 10 })
  assert.deepEqual(moveCrosshair(pos, 'ArrowLeft', false, 100, 100), { x: 9, y: 10 })
  assert.deepEqual(moveCrosshair(pos, 'ArrowUp', false, 100, 100), { x: 10, y: 9 })
  assert.deepEqual(moveCrosshair(pos, 'ArrowDown', false, 100, 100), { x: 10, y: 11 })
})

test('moveCrosshair steps 10px per arrow key with Shift held', () => {
  const pos = { x: 50, y: 50 }
  assert.deepEqual(moveCrosshair(pos, 'ArrowRight', true, 100, 100), { x: 60, y: 50 })
  assert.deepEqual(moveCrosshair(pos, 'ArrowDown', true, 100, 100), { x: 50, y: 60 })
})

test('moveCrosshair clamps at the canvas edge instead of leaving bounds', () => {
  assert.deepEqual(moveCrosshair({ x: 0, y: 0 }, 'ArrowLeft', false, 100, 100), { x: 0, y: 0 })
  assert.deepEqual(moveCrosshair({ x: 5, y: 5 }, 'ArrowUp', true, 100, 100), { x: 5, y: 0 })
  assert.deepEqual(moveCrosshair({ x: 95, y: 95 }, 'ArrowRight', true, 100, 100), { x: 99, y: 95 })
})

test('moveCrosshair returns null for a non-arrow key — caller must not swallow it', () => {
  assert.equal(moveCrosshair({ x: 5, y: 5 }, 'Enter', false, 100, 100), null)
  assert.equal(moveCrosshair({ x: 5, y: 5 }, 'a', false, 100, 100), null)
})

// --- mapClientToCanvas ----------------------------------------------------

test('mapClientToCanvas is 1:1 when the canvas is displayed at its native resolution', () => {
  const rect = { left: 10, top: 20, width: 200, height: 100 }
  assert.deepEqual(mapClientToCanvas(60, 70, rect, 200, 100), { x: 50, y: 50 })
})

test('mapClientToCanvas scales up when the canvas is displayed smaller than its native resolution', () => {
  // Native 400x200 canvas rendered at CSS 200x100 (object-contain shrink) — a
  // click at the CSS midpoint must land on the native midpoint, not half of it.
  const rect = { left: 0, top: 0, width: 200, height: 100 }
  assert.deepEqual(mapClientToCanvas(100, 50, rect, 400, 200), { x: 200, y: 100 })
})

test('mapClientToCanvas clamps a click outside the rect instead of returning an out-of-range point', () => {
  const rect = { left: 0, top: 0, width: 100, height: 100 }
  assert.deepEqual(mapClientToCanvas(-20, 500, rect, 100, 100), { x: 0, y: 99 })
})

// --- extractPalette ---------------------------------------------------------

function solidPixels(rgb, count) {
  const data = new Uint8ClampedArray(count * 4)
  for (let i = 0; i < count; i++) {
    data[i * 4] = rgb.r
    data[i * 4 + 1] = rgb.g
    data[i * 4 + 2] = rgb.b
    data[i * 4 + 3] = 255
  }
  return data
}

function concatPixels(...buffers) {
  const total = buffers.reduce((n, b) => n + b.length, 0)
  const out = new Uint8ClampedArray(total)
  let offset = 0
  for (const b of buffers) {
    out.set(b, offset)
    offset += b.length
  }
  return out
}

test('extractPalette returns the most frequent colour first', () => {
  const red = { r: 220, g: 20, b: 20 }
  const blue = { r: 20, g: 20, b: 220 }
  const data = concatPixels(solidPixels(red, 100), solidPixels(blue, 10))
  const palette = extractPalette(data, 6)
  assert.equal(palette.length, 2)
  assert.deepEqual(palette[0], red)
  assert.deepEqual(palette[1], blue)
})

test('extractPalette averages the real pixel values within a bucket, not the bucket centre', () => {
  // Two near-identical greens fall in the same coarse (4-bit) bucket — the
  // palette entry should be their true average, proving buckets aggregate
  // real data rather than snapping to a quantised representative.
  const a = { r: 10, g: 200, b: 10 }
  const b = { r: 14, g: 204, b: 14 }
  const data = concatPixels(solidPixels(a, 1), solidPixels(b, 1))
  const palette = extractPalette(data, 6)
  assert.equal(palette.length, 1)
  assert.deepEqual(palette[0], { r: 12, g: 202, b: 12 })
})

test('extractPalette ignores near-transparent pixels', () => {
  const visible = { r: 30, g: 30, b: 30 }
  const transparent = { r: 250, g: 250, b: 250 }
  const data = concatPixels(solidPixels(visible, 5))
  // Manually zero the alpha of an extra transparent pixel appended after.
  const withTransparent = concatPixels(data, solidPixels(transparent, 5))
  for (let i = 5; i < 10; i++) withTransparent[i * 4 + 3] = 0
  const palette = extractPalette(withTransparent, 6)
  assert.equal(palette.length, 1)
  assert.deepEqual(palette[0], visible)
})

test('extractPalette respects the requested count', () => {
  const colors = [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 0 },
  ]
  const data = concatPixels(...colors.map((c) => solidPixels(c, 1)))
  assert.equal(extractPalette(data, 2).length, 2)
  assert.equal(extractPalette(data, 10).length, 4)
})

test('extractPalette returns an empty array for an all-transparent image', () => {
  const data = solidPixels({ r: 1, g: 2, b: 3 }, 4)
  for (let i = 0; i < 4; i++) data[i * 4 + 3] = 0
  assert.deepEqual(extractPalette(data, 6), [])
})
