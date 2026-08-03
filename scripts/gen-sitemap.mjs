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

// _headers внутри dist/ читают и Cloudflare Pages, и Netlify (один формат).
// CSP без 'unsafe-inline' для скриптов: два инлайн-скрипта vite-react-ssg
// (hydration data + hash) разрешаются по sha256, хэши пересчитываются
// на каждой сборке.
// Языковой редирект с корня НЕ пишем в _redirects (формат Netlify с
// условием Language= несовместим с Cloudflare). Его обслуживают:
// Cloudflare — functions/index.js; Netlify — netlify.toml; универсальный
// запасной путь без сервера — dist/index.html (RootRedirect, выбор языка).
const { createHash } = await import('node:crypto')
const inlineHashes = new Set()
for (const lang of ['', ...LANGS]) {
  const dir = lang ? join(DIST, lang) : DIST
  if (!existsSync(dir)) continue
  const files = lang ? [...htmlFiles(dir)] : [join(DIST, 'index.html')].filter(existsSync)
  for (const file of files) {
    const html = readFileSync(file, 'utf8')
    for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      inlineHashes.add(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`)
    }
  }
}
// До открытия detnav.com превью не должно попадать в поисковики
// (правило №7: не публиковать до проверки юристом и носителем испанского).
// Перед настоящим запуском собрать с PUBLIC_LAUNCH=1.
const isLaunch = process.env.PUBLIC_LAUNCH === '1'
const scriptSrc = ['\'self\'', ...inlineHashes].join(' ')
writeFileSync(
  join(DIST, '_headers'),
  `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: geolocation=(), camera=(), microphone=()
${isLaunch ? '' : '  X-Robots-Tag: noindex\n'}  Content-Security-Policy: default-src 'self'; script-src ${scriptSrc}; font-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:
`,
)
console.log(`gen-sitemap: _headers записан (${inlineHashes.size} script-хэшей)`)

writeFileSync(join(DIST, 'sitemap.xml'), xml)
writeFileSync(
  join(DIST, 'robots.txt'),
  isLaunch
    ? `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`,
)
console.log(
  `gen-sitemap: ${urls.length} URL записано в dist/sitemap.xml (${isLaunch ? 'запуск' : 'превью, noindex'})`,
)
