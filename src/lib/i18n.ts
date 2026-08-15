// G-I18N-CHROME: словарь UI-строк каркаса (Layout.tsx — шапка/футер) и
// обвязки страницы гайда (GuidePage.tsx).
//
// Область НАМЕРЕННО узкая: это не полноценный i18n-фреймворк с роутингом
// (/de/), а точечный словарь для страниц, чей КОНТЕНТ уже не на английском
// (/bfsg-check/ и гайды с locale de/fr/pl) и рендерился внутри английской
// шапки/футера. Полный роутинг /de/ и перевод сотен описаний — отдельные
// будущие узлы G-I18N, не эта правка.
//
// hreflang здесь сознательно НЕ появляется (D-102): `alternate` означает
// «та же страница на другом языке», а переводных пар в контенте нет вовсе —
// fr-гайды про RGAA, pl про польскую ustawę, de про BFSG. Это разный контент
// под разные рынки, и связать их hreflang значило бы соврать поисковику.
// Язык документа несёт <html lang> (Layout htmlLang), он уже верен.
//
// Локали: en/de/fr/pl — ровно те, на которых есть контент (`es` из
// A11Y_LOCALES гайдов пока не имеет; GuidePage сводит его к 'en' явно, а не
// молчаливым fallback).
//
// Тон и терминология сверены с уже опубликованным контентом сайта
// (BfsgCheckPage.tsx, data/a11y/guides/*.md соответствующей локали):
// de — „…“, «Barrierefreiheit», «geprüft»/«Anbieter»; fr — типографика с
// узким пробелом перед «;»/«?», «accessibilité numérique», «prestataire»;
// pl — „…“, «dostępność cyfrowa», «deklaracja dostępności» (официальный
// термин из audyt-wcag-przewodnik.md).

export type ChromeLocale = 'en' | 'de' | 'fr' | 'pl'

export interface ChromeDict {
  skipToContent: string
  // aria-label ориентиров. Решение (D-этого узла): переводим — по духу
  // задачи «полноценный немецкий chrome» это не только видимый текст, но и
  // то, что слышит пользователь скринридера; landmark-uniqueness проверяется
  // audit-a11y отдельно на каждой раскладке (en vs de), так что дублирования
  // имени внутри одной страницы это не создаёт.
  ariaMain: string
  ariaBreadcrumb: string
  ariaLegal: string
  // Footer «Explore» nav — вторичные разделы каталога, вынесенные из шапки
  // (компактность, D-118). Отдельный landmark → отдельное уникальное имя
  // (landmark-unique, D-083), поэтому свой ключ, а не переиспользование ariaMain.
  ariaExplore: string
  nav: {
    scan: string
    countries: string
    services: string
    standards: string
    knowledge: string
    components: string
    reports: string
    experts: string
    checkers: string
  }
  ctaScanWebsite: string
  breadcrumbHome: string
  footer: {
    // Динамика (счётчики агентств/стран) — функции, не строка с
    // плейсхолдером-заглушкой. Сами числа (agencies.length/countries.length)
    // остаются в Layout.tsx завёрнутыми в <span className="num"> (§25,
    // tabular-nums) — это разметка, не текст, поэтому здесь не строится
    // цельная строка с числами внутри; introMiddle/introSuffix — текст ДО и
    // ПОСЛЕ каждого числа. Оба принимают оба счётчика (не только «свой»),
    // чтобы у языков с зависимой от количества грамматикой была точка
    // расширения без смены сигнатуры. С D-102 это уже не гипотетический
    // задел: польский меняет форму существительного в зависимости от числа
    // (см. plAgencyNoun ниже); en/de/fr по-прежнему числом не управляются.
    introMiddle: (agencyCount: number, countryCount: number) => string
    introSuffix: (agencyCount: number, countryCount: number) => string
    noOverlays: string
    nav: {
      about: string
      whatWeCheck: string
      contact: string
      privacy: string
      imprint: string
      accessibilityStatement: string
    }
  }
  // Обвязка страницы гайда (GuidePage.tsx). Заведена вместе с fr/pl (D-102),
  // но чинит и уже существовавший дефект: немецкие гайды жили в немецкой
  // шапке с английскими «Updated»/«FAQ»/«Ready for the next step?»/«Verified
  // agencies for this topic» внутри — проверено живьём на проде до правки.
  // Заголовки и CTA-лейблы самих гайдов сюда НЕ попадают: они уже локализованы
  // в данных (frontmatter каждого .md), словарь их не дублирует.
  guide: {
    // Дата приходит как есть (ISO, из frontmatter) — словарь даёт только
    // подпись перед ней, без переформатирования самой даты.
    updated: string
    faq: string
    ctaTitle: string
    ctaSubtitle: string
    relatedAgencies: string
    relatedGuides: string
  }
}

