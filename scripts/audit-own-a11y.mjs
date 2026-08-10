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
  '/', '/scan/', '/methodology/', '/bfsg-check/', '/request-quote/', '/agencies/', '/agencies/deque-systems/', '/agencies/tpgi/',
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
// Fixture must satisfy the ScanReport contract EXACTLY (src/lib/scanner.ts)
// — parseScanProgress/parsePlanUnlocked and the UI trust its shape. Three
// findings with distinct real axe ruleIds/impacts (image-alt/critical,
// color-contrast/serious, region/moderate) so groupFindingsByRule() yields
// >0 groups and both the findings list and the plan-panel teaser (built
// from groups[0], see LockedPlanPanel) actually render.
const REPORT_FIXTURE_ID = 'fixture-scan-id'
const reportFixture = (planUnlocked) => ({
  id: REPORT_FIXTURE_ID,
  url: 'https://example.com',
  status: 'done',
  pages: ['https://example.com/', 'https://example.com/about'],
  findings: [
    {
      ruleId: 'image-alt',
      wcag: ['wcag2a', 'wcag111'],
      impact: 'critical',
      selector: 'img.hero-logo',
      page: 'https://example.com/',
      html: '<img src="/logo.png" class="hero-logo">',
    },
    {
      ruleId: 'color-contrast',
      wcag: ['wcag2aa', 'wcag143'],
      impact: 'serious',
      selector: '.btn-primary',
      page: 'https://example.com/about',
      html: '<button class="btn-primary">Submit</button>',
    },
    {
      ruleId: 'region',
      wcag: ['best-practice'],
      impact: 'moderate',
      selector: 'div.legacy-widget',
      page: 'https://example.com/',
      html: '<div class="legacy-widget">Site content outside landmarks</div>',
    },
  ],
  score: 68,
  error: null,
  errorCode: null,
  createdAt: '2026-08-01T10:00:00.000Z',
  completedAt: '2026-08-01T10:01:30.000Z',
  progress: null,
  planUnlocked,
})

const REPORT_STATES = [
  { label: '/report/:id (locked)', fixture: reportFixture(false) },
  { label: '/report/:id (unlocked)', fixture: reportFixture(true) },
]

// В управляемых dev-средах (Claude Code on the web) Chromium предустановлен по
// фиксированному пути; в обычном CI/локально playwright сам знает, где его
// поставил `npx playwright install` — используем явный путь только если он есть.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium'
const launchOptions = existsSync(PREINSTALLED_CHROMIUM) ? { executablePath: PREINSTALLED_CHROMIUM } : {}
const browser = await chromium.launch(launchOptions)
try {
  const page = await browser.newPage()
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
  for (const { label, fixture } of REPORT_STATES) {
    // scanner.ts::fetchScan calls `${API_BASE}/api/scan/${id}` (GET). The
    // locked panel's "Get the plan" button would additionally POST
    // `/api/scan/:id/checkout`, but the audit never clicks it, so this
    // single route is enough; `status:'done'` also stops reportPolling.ts
    // from scheduling a second poll (decidePollNext: 'ok'+'done' → keepPolling
    // false), so one fulfilled response per page load is all that's needed.
    await page.route('**/api/scan/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) }),
    )
    await page.goto(`${base}/report/${REPORT_FIXTURE_ID}/`, { waitUntil: 'load' })
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
      page.getByRole('heading', { level: 1, name: /Accessibility report for/ }).waitFor({ timeout: 15000 }).then(() => 'report'),
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
    await page.addScriptTag({ content: AXE_SOURCE })
    const reportAxeResults = await page.evaluate(
      async () => await window.axe.run(document, { rules: { 'target-size': { enabled: true } } })
    )
    results.push({ route: label, violations: reportAxeResults.violations })
    await page.unroute('**/api/scan/**')
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
const pageCount = SAMPLE_ROUTES.length + REPORT_STATES.length
console.log(
  `\n${totalViolations === 0 ? '✓' : '⚠'} audit-own-a11y: ${pageCount} страниц (light), ${totalViolations} нарушени${totalViolations === 1 ? 'е' : 'й'} (${seriousOrWorse} serious/critical)`
)

if (seriousOrWorse > 0) process.exit(1)
