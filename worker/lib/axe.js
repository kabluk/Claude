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
//
// 2026-08-10 (SCAN-RESILIENCE, продолжение D-108/D-110/D-112): «одна плохая
// страница не убивает скан». Снаружи прогон уже охраняют сторож 120с (D-108),
// реап на GET (D-109) и busy-ретрай очереди на 429 (D-112) — но ВНУТРИ прогон
// был хрупким: любая осечка на любой из 6 страниц валила весь скан целиком.
// Четыре изменения, каждое против наблюдавшегося на проде класса отказа:
//   1) навигация по `domcontentloaded` + ограниченное «успокоение» сети сверху
//      вместо `networkidle0` (сайты с непрерывной аналитикой/long-poll не
//      затихают НИКОГДА — раньше это был гарантированный NAV_TIMEOUT на весь скан);
//   2) изоляция подстраниц: отказ подстраницы → пропуск + мета-находка
//      `scan-meta-page-skipped`, отказ ГЛАВНОЙ по-прежнему валит скан (без
//      главной отчёт бессмыслен);
//   3) один перезапуск браузерной сессии за скан на «Protocol error / Target
//      closed» (D-110, серия №4) — уже собранные находки сохраняются;
//   4) блокировка мусорного трафика (media + аналитика/трекеры) на перехвате
//      запросов — решение владельца 2026-08-10.

import puppeteer from '@cloudflare/puppeteer'
import { pickPriorityLinks } from './links.js'
import { findStatementLink, evaluateStatementContent } from './statement.js'
import { detectFeedbackChannel } from './feedback.js'
import { detectPdfLinks } from './pdf.js'
import {
  checkReflow320, checkKeyboardTraversal, checkMedia, checkResize200,
  detectAndDismissCookieBanner, checkEmptyHeadings,
} from './domChecks.js'
import { resolveCountry } from './siteCountry.js'
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

// SCAN-RESILIENCE. Критерий готовности страницы — `domcontentloaded`, а сеть
// «успокаивается» СВЕРХУ и с потолком. Почему не `networkidle0` (как было):
// он ждёт 500мс полной тишины в сети и на сайтах с непрерывной аналитикой,
// чатами, long-poll или видео-плеером не наступает никогда — навигация упиралась
// в NAV_TIMEOUT_MS и роняла ВЕСЬ скан на живом, прекрасно отрисованном сайте.
// Так же поступают Lighthouse и Pa11y: загрузка + ограниченное ожидание тишины.
// 4с — компромисс: типичный сайт затихает за 0.3–1.5с (то есть в норме мы ждём
// РОВНО столько же, сколько ждал networkidle0, регрессии по времени нет), а
// вечно шумящий отдаёт свои 4с и идёт дальше вместо 15с и падения.
// Ожидание тишины НЕ является условием успеха: таймаут проглатывается.
export const SETTLE_MS = 4000
const NETWORK_IDLE_TIME_MS = 500 // столько тишины считаем «затихло» (дефолт puppeteer)

// SCAN-RESILIENCE. Худший случай по времени (комментарий обязателен — сторож
// D-108 остаётся ЕДИНСТВЕННОЙ внешней границей, внутренние бюджеты обязаны быть
// посчитаны):
//   типичный скан 6 страниц: 8 навигаций × (0.5–3с загрузки + ≤1.5с успокоения)
//     ≈ 16–35с — как раньше (SETTLE в норме короче, чем ожидание networkidle0);
//   худший случай на одну страницу: goto 15с + повтор goto 15с + 4с успокоения
//     = 34с; шесть таких страниц дали бы ~170с — то есть худший случай упирается
//     в сторож 120с и обрывается им. Это ШТАТНО и осознанно: занижать
//     NAV_TIMEOUT_MS ради арифметической влезаемости значило бы резать живые
//     медленные сайты ради несуществующего сценария «все 6 страниц битые».
const NAV_RETRIES = 1 // один повтор навигации: сетевые осечки чаще разовые, чем стойкие

