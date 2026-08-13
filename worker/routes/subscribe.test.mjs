import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handlePostSubscribe, handleGetSubscribeVerify, handleUnsubscribe, buildConfirmEmail } from './subscribe.js'

// Мини-D1 над subscriptions — тот же приём, что worker/routes/claim.test.mjs::fakeDb.
// Осознанное ограничение: это не SQLite, а сопоставление по регуляркам, то есть
// и SQL, и его «исполнитель» написаны одной рукой и согласованы по построению.
// Поэтому те же роуты отдельно прогоняются по НАСТОЯЩЕМУ SQLite на настоящей
// схеме — worker/routes/subscribe.sql.test.mjs. Здесь проверяется поведение
// роутов, там — что запросы валидны и делают ровно то, что смоделировано ниже.
function fakeDb(initialRows = []) {
  const rows = [...initialRows]
  const calls = []
  return {
    rows,
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              calls.push({ sql, args })
              if (/^INSERT INTO subscriptions/.test(sql)) {
                const [id, email, url, token, created_at] = args
                rows.push({
                  id,
                  email,
                  url,
                  token,
                  verified: 0,
                  status: 'pending',
                  last_scan_id: null,
                  cadence: 'weekly',
                  created_at,
                  unsubscribed_at: null,
                })
              } else if (/^UPDATE subscriptions\s+SET verified = 1/.test(sql)) {
                const [token] = args
                const row = rows.find((r) => r.token === token)
                if (row) {
                  row.verified = 1
                  if (row.status === 'pending') row.status = 'active'
                }
              } else if (/^UPDATE subscriptions\s+SET status = 'unsubscribed'/.test(sql)) {
                const [unsubscribed_at, token] = args
                const row = rows.find((r) => r.token === token)
                // WHERE ... AND status != 'unsubscribed' — гейт моделируем тоже.
                if (row && row.status !== 'unsubscribed') {
                  row.status = 'unsubscribed'
                  row.unsubscribed_at = unsubscribed_at
                }
              }
              return { meta: { changes: 1 } }
            },
            async first() {
              calls.push({ sql, args })
              if (/^SELECT .* FROM subscriptions WHERE token/.test(sql)) {
                const [token] = args
                return rows.find((r) => r.token === token) ?? null
              }
              // A5-ABUSE-LIMITS dedup lookup: lower(email)=lower(?) AND url=? AND status IN (...)
              if (/^SELECT id FROM subscriptions WHERE lower\(email\)/.test(sql)) {
                const [email, url] = args
                return (
                  rows.find(
                    (r) =>
                      r.email.toLowerCase() === email.toLowerCase() &&
                      r.url === url &&
                      (r.status === 'pending' || r.status === 'active'),
                  ) ?? null
                )
              }
              return null
            },
          }
        },
      }
    },
  }
}

// Мини-KV в памяти — тот же контракт, что worker/lib/ratelimit.test.mjs::fakeKv.
function fakeKv() {
  const store = new Map()
  return {
    async get(key) {
      return store.has(key) ? store.get(key) : null
    },
    async put(key, value) {
      store.set(key, value)
    },
  }
}

function env(overrides = {}) {
  return { DB: fakeDb(), RATE_LIMIT_KV: fakeKv(), ...overrides }
}

function req(body, headers = {}) {
  return new Request('https://worker.example/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4', ...headers },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { email: 'owner@example.com', url: 'https://example.com' }

// A3-CRON-MONITORING-PAGES (D-139): боевой домен сайта — база ссылок письма.
const SITE_ORIGIN = 'https://verscala.com'

test('invalid JSON body -> 400 bad_request', async () => {
  const res = await handlePostSubscribe(
    new Request('https://worker.example/api/subscribe', { method: 'POST', body: '{not json' }),
    env(),
  )
  assert.equal(res.status, 400)
  assert.equal((await res.json()).code, 'bad_request')
})

test('missing fields -> 400 lists each missing field (same error shape as /api/lead, /api/claim)', async () => {
  const res = await handlePostSubscribe(req({}), env())
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.code, 'bad_request')
  for (const field of ['email', 'url']) assert.match(data.error, new RegExp(field))
})

