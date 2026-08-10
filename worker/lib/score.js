// Оценка 0–100 из findings (D-004). Чистая функция — не сертификация соответствия,
// эвристика для сортировки/сравнения (см. дисклеймер-требование D-006 для UI отчёта).
//
// Дедуп по ruleId (худшая severity среди инстансов) — иначе одно системное упущение
// (напр. alt-текст на 40 картинках) обнуляло бы счёт так же, как 40 разных проблем.

const IMPACT_WEIGHT = { minor: 1, moderate: 3, serious: 7, critical: 12 }

// SCAN-RESILIENCE (2026-08-10). Находки namespace `scan-meta-*` — это не
// нарушения сайта, а прозрачность качества скана: «баннер согласия был снят
// перед проверкой» (A3-COOKIEBANNER), «страница пропущена, скан продолжен».
// Они НЕ должны снижать оценку: иначе сайт получал бы -1 за то, что у нашего
// сканера отвалилась страница, — то есть мы штрафовали бы за собственный отказ,
// и честное признание проблемы было бы дороже молчания. Найдено при добавлении
// scan-meta-page-skipped: `scan-meta-cookie-banner-dismissed` уже втихую стоил
// сайту 1 балл (impact minor = вес 1).
export function isMetaFinding(finding) {
  return typeof finding?.ruleId === 'string' && finding.ruleId.startsWith('scan-meta-')
}

export function scoreFromFindings(findings) {
  const worstByRule = new Map()
  for (const f of findings) {
    if (isMetaFinding(f)) continue
    const current = worstByRule.get(f.ruleId)
    if (!current || IMPACT_WEIGHT[f.impact] > IMPACT_WEIGHT[current]) {
      worstByRule.set(f.ruleId, f.impact)
    }
  }
  const penalty = [...worstByRule.values()].reduce((sum, impact) => sum + (IMPACT_WEIGHT[impact] ?? 1), 0)
  return Math.max(0, Math.round(100 - Math.min(100, penalty)))
}
