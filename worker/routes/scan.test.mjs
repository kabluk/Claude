// D-109: второй рубеж против вечного status='running' — «ленивое» закрытие
// протухшего скана в момент GET-опроса.
//
// Почему одного сторожа (D-108) мало — доказано продом в тот же день: скан,
// запущенный УЖЕ на воркере со сторожем, всё равно застрял в running — изолят
// со сканом был убит платформой, и waitUntil-промис вместе с таймером сторожа
// исчез, не записав failScan. GET-запрос — короткий и живёт в другом изоляте,
// поэтому проверка «running слишком стар» на чтении не зависит от судьбы
// изолята со сканом.
//
// Мини-D1 — тот же приём, что worker/lib/db.test.mjs::fakeScansDb.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handlePostScan, handleGetScan, isScanStale, REAP_GRACE_MS } from './scan.js'
import { resolveScanTimeoutMs } from '../lib/axe.js'

function fakeScansDb(initialRows = []) {
  const rows = [...initialRows]
  const find = (id) => rows.find((r) => r.id === id)
  return {
    rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              // D-110: POST теперь вставляет строку и уходит — вставка нужна
              // фейку, чтобы проверять, ЧТО осталось в БД после 503.
              if (/^INSERT INTO scans/.test(sql)) {
                const [id, url, email, createdAt] = args
                rows.push({
                  id, url, status: 'running', email, created_at: createdAt,
                  pages_json: null, findings_json: null, score: null, error: null,
                  error_code: null, completed_at: null, progress_json: null,
                })
                return { meta: { changes: 1 } }
              }
              if (/^UPDATE scans SET status = 'error'/.test(sql)) {
                const id = args[args.length - 1]
                const row = find(id)
                // Фейк ИСПОЛНЯЕТ пришедший SQL, а не предполагает его форму:
                // гейт применяется только если он реально есть в запросе.
                // Иначе канарейка «убрали AND status='running' из db.js» была
                // бы ложно-зелёной — фейк с зашитым гейтом маскировал бы дыру.
                const gated = /AND status = 'running'/.test(sql)
                if (row && (!gated || row.status === 'running')) {
                  // reapStaleScan биндит (error, completed_at, id) и зашивает
                  // error_code='timeout' в SQL; failScan биндит error_code
                  // параметром — различаем по самому SQL, не по догадке.
                  const parametrisedCode = /error_code = \?/.test(sql)
                  const [error] = args
                  Object.assign(row, {
                    status: 'error',
                    error,
                    error_code: parametrisedCode ? args[1] : 'timeout',
                    completed_at: parametrisedCode ? args[2] : args[1],
                    progress_json: null,
                  })
                  return { meta: { changes: 1 } }
                }
                return { meta: { changes: 0 } }
              }
              return { meta: { changes: 0 } }
            },
            async first() {
              if (/^SELECT \* FROM scans WHERE id/.test(sql)) return find(args[0]) ?? null
              return null
            },
          }
        },
      }
    },
  }
}

const runningRow = (id, createdAt) => ({
  id, url: 'https://example.test/', status: 'running', created_at: createdAt,
  pages_json: null, findings_json: null, score: null, error: null, error_code: null,
  completed_at: null, progress_json: JSON.stringify({ phase: 'axe', pagesDone: 4, pagesTotal: 6 }),
})

const ENV_TIMEOUT = 120_000
const env = (db) => ({ DB: db, SCAN_TIMEOUT_MS: ENV_TIMEOUT })
const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString()

test('D-109: протухший running закрывается на GET — status=error, errorCode=timeout, в БД тоже', async () => {
  const staleAge = ENV_TIMEOUT + REAP_GRACE_MS + 5_000
  const db = fakeScansDb([runningRow('s1', iso(staleAge))])

  const res = await handleGetScan('s1', env(db))
  const body = await res.json()

  assert.equal(body.status, 'error')
  assert.equal(body.errorCode, 'timeout')
  assert.match(body.error, /timeout/)
  // Не только в ответе — строка в БД реально закрыта, следующий GET уже не reap'ает
  assert.equal(db.rows[0].status, 'error')
  assert.equal(db.rows[0].progress_json, null)
})

test('D-109: свежий running отдаётся как есть — никакого reap до порога', async () => {
  // На секунду МОЛОЖЕ порога: время до конца сторожа + буфер ещё не вышло
  const freshAge = ENV_TIMEOUT + REAP_GRACE_MS - 1_000
  const db = fakeScansDb([runningRow('s2', iso(freshAge))])

  const res = await handleGetScan('s2', env(db))
  const body = await res.json()

  assert.equal(body.status, 'running')
  assert.deepEqual(body.progress, { phase: 'axe', pagesDone: 4, pagesTotal: 6 })
  assert.equal(db.rows[0].status, 'running')
})

test('D-109: гонка — скан дописал done между SELECT и UPDATE; гейт в SQL не даёт затереть результат', async () => {
  const staleAge = ENV_TIMEOUT + REAP_GRACE_MS + 5_000
  const db = fakeScansDb([runningRow('s3', iso(staleAge))])
  // Симуляция гонки: к моменту UPDATE строка уже done (переключаем прямо
  // перед вызовом — fakeDb применяет гейт `AND status='running'` как реальный SQL).
  db.rows[0].status = 'done'
  db.rows[0].findings_json = '[]'
  db.rows[0].pages_json = '["https://example.test/"]'
  db.rows[0].score = 97

  // isScanStale по прочитанному снапшоту сказал бы «протух» — но раз строка
  // уже done, UPDATE обязан пройти мимо (changes: 0), и done остаётся done.
  const { reapStaleScan } = await import('../lib/db.js')
  const reaped = await reapStaleScan(db, { id: 's3', error: 'scan timeout: race' })
  assert.equal(reaped, false)
  assert.equal(db.rows[0].status, 'done')
  assert.equal(db.rows[0].score, 97)
})

