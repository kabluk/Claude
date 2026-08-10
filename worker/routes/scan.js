import { insertScanPending, completeScan, failScan, getScan, reapStaleScan } from '../lib/db.js'
import { makeProgressReporter } from '../lib/progress.js'
import { checkRateLimit } from '../lib/ratelimit.js'
import { verifyTurnstile } from '../lib/turnstile.js'
import { scanSite, resolveScanTimeoutMs } from '../lib/axe.js'
import { scoreFromFindings } from '../lib/score.js'
import { classifyError } from '../lib/errors.js'
import { resolveJurisdiction, applyJurisdictionWeight } from '../lib/jurisdiction.js'

function isHttpUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// POST /api/scan {url, email?, turnstileToken?} -> 202 {scanId}
// Работа идёт в ctx.waitUntil после ответа — Browser Rendering может занять
// больше времени, чем разумно держать клиента на связи (architecture.md слой 2).
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

  const id = crypto.randomUUID()
  await insertScanPending(env.DB, { id, url, email, createdAt: new Date().toISOString() })

  // A3-JURISDICTION: "нет заявления -> §37 BFSG, до €100k" юридически весомее, чем
  // "color-contrast: serious" — взвешиваем ПОСЛЕ скана, ДО подсчёта score, чтобы
  // score.js остался generic (без знания о юрисдикциях) и продолжал работать по
  // impact, как раньше. countryCode (опционально, от пользователя) перебивает
  // TLD-эвристику — сайт на .com, обслуживающий Германию, иначе не определился бы
  // вовсе (D-032). Невалидный код молча игнорируется, скан не падает.
  const jurisdiction = resolveJurisdiction(url, countryCode)

  ctx.waitUntil(
    // CN-SCAN-PHASES (D-067): промежуточный прогресс пишется в D1 по ходу скана;
    // completeScan/failScan финально перезаписывают его в NULL. Ошибки записи
    // прогресса проглатываются репортером — скан важнее телеметрии.
    scanSite(env, url, makeProgressReporter(env.DB, id))
      .then(({ pages, findings }) => {
        const weighted = applyJurisdictionWeight(findings, jurisdiction)
        return completeScan(env.DB, { id, pages, findings: weighted, score: scoreFromFindings(weighted) })
      })
      .catch((err) => {
        const message = err?.message ?? String(err)
        return failScan(env.DB, { id, error: message, errorCode: classifyError(message) })
      })
  )

  return Response.json({ scanId: id }, { status: 202 })
}

// D-109: буфер поверх сторожа D-108 — GET считает скан протухшим только когда
// внутренний сторож уже ТОЧНО должен был сработать и записать failScan сам.
// Если этого не случилось, изолят со сканом мёртв (вместе со сторожем), и
// закрывать строку больше некому, кроме этого короткого запроса.
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