// SCAN-RESILIENCE. Ровно ОДИН перезапуск браузера за скан. Больше не нужно:
// повторная смерть сессии — это уже не случайность платформы, а свойство
// сайта/аккаунта, и второй перезапуск лишь удвоит расход платного ресурса
// перед тем же исходом.
export const MAX_BROWSER_RESTARTS = 1

// SCAN-RESILIENCE. Смерть браузерной СЕССИИ ≠ отказ страницы: первое лечится
// перезапуском браузера, второе — пропуском страницы, и перепутать их дорого
// (перезапуск на каждой битой странице = 6 оплаченных браузеров; пропуск при
// мёртвой сессии = 6 пропусков и пустой отчёт). Различаем по тексту ошибки
// плюс по browser.isConnected().
//
// Формулировки НЕ придуманы «по смыслу», а выписаны из исходника установленного
// @cloudflare/puppeteer 1.3.0 (`lib/esm/puppeteer/`) — первая версия этого
// паттерна содержала две НЕсуществующие строки («WebSocket is not open»,
// «browser has disconnected») и упускала реальную («Session already detached»).
// Что библиотека бросает на самом деле:
//   common/CallbackRegistry.js:69  new TargetCloseError('Target closed')
//   cdp/Page.js:185                new TargetCloseError('Target closed')
//   cdp/Connection.js:84           'Protocol error: Connection closed.'
//   cdp/Connection.js              `Protocol error (${method}): Session closed. …`
//   cdp/Page.js:836                'Protocol error: Connection closed. Most likely the page has been closed.'
//   cdp/CDPSession.js:88           `Session already detached. Most likely the ${targetType} has been closed.`
// «Session already detached» может означать смерть одной страницы, а не всей
// сессии, — перезапуск браузера всё равно верное лечение: другого способа
// получить рабочую страницу у нас нет.
// НЕ включены намеренно (это отказ СТРАНИЦЫ, лечится её пропуском):
// 'Navigating frame was detached', 'Waiting failed: Frame detached',
// 'Execution context is not available in detached frame or worker'.
const SESSION_DEAD_RE = /Protocol error|Target closed|Session closed|Connection closed|Session already detached/i

// SCAN-RESILIENCE (решение владельца 2026-08-10): мусорный трафик режем на
// перехвате запросов. Блокируем ТОЛЬКО то, что не влияет на отрисовку:
// resourceType 'media' (видео/аудио — мегабайты, которые axe не смотрит) и
// известные аналитики/трекеры. НЕ блокируем images/stylesheets/fonts/scripts/
// xhr/fetch: проверка контраста считает реальные цвета, а domChecks — реальный
// DOM; сайт с зарезанным CSS дал бы фантомные нарушения контраста и reflow.
// Список намеренно КОНСЕРВАТИВНЫЙ (крупные, однозначно телеметрические домены):
// ложное срабатывание тут — это молча испорченная страница в отчёте, а выигрыш
// от каждого следующего домена всё меньше.
export const TRACKER_HOST_BLOCKLIST = Object.freeze([
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'connect.facebook.net',
  'hotjar.com',
  'clarity.ms',
  'mc.yandex.ru',
  'segment.com',
  'segment.io',
  'mixpanel.com',
  'amplitude.com',
])

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

