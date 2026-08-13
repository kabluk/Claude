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

// A5-ABUSE-LIMITS: суточный лимит по EMAIL — независимый от IP-лимита выше.
// Он же основной анти-"email bomb" контроль: IP-лимит защищает воркер от
// одного источника трафика, а этот — защищает ЧУЖОЙ почтовый ящик от того,
// чтобы кто-то с большим пулом IP завалил его письмами double opt-in. Ключ —
// нормализованный email (см. normaliseEmail), не сырой ввод пользователя:
// "Foo@Example.com " и "foo@example.com" обязаны делить один счётчик.
const DAY_WINDOW_SECONDS = 86400
const SUBSCRIBE_MAX_PER_EMAIL_DAY = 3

// Общий небольшой fixed-window helper для обеих проверок этого файла — тот же
// паттерн (ключ = `${prefix}:${windowStart}`, TTL = длина окна), что и
// worker/lib/ratelimit.js::checkFixedWindow, но не импортируется оттуда:
// собственная функция в файле роута — намеренный выбор ещё исходного узла
// (см. комментарий выше), этот узел его не меняет, только добавляет второе
// окно поверх первого.
async function checkWindow(kv, key, max, windowSeconds) {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `${key}:${now - (now % windowSeconds)}`
  const countRaw = await kv.get(windowKey)
  const count = Number(countRaw ?? 0)
  if (count >= max) return false
  await kv.put(windowKey, String(count + 1), { expirationTtl: windowSeconds })
  return true
}

// windowSeconds=WINDOW_SECONDS (час) и ключ не изменились относительно
// исходной версии — существующие KV-ключи в проде остаются валидны байт-в-байт.
async function checkSubscribeRateLimit(kv, ip) {
  const allowed = await checkWindow(kv, `rl:subscribe:ip:${ip}`, SUBSCRIBE_MAX_PER_IP, WINDOW_SECONDS)
  return allowed ? { allowed: true } : { allowed: false, reason: 'ip_limit' }
}

// trim+lowercase — та же нормализация, что уже применяется к телу запроса
// (body.email.trim()) плюс регистронезависимость: почтовые адреса
// регистронезависимы по локальной части на практике повсеместных провайдеров,
// а нам важно не дать варьированием регистра обойти суточный счётчик.
// Используется ТОЛЬКО как ключ лимита и как сторона сравнения в dedup-запросе
// (lower(email) в SQL) — то, что реально пишется в строку subscriptions,
// остаётся email так, как ввёл пользователь (см. insertSubscription ниже).
function normaliseEmail(email) {
  return email.trim().toLowerCase()
}