test('invalid email -> 400, nothing written to D1', async () => {
  const e = env()
  const res = await handlePostSubscribe(req({ ...VALID_BODY, email: 'not-an-email' }), e)
  assert.equal(res.status, 400)
  assert.match((await res.json()).error, /email/)
  assert.equal(e.DB.rows.length, 0)
})

test('invalid url -> 400 (non-http(s) schemes rejected, not just malformed strings)', async () => {
  for (const url of ['not a url', 'mailto:owner@example.com', 'javascript:alert(1)', 'ftp://example.com']) {
    const res = await handlePostSubscribe(req({ ...VALID_BODY, url }), env())
    assert.equal(res.status, 400, `${url} must be rejected`)
    assert.match((await res.json()).error, /url/)
  }
})

test('valid body -> 201 {subscriptionId}, row in D1 with status pending, verified=0, weekly cadence', async () => {
  const e = env()
  const res = await handlePostSubscribe(req(VALID_BODY), e)
  assert.equal(res.status, 201)
  const data = await res.json()
  assert.equal(typeof data.subscriptionId, 'string')
  assert.ok(data.subscriptionId.length > 0)

  assert.equal(e.DB.rows.length, 1)
  const [row] = e.DB.rows
  assert.equal(row.id, data.subscriptionId)
  assert.equal(row.email, 'owner@example.com')
  assert.equal(row.url, 'https://example.com')
  assert.equal(row.status, 'pending')
  assert.equal(row.verified, 0)
  assert.equal(row.cadence, 'weekly')
  assert.equal(row.last_scan_id, null)
  assert.equal(row.unsubscribed_at, null)
  assert.equal(typeof row.token, 'string')
  assert.ok(row.token.length >= 32, 'token should be a long, non-guessable secret')
  assert.ok(typeof row.created_at === 'string' && !Number.isNaN(Date.parse(row.created_at)))
})

test('the verify token never appears anywhere in the POST /api/subscribe response (D-023)', async () => {
  const e = env()
  const res = await handlePostSubscribe(req(VALID_BODY), e)
  const rawBody = await res.text()
  const data = JSON.parse(rawBody)
  const [row] = e.DB.rows

  // 1. Ровно одно поле, и это публичный id.
  assert.deepEqual(Object.keys(data), ['subscriptionId'])
  // 2. subscriptionId != token — token генерируется независимо, не выводится из id.
  assert.notEqual(data.subscriptionId, row.token)
  // 3. Главное: grep по СЫРОМУ телу на конкретное значение токена из D1 —
  //    ловит и вложенные поля, и случайную конкатенацию, чего проверка
  //    `typeof data.token === 'undefined'` не поймала бы.
  assert.ok(row.token.length > 0, 'sanity check: a token was actually generated')
  assert.equal(rawBody.includes(row.token), false, 'token must never be returned in the response body')
  // 4. И ни в одном заголовке (в т.ч. location у гипотетического редиректа).
  for (const [name, value] of res.headers) {
    assert.equal(value.includes(row.token), false, `token leaked in header ${name}`)
  }
  assert.equal(res.status, 201, 'not a redirect: a 3xx could carry the token in Location')
})

test('two subscriptions for DIFFERENT (email,url) pairs get different, unpredictable ids and tokens', async () => {
  const e = env()
  await handlePostSubscribe(req(VALID_BODY), e)
  await handlePostSubscribe(req({ email: 'someone-else@example.com', url: VALID_BODY.url }), e)
  const [a, b] = e.DB.rows
  assert.notEqual(a.id, b.id)
  assert.notEqual(a.token, b.token)
})

