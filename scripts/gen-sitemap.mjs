#!/usr/bin/env node
// Генерирует sitemap.xml с hreflang-альтернативами после сборки.
// Каждая страница знает свои версии на других языках через slugs.json.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const ORIGIN = 'https://detnav.com'

const slugs = JSON.parse(readFileSync(join(ROOT, 'content/slugs.json'), 'utf8'))
const LANGS = ['en', 'es', 'ru']

const urls = []
for (const key of Object.keys(slugs)) {
  const variants = LANGS.map((l) => ({
    lang: l,
    path: slugs[key][l] === '' ? `/${l}/` : `/${l}/${slugs[key][l]}/`,
  }))
  for (const v of variants) {
    urls.push({ loc: `${ORIGIN}${v.path}`, alts: variants })
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
${u.alts
  .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${ORIGIN}${a.path}"/>`)
  .join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${u.alts[0].path}"/>
  </url>`,
  )
  .join('\n')}
</urlset>
`

if (!existsSync(DIST)) {
  console.error('gen-sitemap: dist/ не найден — сначала соберите сайт')
  process.exit(1)
}

// SSG рендерит <html lang="en"> из index.html для всех страниц.
// Проставляем настоящий язык по каталогу: dist/{en,es,ru}/**.
const { readdirSync, statSync } = await import('node:fs')
function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) yield* htmlFiles(p)
    else if (entry.endsWith('.html')) yield p
  }
}
let patched = 0
for (const lang of LANGS) {
  const dir = join(DIST, lang)
  if (!existsSync(dir)) continue
  for (const file of htmlFiles(dir)) {
    const html = readFileSync(file, 'utf8')
    const fixed = html.replace(/<html lang="[a-z-]*"/i, `<html lang="${lang}"`)
    if (fixed !== html) {
      writeFileSync(file, fixed)
      patched++
    }
  }
}
console.log(`gen-sitemap: атрибут lang исправлен в ${patched} файлах`)

writeFileSync(join(DIST, 'sitemap.xml'), xml)
writeFileSync(
  join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`,
)
console.log(`gen-sitemap: ${urls.length} URL записано в dist/sitemap.xml`)
