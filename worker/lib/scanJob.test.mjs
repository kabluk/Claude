// D-110: обработчик джоба скана из очереди.
//
// Что здесь проверяется по существу (а не «функция вызвалась»):
//  1) успех/ошибка скана записываются в D1 ровно теми же путями, что раньше
//     стояли в .then/.catch у waitUntil (completeScan со взвешиванием
//     юрисдикции; failScan с classifyError);
//  2) ИДЕМПОТЕНТНОСТЬ: очередь даёт at-least-once — повторная доставка на уже
//     завершённой строке не должна запускать скан ещё раз (это оплаченный
//     Browser Rendering и затирание готового результата);
//  3) ack/retry: ack в обоих исходах скана (исход записан — повторять нечего),
//     retry только когда исход НЕ записан (D1 недоступен).
//
// Мини-D1 — тот же приём, что worker/lib/db.test.mjs::fakeScansDb: фейк
// ИСПОЛНЯЕТ пришедший SQL, а не предполагает его форму (иначе канарейка по
// SQL-гейту была бы ложно-зелёной, см. D-109).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  runScanJob, handleScanQueueBatch, buildScanJobMessage, SCAN_JOB_VERSION,
  MAX_DELIVERIES, BUSY_RETRY_DELAYS_SECONDS,
} from './scanJob.js'

function fakeScansDb(initialRows = [], { failReads = false, failWrites = false } = {}) {
  const rows = [...initialRows]
  const find = (id) => rows.find((r) => r.id === id)
  return {
    rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (failWrites) throw new Error('D1_ERROR: database is unavailable')
              if (/^UPDATE scans SET status = 'done'/.test(sql)) {
                const [pages, findings, score, completed, id] = args
                const row = find(id)
                if (!row) return { meta: { changes: 0 } }
                Object.assign(row, {
                  status: 'done', pages_json: pages, findings_json: findings,
                  score, completed_at: completed, progress_json: null,
                })
                return { meta: { changes: 1 } }
              }
              if (/^UPDATE scans SET status = 'error'/.test(sql)) {
                const gated = /AND status = 'running'/.test(sql)
                const id = args[args.length - 1]
                const row = find(id)
                if (row && (!gated || row.status === 'running')) {
                  const [error, errorCode, completed] = args
                  Object.assign(row, {
                    status: 'error', error, error_code: errorCode,
                    completed_at: completed, progress_json: null,
                  })
                  return { meta: { changes: 1 } }
                }
                return { meta: { changes: 0 } }
              }
              if (/^UPDATE scans SET progress_json/.test(sql)) {
                const [progress, id] = args
                const row = find(id)
                const gated = /AND status = 'running'/.test(sql)
                if (row && (!gated || row.status === 'running')) row.progress_json = progress
                return { meta: { changes: 1 } }
              }
              return { meta: { changes: 0 } }
            },
            async first() {
              if (failReads) throw new Error('D1_ERROR: database is unavailable')
              if (/^SELECT \* FROM scans WHERE id/.test(sql)) return find(args[0]) ?? null
              return null
            },
          }
        },
      }
    },
  }
}

const row = (id, status, extra = {}) => ({
  id, url: 'https://shop.example.de/', status, created_at: new Date().toISOString(),
  pages_json: null, findings_json: null, score: null, error: null, error_code: null,
  completed_at: null, progress_json: null, ...extra,
})

// attempts — счётчик ДОСТАВОК Cloudflare Queues, начинается с 1 (A1-SCAN-BUSY-RETRY).
// retry теперь может зваться с опциями (`{ delaySeconds }`) — фейк их записывает,
// иначе тест на расписание задержек был бы ложно-зелёным при любом delaySeconds.
function fakeMessage(body, attempts = 1) {
  const calls = { ack: 0, retry: 0, retryOpts: [] }
  return {
    body,
    attempts,
    calls,
    ack() { calls.ack += 1 },
    retry(opts) { calls.retry += 1; calls.retryOpts.push(opts) },
  }
}

