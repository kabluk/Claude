// G-TOOL-CONTRAST (D-144): чистая математика контраста WCAG для страницы-инструмента
// /tools/contrast-checker/. Ноль зависимостей, ноль DOM — только числа, поэтому
// модуль тестируется в Node напрямую (src/lib/contrast.test.mjs) и одинаково
// работает при SSG-пререндере (без window) и в браузере.
//
// Формула — дословно из WCAG 2.x (Understanding SC 1.4.3), та же, что у axe-core и
// WebAIM: относительная яркость с порогом линеаризации 0.03928 (это published-версия
// определения WCAG; новые черновики sRGB используют 0.04045 — здесь СОЗНАТЕЛЬНО
// 0.03928, чтобы результат совпадал с axe-core, которым мы же и сканируем сайты,
// и с WebAIM, эталоном #1 в SERP по запросу). Менять порог — значит разойтись с
// собственным сканером; это было бы решением с записью в DECISIONS.md, не правкой.

export type RGB = { r: number; g: number; b: number }
export type HSL = { h: number; s: number; l: number }

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)))

// Относительная яркость 0..1. Каналы r,g,b — 0..255 sRGB.
export function relativeLuminance({ r, g, b }: RGB): number {
  const lin = (channel: number): number => {
    const s = channel / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Коэффициент контраста 1..21. Порядок аргументов не важен (берём светлее/темнее).
export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

// Округление до 2 знаков — И для показа, И для вердикта pass/fail (как WebAIM).
// Держим их согласованными намеренно: показать «4.50» рядом с бейджем «Fail»
// выглядело бы как баг. Пороговое сравнение ниже смотрит на это же число.
export function roundRatio(ratio: number): number {
  return Math.round(ratio * 100) / 100
}

export type Level = 'AA' | 'AAA'
export type TextKind = 'normal' | 'large' | 'nonText'

// Пороги WCAG 2.2:
//  - 1.4.3 Contrast (Minimum), AA: обычный текст 4.5, крупный 3.
//  - 1.4.6 Contrast (Enhanced), AAA: обычный 7, крупный 4.5.
//  - 1.4.11 Non-text Contrast, AA: элементы UI и графика 3. AAA для non-text НЕТ.
// Крупный текст по WCAG = ≥18pt (24px) ИЛИ ≥14pt (18.66px) полужирный.
export const THRESHOLDS: Record<TextKind, Record<Level, number | null>> = {
  normal: { AA: 4.5, AAA: 7 },
  large: { AA: 3, AAA: 4.5 },
  nonText: { AA: 3, AAA: null },
}

// null = комбинация не определена стандартом (AAA для non-text). Сравнение по
// округлённому значению, чтобы вердикт не спорил с показанным числом.
export function passes(ratio: number, kind: TextKind, level: Level): boolean | null {
  const threshold = THRESHOLDS[kind][level]
  if (threshold == null) return null
  return roundRatio(ratio) >= threshold
}

// --- Парсинг цвета: hex (#rgb/#rrggbb, с необязательным #), rgb()/rgba(),
// hsl()/hsla(), а также «r, g, b» без обёртки. Альфа игнорируется: контраст с
// прозрачностью зависит от подложки, которой у нас нет, — честнее считать по
// самому цвету, чем додумывать фон (никаких выдуманных данных, R1). Возвращает
// null на всём, что не распарсилось, — вызывающий код показывает это как «—»,
// а не роняет расчёт.

function parseHex(input: string): RGB | null {
  const m = input.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(m)) {
    return { r: parseInt(m[0] + m[0], 16), g: parseInt(m[1] + m[1], 16), b: parseInt(m[2] + m[2], 16) }
  }
  if (/^[0-9a-fA-F]{6}$/.test(m)) {
    return { r: parseInt(m.slice(0, 2), 16), g: parseInt(m.slice(2, 4), 16), b: parseInt(m.slice(4, 6), 16) }
  }
  // 4/8-значные (с альфой) — берём цветовые каналы, альфу отбрасываем (см. выше).
  if (/^[0-9a-fA-F]{4}$/.test(m)) {
    return { r: parseInt(m[0] + m[0], 16), g: parseInt(m[1] + m[1], 16), b: parseInt(m[2] + m[2], 16) }
  }
  if (/^[0-9a-fA-F]{8}$/.test(m)) {
    return { r: parseInt(m.slice(0, 2), 16), g: parseInt(m.slice(2, 4), 16), b: parseInt(m.slice(4, 6), 16) }
  }
  return null
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hue = ((h % 360) + 360) % 360
  const sat = Math.max(0, Math.min(100, s)) / 100
  const lum = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * lum - 1)) * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = lum - c / 2
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (hue < 60) [r1, g1, b1] = [c, x, 0]
  else if (hue < 120) [r1, g1, b1] = [x, c, 0]
  else if (hue < 180) [r1, g1, b1] = [0, c, x]
  else if (hue < 240) [r1, g1, b1] = [0, x, c]
  else if (hue < 300) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]
  return { r: clamp255((r1 + m) * 255), g: clamp255((g1 + m) * 255), b: clamp255((b1 + m) * 255) }
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

const numbersIn = (s: string): number[] =>
  (s.match(/-?\d*\.?\d+/g) || []).map(Number).filter((n) => Number.isFinite(n))

export function parseColor(input: string): RGB | null {
  if (typeof input !== 'string') return null
  const raw = input.trim()
  if (!raw) return null
  const lower = raw.toLowerCase()

  if (lower.startsWith('hsl')) {
    const n = numbersIn(lower)
    if (n.length < 3) return null
    return hslToRgb({ h: n[0], s: n[1], l: n[2] })
  }
  if (lower.startsWith('rgb')) {
    const n = numbersIn(lower)
    if (n.length < 3) return null
    return { r: clamp255(n[0]), g: clamp255(n[1]), b: clamp255(n[2]) }
  }
  // hex (с # или без)
  const hex = parseHex(raw)
  if (hex) return hex
  // Голое «r, g, b» / «r g b»
  const n = numbersIn(raw)
  if (n.length >= 3 && n.every((v) => v >= 0 && v <= 255)) {
    return { r: clamp255(n[0]), g: clamp255(n[1]), b: clamp255(n[2]) }
  }
  return null
}

// --- Форматтеры для вывода значения во всех трёх нотациях.
export function toHex({ r, g, b }: RGB): string {
  const h = (n: number) => clamp255(n).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

export function toRgbString({ r, g, b }: RGB): string {
  return `rgb(${clamp255(r)}, ${clamp255(g)}, ${clamp255(b)})`
}

export function toHslString(rgb: RGB): string {
  const { h, s, l } = rgbToHsl(rgb)
  return `hsl(${h}, ${s}%, ${l}%)`
}
