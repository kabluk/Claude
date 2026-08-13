// G-CHECKERS-BATCH-1: colour-vision-deficiency (CVD) simulation for
// /checkers/color-blindness-simulator/. Ноль DOM — только числа, поэтому
// (как и contrast.ts / readability.ts) тестируется в Node напрямую
// (src/lib/cvd.test.mjs) и одинаково работает при SSG-пререндере и в браузере.
//
// Матрицы — дословно из набора Wickline/HCIRN (Matthew Wickline & the Human-
// Computer Interaction Resource Network, «Color Blind Web Page Filter») —
// это широко используемое web-стандартное sRGB-приближение дихромазии,
// которым пользуются многие CVD-инструменты. Значения НЕ выведены заново и
// НЕ «улучшены» здесь — они переписаны из задания дословно. Смена модели
// (например, на полную линейную симуляцию Brettel/Viénot) была бы решением с
// записью в DECISIONS.md, а не тихой правкой этого файла.
//
// Цвет парсится/форматируется ОДНИМ местом в проекте — contrast.ts;
// реэкспортируем нужное отсюда, а не дублируем регэкспы.

import { type RGB, parseColor, toHex } from './contrast'

export type { RGB }
export { parseColor, toHex }

export type CvdType = 'protanopia' | 'deuteranopia' | 'tritanopia'

export const CVD_TYPES: CvdType[] = ['protanopia', 'deuteranopia', 'tritanopia']

export const CVD_LABELS: Record<CvdType, string> = {
  protanopia: 'Protanopia (red-blind)',
  deuteranopia: 'Deuteranopia (green-blind)',
  tritanopia: 'Tritanopia (blue-blind)',
}

// Матрица 3×3, построчно [r→r, r→g? нет — см. ниже]. Порядок ровно как в
// задании: применяется как out = M · in, каждая строка — веса (r,g,b) вклада
// в один выходной канал (out.r = row1·in, out.g = row2·in, out.b = row3·in).
type Matrix9 = readonly [number, number, number, number, number, number, number, number, number]

export const MATRICES: Record<CvdType, Matrix9> = {
  protanopia: [0.567, 0.433, 0.0, 0.558, 0.442, 0.0, 0.0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0.0, 0.7, 0.3, 0.0, 0.0, 0.3, 0.7],
  tritanopia: [0.95, 0.05, 0.0, 0.0, 0.433, 0.567, 0.0, 0.475, 0.525],
}

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)))

// Применяет матрицу CVD-типа к одному пикселю (каналы 0..255), клампит и
// округляет результат. Чистая функция — вызывающий код (компонент) гоняет её
// по каждому пикселю ImageData в event handler/эффекте, не здесь.
export function simulate(rgb: RGB, type: CvdType): RGB {
  const [m11, m12, m13, m21, m22, m23, m31, m32, m33] = MATRICES[type]
  const { r, g, b } = rgb
  return {
    r: clamp255(m11 * r + m12 * g + m13 * b),
    g: clamp255(m21 * r + m22 * g + m23 * b),
    b: clamp255(m31 * r + m32 * g + m33 * b),
  }
}
