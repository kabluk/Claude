// POST /api/stripe-hook: приём Stripe webhook-событий, обновление платного
// featured-размещения агентства (migrations/0005_featured.sql, INTERFACES.md §4).
//
// Проверка подписи — worker/lib/stripeSig.js, реальный алгоритм Stripe
// (Stripe-Signature: t=…,v1=…, HMAC-SHA256 secret над "{t}.{raw_body}",
// константное сравнение). Секрет — env.STRIPE_WEBHOOK_SECRET (`wrangler secret
// put`, whsec_...), НЕ STRIPE_SECRET_KEY (тот нужен только для создания
// Payment Links на стороне A2-STRIPE-LIVE, этому обработчику не нужен вовсе).
//
// Тот же паттерн "нет секрета -> 503", что worker/lib/explain.js без
// ANTHROPIC_API_KEY (A1-EXPLAIN) — не блокирует остальной воркер, но честно
// сигналит, что этот конкретный путь не настроен.
//
// D1-доступ к featured держим прямо здесь, а не в worker/lib/db.js — тот файл
// специализирован под scans (см. его заголовок), тот же прецедент, что
// worker/routes/lead.js для leads.
//
// agency_slug и until извлекаются из session.metadata Stripe Checkout Session
// (checkout.session.completed): Stripe не знает о нашей доменной модели
// (агентства/подписки каталога), единственный официальный канал протащить
// произвольные бизнес-данные через Checkout — Payment Link metadata, которую
// сам Stripe копирует на созданную Session без изменений. Реальную настройку
// Payment Link с этими полями metadata делает A2-STRIPE-LIVE; здесь только
// код, который их читает.

import { verifyStripeSignature } from '../lib/stripeSig.js'

const UNTIL_RE = /^\d{4}-\d{2}-\d{2}/ // ISO-дата (тот же формат, что Agency.featured.until, INTERFACES.md §4)

// Возвращает {agencySlug, until} или null, если checkout session не несёт
// валидных данных featured-размещения (нет смысла отклонять весь webhook —
// подпись Stripe подтверждена, событие настоящее, просто нечего применить).
export function extractFeaturedFromSession(session) {
  const metadata = session?.metadata
  if (!metadata || typeof metadata !== 'object') return null

  const agencySlug = metadata.agency_slug
  const until = metadata.until
  if (typeof agencySlug !== 'string' || !agencySlug.trim()) return null
  if (typeof until !== 'string' || !UNTIL_RE.test(until)) return null

  return { agencySlug: agencySlug.trim(), until }
}

// agency_slug PK (migrations/0005_featured.sql) — продление существующего
// размещения обновляет until/stripe_ref той же строки, не плодит новую.
async function upsertFeatured(db, { agencySlug, until, stripeRef }) {
  await db
    .prepare(
      `INSERT INTO featured (agency_slug, until, stripe_ref) VALUES (?, ?, ?)
       ON CONFLICT(agency_slug) DO UPDATE SET until = excluded.until, stripe_ref = excluded.stripe_ref`,
    )
    .bind(agencySlug, until, stripeRef ?? null)
    .run()
}

// POST /api/stripe-hook: тело — сырое Stripe event JSON, заголовок
// Stripe-Signature обязателен. -> 200 {received:true} на любое подтверждённое
// событие (Stripe ретраит недоставленное, если не получит быстрый 2xx —
// смысла нет заставлять его повторять то, что мы просто не обрабатываем).
export async function handlePostStripeHook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'stripe webhook secret is not configured', code: 'unavailable' }, { status: 503 })
  }

  // Подпись считается по СЫРЫМ байтам тела — request.json() тут нельзя,
  // ре-сериализация JSON после парсинга даёт другую строку и подпись не сойдётся.
  const rawBody = await request.text()
  const signatureHeader = request.headers.get('stripe-signature')

  const verification = await verifyStripeSignature(rawBody, signatureHeader, env.STRIPE_WEBHOOK_SECRET)
  if (!verification.valid) {
    return Response.json(
      { error: `invalid webhook signature (${verification.reason})`, code: 'bad_request' },
      { status: 400 },
    )
  }

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'invalid JSON body', code: 'bad_request' }, { status: 400 })
  }

  if (event?.type === 'checkout.session.completed') {
    const session = event.data?.object
    const featured = extractFeaturedFromSession(session)
    if (featured) {
      await upsertFeatured(env.DB, { ...featured, stripeRef: session?.id ?? null })
    }
    // featured === null: metadata отсутствует/некорректна — конфигурационная
    // проблема Payment Link (A2-STRIPE-LIVE), не повод отвечать не-2xx
    // подлинному, верно подписанному событию Stripe.
  }

  return Response.json({ received: true }, { status: 200 })
}
