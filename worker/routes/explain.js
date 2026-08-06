import { isValidRuleId, explainRule } from '../lib/explain.js'
import { checkExplainRateLimit } from '../lib/ratelimit.js'

// POST /api/explain {ruleId, locale?} -> {explanation, fixExamples[]}
// Почти всегда cache-hit (KV, D-016) — платный вызов Anthropic только на первый
// запрос конкретного ruleId после деплоя/протухания кэша.
export async function handlePostExplain(request, env) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid JSON body', code: 'bad_request' }, { status: 400 })
  }

  const { ruleId, locale } = body ?? {}
  if (!isValidRuleId(ruleId)) {
    return Response.json({ error: 'ruleId must be a valid axe-core rule identifier', code: 'bad_request' }, { status: 400 })
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const rl = await checkExplainRateLimit(env.RATE_LIMIT_KV, ip)
  if (!rl.allowed) {
    return Response.json({ error: `rate limit exceeded (${rl.reason})`, code: 'rate_limited' }, { status: 429 })
  }

  if (!env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'explanations are not configured on this deployment', code: 'not_configured' }, { status: 503 })
  }

  try {
    const result = await explainRule(env, { ruleId, locale })
    return Response.json(result)
  } catch (err) {
    return Response.json({ error: err?.message ?? 'failed to generate explanation', code: 'internal' }, { status: 502 })
  }
}
