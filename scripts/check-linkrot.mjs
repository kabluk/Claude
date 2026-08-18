#!/usr/bin/env node
// R-LINKROT: плановая проверка внешних ссылок каталога (data/a11y/agencies.json)
// на протухание — 404, смену домена (редирект на другой хост), недоступность
// (DNS/timeout/сетевая ошибка). Проверяются `website` (домен без протокола,
// см. types.ts) и каждый `sourceRefs[].url` (доказательства фактов профиля).
//
// Read-only: скрипт ничего не пишет в agencies.json/excluded.json. Это отчёт
// для владельца-человека, не автоправка — находки (протухшие sourceRefs,
// сменившиеся домены) не превращаются в автоудаление записей без проверки
// человеком (D-047: пустое лучше выдуманного, и то же правило применяется
// в обратную сторону — не выдумывать, что источник умер, если это просто
// анти-бот блокировка или временный сбой).
//
// Категории результата, по убыванию «это точно проблема»:
//   UNREACHABLE   — DNS/сетевая ошибка/timeout: домен не резолвится или не
//                    отвечает вовсе. Сильнейший сигнал протухания.
//   NOT_FOUND     — HTTP 404/410: страница определённо снята.
//   DOMAIN_CHANGE — после редиректов финальный хост отличается от исходного
//                    (не считая www.): сайт мог переехать/быть перекуплен.
//   SERVER_ERROR  — HTTP 5xx: сайт жив, но отдаёт ошибку прямо сейчас.
//   BLOCKED       — HTTP 401/403/429: часто анти-бот (Cloudflare challenge и
//                    т.п.), не обязательно протухание — требует ручной проверки.
//   REDIRECT      — редирект на тот же хост (informational, не проблема).
//   OK            — 2xx без проблемного редиректа.
//
// Запуск:
//   node scripts/check-linkrot.mjs
//   LINKROT_CONCURRENCY=16 LINKROT_TIMEOUT_MS=15000 node scripts/check-linkrot.mjs
//   LINKROT_LIMIT=20 node scripts/check-linkrot.mjs     # выборка для быстрой проверки
//   LINKROT_SKIP_SOURCEREFS=1 node scripts/check-linkrot.mjs  # только website-поля

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const AGENCIES_PATH = join(ROOT, 'data', 'a11y', 'agencies.json')

const CONCURRENCY = Number(process.env.LINKROT_CONCURRENCY ?? 10)
const TIMEOUT_MS = Number(process.env.LINKROT_TIMEOUT_MS ?? 15000)
const LIMIT = process.env.LINKROT_LIMIT ? Number(process.env.LINKROT_LIMIT) : Infinity
const SKIP_SOURCEREFS = process.env.LINKROT_SKIP_SOURCEREFS === '1'
const UA = 'AccessAtlasLinkChecker/1.0 (+https://verscala.com; periodic linkrot check, contact via site)'

// `website` в схеме — канонический домен без протокола (ключ дедупликации,
// types.ts). Ссылки в HTTP всегда нужны с протоколом.
function toHttpsUrl(website) {
  return website.startsWith('http') ? website : `https://${website}`
}

// Сравнение хостов «после www» — www.foo.com и foo.com одна и та же смена
// домена НЕ считается: это частый, безобидный вариант одного и того же сайта.
function bareHost(hostname) {
  return hostname.replace(/^www\./, '')
}

// Чистая функция классификации — не трогает сеть/файлы, тестируема отдельно.
export function classify({ error, status, requestedUrl, finalUrl }) {
  if (error) return 'UNREACHABLE'
  if (status === 404 || status === 410) return 'NOT_FOUND'
  if (status === 401 || status === 403 || status === 429) return 'BLOCKED'
  if (status >= 500) return 'SERVER_ERROR'
  if (status >= 400) return 'NOT_FOUND'
  const requestedHost = bareHost(new URL(requestedUrl).hostname)
  const finalHost = bareHost(new URL(finalUrl).hostname)
  if (requestedHost !== finalHost) return 'DOMAIN_CHANGE'
  if (finalUrl !== requestedUrl) return 'REDIRECT'
  return 'OK'
}

