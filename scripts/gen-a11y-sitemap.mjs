#!/usr/bin/env node
// Sitemap + robots.txt для сайта каталога (a11y-site/dist после SSG-сборки).
// В sitemap попадают только индексируемые URL: профили, ярусы и списки,
// прошедшие порог ≥3 листингов (страницы ниже порога существуют, но с
// noindex — их в sitemap не включаем). Логика слагов зеркалит
// a11y-site/src/lib/data.ts.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'a11y-site', 'dist')
// TODO: заменить на боевой домен перед деплоем (продублировано в
// a11y-site/src/lib/seo.tsx).
const ORIGIN = 'https://a11y-directory.example'
const THRESHOLD = 3

if (!existsSync(DIST)) {
  console.error('Нет a11y-site/dist — сперва SSG-сборка (npm run build:a11y-site).')
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

const urls = ['/', '/agencies/', '/countries/', '/services/', '/standards/']
for (const a of agencies) urls.push(`/agencies/${a.slug}/`)

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
console.log(`✓ sitemap: ${urls.length} URL → a11y-site/dist/sitemap.xml (+robots.txt)`)
