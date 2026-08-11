// A3-CRON-SUBSCRIBE-API (D-135): «мониторинг как подписка» — пара (email, url)
// без аккаунта, без пароля, без сессии. Три эндпоинта:
//   POST /api/subscribe                     -> 201 {subscriptionId}
//   GET  /api/subscribe/verify?token=...    -> 200 (double opt-in подтверждён)
//   GET|POST /api/subscribe/unsubscribe?token=... -> 200 (идемпотентно)
//
// A3-CRON-CONFIRM-EMAIL (2026-08-11) подключил к POST /api/subscribe реальную
// отправку письма double opt-in с verify-ссылкой через worker/lib/resend.js —
// best-effort, поверх уже сделанного INSERT (см. sendConfirmEmailBestEffort и
// D-024). Отправитель — `notify@verscala.com` (VERIFIED_FROM), а не
// sandbox-адрес: домен верифицирован узлом A3-CRON-RESEND-DOMAIN, поэтому
// письмо доходит произвольному стороннему подписчику, а не только владельцу
// аккаунта Resend. Тот же порядок работ, что был у A2-CLAIM-API -> A2-CLAIM-EMAIL.
//
// ГЛАВНЫЙ ИНВАРИАНТ (D-023, повторён в шапке migrations/0010_subscriptions.sql
// и в INTERFACES.md §4): `id` — публичный идентификатор подписки, и он
// единственное, что уходит вызывающему. `token` — секрет verify-ссылки:
// генерируется независимо от id (не хэш и не префикс от него), пишется в D1 и
// НИКОГДА не возвращается синхронно — ни в теле, ни в заголовке, ни в
// редиректе. Если бы token можно было получить из ответа POST /api/subscribe,
// вызывающий подтверждал бы ЧУЖОЙ адрес не открывая чужую почту, то есть
// double opt-in перестал бы существовать как защита. По той же причине token
// не пишется и в логи (см. logNewSubscription ниже) — логи воркера видит
// больше людей, чем почтовый ящик подписчика.
//
// D1-доступ к таблице subscriptions держим здесь, а не в worker/lib/db.js —
// тот файл специализирован под scans; тот же прецедент, что
// worker/routes/lead.js (leads) и worker/routes/claim.js (claims).

import { verifyTurnstile } from '../lib/turnstile.js'
import { sendEmail, VERIFIED_FROM } from '../lib/resend.js'

// KV fixed-window rate limiter — тот же паттерн, что worker/lib/ratelimit.js
// (checkFixedWindow), worker/routes/lead.js (checkLeadRateLimit) и
// worker/routes/claim.js (checkClaimRateLimit): собственная функция в файле
// роута, а не расширение ratelimit.js, который не входит в scope этого узла.
// Лимит тот же порядок (5/ч на IP), что у lead/claim: подписка «дороже»
// обычного трафика — каждая строка это будущие еженедельные сканы (расход
// Browser Rendering) и будущие письма на реальный адрес.
const WINDOW_SECONDS = 3600
const SUBSCRIBE_MAX_PER_IP = 5

async function checkSubscribeRateLimit(kv, ip) {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `rl:subscribe:ip:${ip}:${now - (now % WINDOW_SECONDS)}`
  const countRaw = await kv.get(windowKey)
  const count = Number(countRaw ?? 0)
  if (count >= SUBSCRIBE_MAX_PER_IP) return { allowed: false, reason: 'ip_limit' }
  await kv.put(windowKey, String(count + 1), { expirationTtl: WINDOW_SECONDS })
  return { allowed: true }
}

