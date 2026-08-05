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

const raw = import.meta.glob('../../../data/a11y/guides/*.md', {
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
