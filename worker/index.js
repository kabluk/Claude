import { handlePostScan, handleGetScan } from './routes/scan.js'
import { handlePostExplain } from './routes/explain.js'
import { handlePostLead } from './routes/lead.js'
import { handlePostClaim, handleGetClaimVerify } from './routes/claim.js'
import { handlePostStripeHook } from './routes/stripeHook.js'
import { deleteExpiredScans } from './lib/retention.js'

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
}