const en: ChromeDict = {
  skipToContent: 'Skip to content',
  ariaMain: 'Main',
  ariaBreadcrumb: 'Breadcrumb',
  ariaLegal: 'Legal',
  ariaExplore: 'Explore',
  nav: {
    scan: 'Scan',
    countries: 'Countries',
    services: 'Services',
    standards: 'Standards',
    knowledge: 'Knowledge',
    components: 'Components',
    reports: 'Reports',
    experts: 'Experts',
    checkers: 'Free Checkers',
  },
  ctaScanWebsite: 'Scan website',
  breadcrumbHome: 'Home',
  footer: {
    introMiddle: () => ' verified digital-accessibility agencies across ',
    introSuffix: () => 'countries. Every listing cites its source; nothing is invented.',
    noOverlays:
      'We list audit and remediation specialists only — no automated «overlay» widgets. Listings are free; agencies can claim their profile to keep it current.',
    nav: {
      about: 'About',
      whatWeCheck: 'What we check',
      contact: 'Contact',
      privacy: 'Privacy',
      imprint: 'Imprint',
      accessibilityStatement: 'Accessibility Statement',
    },
  },
  guide: {
    updated: 'Updated',
    faq: 'FAQ',
    ctaTitle: 'Ready for the next step?',
    ctaSubtitle: 'Compare verified providers — every listing cites its sources.',
    relatedAgencies: 'Verified agencies for this topic',
    relatedGuides: 'Related guides',
  },
}

const de: ChromeDict = {
  skipToContent: 'Zum Inhalt springen',
  ariaMain: 'Hauptnavigation',
  ariaBreadcrumb: 'Brotkrümelnavigation',
  ariaLegal: 'Rechtliches',
  ariaExplore: 'Entdecken',
  nav: {
    scan: 'Scan',
    countries: 'Länder',
    services: 'Leistungen',
    standards: 'Normen',
    knowledge: 'Wissen',
    components: 'Komponenten',
    reports: 'Berichte',
    experts: 'Experten',
    checkers: 'Checker',
  },
  ctaScanWebsite: 'Website scannen',
  breadcrumbHome: 'Startseite',
  footer: {
    introMiddle: () => ' geprüfte Anbieter für digitale Barrierefreiheit in ',
    introSuffix: () => 'Ländern. Jeder Eintrag nennt seine Quelle; nichts ist erfunden.',
    noOverlays:
      'Wir listen ausschließlich Audit- und Umsetzungsspezialisten — keine automatisierten „Overlay“-Widgets. Einträge sind kostenlos; Agenturen können ihr Profil beanspruchen, um es aktuell zu halten.',
    nav: {
      about: 'Über uns',
      whatWeCheck: 'Was wir prüfen',
      contact: 'Kontakt',
      privacy: 'Datenschutz',
      imprint: 'Impressum',
      accessibilityStatement: 'Erklärung zur Barrierefreiheit',
    },
  },
  guide: {
    updated: 'Aktualisiert am',
    faq: 'FAQ',
    ctaTitle: 'Bereit für den nächsten Schritt?',
    ctaSubtitle: 'Vergleichen Sie geprüfte Anbieter — jeder Eintrag nennt seine Quellen.',
    relatedAgencies: 'Geprüfte Anbieter zu diesem Thema',
    relatedGuides: 'Verwandte Ratgeber',
  },
}

