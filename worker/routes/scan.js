import { insertScanPending, completeScan, failScan, getScan } from '../lib/db.js'
import { checkRateLimit } from '../lib/ratelimit.js'
import { verifyTurnstile } from '../lib/turnstile.js'
import { scanSite } from '../lib/axe.js'
import { scoreFromFindings } from '../lib/score.js'

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

  const { url, email, turnstileToken } = body ?? {}
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

  ctx.waitUntil(
    scanSite(env, url)
      .then(({ pages, findings }) =>
        completeScan(env.DB, { id, pages, findings, score: scoreFromFindings(findings) })
      )
      .catch((err) => failScan(env.DB, { id, error: err?.message ?? String(err) }))
  )

  return Response.json({ scanId: id }, { status: 202 })
}

// GET /api/scan/:id -> ScanReport (см. INTERFACES.md §3)
export async function handleGetScan(id, env) {
  const scan = await getScan(env.DB, id)
  if (!scan) return Response.json({ error: 'not found', code: 'not_found' }, { status: 404 })
  return Response.json(scan)
}
