// D-110: обработчик одного джоба скана из Cloudflare Queues.
//
// Почему модуль вообще появился: раньше скан жил в `ctx.waitUntil()` внутри
// POST /api/scan. У waitUntil жёсткий потолок — платформа отменяет промис через
// 30с после отправки ответа. Отменяется ВСЁ разом: и сам скан, и сторож D-108,
// и его `.catch()` с `failScan`, поэтому строка молча оставалась `running`
// (эмпирика прода: успешные сканы 19–29с — впритык, всё длиннее умирало).
// В консьюмере очереди инвокация живёт до 15 минут, и сторож D-108 наконец
// может доработать сам.
//
// Очередь даёт at-least-once: одно и то же сообщение может прийти повторно
// (повтор после падения инвокации, ретрай по нашему же `retry()`). Поэтому
// перед сканом обязателен идемпотентный гейт по D1 — см. ниже.

import { getScan, completeScan, failScan } from './db.js'
import { makeProgressReporter } from './progress.js'
import { scanSite } from './axe.js'
import { scoreFromFindings } from './score.js'
import { classifyError } from './errors.js'
import { resolveJurisdiction, applyJurisdictionWeight } from './jurisdiction.js'

// Тело сообщения очереди — ТОЛЬКО примитивы (D-110):
//   { v: 1, id, url, countryCode? }
// Юрисдикция здесь НЕ передаётся, хотя объект и сериализуем в JSON: сообщение
// переживает деплой (оно уже в очереди, когда воркер обновляется), и вложенный
// объект с формой из `jurisdiction.js` пришлось бы версионировать вместе с этой
// формой. Строка url + ISO-код страны — стабильный вход, а сама юрисдикция
// пересчитывается здесь тем же `resolveJurisdiction`, что раньше вызывался в
// POST. `v` — на будущее: неизвестная версия не должна молча трактоваться как 1.
export const SCAN_JOB_VERSION = 1

export function buildScanJobMessage({ id, url, countryCode }) {
  return { v: SCAN_JOB_VERSION, id, url, countryCode: countryCode ?? null }
}

// Возвращает строку-исход (для тестов и логов):
//   'completed' | 'failed' | 'skipped' | 'missing' | 'invalid' | 'retry'
// deps — тестовый шов (по образцу env.__launchBrowser в axe.js, но параметром:
// в прод-объекте env ничего лишнего не появляется).
export async function runScanJob(env, msg, deps = {}) {
  const scan = deps.scan ?? scanSite
  const body = msg?.body ?? {}
  const { id, url } = body

  // Мусорное сообщение пересылать бессмысленно — повтор даст тот же мусор.
  if (!id || !url) {
    msg.ack()
    return 'invalid'
  }

  // ИДЕМПОТЕНТНЫЙ ГЕЙТ. Единственный источник правды о том, сделана ли работа, —
  // строка в D1, а не факт доставки сообщения. `running` значит «никто ещё не
  // дописал исход» (в том числе после падения инвокации посреди скана —
  // пересканировать в этом случае правильно). Любой другой статус значит, что
  // исход уже записан: этим же сообщением в прошлой доставке, или вторым
  // рубежом D-109, который реапнул строку по таймауту. Сканировать повторно
  // нельзя — это оплаченный Browser Rendering и затирание готового результата.
  let existing
  try {
    existing = await getScan(env.DB, id)
  } catch {
    // D1 недоступен ДО того, как что-либо сделано, — единственный честный
    // случай для повтора: работа не начата, дублировать нечего.
    msg.retry()
    return 'retry'
  }

  // Строки нет вовсе: её удалил retention-cron (D-019) или POST не доехал.
  // Писать некуда — ack, иначе сообщение будет ходить по кругу до max_retries.
  if (!existing) {
    msg.ack()
    return 'missing'
  }
  if (existing.status !== 'running') {
    msg.ack()
    return 'skipped'
  }

  const jurisdiction = resolveJurisdiction(url, body.countryCode)

  // Ровно та же пара веток, что раньше стояла в .then/.catch у waitUntil:
  // успех → completeScan с юрисдикционным взвешиванием перед score,
  // ошибка scanSite (включая сторож D-108) → failScan с classifyError.
  let record
  let outcome
  try {
    // CN-SCAN-PHASES (D-067): промежуточный прогресс пишется по ходу скана,
    // completeScan/failScan затирают его в NULL.
    const { pages, findings } = await scan(env, url, makeProgressReporter(env.DB, id))
    const weighted = applyJurisdictionWeight(findings, jurisdiction)
    record = () => completeScan(env.DB, { id, pages, findings: weighted, score: scoreFromFindings(weighted) })
    outcome = 'completed'
  } catch (err) {
    const message = err?.message ?? String(err)
    record = () => failScan(env.DB, { id, error: message, errorCode: classifyError(message) })
    outcome = 'failed'
  }

  try {
    await record()
  } catch {
    // Скан отработал, но исход в D1 НЕ записан — строка осталась `running`,
    // и без повтора её закроет только реап D-109 (ошибкой поверх, возможно,
    // успешного скана). Повторяем: гейт выше пропустит сообщение снова именно
    // потому, что статус всё ещё `running`. Цена — повторный скан, поэтому
    // max_retries в wrangler.jsonc держится маленьким.
    msg.retry()
    return 'retry'
  }

  // ack в ОБОИХ исходах: работа учтена в D1, повтор ничего не улучшит.
  msg.ack()
  return outcome
}

// Консьюмер очереди: max_batch_size = 1 (wrangler.jsonc), но цикл написан
// честно по батчу — размер батча это конфиг, а не инвариант кода.
// Сообщения обрабатываются последовательно: параллельно они бы делили одну
// инвокацию и один лимит Browser Rendering.
export async function handleScanQueueBatch(batch, env) {
  const outcomes = []
  for (const msg of batch.messages) {
    outcomes.push(await runScanJob(env, msg))
  }
  return outcomes
}