// Тот же шов, что resolveScanTimeoutMs, и по той же причине: тесту нужно
// «успокоение сети» в единицы миллисекунд, иначе каждый прогон фейкового
// браузера честно отстаивал бы свои 4с на навигацию. Мусор → дефолт.
export function resolveSettleMs(env) {
  const raw = Number(env?.SETTLE_MS)
  return Number.isFinite(raw) && raw > 0 ? raw : SETTLE_MS
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
// SCAN-RESILIENCE: сессия Browser Rendering по умолчанию живёт 60с без
// активности и умирает — а наш сторож (D-108) даёт скану до 120с. Разрыв между
// этими числами и есть один из источников «Protocol error … Target closed»
// посреди скана. `keep_alive` поддержан установленной версией
// @cloudflare/puppeteer 1.3.0 — проверено по исходнику
// node_modules/@cloudflare/puppeteer/src/cloudflare/PuppeteerWorkers.ts:
// `WorkersLaunchOptions.keep_alive?: number` (допустимо 10_000…600_000мс,
// дефолт 60_000), уходит в searchParams запроса на acquire. Ставим 180с —
// чуть больше сторожа, чтобы сессию гарантированно закрывали МЫ (close в
// finally), а не платформа посреди работы. Опция расширяет сессию на Paid;
// на Free лишнего расхода не создаёт — браузер всё равно закрывается сразу
// после скана.
const KEEP_ALIVE_MS = 180000
function launchBrowser(env) {
  if (typeof env?.__launchBrowser === 'function') return env.__launchBrowser()
  return puppeteer.launch(env.BROWSER, { keep_alive: KEEP_ALIVE_MS })
}

// SCAN-RESILIENCE. Матч по HOSTNAME запроса и только на границе поддомена:
// `substring` по URL заблокировал бы честную страницу
// `example.com/blog/hotjar.com-review`, а `endsWith('hotjar.com')` без точки —
// домен `nothotjar.com`.
export function isTrackerHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/\.$/, '')
  return TRACKER_HOST_BLOCKLIST.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

// Чистая функция — вся политика блокировки в одном месте и тестируется без браузера.
export function shouldBlockRequest(url, resourceType) {
  // Документ верхнего уровня не блокируем НИКОГДА, даже если его хост в списке:
  // иначе скан самого google-analytics.com (или сайта на их поддомене) падал бы
  // с ERR_BLOCKED_BY_CLIENT, а classifyError прочитал бы это как 'blocked' —
  // то есть мы обвинили бы сайт в том, что сделали сами.
  if (resourceType === 'document') return false
  if (resourceType === 'media') return true
  let hostname
  try {
    hostname = new URL(url).hostname
  } catch {
    return false // неразбираемый URL (data:, blob:) — пусть решает браузер
  }
  return isTrackerHost(hostname)
}

// С включённым перехватом КАЖДЫЙ запрос обязан получить continue() или abort() —
// иначе он висит до таймаута навигации и страница «загружается» вечно. Поэтому
// хендлер устроен так, что любое исключение внутри всё равно заканчивается
// ответом на запрос, а гонка (запрос уже отвечен/сессия умерла) гасится: её
// исход всё равно ничего не меняет.
async function installRequestFilter(page) {
  // Порядок обязателен: сначала ХЕНДЛЕР, потом включение перехвата. Наоборот —
  // это окно (пусть в миллисекунды), в котором перехват уже включён, а отвечать
  // на запросы некому: каждый такой запрос висит до таймаута навигации. Обратный
  // порядок безвреден: без включённого перехвата событие 'request' всё равно
  // приходит, а continue() на нём просто бросает — и это ловится ниже.
  page.on('request', (request) => {
    const settle = (promise) => {
      if (promise && typeof promise.catch === 'function') promise.catch(() => {})
    }
    let block = false
    try {
      block = shouldBlockRequest(request.url(), request.resourceType())
    } catch {
      block = false // не смогли решить — пропускаем: пропустить лишнее дешевле, чем подвесить
    }
    try {
      settle(block ? request.abort('blockedbyclient') : request.continue())
    } catch {
      try {
        settle(request.continue())
      } catch {
        // запрос уже отвечен, перехват не включён или сессия мертва — делать нечего
      }
    }
  })
  await page.setRequestInterception(true)
}

