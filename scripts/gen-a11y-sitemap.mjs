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

// G-INDEXNOW (D-178, 2026-08-15): ключ верификации IndexNow-протокола —
// НЕ секрет (наоборот, он обязан быть публично читаем по HTTPS, это и есть
// весь механизм проверки владения доменом у протокола), поэтому спокойно
// живёт в коде, как и остальные публичные константы этого файла. Значение
// зафиксировано раз и навсегда: смена ключа между прогонами обнулила бы уже
// накопленное доверие поисковика к этому ключу.
//
// Продублирован (не импортирован) в scripts/indexnow-ping.mjs — держать в
// синхроне ЗНАЧЕНИЕ, не модуль: этот файл — top-level исполняемый скрипт
// (падает, если нет dist/), импорт константы отсюда потянул бы за собой
// весь запуск генерации sitemap как побочный эффект. Тот же принцип
// дублирования, что jurisdictions.ts/jurisdiction.js в этом проекте — цена
// связности выше цены синхронизации одной строки.
const INDEXNOW_KEY = '2fdd39895be44fab5144134f6bf047f0'

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
//
// A3-CRON-MONITORING-PAGES (D-139): /monitoring/confirm и /monitoring/unsubscribe
// СОЗНАТЕЛЬНО НЕ добавлены в этот список — они noindex/токен-gated (открываются
// только по ссылке из письма, для поиска ценности ноль), ровно как /report/:id.
// Их отсутствие в публичном sitemap зафиксировано как явное исключение с причиной
// в scripts/page-lists.test.mjs (SITEMAP_EXCEPTIONS); a11y-гейт они при этом
// проходят обязательно — они в SAMPLE_ROUTES у audit-own-a11y.mjs.
const urls = [
  '/', '/scan/', '/methodology/', '/bfsg-check/', '/checkers/', '/checkers/contrast-checker/', '/checkers/readability-checker/', '/checkers/color-blindness-simulator/', '/checkers/color-converter/', '/checkers/text-to-speech/', '/checkers/color-palette-generator/', '/request-quote/', '/agencies/', '/countries/', '/services/', '/standards/',
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
// IndexNow требует ключевой файл по адресу <host>/<key>.txt, содержащий
// РОВНО ключ и ничего больше (протокол сверяет байты, не парсит формат).
writeFileSync(join(DIST, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY)

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

// A1-REPORT-DIRECT-LINK / D-103: генерируем dist/report-shell.html — шелл,
// который `functions/report/[[path]].js` отдаёт со статусом 200 на любой
// `/report/*` (см. полный разбор проблемы и двух проваленных попыток в
// комментарии того файла). Строим из уже готового 404.html — та же
// структура <head> (все нужные <script>/<link> для JS-бандла), только:
//   1. Убираем `data-server-rendered="true"` с #root. Это не косметика —
//      клиентский вход vite-react-ssg (node_modules/vite-react-ssg/dist/
//      index.mjs) буквально проверяет этот атрибут через
//      `document.querySelector('[data-server-rendered=true]')`, чтобы
//      выбрать hydrate() или render(). hydrate() требует, чтобы уже
//      отрисованная разметка совпадала с тем, что React отрендерит для
//      ТЕКУЩЕГО URL — а тут в разметке чужая страница (404), поэтому
//      hydrate № и есть та самая уже провалившаяся попытка «отдать
//      404.html как есть». render() — независимый от разметки клиентский
//      рендер с нуля (createRoot(container).render), который смотрит
//      только на window.location — а он всегда настоящий /report/<id>.
//   2. Очищаем содержимое #root (без атрибута оно всё равно будет стёрто
//      render()'ом, но иначе на долю секунды мелькнёт «Page not found»).
//   3. Убираем 404-специфичные <script>-теги (JSON-LD хлебных крошек,
//      __staticRouterHydrationData) — они про несуществующий маршрут.
//   4. Заголовок/OG — нейтральные; `noindex,follow` уже стоит в 404.html
//      (NotFoundPage index={false}) и переносится как есть — важно: теперь
//      этот шелл отвечает 200 на ЛЮБОЙ /report/<что угодно>, включая
//      несуществующие id, так что noindex обязан быть в статической
//      разметке, а не только выставляться клиентом после монтирования.
const shellSrc = join(DIST, '404.html')
if (existsSync(shellSrc)) {
  let shell = readFileSync(shellSrc, 'utf8')
  // Порядок важен: закрывающий #root </div> идёт СРАЗУ ПЕРЕД скриптом
  // __VITE_REACT_SSG_HASH__ (а не перед </body> — между ними ничего, кроме
  // этого скрипта), поэтому сначала убираем __staticRouterHydrationData
  // (он ВНУТРИ #root, до его закрывающего </div>), а уже потом чистим само
  // содержимое #root, привязываясь к соседству с HASH-скриптом — якорь,
  // который держится независимо от того, что именно лежит внутри #root.
  const applied = []
  const step = (label, re, replacement) => {
    const next = shell.replace(re, replacement)
    if (next === shell) throw new Error(`report-shell: шаг «${label}» не нашёл совпадение — 404.html изменил структуру?`)
    shell = next
    applied.push(label)
  }
  step('breadcrumb JSON-LD', /<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
  step('staticRouterHydrationData', /<script>window\.__staticRouterHydrationData[\s\S]*?<\/script>/, '')
  step(
    'очистка #root',
    /(<div id="root")[^>]*(>)[\s\S]*?(<\/div>\s*<script>window\.__VITE_REACT_SSG_HASH__)/,
    '$1$2$3',
  )
  step('заголовок', /<title[^>]*>[^<]*<\/title>/, '<title data-rh="true">Verscala — scan report</title>')
  if (shell.includes('data-server-rendered')) {
    throw new Error('report-shell: data-server-rendered пережил очистку #root — регулярка «очистка #root» не то съела')
  }
  if (!shell.includes('noindex')) {
    throw new Error('report-shell: noindex потерян при генерации — нельзя пускать в индекс произвольные /report/*')
  }
  writeFileSync(join(DIST, 'report-shell.html'), shell)
  console.log(`✓ report-shell.html собран из 404.html (A1-REPORT-DIRECT-LINK): ${applied.join(', ')}`)
} else {
  throw new Error('report-shell: dist/404.html не найден — шелл строить не из чего')
}

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
