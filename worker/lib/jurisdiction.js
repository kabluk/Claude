// A3-JURISDICTION: взвешивание severity по юрисдикции сайта, не только по axe
// impact. "Нет заявления о доступности" в юрисдикции с обязательным заявлением —
// решающая юридическая находка (см. BACKLOG.md "Сканер: разрыв..."), а не просто
// один из findings с дефолтным impact правила.
//
// ⚠ СУММ ШТРАФОВ ЗДЕСЬ НЕТ И БЫТЬ НЕ ДОЛЖНО (D-035, решение владельца).
// Причины, установленные проверкой по первоисточникам (D-034): (1) из 13
// юрисдикций сумму удалось подтвердить лишь для одной, то есть 12 отчётов из 13
// всё равно показывали бы пустоту; (2) даже подтверждённая сумма имеет условия
// применимости, которые мы физически не можем оценить — микропредприятия
// (<10 чел., ≤€2 млн) исключены из требований EAA к услугам самой директивой
// (Art. 4(5)), а штата и оборота сканируемого сайта мы не знаем; (3) публично
// цитируемые цифры сплошь и рядом взяты из режима ПУБЛИЧНОГО сектора и к
// e-commerce не относятся (французский случай: €50 000 — только от €250 млн
// оборота). Показывать сумму, зная всё это, значит пугать наугад — ровно то,
// от чего продукт отстраивается (R1). `verified` остался как маркер качества
// правовой ссылки, `citation` — само основание требования, без санкции.
const JURISDICTIONS = {
  // DE остаётся единственной verified:true — и проверку D-034 она выдержала по
  // существу: BFSG это и есть транспозиция EAA для ЧАСТНОГО сектора (в отличие от
  // французской ст. 47, оказавшейся режимом для госорганов и компаний от €250 млн,
  // см. FR ниже). Порога по обороту в BFSG нет, но микропредприятия (<10 чел. и
  // ≤€2 млн) по услугам исключены самой директивой (Art. 4(5)) — оговорка
  // показывается пользователю константой в ReportPage, т.к. одинакова для всех
  // юрисдикций ЕС и не является свойством конкретной страны.
  DE: {
    country: 'DE', law: 'BFSG', lawFull: 'Barrierefreiheitsstärkungsgesetz',
    statementRequired: true, verified: true,
    citation: 'Anlage 3 zu §14 BFSG',
  },
  // FR остаётся verified:false, но теперь по КОНКРЕТНОЙ установленной причине,
  // а не «не проверяли» (D-034, проверка по Légifrance — первоисточник):
  // повсеместно цитируемая «Франция — €50 000» относится к loi 2005-102 ст. 47/47-1
  // (надзор ARCOM, €50k за недоступность + €25k отдельно за отсутствие декларации),
  // но ст. 47 покрывает госорганы И частные компании ТОЛЬКО с оборотом от
  // €250 млн (порог задан décret 2019-768). Типовой интернет-магазин — наш
  // основной сканируемый профиль — под этот режим не подпадает вовсе, и показать
  // ему €50 000 значило бы соврать в сторону запугивания. Частный сектор по EAA
  // во Франции идёт отдельным путём — Code de la consommation, Section 3
  // «Accessibilité des produits et services» (L412-13 и далее, ordonnance
  // 2023-859); его санкции по первоисточнику НЕ установлены (и не понадобятся — сумм не показываем).
  // D-154: verified по первоисточнику (Légifrance, сверено родителем). RGAA —
  // публичный сектор; частный сектор EAA во Франции идёт через Code de la
  // consommation art. L412-13 (ord. 2023-859), применяется с 28.06.2025.
  FR: {
    country: 'FR', law: 'Code de la consommation art. L412-13 (ord. 2023-859)',
    lawFull: 'Code de la consommation, art. L412-13 (créé par ordonnance n° 2023-859 du 6 septembre 2023) — transposition de la directive (UE) 2019/882 pour le secteur privé; applicable au 28 juin 2025',
    statementRequired: true, verified: true,
  },
  // D-154: verified (BOE, сверено родителем). RD 1112/2018 — публичный сектор;
  // частный сектор EAA — Ley 11/2023 (Título I), reglamento RD 193/2023.
  ES: {
    country: 'ES', law: 'Ley 11/2023 (+ RD 193/2023)',
    lawFull: 'Ley 11/2023, de 8 de mayo (Título I: transposición de la directiva (UE) 2019/882 al sector privado; desarrollada por el Real Decreto 193/2023); aplicable desde el 28 de junio de 2025',
    statementRequired: true, verified: true,
  },
  // D-154: verified (wetten.overheid.nl, сверено родителем). Прежняя ссылка была
  // на ГОС-сектор («overheid»); частный сектор EAA — Implementatiewet 2024.
  NL: {
    country: 'NL', law: 'Implementatiewet toegankelijkheidsvoorschriften producten en diensten (2024)',
    lawFull: 'Implementatiewet toegankelijkheidsvoorschriften producten en diensten (Stb. 2024, 87) — transpositie richtlijn (EU) 2019/882; e-handelsplicht in het Burgerlijk Wetboek; van kracht 28-06-2025',
    statementRequired: true, verified: true,
  },
  // D-154: ссылка исправлена на частный сектор EAA (Dz.U. 2024 poz. 731,
  // идентификатор подтверждён на офиц. портале ELI), но verified:false — текст
  // статей не удалось прочитать из первоисточника (CAPTCHA/бинарный PDF), честно
  // держим «ориентировочно» до читаемой сверки тела закона.
  PL: {
    country: 'PL', law: 'Ustawa z 26.04.2024 (Dz.U. 2024 poz. 731)',
    lawFull: 'Ustawa z dnia 26 kwietnia 2024 r. o zapewnianiu spełniania wymagań dostępności niektórych produktów i usług przez podmioty gospodarcze (Dz.U. 2024 poz. 731) — transpozycja dyrektywy (UE) 2019/882 dla sektora prywatnego',
    statementRequired: true, verified: false,
  },
  // Добавлено 2026-08-06 (research по запросу владельца "юрисдикции") — 8 стран,
  // где в каталоге реально есть агентства (data/a11y/agencies.json), с законом
  // транспозиции EAA (Directive (EU) 2019/882), подтверждённым по первоисточнику
  // (официальный правовой портал страны, не агрегатор/блог вендора). БЕЗ суммы
  // штрафа (D-035). D-154 (2026-08-13): сверка первоисточников на частный сектор
  // проведена для топ-5 рынков — FR/ES/NL/IT переведены в verified:true (частный
  // сектор EAA подтверждён), PL — ссылка исправлена, но verified:false (тело
  // закона не прочитано из первоисточника); IE/AT/BE/SE/DK/FI/NO пока verified:
  // false — «остальные», ждут такой же сверки. Статья EAA об statement (Art. 22)
  // единая по всему ЕС — каждая страна транспонирует то же требование под
  // локальным названием, поэтому statementRequired:true консистентно у всех.
  IT: {
    country: 'IT', law: 'D.Lgs. 82/2022 (attuazione dir. 2019/882)',
    lawFull: 'Decreto Legislativo 27 maggio 2022, n. 82 (attuazione direttiva (UE) 2019/882); copre gli operatori economici privati (servizi di commercio elettronico, servizi bancari per consumatori); applicabile dal 28 giugno 2025',
    statementRequired: true, verified: true,
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

// D-040: РАНЬШЕ здесь стоял ранний выход `if (f.impact === 'critical') return f`,
// и он молча ломал ровно ту цепочку, ради которой модуль написан. axe.js отдаёт
// `a11y-statement-missing` СРАЗУ с impact:'critical' (это самая решающая находка),
// поэтому находка «заявления нет» никогда не получала jurisdictionNote — правовое
// основание видел только куда более слабый случай `-incomplete` (impact:'serious').
// Тесты этого не ловили, т.к. подавали 'serious' там, где прод отдаёт 'critical'
// (fixture drift). Правило теперь разделено: ПОМЕТКА ставится всегда, БАМП
// impact — только если находка ниже critical.
export function applyJurisdictionWeight(findings, jurisdiction) {
  if (!jurisdiction?.statementRequired) return findings
  return findings.map((f) => {
    if (!LEGALLY_DECISIVE_RULE_IDS.has(f.ruleId)) return f
    return {
      ...f,
      impact: 'critical',
      // Код страны отдельным полем, а не разбором строки заметки: фронтенду нужно
      // знать юрисдикцию, чтобы вести немецкий трафик по немецкому пути
      // (INTERFACES.md §3). Парсить `jurisdictionNote` регуляркой — молчаливая
      // связка текста копирайта с логикой, ломается при первой правке формулировки.
      jurisdictionCountry: jurisdiction.country,
      // Ни в одной ветке нет и не должно быть суммы (D-035). `verified`
      // означает качество ПРАВОВОЙ ССЫЛКИ: сверена ли она с первоисточником
      // и относится ли к частному сектору — а не «проверена ли сумма штрафа».
      jurisdictionNote: jurisdiction.verified
        ? `${jurisdiction.country}: ${jurisdiction.law}, ${jurisdiction.citation}`
        : `${jurisdiction.country}: ${jurisdiction.law} (legal basis indicative — not verified against primary law)`,
    }
  })
}
