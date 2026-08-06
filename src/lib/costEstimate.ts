// Оценка стоимости исправлений — клиентская эвристика (D-006/D-017). Всегда
// вилка (fork), никогда одно число: каждый price band сам по себе — уже
// диапазон ("€3k–10k"), одно из четырёх. НЕ юридическое заключение и не
// оферта — обязательный дисклеймер рядом с любым отображением (D-006).

import type { ScanFinding } from './scanner'
import { groupFindingsByRule } from './scanner'
import type { PriceBand } from '@data/a11y/types'

// Границы диапазонов в евро — держим числа здесь, не парсим локализованные строки
// из taxonomies.priceBands (те — только для отображения меток, не для арифметики).
const BAND_BOUNDS: Record<PriceBand, [number, number | null]> = {
  budget: [0, 3000],
  mid: [3000, 10000],
  premium: [10000, 30000],
  enterprise: [30000, null],
}

export type CostEstimate = { band: PriceBand; lowerAmount: number; upperAmount: number | null }

// effortScore: количество РАЗЛИЧНЫХ правил (не инстансов — тот же принцип
// дедупа, что в worker/lib/score.js) + двойной вес за serious/critical правила,
// потому что такие обычно требуют больше инженерного времени на исправление,
// а не только больше текста в отчёте.
function effortScore(findings: ScanFinding[]): number {
  const groups = groupFindingsByRule(findings)
  const severe = groups.filter((g) => g.impact === 'critical' || g.impact === 'serious').length
  return groups.length + severe * 2
}

function pickBand(score: number): PriceBand {
  if (score <= 2) return 'budget'
  if (score <= 5) return 'mid'
  if (score <= 10) return 'premium'
  return 'enterprise'
}

// Возвращает null, если находок нет — оценивать нечего, а не "budget" по умолчанию.
export function estimateCost(findings: ScanFinding[]): CostEstimate | null {
  if (findings.length === 0) return null
  const band = pickBand(effortScore(findings))
  const [lowerAmount, upperAmount] = BAND_BOUNDS[band]
  return { band, lowerAmount, upperAmount }
}

// Без символа валюты — используется внутри диапазона, где € уже стоит один раз
// в начале (конвенция проекта, см. taxonomies.json priceBands: "€3k–10k").
function formatAmount(amount: number): string {
  return amount >= 1000 ? `${Math.round(amount / 1000)}k` : String(amount)
}

export function formatCostEstimate(estimate: CostEstimate): string {
  if (estimate.upperAmount === null) return `€${formatAmount(estimate.lowerAmount)}+`
  if (estimate.lowerAmount === 0) return `Under €${formatAmount(estimate.upperAmount)}`
  return `€${formatAmount(estimate.lowerAmount)}–${formatAmount(estimate.upperAmount)}`
}
