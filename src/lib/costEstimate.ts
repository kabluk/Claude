// Оценка стоимости исправлений — клиентская эвристика (D-006/D-017). Всегда
// вилка (fork), никогда одно число: каждый price band сам по себе — уже
// диапазон ("€3k–10k"), одно из четырёх. НЕ юридическое заключение и не
// оферта — обязательный дисклеймер рядом с любым отображением (D-006).

import type { ScanFinding } from './scanner'
import { groupFindingsByRule } from './scanner'
import type { PriceBand } from '@data/a11y/types'
import { convertFromEur } from './currency'

// Границы диапазонов в евро — держим числа здесь, не парсим локализованные строки
// из taxonomies.priceBands (те — только для отображения меток, не для арифметики).
const BAND_BOUNDS: Record<PriceBand, [number, number | null]> = {
  budget: [0, 3000],
  mid: [3000, 10000],
  premium: [10000, 30000],
  enterprise: [30000, null],
}

export type CostEstimate = { band: PriceBand; lowerAmount: number; upperAmount: number | null }

// Находки, которые НЕ являются инженерной работой по исправлению сайта и не
// растут с его размером (D-046). Написать заявление о доступности или завести
// канал обратной связи — разовая задача на несколько часов независимо от того,
// 5 страниц у сайта или 5000; PDF — вопрос к документам, не к вёрстке. Считать
// их наравне с «переверстать всю навигацию» значит завышать смету тем сильнее,
// чем добросовестнее сканер. В отчёте они по-прежнему показываются и остаются
// юридически самыми важными — они просто не участвуют в ОЦЕНКЕ СТОИМОСТИ.
const NON_ENGINEERING_RULES = new Set([
  'a11y-statement-missing',
  'a11y-statement-incomplete',
  'a11y-feedback-missing',
  'a11y-pdf-present',
])

// Служебные пометки о качестве самого скана — вообще не находки против сайта.
const SCAN_META_PREFIX = 'scan-meta-'

// effortScore: количество РАЗЛИЧНЫХ правил (не инстансов — тот же принцип
// дедупа, что в worker/lib/score.js) + двойной вес за serious/critical правила,
// потому что такие обычно требуют больше инженерного времени на исправление,
// а не только больше текста в отчёте.
export function effortScore(findings: ScanFinding[]): number {
  const groups = groupFindingsByRule(findings).filter(
    (g) => !NON_ENGINEERING_RULES.has(g.ruleId) && !g.ruleId.startsWith(SCAN_META_PREFIX),
  )
  const severe = groups.filter((g) => g.impact === 'critical' || g.impact === 'serious').length
  return groups.length + severe * 2
}

// Пороги (D-046). Прежние 2/5/10 калибровались, когда сканер отдавал ТОЛЬКО
// правила axe-core. С тех пор добавилось 15 собственных типов находок, 9 из них
// serious/critical, и каждая поднимает effortScore — тот же сайт, который раньше
// получал «€10k–30k», стал получать «€30k+». Пользователь видел цифру страшнее
// не потому, что сайт стал хуже, а потому что мы стали внимательнее смотреть.
// Пороги пересчитаны так, чтобы типовой сайт возвращался туда же, где был до
// расширения сканера; `costEstimate.test.mjs` фиксирует это на реалистичных
// наборах находок, чтобы следующее добавление правил снова не сдвинуло смету молча.
function pickBand(score: number): PriceBand {
  if (score <= 4) return 'budget'
  if (score <= 12) return 'mid'
  if (score <= 24) return 'premium'
  return 'enterprise'
}

// Возвращает null, если находок нет — оценивать нечего, а не "budget" по умолчанию.
export function estimateCost(findings: ScanFinding[]): CostEstimate | null {
  if (findings.length === 0) return null
  const band = pickBand(effortScore(findings))
  const [lowerAmount, upperAmount] = BAND_BOUNDS[band]
  return { band, lowerAmount, upperAmount }
}

// Без символа валюты — используется внутри диапазона, где символ уже стоит один
// раз в начале (конвенция проекта, см. taxonomies.json priceBands: "€3k–10k").
function formatAmount(amount: number): string {
  return amount >= 1000 ? `${Math.round(amount / 1000)}k` : String(amount)
}

export type CostCurrency = { code: string; symbol: string }
const EUR: CostCurrency = { code: 'EUR', symbol: '€' }

// A4-SITE-COUNTRY (D-126): band bounds are ALWAYS computed in EUR
// (BAND_BOUNDS above) — `currency` only changes what's shown, never the
// underlying estimate. Defaults to EUR/no conversion, so every existing
// caller (worker/lib/pdfPlan.js's mirror, any test not passing this param)
// keeps rendering exactly the same string as before this feature existed.
// An unknown currency code (convertFromEur returns null — e.g. a country
// added to taxonomies.json before src/lib/currency.ts's rate table catches
// up) degrades honestly to the real EUR number rather than showing a wrong
// figure or crashing.
export function formatCostEstimate(estimate: CostEstimate, currency: CostCurrency = EUR): string {
  // A currency with no rate in EUR_REFERENCE_RATES (e.g. a country added to
  // taxonomies.json before the rate table catches up) must degrade the SYMBOL
  // along with the amount — showing the unconverted EUR number under the
  // unknown currency's symbol (e.g. "X$30k+" for a EUR figure) would be
  // exactly the kind of misleading-number bug this project won't tolerate.
  // Resolve both together, once, so they can never disagree.
  const resolved: CostCurrency =
    currency.code === 'EUR' || convertFromEur(estimate.lowerAmount, currency.code) !== null ? currency : EUR
  const toCurrency = (amountEur: number): number =>
    resolved.code === 'EUR' ? amountEur : (convertFromEur(amountEur, resolved.code) ?? amountEur)
  const symbol = resolved.code === 'EUR' ? '€' : resolved.symbol
  if (estimate.upperAmount === null) return `${symbol}${formatAmount(toCurrency(estimate.lowerAmount))}+`
  if (estimate.lowerAmount === 0) return `Under ${symbol}${formatAmount(toCurrency(estimate.upperAmount))}`
  return `${symbol}${formatAmount(toCurrency(estimate.lowerAmount))}–${formatAmount(toCurrency(estimate.upperAmount))}`
}
