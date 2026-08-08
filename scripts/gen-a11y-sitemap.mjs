#!/usr/bin/env node
// Sitemap + robots.txt для сайта (dist/ после SSG-сборки).
// В sitemap попадают только индексируемые URL: профили, ярусы и списки,
// прошедшие порог ≥3 листингов (страницы ниже порога существуют, но с
// noindex — их в sitemap не включаем). Логика слагов зеркалит src/lib/data.ts.

import { readFileSync, writeFileSync, copyFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
// Боевой домен (A0-ORIGIN, куплен 2026-08-08); продублировано в src/lib/seo.tsx.
const ORIGIN = 'https://verscala.com'
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

// 404 сюда не идёт — index=false в самой странице, в принципе не индексируется.
// Imprint индексируется с A0-ORIGIN (реквизиты и домен закрыты, D-089) — в sitemap.
const urls = [
  '/', '/scan/', '/methodology/', '/bfsg-check/', '/request-quote/', '/agencies/', '/countries/', '/services/', '/standards/',
  '/wcag/', '/components/', '/reports/', '/about/', '/contact/', '/privacy/', '/accessibility-statement/', '/imprint/',
]
for (const a of agencies) urls.push(`/agencies/${a.slug}/`)

// CN-WCAG-PAGES (D-066): страницы критериев — из того же JSON, что и сами
// страницы (src/lib/wcag.ts); порог осмысленности тот же: status !== 'none'.
// Слаг — номер WCAG с дефисами. Согласованность охраняет scripts/wcag-pages.test.mjs.
const coverage = JSON.parse(readFileSync(join(ROOT, 'data/a11y/en301549-coverage.json'), 'utf8'))
for (const r of coverage.rows) {
  if (r.status !== 'none') urls.push(`/wcag/${r.wcag.replace(/\./g, '-')}/`)
}

// CN-COMPONENTS (D-068): страницы компонентов — из data/a11y/components.json,
// того же JSON, что и сами страницы (src/lib/componentsLib.tsx). Порог тот же:
// собственную страницу (и место в sitemap) получают только готовые компоненты
// (status === 'ready'). Согласованность охраняет scripts/components.test.mjs.
const componentsData = JSON.parse(readFileSync(join(ROOT, 'data/a11y/components.json'), 'utf8'))
for (const c of componentsData.components) {
  if (c.status === 'ready') urls.push(`/components/${c.slug}/`)
}

// CN-RESEARCH (D-071): страницы отчётов — slug-и берём из src/lib/reports.ts
// (единственный источник правды списка отчётов; регекс ловит только записи
// массива `slug: '…'`, не поля интерфейса без кавычек). Числа отчётов —
// data/a11y/reports.json, гейт согласованности данных — reports-data.test.mjs.
const reportsSrc = readFileSync(join(ROOT, 'src/lib/reports.ts'), 'utf8')
for (const m of reportsSrc.matchAll(/slug:\s*'([^']+)'/g)) urls.push(`/reports/${m[1]}/`)

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

// D-098 (ОТКРЫТО, не исправлено): прямой заход на `/report/:id` отдаёт 404.
// Маршрут динамический (id сканов неограниченны), статического файла под него
// нет. Cloudflare Pages включает SPA-фоллбек ТОЛЬКО когда в корне отсутствует
// `404.html` — а мы его кладём сознательно (строки ниже, конвенция хостингов),
// и он же перехватывает все неизвестные пути раньше любых правил.
// Проверено живьём: `_redirects` с `/report/* /index.html 200` НЕ помогает —
// 404.html имеет приоритет; правило было добавлено и удалено, чтобы не
// оставлять в коде видимость решения. Отдать вместо этого сам 404.html тоже
// не работает: приложение стартует, но маршрут не монтируется — пререндеренная
// разметка 404-страницы не совпадает с тем, что рендерит роутер для отчёта.
// Ломается именно тот сценарий, ради которого отчёт существует («reachable
// only through its private link» на /scan/): свежий сабмит формы работает
// (клиентская навигация), а открытая заново или присланная ссылка — нет.
// Настоящее решение — Pages Functions (`functions/report/[[path]].js`),
// отдающая шелл со статусом 200, ИЛИ client-only-маршрут с собственным
// шеллом. Это отдельный узел: новая поверхность деплоя, нужен свежий контекст.

// D-095: гейт против «кракозябр» в собранном HTML. Повод — реальный дефект,
// найденный на ПРОДЕ: `dist/ireland/accessibility-training/index.html` содержал
// U+FFFD (replacement character) вместо многоточия в placeholder поиска —
// «Search by name or city�…». Исходник (`src/components/FilterableList.tsx`)
// при этом чист, и та же строка на ~30 других страницах того же шаблона
// собралась верно: дефект НЕПОСТОЯННЫЙ (одна страница из 452), поэтому
// разовая правка бессмысленна — нужен гейт, ловящий повтор.
// U+FFFD не может появиться в осмысленном контенте: это маркер «здесь был
// байт, который не удалось декодировать», то есть всегда повреждение.
const htmlFiles = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.html')) htmlFiles.push(full)
  }
}
walk(DIST)
const corrupted = htmlFiles.filter((f) => readFileSync(f, 'utf8').includes('�'))
if (corrupted.length > 0) {
  console.error(
    `\n✗ В собранном HTML найден U+FFFD (повреждённый символ) в ${corrupted.length} файл(ах):`,
  )
  for (const f of corrupted) console.error(`  ${f.slice(DIST.length + 1)}`)
  console.error('Пересоберите; если повторяется — искать источник в контенте/шаблоне.')
  process.exit(1)
}
console.log(`✓ кодировка: U+FFFD не найден ни в одном из ${htmlFiles.length} HTML`)
