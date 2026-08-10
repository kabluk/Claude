import { insertScanPending, failScan, getScan, reapStaleScan } from '../lib/db.js'
import { checkRateLimit } from '../lib/ratelimit.js'
import { verifyTurnstile } from '../lib/turnstile.js'
import { resolveScanTimeoutMs } from '../lib/axe.js'
import { buildScanJobMessage } from '../lib/scanJob.js'

function isHttpUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// POST /api/scan {url, email?, turnstileToken?, countryCode?} -> 202 {scanId}
// D-110: роут только СТАВИТ джоб в очередь (SCAN_QUEUE) и отвечает 202. Скан
// выполняется консьюмером (worker/lib/scanJob.js). Раньше он шёл в
// `ctx.waitUntil()` — и платформа молча отменяла его через 30с после ответа,
// вместе со сторожем D-108, поэтому любой скан длиннее ~30с навсегда оставался
// `running`. `ctx` в сигнатуре сохранён: подпись роута общая для index.js.
export async function handlePostScan(request, env, ctx) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid JSON body', code: 'bad_request' }, { status: 400 })
  }

  const { url, email, turnstileToken, countryCode } = body ?? {}
  if (!url || !isHttpUrl(url)) {
    return Response.json({ error: 'url must be an http(s) URL', code: 'bad_request' }, { status: 400 })
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const domain = new URL(url).hostname

  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken, ip)
    if (!ok) return Response.json({ error: 'turnstile verification failed', code: 'forbidden' }, { status: 403 })
  }

  const rl = await checkRateLimit(env.RATE_LIMIT_KV, { ip, domain })
  if (!rl.allowed) {
    return Response.json({ error: `rate limit exceeded (${rl.reason})`, code: 'rate_limited' }, { status: 429 })
  }

  // Биндинга нет — отвечаем 503 ДО вставки строки, а не откатываемся на
  // waitUntil (D-110, осознанный выбор). Тихий откат вернул бы ровно ту
  // поломку, ради которой сделана очередь: скан старше 30с умирал бы молча, и
  // отличить «работает по-старому» от «сломано» стало бы невозможно ни по
  // ответу API, ни по логам. Отсутствие биндинга — ошибка конфигурации деплоя,
  // и она обязана быть громкой. Проверка ДО insertScanPending: иначе на каждый
  // такой запрос оставалась бы висеть строка `running`, которую потом
  // впустую реапит D-109.
  if (!env.SCAN_QUEUE?.send) {
    return Response.json(
      { error: 'scan queue is not configured on this deployment', code: 'queue_unavailable' },
      { status: 503 }
    )
  }

  const id = crypto.randomUUID()
  // created_at ставится ЗДЕСЬ, до постановки в очередь, — от него D-109 считает
  // протухание. Ожидание в очереди входит в этот отсчёт: при пустой очереди оно
  // <1с, а grace 60с поверх сторожа 120с покрывает его с запасом (см. D-110).
  await insertScanPending(env.DB, { id, url, email, createdAt: new Date().toISOString() })

  // A3-JURISDICTION живёт теперь в консьюмере (lib/scanJob.js): в сообщение
  // кладём только примитивы (url, countryCode), юрисдикция пересчитывается там —
  // сообщение переживает деплой, вложенный объект пришлось бы версионировать.
  try {
    await env.SCAN_QUEUE.send(buildScanJobMessage({ id, url, countryCode }))
  } catch (err) {
    // Строка уже вставлена, а джоба не будет — закрываем её сразу сами, иначе
    // пользователь смотрел бы на `running` до срабатывания реапа D-109 (3 мин)
    // ради ошибки, известной прямо сейчас.
    const message = err?.message ?? String(err)
    await failScan(env.DB, { id, error: `scan enqueue failed: ${message}`, errorCode: 'internal' })
    return Response.json({ error: 'could not enqueue scan', code: 'queue_unavailable' }, { status: 503 })
  }

  return Response.json({ scanId: id }, { status: 202 })
}

// D-109: буфер поверх сторожа D-108 — GET считает скан протухшим только когда
// внутренний сторож уже ТОЧНО должен был сработать и записать failScan сам.
// Если этого не случилось, изолят со сканом мёртв (вместе со сторожем), и
// закрывать строку больше некому, кроме этого короткого запроса.
//
// D-110 (очередь) отсчёт НЕ меняет и grace не увеличивает: created_at ставится
// в POST, а ожидание в очереди при max_batch_size=1 и пустой очереди <1с —
// 60с поверх 120с покрывают его на два порядка. Единственный сценарий, где
// реальный старт скана уезжает далеко вперёд, — повтор после падения инвокации;
// но и тогда строка ещё `running`: реап закроет её ошибкой, а доработавший
// повтор перезапишет строку настоящим результатом через completeScan (у него
// нет status-гейта — намеренно: свежий факт побеждает предположение сторожа).
export const REAP_GRACE_MS = 60_000

export function isScanStale(scan, env, now = Date.now()) {
  if (scan.status !== 'running') return false
  const startedAt = Date.parse(scan.createdAt)
  // Строка без парсибельной даты не «свежая», а сломанная — считаем протухшей:
  // вернуть running, который никто никогда не закроет, хуже честной ошибки.
  if (Number.isNaN(startedAt)) return true
  return now - startedAt > resolveScanTimeoutMs(env) + REAP_GRACE_MS
}

// GET /api/scan/:id -> ScanReport (см. INTERFACES.md §3)
export async function handleGetScan(id, env) {
  const scan = await getScan(env.DB, id)
  if (!scan) return Response.json({ error: 'not found', code: 'not_found' }, { status: 404 })
  if (isScanStale(scan, env)) {
    await reapStaleScan(env.DB, {
      id,
      // Слово "timeout" в тексте — для симметрии с D-108; errorCode здесь
      // задаётся напрямую в SQL, classifyError не участвует.
      error: 'scan timeout: worker died mid-scan, closed by watchdog on read',
    })
    // Перечитываем, а не собираем ответ руками: если гонка (скан успел
    // дописать done между SELECT и UPDATE) — гейт в reapStaleScan ничего не
    // тронул, и пользователь получит НАСТОЯЩИЙ результат, а не ошибку.
    return Response.json(await getScan(env.DB, id))
  }
  return Response.json(scan)
}