const jobBody = (id, url = 'https://shop.example.de/', countryCode = null) =>
  buildScanJobMessage({ id, url, countryCode })

test('D-110: happy path — скан выполнен, completeScan записал результат, ack', async () => {
  const db = fakeScansDb([row('j1', 'running')])
  const msg = fakeMessage(jobBody('j1'))
  let scanCalls = 0

  const outcome = await runScanJob({ DB: db }, msg, {
    async scan(env, url, onProgress) {
      scanCalls += 1
      await onProgress('axe', 1, 2) // прогресс D-067 продолжает работать из джоба
      return {
        pages: [url],
        // Юридически решающая находка: .de => statementRequired, значит
        // applyJurisdictionWeight обязан проставить jurisdictionCountry.
        findings: [{ ruleId: 'a11y-statement-missing', wcag: [], impact: 'critical', selector: 'html', page: url }],
      }
    },
  })

  assert.equal(outcome, 'completed')
  assert.equal(scanCalls, 1)
  assert.equal(msg.calls.ack, 1)
  assert.equal(msg.calls.retry, 0)
  assert.equal(db.rows[0].status, 'done')
  assert.equal(db.rows[0].progress_json, null)
  assert.equal(typeof db.rows[0].score, 'number')
  const findings = JSON.parse(db.rows[0].findings_json)
  assert.equal(findings[0].jurisdictionCountry, 'DE')
})

test('D-110: countryCode из сообщения перебивает TLD (D-032 пережил переезд в очередь)', async () => {
  const db = fakeScansDb([row('j2', 'running', { url: 'https://shop.example.com/' })])
  const msg = fakeMessage(jobBody('j2', 'https://shop.example.com/', 'FR'))

  await runScanJob({ DB: db }, msg, {
    async scan(env, url) {
      return { pages: [url], findings: [{ ruleId: 'a11y-statement-missing', wcag: [], impact: 'serious', selector: 'html', page: url }] }
    },
  })

  const findings = JSON.parse(db.rows[0].findings_json)
  assert.equal(findings[0].jurisdictionCountry, 'FR')
  assert.equal(findings[0].impact, 'critical')
})

test('D-110 ИДЕМПОТЕНТНОСТЬ: строка уже done — скан НЕ запускается повторно, ack, результат цел', async () => {
  const done = row('j3', 'done', { score: 97, findings_json: '[]', pages_json: '["https://shop.example.de/"]', completed_at: '2026-08-10T00:00:00.000Z' })
  const db = fakeScansDb([done])
  const msg = fakeMessage(jobBody('j3'))
  let scanCalls = 0

  const outcome = await runScanJob({ DB: db }, msg, {
    async scan() { scanCalls += 1; return { pages: [], findings: [] } },
  })

  assert.equal(outcome, 'skipped')
  assert.equal(scanCalls, 0, 'повторная доставка не должна сканировать заново')
  assert.equal(msg.calls.ack, 1)
  assert.equal(msg.calls.retry, 0)
  assert.equal(db.rows[0].score, 97)
  assert.equal(db.rows[0].status, 'done')
})

test('D-110 ИДЕМПОТЕНТНОСТЬ: строку уже закрыл реап D-109 (error) — тоже не сканируем, ack', async () => {
  const db = fakeScansDb([row('j4', 'error', { error: 'scan timeout: worker died mid-scan', error_code: 'timeout' })])
  const msg = fakeMessage(jobBody('j4'))
  let scanCalls = 0

  const outcome = await runScanJob({ DB: db }, msg, { async scan() { scanCalls += 1; return { pages: [], findings: [] } } })

  assert.equal(outcome, 'skipped')
  assert.equal(scanCalls, 0)
  assert.equal(msg.calls.ack, 1)
})

