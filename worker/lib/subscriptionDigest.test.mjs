// A3-CRON-DIGEST-EMAIL (D-137): контракт письма-дайджеста — чистый билдер
// buildDigestEmail, без D1 и без сети (тот же приём, что buildConfirmEmail в
// subscribe.test.mjs). Поведение прохода (когда шлём/не шлём, best-effort,
// маркер) проверяется на настоящем SQLite в subscriptionCron.sql.test.mjs.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDigestEmail } from './subscriptionCron.js'

const ORIGIN = 'https://verscala.com'
// A3-CRON-MONITORING-PAGES (D-139): origin воркера — только для List-Unsubscribe.
const WORKER_ORIGIN = 'https://accessatlas-worker.zincroom.workers.dev'
const TOKEN = 'a'.repeat(64) // формат generateToken: 32 байта hex
const SCAN_ID = '11111111-2222-3333-4444-555555555555'

function delta(overrides = {}) {
  return {
    new: [],
    resolved: [],
    scoreChange: 0,
    scoreBefore: 80,
    scoreAfter: 80,
    scopedOutPages: [],
    ...overrides,
  }
}

test('digest: the VISIBLE unsubscribe link goes to the branded SITE page, the List-Unsubscribe HEADER goes to the worker api (D-139)', () => {
  const { text, html, headers } = buildDigestEmail({
    url: 'https://example.gov/',
    scanId: SCAN_ID,
    token: TOKEN,
    siteOrigin: ORIGIN, workerOrigin: WORKER_ORIGIN,
    delta: delta({ new: [{ ruleId: 'x', page: 'p', selector: 's' }], scoreChange: -7, scoreAfter: 73 }),
  })

  // Тело: человек кликает — ведём на брендовую страницу сайта (не голый JSON).
  const siteUnsub = `${ORIGIN}/monitoring/unsubscribe?token=${TOKEN}`
  assert.ok(text.includes(siteUnsub), `site unsubscribe link missing from text body:\n${text}`)
  assert.ok(html.includes(`href="${siteUnsub}"`), `site unsubscribe link missing from html body:\n${html}`)
  assert.equal(text.includes(`${ORIGIN}/api/subscribe/unsubscribe`), false, 'the body must not expose the raw JSON api')

  // Заголовок: машинный one-click POST (RFC 8058) шлётся ПРЯМО на воркер — только
  // воркер обслуживает POST-ветку, домен там не важен, страница сайта её не имеет.
  const workerUnsub = `${WORKER_ORIGIN}/api/subscribe/unsubscribe?token=${TOKEN}`
  assert.equal(headers['List-Unsubscribe'], `<${workerUnsub}>`)
  assert.equal(headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click')
})

test('digest email links to /report/:scanId of the NEW scan', () => {
  const { text, html } = buildDigestEmail({
    url: 'https://example.gov/',
    scanId: SCAN_ID,
    token: TOKEN,
    siteOrigin: ORIGIN, workerOrigin: WORKER_ORIGIN,
    delta: delta({ resolved: [{ ruleId: 'y', page: 'p', selector: 's' }], scoreChange: 5, scoreAfter: 85 }),
  })
  const report = `${ORIGIN}/report/${SCAN_ID}`
  assert.ok(text.includes(report), 'report link missing from text body')
  assert.ok(html.includes(`href="${report}"`), 'report link missing from html body')
})

test('subject names the monitored host', () => {
  const { subject } = buildDigestEmail({
    url: 'https://sub.example.gov/some/path?x=1',
    scanId: SCAN_ID,
    token: TOKEN,
    siteOrigin: ORIGIN, workerOrigin: WORKER_ORIGIN,
    delta: delta({ new: [{ ruleId: 'x', page: 'p', selector: 's' }], scoreChange: -1 }),
  })
  assert.match(subject, /Your Verscala accessibility monitoring update for sub\.example\.gov/)
})

test('score direction is worded by sign, never as a raw signed number that reads backwards', () => {
  const better = buildDigestEmail({ url: 'https://a/', scanId: SCAN_ID, token: TOKEN, siteOrigin: ORIGIN, workerOrigin: WORKER_ORIGIN, delta: delta({ scoreChange: 7, scoreBefore: 73, scoreAfter: 80, resolved: [{ ruleId: 'r', page: 'p', selector: 's' }] }) })
  assert.match(better.text, /score improved: 73 → 80/)

  const worse = buildDigestEmail({ url: 'https://a/', scanId: SCAN_ID, token: TOKEN, siteOrigin: ORIGIN, workerOrigin: WORKER_ORIGIN, delta: delta({ scoreChange: -7, scoreBefore: 80, scoreAfter: 73, new: [{ ruleId: 'r', page: 'p', selector: 's' }] }) })
  assert.match(worse.text, /score declined: 80 → 73/)
})

test('new/resolved counts are singularised correctly and reported', () => {
  const { text } = buildDigestEmail({
    url: 'https://a/',
    scanId: SCAN_ID,
    token: TOKEN,
    siteOrigin: ORIGIN, workerOrigin: WORKER_ORIGIN,
    delta: delta({
      new: [{ ruleId: 'a', page: 'p', selector: 's1' }],
      resolved: [{ ruleId: 'b', page: 'p', selector: 's2' }, { ruleId: 'c', page: 'p', selector: 's3' }],
      scoreChange: 1,
    }),
  })
  assert.match(text, /1 new issue detected/)
  assert.match(text, /2 issues resolved/)
})

test('scoped-out pages are named as excluded, not passed off as changes', () => {
  const { text } = buildDigestEmail({
    url: 'https://a/',
    scanId: SCAN_ID,
    token: TOKEN,
    siteOrigin: ORIGIN, workerOrigin: WORKER_ORIGIN,
    delta: delta({ new: [{ ruleId: 'a', page: 'p', selector: 's' }], scoreChange: -1, scopedOutPages: ['https://a/x', 'https://a/y'] }),
  })
  assert.match(text, /2 pages were not crawled this time and were excluded/)
})

test('a url with quotes cannot break the html email (escaped in both text sink and href)', () => {
  const { html } = buildDigestEmail({
    url: 'https://a/"><script>',
    scanId: SCAN_ID,
    token: TOKEN,
    siteOrigin: ORIGIN, workerOrigin: WORKER_ORIGIN,
    delta: delta({ new: [{ ruleId: 'a', page: 'p', selector: 's' }], scoreChange: -1 }),
  })
  assert.equal(html.includes('<script>'), false, 'raw url markup must not survive into the html body')
})
