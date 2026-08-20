#!/usr/bin/env node
// Дожинаем UX-пробел: сам сайт обязан проходить свои же стандарты (domains/qa.md,
// критерий выхода Фазы 1). Гоняет axe-core через Playwright по dist/ — по 2
// представителя каждого из 14 шаблонов (шаблонный баг повторяется на всех
// инстансах, сканировать все 384 страницы избыточно). Запускать после `npm run build`.
//
// ВАЖНО: страницы отдаются через настоящий локальный HTTP-сервер, не file://.
// Под file:// абсолютные пути вида /assets/app-XXXX.css резолвятся в корень
// файловой системы, а не в dist/ — CSS молча не грузится, и любая проверка на
// цвет/контраст тривиально "проходит" на неокрашенном HTML. Так был потерян
// реальный баг контраста в первой версии этого скрипта (D-014) — не повторять.
//
// ВАЖНО (A2-REPORT-PAYWALL): блок аудита /report/:id ниже требует, чтобы dist/
// был собран с НЕПУСТЫМ VITE_SCANNER_API (build-time inlining, src/lib/
// scanner.ts) — иначе страница отчёта рендерит "Scanner is not configured" и
// paywall-панель не проверяется. CI это делает (ci.yml). Локально:
// `VITE_SCANNER_API=https://audit-fixture.invalid npm run build && npm run audit-a11y`.
// Без значения блок отчёта падает БЫСТРО с понятным сообщением (не 30с-таймаут).

