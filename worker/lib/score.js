// Оценка 0–100 из findings (D-004). Чистая функция — не сертификация соответствия,
// эвристика для сортировки/сравнения (см. дисклеймер-требование D-006 для UI отчёта).
//
// Дедуп по ruleId (худшая severity среди инстансов) — иначе одно системное упущение
// (напр. alt-текст на 40 картинках) обнуляло бы счёт так же, как 40 разных проблем.

const IMPACT_WEIGHT = { minor: 1, moderate: 3, serious: 7, critical: 12 }

export function scoreFromFindings(findings) {
  if (!findings.length) return 100
  const worstByRule = new Map()
  for (const f of findings) {
    const current = worstByRule.get(f.ruleId)
    if (!current || IMPACT_WEIGHT[f.impact] > IMPACT_WEIGHT[current]) {
      worstByRule.set(f.ruleId, f.impact)
    }
  }
  const penalty = [...worstByRule.values()].reduce((sum, impact) => sum + (IMPACT_WEIGHT[impact] ?? 1), 0)
  return Math.max(0, Math.round(100 - Math.min(100, penalty)))
}
