// POST /api/lead: приём RFQ-заявки, матчинг подходящих агентств, запись в D1.
// Email агентствам этим узлом НЕ отправляется — только TODO/лог вместо реального
// вызова Resend (см. заголовок функции ниже). Реальная отправка — A2-LEAD-EMAIL,
// отдельный узел (GRAPH.yaml), требует отдельного одобрения владельца (новый
// внешний платный сервис + рассылка живым третьим лицам, CLAUDE.md).
//
// D1-доступ к таблице leads держим здесь, а не в worker/lib/db.js — тот файл
// (см. его заголовок) специализирован под scans и не входит в scope узла
// A2-LEAD-API (docs/project/GRAPH.yaml).
//
// Валидация полей копирует src/lib/leadForm.ts::validateLeadForm (тот же смысл
// проверок), но живёт отдельно: leadForm.ts — TS-модуль под Vite-алиасы
// (@data/a11y/types), недоступный из plain-ESM воркера, как и matchAgencies.ts
// (см. worker/lib/matchAgenciesServer.js).

import { matchAgencies, taxonomies } from '../lib/matchAgenciesServer.js'
import { verifyTurnstile } from '../lib/turnstile.js'

// KV fixed-window rate limiter, тот же паттерн, что worker/lib/ratelimit.js
// (checkFixedWindow) — держим отдельную реализацию тут, а не расширяем
// ratelimit.js, который не входит в scope A2-LEAD-API. RFQ-заявка "дороже"
// скана (задевает реальные агентства), поэтому лимит ниже, чем у /api/scan (5/ч).
const WINDOW_SECONDS = 3600
const LEAD_MAX_PER_IP = 5

async function checkLeadRateLimit(kv, ip) {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `rl:lead:ip:${ip}:${now - (now % WINDOW_SECONDS)}`
  const countRaw = await kv.get(windowKey)
  const count = Number(countRaw ?? 0)
  if (count >= LEAD_MAX_PER_IP) return { allowed: false, reason: 'ip_limit' }
  await kv.put(windowKey, String(count + 1), { expirationTtl: WINDOW_SECONDS })
  return { allowed: true }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STANDARDS = Object.keys(taxonomies.standards)
const SERVICES = Object.keys(taxonomies.services)
const PRICE_BANDS = Object.keys(taxonomies.priceBands)

function isValidDeadline(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const today = new Date().toISOString().slice(0, 10)
  return value >= today
}

// Возвращает список невалидных/отсутствующих полей (пусто = валидно).
// country/standard/service/budget/contact.email обязательны (Lead без id/status,
// INTERFACES.md §3; budget/contact_json NOT NULL в migrations/0003_leads.sql).
function invalidLeadFields(body) {
  const errors = []
  if (body === null || typeof body !== 'object') return ['body']

  const { country, standard, service, budget, deadline, contact, scanId } = body

  if (!country || typeof country !== 'string' || !taxonomies.countries[country]) errors.push('country')
  if (!standard || !STANDARDS.includes(standard)) errors.push('standard')
  if (!service || !SERVICES.includes(service)) errors.push('service')
  if (!budget || !PRICE_BANDS.includes(budget)) errors.push('budget')
  if (deadline !== undefined && deadline !== null && deadline !== '' && !isValidDeadline(deadline)) {
    errors.push('deadline')
  }
  const email = typeof contact?.email === 'string' ? contact.email.trim() : ''
  if (!email || !EMAIL_RE.test(email)) errors.push('contact.email')
  if (scanId !== undefined && scanId !== null && typeof scanId !== 'string') errors.push('scanId')

  return errors
}

async function insertLead(db, lead) {
  await db
    .prepare(
      `INSERT INTO leads
         (id, scan_id, country, standard, service, budget, deadline, contact_json, matched_json, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?)`,
    )
    .bind(
      lead.id,
      lead.scanId ?? null,
      lead.country,
      lead.standard,
      lead.service,
      lead.budget,
      lead.deadline ?? null,
      JSON.stringify(lead.contact),
      JSON.stringify(lead.matched),
      lead.createdAt,
    )
    .run()
}

// POST /api/lead {country, standard, service, budget, deadline?, scanId?,
//   contact: {email, company?}, turnstileToken?} -> 201 {leadId, matched: slug[]}
// Синхронная запись (в отличие от /api/scan): матчинг — чтение забандленного
// JSON-каталога, не сетевой вызов, поэтому ctx.waitUntil не нужен.
export async function handlePostLead(request, env) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid JSON body', code: 'bad_request' }, { status: 400 })
  }

  const errors = invalidLeadFields(body)
  if (errors.length > 0) {
    return Response.json(
      { error: `invalid or missing fields: ${errors.join(', ')}`, code: 'bad_request' },
      { status: 400 },
    )
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'

  // Тот же паттерн, что worker/routes/scan.js: если секрет не настроен (dev),
  // проверку пропускаем — не блокируем локальную разработку.
  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, body.turnstileToken, ip)
    if (!ok) return Response.json({ error: 'turnstile verification failed', code: 'forbidden' }, { status: 403 })
  }

  const rl = await checkLeadRateLimit(env.RATE_LIMIT_KV, ip)
  if (!rl.allowed) {
    return Response.json({ error: `rate limit exceeded (${rl.reason})`, code: 'rate_limited' }, { status: 429 })
  }

  const matched = matchAgencies({
    countryCode: body.country,
    service: body.service,
    priceBand: body.budget,
  }).map((a) => a.slug)

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const contact = {
    email: body.contact.email.trim(),
    company: typeof body.contact.company === 'string' && body.contact.company.trim() ? body.contact.company.trim() : undefined,
  }

  await insertLead(env.DB, {
    id,
    scanId: typeof body.scanId === 'string' ? body.scanId : undefined,
    country: body.country,
    standard: body.standard,
    service: body.service,
    budget: body.budget,
    deadline: body.deadline || undefined,
    contact,
    matched,
    createdAt,
  })

  // TODO(A2-LEAD-EMAIL, approval_required): реальная отправка через Resend —
  // отдельный узел, требует одобрения владельца (новый внешний платный сервис).
  // Здесь намеренно только запись в D1 + возврат matched[], без сетевого вызова.

  return Response.json({ leadId: id, matched }, { status: 201 })
}
