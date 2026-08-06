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

test('unrecognized message falls back to internal', () => {
  assert.equal(classifyError('TypeError: cannot read property of undefined'), 'internal')
})

test('empty/missing message does not throw, falls back to internal', () => {
  assert.equal(classifyError(undefined), 'internal')
  assert.equal(classifyError(''), 'internal')
})
