// CN-WCAG-PAGES (конституция §20/§43, D-066): страницы /wcag/[criterion] строятся
// ТОЛЬКО из data/a11y/en301549-coverage.json — той же единственной точки правды,
// что и /methodology/ (см. coverage.ts). Никаких ручных списков критериев.
//
// Порог осмысленности (R1, §44 — thin-content): страница генерируется только для
// критерия, по которому автоматика реально что-то проверяет (status !== 'none',
// т.е. ≥1 axe-правило и/или собственный модуль воркера). Критерии со status
// 'none' собственных страниц НЕ получают — сверх названия сказать нечего; они
// честно перечислены на индексе /wcag/ как «manual review only». Прецедент
// порога — индексация списков от ≥3 листингов (routes.tsx/gen-a11y-sitemap.mjs).
// Та же логика продублирована в scripts/gen-a11y-sitemap.mjs (общий источник —
// JSON) и охраняется scripts/wcag-pages.test.mjs.

import { coverageRows, isCovered, type CoverageRow } from './coverage'

// Слаг из номера WCAG SC: '1.4.3' → '1-4-3'. Из номера, не из названия —
// название критерия принадлежит данным и не должно менять URL при регенерации.
export const wcagSlug = (wcag: string) => wcag.replace(/\./g, '-')

export type WcagPage = {
  slug: string
  row: CoverageRow
}

export const wcagPages: WcagPage[] = coverageRows
  .filter(isCovered)
  .map((row) => ({ slug: wcagSlug(row.wcag), row }))

export const wcagPageBySlug = (slug: string) => wcagPages.find((p) => p.slug === slug)

// Какой критерий тестирует правило сканера — по той же единственной точке
// правды (en301549-coverage.json), что и сами страницы /wcag/. Нужно отчёту
// (D-143): карточка находки ведёт на УЖЕ существующую публичную страницу
// критерия вместо того, чтобы показывать сырой ruleId и ничего больше.
export const wcagPageForRule = (ruleId: string): WcagPage | undefined =>
  wcagPages.find((p) => p.row.ours === ruleId || p.row.axeRules.includes(ruleId))

// Сосед по списку покрытых критериев — для перелинковки prev/next.
export const wcagNeighbours = (slug: string) => {
  const i = wcagPages.findIndex((p) => p.slug === slug)
  return {
    prev: i > 0 ? wcagPages[i - 1] : undefined,
    next: i >= 0 && i < wcagPages.length - 1 ? wcagPages[i + 1] : undefined,
  }
}

// Что делает каждый СОБСТВЕННЫЙ модуль воркера — по одному предложению на
// ruleId. Каждая формулировка выведена из реального кода воркера (файл указан),
// не выдумана; оговорки про эвристики — из комментариев/строк finding'ов там же.
// Новый ruleId в coverage.json без записи здесь валит scripts/wcag-pages.test.mjs
// — описание обязано появиться вместе с проверкой, не «когда-нибудь».
export const OURS_DESCRIPTIONS: Record<string, { does: string; caveat?: string }> = {
  'a11y-video-no-captions': {
    does: 'flags <video> elements that have no captions or subtitles track', // worker/lib/domChecks.js
  },
  'a11y-autoplay-media': {
    does: 'flags audio or video that starts playing automatically without a mute or pause control', // worker/lib/domChecks.js
  },
  'a11y-resize-200': {
    does: 'applies 200% zoom in a real browser and flags content that overflows horizontally', // worker/lib/domChecks.js
    caveat: 'zoom is applied via CSS, an approximation of browser zoom — an honest limitation, not an exact simulation',
  },
  'a11y-reflow-320': {
    does: 'loads the page in a real 320 px-wide viewport and flags horizontal scrolling', // worker/lib/domChecks.js
    caveat: 'the WCAG exception for data tables and maps is not detected — a flagged table may be legitimate',
  },
  'a11y-keyboard-trap': {
    does: 'walks the page with the Tab key in a real browser and flags focus that cannot move past an element', // worker/lib/domChecks.js
  },
  'a11y-focus-order': {
    does: 'flags a tab order that repeatedly jumps backwards through the document, naming positive tabindex values when they are the cause', // worker/lib/domChecks.js
    caveat: 'a modal or custom widget may reorder focus legitimately — single jumps are ignored for that reason',
  },
  'a11y-focus-invisible': {
    does: 'flags a focused element that shows no visible outline or box-shadow', // worker/lib/domChecks.js
    caveat: 'heuristic — custom focus styles built from other CSS properties can trigger a false positive',
  },
  'a11y-empty-heading': {
    does: 'flags headings that contain no text and no accessible name', // worker/lib/domChecks.js
  },
  'a11y-multiple-ways': {
    does: 'checks the scanned set of pages for at least two ways to find content — search, a sitemap link, or a navigation menu', // worker/lib/siteChecks.js
  },
  'a11y-inconsistent-navigation': {
    does: 'compares the relative order of shared navigation items across the scanned pages', // worker/lib/siteChecks.js
  },
  'a11y-inconsistent-identification': {
    does: 'flags the same navigation destination labelled with conflicting names on different pages', // worker/lib/siteChecks.js
  },
}