// ── D-110: POST только ставит джоб в очередь ────────────────────────────────
// Раньше POST запускал скан в ctx.waitUntil — платформа отменяла его через 30с
// после ответа МОЛЧА (вместе со сторожем D-108), и скан длиннее ~30с навсегда
// оставался running. Ключевое, что проверяем: работа уехала В ОЧЕРЕДЬ, а не
// осталась в waitUntil.

function fakeKv() {
  const store = new Map()
  return {
    async get(k) { return store.get(k) ?? null },
    async put(k, v) { store.set(k, v) },
  }
}

function fakeQueue({ fail = false } = {}) {
  const sent = []
  return {
    sent,
    async send(body) {
      if (fail) throw new Error('Queue send failed: 500')
      sent.push(body)
    },
  }
}

const postRequest = (body) =>
  new Request('https://api.test/api/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7' },
    body: JSON.stringify(body),
  })

// ctx, который ЛОВИТ любую фоновую работу: если кто-то вернёт waitUntil-путь,
// тест это увидит (а не молча пройдёт, как проходил бы с ctx-заглушкой).
const recordingCtx = () => {
  const scheduled = []
  return { scheduled, waitUntil: (p) => { scheduled.push(p); return p } }
}

test('D-110: POST кладёт джоб в очередь и НЕ запускает скан в waitUntil', async () => {
  const db = fakeScansDb([])
  const queue = fakeQueue()
  const ctx = recordingCtx()

  const res = await handlePostScan(
    postRequest({ url: 'https://shop.example.com/', countryCode: 'DE' }),
    { DB: db, RATE_LIMIT_KV: fakeKv(), SCAN_QUEUE: queue },
    ctx
  )
  const body = await res.json()

  assert.equal(res.status, 202)
  assert.equal(queue.sent.length, 1, 'ровно одно сообщение на один POST')
  assert.deepEqual(queue.sent[0], { v: 1, id: body.scanId, url: 'https://shop.example.com/', countryCode: 'DE' })
  // Никакой фоновой работы в ответе POST не осталось — в этом весь D-110
  assert.equal(ctx.scheduled.length, 0)
  // Строка создана заранее: GET /api/scan/:id сразу отдаёт running, а D-109
  // считает протухание от этого created_at.
  assert.equal(db.rows.length, 1)
  assert.equal(db.rows[0].status, 'running')
})

test('D-110: нет биндинга SCAN_QUEUE — явный 503 queue_unavailable, строка НЕ создаётся', async () => {
  const db = fakeScansDb([])
  const ctx = recordingCtx()

  const res = await handlePostScan(
    postRequest({ url: 'https://shop.example.com/' }),
    { DB: db, RATE_LIMIT_KV: fakeKv() }, // биндинга нет
    ctx
  )
  const body = await res.json()

  assert.equal(res.status, 503)
  assert.equal(body.code, 'queue_unavailable')
  // Никакого тихого отката на waitUntil (иначе вернулся бы баг 30с)
  assert.equal(ctx.scheduled.length, 0)
  // И никакого «сироты» в running, который потом впустую реапит D-109
  assert.equal(db.rows.length, 0)
})

test('D-110: очередь отвергла сообщение — строка сразу закрывается failScan, а не висит running', async () => {
  const db = fakeScansDb([])
  const res = await handlePostScan(
    postRequest({ url: 'https://shop.example.com/' }),
    { DB: db, RATE_LIMIT_KV: fakeKv(), SCAN_QUEUE: fakeQueue({ fail: true }) },
    recordingCtx()
  )
  const body = await res.json()

  assert.equal(res.status, 503)
  assert.equal(body.code, 'queue_unavailable')
  assert.equal(db.rows.length, 1)
  assert.equal(db.rows[0].status, 'error')
  assert.equal(db.rows[0].error_code, 'internal')
  assert.match(db.rows[0].error, /enqueue failed/)
})

test('D-110: невалидный url отсекается ДО очереди (порядок проверок не сломан)', async () => {
  const queue = fakeQueue()
  const res = await handlePostScan(
    postRequest({ url: 'ftp://nope' }),
    { DB: fakeScansDb([]), RATE_LIMIT_KV: fakeKv(), SCAN_QUEUE: queue },
    recordingCtx()
  )
  assert.equal(res.status, 400)
  assert.equal(queue.sent.length, 0)
})

test('D-109: isScanStale — done/error не протухают никогда, а running без парсибельной даты протух сразу', () => {
  const e = { SCAN_TIMEOUT_MS: ENV_TIMEOUT }
  assert.equal(isScanStale({ status: 'done', createdAt: '2020-01-01T00:00:00Z' }, e), false)
  assert.equal(isScanStale({ status: 'error', createdAt: '2020-01-01T00:00:00Z' }, e), false)
  assert.equal(isScanStale({ status: 'running', createdAt: 'not-a-date' }, e), true)
  // Порог согласован с резолвером D-108, а не задублирован числом
  const justUnder = Date.now() - (resolveScanTimeoutMs(e) + REAP_GRACE_MS) + 1000
  assert.equal(isScanStale({ status: 'running', createdAt: new Date(justUnder).toISOString() }, e), false)
})
