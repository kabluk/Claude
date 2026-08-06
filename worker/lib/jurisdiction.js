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
  // Добавлено 2026-08-06 (research по запросу владельца "юрисдикции") — 8 стран,
  // где в каталоге реально есть агентства (data/a11y/agencies.json), с законом
  // транспозиции EAA (Directive (EU) 2019/882), подтверждённым по первоисточнику
  // (официальный правовой портал страны, не агрегатор/блог вендора) — та же
  // дисциплина, что у FR/ES/NL/PL: verified:false, БЕЗ суммы штрафа, т.к. сумма
  // нигде не сверена с текстом закона напрямую (только само требование заявления
  // подтверждено первоисточником). Статья EAA об accessibility statement (Art. 22)
  // единая по всему ЕС — каждая страна транспонирует то же требование под
  // локальным названием, поэтому statementRequired:true консистентно у всех.
  IT: {
    country: 'IT', law: 'EAA transposition (D.Lgs. 82/2022)',
    lawFull: 'Decreto Legislativo 27 maggio 2022, n. 82 (attuazione direttiva (UE) 2019/882); obbligo di dichiarazione di accessibilità radicato nella Legge Stanca (L. 4/2004) per la PA, esteso al privato',
    statementRequired: true, verified: false,
  },
  IE: {
    country: 'IE', law: 'S.I. No. 636/2023',
    lawFull: 'European Union (Accessibility Requirements of Products and Services) Regulations 2023',
    statementRequired: true, verified: false,
  },
  AT: {
    country: 'AT', law: 'BaFG', lawFull: 'Barrierefreiheitsgesetz, BGBl. I Nr. 76/2023',
    statementRequired: true, verified: false,
  },
  BE: {
    country: 'BE', law: 'Loi du 5.11.2023 (2023046827)',
    lawFull: "Loi du 5 novembre 2023 modifiant plusieurs livres du Code de droit économique — transposition partielle directive (UE) 2019/882",
    statementRequired: true, verified: false,
  },
  SE: {
    country: 'SE', law: 'Lag (2023:254)', lawFull: 'Lag (2023:254) om vissa produkters och tjänsters tillgänglighet',
    statementRequired: true, verified: false,
  },
  DK: {
    country: 'DK', law: 'LOV nr 801 af 07/06/2022',
    lawFull: 'Lov om tilgængelighedskrav for produkter og tjenester',
    statementRequired: true, verified: false,
  },
  FI: {
    country: 'FI', law: 'Laki 306/2019 + asetus 179/2023',
    lawFull: 'Laki digitaalisten palvelujen tarjoamisesta (306/2019), EAA-vaatimukset täydennetty asetuksella 179/2023',
    statementRequired: true, verified: false,
  },
  // Норвегия — не член ЕС, но через соглашение ЕЭЗ (EEA) транспонирует те же
  // директивы; forskrift существует до EAA (2013) и уже требует заявление —
  // не выдумываем "EAA transposition", т.к. первоисточник называет другую основу
  // (diskriminerings- og tilgjengelighetsloven), честно указываем её.
  NO: {
    country: 'NO', law: 'Forskrift om universell utforming av IKT-løsninger',
    lawFull: 'Forskrift 21.6.2013 nr. 732, hjemlet i diskriminerings- og tilgjengelighetsloven (Norge: EØS-avtalen, ikke EU-medlem)',
    statementRequired: true, verified: false,
  },
}

// GB/US/CA/AU/CH/IN намеренно НЕ включены, хотя в каталоге есть агентства из этих
// стран — материально другая правовая база (не транспозиция EAA), требующая
// отдельного исследования, а не строчки в этой таблице: UK вне EAA после Brexit
// (Equality Act 2010 не содержит той же обязательности "accessibility statement"
// для частного сектора), США — ADA - правоприменение прецедентами/AG, не единый
// закон с заявлением, Швейцария — не ЕЭЗ, свой BehiG. Пропуск явный, не
// проглядели (см. LEARNING_LOG.md).
const TLD_TO_JURISDICTION = {
  de: 'DE', fr: 'FR', es: 'ES', nl: 'NL', pl: 'PL',
  it: 'IT', ie: 'IE', at: 'AT', be: 'BE', se: 'SE', dk: 'DK', fi: 'FI', no: 'NO',
}

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

// Список поддерживаемых юрисдикций для UI-селектора — единственный источник
// правды и для воркера, и для фронтенда (фронт получает его не импортом —
// worker plain-JS, D-010 — а копией в src/lib/jurisdictions.ts, синхронизация
// проверяется тестом, чтобы список не разъехался молча).
export function supportedJurisdictions() {
  return Object.values(JURISDICTIONS).map((j) => ({ country: j.country, law: j.law }))
}

// A3-JURISDICTION-OVERRIDE (D-032): TLD — честная, но грубая эвристика. Сайт на
// .com, обслуживающий Германию, по TLD не определится вовсе (country:'unknown'),
// и юридически решающая находка "нет заявления" не получит вес. Явный выбор
// страны пользователем точнее любой эвристики по домену — поэтому он ПЕРЕБИВАЕТ
// TLD, а не дополняет его. Неизвестный/пустой код молча игнорируется (возврат к
// TLD), а не роняет скан: это подсказка пользователя, не валидируемый контракт.
export function resolveJurisdiction(url, countryCodeOverride) {
  if (typeof countryCodeOverride === 'string') {
    const code = countryCodeOverride.trim().toUpperCase()
    if (JURISDICTIONS[code]) return { ...JURISDICTIONS[code], source: 'user-override' }
  }
  return jurisdictionForUrl(url)
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
