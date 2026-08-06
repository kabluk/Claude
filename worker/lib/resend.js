// Тонкая обёртка над Resend API (https://resend.com/docs/api-reference/emails/send-email).
// Общая для всех узлов, которые реально шлют письма (A2-CLAIM-EMAIL; НЕ
// A2-LEAD-EMAIL — см. docs/project/DECISIONS.md D-024, у Agency нет email,
// узел не реализован в этой итерации).
//
// Секрет — env.RESEND_API_KEY (`wrangler secret put`), никогда не в
// wrangler.jsonc. Тот же паттерн деградации, что ANTHROPIC_API_KEY у
// A1-EXPLAIN: вызывающий код сам решает, что делать при отсутствии ключа
// (см. worker/routes/claim.js) — этот модуль просто не вызывается.

const RESEND_API_URL = 'https://api.resend.com/emails'

// Живая проверка ключа (D-024) подтвердила: общий sandbox-домен Resend
// (onboarding@resend.dev) реально доставляет только на email владельца
// аккаунта Resend — на произвольный сторонний адрес отдаёт 422
// validation_error. До верификации собственного домена (нужен реальный
// домен сайта, A0-ORIGIN) это ограничение Resend, не нашего кода.
export const SANDBOX_FROM = 'AccessAtlas <onboarding@resend.dev>'

export async function sendEmail(apiKey, { from, to, subject, text, html }) {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend API error: HTTP ${res.status} ${body.slice(0, 300)}`)
  }
  return res.json()
}