async function checkSubscribeEmailRateLimit(kv, email) {
  const allowed = await checkWindow(
    kv,
    `rl:subscribe:email:${normaliseEmail(email)}`,
    SUBSCRIBE_MAX_PER_EMAIL_DAY,
    DAY_WINDOW_SECONDS,
  )
  return allowed ? { allowed: true } : { allowed: false, reason: 'email_limit' }
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
// A5-ABUSE-LIMITS: dedup lookup для (email, url). `lower(email) = lower(?)`
// на ОБЕИХ сторонах (не только на стороне значения) — колонка email хранит
// то, что ввёл пользователь (см. insertSubscription), регистр в ней не
// нормализован, значит сравнение обязано игнорировать регистр с обеих
// сторон, а не только у входного параметра. `url` сравнивается точно (после
// trim в handlePostSubscribe) — в отличие от email, у URL нет общепринятой
// регистронезависимости, менять семантику подписки по регистру пути мы не
// вправе. `status IN ('pending','active')` — намеренно ИСКЛЮЧАЕТ
// 'unsubscribed': отписавшийся пользователь, снова заполнивший форму, обязан
// получить НОВОЕ письмо double opt-in и новую строку, а не молча слиться со
// старой мёртвой записью (симметрично тому, что verify не воскрешает
// unsubscribed — см. handleGetSubscribeVerify).
async function findExistingSubscription(db, { email, url }) {
  return db
    .prepare(
      `SELECT id FROM subscriptions WHERE lower(email) = lower(?) AND url = ? AND status IN ('pending', 'active')`,
    )
    .bind(email, url)
    .first()
}

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
// `dedup` (A5-ABUSE-LIMITS): различает в логах «новая строка вставлена» от
// «запрос схлопнулся с уже существующей (email,url) подпиской, ничего не
// вставлено и не отправлено» — снаружи (в HTTP-ответе) эти два случая
// намеренно неотличимы (см. handlePostSubscribe), но в логах воркера это
// разные события, и наблюдаемость не обязана жертвовать точностью там, где
// приватность её не требует.
function logNewSubscription({ id, url, emailSent, dedup = false }) {
  let host = 'unparseable'
  try {
    host = new URL(url).host
  } catch {
    /* url уже провалидирован выше; ветка — на случай будущих правок */
  }
  if (dedup) {
    console.log(`A3-CRON-SUBSCRIBE-API: subscription ${id} dedup-hit for ${host} (no insert, no email sent)`)
    return
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

// A3-CRON-MONITORING-PAGES (D-139): боевой origin САЙТА для ссылок письма —
// env.ALLOWED_ORIGIN (wrangler.jsonc vars, тот же токен, что CORS). Локальная
// копия того же выбора, что subscriptionCron.js::resolveSiteOrigin (тот файл
// его не экспортирует, а тащить в export ради одной ссылки расширило бы контракт
// модуля — тот же довод, что у дублирующегося escapeHtml). '*' — не адрес,
// значит «не настроено» → fallback на origin запроса (dev: wrangler dev на
// localhost, где ALLOWED_ORIGIN может быть пуст). На проде это всегда сайт-домен.
function resolveSiteOrigin(env) {
  const configured = env?.ALLOWED_ORIGIN
  if (typeof configured === 'string' && configured && configured !== '*') return configured.replace(/\/+$/, '')
  return null
}

// A3-CRON-MONITORING-PAGES (D-139): siteOrigin — БОЕВОЙ домен сайта
// (env.ALLOWED_ORIGIN), а НЕ origin запроса. Прежде ссылка вела на
// `${request.origin}/api/subscribe/verify` — то есть прямо на JSON-эндпоинт
// воркера на домене *.workers.dev. Прод-инцидент: подписчик кликал её и получал
// СЫРОЙ JSON (браузер предлагал скачать verify.json) на чужом домене — и то и
// другое подрывает доверие. Теперь ссылка ведёт на брендовую страницу САЙТА
// `${siteOrigin}/monitoring/confirm?token=…`, которая client-side зовёт тот же
// GET /api/subscribe/verify и показывает человеческий результат. Сам эндпоинт
// не тронут — он остаётся JSON-API, у него просто сменился потребитель.
// siteOrigin приходит из resolveSiteOrigin(env) с fallback на request origin в
// dev (см. handlePostSubscribe) — но это ВСЕГДА сайт-домен на проде.
//
// Unsubscribe-ссылки здесь намеренно нет: это письмо-ЗАПРОС подтверждения,
// подписка ещё не активна (verified=0/pending) и по бездействию не активируется
// — «отписаться» не от чего, а лишняя ссылка на тот же секретный токен только
// расширила бы поверхность. Обязательный unsubscribe появляется в первом
// РЕАЛЬНОМ письме подписчику — дайджесте (A3-CRON-DIGEST-EMAIL, RFC 8058).
export function buildConfirmEmail({ url, token, siteOrigin }) {
  const verifyUrl = `${siteOrigin}/monitoring/confirm?token=${encodeURIComponent(token)}`
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
async function sendConfirmEmailBestEffort(env, { email, url, token, siteOrigin }) {
  if (!env.RESEND_API_KEY) return false
  const { subject, text, html } = buildConfirmEmail({ url, token, siteOrigin })
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
// один INSERT (или ни одного, при dedup-хите — см. ниже), сетевых вызовов
// нет вне письма — ctx.waitUntil не нужен.
//
// A5-ABUSE-LIMITS добавил dedup «этот email уже подписан на этот url»,
// намеренно НЕ через отдельный статус-код или поле ответа: старая версия
// этого комментария (до этого узла) отказывалась от дедупа именно потому, что
// видимый ответ «уже подписан» превращает открытый эндпоинт в оракул —
// сторонний вызывающий мог бы перебором url узнавать, следит ли адрес X за
// сайтом Y, без всякой верификации владения адресом. Инвариант СОХРАНЁН, а не
// снят: dedup-хит и свежая подписка отдают ОДИНАКОВЫЙ 201 {subscriptionId}
// (id уже существующей строки в первом случае) — снаружи неотличимы. Что
// реально изменилось при дедупе: не выполняется повторный INSERT и не уходит
// повторное письмо double opt-in (см. findExistingSubscription ниже) — это
// защита от накопления мёртвых строк и повторной заливки одного и того же
// адреса письмами при пуле IP, обходящем IP-лимит, а не раскрытие факта
// подписки. Дубликаты с ДРУГИМ url для того же email дедупу не подлежат (это
// не дубликат) и по-прежнему считаются в суточный per-email лимит ниже.
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

  const email = body.email.trim()
  const url = body.url.trim()

  // A5-ABUSE-LIMITS: dedup ПЕРВЫМ среди abuse-проверок — РАНЬШЕ суточного
  // per-email лимита (осознанный порядок, выбран родительской сессией при
  // ревью). Смысл: повторная отправка ТОЙ ЖЕ формы (email+url уже pending/
  // active) — не атака и не должна тратить квоту адресата; она схлопывается
  // здесь в тот же 201 без нового INSERT и без нового письма. Инвариант
  // неотличимости сохранён (см. комментарий над handlePostSubscribe): dedup-хит
  // и свежая подписка отдают одинаковый ответ. Защита от «письмо-бомбера» от
  // этого не слабеет: заливка чужого ящика идёт через РАЗНЫЕ url (каждый —
  // свежая, не дедуп-пара), а их режет per-email лимит ниже.
  const existing = await findExistingSubscription(env.DB, { email, url })
  if (existing) {
    logNewSubscription({ id: existing.id, url, emailSent: false, dedup: true })
    return Response.json({ subscriptionId: existing.id }, { status: 201 })
  }

  // A5-ABUSE-LIMITS: суточный per-email лимит — ПОСЛЕ IP-лимита и ПОСЛЕ dedup.
  // Считает только СВЕЖИЕ (email,url), реально порождающие письмо double
  // opt-in, поэтому счётчик = «сколько подтверждений ушло на этот адрес
  // сегодня» (потолок 3) — ровно та величина, что защита и ограничивает; при
  // этом честный повтор одной формы (выше) квоту не жжёт.
  const emailRl = await checkSubscribeEmailRateLimit(env.RATE_LIMIT_KV, email)
  if (!emailRl.allowed) {
    return Response.json({ error: `rate limit exceeded (${emailRl.reason})`, code: 'rate_limited' }, { status: 429 })
  }

  const id = crypto.randomUUID()
  const token = generateToken()

  // Порядок важен: INSERT первым и без try/catch (провал записи — настоящая
  // 5xx, подписки не существует), отправка письма — отдельным некритичным
  // шагом после. Не ctx.waitUntil: ответ 201 обещает, что подписка создана,
  // а не что письмо доставлено, но задержка одного HTTP-вызова здесь дешевле
  // потери наблюдаемости (лог ниже знает исход отправки).
  await insertSubscription(env.DB, { id, email, url, token, createdAt: new Date().toISOString() })

  // A3-CRON-MONITORING-PAGES (D-139): ссылка письма ведёт на сайт-домен
  // (ALLOWED_ORIGIN), а не на origin запроса-воркера; fallback на request origin
  // только в dev, когда ALLOWED_ORIGIN не настроен.
  const siteOrigin = resolveSiteOrigin(env) ?? new URL(request.url).origin
  const emailSent = await sendConfirmEmailBestEffort(env, { email, url, token, siteOrigin })
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