// --- A3-CRON-CONFIRM-EMAIL: письмо double opt-in ---------------------------
// До этого узла тут стоял обратный тест («fetch не вызывается даже при
// заданном RESEND_API_KEY»); он снят намеренно — контракт эндпоинта изменился,
// а не сломался. Условие «без ключа сети нет» сохранено ниже.

// Перехват fetch на время одного теста: возвращает записанные вызовы.
function captureFetch(t, respond = () => new Response(JSON.stringify({ id: 'evt_live' }), { status: 200 })) {
  const calls = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return respond(url, options)
  }
  t.after(() => {
    globalThis.fetch = originalFetch
  })
  return calls
}

test('no RESEND_API_KEY -> subscription is still created 201, no network call, no error (D-024 best-effort)', async (t) => {
  const calls = captureFetch(t)
  const e = env() // ключа нет
  const res = await handlePostSubscribe(req(VALID_BODY), e)

  assert.equal(res.status, 201, 'a missing secret must never turn a written subscription into a 5xx')
  assert.equal(typeof (await res.json()).subscriptionId, 'string')
  assert.equal(e.DB.rows.length, 1, 'the row is written regardless of email delivery')
  assert.equal(e.DB.rows[0].status, 'pending')
  assert.equal(calls.length, 0, 'without a key the Resend module must not be called at all')
})

test('with RESEND_API_KEY -> confirm email links to the branded SITE page, not the raw worker JSON api (D-139)', async (t) => {
  const calls = captureFetch(t)
  const e = env({ RESEND_API_KEY: 're_test_secret', ALLOWED_ORIGIN: SITE_ORIGIN })
  const res = await handlePostSubscribe(req(VALID_BODY), e)

  assert.equal(res.status, 201)
  assert.equal(calls.length, 1, 'exactly one Resend call')
  const [{ url, options }] = calls
  assert.equal(url, 'https://api.resend.com/emails')
  assert.equal(options.headers.authorization, 'Bearer re_test_secret')

  const sent = JSON.parse(options.body)
  assert.deepEqual(sent.to, ['owner@example.com'])
  assert.equal(sent.from, 'Verscala <notify@verscala.com>', 'verified domain, not the sandbox sender')
  assert.match(sent.subject, /Confirm your Verscala monitoring subscription/)

  // D-139: ссылка ведёт на брендовую страницу САЙТА с РЕАЛЬНЫМ токеном строки D1
  // — НЕ на голый JSON-эндпоинт воркера и НЕ на домен *.workers.dev (прод-инцидент).
  const token = e.DB.rows[0].token
  const expectedLink = `${SITE_ORIGIN}/monitoring/confirm?token=${token}`
  assert.ok(sent.text.includes(expectedLink), `confirm link missing from text body:\n${sent.text}`)
  assert.ok(sent.html.includes(`href="${expectedLink}"`), `confirm link missing from html body:\n${sent.html}`)
  assert.equal(sent.text.includes('/api/subscribe/verify'), false, 'the email must not expose the raw JSON verify endpoint')
  assert.equal(sent.text.includes('workers.dev'), false, 'the email must not point the subscriber at the worker domain')
  assert.equal(sent.text.includes(e.DB.rows[0].id), false, 'the link must carry the token, not the public id')
  assert.ok(sent.text.includes('https://example.com'), 'the subscriber must see which URL is being monitored')
})

test('with no ALLOWED_ORIGIN configured the confirm link falls back to the request origin (dev) but still points at /monitoring/confirm', async (t) => {
  const calls = captureFetch(t)
  const e = env({ RESEND_API_KEY: 're_test_secret' }) // ALLOWED_ORIGIN не задан
  await handlePostSubscribe(req(VALID_BODY), e)
  const token = e.DB.rows[0].token
  const sent = JSON.parse(calls[0].options.body)
  assert.ok(
    sent.text.includes(`https://worker.example/monitoring/confirm?token=${token}`),
    `dev fallback link missing:\n${sent.text}`,
  )
})

