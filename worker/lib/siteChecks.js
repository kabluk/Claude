// Проверки УРОВНЯ САЙТА — те, что физически невозможно сделать по одной странице
// (D-036). Сканер и раньше обходил до 6 страниц, но смотрел каждую изолированно;
// эти три критерия EN 301 549 требуют СРАВНЕНИЯ страниц между собой, поэтому
// раньше не покрывались ничем — ни axe-core, ни нашими DOM-проверками:
//
//   9.2.4.5 Multiple ways            — есть ли на сайте >1 способа найти страницу
//   9.3.2.3 Consistent navigation    — повторяющаяся навигация в одном порядке
//   9.3.2.4 Consistent identification — одна и та же функция названа одинаково
//
// Чистые функции над массивом {url, html} — без браузера, тестируются напрямую
// на реальных сохранённых страницах (worker/lib/__fixtures__/), не на выдумках.

import { normalizeText, extractAnchors } from './textUtils.js'

// --- 9.2.4.5 Multiple ways ---------------------------------------------------

// WCAG 2.4.5: должно существовать более одного способа найти страницу в наборе
// страниц. Считаем реальные способы: поиск, ссылка на карту сайта, навигационное
// меню. Исключение WCAG «страница — шаг процесса» (корзина, оплата) здесь не
// применяется: мы проверяем сайт целиком, а не отдельный шаг.
const SITEMAP_HINTS = ['sitemap', 'site map', 'plan du site', 'sitemapa', 'mapa del sitio', 'mapa strony', 'sitemappe']

