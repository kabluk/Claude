// Загрузчик редакционных гайдов: data/a11y/guides/*.md → объекты с
// JSON-frontmatter (между --- строками) и HTML-телом (marked, на этапе
// сборки). Битый frontmatter валит сборку с внятной ошибкой — молча
// не пропускаем.

import { marked } from 'marked'
import type { StandardSlug, A11yLocale } from '@data/a11y/types'

export interface GuideDoc {
  slug: string
  locale: A11yLocale
  title: string
  description: string
  standard?: StandardSlug
  countryCode?: string
  updated: string
  faq: { q: string; a: string }[]
  cta?: { label: string; path: string }
  relatedAgencies: string[]
  html: string // тело, уже отрендеренное из markdown
  words: number
}

const raw = import.meta.glob('../../data/a11y/guides/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parse(path: string, src: string): GuideDoc {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) throw new Error(`Guide ${path}: no frontmatter block`)
  type GuideMeta = Omit<GuideDoc, 'html' | 'words' | 'faq' | 'relatedAgencies'> &
    Partial<Pick<GuideDoc, 'faq' | 'relatedAgencies'>>
  let meta: GuideMeta
  try {
    meta = JSON.parse(m[1])
  } catch (e) {
    throw new Error(`Guide ${path}: frontmatter is not valid JSON (${(e as Error).message})`)
  }
  for (const f of ['slug', 'locale', 'title', 'description', 'updated'] as const) {
    if (!meta[f]) throw new Error(`Guide ${path}: missing frontmatter field "${f}"`)
  }
  const body = m[2].trim()
  return {
    ...meta,
    faq: meta.faq ?? [],
    relatedAgencies: meta.relatedAgencies ?? [],
    html: marked.parse(body, { async: false }),
    words: body.split(/\s+/).length,
  }
}

export const guides: GuideDoc[] = Object.entries(raw)
  .map(([p, src]) => parse(p, src))
  .sort((a, b) => a.title.localeCompare(b.title))

export const guideBySlug = (slug: string) => guides.find((g) => g.slug === slug)

// Гайды, релевантные стандарту/стране — для перелинковки со списочных страниц.
export const guidesFor = (opts: { standard?: StandardSlug; countryCode?: string }) =>
  guides.filter(
    (g) =>
      (opts.standard && g.standard === opts.standard) ||
      (opts.countryCode && g.countryCode === opts.countryCode),
  )

// G-INTERLINK-AUDIT (2026-08-15): у гайда САМОГО ПО СЕБЕ раньше не было
// ссылок на другие гайды — только на агентства. Индекс `/guides/` линкует на
// все 27, поэтому формально ни один не orphan, но SEO-план (п.6) специально
// требует связей ГУЩЕ, чем один центральный список: краулер и посетитель
// должны иметь путь от гайда к гайду напрямую. Логика матчинга — в
// guideRelations.ts (см. его шапку — вынесена ради тестируемости, эта строка
// выше, import.meta.glob, ломает импорт модуля вне Vite-сборки).
export { relatedGuidesFor } from './guideRelations'
import { relatedGuidesFor as relatedGuidesForImpl } from './guideRelations'
export const relatedGuides = (g: GuideDoc, limit = 4): GuideDoc[] => relatedGuidesForImpl(guides, g, limit)
