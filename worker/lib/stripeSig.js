// Проверка подписи Stripe webhook (реальный алгоритм Stripe, не упрощённая
// схема — см. docs/project/GRAPH.yaml узел A2-STRIPE-WEBHOOK-CODE):
//
//   Stripe-Signature: t=<unix-timestamp>,v1=<hex-hmac>[,v1=<hex-hmac>...][,v0=...]
//   signed_payload = "{timestamp}.{raw_request_body}"
//   expected = HMAC-SHA256(webhook signing secret, signed_payload), hex-encoded
//
// Событие валидно, если хотя бы одна из полученных v1-подписей совпадает с
// expected (Stripe шлёт несколько v1 при ротации секрета — см. их доки) И
// timestamp не старше toleranceSeconds (защита от replay чужого перехваченного
// запроса — тоже часть официальной схемы Stripe, не наша самодеятельность).
// v0 (устаревшая SHA1-схема) намеренно игнорируется — как и сам Stripe SDK,
// не проверяем её.
//
// Секрет (env.STRIPE_WEBHOOK_SECRET, whsec_...) — только в этом воркере, не в
// wrangler.jsonc (`wrangler secret put`), выдаётся Stripe отдельно для этого
// webhook endpoint. Настоящий секрет — только на A2-STRIPE-LIVE; этот модуль
// проверен на синтетическом секрете (stripeHook.test.mjs / stripeSig.test.mjs).

const DEFAULT_TOLERANCE_SECONDS = 300 // 5 минут, то же значение, что в stripe-node

function parseSignatureHeader(header) {
  let timestamp = null
  const v1 = []
  for (const part of header.split(',')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const key = part.slice(0, eq).trim()
    const value = part.slice(eq + 1).trim()
    if (key === 't') timestamp = value
    else if (key === 'v1') v1.push(value)
  }
  return { timestamp, v1 }
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Константное по времени сравнение (устойчиво к timing-атаке подбора подписи
// байт за байтом). Обе строки — hex-дайджесты SHA-256 фиксированной длины
// (64 символа), поэтому ранний выход по несовпадению длины не течёт полезной
// информации об угаданных байтах.
function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// payload — СЫРОЕ тело запроса (строка, до JSON.parse) — подпись считается по
// байтам, любая ре-сериализация JSON (изменение порядка ключей/пробелов) её
// сломает. header — значение заголовка `Stripe-Signature` как есть.
export async function verifyStripeSignature(
  payload,
  header,
  secret,
  { toleranceSeconds = DEFAULT_TOLERANCE_SECONDS, now = Date.now() } = {},
) {
  if (!header || typeof header !== 'string') return { valid: false, reason: 'missing_header' }
  if (!secret) return { valid: false, reason: 'missing_secret' }

  const { timestamp, v1 } = parseSignatureHeader(header)
  if (!timestamp || !/^\d+$/.test(timestamp) || v1.length === 0) {
    return { valid: false, reason: 'malformed_header' }
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${payload}`)
  const matches = v1.some((sig) => timingSafeEqualHex(sig, expected))
  if (!matches) return { valid: false, reason: 'signature_mismatch' }

  const ageMs = Math.abs(now - Number(timestamp) * 1000)
  if (ageMs > toleranceSeconds * 1000) return { valid: false, reason: 'timestamp_out_of_tolerance' }

  return { valid: true }
}