test('the confirm link from the email carries the token that actually verifies the subscription end to end', async (t) => {
  const calls = captureFetch(t)
  const e = env({ RESEND_API_KEY: 're_test_secret', ALLOWED_ORIGIN: SITE_ORIGIN })
  await handlePostSubscribe(req(VALID_BODY), e)

  // D-139: «verify-ссылка» письма теперь — страница САЙТА /monitoring/confirm.
  // Именно её токен страница передаёт в GET /api/subscribe/verify. Достаём токен
  // из ссылки (то, что получает подписчик) и проходим тот путь, что делает страница.
  const sentText = JSON.parse(calls[0].options.body).text
  const link = sentText.match(/https:\/\/\S*\/monitoring\/confirm\?token=\S+/)[0]
  const token = new URL(link).searchParams.get('token')

  const verifyRes = await handleGetSubscribeVerify(
    new Request(`https://worker.example/api/subscribe/verify?token=${encodeURIComponent(token)}`),
    e,
  )
  assert.equal(verifyRes.status, 200)
  const data = await verifyRes.json()
  assert.equal(data.verified, true)
  assert.equal(data.status, 'active')
  assert.equal(e.DB.rows[0].verified, 1)
})

test('a failing Resend call does not fail the subscription (error is swallowed and logged)', async (t) => {
  const calls = captureFetch(t, () => new Response(JSON.stringify({ message: 'Invalid `to` field.' }), { status: 422 }))
  const errors = []
  const originalError = console.error
  console.error = (...args) => errors.push(args.join(' '))
  t.after(() => {
    console.error = originalError
  })

  const e = env({ RESEND_API_KEY: 're_test_secret' })
  const res = await handlePostSubscribe(req(VALID_BODY), e)

  assert.equal(res.status, 201, 'Resend 422 must not become a 5xx for the caller')
  assert.equal(e.DB.rows.length, 1)
  assert.equal(calls.length, 1)
  assert.ok(
    errors.some((line) => /A3-CRON-CONFIRM-EMAIL/.test(line)),
    'the failure must be observable in the logs, not silent',
  )
})

test('a thrown network error inside Resend does not fail the subscription either', async (t) => {
  captureFetch(t, () => {
    throw new TypeError('network unreachable')
  })
  const originalError = console.error
  console.error = () => {}
  t.after(() => {
    console.error = originalError
  })

  const e = env({ RESEND_API_KEY: 're_test_secret' })
  const res = await handlePostSubscribe(req(VALID_BODY), e)
  assert.equal(res.status, 201)
  assert.equal(e.DB.rows.length, 1)
})

test('neither the token nor the verify link is written to the logs', async (t) => {
  captureFetch(t)
  const lines = []
  const originalLog = console.log
  console.log = (...args) => lines.push(args.join(' '))
  t.after(() => {
    console.log = originalLog
  })

  const e = env({ RESEND_API_KEY: 're_test_secret' })
  await handlePostSubscribe(req(VALID_BODY), e)
  const token = e.DB.rows[0].token
  for (const line of lines) {
    assert.equal(line.includes(token), false, `token leaked into a log line: ${line}`)
    assert.equal(line.includes('token='), false, `verify link leaked into a log line: ${line}`)
  }
  assert.ok(
    lines.some((line) => /confirm email sent/.test(line)),
    'the successful send must still be observable',
  )
})

test('buildConfirmEmail escapes the subscriber-supplied URL in the HTML body', () => {
  const mail = buildConfirmEmail({
    // Синтаксически валидный http(s)-URL, который проходит isHttpUrl и при этом
    // содержит кавычку и угловые скобки — то, что сломало бы href="...".
    url: 'https://example.com/?q="><script>alert(1)</script>',
    token: 'abc123',
    siteOrigin: 'https://worker.example',
  })
  assert.equal(mail.html.includes('<script>'), false, 'raw script tag must not reach the HTML body')
  assert.ok(mail.html.includes('&lt;script&gt;'))
  assert.ok(mail.html.includes('href="https://worker.example/monitoring/confirm?token=abc123"'))
})

