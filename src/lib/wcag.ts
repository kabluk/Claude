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