import { readFileSync, existsSync, createReadStream, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'
import { createServer } from 'node:http'
import { chromium } from 'playwright'
import { REPORT_FIXTURE_ID, reportFixture, noJurisdictionFixture } from './lib/report-fixture.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

if (!existsSync(DIST)) {
  console.error('Нет dist/ — сперва сборка (npm run build).')
  process.exit(1)
}

const AXE_SOURCE = readFileSync(join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8')

// 2 представителя на шаблон — покрывает шаблоны из README + /scan (A1-LANDING)
// + /request-quote (A2-LEAD-FORM).
const SAMPLE_ROUTES = [
  '/', '/scan/', '/methodology/', '/bfsg-check/', '/checkers/', '/checkers/contrast-checker/', '/checkers/readability-checker/', '/checkers/color-blindness-simulator/', '/checkers/color-converter/', '/checkers/text-to-speech/', '/checkers/color-palette-generator/', '/checkers/image-color-picker/', '/checkers/accessibility-statement-generator/', '/checkers/alt-text-checker/', '/checkers/heading-structure-checker/', '/request-quote/', '/agencies/', '/agencies/deque-systems/', '/agencies/tpgi/',
  '/countries/', '/germany/', '/united-states/',
  '/germany/accessibility-audit/', '/united-states/vpat/',
  '/services/', '/services/accessibility-audit/',
  '/standards/', '/standards/wcag-2-2/',
  '/guides/', '/guides/wcag-audit-guide/', '/guides/vpat-acr-guide/',
  // G-I18N-CHROME (D-102): гайды с НЕанглийским chrome — отдельные
  // представители, по одному на локаль. Раньше в выборке были только
  // английские, и аудит был слеп ровно к тому, что менялось: переведённые
  // aria-label ориентиров (главная навигация, хлебные крошки, правовая
  // навигация в футере) и <html lang>, отличный от en. Пустой или
  // задвоенный aria-label на локали, которую никто не проверяет, — это
  // молчаливый провал для пользователя скринридера.
  '/guides/bfsg-pflichten-guide/', '/guides/rgaa-guide/', '/guides/audyt-wcag-przewodnik/',
  // CN-WCAG-PAGES (D-066): шаблон WcagCriterionPage — 2 представителя разных
  // форм данных (axe-only с многими правилами; ours-only с оговоркой-эвристикой)
  // + индекс. Слаги детерминированы данными coverage.json.
  '/wcag/', '/wcag/1-3-1/', '/wcag/1-4-10/',
  // CN-COMPONENTS (§22, D-068): собственные интерактивные примеры библиотеки
  // обязаны сами проходить axe — это НЕ разовая проверка. Индекс + все готовые
  // компоненты: у accordion и tabs живой пример присутствует уже в статическом
  // HTML (панель/таб раскрыты по умолчанию), поэтому аудит страницы проверяет
  // сам виджет. У модалки и тоста живой пример появляется только по действию
  // пользователя — их раскрытое/анонсированное состояние аудитируется отдельно,
  // см. INTERACT ниже. У form-field демо тоже статично уже показывает ошибку
  // (поле смонтировано touched=true с невалидным значением) — hint и error
  // одновременно видны, и связаны в aria-describedby, без единого клика, так
  // что отдельного INTERACT не требуется (CN-COMPONENTS-FORM-FIELD).
  // switch демонстрирует ДВА переключателя, изначально в РАЗНЫХ положениях
  // (один on, один off) — оба визуальных состояния уже есть в статическом
  // HTML без единого клика, и у переключателя нет ни попапа, ни скрытого
  // контента, который появлялся бы только по действию (в отличие от
  // modal/toast/combobox/menu-button/listbox-select выше) — второй,
  // "открытый" прогон axe здесь не проверил бы ничего нового, поэтому
  // INTERACT для него не заведён (CN-COMPONENTS-SWITCH).
  // pagination демонстрирует ДВА независимых инстанса, каждый уже в своём
  // граничном состоянии в статическом HTML: первый стартует на странице 1
  // (Previous aria-disabled), второй — на последней странице (Next
  // aria-disabled); усечённый диапазон "…" тоже виден без клика. Как и у
  // Switch, здесь нет попапа/скрытого контента, раскрываемого только по
  // действию — клик лишь переносит aria-current на другую уже присутствующую
  // в DOM кнопку, второй "открытый" прогон axe не проверил бы ничего нового,
  // поэтому INTERACT не заведён (CN-COMPONENTS-PAGINATION).
  // data-table демонстрирует сортируемую таблицу, УЖЕ отсортированную по
  // "Founded" в статическом HTML (initialSort в componentsLib.tsx) — тот же
  // приём, что у Accordion/Switch/Pagination: интересное состояние (реальный
  // aria-sort="ascending" на одном <th>) видно без единого клика. Сама
  // сортировка меняет порядок <tr> в DOM, но не открывает попап и не
  // раскрывает контент, скрытый до клика (в отличие от
  // modal/toast/combobox/menu-button/listbox-select) — второй, "открытый"
  // прогон axe после клика по заголовку не проверил бы ничего нового
  // (тот же принцип, что у Switch/Pagination выше), поэтому INTERACT для
  // него не заведён (CN-COMPONENTS-DATA-TABLE).
  '/components/', '/components/accordion/', '/components/tabs/', '/components/modal-dialog/', '/components/toast/', '/components/tooltip/', '/components/breadcrumbs/', '/components/combobox/', '/components/menu-button/', '/components/listbox-select/', '/components/form-field/', '/components/switch/', '/components/pagination/', '/components/data-table/',
  // CN-RESEARCH (D-071) / CN-RESEARCH-EN301549-AUTOMATION /
  // CN-RESEARCH-JURISDICTION-COVERAGE: индекс отчётов + все три отчёта
  // (таблицы-бары, stat-плитки, JSON-LD Dataset/Report) — под постоянным
  // axe-гейтом.
  '/reports/', '/reports/verified-audit-market/', '/reports/en301549-automation-coverage/', '/reports/jurisdiction-coverage-gap/',
  '/about/', '/contact/', '/privacy/', '/imprint/', '/accessibility-statement/', '/404/',
  // A3-CRON-MONITORING-PAGES (D-139): брендовые страницы confirm/unsubscribe —
  // пререндеренные статические маршруты. БЕЗ ?token= в URL они не делают
  // сетевого вызова и рендерят ветку «нет токена» — её и аудитирует этот проход.
  // Состояния success/error (появляются только после мокнутого ответа воркера)
  // аудитируются отдельным блоком MONITORING_STATES ниже, как /report/:id.
  '/monitoring/confirm/', '/monitoring/unsubscribe/',
]

// Маршруты, где живой пример раскрывается только по действию пользователя:
// после обычного прогона axe скрипт выполняет interact() и гоняет axe ещё раз
// уже по открытому состоянию. Так открытая модалка (focus trap, role=dialog,
// aria-modal) остаётся ПОСТОЯННЫМ гейтом, а не разовой Playwright-проверкой.
const INTERACT = {
  '/components/modal-dialog/': async (page) => {
    await page.click('[data-a11y-demo-open]')
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })
  },
  // CN-COMPONENTS-REST (Toast): the live example is empty until a message fires.
  // Raise the persistent error toast (role=alert, no auto-dismiss) and audit the
  // rendered notification — so the toast's live state stays a PERMANENT gate, not
  // a one-off Playwright check. The alert tone is used precisely because it never
  // auto-dismisses, so it cannot vanish mid-audit.
  '/components/toast/': async (page) => {
    await page.click('[data-a11y-demo-toast]')
    await page.waitForSelector('[role="alert"] .toast-item', { state: 'visible' })
  },
  // CN-COMPONENTS-REST (Tooltip): the bubble exists in the DOM only while the
  // trigger is focused or hovered. Drive it by FOCUS — the trigger keyboard
  // users depend on, and the one a headless run can reproduce deterministically
  // — then audit the open state (role=tooltip, its contrast on its own surface,
  // and the aria-describedby wiring on the trigger).
  '/components/tooltip/': async (page) => {
    await page.focus('[data-a11y-demo-focus]')
    await page.waitForSelector('[role="tooltip"]', { state: 'visible' })
  },
  // CN-COMPONENTS-COMBOBOX: статический HTML страницы содержит только закрытый
  // инпут — сам паттерн (listbox, option, активная опция) появляется лишь по
  // действию пользователя. Кликаем инпут, печатаем подстроку (фильтр сужает
  // список) и жмём ArrowDown, чтобы появилась АКТИВНАЯ опция: тогда второй
  // прогон axe проверяет и контраст подсветки активной опции, и её имя, а не
  // только сам факт наличия списка. Ждём aria-selected="true" — то есть именно
  // ту опцию, на которую указывает aria-activedescendant инпута.
  '/components/combobox/': async (page) => {
    const input = '[data-a11y-demo-combobox] input[role="combobox"]'
    await page.click(input)
    await page.type(input, 'an')
    await page.waitForSelector('[role="listbox"]', { state: 'visible' })
    await page.keyboard.press('ArrowDown')
    await page.waitForSelector('[role="option"][aria-selected="true"]', { state: 'visible' })
  },
  // CN-COMPONENTS-MENU-BUTTON: the static HTML holds only the closed trigger —
  // role=menu/menuitem exist only after the user opens it. Click the button
  // and wait for the menu to become visible, so the second axe pass covers
  // the open menu (its items, roving-tabindex focus target, and contrast on
  // its own popup surface), not just the closed button.
  '/components/menu-button/': async (page) => {
    await page.click('[data-a11y-demo-menu] button[aria-haspopup="menu"]')
    await page.waitForSelector('[role="menu"]', { state: 'visible' })
  },
  // CN-COMPONENTS-LISTBOX-SELECT: the static HTML holds only the closed
  // trigger button — role=listbox/option exist only after the user opens
  // the popup. Click the button and wait for the listbox to become visible,
  // so the second axe pass covers the open popup (its options, the roving-
  // tabindex focus target, and contrast on its own surface), not just the
  // closed button.
  '/components/listbox-select/': async (page) => {
    await page.click('[data-a11y-demo-listbox] button[aria-haspopup="listbox"]')
    await page.waitForSelector('[role="listbox"]', { state: 'visible' })
  },
  // A2-LEAD-FORM: static HTML holds only the empty form — the preview grid
  // (AgencyCard matches, unclaimed note, "Send my request" button, the
  // invisible-until-execute Turnstile widget) exists only after "Preview
  // matching agencies" is clicked (LeadForm.tsx). getByLabel, not #id: the
  // fields' ids come from useId() and aren't stable selectors across builds.
  // Post-send states (sent/send-failed, which need a mocked POST /api/lead)
  // are audited separately below (LEAD_SEND_STATES) — this pass only covers
  // the un-sent preview, same rubric as the INTERACT map everywhere else.
  '/request-quote/': async (page) => {
    await page.getByLabel('Country').selectOption('DE')
    await page.getByLabel('Standard you need to meet').selectOption('wcag-2-2')
    await page.getByLabel('Service').selectOption('audit')
    await page.getByLabel('Budget').selectOption('budget')
    await page.getByLabel('Contact email').fill('audit-fixture@example.com')
    await page.getByRole('button', { name: 'Preview matching agencies' }).click()
    await page.getByRole('heading', { name: 'Agencies that would match' }).waitFor({ state: 'visible' })
  },
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }

