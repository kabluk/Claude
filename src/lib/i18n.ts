// G-I18N-CHROME-DE: словарь UI-строк общего каркаса (Layout.tsx — шапка/футер).
//
// Область НАМЕРЕННО узкая: это не полноценный i18n-фреймворк с роутингом
// (/de/), а точечный словарь для страниц, чей КОНТЕНТ уже на немецком
// (/bfsg-check/ и гайды с locale:'de') и до сих пор рендерился внутри
// английской шапки/футера — задокументированный компромисс G-I18N-DE
// (BACKLOG.md), а не выдуманная новая фича. Полный роутинг /de/, hreflang и
// перевод сотен описаний/гайдов — отдельные будущие узлы G-I18N, не эта
// правка.
//
// Локали ограничены `en`/`de` сознательно: fr/pl-гайдов по одному, словаря
// на них ещё нет — они падают на английский chrome (Layout.tsx решает это
// явно, не молчаливым fallback).
//
// Тон и терминология немецкого текста сверены с уже опубликованным немецким
// контентом сайта (BfsgCheckPage.tsx, data/a11y/guides/*.md с locale:"de"):
// „…“ (немецкие кавычки-лапки), «Barrierefreiheit» вместо «Accessibility»,
// «geprüft»/«Anbieter» — тот же регистр, что в „digitale Barrierefreiheit in
// Deutschland“ (bfsg-pflichten-guide.md).

export type ChromeLocale = 'en' | 'de'

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
  nav: {
    scan: string
    countries: string
    services: string
    standards: string
    knowledge: string
    components: string
    reports: string
    experts: string
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
    // чтобы у языков с зависимой от количества грамматикой (в этом словаре
    // пока не используется — ни en, ни de-текст здесь не разнится по числу,
    // как и в исходной английской копии) была точка расширения без смены
    // сигнатуры.
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
}

const en: ChromeDict = {
  skipToContent: 'Skip to content',
  ariaMain: 'Main',
  ariaBreadcrumb: 'Breadcrumb',
  ariaLegal: 'Legal',
  nav: {
    scan: 'Scan',
    countries: 'Countries',
    services: 'Services',
    standards: 'Standards',
    knowledge: 'Knowledge',
    components: 'Components',
    reports: 'Reports',
    experts: 'Experts',
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
}

const de: ChromeDict = {
  skipToContent: 'Zum Inhalt springen',
  ariaMain: 'Hauptnavigation',
  ariaBreadcrumb: 'Brotkrümelnavigation',
  ariaLegal: 'Rechtliches',
  nav: {
    scan: 'Scan',
    countries: 'Länder',
    services: 'Leistungen',
    standards: 'Normen',
    knowledge: 'Wissen',
    components: 'Komponenten',
    reports: 'Berichte',
    experts: 'Experten',
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
}

const dicts: Record<ChromeLocale, ChromeDict> = { en, de }

export const chromeDict = (locale: ChromeLocale = 'en'): ChromeDict => dicts[locale]