export function detectWayfindingSignals(html) {
  const anchors = extractAnchors(html)
  // Поиск. Признаков намеренно несколько: на реальных сайтах разметка разная, и
  // одного шаблона не хватает. Живая проверка (2026-08-06) на сохранённой главной
  // bundesregierung.de вскрыла это сразу: поиск там есть, но поле называется
  // `search-input`, и первая версия с ТОЧНЫМ совпадением имени (q|s|search|...)
  // его не видела — сайт получил бы ложное «только один способ навигации».
  // Поэтому имя матчим по токену внутри (search-input, suche_feld), а короткие
  // однобуквенные (q, s) — только целиком, иначе «s» совпадёт с чем угодно.
  const hasSearch =
    /<input[^>]+type\s*=\s*["']search["']/i.test(html) ||
    /role\s*=\s*["']search["']/i.test(html) ||
    /<input[^>]+name\s*=\s*["'][^"']*(?:search|suche|szukaj|recherche|buscar|sok|haku|ricerca)[^"']*["']/i.test(html) ||
    /<input[^>]+name\s*=\s*["'](q|s)["']/i.test(html) ||
    /<form[^>]+action\s*=\s*["'][^"']*(?:search|suche|szukaj|recherche|buscar|ricerca)[^"']*["']/i.test(html) ||
    // Ссылка на страницу поиска. Нужна как устойчивый признак для сайтов, где сам
    // виджет поиска монтируется JS'ом: на живом bundesregierung.de поиск — это
    // React-приложение (<div id="bpa-searchapp-react-root">), и в отданном HTML
    // никакого <input> нет вовсе, а ссылка вида /breg-de/suche/... есть всегда.
    // В проде мы читаем page.content() ПОСЛЕ networkidle0, т.е. видим уже
    // отрисованный DOM и нашли бы input — но полагаться только на гидратацию
    // значит выдать ложное «один способ навигации», если она не успела.
    /<a[^>]+href\s*=\s*["'][^"'#]*\/(?:search|suche|szukaj|recherche|buscar|ricerca|sok|haku)\b[^"']*["']/i.test(html)

  const hasSitemapLink = anchors.some(({ href, text }) => {
    const hay = `${normalizeText(text)} ${normalizeText(href)}`
    return SITEMAP_HINTS.some((h) => hay.includes(normalizeText(h)))
  })

  // Навигационное меню: <nav> или role=navigation, содержащий не менее 3 ссылок.
  // Меньше трёх — это не «способ найти страницу», а пара служебных ссылок.
  const navBlocks = html.match(/<nav\b[\s\S]*?<\/nav>/gi) ?? []
  const roleNav = html.match(/<[^>]+role\s*=\s*["']navigation["'][\s\S]{0,20000}?<\/[a-z]+>/gi) ?? []
  const hasNavMenu = [...navBlocks, ...roleNav].some((block) => extractAnchors(block).length >= 3)

  return { hasSearch, hasSitemapLink, hasNavMenu }
}

// Возвращает finding или null. Сайт из ОДНОЙ страницы не проверяем — критерий
// говорит про «набор страниц», для одиночной страницы он неприменим.
export function checkMultipleWays(pages) {
  if (pages.length < 2) return null
  // Достаточно, чтобы способ нашёлся хотя бы на одной странице набора — навигация
  // и поиск обычно в общем шаблоне, но footer-карта сайта может быть не везде.
  const signals = pages.map((p) => detectWayfindingSignals(p.html))
  const ways = []
  if (signals.some((s) => s.hasSearch)) ways.push('search')
  if (signals.some((s) => s.hasSitemapLink)) ways.push('sitemap link')
  if (signals.some((s) => s.hasNavMenu)) ways.push('navigation menu')

  if (ways.length >= 2) return null
  return {
    ruleId: 'a11y-multiple-ways',
    wcag: ['wcag245'],
    impact: 'moderate',
    selector: 'site',
    page: pages[0].url,
    html: `only ${ways.length} way to locate pages detected (${ways.join(', ') || 'none'}); WCAG 2.4.5 expects more than one (e.g. search, sitemap, navigation menu)`,
  }
}

// --- 9.3.2.3 Consistent navigation -------------------------------------------

// Берём ссылки внутри навигационных блоков; сравниваем ОТНОСИТЕЛЬНЫЙ порядок
// только тех, что реально присутствуют на обеих страницах. Так пункты, которых
// на какой-то странице нет (или которые добавлены локально), не считаются
// нарушением — нарушение это именно ПЕРЕСТАНОВКА общих пунктов.
export function extractNavOrder(html) {
  const navBlocks = html.match(/<nav\b[\s\S]*?<\/nav>/gi) ?? []
  const seen = new Set()
  const out = []
  for (const block of navBlocks) {
    for (const { href, text } of extractAnchors(block)) {
      const key = normalizeText(href) || normalizeText(text)
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(key)
    }
  }
  return out
}

// Является ли `common` подпоследовательностью `order` в том же порядке.
function keepsRelativeOrder(order, common) {
  let i = 0
  for (const key of order) {
    if (key === common[i]) i++
    if (i === common.length) return true
  }
  return i === common.length
}

const MIN_COMMON_NAV_ITEMS = 3 // меньше — статистически незначимо, легко дать ложное срабатывание

export function checkConsistentNavigation(pages) {
  const orders = pages.map((p) => ({ url: p.url, order: extractNavOrder(p.html) }))
  const base = orders[0]
  if (!base || base.order.length === 0) return []

  const findings = []
  for (const other of orders.slice(1)) {
    const baseSet = new Set(base.order)
    const common = other.order.filter((k) => baseSet.has(k))
    if (common.length < MIN_COMMON_NAV_ITEMS) continue
    // Порядок общих пунктов в базовой странице
    const commonSet = new Set(common)
    const baseCommon = base.order.filter((k) => commonSet.has(k))
    if (!keepsRelativeOrder(other.order, baseCommon)) {
      findings.push({
        ruleId: 'a11y-inconsistent-navigation',
        wcag: ['wcag323'],
        impact: 'moderate',
        selector: 'nav',
        page: other.url,
        html: `navigation items appear in a different relative order than on ${base.url} (${common.length} shared items compared)`,
      })
    }
  }
  return findings
}

// --- 9.3.2.4 Consistent identification ---------------------------------------

// Одна и та же функция должна называться одинаково. Прокси: одинаковый href с
// РАЗНЫМ видимым текстом на разных страницах. Эвристика намеренно консервативная —
// ложное срабатывание тут дороже пропуска, потому что отчёт читают как
// юридически окрашенный: игнорируем пустые тексты (иконки без подписи), слишком
// короткие (1 символ), и случаи, где одно название содержится в другом
// («Contact» / «Contact us» — то же самое, просто длиннее).
//
// Сравниваем ТОЛЬКО ссылки внутри <nav>. Первая версия смотрела все ссылки
// страницы и дала 5 ложных срабатываний на реальных страницах bundesregierung.de:
// логотип (<a href="/"> с alt «Der Bundesadler, die Flagge…») и текстовая ссылка
// «Bundesregierung | Startseite» ведут на одну страницу и законно названы
// по-разному. Внутри навигации такой неоднозначности нет — там одна и та же
// ссылка обязана называться одинаково, и на тех же реальных страницах
// nav-версия даёт 0 конфликтов из 32 ссылок.
const MIN_LABEL_LEN = 2
const MAX_REPORTED_MISMATCHES = 5

function labelsAgree(a, b) {
  return a === b || a.includes(b) || b.includes(a)
}

function navAnchors(html) {
  const blocks = html.match(/<nav\b[\s\S]*?<\/nav>/gi) ?? []
  return blocks.flatMap((b) => extractAnchors(b))
}

// WCAG 3.2.4 Consistent Identification действует в пределах ОДНОГО набора страниц
// одного языка: тот же компонент на странице ДРУГОГО языка обязан называться иначе
// («countries» на en-странице vs «Länder» на de-странице — это перевод, не нарушение).
// Первая версия сравнивала ярлыки по всем страницам без учёта локали и ложно
// помечала мультиязычные сайты (наш собственный скан verscala.com дал 5 фейков —
// countries/länder, knowledge/wissen, experts/experten…). Поэтому ключ бакета —
// (lang, href): сравниваем ярлыки только внутри одного языка (D-165).
function pageLang(html) {
  const m = /<html[^>]*\blang\s*=\s*["']?([a-zA-Z]{2})/.exec(html || '')
  return m ? m[1].toLowerCase() : ''
}

export function checkConsistentIdentification(pages) {
  // ключ "lang\x00href" -> { href, labels: Map(label -> первая страница) }
  const byKey = new Map()
  for (const { url, html } of pages) {
    const lang = pageLang(html)
    for (const { href, text } of navAnchors(html)) {
      const nhref = normalizeText(href)
      const label = normalizeText(text)
      if (!nhref || label.length < MIN_LABEL_LEN) continue
      if (nhref.startsWith('#') || nhref.startsWith('javascript:')) continue
      const key = `${lang} ${nhref}`
      if (!byKey.has(key)) byKey.set(key, { href: nhref, labels: new Map() })
      const entry = byKey.get(key)
      if (!entry.labels.has(label)) entry.labels.set(label, url)
    }
  }

  const findings = []
  for (const { href, labels } of byKey.values()) {
    if (labels.size < 2) continue
    const list = [...labels.keys()]
    // Нарушение только если есть ДВА взаимно несовместимых названия, а не просто
    // разная длина одного и того же.
    const conflicting = list.filter((a) => list.some((b) => a !== b && !labelsAgree(a, b)))
    if (conflicting.length < 2) continue
    findings.push({
      ruleId: 'a11y-inconsistent-identification',
      wcag: ['wcag324'],
      impact: 'minor',
      selector: `nav a[href="${href}"]`,
      page: labels.get(conflicting[0]),
      html: `same navigation destination labelled differently across pages: ${conflicting.slice(0, 3).map((l) => `"${l}"`).join(' vs ')}`,
    })
    if (findings.length >= MAX_REPORTED_MISMATCHES) break
  }
  return findings
}

// Единая точка входа — вызывается один раз после обхода всех страниц.
export function runSiteChecks(pages) {
  if (!Array.isArray(pages) || pages.length === 0) return []
  const findings = []
  const multipleWays = checkMultipleWays(pages)
  if (multipleWays) findings.push(multipleWays)
  findings.push(...checkConsistentNavigation(pages))
  findings.push(...checkConsistentIdentification(pages))
  return findings
}
