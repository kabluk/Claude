// POST /api/claim: агентство/владелец профиля запрашивает право редактировать
// свою карточку в каталоге. Создаёт pending claim-запись + secret verify-токен
// в D1 (migrations/0004_claims.sql + 0006_claim_token.sql, INTERFACES.md §4).
// Email с verify-ссылкой этим узлом НЕ отправляется — только запись в D1.
// Реальная отправка — A2-CLAIM-EMAIL, отдельный узел (GRAPH.yaml), требует
// отдельного одобрения владельца (новый внешний платный сервис Resend,
// CLAUDE.md/RISKS.md, тот же паттерн, что A1-EXPLAIN/A2-LEAD-EMAIL).
//
// claimId (= D1 id, PK) возвращается вызывающему сразу в ответе 201 — это
// самостоятельный публичный идентификатор заявки, НЕ тот же секрет, что уйдёт
// в verify-ссылку. `token` — отдельное случайное значение, пишется в D1, но
// НЕ возвращается в ответе API: если бы token совпадал с id/claimId, вызывающий
// получал бы "доказательство владения почтой" немедленно из самого ответа,
// без перехода по ссылке — ровно то, что email-верификация должна
// предотвращать. Решение и обоснование зафиксированы в docs/project/
// DECISIONS.md (D-023), схема — migrations/0006_claim_token.sql.
//
// Домен email намеренно НЕ проверяется на совпадение с доменом сайта агентства
// на этом шаге (GRAPH.yaml, узел A2-CLAIM-API) — это часть будущей проверки
// при переходе по verify-ссылке (A2-CLAIM-EMAIL/verify-эндпоинт), не при
// создании самой заявки. Здесь допустима заявка на claim с любым синтаксически
// валидным email; реальная защита от чужих заявок — то, что verify-ссылка
// уходит только на указанный адрес, а не в ответ API.
//
// D1-доступ к таблице claims держим здесь, а не в worker/lib/db.js — тот файл
// (см. его заголовок) специализирован под scans, тот же прецедент, что
// worker/routes/lead.js для leads и worker/routes/stripeHook.js для featured.
//
// agencySlug валидируется против реального каталога (data/a11y/agencies.json),
// не угадывается — переиспользует уже забандленный JSON-импорт из
// worker/lib/matchAgenciesServer.js (тот же паттерн `import ... with { type:
// 'json' }`, который worker/ уже использует для того же файла в A2-LEAD-API;
// сам matchAgenciesServer.js не менялся, только импортирован).

import { agencies } from '../lib/matchAgenciesServer.js'
import { verifyTurnstile } from '../lib/turnstile.js'
import { sendEmail, SANDBOX_FROM } from '../lib/resend.js'

const AGENCY_SLUGS = new Set(agencies.map((a) => a.slug))

// KV fixed-window rate limiter, тот же паттерн, что worker/lib/ratelimit.js
// (checkFixedWindow) и worker/routes/lead.js (checkLeadRateLimit) — держим
// отдельную реализацию тут, а не расширяем ratelimit.js/lead.js, которые не
// входят в scope A2-CLAIM-API. Claim-заявки тоже "дороже" обычного трафика
// (задевают реальные профили агентств), лимит — тот же порядок, что у lead.
const WINDOW_SECONDS = 3600
const CLAIM_MAX_PER_IP = 5

async function checkClaimRateLimit(kv, ip) {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `rl:claim:ip:${ip}:${now - (now % WINDOW_SECONDS)}`
  const countRaw = await kv.get(windowKey)
  const count = Number(countRaw ?? 0)
  if (count >= CLAIM_MAX_PER_IP) return { allowed: false, reason: 'ip_limit' }
  await kv.put(windowKey, String(count + 1), { expirationTtl: WINDOW_SECONDS })
  return { allowed: true }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Возвращает список невалидных/отсутствующих полей (пусто = валидно).
// agencySlug должен существовать в реальном каталоге (не гадать, GRAPH.yaml
// verify-критерий A2-CLAIM-API); email — только формат, домен намеренно не
// сверяется с доменом сайта агентства на этом шаге (см. заголовок файла).
function invalidClaimFields(body) {
  const errors = []
  if (body === null || typeof body !== 'object') return ['body']

  const { agencySlug, email } = body

  if (!agencySlug || typeof agencySlug !== 'string' || !AGENCY_SLUGS.has(agencySlug)) {
    errors.push('agencySlug')
  }
  const trimmedEmail = typeof email === 'string' ? email.trim() : ''
  if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) errors.push('email')

  return errors
}

