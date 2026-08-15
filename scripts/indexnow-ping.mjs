#!/usr/bin/env node
// G-INDEXNOW (D-178, 2026-08-15): уведомление Bing/Yandex/Naver о полном
// списке URL сайта при каждом деплое (SEO-INDEXING-PLAN.md п.5). Google в
// IndexNow не участвует — эффект косвенный (быстрее общее обнаружение
// сайта, не прямое ускорение Google-индексации).
//
// Почему весь sitemap на каждый деплой, а не только "изменившиеся" URL:
// у проекта нет инфраструктуры diff'а между деплоями (какие страницы
// реально изменились), а придумывать её ради этого узла — за пределами
// scope. IndexNow не штрафует за повторную отправку уже известного URL —
// это ре-уведомление "можешь перепроверить", не заявка на первую индексацию.
// Полный список — простой, честный, не отслеживает мнимую точность, которой
// нет.
//
// Best-effort по конструкции: сетевой сбой здесь не должен ронять деплой
// сайта — это SEO-сигнал, не проверка здоровья прода (та роль уже занята
// R-SMOKE-DEPLOY, D-173). Скрипт всегда завершается кодом 0, кроме
// --dry-run с некорректным вводом (программная ошибка, не сетевая).
//
// Запуск:
//   node scripts/indexnow-ping.mjs --dry-run   # построить payload, не слать
//   node scripts/indexnow-ping.mjs             # реальный пинг (деплой)

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const ORIGIN = 'https://verscala.com'
const HOST = 'verscala.com'
// Продублирован из gen-a11y-sitemap.mjs (см. комментарий там про причину
// дублирования, не импорта) — держать значение в синхроне.
const INDEXNOW_KEY = '2fdd39895be44fab5144134f6bf047f0'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

// Чистая функция: XML sitemap -> список URL. Тестируется без файловой
// системы и без сети.
export function urlsFromSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

// Чистая функция: список URL -> тело запроса IndexNow. IndexNow принимает
// до 10 000 URL за раз (документированный лимит протокола) — наш sitemap
// на порядок меньше, но лимит соблюдён явно, а не "авось влезет".
export function buildPayload(urls, { host = HOST, key = INDEXNOW_KEY, origin = ORIGIN } = {}) {
  const MAX_URLS = 10000
  return {
    host,
    key,
    keyLocation: `${origin}/${key}.txt`,
    urlList: urls.slice(0, MAX_URLS),
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const sitemapPath = join(DIST, 'sitemap.xml')
  if (!existsSync(sitemapPath)) {
    console.error('✗ indexnow-ping: нет dist/sitemap.xml — сперва npm run build (gen-a11y-sitemap.mjs).')
    process.exit(1)
  }
  const urls = urlsFromSitemap(readFileSync(sitemapPath, 'utf8'))
  if (urls.length === 0) {
    console.error('✗ indexnow-ping: dist/sitemap.xml прочитан, но URL не найдено — сборка сломана?')
    process.exit(1)
  }

  const keyFilePath = join(DIST, `${INDEXNOW_KEY}.txt`)
  const keyFileOk = existsSync(keyFilePath) && readFileSync(keyFilePath, 'utf8').trim() === INDEXNOW_KEY
  if (!keyFileOk) {
    console.error(
      `✗ indexnow-ping: dist/${INDEXNOW_KEY}.txt отсутствует или не совпадает с ключом — ` +
        'gen-a11y-sitemap.mjs не прогонялся или ключи разошлись между файлами.',
    )
    process.exit(1)
  }

  const payload = buildPayload(urls)

  if (dryRun) {
    console.log(`✓ indexnow-ping --dry-run: ${payload.urlList.length} URL, keyLocation=${payload.keyLocation}`)
    console.log(`  первые 3: ${payload.urlList.slice(0, 3).join(', ')}`)
    return
  }

  // Best-effort (см. шапку файла): любой сбой — предупреждение, код выхода
  // 0. Деплой сайта не должен краснеть из-за стороннего API уведомлений.
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      console.log(`✓ indexnow-ping: ${payload.urlList.length} URL отправлены, HTTP ${res.status}`)
    } else {
      const body = await res.text().catch(() => '')
      console.warn(`⚠ indexnow-ping: API ответил HTTP ${res.status} — ${body.slice(0, 200)}`)
    }
  } catch (err) {
    console.warn(`⚠ indexnow-ping: сетевой сбой, деплой продолжается — ${err.message}`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
