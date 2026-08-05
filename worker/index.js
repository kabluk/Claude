import { handlePostScan, handleGetScan } from './routes/scan.js'

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

    return withCors(Response.json({ error: 'not found', code: 'not_found' }, { status: 404 }), cors)
  },
}
