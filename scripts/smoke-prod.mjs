#!/usr/bin/env node
// R-SMOKE-DEPLOY (D-173): проверка ЖИВОГО прода после деплоя.
//
// Зачем отдельный гейт, когда есть ci.yml и гейты в deploy.yml. Все они гоняются
// ДО выката и проверяют `dist/` на раннере. Между «зелёной сборкой» и «рабочим
// сайтом» лежит целый слой, который они физически не видят: правильный ли проект
// Pages, production-ветка или preview, докатился ли CDN, жив ли воркер, не
// протух ли токен. Этот класс инцидентов у проекта реальный и повторяющийся —
// D-092 (команда рапортует успех, боевой URL отдаёт старое), D-125 (проверять
// curl'ом ПОСЛЕ деплоя, а не по логу CI). До сегодняшнего дня эту проверку
// каждый раз делал человек руками; теперь она обязана падать сама.
//
// Запуск:
//   node scripts/smoke-prod.mjs                 # против https://verscala.com
//   SMOKE_BASE=https://preview.example npm run smoke
//   SMOKE_EXPECT_AGENCIES=0 …                   # пропустить сверку числа агентств
//
// Все проверки выполняются ДО первого выхода: один прогон — полный список
// проблем, а не первая попавшаяся. Падает с кодом 1, если провалилась хоть одна.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = (process.env.SMOKE_BASE ?? 'https://verscala.com').replace(/\/$/, '')
// Адрес воркера: тот же, что build-time VITE_SCANNER_API (deploy.yml) и
// WORKER_ORIGIN в wrangler.jsonc. Держать в синхроне с ними.
const WORKER = (process.env.SMOKE_WORKER ?? process.env.VITE_SCANNER_API ?? 'https://accessatlas-worker.zincroom.workers.dev').replace(/\/$/, '')
const TIMEOUT_MS = 20000

// Число агентств берём из РЕПОЗИТОРИЯ, а не из константы: смысл проверки —
// «доехали ли до пользователей ровно те данные, что лежат в этом коммите».
// Захардкоженное число проверяло бы, что сайт вообще жив, но молчало бы ровно в
// том случае, ради которого гейт и написан (данные собраны, но не выкачены).
function expectedAgencyCount() {
  const override = process.env.SMOKE_EXPECT_AGENCIES
  if (override !== undefined) return Number(override) // 0 = сверку пропустить
  try {
    return JSON.parse(readFileSync(join(ROOT, 'data', 'a11y', 'agencies.json'), 'utf8')).length
  } catch {
    return 0 // запуск вне репозитория — проверяем только доступность, не число
  }
}

const failures = []
const notes = []
function check(name, ok, detail) {
  if (ok) console.log(`✓ ${name}`)
  else {
    console.log(`✗ ${name} — ${detail}`)
    failures.push(`${name}: ${detail}`)
  }
}

async function get(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    // Собственный User-Agent: в логах Cloudflare этот трафик должен быть
    // отличим от живых посетителей и от VerscalaBot (краулер сканера).
    headers: { 'user-agent': 'VerscalaSmokeTest/1.0 (+https://verscala.com)' },
  })
  return { status: res.status, body: await res.text() }
}

// --- 1. Ключевые страницы отвечают 200 и содержат свой характерный контент ---
// «200 и не пусто» недостаточно: SPA-фоллбэк на неверной конфигурации отдаёт 200
// с оболочкой на ЛЮБОЙ путь. Поэтому у каждой страницы — своя строка-маркер.
const PAGES = [
  { path: '/', marker: 'Check your website', label: 'главная' },
  { path: '/scan/', marker: 'Scan', label: '/scan/' },
  { path: '/request-quote/', marker: 'Send my request', label: '/request-quote/ (лид-форма, D-172)' },
  { path: '/agencies/', marker: 'agenc', label: '/agencies/' },
  { path: '/agencies/deque-systems/', marker: 'Deque Systems', label: 'профиль агентства' },
  { path: '/checkers/', marker: 'Checker', label: '/checkers/' },
  { path: '/accessibility-statement/', marker: 'partially compliant', label: 'наше заявление (D-170)' },
]

