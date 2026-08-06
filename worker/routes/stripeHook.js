// POST /api/stripe-hook: приём Stripe webhook-событий, обновление платного
// featured-размещения агентства (migrations/0005_featured.sql, INTERFACES.md §4).
//
// Проверка подписи — worker/lib/stripeSig.js, реальный алгоритм Stripe
// (Stripe-Signature: t=…,v1=…, HMAC-SHA256 secret над "{t}.{raw_body}",
// константное сравнение). Секрет — env.STRIPE_WEBHOOK_SECRET (`wrangler secret
// put`, whsec_...), НЕ STRIPE_SECRET_KEY (тот нужен только для программного
// создания Payment Links; A2-STRIPE-LIVE создаёт их вручную в Dashboard —
// см. ниже почему это меняет извлечение данных — этому обработчику
// STRIPE_SECRET_KEY не нужен вовсе).
//
// Тот же паттерн "нет секрета -> 503", что worker/lib/explain.js без
// ANTHROPIC_API_KEY (A1-EXPLAIN) — не блокирует остальной воркер, но честно
// сигналит, что этот конкретный путь не настроен.
//
// D1-доступ к featured держим прямо здесь, а не в worker/lib/db.js — тот файл
// специализирован под scans (см. его заголовок), тот же прецедент, что
// worker/routes/lead.js для leads.
//
// A2-STRIPE-LIVE (D-027): Payment Link создаётся вручную в Stripe Dashboard,
// не через API — Dashboard-ссылка не умеет нести ДИНАМИЧЕСКУЮ metadata (она
// одна и та же для всех покупателей одной ссылки), поэтому agency_slug
// собирается через Stripe "custom field" на странице оплаты (агентство само
// вписывает свой slug) — приходит в session.custom_fields, не в
// session.metadata. Ключ поля (CUSTOM_FIELD_KEY ниже) — НЕ "agency_slug",
// несмотря на видимый в Dashboard label с этим текстом: Stripe сгенерировал
// key из более раннего черновика label и не обновил его при переименовании
// — подтверждено живым оплаченным событием, не предположением. Единственный
// продукт первого прохода — featured €590/год, разовый платёж (не подписка)
// — until НЕ берётся из данных, присланных клиентом/Stripe вообще: считается
// на сервере как "сегодня + 365 дней" в момент обработки события, иначе
// платящий мог бы (по ошибке конфигурации Stripe-стороны или иначе)
// продиктовать себе любую дату. Ежемесячная подписка и lead-пакеты (другая
// система — credits, не featured) вне scope этого прохода, см. GRAPH.yaml notes.

import { verifyStripeSignature } from '../lib/stripeSig.js'
import { agencies } from '../lib/matchAgenciesServer.js'

const AGENCY_SLUGS = new Set(agencies.map((a) => a.slug))
// Stripe генерирует key custom field из ТЕКСТА LABEL в момент первого
// сохранения поля и не пересчитывает его при последующем редактировании
// label — реального "agency_slug" здесь никогда не было, несмотря на то что
// label.custom в Dashboard сейчас показывает именно "agency_slug". Значение
// ниже — не предположение, а буквальный key из настоящего оплаченного
// checkout.session.completed (cs_live_a12o7c...), полученного во время
// живой проверки A2-STRIPE-LIVE 2026-08-06 (см. DECISIONS.md D-027).
const CUSTOM_FIELD_KEY = 'yourslugaccessatlas'
const FEATURED_DAYS = 365

function extractAgencySlugFromSession(session) {
  const fields = session?.custom_fields
  if (!Array.isArray(fields)) return null
  const field = fields.find((f) => f?.key === CUSTOM_FIELD_KEY)
  const value = field?.text?.value
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function computeFeaturedUntil(now = new Date()) {
  return new Date(now.getTime() + FEATURED_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// Возвращает {agencySlug, until} или null, если checkout session не несёт
// валидного agency_slug (пустое поле или опечатка, не входящая в реальный
// каталог — не выдумываем размещение для несуществующего slug). Нет смысла
// отклонять весь webhook — подпись Stripe подтверждена, платёж настоящий,
// просто нечего применить автоматически (см. вызывающий код: залогировано
// отдельно, чтобы не потерять "заплатил, но опечатался").
export function extractFeaturedFromSession(session, now = new Date()) {
  const agencySlug = extractAgencySlugFromSession(session)
  if (!agencySlug || !AGENCY_SLUGS.has(agencySlug)) return null
  return { agencySlug, until: computeFeaturedUntil(now) }
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
    if (!featured) {
      // Подпись верна, платёж настоящий, но custom_fields не несёт
      // валидный agency_slug (пусто или опечатка мимо реального каталога) —
      // конфигурационная проблема Payment Link/ввода клиента, не повод
      // отвечать не-2xx подлинному событию Stripe. Логируем отдельно, чтобы
      // не потерять "заплатил, но опечатался" молча.
      console.error(
        'A2-STRIPE-LIVE: checkout.session.completed без валидного agency_slug',
        { sessionId: session?.id ?? null, customFields: session?.custom_fields ?? null },
      )
    }
  }

  return Response.json({ received: true }, { status: 200 })
}