export function isSessionDead(browser, err) {
  const message = err?.message ?? String(err ?? '')
  if (SESSION_DEAD_RE.test(message)) return true
  try {
    // isConnected() есть у puppeteer-браузера; у самодельного фейка может не быть —
    // отсутствие метода не должно само по себе означать «сессия жива/мертва».
    return typeof browser?.isConnected === 'function' && browser.isConnected() === false
  } catch {
    return false
  }
}

// Причина пропуска страницы попадает в отчёт, который читает человек: сырой
// стектрейс там не нужен, но и «page failed» без подробностей — потерянная
// диагностика. Первая строка, обрезанная по длине html-поля находки.
const MAX_SKIP_REASON_CHARS = 200
function shortReason(err) {
  const message = (err?.message ?? String(err ?? 'unknown error')).split('\n')[0].trim()
  return message.length > MAX_SKIP_REASON_CHARS ? `${message.slice(0, MAX_SKIP_REASON_CHARS)}…` : message
}

// Навигация SCAN-RESILIENCE: критерий готовности — domcontentloaded, тишина сети
// сверху и с потолком (см. SETTLE_MS). Собственный таймер вокруг
// waitForNetworkIdle стоит намеренно: у метода есть свой `timeout`, но урок
// D-108 — «`.catch()` ловит отклонённый промис, а не зависший», и единственная
// гарантия здесь — наш собственный таймер.
async function gotoSettled(page, url, settleMs) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS })
  if (typeof page.waitForNetworkIdle !== 'function') return
  let timer
  try {
    await Promise.race([
      page.waitForNetworkIdle({ idleTime: NETWORK_IDLE_TIME_MS, timeout: settleMs }),
      new Promise((resolve) => { timer = setTimeout(resolve, settleMs) }),
    ])
  } catch {
    // Сеть не затихла за отведённое время — страница всё равно считается готовой.
    // Это НЕ ошибка навигации: именно из-за обратного допущения networkidle0
    // ронял скан на сайтах с постоянной телеметрией.
  } finally {
    clearTimeout(timer)
  }
}

