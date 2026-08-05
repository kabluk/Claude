import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sameOriginLinks } from './links.js'

const BASE = 'https://example.com/'

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
