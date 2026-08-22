#!/usr/bin/env node
// Гейт «главный ответ виден без прокрутки на телефоне» (D-187).
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ГЕЙТ. За один день 2026-08-20 этот класс регрессии
// выстрелил ДВАЖДЫ, и оба раза все существующие проверки остались зелёными:
//   1. G-CHECKERS-ELEVATION: поля новой .panel сузили внутреннюю ширину
//      358 → 310px, ряд кнопок контраст-чекера (нужно ровно 355px) перенёсся
//      в столбик, +51px по вертикали — и коэффициент контраста уехал на
//      881px при экране 844px.
//   2. G-CHECKER-IMAGEPICKER: первая компоновка (загрузка → канва → палитра
//      → результат) утащила выбранный цвет к y≈1400.
// Разметка при этом валидна, контраст в норме, ссылки целы — axe и check-links
// принципиально не умеют это видеть, потому что вопрос не «корректно ли», а
// «попадает ли на экран». Ловилось только ручным измерением, то есть держалось
// на внимании человека — ровно то, что положено автоматизировать.
//
// ЧТО ИМЕННО ПРОВЕРЯЕТСЯ. Источник истины — класс `.result-hero` из
// дизайн-системы: он и означает «единственный главный ответ этого экрана»
// (см. src/styles.css). Поэтому гейт не знает ничего про конкретные страницы
// и не ломается от переименования полей — он спрашивает у самой системы,
// что считать ответом.
//
// Меряется НЕ коробка героя, а само значение внутри неё — элемент с самым
// крупным кеглем (в дизайн-системе главный ответ всегда набран крупно, это
// и есть его признак). Требование: низ этого элемента внутри экрана, то есть
// число реально читается без прокрутки.
//
// Первая версия гейта требовала «минимум N пикселей коробки героя на экране»
// и была НЕВЕРНОЙ: на контраст-чекере и пикере она падала при том, что число
// целиком помещалось (низ на 834 и 817 при экране 844) — порог мерил обёртку,
// а не ответ, и был подобран на глаз. Строгое «весь герой целиком» тоже не
// годится: у генератора заявления ответ — длинный текст, он физически не
// помещается, и такое правило заставило бы резать контент или отключать
// проверку. Мера должна совпадать с тем, что волнует человека: видно ли
// значение.
//
// ВАЖНО: страницы отдаются настоящим локальным HTTP-сервером, не file:// —
// та же причина, что в audit-own-a11y.mjs (D-014): под file:// не грузится
// CSS, а без CSS вся геометрия бессмысленна и проверка «проходит» всегда.

import { existsSync, createReadStream, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'
import { createServer } from 'node:http'
import { chromium } from 'playwright'
import { REPORT_FIXTURE_ID, reportFixture } from './lib/report-fixture.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

if (!existsSync(DIST)) {
  console.error('Нет dist/ — сперва сборка (npm run build).')
  process.exit(1)
}

// iPhone-класс, самый ходовой узкий вьюпорт. Владелец проекта работает
// с телефона — это его экран, а не абстрактный «мобильный брейкпоинт».
const VIEWPORT = { width: 390, height: 844 }

// Страницы, у которых есть единственный главный ответ. Список ведётся руками
// осознанно: не всякий чекер имеет «одно число» (симулятор дальтонизма
// показывает три картинки, там героя нет), и молчаливое «на странице не нашли
// .result-hero, ну и ладно» — это ровно тот способ, которым гейт незаметно
// перестаёт что-либо проверять.
const PAGES = [
  { path: '/checkers/contrast-checker/', what: 'коэффициент контраста' },
  { path: '/checkers/readability-checker/', what: 'сводка читабельности' },
  { path: '/checkers/color-converter/', what: 'сконвертированные значения' },
  { path: '/checkers/image-color-picker/', what: 'выбранный цвет' },
  {
    // /report/:id — клиентский маршрут (routes.tsx catch-all), никогда не
    // существует как файл в dist/, и без мока API рендерит либо "Scanner is
    // not configured", либо бесконечно ждёт ответа воркера. Та же фикстура
    // (планово заблокированный отчёт — самая частая ветка, которую видит
    // пользователь), что audit-own-a11y.mjs гоняет через axe; здесь измеряем
    // только положение score-героя. setup() ставит мок ДО navigate.
    path: `/report/${REPORT_FIXTURE_ID}/`,
    what: 'оценка отчёта (score)',
    async setup(page) {
      await page.route('**/api/scan/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reportFixture(false)) }),
      )
    },
  },
]

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml',
}

