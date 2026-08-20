// Общая фикстура `/report/:id` для скриптов, которым нужен реально
// отрендеренный (не пустой) отчёт против собранного dist/ — `/report/:id`
// клиентский маршрут (routes.tsx catch-all), в dist/ его нет как файла, и
// без мока `${API_BASE}/api/scan/:id` (scanner.ts::fetchScan) страница
// показывает "Scanner is not configured" или бесконечно опрашивает воркер.
//
// Раньше это жило внутри audit-own-a11y.mjs (REPORT_FIXTURE_ID/reportFixture/
// noJurisdictionFixture) и не переиспользовалось. check-fold.mjs (D-187)
// понадобилась та же живая фикстура для замера сгиба на /report/:id — вместо
// второй копии вынесено сюда. Фикстура ОБЯЗАНА совпадать с контрактом
// ScanReport (src/lib/scanner.ts): parseScanProgress/parsePlanUnlocked и сама
// вёрстка доверяют её форме.
//
// Значения ниже — байт-в-байт то же, что было внутри audit-own-a11y.mjs до
// извлечения: это критический гейт, поведение после рефакторинга обязано
// остаться прежним (72 страницы, 0 нарушений), не «примерно тем же».
export const REPORT_FIXTURE_ID = 'fixture-scan-id'

// Три различных реальных ruleId/impact (image-alt/critical, color-contrast/
// serious, region/moderate) — достаточно, чтобы groupFindingsByRule() дал >0
// групп и список находок + тизер платного плана (построен из groups[0], см.
// LockedPlanPanel в ReportPage.tsx) реально рендерились. Более широкий набор
// (9 разных правил, покрывающий каждую ветку карточки находки — фильтры по
// серьёзности, «Show remaining N», собственные проверки без разметки,
// правовая пометка) живёт непосредственно в audit-own-a11y.mjs — там это
// нужно для полноты аудита; здесь, для гейта сгиба, важна только сама форма
// отчёта и то, что счётчики (страницы/находки/правила) не нулевые.
export const reportFixture = (planUnlocked) => ({
  id: REPORT_FIXTURE_ID,
  url: 'https://example.com',
  status: 'done',
  countryCode: 'US',
  countrySource: 'tld',
  pages: ['https://example.com/', 'https://example.com/about'],
  findings: [
    {
      ruleId: 'image-alt',
      wcag: ['wcag2a', 'wcag111'],
      impact: 'critical',
      selector: 'img.hero-logo',
      page: 'https://example.com/',
      html: '<img src="/logo.png" class="hero-logo">',
    },
    {
      ruleId: 'image-alt',
      wcag: ['wcag2a', 'wcag111'],
      impact: 'critical',
      selector: 'img.teaser',
      page: 'https://example.com/about',
      html: '<img src="/teaser.png" class="teaser">',
    },
    {
      ruleId: 'label',
      wcag: ['wcag2a', 'wcag412'],
      impact: 'critical',
      selector: 'input#search',
      page: 'https://example.com/',
      html: '<input id="search" type="text">',
    },
    {
      ruleId: 'color-contrast',
      wcag: ['wcag2aa', 'wcag143'],
      impact: 'serious',
      selector: '.btn-primary',
      page: 'https://example.com/about',
      html: '<button class="btn-primary">Submit</button>',
    },
    {
      ruleId: 'link-name',
      wcag: ['wcag2a', 'wcag412'],
      impact: 'serious',
      selector: 'a.icon-only',
      page: 'https://example.com/',
      html: '<a class="icon-only" href="/cart"><svg></svg></a>',
    },
    {
      ruleId: 'html-has-lang',
      wcag: ['wcag2a', 'wcag311'],
      impact: 'serious',
      selector: 'html',
      page: 'https://example.com/',
      html: '<html>',
    },
    {
      ruleId: 'a11y-statement-missing',
      wcag: [],
      impact: 'serious',
      selector: 'body',
      page: 'https://example.com/',
      html: 'no accessibility statement link found on the home page',
      jurisdictionNote:
        'German BFSG (Barrierefreiheitsstärkungsgesetz) requires an accessibility statement for covered services.',
      jurisdictionCountry: 'DE',
    },
    {
      ruleId: 'region',
      wcag: ['best-practice'],
      impact: 'moderate',
      selector: 'div.legacy-widget',
      page: 'https://example.com/',
      html: '<div class="legacy-widget">Site content outside landmarks</div>',
    },
    {
      ruleId: 'a11y-reflow-320',
      wcag: ['wcag21aa', 'wcag1410'],
      impact: 'moderate',
      selector: 'body',
      page: 'https://example.com/about',
      html: '<table class="pricing">',
    },
    {
      ruleId: 'a11y-pdf-present',
      wcag: [],
      impact: 'moderate',
      selector: '2 pdf link(s)',
      page: 'https://example.com/about',
      html: 'https://example.com/terms.pdf, https://example.com/report.pdf',
    },
  ],
  score: 68,
  error: null,
  errorCode: null,
  createdAt: '2026-08-01T10:00:00.000Z',
  completedAt: '2026-08-01T10:01:30.000Z',
  progress: null,
  planUnlocked,
})

// D-143: вторая ветка карточки «What's at risk» — юрисдикция не определена
// (сайт на .com без schema.org). Используется только audit-own-a11y.mjs, но
// живёт здесь же рядом со своей базовой фикстурой, а не как третья копия.
export const noJurisdictionFixture = () => {
  const base = reportFixture(false)
  return {
    ...base,
    countryCode: null,
    countrySource: 'unknown',
    findings: base.findings.map(({ jurisdictionNote, jurisdictionCountry, ...f }) => f),
  }
}
