// Данные для публичной страницы «что мы проверяем» (/methodology, D-037).
//
// Источник — data/a11y/en301549-coverage.json, который генерирует
// scripts/en301549-coverage.mjs из главы 9 EN 301 549, живых метаданных
// axe-core и списка наших собственных проверок. Сайт НЕ пересчитывает покрытие
// сам и не тянет axe-core в бандл: одна точка правды — скрипт, страница рисует.
// Пересобрать после обновления axe-core: `npm run en301549:coverage`.

import coverageJson from '@data/a11y/en301549-coverage.json'

export type CoverageStatus = 'both' | 'axe' | 'ours' | 'none'

export type CoverageRow = {
  clause: string
  wcag: string
  title: string
  status: CoverageStatus
  axeRules: string[]
  ours: string | null
}

export const coverageRows = coverageJson.rows as CoverageRow[]
export const coverageGeneratedFrom = coverageJson.generatedFrom as string

export const isCovered = (r: CoverageRow) => r.status !== 'none'

export const coverageSummary = {
  total: coverageRows.length,
  covered: coverageRows.filter(isCovered).length,
  get percent() {
    return Math.round((this.covered / this.total) * 100)
  },
}

// Четыре принципа WCAG — первая цифра критерия. Группировка нужна, чтобы
// страница читалась как обзор, а не как выгрузка из 50 строк: полный список
// остаётся, но спрятан в раскрывающийся блок.
const PRINCIPLES = [
  { key: '1', title: 'Perceivable', blurb: 'Content must be presentable in ways people can perceive — text alternatives, captions, contrast, reflow.' },
  { key: '2', title: 'Operable', blurb: 'Interface and navigation must be usable — keyboard access, enough time, clear focus, ways to find pages.' },
  { key: '3', title: 'Understandable', blurb: 'Content and operation must be predictable — language, consistent navigation, help with errors.' },
  { key: '4', title: 'Robust', blurb: 'Content must work with assistive technology, now and as it changes.' },
] as const

export type PrincipleGroup = {
  key: string
  title: string
  blurb: string
  rows: CoverageRow[]
  covered: number
  total: number
}

export function coverageByPrinciple(): PrincipleGroup[] {
  return PRINCIPLES.map((p) => {
    const rows = coverageRows.filter((r) => r.wcag.startsWith(`${p.key}.`))
    return { ...p, rows, covered: rows.filter(isCovered).length, total: rows.length }
  })
}

export const uncoveredRows = () => coverageRows.filter((r) => !isCovered(r))

// Проверки, которых в главе 9 нет вовсе: обязанности из самой директивы
// (заявление о доступности, канал обратной связи) и документы из главы 10.
// В процент покрытия НЕ входят — стандарт описывает техническую доступность,
// а не наличие документов, и смешивать их в одну цифру было бы нечестно.
export const beyondStandard = [
  { label: 'Accessibility statement present and findable', basis: 'Directive (EU) 2019/882' },
  { label: 'Statement actually covers what it must', basis: 'Directive (EU) 2019/882' },
  { label: 'An accessible way to report problems', basis: 'Directive (EU) 2019/882' },
  { label: 'Linked PDF documents flagged', basis: 'EN 301 549 ch. 10' },
] as const