function filePathFor(urlPath) {
  const clean = urlPath.split('?')[0]
  // A1-REPORT-DIRECT-LINK: в проде functions/report/[[path]].js перехватывает
  // ЛЮБОЙ путь под /report/ и отдаёт заранее собранный dist/report-shell.html
  // (200, не 404-фоллбек) — /report/:id клиентский маршрут, не пререндерится,
  // dist/report/<id>/index.html никогда не существует. Без этой ветки сервер
  // ниже отдавал бы 404 на любой /report/* запрос, зеркаля прод неверно.
  if (clean === '/report' || clean.startsWith('/report/')) return join(DIST, 'report-shell.html')
  const direct = join(DIST, clean)
  if (existsSync(direct) && statSync(direct).isFile()) return direct
  return join(DIST, clean, 'index.html')
}

const server = createServer((req, res) => {
  const path = filePathFor(req.url)
  if (!existsSync(path)) {
    res.writeHead(404)
    res.end('not found')
    return
  }
  res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' })
  createReadStream(path).pipe(res)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const base = `http://127.0.0.1:${port}`

const results = []

// A1-REPORT-DIRECT-LINK / A2-REPORT-PAYWALL: `/report/:id` is a client-only
// route (routes.tsx catch-all, not in src/routes' getStaticPaths) — it never
// exists as a prerendered file in dist/, so it cannot sit in SAMPLE_ROUTES
// above (that loop skips anything filePathFor() can't find). Its most
// business-critical surface — the €19.99 paywall panel / unlocked-plan
// panel (A2-REPORT-PAYWALL, A2-STRIPE-CHECKOUT) — had only unit-test
// coverage until now. Mounted below by mocking the worker API response
// (src/lib/scanner.ts::fetchScan hits `${API_BASE}/api/scan/:id`) with a
// realistic ScanReport fixture, driving an actual Chromium render, and
// gating it with the same axe run/threshold as every page above.
//
// The fixture itself (REPORT_FIXTURE_ID/reportFixture/noJurisdictionFixture)
// now lives in ./lib/report-fixture.mjs, imported above — check-fold.mjs
// (D-187) needs the same live-rendered report to measure the score's fold
// position, and a second hand copy would drift from this one silently. Full
// rationale for the fixture's shape (why 9 distinct rules, why each field)
// is in that module's own comments, not duplicated here.

const REPORT_STATES = [
  { label: '/report/:id (locked)', fixture: reportFixture(false), heading: /Accessibility report for/ },
  {
    label: '/report/:id (no jurisdiction detected)',
    fixture: noJurisdictionFixture(),
    heading: /Accessibility report for/,
  },
  { label: '/report/:id (unlocked)', fixture: reportFixture(true), heading: /Accessibility report for/ },
  {
    // A2-STRIPE-CHECKOUT tail: ?checkout=success (worker/routes/planCheckout.js
    // success_url) with an already-unlocked fixture — the ReportPage effect
    // shows the "Payment successful" toast (ToastRegion) synchronously, no
    // need to wait out the unlock-poll retry loop it also owns. That loop is
    // covered by src:test (reportPolling-adjacent logic), not here.
    label: '/report/:id (checkout success toast)',
    fixture: reportFixture(true),
    heading: /Accessibility report for/,
    query: '?checkout=success',
  },
  {
    label: '/report/:id (error)',
    heading: /Couldn't scan/,
    // A scan that failed has no findings/score to render — the page shows the
    // honest error message for its errorCode and a "Run a new scan" action.
    fixture: {
      id: REPORT_FIXTURE_ID,
      url: 'https://example.com',
      status: 'error',
      countryCode: null,
      countrySource: null,
      pages: [],
      findings: [],
      score: null,
      error: 'the site blocked our scanner',
      errorCode: 'blocked',
      createdAt: '2026-08-01T10:00:00.000Z',
      completedAt: '2026-08-01T10:00:20.000Z',
      progress: null,
      planUnlocked: false,
    },
  },
]

// A3-CRON-MONITORING-PAGES (D-139): /monitoring/confirm и /monitoring/unsubscribe
// — пререндеренные статические маршруты, но их success/error-состояния существуют
// только ПОСЛЕ клиентского вызова JSON-API воркера (src/lib/monitoring.ts). Мокаем
// ответ точными формами контракта (INTERFACES.md §2), гоним реальный Chromium и
// тот же axe/target-size-гейт. Аудит НИКОГДА не бьёт в живой воркер. no-token
// состояние обеих страниц уже покрыто SAMPLE_ROUTES (там URL без ?token=).
// Определено на уровне модуля (как REPORT_STATES), чтобы длина была видна в
// финальном счётчике страниц, а сам прогон — внутри try с открытым браузером.
const MONITORING_TOKEN = 'a'.repeat(64)
const MONITORING_STATES = [
  {
    label: '/monitoring/confirm/ (success)',
    route: '/monitoring/confirm/',
    glob: '**/api/subscribe/verify**',
    fulfill: { status: 200, body: { subscriptionId: 's', url: 'https://example.com/', verified: true, status: 'active' } },
    ready: /a new issue, a fixed one/,
  },
  {
    label: '/monitoring/confirm/ (error)',
    route: '/monitoring/confirm/',
    glob: '**/api/subscribe/verify**',
    fulfill: { status: 404, body: { error: 'subscription not found for this token', code: 'not_found' } },
    ready: /invalid or has expired/,
  },
  {
    label: '/monitoring/unsubscribe/ (success)',
    route: '/monitoring/unsubscribe/',
    glob: '**/api/subscribe/unsubscribe**',
    fulfill: { status: 200, body: { subscriptionId: 's', url: 'https://example.com/', status: 'unsubscribed', alreadyUnsubscribed: false } },
    ready: /No more monitoring emails/,
  },
  {
    label: '/monitoring/unsubscribe/ (error)',
    route: '/monitoring/unsubscribe/',
    glob: '**/api/subscribe/unsubscribe**',
    fulfill: { status: 404, body: { error: 'subscription not found for this token', code: 'not_found' } },
    ready: /you may already be unsubscribed/,
  },
]

// В управляемых dev-средах (Claude Code on the web) Chromium предустановлен по
// фиксированному пути; в обычном CI/локально playwright сам знает, где его
// поставил `npx playwright install` — используем явный путь только если он есть.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium'
const launchOptions = existsSync(PREINSTALLED_CHROMIUM) ? { executablePath: PREINSTALLED_CHROMIUM } : {}
const browser = await chromium.launch(launchOptions)
try {
  const page = await browser.newPage()
  // D-171: стаб Turnstile для этого прогона — аудит проверяет доступность
  // разметки, а не реальный анти-бот раунд-трип к Cloudflare. dist/ здесь
  // собран с настоящим VITE_TURNSTILE_SITE_KEY (тем же, что в проде — см.
  // deploy.yml), поэтому TurnstileWidget рендерит по-настоящему; в headless
  // Chromium это либо зависает (Turnstile сам распознаёт автоматизированный
  // браузер), либо зависит от сети до challenges.cloudflare.com — оба сценария
  // чужеродны для a11y-гейта и не то, что он проверяет. Стаб определяет
  // window.turnstile ДО того, как TurnstileWidget попытается догрузить
  // настоящий скрипт (loadTurnstileScript коротко замыкается, если
  // window.turnstile уже есть), и резолвит execute() синхронно тем же
  // callback-контрактом, что ждёт настоящий виджет.
  await page.addInitScript(() => {
    const widgets = new Map()
    let nextId = 0
    window.turnstile = {
      render: (_el, opts) => {
        const id = String(nextId++)
        widgets.set(id, opts)
        return id
      },
      remove: (id) => widgets.delete(id),
      execute: (id) => {
        widgets.get(id)?.callback('audit-fixture-turnstile-token')
      },
    }
  })
  // D-073 (реверс части CN-BRANDBOOK/D-072 по прямому указанию владельца,
  // 2026-08-08): тёмной темы больше нет — сайт всегда рендерит светлые
  // значения токенов, поэтому второй проход с emulateMedia({colorScheme:
  // 'dark'}) убран, а не оставлен «на всякий случай». Один проход, светлая
  // палитра — единственная, которую нужно проверять.
  for (const route of SAMPLE_ROUTES) {
    const url = base + route
    if (!existsSync(filePathFor(route))) {
      results.push({ route, error: 'файл не найден' })
      continue
    }
    await page.goto(url, { waitUntil: 'load' })
    await page.addScriptTag({ content: AXE_SOURCE })
    // CN-WCAG22 (§40 конституции): дефолтный axe.run() гоняет все правила,
    // ВКЛЮЧЁННЫЕ по умолчанию, — а `target-size` (единственное wcag22aa-правило
    // в axe-core 4.13) поставляется с enabled:false и без явного включения
    // молча не проверяется. Проверено на axe._audit.rules: без этой строки
    // самопроверка была «WCAG 2.1 AA + best practices», а не 2.2 AA.
    // runOnly:{tags} сознательно НЕ используется — он бы отключил
    // best-practice-правила, которые сейчас тоже держат гейт.
    const axeResults = await page.evaluate(
      async () => await window.axe.run(document, { rules: { 'target-size': { enabled: true } } })
    )
    results.push({ route, violations: axeResults.violations })

    // Второй прогон по раскрытому состоянию (напр. открытая модалка) — то же
    // правило target-size, тот же порог serious/critical.
    if (INTERACT[route]) {
      await INTERACT[route](page)
      const openResults = await page.evaluate(
        async () => await window.axe.run(document, { rules: { 'target-size': { enabled: true } } })
      )
      results.push({ route: `${route} (open)`, violations: openResults.violations })
    }
  }

  // Two mocked states of the same client-only /report/:id route (fixture
  // defined above, outside this try, so its length is available to the
  // final summary too).
  for (const { label, fixture, heading, query } of REPORT_STATES) {
    // scanner.ts::fetchScan calls `${API_BASE}/api/scan/${id}` (GET). The
    // locked panel's "Get the plan" button would additionally POST
    // `/api/scan/:id/checkout`, but the audit never clicks it, so this
    // single route is enough; `status:'done'` also stops reportPolling.ts
    // from scheduling a second poll (decidePollNext: 'ok'+'done' → keepPolling
    // false), so one fulfilled response per page load is all that's needed.
    await page.route('**/api/scan/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) }),
    )
    await page.goto(`${base}/report/${REPORT_FIXTURE_ID}/${query ?? ''}`, { waitUntil: 'load' })
    // Wait for the actual report render, not a timer: ReportBody's own <h1>
    // ("Accessibility report for {url}") only appears once state has reached
    // `{kind:'report'}` with status 'done' — loading/unavailable/not-found
    // states never render it.
    //
    // BUT the report only mounts if the built bundle has a NON-EMPTY
    // VITE_SCANNER_API inlined at build time (src/lib/scanner.ts: apiFetch
    // throws ScannerUnavailableError before any fetch when API_BASE is empty,
    // and the page renders "Scanner is not configured" instead). A plain
    // `npm run build` (no env) produces exactly that — and this block would
    // otherwise hang the full 30s Playwright default on a heading that will
    // never appear, then die with a cryptic TimeoutError. Race the two
    // possible <h1>s (real report vs. "not configured") and fail FAST with an
    // actionable message: this is a build-config problem, not an a11y one.
    // CI builds with a fixture value (ci.yml) so it never hits this branch.
    const rendered = await Promise.race([
      page.getByRole('heading', { level: 1, name: heading }).waitFor({ timeout: 15000 }).then(() => 'report'),
      page.getByRole('heading', { level: 1, name: /Scanner is not configured/ }).waitFor({ timeout: 15000 }).then(() => 'unconfigured'),
    ]).catch(() => 'timeout')
    if (rendered !== 'report') {
      throw new Error(
        `/report/:id did not render (${rendered}) — dist was built without a non-empty VITE_SCANNER_API, ` +
        `so the report page shows "Scanner is not configured" and its paywall panel cannot be audited. ` +
        `Rebuild with a value inlined, e.g.  VITE_SCANNER_API=https://audit-fixture.invalid npm run build  ` +
        `(CI does this in .github/workflows/ci.yml). This is a build-config issue, NOT an accessibility violation.`,
      )
    }
    // A2-STRIPE-CHECKOUT tail: ?checkout=success fires the toast from a
    // useEffect, a beat after the heading above — wait for the actual text
    // instead of racing axe against it (a miss here would silently audit an
    // empty ToastRegion, not the toast itself).
    if (query?.includes('checkout=success')) {
      await page.getByText('Payment successful').waitFor({ timeout: 5000 })
    }
    await page.addScriptTag({ content: AXE_SOURCE })
    const reportAxeResults = await page.evaluate(
      async () => await window.axe.run(document, { rules: { 'target-size': { enabled: true } } })
    )
    results.push({ route: label, violations: reportAxeResults.violations })

    // A4-REPORT-CHECKLIST (D-130): same open-state gate the INTERACT map
    // above applies to /components/accordion/ — done states (not the error
    // state, which returns from a different ReportBody branch before
    // CheckYourselfSection ever renders, so the toggle legitimately doesn't
    // exist there) carry the "Check these yourself" single-item Accordion.
    // Click it open and audit again so the expanded panel (real aria-expanded
    // flip + the actual WCAG-criteria list) stays a permanent gate, not a
    // one-off Playwright check. Waits on aria-labelledby, not a timeout —
    // FindingGroupCard's own "View all N instances" buttons also carry
    // aria-expanded on this page, so a generic [aria-expanded="true"]
    // selector would be ambiguous; the button's real id disambiguates it.
    const checklistToggle = page.getByRole('button', { name: /^Show all \d+ criteria$/ })
    if (await checklistToggle.count()) {
      const btnId = await checklistToggle.getAttribute('id')
      await checklistToggle.click()
      await page.waitForSelector(`[aria-labelledby="${btnId}"]`, { state: 'visible' })
      const openResults = await page.evaluate(
        async () => await window.axe.run(document, { rules: { 'target-size': { enabled: true } } })
      )
      results.push({ route: `${label} (open)`, violations: openResults.violations })
    }
    // D-143: the findings list ships COLLAPSED (first 6 rules) with a
    // severity filter above it — two states that exist only after a click and
    // that carry real ARIA: aria-pressed on the filter buttons, aria-expanded/
    // aria-controls on "Show remaining N". Drive both, then audit: press a
    // severity filter, go back to "All" (so every card is in the DOM again),
    // expand the rest, and re-run the same axe/target-size gate. Same rubric
    // as the INTERACT map above — a state that only a user action can reach
    // becomes a permanent gate, not a one-off Playwright check.
    const severityFilter = page.getByRole('button', { name: /^Critical: \d+ findings?$/ })
    if (await severityFilter.count()) {
      await severityFilter.click()
      await page.getByRole('button', { name: /^All: \d+ findings?$/ }).click()
      const showRemaining = page.getByRole('button', { name: /^Show remaining \d+$/ })
      if (await showRemaining.count()) {
        await showRemaining.click()
        // Wait for the button's own state flip, not a timeout: the label
        // becomes "Show fewer findings" only once the extra cards rendered.
        await page.getByRole('button', { name: 'Show fewer findings' }).waitFor({ timeout: 5000 })
      }
      const expandedResults = await page.evaluate(
        async () => await window.axe.run(document, { rules: { 'target-size': { enabled: true } } })
      )
      results.push({ route: `${label} (findings expanded)`, violations: expandedResults.violations })
    }

    // A3-CRON-SUBSCRIBE-FORM (D-135): the monitoring signup at the foot of a
    // done report has a state that only exists after a real submit — the form
    // is replaced by the double-opt-in success panel, focus is moved into it,
    // and it renders inside a live region. None of that is in the static
    // HTML, so without this pass the audited page would only ever be the
    // empty form. Same rubric as the INTERACT map above: drive the real
    // interaction, then run the same axe/target-size gate on the open state.
    // POST /api/subscribe is mocked with the exact 201 body of the contract
    // (INTERFACES.md §2) — the audit must never hit a live worker.
    const subscribeButton = page.getByRole('button', { name: /Email me when this changes/ })
    if (await subscribeButton.count()) {
      await page.route('**/api/subscribe', (route) =>
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ subscriptionId: 'fixture-subscription-id' }),
        }),
      )
      await page.getByLabel('Your email').fill('audit-fixture@example.com')
      await subscribeButton.click()
      // Wait for the success panel's own text, not a timeout: the request is
      // mocked but still async, and racing axe against it would silently
      // audit the pre-submit form again and report a false "clean".
      await page.getByText('One more step').waitFor({ timeout: 5000 })
      const subscribeResults = await page.evaluate(
        async () => await window.axe.run(document, { rules: { 'target-size': { enabled: true } } })
      )
      results.push({ route: `${label} (subscription sent)`, violations: subscribeResults.violations })
      await page.unroute('**/api/subscribe')
    }
    await page.unroute('**/api/scan/**')
  }

  // A3-CRON-MONITORING-PAGES (D-139): success/error of the two token-gated
  // landing pages, mocked per the contract (see MONITORING_STATES above).
  for (const { label, route, glob, fulfill, ready } of MONITORING_STATES) {
    await page.route(glob, (r) =>
      r.fulfill({ status: fulfill.status, contentType: 'application/json', body: JSON.stringify(fulfill.body) }),
    )
    await page.goto(`${base}${route}?token=${MONITORING_TOKEN}`, { waitUntil: 'load' })
    // Wait for the state's own distinctive copy, not a timeout: the request is
    // mocked but still async, and racing axe against it would silently audit the
    // pre-fetch "working" view instead of the success/error state under test.
    await page.getByText(ready).first().waitFor({ timeout: 15000 })
    await page.addScriptTag({ content: AXE_SOURCE })
    const axeResults = await page.evaluate(
      async () => await window.axe.run(document, { rules: { 'target-size': { enabled: true } } }),
    )
    results.push({ route: label, violations: axeResults.violations })
    await page.unroute(glob)
  }

  // A2-LEAD-API подключение (2026-08-14, domains/product.md «Lead Marketplace»):
  // "Send my request" — реальный POST /api/lead, состояние существует только
  // после клика (LeadForm.tsx stage 'sent'/'send-failed'). Мокаем ответ точной
  // формой контракта (worker/routes/lead.js: 201 {leadId, matched} · 4xx),
  // аудит НИКОГДА не бьёт в живой воркер. Preview-состояние (до отправки) уже
  // покрыто через INTERACT['/request-quote/'] выше — здесь только пост-send.
  // matched-слаги — реальные агентства, уже в SAMPLE_ROUTES выше.
  const LEAD_SEND_STATES = [
    {
      label: '/request-quote/ (sent)',
      status: 201,
      body: { leadId: 'fixture-lead-id', matched: ['deque-systems', 'tpgi'] },
      ready: /Request sent/,
    },
    {
      label: '/request-quote/ (send failed)',
      status: 429,
      body: { error: 'rate limit exceeded', code: 'rate_limited' },
      ready: /Too many requests/,
    },
  ]
  for (const { label, status, body, ready } of LEAD_SEND_STATES) {
    await page.route('**/api/lead', (r) =>
      r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }),
    )
    await page.goto(`${base}/request-quote/`, { waitUntil: 'load' })
    await page.getByLabel('Country').selectOption('DE')
    await page.getByLabel('Standard you need to meet').selectOption('wcag-2-2')
    await page.getByLabel('Service').selectOption('audit')
    await page.getByLabel('Budget').selectOption('budget')
    await page.getByLabel('Contact email').fill('audit-fixture@example.com')
    await page.getByRole('button', { name: 'Preview matching agencies' }).click()
    await page.getByRole('button', { name: 'Send my request' }).click()
    // Wait for the state's own distinctive copy, not a timeout: the request is
    // mocked but still async, and racing axe against it would silently audit
    // the pre-response "Sending…" view instead of the sent/failed state.
    await page.getByText(ready).first().waitFor({ timeout: 15000 })
    await page.addScriptTag({ content: AXE_SOURCE })
    const axeResults = await page.evaluate(
      async () => await window.axe.run(document, { rules: { 'target-size': { enabled: true } } }),
    )
    results.push({ route: label, violations: axeResults.violations })
    await page.unroute('**/api/lead')
  }
} finally {
  await browser.close()
  server.close()
}