test('D-110: ошибка скана (сторож D-108) — failScan с classifyError, ack, а НЕ retry', async () => {
  const db = fakeScansDb([row('j5', 'running')])
  const msg = fakeMessage(jobBody('j5'))

  const outcome = await runScanJob({ DB: db }, msg, {
    async scan() { throw new Error('scan timeout: no result after 120000ms') },
  })

  assert.equal(outcome, 'failed')
  assert.equal(db.rows[0].status, 'error')
  // classifyError матчит слово "timeout" — тот же контракт, что у D-108
  assert.equal(db.rows[0].error_code, 'timeout')
  assert.match(db.rows[0].error, /timeout/)
  // Исход записан в D1 — повторять скан бессмысленно и дорого
  assert.equal(msg.calls.ack, 1)
  assert.equal(msg.calls.retry, 0)
})

test('D-110: D1 недоступен на ЧТЕНИИ — retry, скан не запускался (работа не начата)', async () => {
  const db = fakeScansDb([row('j6', 'running')], { failReads: true })
  const msg = fakeMessage(jobBody('j6'))
  let scanCalls = 0

  const outcome = await runScanJob({ DB: db }, msg, { async scan() { scanCalls += 1; return { pages: [], findings: [] } } })

  assert.equal(outcome, 'retry')
  assert.equal(scanCalls, 0)
  assert.equal(msg.calls.retry, 1)
  assert.equal(msg.calls.ack, 0)
})

test('D-110: скан прошёл, но запись исхода в D1 упала — retry (исход НЕ записан)', async () => {
  const db = fakeScansDb([row('j7', 'running')])
  // Чтение работает, запись — нет: гейт пропустит сообщение при повторе,
  // потому что строка так и осталась running.
  db.prepare = ((orig) => (sql) => {
    const stmt = orig(sql)
    return {
      bind(...args) {
        const bound = stmt.bind(...args)
        return { first: bound.first, async run() { throw new Error('D1_ERROR: write failed') } }
      },
    }
  })(db.prepare.bind(db))
  const msg = fakeMessage(jobBody('j7'))

  const outcome = await runScanJob({ DB: db }, msg, {
    async scan(env, url) { return { pages: [url], findings: [] } },
  })

  assert.equal(outcome, 'retry')
  assert.equal(msg.calls.retry, 1)
  assert.equal(msg.calls.ack, 0)
  assert.equal(db.rows[0].status, 'running')
})

test('D-110: строки нет (её удалил retention-cron) — ack, не крутим сообщение по кругу', async () => {
  const db = fakeScansDb([])
  const msg = fakeMessage(jobBody('gone'))
  const outcome = await runScanJob({ DB: db }, msg, { async scan() { throw new Error('must not scan') } })
  assert.equal(outcome, 'missing')
  assert.equal(msg.calls.ack, 1)
})

test('D-110: мусорное сообщение без id/url — ack (повтор даст тот же мусор)', async () => {
  const db = fakeScansDb([])
  const msg = fakeMessage({ v: SCAN_JOB_VERSION })
  const outcome = await runScanJob({ DB: db }, msg, { async scan() { throw new Error('must not scan') } })
  assert.equal(outcome, 'invalid')
  assert.equal(msg.calls.ack, 1)
})

test('D-110: батч обрабатывается последовательно, каждое сообщение получает свой ack', async () => {
  const db = fakeScansDb([row('b1', 'running'), row('b2', 'done', { score: 50 })])
  const messages = [fakeMessage(jobBody('b1')), fakeMessage(jobBody('b2'))]
  // Реальный consumer вызывает handleScanQueueBatch без deps — здесь важно, что
  // ходят все сообщения батча; скан для b1 подменять нечем, поэтому проверяем
  // через runScanJob-совместимый путь: b2 отсеется гейтом, b1 упадёт на
  // отсутствующем Browser Rendering и будет честно записан как failScan.
  const outcomes = await handleScanQueueBatch({ messages }, { DB: db })

  assert.equal(outcomes.length, 2)
  // b1: настоящий scanSite без Browser Rendering падает — и это записано как
  // failScan (доказывает, что дефолтный путь без deps реально прошит до axe.js)
  assert.equal(outcomes[0], 'failed')
  assert.equal(db.rows[0].status, 'error')
  assert.equal(outcomes[1], 'skipped')
  assert.equal(messages[0].calls.ack, 1)
  assert.equal(messages[1].calls.ack, 1)
  assert.equal(db.rows[1].score, 50)
})

