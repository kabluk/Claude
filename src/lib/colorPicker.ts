// G-CHECKER-IMAGEPICKER: pure geometry + palette math for the image colour
// picker at /checkers/image-color-picker/. Ноль DOM — только числа/массивы
// пикселей, поэтому (как contrast.ts / cvd.ts / palette.ts) тестируется в
// Node напрямую (src/lib/colorPicker.test.mjs) и одинаково работает при
// SSG-пререндере (без window) и в браузере. Формат цвета/контраст сами —
// contrast.ts, здесь не дублируются.
//
// Три задачи чистой математики, которые иначе жили бы внутри компонента и
// были бы недоступны юнит-тестам:
//  1. downscale изображения для канвы с сохранением пропорций (производительность
//     — getImageData на 6000px-изображении без этого тормозит);
//  2. геометрия перекрестия — клавиатурная навигация (стрелки/Shift+стрелки) и
//     перевод координат клика (CSS-пиксели) в пиксели канвы (native px), когда
//     канва отрисована мельче/крупнее своего атрибута width/height;
//  3. извлечение доминирующих цветов изображения (палитра) — гистограмма по
//     грубо квантованным вёдрам, без внешних зависимостей.

import type { RGB } from './contrast'

// --- 1. Downscale с сохранением пропорций. -------------------------------

export function scaledSize(width: number, height: number, maxDim: number): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 1, height: 1 }
  if (width <= maxDim && height <= maxDim) return { width, height }
  const scale = maxDim / Math.max(width, height)
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

// --- 2. Геометрия перекрестия. --------------------------------------------

// Клампит и округляет точку в границы канвы (0..width-1, 0..height-1) —
// общий примитив и для клавиатурного шага, и для перевода координат клика.
export function clampPoint(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const maxX = Math.max(0, Math.round(width) - 1)
  const maxY = Math.max(0, Math.round(height) - 1)
  return {
    x: Math.min(Math.max(Math.round(x), 0), maxX),
    y: Math.min(Math.max(Math.round(y), 0), maxY),
  }
}

const STEP_SMALL = 1
const STEP_BIG = 10

// Стрелки двигают перекрестие на 1px, Shift+стрелки — на 10px (требование
// доступности: точный клавиатурный контроль без мыши). null — клавиша не
// стрелка, вызывающий код её не перехватывает (не давит скролл страницы зря).
export function moveCrosshair(
  pos: { x: number; y: number },
  key: string,
  big: boolean,
  width: number,
  height: number,
): { x: number; y: number } | null {
  const step = big ? STEP_BIG : STEP_SMALL
  let dx = 0
  let dy = 0
  if (key === 'ArrowLeft') dx = -step
  else if (key === 'ArrowRight') dx = step
  else if (key === 'ArrowUp') dy = -step
  else if (key === 'ArrowDown') dy = step
  else return null
  return clampPoint(pos.x + dx, pos.y + dy, width, height)
}

// Клик мышью приходит в CSS-пикселях (clientX/clientY относительно
// getBoundingClientRect канвы), а getImageData читает native-пиксели канвы
// (атрибуты width/height) — на мобильном канва часто отрисована мельче
// своего атрибута (object-contain внутри max-h-*), поэтому 1:1 перевод дал
// бы клик мимо. rect передаётся как простой объект (не настоящий DOMRect) —
// тестируемо без DOM.
export function mapClientToCanvas(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  const scaleX = rect.width > 0 ? canvasWidth / rect.width : 1
  const scaleY = rect.height > 0 ? canvasHeight / rect.height : 1
  const x = (clientX - rect.left) * scaleX
  const y = (clientY - rect.top) * scaleY
  return clampPoint(x, y, canvasWidth, canvasHeight)
}

// --- 3. Доминирующие цвета (палитра). --------------------------------------

// 4 бита на канал = 16 уровней = 4096 вёдер — достаточно грубо, чтобы
// сгруппировать близкие оттенки одной области фото, и достаточно тонко,
// чтобы не смешать разные цвета в один. Внутри ведра усредняем РЕАЛЬНЫЕ
// значения пикселей (не центр ведра) — палитра ближе к тому, что видит глаз.
const BUCKET_BITS = 4
const CHANNEL_SHIFT = 8 - BUCKET_BITS

// data — плоский RGBA-буфер (ImageData.data). Прозрачные пиксели (alpha < 16)
// пропускаются: они не несут видимого цвета, учитывать их было бы выдумкой
// (R1 — не только про данные каталога, но и про то, что показывает инструмент).
export function extractPalette(data: Uint8ClampedArray, count = 6): RGB[] {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>()
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 16) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const key =
      ((r >> CHANNEL_SHIFT) << (BUCKET_BITS * 2)) | ((g >> CHANNEL_SHIFT) << BUCKET_BITS) | (b >> CHANNEL_SHIFT)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.r += r
      bucket.g += g
      bucket.b += b
      bucket.n += 1
    } else {
      buckets.set(key, { r, g, b, n: 1 })
    }
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((s) => ({ r: Math.round(s.r / s.n), g: Math.round(s.g / s.n), b: Math.round(s.b / s.n) }))
}
