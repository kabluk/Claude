// Сканирование сайта: Browser Rendering (env.BROWSER) + axe-core, инжектится как
// content-script (не через src=CDN — на целевой странице может быть CSP на script-src).
// axe-core версии фиксируется тут же и подтягивается один раз в edge Cache API.
//
// R5 (RISKS.md): ≤6 страниц/скан, таймаут на навигацию, честный user-agent.
//
// 2026-08-06 (A3-*): помимо axe-core теперь проверяем то, с чего реально начинает
// надзор (BACKLOG.md "Сканер: разрыв..."): заявление о доступности (A3-STATEMENT),
// канал обратной связи (A3-FEEDBACK), PDF-документы (A3-PDF), reflow на 320px
// (A3-REFLOW), клавиатурная навигация (A3-KEYBOARD), автовоспроизведение/субтитры
// (A3-MEDIA), увеличение 200% (A3-RESIZE), приоритет транзакционных страниц при
// выборе, какие 6 страниц обходить (A3-PAGESELECT), снятие cookie-баннера перед
// axe.run() (A3-COOKIEBANNER, иначе axe видит перекрытый DOM — классический false
// negative, тот же класс, что D-014).

import puppeteer from '@cloudflare/puppeteer'
import { pickPriorityLinks } from './links.js'
import { findStatementLink, evaluateStatementContent } from './statement.js'
import { detectFeedbackChannel } from './feedback.js'
import { detectPdfLinks } from './pdf.js'
import {
  checkReflow320, checkKeyboardTraversal, checkMedia, checkResize200,
  detectAndDismissCookieBanner, checkEmptyHeadings,
} from './domChecks.js'
import { runSiteChecks } from './siteChecks.js'

const MAX_PAGES = 6
const NAV_TIMEOUT_MS = 15000
const AXE_VERSION = '4.10.2'
const AXE_CDN_URL = `https://cdn.jsdelivr.net/npm/axe-core@${AXE_VERSION}/axe.min.js`
const USER_AGENT = 'VerscalaBot/1.0 (+https://verscala.com/about; accessibility scanner)'
const MAX_PDF_FINDINGS_PER_PAGE = 1 // одна агрегирующая находка на страницу, не по PDF — иначе счёт взрывается

async function getAxeSource(env) {
  // Тестовый шов (D-067): env.AXE_SOURCE_URL позволяет локальному прогону
  // (`wrangler dev --local` в песочнице без выхода на CDN) отдать axe-core со
  // своего фикстур-сервера. В prod-конфиге переменная НЕ задана — идёт CDN,
  // поведение не меняется. Локальный override не кэшируется в edge-кэше.
  const override = env?.AXE_SOURCE_URL
  if (override) {
    const res = await fetch(override)
    if (!res.ok) throw new Error(`axe-core fetch failed: HTTP ${res.status}`)
    return res.text()
  }
  const cache = caches.default
  const cacheKey = new Request(AXE_CDN_URL)
  const cached = await cache.match(cacheKey)
  if (cached) return cached.text()

  const res = await fetch(AXE_CDN_URL)
  if (!res.ok) throw new Error(`axe-core fetch failed: HTTP ${res.status}`)
  const body = await res.text()
  const cacheable = new Response(body, { headers: { 'cache-control': 'public, max-age=604800' } })
  await cache.put(cacheKey, cacheable)
  return body
}

