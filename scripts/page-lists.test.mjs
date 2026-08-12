// D-041: постоянный гейт против грабель, которые проект наступил уже дважды
// (D-037 и снова при /request-quote): у `gen-a11y-sitemap.mjs` и
// `audit-own-a11y.mjs` СВОИ захардкоженные списки страниц. Новая страница
// собирается, отдаётся по прямой ссылке и при этом молча выпадает из sitemap и
// из постоянного a11y-аудита — оба прогона остаются зелёными, потому что
// проверяют список, а не сайт.
//
// Тест читает РЕАЛЬНЫЙ `src/routes.tsx` и требует, чтобы каждый статический
// маршрут был в обоих списках. Исключения — только явные и с причиной ниже,
// а не «забыли».

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

// Маршруты с ':' и '*' — динамические (профили, комбо, отчёты): их пути
// генерируются из данных, отдельного места в списках у них нет.
function staticRoutes() {
  const src = read('src/routes.tsx')
  const paths = [...src.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1])
  return [...new Set(paths.filter((p) => !p.includes(':') && !p.includes('*')))].map((p) =>
    p.endsWith('/') ? p : `${p}/`,
  )
}

// Страницы, которых в sitemap не должно быть — с причиной, а не по умолчанию.
const SITEMAP_EXCEPTIONS = new Map([
  ['/imprint/', 'index=false — ждёт реквизитов владельца'],
  ['/404/', 'страница ошибки в принципе не индексируется'],
  // A3-CRON-MONITORING-PAGES (D-139): noindex/токен-gated, открываются только по
  // ссылке из письма — как /report/:id, для поиска ценности ноль. В a11y-аудите
  // при этом присутствуют обязательно (SAMPLE_ROUTES + отдельный прогон состояний).
  ['/monitoring/confirm/', 'index=false — токен-gated landing из письма, не для поиска'],
  ['/monitoring/unsubscribe/', 'index=false — токен-gated landing из письма, не для поиска'],
])

const listOf = (file) => [...read(file).matchAll(/'(\/[^']*)'/g)].map((m) => m[1])

test('every static route is in the sitemap list (or is an exception with a stated reason)', () => {
  const inSitemap = new Set(listOf('scripts/gen-a11y-sitemap.mjs'))
  const missing = staticRoutes().filter((p) => !inSitemap.has(p) && !SITEMAP_EXCEPTIONS.has(p))
  assert.deepEqual(missing, [], `нет в scripts/gen-a11y-sitemap.mjs: ${missing.join(', ')}`)
})

test('every static route is in the permanent a11y audit list — no page escapes the gate', () => {
  const audited = new Set(listOf('scripts/audit-own-a11y.mjs'))
  const missing = staticRoutes().filter((p) => !audited.has(p))
  assert.deepEqual(missing, [], `нет в scripts/audit-own-a11y.mjs: ${missing.join(', ')}`)
})

test('the guard itself sees the real routes (fails loudly if routes.tsx changes shape)', () => {
  const routes = staticRoutes()
  assert.ok(routes.length >= 10, `распознано слишком мало маршрутов: ${routes.length}`)
  for (const p of ['/', '/scan/', '/bfsg-check/']) assert.ok(routes.includes(p), `не распознан ${p}`)
})