// CN-SCAN-PHASES (D-067): onProgress(phase, pagesDone, pagesTotal) — репортер
// из worker/lib/progress.js (пишет промежуточные UPDATE в D1). Параметр
// необязателен: без него scanSite работает как раньше (тесты/переиспользование).
// Каждая точка эмиссии стоит РОВНО там, где соответствующая работа реально
// начинается — фазы не выдумываются наперёд (тот же принцип, что D-064).
//
// A4-SITE-COUNTRY: countryCodeOverride — тот же countryCode, что уже приходит
// в POST /api/scan для юрисдикции (worker/lib/jurisdiction.js), пробрасывается
// сюда consumer'ом (scanJob.js) как есть, отдельным параметром, а не через
// env/сообщение — это тот же факт от пользователя, просто нужен ДВУМ разным
// эвристикам (юридической и валютной), которые намеренно не делят код
// (см. worker/lib/siteCountry.js header).
export async function scanSite(env, targetUrl, onProgress = async () => {}, countryCodeOverride) {
  await onProgress('discovering', 0, null)
  const axeSource = await getAxeSource(env)
  const settleMs = resolveSettleMs(env)
  // SCAN-RESILIENCE: `let`, а не `const` — браузер может быть пересоздан посреди
  // скана (см. restartBrowser). `finally` внизу закрывает ТЕКУЩИЙ, старый
  // закрывается в момент перезапуска.
  let browser = await launchBrowser(env)
  let browserRestarts = 0
  let scanAborted = false // взводится в finally: гонка сторожа с перезапуском браузера
  const findings = []
  const pagesScanned = []
  // A4-SITE-COUNTRY: default до фактического обнаружения (главная навигация
  // может ещё не случиться, если скан упадёт раньше — тогда return ниже и не
  // будет достигнут, но переменная всё равно должна существовать заранее).
  let detectedCountry = { code: null, source: 'unknown' }

  // Тело скана вынесено в функцию, чтобы целиком отдать его сторожевому таймауту
  // ниже. Ловить каждое отдельное место, где браузер может залипнуть, — заведомо
  // неполный список (D-108); сторож снаружи покрывает и те, что ещё не найдены.
  async function runScan() {
    // Вся обвязка страницы — в одном месте: после перезапуска браузера страницу
    // надо пересоздать ЦЕЛИКОМ и точно так же, а «почти так же» здесь означает
    // тихо другой скан (без bypassCSP — не внедрится axe, без перехвата — вернётся
    // мусорный трафик).
    async function preparePage() {
      const fresh = await browser.newPage()
      await fresh.setUserAgent(USER_AGENT)
      // D-105: без этого сайты с CSP `script-src 'nonce-…'` (первый живой случай —
      // en.zebrakita.de, Google Sites) блокируют addScriptTag с axe: globalThis.axe
      // остаётся undefined, скан падал «Cannot read properties of undefined
      // (reading 'run')». Обход CSP законен для аудита: мы читаем DOM, а не
      // атакуем страницу; политика сайта защищает его посетителей, не запрещает
      // инструментам смотреть разметку. Вызывать строго ДО первой навигации.
      await fresh.setBypassCSP(true)
      fresh.setDefaultNavigationTimeout(NAV_TIMEOUT_MS)
      // Перехват — оптимизация, а не условие скана: если Browser Rendering его
      // не даст (живьём не проверено — платный ресурс), сканируем без фильтра,
      // а не роняем ВЕСЬ сканер из-за экономии трафика.
      await installRequestFilter(fresh).catch(() => {})
      return fresh
    }

    let page = await preparePage()
    // Где стоит страница по нашим сведениям. Заменяет прежний неявный инвариант
    // «перед циклом мы на targetUrl»: после перезапуска браузера или неудачного
    // возврата с заявления это уже неправда, и раньше axe молча запускался НЕ НА
    // ТОЙ странице (навигация возврата глушилась `.catch(() => {})`).
    let currentUrl = null
    async function navigate(url) {
      currentUrl = null
      await gotoSettled(page, url, settleMs)
      currentUrl = url
    }
    // Один повтор: разовая сетевая осечка/редирект-гонка лечится повтором, а
    // стойкая проблема всё равно проявится вторым разом. По мёртвой сессии
    // повтор бессмыслен — пусть решает уровень выше (перезапуск браузера).
    async function navigateWithRetry(url) {
      for (let attempt = 0; ; attempt += 1) {
        try {
          await navigate(url)
          return
        } catch (err) {
          if (attempt >= NAV_RETRIES || isSessionDead(browser, err)) throw err
        }
      }
    }
    // Перезапуск браузерной сессии. Падение самого перезапуска (в том числе 429
    // «Unable to create new browser») НЕ глушится: скан падает целиком с этой
    // ошибкой, и busy-ретрай уровня очереди (D-112) подхватит её штатно.
    // Старый браузер закрывается ДО запуска нового и best-effort: две живые
    // сессии разом — лишний шанс упереться в лимит параллельных сессий.
    async function restartBrowser() {
      browserRestarts += 1
      await closeBrowserSafely(browser)
      browser = await launchBrowser(env)
      // Сторож (D-108) мог сработать ровно в окно между close и launch — тогда
      // `finally` внизу уже закрыл СТАРЫЙ браузер, а этот новый не закроет никто
      // и оплаченная сессия провисела бы до keep_alive. Закрываем сами.
      if (scanAborted) {
        await closeBrowserSafely(browser)
        throw new Error('scan aborted during browser restart')
      }
      page = await preparePage()
      currentUrl = null
    }

    // Главная — с повтором: разовая осечка на ней стоит всего скана (без главной
    // нет ни выборки страниц, ни заявления). Смерть сессии ЗДЕСЬ перезапуском не
    // лечится — скан ещё ничего не собрал, дешевле дать очереди перезапустить
    // джоб целиком, чем усложнять фазу discovering.
    await navigateWithRetry(targetUrl)
    const homeHtml = await page.content()
    // A4-SITE-COUNTRY: same homeHtml already captured for pickPriorityLinks/
    // findStatementLink/detectFeedbackChannel below — no second fetch. Override
    // (if any) wins inside resolveCountry regardless of what html/TLD say.
    detectedCountry = resolveCountry({ html: homeHtml, url: targetUrl, countryCodeOverride })
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
          await navigate(statementLink)
          statementHtml = await page.content()
        } catch {
          statementHtml = null // страница недостижима — ссылка есть, но битая; не валим весь скан
        }
        // Возвращаемся на targetUrl. Ошибку по-прежнему глушим, но теперь она не
        // остаётся незамеченной: currentUrl сброшен в null, и цикл ниже честно
        // навигирует на главную сам, вместо того чтобы запустить axe на странице
        // заявления, думая, что стоит на главной.
        await navigate(targetUrl).catch(() => {})
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

    // Работа по ОДНОЙ странице. Ничего не пишет в общие findings/pagesScanned
    // напрямую — только возвращает свой урожай, и зовущий вливает его лишь при
    // успехе. Иначе повтор страницы после перезапуска браузера удваивал бы
    // находки первой (частичной) попытки, а пропущенная страница оставляла бы
    // в отчёте огрызок «половина проверок» — молча и неотличимо от полного прохода.
    async function scanOnePage(pageUrl, pageIndex) {
      const pageFindings = []
      const isHome = pageIndex === 0
      // Навигация нужна, если мы не там, где думаем. Для главной сразу после
      // discovering это обычно false — лишний переход экономится, как и раньше.
      if (currentUrl !== pageUrl) await navigateWithRetry(pageUrl)

      // A3-COOKIEBANNER: снимаем баннер ДО axe.run(), иначе axe видит перекрытый DOM,
      // не реальную страницу (классический false negative, тот же класс что D-014).
      const bannerResult = await detectAndDismissCookieBanner(page).catch(() => ({ found: false, dismissed: false, selector: null }))

      await page.addScriptTag({ content: axeSource })
      // Диагностируемый отказ вместо «reading 'run'» из недр evaluate: если
      // axe всё же не внедрился (новый способ блокировки, не CSP), пусть в
      // scans.error попадёт понятная строка с URL страницы (D-105). На ГЛАВНОЙ
      // это по-прежнему конец скана; на подстранице — причина её пропуска.
      const axeAttached = await page.evaluate(() => typeof globalThis.axe?.run === 'function')
      if (!axeAttached) throw new Error(`axe-core failed to attach on ${pageUrl} (page blocked script injection?)`)
      const results = await page.evaluate(async () => await globalThis.axe.run())

      for (const violation of results.violations) {
        const wcag = violation.tags.filter((t) => /^wcag\d/.test(t))
        for (const node of violation.nodes) {
          pageFindings.push({
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
      const pdfLinks = detectPdfLinks(pageHtml, pageUrl)
      if (pdfLinks.length > 0) {
        pageFindings.push({
          ruleId: 'a11y-pdf-present', wcag: [], impact: 'moderate',
          selector: `${pdfLinks.length} pdf link(s)`, page: pageUrl,
          html: pdfLinks.slice(0, MAX_PDF_FINDINGS_PER_PAGE * 5).join(', '),
        })
      }

      // A3-REFLOW / A3-RESIZE / A3-MEDIA — на каждой обойдённой странице, дёшево.
      const reflow = await checkReflow320(page, pageUrl).catch(() => null)
      if (reflow) pageFindings.push(reflow)
      const resize = await checkResize200(page, pageUrl).catch(() => null)
      if (resize) pageFindings.push(resize)
      const media = await checkMedia(page, pageUrl).catch(() => [])
      pageFindings.push(...media)
      const emptyHeadings = await checkEmptyHeadings(page, pageUrl).catch(() => null)
      if (emptyHeadings) pageFindings.push(emptyHeadings)

      // A3-KEYBOARD — только на первой странице (представительно; Tab-обход всех 6
      // стоил бы заметно больше времени скана без пропорциональной пользы).
      if (isHome) {
        const keyboard = await checkKeyboardTraversal(page, pageUrl).catch(() => [])
        pageFindings.push(...keyboard)
      }

      return { pageFindings, pageDoc: { url: pageUrl, html: pageHtml }, bannerResult }
    }

    for (const [pageIndex, pageUrl] of toVisit.slice(0, MAX_PAGES).entries()) {
      // D-067: pagesDone = сколько страниц ПОЛНОСТЬЮ пройдено; текущая — pageIndex.
      // Пропуск страницы прогресс не тормозит: pagesDone идёт по индексу обхода.
      await onProgress('axe', pageIndex, pagesTotal)
      const isHome = pageIndex === 0

      let harvest = null
      let failure = null
      try {
        harvest = await scanOnePage(pageUrl, pageIndex)
      } catch (err) {
        // Три разных исхода одного catch — и путать их нельзя:
        if (isSessionDead(browser, err) && browserRestarts < MAX_BROWSER_RESTARTS) {
          // (1) умерла СЕССИЯ: перезапускаем браузер и доигрываем эту же страницу.
          // Уже собранные findings/pagesScanned остаются — терять полскана из-за
          // разрыва соединения с платформой незачем.
          await restartBrowser()
          try {
            harvest = await scanOnePage(pageUrl, pageIndex)
          } catch (retryErr) {
            if (isHome) throw retryErr
            failure = retryErr
          }
        } else if (isHome) {
          // (2) отказ ГЛАВНОЙ: без неё отчёт бессмыслен (нет ни выборки страниц,
          // ни заявления, ни базовой картины) — валим скан целиком, как раньше.
          throw err
        } else {
          // (3) отказ ПОДстраницы: пропускаем её, скан продолжается.
          failure = err
        }
      }

      if (harvest) {
        pagesScanned.push(pageUrl)
        findings.push(...harvest.pageFindings)
        pageDocs.push(harvest.pageDoc)
        if (isHome) cookieBannerHandled = harvest.bannerResult
      } else {
        // Не находка против сайта, а прозрачность качества скана (тот же тон и
        // прецедент, что scan-meta-cookie-banner-dismissed): пользователь должен
        // видеть, что страницу проверить не удалось, а не думать, что она чистая.
        findings.push({
          ruleId: 'scan-meta-page-skipped', wcag: [], impact: 'minor',
          selector: 'body', page: pageUrl,
          html: `page skipped, scan continued without it: ${shortReason(failure)}`,
        })
      }
    }

    await onProgress('aggregating', pagesScanned.length, pagesTotal)
    // Проверки уровня сайта — один раз после обхода, на уже собранных страницах.
    // page.content() читается ПОСЛЕ загрузки и успокоения сети (SCAN-RESILIENCE;
    // раньше — после networkidle0), т.е. это отрисованный DOM, а не отданный
    // сервером HTML — существенно для сайтов, где навигация/поиск монтируются JS
    // (см. siteChecks.js, случай bundesregierung.de). Пропущенные страницы в
    // pageDocs не попадают: сравнивать надо реально увиденное, иначе половина
    // site-checks сработает на пустоте.
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
    scanAborted = true
    // `browser` — переменная, а не константа (SCAN-RESILIENCE): закрываем тот
    // браузер, который актуален СЕЙЧАС, включая пересозданный посреди скана.
    await closeBrowserSafely(browser)
  }

  // Прогресс, записанный в D1 до этого момента, трогать не нужно: таймаут — это
  // просто ещё один путь в .catch() в routes/scan.js, а failScan сам стирает
  // progress_json, как и на любой другой ошибке.
  return { pages: pagesScanned, findings, country: detectedCountry }
}