// CN-SCAN-PHASES (D-067): onProgress(phase, pagesDone, pagesTotal) — репортер
// из worker/lib/progress.js (пишет промежуточные UPDATE в D1). Параметр
// необязателен: без него scanSite работает как раньше (тесты/переиспользование).
// Каждая точка эмиссии стоит РОВНО там, где соответствующая работа реально
// начинается — фазы не выдумываются наперёд (тот же принцип, что D-064).
export async function scanSite(env, targetUrl, onProgress = async () => {}) {
  await onProgress('discovering', 0, null)
  const axeSource = await getAxeSource(env)
  const browser = await puppeteer.launch(env.BROWSER)
  const findings = []
  const pagesScanned = []

  try {
    const page = await browser.newPage()
    await page.setUserAgent(USER_AGENT)
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS)

    await page.goto(targetUrl, { waitUntil: 'networkidle0' })
    const homeHtml = await page.content()
    // A3-PAGESELECT: транзакционные/формовые страницы (корзина, вход, контакт)
    // приоритетнее первых-N ссылок в DOM-порядке — жалобы и надзор бьют по ним.
    const toVisit = [targetUrl, ...pickPriorityLinks(homeHtml, targetUrl, MAX_PAGES - 1)]
    const pagesTotal = Math.min(toVisit.length, MAX_PAGES)
    await onProgress('statement', 0, pagesTotal)

    // A3-STATEMENT: ищем заявление о доступности ТОЛЬКО на главной (Anlage 3
    // требует, чтобы оно было "на видном месте" — типично футер/навигация главной).
    const statementLink = findStatementLink(homeHtml, targetUrl)
    let statementHtml = null
    if (statementLink) {
      if (statementLink === targetUrl) {
        statementHtml = homeHtml
      } else {
        // Отдельная навигация СВЕРХ бюджета MAX_PAGES — юридически решающая проверка
        // не должна конкурировать за слот с обычными страницами транзакционного обхода.
        try {
          await page.goto(statementLink, { waitUntil: 'networkidle0' })
          statementHtml = await page.content()
        } catch {
          statementHtml = null // страница недостижима — ссылка есть, но битая; не валим весь скан
        }
        // Возвращаемся на targetUrl — цикл ниже ожидает начать именно с неё (toVisit[0]).
        await page.goto(targetUrl, { waitUntil: 'networkidle0' }).catch(() => {})
      }
    }

    if (!statementLink) {
      findings.push({
        ruleId: 'a11y-statement-missing', wcag: [], impact: 'critical',
        selector: 'body', page: targetUrl,
        html: 'no accessibility statement link found on the home page',
      })
    } else if (statementHtml) {
      const content = evaluateStatementContent(statementHtml)
      if (!content.complete) {
        findings.push({
          ruleId: 'a11y-statement-incomplete', wcag: [], impact: 'serious',
          selector: 'body', page: statementLink,
          html: `accessibility statement is missing: ${content.missingParts.join(', ')}`,
        })
      }
    }

    // A3-FEEDBACK: ищем на главной И на странице заявления (оба паттерна встретились
    // живьём — bundesregierung.de: отдельная страница; impots.gouv.fr: тот же документ).
    const feedback = detectFeedbackChannel(homeHtml + (statementHtml && statementHtml !== homeHtml ? statementHtml : ''))
    if (!feedback.found) {
      findings.push({
        ruleId: 'a11y-feedback-missing', wcag: [], impact: 'serious',
        selector: 'body', page: targetUrl,
        html: 'no accessibility feedback channel (form/email/phone) found',
      })
    }

    let cookieBannerHandled = null
    // D-036: страницы копим для проверок УРОВНЯ САЙТА (9.2.4.5 / 9.3.2.3 / 9.3.2.4) —
    // их нельзя сделать по одной странице, нужно сравнение между страницами.
    const pageDocs = []

    for (const [pageIndex, pageUrl] of toVisit.slice(0, MAX_PAGES).entries()) {
      // D-067: pagesDone = сколько страниц ПОЛНОСТЬЮ пройдено; текущая — pageIndex.
      await onProgress('axe', pageIndex, pagesTotal)
      // Инвариант на входе в цикл: страница уже стоит на targetUrl (либо статьи-заявления
      // не было вовсе, либо мы явно вернулись на неё после её проверки выше) — поэтому
      // для первого элемента toVisit (всегда targetUrl) повторная навигация не нужна.
      if (pageUrl !== targetUrl) {
        await page.goto(pageUrl, { waitUntil: 'networkidle0' })
      }

      // A3-COOKIEBANNER: снимаем баннер ДО axe.run(), иначе axe видит перекрытый DOM,
      // не реальную страницу (классический false negative, тот же класс что D-014).
      const bannerResult = await detectAndDismissCookieBanner(page).catch(() => ({ found: false, dismissed: false, selector: null }))
      if (pageUrl === toVisit[0]) cookieBannerHandled = bannerResult

      await page.addScriptTag({ content: axeSource })
      const results = await page.evaluate(async () => await globalThis.axe.run())
      pagesScanned.push(pageUrl)

      for (const violation of results.violations) {
        const wcag = violation.tags.filter((t) => /^wcag\d/.test(t))
        for (const node of violation.nodes) {
          findings.push({
            ruleId: violation.id,
            wcag,
            impact: violation.impact ?? 'minor',
            selector: node.target.join(' '),
            page: pageUrl,
            html: node.html ? node.html.slice(0, 300) : undefined,
          })
        }
      }

      // D-067: axe для этой страницы закончен, дальше браузерные проверки её же.
      await onProgress('dom-checks', pageIndex, pagesTotal)

      // A3-PDF: PDF в scope EAA/EN 301 549, axe их не видит вообще (не HTML) — без
      // этой проверки целая категория молчаливо не проверяется, не false negative
      // по правилу, а отсутствующая категория целиком.
      const pageHtml = await page.content()
      pageDocs.push({ url: pageUrl, html: pageHtml })
      const pdfLinks = detectPdfLinks(pageHtml, pageUrl)
      if (pdfLinks.length > 0) {
        findings.push({
          ruleId: 'a11y-pdf-present', wcag: [], impact: 'moderate',
          selector: `${pdfLinks.length} pdf link(s)`, page: pageUrl,
          html: pdfLinks.slice(0, MAX_PDF_FINDINGS_PER_PAGE * 5).join(', '),
        })
      }

      // A3-REFLOW / A3-RESIZE / A3-MEDIA — на каждой обойдённой странице, дёшево.
      const reflow = await checkReflow320(page, pageUrl).catch(() => null)
      if (reflow) findings.push(reflow)
      const resize = await checkResize200(page, pageUrl).catch(() => null)
      if (resize) findings.push(resize)
      const media = await checkMedia(page, pageUrl).catch(() => [])
      findings.push(...media)
      const emptyHeadings = await checkEmptyHeadings(page, pageUrl).catch(() => null)
      if (emptyHeadings) findings.push(emptyHeadings)

      // A3-KEYBOARD — только на первой странице (представительно; Tab-обход всех 6
      // стоил бы заметно больше времени скана без пропорциональной пользы).
      if (pageUrl === toVisit[0]) {
        const keyboard = await checkKeyboardTraversal(page, pageUrl).catch(() => [])
        findings.push(...keyboard)
      }
    }

    await onProgress('aggregating', pagesScanned.length, pagesTotal)
    // Проверки уровня сайта — один раз после обхода, на уже собранных страницах.
    // page.content() читается ПОСЛЕ networkidle0, т.е. это отрисованный DOM, а не
    // отданный сервером HTML — существенно для сайтов, где навигация/поиск
    // монтируются JS (см. siteChecks.js, случай bundesregierung.de).
    findings.push(...runSiteChecks(pageDocs))

    if (cookieBannerHandled?.found) {
      // Не находка против сайта (баннер — не нарушение сам по себе), а прозрачность
      // качества скана: сообщаем, что DOM был скорректирован перед проверкой.
      findings.push({
        ruleId: 'scan-meta-cookie-banner-dismissed', wcag: [], impact: 'minor',
        selector: cookieBannerHandled.selector ?? 'unknown', page: toVisit[0],
        html: `cookie/consent banner detected and ${cookieBannerHandled.dismissed ? 'dismissed' : 'left in place (no matching accept button)'} before running axe`,
      })
    }
  } finally {
    await browser.close()
  }

  return { pages: pagesScanned, findings }
}