// Тот же EMAIL_RE, что в lead.js/claim.js — намеренно одинаково нестрогий:
// единственная настоящая проверка адреса это переход по verify-ссылке.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Тот же isHttpUrl, что worker/routes/scan.js: сканировать можно только то,
// что реально сходит по http(s) — mailto:/javascript:/data: отвергаем здесь,
// а не в консьюмере скана.
function isHttpUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Возвращает список невалидных/отсутствующих полей (пусто = валидно) — формат
// ошибок один в один с invalidLeadFields/invalidClaimFields, чтобы клиент
// разбирал ответы всех форм одинаково.
function invalidSubscribeFields(body) {
  const errors = []
  if (body === null || typeof body !== 'object') return ['body']

  const { email, url } = body

  const trimmedEmail = typeof email === 'string' ? email.trim() : ''
  if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) errors.push('email')

  const trimmedUrl = typeof url === 'string' ? url.trim() : ''
  if (!trimmedUrl || !isHttpUrl(trimmedUrl)) errors.push('url')

  return errors
}

function generateToken() {
  // 32 случайных байта hex — тот же генератор, что claim.js: 256 бит против
  // 122 бит у UUID. Это значение живёт в публичной ссылке письма и является
  // единственным доказательством владения адресом, поэтому оно обязано быть
  // криптостойким (в отличие от id, который просто уникален).
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// last_scan_id = NULL (первого перескана ещё не было), cadence = 'weekly' —
// единственное значение на MVP, колонка заведена заранее (0010_subscriptions.sql).
async function insertSubscription(db, sub) {
  await db
    .prepare(
      `INSERT INTO subscriptions (id, email, url, token, verified, status, last_scan_id, cadence, created_at, unsubscribed_at)
       VALUES (?, ?, ?, ?, 0, 'pending', NULL, 'weekly', ?, NULL)`,
    )
    .bind(sub.id, sub.email, sub.url, sub.token, sub.createdAt)
    .run()
}

// Наблюдаемость без утечки: в лог уходит публичный id и хост цели, но НЕ token
// и НЕ полный email. Verify-ссылка тоже НЕ логируется (она содержит token) —
// сам token при необходимости достаётся из D1 вручную (wrangler d1 execute).
// `emailSent` различает две ситуации, которые иначе выглядят в логах
// одинаково: «письмо ушло» и «ключа нет / Resend отказал» — без этого
// молчаливая деградация D-024 становится невидимой.
function logNewSubscription({ id, url, emailSent }) {
  let host = 'unparseable'
  try {
    host = new URL(url).host
  } catch {
    /* url уже провалидирован выше; ветка — на случай будущих правок */
  }
  const mail = emailSent ? 'confirm email sent' : 'confirm email NOT sent'
  console.log(`A3-CRON-SUBSCRIBE-API: subscription ${id} created for ${host} (pending, ${mail})`)
}

// Минимальное экранирование для HTML-тела письма. url приходит от вызывающего
// (провалидирован только как http(s)-URL) и попадает и в текст, и в атрибут —
// без экранирования подписчик мог бы прислать URL с кавычкой и разломать
// разметку письма. Кавычки экранируем обе, потому что значение идёт внутрь
// href="...".
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// origin берётся из самого запроса (new URL(request.url).origin), не из
// конфига — тот же выбор и та же причина, что в claim.js::buildVerifyEmail:
// воркер отвечает и на workers.dev, и на кастомном домене, а ссылка в письме
// обязана вести туда, куда реально можно постучаться прямо сейчас.
//
// Unsubscribe-ссылки здесь намеренно нет: это письмо-ЗАПРОС подтверждения,
// подписка ещё не активна (verified=0/pending) и по бездействию не активируется
// — «отписаться» не от чего, а лишняя ссылка на тот же секретный токен только
// расширила бы поверхность. Обязательный unsubscribe появляется в первом
// РЕАЛЬНОМ письме подписчику — дайджесте (A3-CRON-DIGEST-EMAIL, RFC 8058).
export function buildConfirmEmail({ url, token, origin }) {
  const verifyUrl = `${origin}/api/subscribe/verify?token=${encodeURIComponent(token)}`
  return {
    subject: 'Confirm your Verscala monitoring subscription',
    text: `Click the link below to confirm you want weekly accessibility monitoring emails for ${url}.

${verifyUrl}

If you didn't request this, ignore this email — nothing is sent until the link is opened.`,
    html: `<p>Click the link below to confirm you want weekly accessibility monitoring emails for <strong>${escapeHtml(url)}</strong>.</p>
<p><a href="${escapeHtml(verifyUrl)}">Confirm my subscription</a></p>
<p>If you didn't request this, ignore this email — nothing is sent until the link is opened.</p>`,
  }
}

// Best-effort (D-024, тот же паттерн, что claim.js::sendVerifyEmailBestEffort):
// строка в subscriptions уже записана к моменту вызова, и её ценность не
// зависит от письма (токен есть в D1). Отсутствие RESEND_API_KEY или сетевая
// ошибка Resend НЕ превращают успешно созданную подписку в 5xx — это именно
// НЕ «503 if missing». Возвращает true/false для лога, никогда не бросает.
async function sendConfirmEmailBestEffort(env, { email, url, token, origin }) {
  if (!env.RESEND_API_KEY) return false
  const { subject, text, html } = buildConfirmEmail({ url, token, origin })
  try {
    await sendEmail(env.RESEND_API_KEY, { from: VERIFIED_FROM, to: email, subject, text, html })
    return true
  } catch (err) {
    // Сообщение ошибки Resend может содержать эхо адреса, но не токен —
    // сам токен в письмо кладём мы, а в ответ API он не возвращается.
    console.error('A3-CRON-CONFIRM-EMAIL: failed to send confirm email', err?.message ?? err)
    return false
  }
}

// POST /api/subscribe {email, url, turnstileToken?} -> 201 {subscriptionId}
// Синхронная запись (как /api/lead и /api/claim, в отличие от /api/scan):
// один INSERT, сетевых вызовов нет — ctx.waitUntil не нужен.
//
// Дедупликации «этот email уже подписан на этот url» здесь намеренно НЕТ:
// ответ вида «у вас уже есть подписка» превратил бы открытый эндпоинт в
// оракул, отвечающий на вопрос «следит ли адрес X за сайтом Y» без всякой
// верификации. Дубликаты схлопываются позже, в cron-выборке
// (A3-CRON-RESCAN-DELTA), где строки уже отфильтрованы по verified/active.
export async function handlePostSubscribe(request, env) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid JSON body', code: 'bad_request' }, { status: 400 })
  }

  const errors = invalidSubscribeFields(body)
  if (errors.length > 0) {
    return Response.json(
      { error: `invalid or missing fields: ${errors.join(', ')}`, code: 'bad_request' },
      { status: 400 },
    )
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'

  // Тот же паттерн, что scan.js/lead.js/claim.js: секрет не настроен (dev) —
  // проверка пропускается, локальная разработка не блокируется.
  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, body.turnstileToken, ip)
    if (!ok) return Response.json({ error: 'turnstile verification failed', code: 'forbidden' }, { status: 403 })
  }

  const rl = await checkSubscribeRateLimit(env.RATE_LIMIT_KV, ip)
  if (!rl.allowed) {
    return Response.json({ error: `rate limit exceeded (${rl.reason})`, code: 'rate_limited' }, { status: 429 })
  }

  const id = crypto.randomUUID()
  const token = generateToken()
  const email = body.email.trim()
  const url = body.url.trim()

  // Порядок важен: INSERT первым и без try/catch (провал записи — настоящая
  // 5xx, подписки не существует), отправка письма — отдельным некритичным
  // шагом после. Не ctx.waitUntil: ответ 201 обещает, что подписка создана,
  // а не что письмо доставлено, но задержка одного HTTP-вызова здесь дешевле
  // потери наблюдаемости (лог ниже знает исход отправки).
  await insertSubscription(env.DB, { id, email, url, token, createdAt: new Date().toISOString() })

  const origin = new URL(request.url).origin
  const emailSent = await sendConfirmEmailBestEffort(env, { email, url, token, origin })
  logNewSubscription({ id, url, emailSent })

  // Ровно одно поле. Любое расширение этого объекта обязано пройти мимо
  // token — см. тест «the verify token never appears anywhere in the response».
  return Response.json({ subscriptionId: id }, { status: 201 })
}