for (const { path, marker, label } of PAGES) {
  try {
    const { status, body } = await get(`${BASE}${path}`)
    if (status !== 200) check(label, false, `HTTP ${status}`)
    else check(label, body.includes(marker), `200, но нет маркера «${marker}» — страница отдаётся, но не та`)
  } catch (err) {
    check(label, false, `запрос не выполнен: ${err.message}`)
  }
}

// --- 2. Каталог доехал целиком ---
// Число агентств из этого коммита обязано быть на живой главной. Ловит ровно
// тот случай, когда сборка прошла, а данные остались прежними.
const expected = expectedAgencyCount()
if (expected > 0) {
  try {
    const { body } = await get(`${BASE}/`)
    check(
      `каталог: ${expected} агентств на живой главной`,
      body.includes(String(expected)),
      `числа ${expected} нет на главной — данные коммита не доехали до прода`,
    )
  } catch (err) {
    check('каталог: число агентств', false, `запрос не выполнен: ${err.message}`)
  }
} else {
  notes.push('сверка числа агентств пропущена (нет agencies.json или SMOKE_EXPECT_AGENCIES=0)')
}

// --- 3. Настоящий SSG, а не SPA-ловушка ---
// Несуществующий путь ОБЯЗАН давать 404. Если он отдаёт 200, значит включён
// catch-all — и тогда все проверки выше проходят на любой сломанной сборке,
// а Google индексирует бесконечный мусор.
try {
  const { status } = await get(`${BASE}/definitely-not-a-real-page-smoke-test/`)
  check('404 на несуществующем пути (настоящий SSG)', status === 404, `HTTP ${status} вместо 404`)
} catch (err) {
  check('404 на несуществующем пути', false, `запрос не выполнен: ${err.message}`)
}

// --- 4. Сканер подключён в ЖИВОМ бандле (класс тихого отказа D-098) ---
// deploy.yml проверяет то же самое в dist/ ДО выката. Здесь — в том, что реально
// отдаёт CDN: только это доказывает, что у пользователя работает главная функция.
try {
  const { body: home } = await get(`${BASE}/`)
  // И `src` (входной чанк), И `href` (rel=modulepreload). Первая версия проверки
  // ловила только `src` и падала ложно: адрес воркера живёт в `scanner-*.js`,
  // который подключён именно modulepreload-ссылкой, а не тегом <script>.
  const scripts = [...home.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])
  if (scripts.length === 0) {
    check('сканер подключён в живом бандле', false, 'на главной нет ни одного /assets/*.js — сборка не та')
  } else {
    const host = WORKER.replace(/^https?:\/\//, '')
    let found = false
    for (const src of scripts) {
      const { body } = await get(`${BASE}${src}`)
      if (body.includes(host)) { found = true; break }
    }
    check(
      'сканер подключён в живом бандле (VITE_SCANNER_API)',
      found,
      `адреса воркера ${host} нет ни в одном из ${scripts.length} чанков главной — сканер молча отключён`,
    )
  }
} catch (err) {
  check('сканер подключён в живом бандле', false, `запрос не выполнен: ${err.message}`)
}

// --- 5. Воркер жив и достаёт до D1 ---
// 404 на заведомо несуществующий скан — это УСПЕХ: значит воркер поднялся,
// маршрут отработал и запрос к базе выполнился. 5xx/таймаут — настоящая поломка.
try {
  const { status } = await get(`${WORKER}/api/scan/00000000-0000-0000-0000-000000000000`)
  check('воркер жив (404 на несуществующий скан)', status === 404, `HTTP ${status} — ожидался 404`)
} catch (err) {
  check('воркер жив', false, `запрос не выполнен: ${err.message}`)
}

// --- 6. Sitemap на месте ---
try {
  const { status, body } = await get(`${BASE}/sitemap.xml`)
  const urls = (body.match(/<loc>/g) ?? []).length
  check('sitemap.xml', status === 200 && urls > 100, `HTTP ${status}, ${urls} URL (ожидалось >100)`)
} catch (err) {
  check('sitemap.xml', false, `запрос не выполнен: ${err.message}`)
}

for (const n of notes) console.log(`· ${n}`)

if (failures.length > 0) {
  console.error(`\n✗ smoke-prod: ${failures.length} провал(ов) на ${BASE}`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`\n✓ smoke-prod: живой прод ${BASE} прошёл все проверки`)
