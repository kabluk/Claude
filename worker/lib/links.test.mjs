import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sameOriginLinks, pickPriorityLinks } from './links.js'

const BASE = 'https://example.com/'
const dir = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => fs.readFileSync(path.join(dir, '__fixtures__', name), 'utf8')

test('picks up relative and absolute same-origin links, skips external', () => {
  const html = `
    <a href="/about">About</a>
    <a href="https://example.com/contact">Contact</a>
    <a href="https://other.com/page">External</a>
  `
  const out = sameOriginLinks(html, BASE, 10)
  assert.deepEqual(out, ['https://example.com/about', 'https://example.com/contact'])
})

test('skips the base URL, fragments, and duplicates', () => {
  const html = `
    <a href="/">Home</a>
    <a href="/faq#top">FAQ</a>
    <a href="/pricing">Pricing</a>
    <a href="/pricing">Pricing again</a>
  `
  const out = sameOriginLinks(html, BASE, 10)
  assert.deepEqual(out, ['https://example.com/pricing'])
})

test('respects the limit', () => {
  const html = ['/a', '/b', '/c', '/d'].map((p) => `<a href="${p}">x</a>`).join('')
  const out = sameOriginLinks(html, BASE, 2)
  assert.equal(out.length, 2)
})

test('ignores malformed hrefs without throwing', () => {
  const html = `<a href="   ">bad</a><a href="/ok">ok</a>`
  const out = sameOriginLinks(html, BASE, 10)
  assert.deepEqual(out, ['https://example.com/ok'])
})

// Регрессия на реальный баг, найденный живой проверкой A3-PAGESELECT (2026-08-06):
// прежняя версия матчила href="..." любого тега, не только <a> — <link rel="preload">
// и подобные засоряли список "страниц" ресурсами шрифтов/иконок, не HTML-страницами.
test('does not treat non-<a> href attributes (preload/favicon links) as crawlable pages', () => {
  const html = `
    <link rel="preload" href="/fonts/main.woff2" as="font">
    <link rel="icon" href="/favicon.ico">
    <a href="/about">About</a>
  `
  const out = sameOriginLinks(html, BASE, 10)
  assert.deepEqual(out, ['https://example.com/about'])
})

test('pickPriorityLinks: same regression — only <a> tags are candidates', () => {
  const html = `<link rel="preload" href="/fonts/main.woff2"><a href="/about">About</a>`
  const out = pickPriorityLinks(html, BASE, 10)
  assert.deepEqual(out, ['https://example.com/about'])
})

// Живая проверка (2026-08-06, manufactum.de real HTML): корзина — /warenkorb, видимый
// текст ссылки — просто "0,00 €" (сумма, БЕЗ слова "корзина"). Первая версия, искавшая
// ключевые слова только в тексте ссылки, эту страницу вообще не подняла бы в приоритет.
test('prioritizes real transactional pages (account/cart/contact) over decorative first-N links', () => {
  const html = fixture('links-manufactum-home.html')
  const base = 'https://www.manufactum.de/'
  const priority = pickPriorityLinks(html, base, 5)
  const naive = sameOriginLinks(html, base, 5)

  assert.ok(priority.includes('https://www.manufactum.de/kundenkonto'), 'login/account page ranked in top 5')
  assert.ok(priority.includes('https://www.manufactum.de/warenkorb'), 'cart page ranked in top 5 despite icon-only link text')
  // Наивный порядок первых-N ссылок не содержит ни одной из транзакционных страниц —
  // подтверждает, что приоритизация реально меняет исход, не только теоретически.
  assert.ok(!naive.includes('https://www.manufactum.de/kundenkonto'))
  assert.ok(!naive.includes('https://www.manufactum.de/warenkorb'))
})

test('prioritizes the real French login link over nav clutter on impots.gouv.fr (same-origin subset)', () => {
  const html = fixture('links-impots-home.html')
  const base = 'https://www.impots.gouv.fr/'
  const priority = pickPriorityLinks(html, base, 5)
  assert.ok(priority.includes('https://www.impots.gouv.fr/contacts'), 'contact page ranked in top 5')
})

test('pickPriorityLinks respects the limit and excludes cross-origin/fragment/duplicate links', () => {
  const html = `
    <a href="/">Home</a>
    <a href="/login">Login</a>
    <a href="/login#top">Login dup fragment</a>
    <a href="https://other.com/login">External login</a>
    <a href="/about">About</a>
  `
  const out = pickPriorityLinks(html, BASE, 1)
  assert.deepEqual(out, ['https://example.com/login'])
})