// Общий lookup по секрету: индекс idx_subscriptions_token
// (migrations/0010_subscriptions.sql). Ищем ТОЛЬКО по token, никогда по id —
// id уже был отдан вызывающему в ответе POST и ничего не доказывает (D-023).
async function findByToken(db, token) {
  return db
    .prepare(`SELECT id, email, url, verified, status FROM subscriptions WHERE token = ?`)
    .bind(token)
    .first()
}

function missingToken() {
  return Response.json({ error: 'token query parameter is required', code: 'bad_request' }, { status: 400 })
}

function notFound() {
  return Response.json({ error: 'subscription not found for this token', code: 'not_found' }, { status: 404 })
}

// Брутфорса токена здесь нет: 256 бит энтропии, отдельного rate-limit на
// verify/unsubscribe не ставим — как и у GET /api/claim/verify. Зато и ответ
// 404 намеренно одинаков для «токена не существует» и «токен чужой»: разницы
// между ними снаружи не видно.

// GET /api/subscribe/verify?token=... -> подтверждение double opt-in.
// Голый JSON, а не редирект на красивую страницу — тот же выбор и та же
// причина, что у handleGetClaimVerify: страницы подтверждения в scope узла
// нет, а ссылка из письма обязана вести на что-то реально работающее, а не на
// 404 (принцип D-015).
//
// status переводится в 'active' ТОЛЬКО из 'pending'. Отписавшийся подписчик,
// у которого в почте остался старый verify-линк, не воскрешается переходом по
// нему — иначе unsubscribe было бы обратимо чужими руками. Сам факт
// verified=1 при этом фиксируется в любом случае: адрес действительно
// подтверждён, и это отдельное от status свойство (шапка миграции).
export async function handleGetSubscribeVerify(request, env) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return missingToken()

  const row = await findByToken(env.DB, token)
  if (!row) return notFound()

  await env.DB.prepare(
    `UPDATE subscriptions
        SET verified = 1,
            status = CASE WHEN status = 'pending' THEN 'active' ELSE status END
      WHERE token = ?`,
  )
    .bind(token)
    .run()

  const status = row.status === 'pending' ? 'active' : row.status
  return Response.json({ subscriptionId: row.id, url: row.url, verified: true, status })
}

