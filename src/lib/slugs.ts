import slugsJson from '@content/slugs.json'
import type { Lang } from './types'

export const SLUGS = slugsJson as Record<string, Record<Lang, string>>

export function pathFor(lang: Lang, key: string): string {
  const slug = SLUGS[key]?.[lang] ?? key
  return slug === '' ? `/${lang}/` : `/${lang}/${slug}/`
}

export const PAGE_KEYS = Object.keys(SLUGS)