function generateToken() {
  // 32 случайных байта, hex — длиннее и менее предсказуемо, чем UUID (122 бита
  // случайности), уместно для секрета, который будет жить в публичной
  // verify-ссылке (в отличие от claimId, который не обязан быть криптостойким).
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function insertClaim(db, claim) {
  await db
    .prepare(
      `INSERT INTO claims (id, agency_slug, email, verified, patch_json, status, token, created_at)
       VALUES (?, ?, ?, 0, NULL, 'pending', ?, ?)`,
    )
    .bind(claim.id, claim.agencySlug, claim.email, claim.token, claim.createdAt)
    .run()
}

// origin — берётся из самого запроса (new URL(request.url).origin), не из
// конфига: воркер не знает заранее, на каком домене/поддомене он сейчас
// отвечает (workers.dev сейчас, кастомный домен после A0-ORIGIN), а ссылка
// в письме должна вести туда, куда реально можно постучаться прямо сейчас.
export function buildVerifyEmail({ agencyName, token, origin }) {
  const verifyUrl = `${origin}/api/claim/verify?token=${encodeURIComponent(token)}`
  return {
    subject: `Confirm your claim of ${agencyName} on Verscala`,
    text: `You (or someone using this email address) requested to claim the ${agencyName} listing on Verscala.

Confirm this request by opening the link below. If you didn't request this, you can ignore this email — nothing changes until the link is opened.

${verifyUrl}`,
  }
}

// Отправка — best-effort, не блокирует основной результат запроса: запись в
// claims уже создана (её ценность не зависит от письма — токен можно найти
// в D1 вручную, если понадобится), а сетевая ошибка Resend/отсутствие ключа
// не должны превращать успешно созданную заявку в ошибку 5xx для вызывающего
// (тот же принцип graceful degradation, что Turnstile/ANTHROPIC_API_KEY —
// см. docs/project/DECISIONS.md D-024 про то, почему это НЕ 503-if-missing).
async function sendVerifyEmailBestEffort(env, { agencyName, email, token, origin }) {
  if (!env.RESEND_API_KEY) return
  const { subject, text } = buildVerifyEmail({ agencyName, token, origin })
  try {
    await sendEmail(env.RESEND_API_KEY, { from: SANDBOX_FROM, to: email, subject, text })
  } catch (err) {
    console.error('A2-CLAIM-EMAIL: failed to send verify email', err?.message ?? err)
  }
}

// POST /api/claim {agencySlug, email, turnstileToken?} -> 201 {claimId}
// Синхронная запись (как /api/lead, в отличие от /api/scan): просто INSERT,
// не сетевой вызов — ctx.waitUntil не нужен.
export async function handlePostClaim(request, env) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid JSON body', code: 'bad_request' }, { status: 400 })
  }

  const errors = invalidClaimFields(body)
  if (errors.length > 0) {
    return Response.json(
      { error: `invalid or missing fields: ${errors.join(', ')}`, code: 'bad_request' },
      { status: 400 },
    )
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'

  // Тот же паттерн, что worker/routes/scan.js и worker/routes/lead.js: если
  // секрет не настроен (dev), проверку пропускаем — не блокируем локальную
  // разработку.
  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, body.turnstileToken, ip)
    if (!ok) return Response.json({ error: 'turnstile verification failed', code: 'forbidden' }, { status: 403 })
  }

  const rl = await checkClaimRateLimit(env.RATE_LIMIT_KV, ip)
  if (!rl.allowed) {
    return Response.json({ error: `rate limit exceeded (${rl.reason})`, code: 'rate_limited' }, { status: 429 })
  }

  const id = crypto.randomUUID()
  const token = generateToken()
  const createdAt = new Date().toISOString()
  const email = body.email.trim()

  await insertClaim(env.DB, {
    id,
    agencySlug: body.agencySlug,
    email,
    token,
    createdAt,
  })

  const agency = agencies.find((a) => a.slug === body.agencySlug)
  const origin = new URL(request.url).origin
  await sendVerifyEmailBestEffort(env, { agencyName: agency?.name ?? body.agencySlug, email, token, origin })

  return Response.json({ claimId: id }, { status: 201 })
}

// GET /api/claim/verify?token=... -> помечает claim верифицированным.
// Токен ищется по idx_claims_token (migrations/0006_claim_token.sql), не по
// id/claimId — id уже был отдан вызывающему в ответе POST /api/claim и не
// доказывает владение почтой (D-023). Возвращает простой JSON, а не редирект
// на страницу каталога — фронтенд-страница подтверждения (красивый UI) в
// scope этого узла не входила, ссылка должна вести на что-то реально рабочее,
// а не на несуществующую страницу (тот же принцип, что D-015), и голый JSON
// это минимально честно выполняет.
export async function handleGetClaimVerify(request, env) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (!token) {
    return Response.json({ error: 'token query parameter is required', code: 'bad_request' }, { status: 400 })
  }

  const row = await env.DB.prepare(`SELECT id, agency_slug, verified, status FROM claims WHERE token = ?`)
    .bind(token)
    .first()
  if (!row) {
    return Response.json({ error: 'claim not found for this token', code: 'not_found' }, { status: 404 })
  }

  if (!row.verified) {
    await env.DB.prepare(`UPDATE claims SET verified = 1, status = 'verified' WHERE token = ?`).bind(token).run()
  }

  return Response.json({ agencySlug: row.agency_slug, verified: true })
}