// Французская типографика: перед «;» и «?» ставится узкий неразрывный пробел
// (U+202F). Это не украшение — во французском это правило набора, и обычный
// пробел там даёт перенос строки перед знаком.
const fr: ChromeDict = {
  skipToContent: 'Aller au contenu',
  ariaMain: 'Navigation principale',
  ariaBreadcrumb: "Fil d'Ariane",
  ariaExplore: 'Explorer',
  // Не «Mentions légales»: так называется конкретная ссылка (imprint) внутри
  // этой же навигации — имя ориентира должно отличаться от имени ссылки.
  ariaLegal: 'Informations légales',
  nav: {
    // «Analyse», не «Scan»: у сканера французский эквивалент живой и
    // общеупотребимый, в отличие от немецкого, где «Scan» — норма.
    scan: 'Analyse',
    countries: 'Pays',
    services: 'Services',
    standards: 'Normes',
    knowledge: 'Ressources',
    components: 'Composants',
    reports: 'Rapports',
    experts: 'Experts',
    checkers: 'Vérificateurs gratuits',
  },
  ctaScanWebsite: 'Analyser un site',
  breadcrumbHome: 'Accueil',
  footer: {
    introMiddle: () => ' prestataires vérifiés en accessibilité numérique dans ',
    introSuffix: () => "pays. Chaque fiche cite sa source ; rien n'est inventé.",
    noOverlays:
      "Nous référençons uniquement des spécialistes de l'audit et de la correction — aucun widget « overlay » automatisé. Le référencement est gratuit ; les agences peuvent revendiquer leur fiche pour la tenir à jour.",
    nav: {
      about: 'À propos',
      whatWeCheck: 'Ce que nous vérifions',
      contact: 'Contact',
      privacy: 'Confidentialité',
      imprint: 'Mentions légales',
      accessibilityStatement: "Déclaration d'accessibilité",
    },
  },
  guide: {
    updated: 'Mis à jour le',
    faq: 'FAQ',
    ctaTitle: 'Prêt pour la suite ?',
    ctaSubtitle: 'Comparez des prestataires vérifiés — chaque fiche cite ses sources.',
    relatedAgencies: 'Prestataires vérifiés sur ce sujet',
    relatedGuides: 'Guides associés',
  },
}

// Польский — первый реальный потребитель count-аргументов introMiddle/
// introSuffix (сигнатура заводилась именно под языки с числозависимой
// грамматикой). Правило: число оканчивается на 2/3/4, но не на 12–14 →
// именительный мн. («zweryfikowani dostawcy»); иначе → родительный мн.
// («zweryfikowanych dostawców»). Сейчас агентств 245 → родительный, но при
// 243 форма обязана смениться, иначе текст станет неграмотным.
// Для стран формы не нужно: после «w» локатив мн. («krajach») не зависит от
// числа.
const plAgencyNoun = (n: number): string => {
  const last = n % 10
  const lastTwo = n % 100
  const nominativePlural = last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)
  return nominativePlural ? 'zweryfikowani dostawcy' : 'zweryfikowanych dostawców'
}

const pl: ChromeDict = {
  skipToContent: 'Przejdź do treści',
  ariaMain: 'Nawigacja główna',
  ariaBreadcrumb: 'Ścieżka nawigacyjna',
  ariaLegal: 'Informacje prawne',
  ariaExplore: 'Przeglądaj',
  nav: {
    scan: 'Skan',
    countries: 'Kraje',
    services: 'Usługi',
    standards: 'Standardy',
    knowledge: 'Wiedza',
    components: 'Komponenty',
    reports: 'Raporty',
    experts: 'Eksperci',
    checkers: 'Darmowe narzędzia',
  },
  ctaScanWebsite: 'Skanuj stronę',
  breadcrumbHome: 'Strona główna',
  footer: {
    introMiddle: (agencyCount) => ` ${plAgencyNoun(agencyCount)} usług dostępności cyfrowej w `,
    introSuffix: () => 'krajach. Każdy wpis podaje swoje źródło; nic nie jest zmyślone.',
    noOverlays:
      'Wymieniamy wyłącznie specjalistów od audytu i naprawy dostępności — bez automatycznych widżetów „overlay”. Wpis jest bezpłatny; agencje mogą przejąć swój profil, aby był aktualny.',
    nav: {
      about: 'O nas',
      whatWeCheck: 'Co sprawdzamy',
      contact: 'Kontakt',
      privacy: 'Prywatność',
      // Не «Impressum»: в польском праве такого понятия нет, а страница
      // содержит именно реквизиты компании.
      imprint: 'Dane firmy',
      // Официальный польский термин — тот же, что в audyt-wcag-przewodnik.md.
      accessibilityStatement: 'Deklaracja dostępności',
    },
  },
  guide: {
    updated: 'Zaktualizowano',
    faq: 'FAQ',
    ctaTitle: 'Gotowy na kolejny krok?',
    ctaSubtitle: 'Porównaj zweryfikowanych dostawców — każdy wpis podaje swoje źródła.',
    relatedAgencies: 'Zweryfikowani dostawcy w tym temacie',
    relatedGuides: 'Powiązane przewodniki',
  },
}

const dicts: Record<ChromeLocale, ChromeDict> = { en, de, fr, pl }

export const chromeDict = (locale: ChromeLocale = 'en'): ChromeDict => dicts[locale]
