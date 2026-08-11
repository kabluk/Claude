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
export const SANDBOX_FROM = 'Verscala <onboarding@resend.dev>'

// Собственный верифицированный домен (A3-CRON-RESEND-DOMAIN, done 2026-08-11:
// DKIM `resend._domainkey.verscala.com` + MX/SPF под `send.verscala.com`,
// статус `verified` в Resend API). В отличие от SANDBOX_FROM, доставляет
// произвольным сторонним получателям — именно это снимает барьер D-024 для
// писем подписчикам (A3-CRON-CONFIRM-EMAIL / A3-CRON-DIGEST-EMAIL).
//
// SANDBOX_FROM намеренно НЕ удалён и не переписан на этот адрес: claim.js и
// lead.js не входят в scope узла, их переключение — отдельное изменение с
// отдельной живой проверкой (переключить отправителя вслепую = узнать о
// проблеме с репутацией домена из недоставленных писем реальным агентствам).
export const VERIFIED_FROM = 'Verscala <notify@verscala.com>'

// `headers` — необязательные КАСТОМНЫЕ заголовки письма (не HTTP-заголовки
// запроса): Resend прокидывает их в исходящее письмо as-is. Нужны дайджесту
// (A3-CRON-DIGEST-EMAIL) под RFC 8058 one-click unsubscribe
// (`List-Unsubscribe` + `List-Unsubscribe-Post`). Confirm-письмо их не передаёт
// — `undefined` выпадает из JSON.stringify, тело для него байт в байт прежнее,
// поэтому расширение не меняет контракт claim/confirm-путей.
export async function sendEmail(apiKey, { from, to, subject, text, html, headers }) {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to: [to], subject, text, html, headers }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend API error: HTTP ${res.status} ${body.slice(0, 300)}`)
  }
  return res.json()
}