// Каждый вызов — свой email (и свой url, чтобы заодно не задеть dedup ниже):
// иначе на 4-м вызове раньше сработал бы новый суточный per-email лимит
// (A5-ABUSE-LIMITS, 3/сутки) и тест проверял бы не то, что заявлено в имени.
const distinctBody = (i) => ({ email: `ip-limit-${i}@example.com`, url: `https://example.com/page-${i}` })

test('rate limit: blocks the 6th request from the same IP within the window', async () => {
  const e = env()
  for (let i = 0; i < 5; i++) {
    assert.equal((await handlePostSubscribe(req(distinctBody(i)), e)).status, 201, `request ${i} should succeed`)
  }
  const sixth = await handlePostSubscribe(req(distinctBody(5)), e)
  assert.equal(sixth.status, 429)
  assert.equal((await sixth.json()).code, 'rate_limited')
})

test('rate limit is tracked independently per IP', async () => {
  const e = env()
  for (let i = 0; i < 5; i++) {
    await handlePostSubscribe(req(distinctBody(i), { 'cf-connecting-ip': '9.9.9.9' }), e)
  }
  const otherIp = await handlePostSubscribe(req(distinctBody(99), { 'cf-connecting-ip': '8.8.8.8' }), e)
  assert.equal(otherIp.status, 201)
})

// --- A5-ABUSE-LIMITS: per-email daily cap ----------------------------------

test('per-email daily cap: blocks the 4th subscribe for the same email within a day (429 email_limit)', async () => {
  const e = env()
  const emailBody = (i) => ({ email: 'bombed@example.com', url: `https://example.com/target-${i}` })
  for (let i = 0; i < 3; i++) {
    assert.equal((await handlePostSubscribe(req(emailBody(i)), e)).status, 201, `request ${i} should succeed`)
  }
  const fourth = await handlePostSubscribe(req(emailBody(3)), e)
  assert.equal(fourth.status, 429)
  const data = await fourth.json()
  assert.equal(data.code, 'rate_limited')
  assert.match(data.error, /email_limit/)
})

test('per-email daily cap is tracked independently per email (a different email is unaffected)', async () => {
  const e = env()
  const emailBody = (i) => ({ email: 'bombed2@example.com', url: `https://example.com/target-${i}` })
  for (let i = 0; i < 3; i++) await handlePostSubscribe(req(emailBody(i)), e)
  const otherEmail = await handlePostSubscribe(req({ email: 'victim@example.com', url: 'https://example.com/target-0' }), e)
  assert.equal(otherEmail.status, 201)
})

test('per-email daily cap is keyed on the NORMALISED email (case/whitespace do not evade it)', async () => {
  const e = env()
  const variants = [
    'Case@Example.com',
    ' case@example.com ',
    'CASE@EXAMPLE.COM',
  ]
  for (const [i, email] of variants.entries()) {
    const res = await handlePostSubscribe(req({ email, url: `https://example.com/case-${i}` }), e)
    assert.equal(res.status, 201, `variant ${i} should succeed`)
  }
  const fourth = await handlePostSubscribe(req({ email: 'case@example.com', url: 'https://example.com/case-3' }), e)
  assert.equal(fourth.status, 429)
  assert.match((await fourth.json()).error, /email_limit/)
})

// --- A5-ABUSE-LIMITS: dedup by (email, url) --------------------------------

