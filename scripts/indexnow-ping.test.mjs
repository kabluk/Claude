// G-INDEXNOW (D-178): гейт для чистых функций indexnow-ping.mjs — парсинг
// sitemap и сборка payload. Сетевой вызов НЕ тестируется здесь (он
// best-effort и живой, см. шапку скрипта) — только то, что можно проверить
// без сети и без файловой системы.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPayload, urlsFromSitemap } from './indexnow-ping.mjs'

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://verscala.com/</loc><lastmod>2026-08-15</lastmod></url>
  <url><loc>https://verscala.com/scan/</loc><lastmod>2026-08-15</lastmod></url>
  <url><loc>https://verscala.com/agencies/deque-systems/</loc><lastmod>2026-08-15</lastmod></url>
</urlset>
`

test('urlsFromSitemap извлекает все <loc> в порядке появления', () => {
  assert.deepEqual(urlsFromSitemap(SAMPLE_XML), [
    'https://verscala.com/',
    'https://verscala.com/scan/',
    'https://verscala.com/agencies/deque-systems/',
  ])
})

test('urlsFromSitemap на пустом sitemap возвращает пустой массив, не бросает', () => {
  assert.deepEqual(urlsFromSitemap('<urlset></urlset>'), [])
})

test('buildPayload собирает контракт IndexNow: host/key/keyLocation/urlList', () => {
  const urls = ['https://verscala.com/', 'https://verscala.com/scan/']
  const payload = buildPayload(urls, { host: 'verscala.com', key: 'abc123', origin: 'https://verscala.com' })
  assert.deepEqual(payload, {
    host: 'verscala.com',
    key: 'abc123',
    keyLocation: 'https://verscala.com/abc123.txt',
    urlList: urls,
  })
})

test('buildPayload режет список на 10000 URL — документированный лимит IndexNow', () => {
  const urls = Array.from({ length: 10005 }, (_, i) => `https://verscala.com/page-${i}/`)
  const payload = buildPayload(urls)
  assert.equal(payload.urlList.length, 10000)
  assert.equal(payload.urlList[0], urls[0])
  assert.equal(payload.urlList[9999], urls[9999])
})

test('buildPayload использует дефолты verscala.com/боевой ключ, если не переданы', () => {
  const payload = buildPayload(['https://verscala.com/'])
  assert.equal(payload.host, 'verscala.com')
  assert.equal(payload.keyLocation, 'https://verscala.com/2fdd39895be44fab5144134f6bf047f0.txt')
})
