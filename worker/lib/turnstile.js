// Проверка Cloudflare Turnstile (анти-бот). Секрет — env.TURNSTILE_SECRET_KEY
// (wrangler secret put, не в wrangler.jsonc). Если секрет не настроен, вызывающий
// код (routes/scan.js) пропускает проверку — так дев-окружение без секрета не падает.

export async function verifyTurnstile(secret, token, ip) {
  if (!token) return false
  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) return false
  const data = await res.json()
  return data.success === true
}