// Правила, которые ВНЕ главы 9 EN 301 549 (в coverage.json их нет вовсе):
// собственные проверки воркера про заявление о доступности, канал обратной
// связи и PDF-документы. Ручное зеркало `BEYOND_STANDARD_INFO` из
// worker/lib/pdfPlan.js (воркер — plain ESM, общего модуля с фронтендом нет,
// D-010) — но формулировка здесь описывает НАХОДКУ («чего не хватает»), а не
// требование («что должно быть»): в плане это пункт чек-листа, в отчёте —
// заголовок карточки конкретной проблемы.
// `basis` — дословно из того же worker/lib/pdfPlan.js: правовое/нормативное
// основание проверки. Без него карточка называла бы находку «best-practice
// правилом», что неверно: требование заявления о доступности — не вкусовщина,
// а Directive (EU) 2019/882.
export const BEYOND_STANDARD_INFO: Record<string, { title: string; basis: string }> = {
  'a11y-statement-missing': { title: 'No accessibility statement found', basis: 'Directive (EU) 2019/882' },
  'a11y-statement-incomplete': { title: 'Accessibility statement is incomplete', basis: 'Directive (EU) 2019/882' },
  'a11y-feedback-missing': { title: 'No accessible way to report problems', basis: 'Directive (EU) 2019/882' },
  'a11y-pdf-present': { title: 'Linked PDF documents need a manual check', basis: 'EN 301 549 ch. 10' },
}

// D-143 / D-131 ГРАНИЦА. Публичная (бесплатная) справка о правиле для карточки
// находки на /report/:id. Собирается ТОЛЬКО из данных сайта, которые и так
// опубликованы на /wcag/ и /methodology/: название критерия, ссылка на его
// страницу, описание СОБСТВЕННОЙ проверки воркера. Здесь сознательно нет
// ничего из `ScanFinding.help` / `helpUrl` / `failureSummary` — подсказки
// axe-core «как это чинить» остаются тем, за что берут деньги (D-131), и
// доходят до пользователя только в PDF-плане за серверным гейтом. Функция
// чистая: принимает ruleId, а не находку, — передать сюда help физически
// нечем.
export type PublicRuleInfo = {
  /** Человеческий заголовок карточки; null — только когда сказать честно
   *  нечего (best-practice-правило axe вне главы 9), тогда UI показывает сам
   *  ruleId моноширинным, а не выдуманное название. */
  title: string | null
  /** Страница критерия на нашем сайте, если мы её публикуем. */
  page: WcagPage | null
  /** Что делает наша собственная проверка (та же строка, что на /wcag/). */
  ours: string | null
  /** Честное ограничение нашей проверки, если оно записано. */
  caveat: string | null
  /** Основание для правил вне главы 9 (директива / глава EN 301 549). */
  basis: string | null
}

export function publicRuleInfo(ruleId: string): PublicRuleInfo {
  const page = wcagPageForRule(ruleId) ?? null
  const ours = page?.row.ours === ruleId ? OURS_DESCRIPTIONS[ruleId] : undefined
  const beyond = BEYOND_STANDARD_INFO[ruleId]
  return {
    title: page?.row.title ?? beyond?.title ?? null,
    page,
    ours: ours?.does ?? null,
    caveat: ours?.caveat ?? null,
    basis: beyond?.basis ?? null,
  }
}
