// A3-JURISDICTION: взвешивание severity по юрисдикции сайта, не только по axe
// impact. "Нет заявления о доступности" в юрисдикции с обязательным заявлением —
// решающая юридическая находка (см. BACKLOG.md "Сканер: разрыв..."), а не просто
// один из findings с дефолтным impact правила.
//
// ⚠ Соблюдаем предупреждение из исследования (2026-08-06): страновые суммы штрафов
// в основном берутся из блогов a11y-вендоров с интересом пугать. §37 BFSG и Anlage 3
// (Германия) — законодательный источник, подтверждённый в исследовании явно.
// Остальные юрисдикции здесь получают ТОЛЬКО правовую базу (закон, обязательность
// заявления), БЕЗ сумм штрафов — verified:false означает "не показывать сумму
// клиенту", не "юрисдикция не поддерживается". Ничего не выдумываем.
const JURISDICTIONS = {
  DE: {
    country: 'DE', law: 'BFSG', lawFull: 'Barrierefreiheitsstärkungsgesetz',
    statementRequired: true, verified: true,
    maxFineEUR: 100000, citation: '§37 BFSG (Abs. 1 Nr. 1/7/8/9/10); Anlage 3 zu §14 BFSG',
  },
  FR: {
    country: 'FR', law: 'RGAA', lawFull: "Référentiel général d'amélioration de l'accessibilité",
    statementRequired: true, verified: false, // сумма из вторичного источника, не сверена с Décret напрямую
  },
  ES: {
    country: 'ES', law: 'RD 1112/2018', lawFull: 'Real Decreto de accesibilidad de sitios web',
    statementRequired: true, verified: false,
  },
  NL: { country: 'NL', law: 'Tijdelijk besluit digitale toegankelijkheid overheid', statementRequired: true, verified: false },
  PL: { country: 'PL', law: 'Ustawa o dostępności cyfrowej', statementRequired: true, verified: false },
}

const TLD_TO_JURISDICTION = { de: 'DE', fr: 'FR', es: 'ES', nl: 'NL', pl: 'PL' }

// Только TLD-эвристика — честно приблизительная (сайт на .com обслуживающий Германию
// не определится). Явный override возможен в будущем через страну агентства/пользователя,
// сейчас не подключён (нет источника этих данных на входе скана) — не выдумываем его.
export function jurisdictionForUrl(url) {
  let hostname
  try {
    hostname = new URL(url).hostname
  } catch {
    return { country: 'unknown', law: null, statementRequired: null, verified: false, source: 'invalid-url' }
  }
  const tld = hostname.split('.').pop()?.toLowerCase()
  const code = TLD_TO_JURISDICTION[tld]
  if (!code) return { country: 'unknown', law: null, statementRequired: null, verified: false, source: 'tld-not-mapped' }
  return { ...JURISDICTIONS[code], source: 'tld' }
}

// Находки, для которых отсутствие — юридически решающий факт (не просто axe impact).
// Бампится до 'critical' ТОЛЬКО когда юрисдикция подтверждённо требует заявление —
// иначе (unknown/statementRequired:false) findings остаются как были, не выдумываем
// требование там, где не проверили.
const LEGALLY_DECISIVE_RULE_IDS = new Set(['a11y-statement-missing', 'a11y-statement-incomplete'])

export function applyJurisdictionWeight(findings, jurisdiction) {
  if (!jurisdiction?.statementRequired) return findings
  return findings.map((f) => {
    if (!LEGALLY_DECISIVE_RULE_IDS.has(f.ruleId)) return f
    if (f.impact === 'critical') return f
    return {
      ...f,
      impact: 'critical',
      jurisdictionNote: jurisdiction.verified
        ? `${jurisdiction.country}: ${jurisdiction.law}, ${jurisdiction.citation}`
        : `${jurisdiction.country}: ${jurisdiction.law} (fine amount not verified against primary law — not shown)`,
    }
  })
}
