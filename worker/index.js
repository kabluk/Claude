import { handlePostScan, handleGetScan } from './routes/scan.js'
import { handleGetScanPdf } from './routes/scanPdf.js'
import { handlePostPlanCheckout } from './routes/planCheckout.js'
import { handlePostExplain } from './routes/explain.js'
import { handlePostLead } from './routes/lead.js'
import { handlePostClaim, handleGetClaimVerify } from './routes/claim.js'
import { handlePostSubscribe, handleGetSubscribeVerify, handleUnsubscribe } from './routes/subscribe.js'
import { handlePostStripeHook } from './routes/stripeHook.js'
import { deleteExpiredScans } from './lib/retention.js'
import { handleScanQueueBatch } from './lib/scanJob.js'

function corsHeaders(env) {
  return {
    'access-control-allow-origin': env.ALLOWED_ORIGIN ?? '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  }
}

function withCors(response, cors) {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(cors)) headers.set(key, value)
  return new Response(response.body, { status: response.status, headers })
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const cors = corsHeaders(env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors })
    }

    if (request.method === 'POST' && url.pathname === '/api/scan') {
      return withCors(await handlePostScan(request, env, ctx), cors)
    }

    // A2-PDF-PLAN: /:id/pdf must be matched BEFORE the plain /:id route below —
    // that one matches on startsWith('/api/scan/') alone and would otherwise
    // swallow this path with id === "<uuid>/pdf" (never found, silent 404).
    if (request.method === 'GET' && url.pathname.startsWith('/api/scan/') && url.pathname.endsWith('/pdf')) {
      const id = url.pathname.slice('/api/scan/'.length, -'/pdf'.length)
      return withCors(await handleGetScanPdf(id, env), cors)
    }

    // A2-STRIPE-CHECKOUT: POST /:id/checkout — like /pdf above, matched by its
    // suffix BEFORE any general /api/scan/ route so the id is sliced cleanly
    // (there is no general POST /api/scan/:id route today, but keep the same
    // discipline the GET /pdf comment established).
    if (request.method === 'POST' && url.pathname.startsWith('/api/scan/') && url.pathname.endsWith('/checkout')) {
      const id = url.pathname.slice('/api/scan/'.length, -'/checkout'.length)
      return withCors(await handlePostPlanCheckout(id, request, env), cors)
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/scan/')) {
      const id = url.pathname.slice('/api/scan/'.length)
      return withCors(await handleGetScan(id, env), cors)
    }

    if (request.method === 'POST' && url.pathname === '/api/explain') {
      return withCors(await handlePostExplain(request, env), cors)
    }

    if (request.method === 'POST' && url.pathname === '/api/lead') {
      return withCors(await handlePostLead(request, env), cors)
    }

    if (request.method === 'POST' && url.pathname === '/api/claim') {
      return withCors(await handlePostClaim(request, env), cors)
    }

    if (request.method === 'GET' && url.pathname === '/api/claim/verify') {
      return withCors(await handleGetClaimVerify(request, env), cors)
    }

    // A3-CRON-SUBSCRIBE-API: точные pathname-совпадения, поэтому порядок
    // между ними не важен (в отличие от /api/scan/:id выше, который матчится
    // по префиксу). unsubscribe принимает и GET (клик по ссылке из письма), и
    // POST (RFC 8058 List-Unsubscribe-Post, будущий A3-CRON-DIGEST-EMAIL) —
    // один и тот же обработчик, токен в query в обоих случаях.
    if (request.method === 'POST' && url.pathname === '/api/subscribe') {
      return withCors(await handlePostSubscribe(request, env), cors)
    }

    if (request.method === 'GET' && url.pathname === '/api/subscribe/verify') {
      return withCors(await handleGetSubscribeVerify(request, env), cors)
    }

    if ((request.method === 'GET' || request.method === 'POST') && url.pathname === '/api/subscribe/unsubscribe') {
      return withCors(await handleUnsubscribe(request, env), cors)
    }

    // Stripe вызывает это server-to-server (не из браузера) — CORS ему не
    // нужен, но withCors безвреден для не-браузерного клиента и держит один
    // общий путь ответа для всех маршрутов этого воркера.
    if (request.method === 'POST' && url.pathname === '/api/stripe-hook') {
      return withCors(await handlePostStripeHook(request, env), cors)
    }

    return withCors(Response.json({ error: 'not found', code: 'not_found' }, { status: 404 }), cors)
  },

  // Cron Trigger (wrangler.jsonc: triggers.crons) — удаляет сканы старше
  // RETENTION_DAYS (worker/lib/retention.js, D-019, RISKS.md R6).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(deleteExpiredScans(env.DB))
  },

  // Consumer очереди accessatlas-scan-queue (D-110): одно сообщение — один скан.
  // Здесь НЕТ ctx.waitUntil: у консьюмера инвокация живёт до конца await'а
  // (до 15 минут), и именно поэтому скан переехал сюда из waitUntil (30с).
  // ack/retry делает сам обработчик (worker/lib/scanJob.js) — по исходу записи
  // в D1, а не по факту доставки сообщения.
  async queue(batch, env, ctx) {
    await handleScanQueueBatch(batch, env)
  },
}