test('dedup: a second subscribe for the same (email,url) with an existing pending row does not insert or email again, and returns the SAME 201 shape', async (t) => {
  const calls = captureFetch(t)
  const e = env({ RESEND_API_KEY: 're_test_secret' })

  const first = await handlePostSubscribe(req(VALID_BODY), e)
  assert.equal(first.status, 201)
  const firstData = await first.json()
  assert.equal(e.DB.rows.length, 1)
  assert.equal(calls.length, 1, 'the first subscribe sends exactly one confirm email')

  const second = await handlePostSubscribe(req(VALID_BODY), e)
  assert.equal(second.status, 201)
  const secondData = await second.json()

  assert.equal(e.DB.rows.length, 1, 'no new row is inserted on a dedup hit')
  assert.equal(secondData.subscriptionId, firstData.subscriptionId, 'same subscription id returned')
  assert.equal(calls.length, 1, 'no second confirm email is sent on a dedup hit')
})

test('dedup: a DIFFERENT url for the same email is NOT deduped (still processed, subject to the per-email cap)', async (t) => {
  captureFetch(t)
  const e = env()
  const first = await handlePostSubscribe(req(VALID_BODY), e)
  const second = await handlePostSubscribe(req({ ...VALID_BODY, url: 'https://other-example.com' }), e)
  assert.equal(second.status, 201)
  assert.equal(e.DB.rows.length, 2, 'a different url is a genuinely different subscription')
  const firstId = (await first.json()).subscriptionId
  const secondId = (await second.json()).subscriptionId
  assert.notEqual(firstId, secondId)
})

test('dedup: an UNSUBSCRIBED existing row for the same (email,url) is NOT deduped — a fresh row is created', async (t) => {
  captureFetch(t)
  const e = env()
  const first = await handlePostSubscribe(req(VALID_BODY), e)
  const { subscriptionId: firstId } = await first.json()
  await handleUnsubscribe(unsubReq(e.DB.rows[0].token), e)
  assert.equal(e.DB.rows[0].status, 'unsubscribed')

  const second = await handlePostSubscribe(req(VALID_BODY), e)
  assert.equal(second.status, 201)
  const { subscriptionId: secondId } = await second.json()
  assert.notEqual(secondId, firstId, 'unsubscribed rows must not be reused by dedup')
  assert.equal(e.DB.rows.length, 2)
})

test('dedup runs BEFORE the per-email cap: re-submitting the SAME (email,url) more than 3× never trips email_limit (honest re-submit ≠ attack)', async (t) => {
  // Регресс-щит на порядок проверок (родительское ревью A5-ABUSE-LIMITS): если
  // per-email лимит вернуть ВЫШЕ dedup, 4-й одинаковый сабмит начнёт отдавать
  // 429, хотя ни одного лишнего письма не уходит (dedup их гасит) — это ломало
  // бы честного пользователя, кликнувшего «подписаться» несколько раз. Здесь
  // 5 идентичных запросов подряд обязаны все вернуть 201 и не создать дублей.
  const calls = captureFetch(t)
  const e = env({ RESEND_API_KEY: 're_test_secret' })
  for (let i = 0; i < 5; i++) {
    assert.equal((await handlePostSubscribe(req(VALID_BODY), e)).status, 201, `identical submit ${i} must not be rate-limited`)
  }
  assert.equal(e.DB.rows.length, 1, 'still exactly one row after 5 identical submits')
  assert.equal(calls.length, 1, 'still exactly one confirm email after 5 identical submits')
})

test('dedup indistinguishability: a dedup-hit response has the exact same status and body shape as a fresh subscribe', async (t) => {
  captureFetch(t)
  const e = env()
  const fresh = await handlePostSubscribe(req(VALID_BODY), e)
  const freshBody = await fresh.json()

  const dedupHit = await handlePostSubscribe(req(VALID_BODY), e)
  const dedupBody = await dedupHit.json()

  assert.equal(dedupHit.status, fresh.status, 'same HTTP status')
  assert.deepEqual(Object.keys(dedupBody).sort(), Object.keys(freshBody).sort(), 'same set of response fields')
  assert.deepEqual(Object.keys(dedupBody), ['subscriptionId'], 'no extra field revealing "already subscribed"')
  assert.equal(typeof dedupBody.subscriptionId, 'string')
})

