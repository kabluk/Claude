import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sendEmail, SANDBOX_FROM } from './resend.js'

test('sendEmail posts to the Resend API with the expected shape', async () => {
  const originalFetch = globalThis.fetch
  let capturedUrl, capturedOptions
  globalThis.fetch = async (url, options) => {
    capturedUrl = url
    capturedOptions = options
    return new Response(JSON.stringify({ id: 'evt_123' }), { status: 200 })
  }
  try {
    const result = await sendEmail('re_test_secret', {
      from: SANDBOX_FROM,
      to: 'owner@example.com',
      subject: 'Test',
      text: 'Hello',
    })
    assert.equal(capturedUrl, 'https://api.resend.com/emails')
    assert.equal(capturedOptions.method, 'POST')
    assert.equal(capturedOptions.headers.authorization, 'Bearer re_test_secret')
    const body = JSON.parse(capturedOptions.body)
    assert.deepEqual(body.to, ['owner@example.com']) // API expects an array, caller passes a single address
    assert.equal(body.subject, 'Test')
    assert.deepEqual(result, { id: 'evt_123' })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('sendEmail throws with the response body on a non-2xx status', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: 'Invalid `to` field.' }), { status: 422 })
  try {
    await assert.rejects(
      () => sendEmail('re_test_secret', { from: SANDBOX_FROM, to: 'x@example.com', subject: 's', text: 't' }),
      /HTTP 422/,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