async function checkOne(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': UA },
    })
    return classify({ status: res.status, requestedUrl: url, finalUrl: res.url })
  } catch (err) {
    return classify({ error: err })
  }
}

// Простой пул с ограничением параллелизма — 574 агентства × (website +
// sourceRefs) легко даёт 1000+ URL; без лимита это либо забанят анти-бот
// защиты, либо исчерпает файловые дескрипторы/сокеты.
async function runPool(items, worker, concurrency) {
  const results = new Array(items.length)
  let next = 0
  async function lane() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane))
  return results
}

function loadAgencies() {
  return JSON.parse(readFileSync(AGENCIES_PATH, 'utf8'))
}

function buildChecklist(agencies) {
  // url -> список мест, где он встречается (может быть несколько записей на
  // один и тот же источник — дедуплицируем сетевой запрос, не находки).
  const byUrl = new Map()
  const add = (url, where) => {
    if (!byUrl.has(url)) byUrl.set(url, [])
    byUrl.get(url).push(where)
  }
  for (const agency of agencies) {
    add(toHttpsUrl(agency.website), { slug: agency.slug, field: 'website' })
    if (!SKIP_SOURCEREFS) {
      for (const ref of agency.sourceRefs ?? []) {
        add(ref.url, { slug: agency.slug, field: 'sourceRefs', label: ref.label })
      }
    }
  }
  return byUrl
}

async function main() {
  const agencies = loadAgencies()
  const checklist = buildChecklist(agencies)
  const urls = [...checklist.keys()].slice(0, LIMIT)

  console.log(`check-linkrot: ${agencies.length} агентств, ${checklist.size} уникальных URL` + (urls.length < checklist.size ? ` (проверяю выборку ${urls.length} по LINKROT_LIMIT)` : '') + `, concurrency=${CONCURRENCY}, timeout=${TIMEOUT_MS}ms\n`)

  const byCategory = { UNREACHABLE: [], NOT_FOUND: [], DOMAIN_CHANGE: [], SERVER_ERROR: [], BLOCKED: [], REDIRECT: [], OK: [] }

  let done = 0
  const statuses = await runPool(
    urls,
    async (url) => {
      const category = await checkOne(url)
      done++
      if (done % 100 === 0 || done === urls.length) {
        process.stderr.write(`  ...${done}/${urls.length}\r`)
      }
      return { url, category }
    },
    CONCURRENCY
  )
  for (const { url, category } of statuses) byCategory[category].push(url)

  const PROBLEM_ORDER = ['UNREACHABLE', 'NOT_FOUND', 'DOMAIN_CHANGE', 'SERVER_ERROR', 'BLOCKED']
  let problemCount = 0
  for (const category of PROBLEM_ORDER) {
    const urlsInCategory = byCategory[category]
    if (!urlsInCategory.length) continue
    problemCount += urlsInCategory.length
    console.log(`\n${category} (${urlsInCategory.length}):`)
    for (const url of urlsInCategory) {
      for (const where of checklist.get(url)) {
        const tag = where.field === 'website' ? 'website' : `sourceRefs${where.label ? `: ${where.label}` : ''}`
        console.log(`  ${url}\n    ${where.slug} · ${tag}`)
      }
    }
  }

  console.log(`\n--- Итого ---`)
  for (const category of [...PROBLEM_ORDER, 'REDIRECT', 'OK']) {
    console.log(`  ${category}: ${byCategory[category].length}`)
  }
  console.log(`\nПроблемных URL: ${problemCount}/${urls.length}. Это отчёт для ручного review — записи не изменены.`)
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((err) => {
    console.error('check-linkrot: сбой скрипта —', err)
    process.exit(1)
  })
}
