// G-CHECKER-PALETTE: pure colour-scheme math for /checkers/color-palette-generator/.
// Ноль DOM — только числа, поэтому (как contrast.ts / cvd.ts / readability.ts)
// тестируется в Node напрямую (src/lib/palette.test.mjs) и одинаково работает при
// SSG-пререндере и в браузере.
//
// Цвет парсится/форматируется/сравнивается ОДНИМ местом в проекте — contrast.ts;
// реэкспортируем нужное отсюда и строим схемы поверх rgbToHsl/hslToRgb/contrastRatio,
// а не дублируем эту математику (как cvd.ts).
//
// УГОЛ ЭТОГО ИНСТРУМЕНТА: гармония (вращение hue) — эстетическая, недоказуемая часть;
// контраст каждого образца — измеримая часть. Каждый образец в паре с текстовым
// цветом обязан показывать реальный коэффициент контраста и вердикт AA, а не только
// цвет (WCAG 1.4.1) — это считается тем же passes()/contrastRatio(), которым сверяет
// сам сканер, так что результат здесь не расходится с тем, что нашёл бы /scan/.

import { type RGB, type HSL, contrastRatio, passes, roundRatio, rgbToHsl, hslToRgb } from './contrast'

export type { RGB, HSL }

export type SchemeName =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'split-complementary'
  | 'monochromatic'

export const SCHEME_NAMES: SchemeName[] = [
  'complementary',
  'analogous',
  'triadic',
  'tetradic',
  'split-complementary',
  'monochromatic',
]

export const SCHEME_LABELS: Record<SchemeName, string> = {
  complementary: 'Complementary',
  analogous: 'Analogous',
  triadic: 'Triadic',
  tetradic: 'Tetradic (rectangle)',
  'split-complementary': 'Split-complementary',
  monochromatic: 'Monochromatic',
}

export const SCHEME_DESCRIPTIONS: Record<SchemeName, string> = {
  complementary: 'One colour and its opposite on the colour wheel (base hue + 180°).',
  analogous: 'Three neighbouring hues, 30° apart either side of the base.',
  triadic: 'Three hues evenly spaced 120° apart around the wheel.',
  tetradic: 'Four hues forming a rectangle, 90° apart.',
  'split-complementary': 'The base plus the two hues next to its opposite (±150°/±210°).',
  monochromatic: 'One hue at five different lightness levels — no hue variation at all.',
}

// Смещения hue от базового цвета для каждой схемы, БЕЗ базы (её добавляет
// generatePalette первым элементом). Числа — дословно из задания: complementary
// h+180; analogous h-30,h+30; triadic h+120,h+240; tetradic/rectangle
// h+90,h+180,h+270; split-complementary h+150,h+210.
const HUE_OFFSETS: Record<Exclude<SchemeName, 'monochromatic'>, number[]> = {
  complementary: [180],
  analogous: [-30, 30],
  triadic: [120, 240],
  tetradic: [90, 180, 270],
  'split-complementary': [150, 210],
}

// Смещения lightness (%) для monochromatic — hue и saturation остаются как у базы.
// Клампим 5..95, чтобы не съехать в чистый чёрный/белый, где hue физически теряет
// смысл (несовместимо с «keeps hue»).
const LIGHTNESS_OFFSETS = [-40, -20, 20, 40]

export const normalizeHue = (h: number): number => ((h % 360) + 360) % 360
const clampLightness = (l: number): number => Math.max(5, Math.min(95, l))

// Генерирует упорядоченный список RGB для схемы: [база, ...производные].
// Чистая функция — детерминирована по (base, scheme), пригодна и для SSG,
// и для клика «Randomise» (сам random — только в обработчике вызывающего кода).
export function generatePalette(base: RGB, scheme: SchemeName): RGB[] {
  const hsl = rgbToHsl(base)
  if (scheme === 'monochromatic') {
    return [base, ...LIGHTNESS_OFFSETS.map((o) => hslToRgb({ ...hsl, l: clampLightness(hsl.l + o) }))]
  }
  const offsets = HUE_OFFSETS[scheme]
  return [base, ...offsets.map((o) => hslToRgb({ ...hsl, h: normalizeHue(hsl.h + o) }))]
}

export type TextChoice = {
  color: RGB
  name: 'black' | 'white'
  ratio: number
  passesAA: boolean
}

const WHITE: RGB = { r: 255, g: 255, b: 255 }
const BLACK: RGB = { r: 0, g: 0, b: 0 }

// Для образца выбирает более контрастный из чёрного/белого текста (та же логика,
// которой пользуется реальный UI-выбор «тёмный/светлый текст»), считает точный
// коэффициент через contrastRatio (сканерная формула) и вердикт AA normal text —
// текстовая метка Pass/Fail, не только цвет (WCAG 1.4.1), рисует уже вызывающий код.
//
// Математический факт (проверен в palette.test.mjs, не только заявлен здесь):
// contrastRatio(c, white) × contrastRatio(c, black) === 21 для ЛЮБОГО c — потому что
// (Lw+.05)/(Lc+.05) × (Lc+.05)/(Lb+.05) = (Lw+.05)/(Lb+.05) = 1.05/0.05 = 21 (Lw=1,
// Lb=0). Значит max(ratioWhite, ratioBlack) ≥ √21 ≈ 4.58 всегда — чёрный/белый текст
// на ЛЮБОМ образце этой палитры физически не может провалить AA normal (4.5:1).
// passesAA здесь никогда не бывает false; поле оставлено (не булево `true` литералом),
// чтобы UI не хардкодил бейдж и порог считался тем же passes(), что и остальной сайт.
export function bestTextColor(rgb: RGB): TextChoice {
  const ratioWhite = contrastRatio(rgb, WHITE)
  const ratioBlack = contrastRatio(rgb, BLACK)
  const useWhite = ratioWhite >= ratioBlack
  const ratio = roundRatio(useWhite ? ratioWhite : ratioBlack)
  return {
    color: useWhite ? WHITE : BLACK,
    name: useWhite ? 'white' : 'black',
    ratio,
    passesAA: passes(ratio, 'normal', 'AA') === true,
  }
}

export type Swatch = {
  rgb: RGB
  text: TextChoice
}

// Палитра + для каждого образца лучший читаемый текст — то, что реально рисует
// компонент. Отдельная функция, а не встроенная в компонент, чтобы протестировать
// связку (схема → образцы → контраст) без DOM.
export function generateSwatches(base: RGB, scheme: SchemeName): Swatch[] {
  return generatePalette(base, scheme).map((rgb) => ({ rgb, text: bestTextColor(rgb) }))
}

export type CrossContrast = {
  rgb: RGB
  ratioAgainstBase: number
  passesAA: boolean
}

// Плюс к обязательному «свой читаемый текст на каждом образце»: контраст каждого
// цвета палитры КАК ТЕКСТА на базовом цвете — полезно, когда база станет фоном
// (например, кнопка одного цвета на фоне другого из той же палитры).
export function crossContrastAgainstBase(base: RGB, scheme: SchemeName): CrossContrast[] {
  return generatePalette(base, scheme).map((rgb) => {
    const ratio = roundRatio(contrastRatio(rgb, base))
    return { rgb, ratioAgainstBase: ratio, passesAA: passes(ratio, 'normal', 'AA') === true }
  })
}