// GET|POST /api/subscribe/unsubscribe?token=... -> остановка подписки.
// GET — потому что по ссылке из письма кликают браузером; POST принимается
// тем же обработчиком ради будущего RFC 8058 List-Unsubscribe-Post
// (A3-CRON-DIGEST-EMAIL), чтобы почтовый клиент мог отписать в один клик, не
// открывая страницу. Токен в query в обоих случаях — тот же формат ссылки.
//
// Строка не удаляется, а помечается: история подписки и защита от
// повторной подписки-спама остаются (шапка миграции). verified не трогаем —
// адрес как был подтверждён, так и остался подтверждённым.
//
// Идемпотентность: повторный вызов на уже отписанной подписке — это НЕ ошибка
// (почтовые клиенты и антивирусные прокси дёргают ссылки из писем по
// нескольку раз), поэтому 200 и в этот раз. Гейт `status != 'unsubscribed'` в
// UPDATE защищает исходный unsubscribed_at от перезаписи: момент отписки —
// первый, а не последний клик.
export async function handleUnsubscribe(request, env) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return missingToken()

  const row = await findByToken(env.DB, token)
  if (!row) return notFound()

  const alreadyUnsubscribed = row.status === 'unsubscribed'
  if (!alreadyUnsubscribed) {
    await env.DB.prepare(
      `UPDATE subscriptions
          SET status = 'unsubscribed', unsubscribed_at = ?
        WHERE token = ? AND status != 'unsubscribed'`,
    )
      .bind(new Date().toISOString(), token)
      .run()
    console.log(`A3-CRON-SUBSCRIBE-API: subscription ${row.id} unsubscribed`)
  }

  return Response.json({
    subscriptionId: row.id,
    url: row.url,
    status: 'unsubscribed',
    alreadyUnsubscribed,
  })
}
