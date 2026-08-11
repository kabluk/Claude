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

// A1-SCAN-BUSY-RETRY. Максимум ДОСТАВОК одного сообщения: `msg.attempts` в
// Cloudflare Queues — счётчик доставок и начинается с 1, поэтому
// `max_retries: 2` в wrangler.jsonc даёт ровно 3 доставки. Константу нельзя
// вывести из рантайма (в сообщении её нет), значит она дублирует конфиг —
// а за дрейфом дубликата следит гейт в scanJob.test.mjs, который парсит
// wrangler.jsonc и сверяет `1 + max_retries` с этим числом.
export const MAX_DELIVERIES = 3

// Задержка перед следующей доставкой, по номеру ТЕКУЩЕЙ доставки: 20с после
// 1-й, 40с после 2-й. Арифметика упирается в окно реапа D-109: строка
// `running` закрывается на чтении через SCAN_TIMEOUT_MS (120с) + REAP_GRACE_MS
// (60с) = 180с от created_at, который ставится в POST.
//   доставка 1: ~0с, отказ busy приходит почти сразу (puppeteer.launch падает
//               ДО сторожа D-108 и до единой навигации) → ретрай +20с;
//   доставка 2: ~20с, то же самое → ретрай +40с;
//   доставка 3: ~60с. Если браузер наконец дали — на полный сторожевой скан
//               (120с) остаётся ровно 180-60=120с, впритык, но реап и не
//               обязан ждать: `completeScan` без status-гейта перезапишет
//               реапнутую строку настоящим результатом (D-110).
//               Если снова busy — failScan пишется на ~60с, с запасом.
// Отсюда и потолок: третья задержка (80с+) увела бы старт скана за окно реапа,
// и пользователь получал бы 'timeout' от сторожа вместо честного 'busy'.
export const BUSY_RETRY_DELAYS_SECONDS = [20, 40]

// null = ретраить нельзя (не busy, попытки исчерпаны или счётчик доставок
// непонятен) → зовущий пишет обычный failScan.
export function busyRetryDelaySeconds(errorCode, attempts) {
  if (errorCode !== 'busy') return null
  // Незнакомый/отсутствующий attempts трактуем как «последняя доставка»: без
  // счётчика мы не знаем, сколько ретраев уже было, а лишний `retry()` сверх
  // max_retries платформа просто отбросит — сообщение исчезнет, исход в D1 так
  // и не будет записан, и строку закроет реап D-109 ошибкой 'timeout' (ложь
  // вместо 'busy'). Честный отказ прямо сейчас безопаснее потерянного скана.
  if (!Number.isInteger(attempts) || attempts < 1) return null
  if (attempts >= MAX_DELIVERIES) return null
  return BUSY_RETRY_DELAYS_SECONDS[attempts - 1] ?? null
}

// Возвращает строку-исход (для тестов и логов):
//   'completed' | 'failed' | 'skipped' | 'missing' | 'invalid' | 'retry' | 'busy-retry'
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
    // A4-SITE-COUNTRY: body.countryCode — тот же вход, что уже используется
    // строкой выше для юрисдикции, ПОВТОРНО передаётся сюда как
    // countryCodeOverride (D-032-style override-wins, worker/lib/siteCountry.js).
    // `country` в fallback на случай тестового `deps.scan`, отдающего только
    // {pages, findings} (scanJob.test.mjs) — реальный scanSite всегда отдаёт его.
    const { pages, findings, country = { code: null, source: 'unknown' } } =
      await scan(env, url, makeProgressReporter(env.DB, id), body.countryCode)
    const weighted = applyJurisdictionWeight(findings, jurisdiction)
    record = () => completeScan(env.DB, { id, pages, findings: weighted, score: scoreFromFindings(weighted), country })
    outcome = 'completed'
  } catch (err) {
    const message = err?.message ?? String(err)
    const errorCode = classifyError(message)

    // A1-SCAN-BUSY-RETRY: Browser Rendering занят (429 на создании браузера).
    // Это не отказ скана — это «сейчас нельзя, попробуй позже», и записывать
    // его пользователю как исход, пока остались доставки, значит терять
    // работоспособный скан из-за секундного всплеска на платформе.
    const delaySeconds = busyRetryDelaySeconds(errorCode, msg.attempts)
    if (delaySeconds !== null) {
      // Строку в D1 НЕ трогаем вообще: она остаётся `running` с текущим
      // прогрессом, и идемпотентный гейт выше пропустит следующую доставку
      // именно поэтому. Любая запись здесь (даже прогресса) была бы либо
      // затиранием, либо новым состоянием, которое гейт не умеет читать.
      msg.retry({ delaySeconds })
      return 'busy-retry'
    }

    // Попытки исчерпаны (или ошибка не busy) — обычный исход. classifyError
    // уже дал 'busy', пользователь увидит честное «сканер на пределе», а не
    // «что-то сломалось у нас».
    record = () => failScan(env.DB, { id, error: message, errorCode })
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
