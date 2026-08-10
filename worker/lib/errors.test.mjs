import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyError } from './errors.js'

test('DNS failure classified as unreachable', () => {
  assert.equal(classifyError('net::ERR_NAME_NOT_RESOLVED at https://nope.example'), 'unreachable')
})

test('connection refused classified as refused', () => {
  assert.equal(classifyError('net::ERR_CONNECTION_REFUSED'), 'refused')
})

test('cert error classified as tls', () => {
  assert.equal(classifyError('net::ERR_CERT_AUTHORITY_INVALID at https://example.com'), 'tls')
})

test('navigation timeout classified as timeout', () => {
  assert.equal(classifyError('page.goto: Timeout 15000ms exceeded'), 'timeout')
})

// A1-SCAN-BUSY-RETRY. Первый случай — ДОСЛОВНО то, что прод отдал 2026-08-10;
// строка не придумана под паттерн, паттерн написан под неё.
test('Browser Rendering 429 (дословное прод-сообщение) classified as busy', () => {
  assert.equal(
    classifyError('Unable to create new browser: code: 429: message: Rate limit exceeded'),
    'busy',
  )
})

test('busy also covers session-limit phrasing', () => {
  assert.equal(classifyError('Too many concurrent browser sessions for this account'), 'busy')
})

// Ключевая ловушка: 429 как ЧАСТЬ URL сканируемого сайта. URL попадает в текст
// почти любой ошибки навигации, и голый /429/ уводил бы честный отказ в 'busy'.
test('429 inside a scanned URL is NOT busy', () => {
  assert.equal(classifyError('net::ERR_NAME_NOT_RESOLVED at https://example.com/page429'), 'unreachable')
  assert.equal(classifyError('navigation failed for https://example.com/page429'), 'internal')
})

test('unrecognized message falls back to internal', () => {
  assert.equal(classifyError('TypeError: cannot read property of undefined'), 'internal')
})

test('empty/missing message does not throw, falls back to internal', () => {
  assert.equal(classifyError(undefined), 'internal')
  assert.equal(classifyError(''), 'internal')
})