const server = createServer((req, res) => {
  const p = decodeURIComponent((req.url || '/').split('?')[0])
  // /report/:id — тот же особый случай, что в audit-own-a11y.mjs
  // (A1-REPORT-DIRECT-LINK): в проде functions/report/[[path]].js отдаёт
  // report-shell.html на ЛЮБОЙ /report/* путь, потому что маршрут клиентский
  // и dist/report/<id>/index.html никогда не существует.
  let file = p === '/report' || p.startsWith('/report/') ? join(DIST, 'report-shell.html') : join(DIST, p)
  if (!p.startsWith('/report')) {
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html')
    } catch {
      /* ниже отдадим 404 */
    }
  }
  if (!existsSync(file)) {
    res.writeHead(404)
    return res.end('not found')
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' })
  createReadStream(file).pipe(res)
})

await new Promise((r) => server.listen(0, r))
const PORT = server.address().port

// Та же конвенция, что в audit-own-a11y.mjs: в управляемых dev-средах
// (Claude Code on the web) Chromium лежит по фиксированному пути, в обычном
// CI/локально playwright знает сам после `npx playwright install`.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium'
const browser = await chromium.launch(
  existsSync(PREINSTALLED_CHROMIUM) ? { executablePath: PREINSTALLED_CHROMIUM } : {},
)
const failures = []
const rows = []

for (const { path, what, setup } of PAGES) {
  const ctx = await browser.newContext({ viewport: VIEWPORT })
  const page = await ctx.newPage()
  if (setup) await setup(page)
  await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' })

  // Инструменты, которым нужен вход (image picker без картинки героя не имеет),
  // активируются так же, как это сделал бы человек при первом заходе.
  const sample = page.getByRole('button', { name: /sample/i }).first()
  if (await sample.count()) {
    await sample.click()
    await page.waitForTimeout(700)
  }
  // /report/:id рендерится клиентским эффектом ПОСЛЕ моканого fetch — тот же
  // риск гонки с networkidle, что в audit-own-a11y.mjs, но там уже есть
  // готовое решение: дождаться настоящего <h1>, а не таймера.
  if (path.startsWith('/report/')) {
    await page.getByRole('heading', { level: 1, name: /Accessibility report for/ }).waitFor({ timeout: 15000 })
  }
  // Дождаться ШРИФТОВ, а не только сети. Без этого гейт мерит промежуточный
  // кадр, набранный запасной гарнитурой, и результат зависит от того, какие
  // системные шрифты стоят на машине. Именно так он разошёлся с CI 2026-08-21:
  // локально 834px, на раннере 911px на одном и том же dist/ — воспроизведено
  // блокировкой woff2 (вводный абзац 154 → 179px, ответ 834 → 894px).
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)

  const hero = await page.evaluate(() => {
    const box = document.querySelector('.result-hero')
    if (!box) return null
    // Само значение — самый крупный по кеглю листовой элемент с текстом
    // внутри героя. Именно его низ и решает, читается ли ответ без прокрутки.
    let value = null
    let biggest = 0
    for (const el of box.querySelectorAll('*')) {
      if (el.children.length) continue
      const text = (el.textContent || '').trim()
      if (!text) continue
      const size = parseFloat(getComputedStyle(el).fontSize) || 0
      if (size > biggest) {
        biggest = size
        value = el
      }
    }
    const target = value || box
    const r = target.getBoundingClientRect()
    return {
      top: Math.round(r.top + window.scrollY),
      bottom: Math.round(r.bottom + window.scrollY),
      fontSize: Math.round(biggest),
      text: (target.textContent || '').trim().slice(0, 24),
    }
  })

  if (!hero) {
    failures.push(`${path} — нет .result-hero (${what}). Либо герой потерян, либо страницу надо убрать из списка осознанно.`)
    rows.push({ path, bottom: '—', text: '—', ok: false })
    await ctx.close()
    continue
  }

  const ok = hero.bottom <= VIEWPORT.height
  rows.push({ path, bottom: hero.bottom, text: hero.text, ok })
  if (!ok) {
    failures.push(
      `${path} — ${what} («${hero.text}», кегль ${hero.fontSize}px) заканчивается на ${hero.bottom}px ` +
        `при экране ${VIEWPORT.height}px: не хватает ${hero.bottom - VIEWPORT.height}px. ` +
        `Главный ответ обрезан и не читается без прокрутки.`,
    )
  }
  await ctx.close()
}

await browser.close()
server.close()

const pad = (s, n) => String(s).padEnd(n)
console.log(`\ncheck-fold — ${VIEWPORT.width}×${VIEWPORT.height}, низ значения должен быть ≤ ${VIEWPORT.height}px\n`)
for (const r of rows) {
  const slack = typeof r.bottom === 'number' ? `${VIEWPORT.height - r.bottom}px` : '—'
  console.log(`  ${r.ok ? '✓' : '✗'} ${pad(r.path, 42)} низ ${pad(r.bottom, 6)} запас ${pad(slack, 7)} ${r.text}`)
}

if (failures.length) {
  console.error(`\n✗ check-fold: ${failures.length} из ${PAGES.length}\n`)
  for (const f of failures) console.error(`  • ${f}`)
  process.exit(1)
}

console.log(`\n✓ check-fold: ${PAGES.length} страниц — главный ответ виден без прокрутки\n`)
