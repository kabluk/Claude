#!/usr/bin/env node
// Sitemap + robots.txt для сайта (dist/ после SSG-сборки).
// В sitemap попадают только индексируемые URL: профили, ярусы и списки,
// прошедшие порог ≥3 листингов (страницы ниже порога существуют, но с
// noindex — их в sitemap не включаем). Логика слагов зеркалит src/lib/data.ts.

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
// TODO: заменить на боевой домен перед деплоем (продублировано в src/lib/seo.tsx).
const ORIGIN = 'https://accessatlas.example'
const THRESHOLD = 3

if (!existsSync(DIST)) {
  console.error('Нет dist/ — сперва SSG-сборка (npm run build).')
  process.exit(1)
}

const agencies = JSON.parse(readFileSync(join(ROOT, 'data/a11y/agencies.json'), 'utf8'))
const tax = JSON.parse(readFileSync(join(ROOT, 'data/a11y/taxonomies.json'), 'utf8'))

const SERVICE_SEG = {
  audit: 'accessibility-audit',
  remediation: 'accessibility-remediation',
  vpat: 'vpat',
  training: 'accessibility-training',
  monitoring: 'accessibility-monitoring',
  consulting: 'accessibility-consulting',
}
const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const inCountry = (code) =>
  agencies.filter((a) => a.hq.countryCode === code || (a.countriesServed || []).includes(code))

// Imprint и 404 сюда не идут — index=false в самих страницах (Imprint ждёт
// реквизитов владельца, 404 в принципе не индексируется).
const urls = [
  '/', '/scan/', '/methodology/', '/bfsg-check/', '/request-quote/', '/agencies/', '/countries/', '/services/', '/standards/',
  '/about/', '/contact/', '/privacy/',
]
for (const a of agencies) urls.push(`/agencies/${a.slug}/`)

// Гайды: data/a11y/guides/*.md (slug — имя файла), всегда индексируемые.
const GUIDES_DIR = join(ROOT, 'data/a11y/guides')
if (existsSync(GUIDES_DIR)) {
  const { readdirSync } = await import('node:fs')
  const gs = readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.md'))
  if (gs.length) urls.push('/guides/')
  for (const f of gs) urls.push(`/guides/${f.replace(/\.md$/, '')}/`)
}

const services = Object.keys(tax.services)
const standards = Object.keys(tax.standards)

for (const [code, meta] of Object.entries(tax.countries)) {
  const list = inCountry(code)
  if (!list.length) continue
  const cSlug = slugify(meta.name.en)
  if (list.length >= THRESHOLD) urls.push(`/${cSlug}/`)
  for (const s of services) {
    const n = list.filter((a) => (a.services || []).includes(s)).length
    if (n >= THRESHOLD) urls.push(`/${cSlug}/${SERVICE_SEG[s]}/`)
  }
}
for (const s of services) {
  const n = agencies.filter((a) => (a.services || []).includes(s)).length
  if (n >= THRESHOLD) urls.push(`/services/${SERVICE_SEG[s]}/`)
}
for (const s of standards) {
  const n = agencies.filter((a) => (a.standards || []).includes(s)).length
  if (n >= THRESHOLD) urls.push(`/standards/${s}/`)
}

const today = new Date().toISOString().slice(0, 10)
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync(join(DIST, 'sitemap.xml'), xml)
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`)

// Cloudflare Pages/Netlify ищут ровно dist/404.html в корне вывода,
// а не dist/404/index.html (dirStyle: 'nested' пишет именно так). Копируем.
const notFoundNested = join(DIST, '404', 'index.html')
if (existsSync(notFoundNested)) {
  copyFileSync(notFoundNested, join(DIST, '404.html'))
  console.log('✓ 404.html скопирован в корень dist/ (конвенция хостингов)')
} else {
  console.warn('⚠ dist/404/index.html не найден — маршрут /404 не собрался?')
}

console.log(`✓ sitemap: ${urls.length} URL → dist/sitemap.xml (+robots.txt)`)