// ── A1-SCAN-BUSY-RETRY ───────────────────────────────────────────────────────
// Прод 2026-08-10 отдал ДОСЛОВНО эту строку при упоре в лимит Browser Rendering.
const BUSY_MESSAGE = 'Unable to create new browser: code: 429: message: Rate limit exceeded'
const busyScan = { async scan() { throw new Error(BUSY_MESSAGE) } }

test('A1-SCAN-BUSY-RETRY: busy на 1-й доставке — retry через 20с, строка в D1 НЕ тронута', async () => {
  const db = fakeScansDb([row('b-1', 'running', { progress_json: '{"phase":"axe"}' })])
  const msg = fakeMessage(jobBody('b-1'), 1)

  const outcome = await runScanJob({ DB: db }, msg, busyScan)

  assert.equal(outcome, 'busy-retry')
  assert.equal(msg.calls.retry, 1)
  assert.deepEqual(msg.calls.retryOpts[0], { delaySeconds: 20 })
  assert.equal(msg.calls.ack, 0)
  // Гейт следующей доставки пропустит сообщение ТОЛЬКО пока статус running —
  // поэтому в этой ветке в D1 не пишется вообще ничего, включая прогресс.
  assert.equal(db.rows[0].status, 'running')
  assert.equal(db.rows[0].error_code, null)
  assert.equal(db.rows[0].progress_json, '{"phase":"axe"}')
})

test('A1-SCAN-BUSY-RETRY: busy на 2-й доставке — retry через 40с (задержки растут)', async () => {
  const db = fakeScansDb([row('b-2', 'running')])
  const msg = fakeMessage(jobBody('b-2'), 2)

  const outcome = await runScanJob({ DB: db }, msg, busyScan)

  assert.equal(outcome, 'busy-retry')
  assert.deepEqual(msg.calls.retryOpts[0], { delaySeconds: 40 })
  assert.equal(db.rows[0].status, 'running')
})

test('A1-SCAN-BUSY-RETRY: busy на последней доставке — честный failScan busy, retry НЕ зовётся', async () => {
  const db = fakeScansDb([row('b-3', 'running')])
  const msg = fakeMessage(jobBody('b-3'), MAX_DELIVERIES)

  const outcome = await runScanJob({ DB: db }, msg, busyScan)

  assert.equal(outcome, 'failed')
  assert.equal(msg.calls.retry, 0, 'ретрай сверх max_retries платформа отбросит — исход потерялся бы')
  assert.equal(msg.calls.ack, 1)
  assert.equal(db.rows[0].status, 'error')
  // Не 'internal': у нас ничего не сломано, занята платформа (INTERFACES.md §3)
  assert.equal(db.rows[0].error_code, 'busy')
})

test('A1-SCAN-BUSY-RETRY: сообщение без attempts — сразу failScan, а не бесконечный ретрай', async () => {
  const db = fakeScansDb([row('b-4', 'running')])
  const msg = fakeMessage(jobBody('b-4'), undefined)
  delete msg.attempts

  const outcome = await runScanJob({ DB: db }, msg, busyScan)

  assert.equal(outcome, 'failed')
  assert.equal(msg.calls.retry, 0)
  assert.equal(db.rows[0].error_code, 'busy')
})