let totalViolations = 0
let seriousOrWorse = 0
for (const r of results) {
  if (r.error) {
    console.log(`⚠ ${r.route} — ${r.error}`)
    continue
  }
  if (!r.violations.length) {
    console.log(`✓ ${r.route} — чисто`)
    continue
  }
  totalViolations += r.violations.length
  for (const v of r.violations) {
    const nodeCount = v.nodes.length
    if (v.impact === 'serious' || v.impact === 'critical') seriousOrWorse++
    console.log(`✗ ${r.route} — [${v.impact}] ${v.id}: ${v.help} (${nodeCount} узл${nodeCount === 1 ? '' : 'ов'})`)
    console.log(`  ${v.helpUrl}`)
  }
}

// SAMPLE_ROUTES.length + REPORT_STATES.length: /report/:id — не пререндеренный
// файл, а два мокнутых состояния одного клиентского маршрута (locked/unlocked
// paywall-панели), поэтому в счётчик страниц идёт отдельно от статического цикла.
const pageCount = SAMPLE_ROUTES.length + REPORT_STATES.length + MONITORING_STATES.length
console.log(
  `\n${totalViolations === 0 ? '✓' : '⚠'} audit-own-a11y: ${pageCount} страниц (light), ${totalViolations} нарушени${totalViolations === 1 ? 'е' : 'й'} (${seriousOrWorse} serious/critical)`
)

if (seriousOrWorse > 0) process.exit(1)