test('turnstile: no TURNSTILE_SECRET_KEY configured -> verification is skipped (dev mode)', async () => {
  assert.equal((await handlePostSubscribe(req(VALID_BODY), env())).status, 201)
})

test('turnstile: secret configured, token rejected by Cloudflare -> 403, nothing written', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false }), { status: 200 })
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const e = env({ TURNSTILE_SECRET_KEY: 'secret' })
  const res = await handlePostSubscribe(req({ ...VALID_BODY, turnstileToken: 'bad-token' }), e)
  assert.equal(res.status, 403)
  assert.equal((await res.json()).code, 'forbidden')
  assert.equal(e.DB.rows.length, 0)
})

test('turnstile: secret configured, token accepted -> proceeds to 201', async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 })
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const res = await handlePostSubscribe(
    req({ ...VALID_BODY, turnstileToken: 'good-token' }),
    env({ TURNSTILE_SECRET_KEY: 'secret' }),
  )
  assert.equal(res.status, 201)
})

// --- verify ---------------------------------------------------------------

function verifyReq(token) {
  const qs = token === undefined ? '' : `?token=${encodeURIComponent(token)}`
  return new Request(`https://worker.example/api/subscribe/verify${qs}`)
}

test('GET /api/subscribe/verify: missing token query param -> 400', async () => {
  assert.equal((await handleGetSubscribeVerify(verifyReq(), env())).status, 400)
})

test('GET /api/subscribe/verify: unknown token -> 404', async () => {
  const res = await handleGetSubscribeVerify(verifyReq('does-not-exist'), env())
  assert.equal(res.status, 404)
  assert.equal((await res.json()).code, 'not_found')
})

test('GET /api/subscribe/verify: valid token -> verified=1 and status=active in D1, not just in the response', async () => {
  const e = env()
  const { subscriptionId } = await (await handlePostSubscribe(req(VALID_BODY), e)).json()
  const [row] = e.DB.rows
  assert.equal(row.verified, 0, 'sanity check: starts unverified')

  const res = await handleGetSubscribeVerify(verifyReq(row.token), e)
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.equal(data.verified, true)
  assert.equal(data.status, 'active')
  assert.equal(data.subscriptionId, subscriptionId)

  const [updated] = e.DB.rows
  assert.equal(updated.verified, 1)
  assert.equal(updated.status, 'active')
  assert.equal(updated.id, subscriptionId, 'sanity check: same subscription row')
})

test('GET /api/subscribe/verify: the subscription id is NOT a valid verify token (id and token are independent)', async () => {
  const e = env()
  const { subscriptionId } = await (await handlePostSubscribe(req(VALID_BODY), e)).json()
  // Именно это ловит регресс D-023: если бы token выводился из id, публичного
  // ответа POST хватило бы, чтобы подтвердить чужой адрес.
  assert.equal((await handleGetSubscribeVerify(verifyReq(subscriptionId), e)).status, 404)
  assert.equal(e.DB.rows[0].verified, 0, 'a failed verify must not flip the row')
})

test('GET /api/subscribe/verify: repeated verify with the same token stays 200/active (idempotent)', async () => {
  const e = env()
  await handlePostSubscribe(req(VALID_BODY), e)
  const [row] = e.DB.rows
  await handleGetSubscribeVerify(verifyReq(row.token), e)
  const second = await handleGetSubscribeVerify(verifyReq(row.token), e)
  assert.equal(second.status, 200)
  assert.equal((await second.json()).status, 'active')
  assert.equal(e.DB.rows[0].status, 'active')
})