test('A1-SCAN-BUSY-RETRY: НЕ-busy ошибка на 1-й доставке — failScan сразу, без ретрая', async () => {
  const db = fakeScansDb([row('b-5', 'running')])
  const msg = fakeMessage(jobBody('b-5'), 1)

  const outcome = await runScanJob({ DB: db }, msg, {
    async scan() { throw new Error('net::ERR_NAME_NOT_RESOLVED at https://shop.example.de/page429') },
  })

  assert.equal(outcome, 'failed')
  assert.equal(msg.calls.retry, 0, 'мёртвый домен не станет живым через 20с — ретрай был бы платным впустую')
  assert.equal(db.rows[0].error_code, 'unreachable')
})

// ГЕЙТ КОНФИГА. MAX_DELIVERIES дублирует wrangler.jsonc (в сообщении числа нет,
// вывести его в рантайме неоткуда). Дубликат без гейта тихо разъедется: подняли
// max_retries — консьюмер перестанет ретраить busy на последних доставках,
// опустили — начнёт ретраить в пустоту, теряя исход скана. Оба отказа молчаливы.
function stripJsoncComments(text) {
  // Посимвольно, со знанием о строках: `//` внутри строкового литерала (в
  // wrangler.jsonc сейчас такого нет, но URL в vars появится завтра) не должен
  // съедать остаток строки.
  let out = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (inString) {
      out += c
      if (escaped) escaped = false
      else if (c === '\\') escaped = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') { inString = true; out += c; continue }
    if (c === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i += 1
      out += '\n'
      continue
    }
    if (c === '/' && text[i + 1] === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i += 1
      i += 1
      continue
    }
    out += c
  }
  return out
}

test('A1-SCAN-BUSY-RETRY: MAX_DELIVERIES синхронизирован с max_retries в wrangler.jsonc', () => {
  const raw = readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8')
  const config = JSON.parse(stripJsoncComments(raw))

  const producer = config.queues.producers.find((p) => p.binding === 'SCAN_QUEUE')
  assert.ok(producer, 'producer SCAN_QUEUE исчез из конфига')
  // Ищем консьюмера ПО ИМЕНИ очереди продюсера, а не по индексу: переименование
  // очереди на одной стороне тоже обязано покраснеть.
  const consumer = config.queues.consumers.find((c) => c.queue === producer.queue)
  assert.ok(consumer, `нет консьюмера для очереди ${producer.queue}`)

  assert.equal(
    MAX_DELIVERIES,
    1 + consumer.max_retries,
    'msg.attempts считает ДОСТАВКИ и начинается с 1: доставок = 1 + max_retries',
  )
  // Задержек ровно столько, сколько ретраев: лишняя никогда не применится,
  // недостающая молча упала бы в null и превратилась в преждевременный failScan.
  assert.equal(BUSY_RETRY_DELAYS_SECONDS.length, consumer.max_retries)
  // Окно реапа D-109: 120с сторож + 60с grace. Сумма задержек обязана оставлять
  // место хотя бы на старт последней доставки внутри окна.
  const totalDelay = BUSY_RETRY_DELAYS_SECONDS.reduce((a, b) => a + b, 0)
  assert.ok(totalDelay < 180, `суммарная задержка ${totalDelay}с не влезает в окно реапа 180с`)
})

test('D-110: buildScanJobMessage кладёт в очередь только примитивы (сообщение переживает деплой)', () => {
  const body = buildScanJobMessage({ id: 'x', url: 'https://a.de/', countryCode: 'DE' })
  assert.deepEqual(body, { v: 1, id: 'x', url: 'https://a.de/', countryCode: 'DE' })
  // Ровно то, что переживёт JSON-сериализацию очереди, без вложенных объектов
  assert.deepEqual(JSON.parse(JSON.stringify(body)), body)
  assert.equal(buildScanJobMessage({ id: 'x', url: 'https://a.de/' }).countryCode, null)
})
