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
  // см. INTERACT ниже.
  '/components/', '/components/accordion/', '/components/tabs/', '/components/modal-dialog/', '/components/toast/',
  // CN-RESEARCH (D-071): индекс отчётов + сам отчёт (таблицы-бары, stat-плитки,
  // JSON-LD Dataset/Report) — обе поверхности под постоянным axe-гейтом.
  '/reports/', '/reports/verified-audit-market/',
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
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }

function filePathFor(urlPath) {
  const clean = urlPath.split('?')[0]
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

// В управляемых dev-средах (Claude Code on the web) Chromium предустановлен по
// фиксированному пути; в обычном CI/локально playwright сам знает, где его
// поставил `npx playwright install` — используем явный путь только если он есть.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium'
const launchOptions = existsSync(PREINSTALLED_CHROMIUM) ? { executablePath: PREINSTALLED_CHROMIUM } : {}
const browser = await chromium.launch(launchOptions)
try {
  const page = await browser.newPage()
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

console.log(
  `\n${totalViolations === 0 ? '✓' : '⚠'} audit-own-a11y: ${SAMPLE_ROUTES.length} страниц, ${totalViolations} нарушени${totalViolations === 1 ? 'е' : 'й'} (${seriousOrWorse} serious/critical)`
)

if (seriousOrWorse > 0) process.exit(1)