test('GET /api/subscribe/verify: an old verify link does NOT resurrect an unsubscribed subscription', async () => {
  const e = env()
  await handlePostSubscribe(req(VALID_BODY), e)
  const [row] = e.DB.rows
  await handleUnsubscribe(unsubReq(row.token), e)

  const res = await handleGetSubscribeVerify(verifyReq(row.token), e)
  assert.equal(res.status, 200)
  assert.equal((await res.json()).status, 'unsubscribed')
  assert.equal(e.DB.rows[0].status, 'unsubscribed', 'status must stay unsubscribed')
  assert.equal(e.DB.rows[0].verified, 1, 'the address is still a verified fact (separate from status)')
})

// --- unsubscribe ----------------------------------------------------------

function unsubReq(token, method = 'GET') {
  const qs = token === undefined ? '' : `?token=${encodeURIComponent(token)}`
  return new Request(`https://worker.example/api/subscribe/unsubscribe${qs}`, { method })
}

test('unsubscribe: missing token -> 400; unknown token -> 404', async () => {
  assert.equal((await handleUnsubscribe(unsubReq(), env())).status, 400)
  assert.equal((await handleUnsubscribe(unsubReq('nope'), env())).status, 404)
})

test('unsubscribe: valid token -> 200 and status=unsubscribed with unsubscribed_at set in D1', async () => {
  const e = env()
  await handlePostSubscribe(req(VALID_BODY), e)
  const [row] = e.DB.rows
  await handleGetSubscribeVerify(verifyReq(row.token), e)

  const res = await handleUnsubscribe(unsubReq(row.token), e)
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.equal(data.status, 'unsubscribed')
  assert.equal(data.alreadyUnsubscribed, false)

  const [updated] = e.DB.rows
  assert.equal(updated.status, 'unsubscribed')
  assert.ok(
    typeof updated.unsubscribed_at === 'string' && !Number.isNaN(Date.parse(updated.unsubscribed_at)),
    'unsubscribed_at must be a real timestamp',
  )
  assert.equal(updated.verified, 1, 'unsubscribing does not undo the verified fact')
})

test('unsubscribe: a pending (never verified) subscription can be unsubscribed too', async () => {
  const e = env()
  await handlePostSubscribe(req(VALID_BODY), e)
  const [row] = e.DB.rows
  assert.equal((await handleUnsubscribe(unsubReq(row.token), e)).status, 200)
  assert.equal(e.DB.rows[0].status, 'unsubscribed')
})

test('unsubscribe is idempotent: a repeat call is still 200, and does not rewrite unsubscribed_at', async () => {
  const e = env()
  await handlePostSubscribe(req(VALID_BODY), e)
  const [row] = e.DB.rows

  const first = await handleUnsubscribe(unsubReq(row.token), e)
  assert.equal(first.status, 200)
  const firstAt = e.DB.rows[0].unsubscribed_at

  const second = await handleUnsubscribe(unsubReq(row.token), e)
  assert.equal(second.status, 200, 'a repeat unsubscribe must not be an error')
  const data = await second.json()
  assert.equal(data.status, 'unsubscribed')
  assert.equal(data.alreadyUnsubscribed, true)
  assert.equal(e.DB.rows[0].unsubscribed_at, firstAt, 'the first click is the moment of unsubscribing')
})

test('unsubscribe accepts POST as well as GET (RFC 8058 one-click, same token in the query)', async () => {
  const e = env()
  await handlePostSubscribe(req(VALID_BODY), e)
  const [row] = e.DB.rows
  const res = await handleUnsubscribe(unsubReq(row.token, 'POST'), e)
  assert.equal(res.status, 200)
  assert.equal(e.DB.rows[0].status, 'unsubscribed')
})

test('unsubscribe: the subscription id is not a valid unsubscribe token either', async () => {
  const e = env()
  const { subscriptionId } = await (await handlePostSubscribe(req(VALID_BODY), e)).json()
  assert.equal((await handleUnsubscribe(unsubReq(subscriptionId), e)).status, 404)
  assert.equal(e.DB.rows[0].status, 'pending')
})
