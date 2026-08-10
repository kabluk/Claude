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
// D-108: сторожевой таймаут на ВЕСЬ прогон одного скана. NAV_TIMEOUT_MS покрывает
// только page.goto(); всё остальное (axe.run() внутри page.evaluate, браузерные
// проверки domChecks.js) таймаута не имело вообще — на проде это дало сканы,
// висевшие в status='running' 13 минут и 23 ЧАСА (оба — en.zebrakita.de, Google
// Sites, застряли на РАЗНЫХ страницах, т.е. дело не в конкретной странице).
// `.catch()` вокруг проверок ловит только отклонённый промис, не зависший, —
// поэтому сторож ставится один, снаружи, и покрывает любое будущее зависание.
//
// Потолок: реальные успешные сканы укладываются в 20–40с на 6 страниц; худший
// «медленный, но живой» бюджет навигаций — 8 переходов (главная + заявление +
// возврат + 5 страниц обхода) × NAV_TIMEOUT_MS = 120с. Ставим ровно этот потолок:
// ниже — резали бы живые медленные сайты, выше — пользователь ждёт зря.
const SCAN_TIMEOUT_MS = 120000
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

// Тестовый шов (тот же приём, что env.AXE_SOURCE_URL выше, D-067):
// env.SCAN_TIMEOUT_MS позволяет тесту поставить порог в десятки миллисекунд,
// а эксплуатации — подкрутить потолок через vars без релиза кода. Мусорное или
// неположительное значение молча игнорируется — скан не должен падать из-за
// опечатки в конфиге, он должен работать с дефолтом.
export function resolveScanTimeoutMs(env) {
  const raw = Number(env?.SCAN_TIMEOUT_MS)
  return Number.isFinite(raw) && raw > 0 ? raw : SCAN_TIMEOUT_MS
}

// Закрытие браузера само по себе может залипнуть на той же залипшей сессии, из-за
// которой сработал сторож, — тогда мы бы вернулись ровно к исходному багу, только
// на строчку ниже. Поэтому close() тоже ограничен по времени, а его ошибка
// проглатывается: настоящий результат (или настоящая причина отказа) важнее
// проблемы на разборке, и терять успешный скан из-за неё нельзя.
const CLOSE_TIMEOUT_MS = 5000
async function closeBrowserSafely(browser) {
  let timer
  try {
    await Promise.race([
      browser.close(),
      new Promise((resolve) => { timer = setTimeout(resolve, CLOSE_TIMEOUT_MS) }),
    ])
  } catch {
    // разборка best-effort
  } finally {
    clearTimeout(timer)
  }
}

// Тестовый шов: в тестах сюда подставляется фейковый браузер, чтобы проверить
// поведение сторожа без Browser Rendering (платный ресурс, в CI недоступен).
// В prod-конфиге переменная не задана — идёт обычный puppeteer.launch.
function launchBrowser(env) {
  if (typeof env?.__launchBrowser === 'function') return env.__launchBrowser()
  return puppeteer.launch(env.BROWSER)
}

// CN-SCAN-PHASES (D-067): onProgress(phase, pagesDone, pagesTotal) — репортер
// из worker/lib/progress.js (пишет промежуточные UPDATE в D1). Параметр
// необязателен: без него scanSite работает как раньше (тесты/переиспользование).
// Каждая точка эмиссии стоит РОВНО там, где соответствующая работа реально
// начинается — фазы не выдумываются наперёд (тот же принцип, что D-064).
export async function scanSite(env, targetUrl, onProgress = async () => {}) {
  await onProgress('discovering', 0, null)
  const axeSource = await getAxeSource(env)
  const browser = await launchBrowser(env)
  const findings = []
  const pagesScanned = []

  // Тело скана вынесено в функцию, чтобы целиком отдать его сторожевому таймауту
  // ниже. Ловить каждое отдельное место, где браузер может залипнуть, — заведомо
  // неполный список (D-108); сторож снаружи покрывает и те, что ещё не найдены.
  async function runScan() {
    const page = await browser.newPage()
    await page.setUserAgent(USER_AGENT)
    // D-105: без этого сайты с CSP `script-src 'nonce-…'` (первый живой случай —
    // en.zebrakita.de, Google Sites) блокируют addScriptTag с axe: globalThis.axe
    // остаётся undefined, скан падал «Cannot read properties of undefined
    // (reading 'run')». Обход CSP законен для аудита: мы читаем DOM, а не
    // атакуем страницу; политика сайта защищает его посетителей, не запрещает
    // инструментам смотреть разметку. Вызывать строго ДО первой навигации.
    await page.setBypassCSP(true)
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
      // Диагностируемый отказ вместо «reading 'run'» из недр evaluate: если
      // axe всё же не внедрился (новый способ блокировки, не CSP), пусть в
      // scans.error попадёт понятная строка с URL страницы (D-105).
      const axeAttached = await page.evaluate(() => typeof globalThis.axe?.run === 'function')
      if (!axeAttached) throw new Error(`axe-core failed to attach on ${pageUrl} (page blocked script injection?)`)
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
  }

  const timeoutMs = resolveScanTimeoutMs(env)
  let watchdog
  // Работа и сторож гоняются, а `finally` стоит СНАРУЖИ гонки — по срабатыванию
  // сторожа управление уходит в browser.close() немедленно, не дожидаясь
  // зависшей операции. Именно close() и убивает залипшую сессию Browser
  // Rendering, поэтому утечки ресурса на таймауте нет.
  const work = runScan()
  // Зависшая работа может отклониться ПОЗЖЕ (её оборвёт browser.close()) — без
  // этого обработчика получим unhandled rejection в изоляте уже после того, как
  // scan.js записал failScan. Гонке ниже это не мешает: catch не «съедает» work.
  work.catch(() => {})
  try {
    await Promise.race([
      work,
      new Promise((_resolve, reject) => {
        watchdog = setTimeout(
          // Слово "timeout" в сообщении обязательно: classifyError() (errors.js)
          // матчит именно его и отдаёт фронтенду код `timeout` с готовым текстом.
          // Формулировка «timed out» под этот паттерн НЕ подходит.
          () => reject(new Error(`scan timeout: no result after ${timeoutMs}ms`)),
          timeoutMs,
        )
      }),
    ])
  } finally {
    clearTimeout(watchdog)
    await closeBrowserSafely(browser)
  }

  // Прогресс, записанный в D1 до этого момента, трогать не нужно: таймаут — это
  // просто ещё один путь в .catch() в routes/scan.js, а failScan сам стирает
  // progress_json, как и на любой другой ошибке.
  return { pages: pagesScanned, findings }
}
