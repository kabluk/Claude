// POST /api/lead: приём RFQ-заявки, матчинг подходящих агентств, запись в D1.
//
// D1-доступ к таблице leads держим здесь, а не в worker/lib/db.js — тот файл
// (см. его заголовок) специализирован под scans и не входит в scope узла
// A2-LEAD-API (docs/project/GRAPH.yaml).
//
// Валидация полей копирует src/lib/leadForm.ts::validateLeadForm (тот же смысл
// проверок), но живёт отдельно: leadForm.ts — TS-модуль под Vite-алиасы
// (@data/a11y/types), недоступный из plain-ESM воркера, как и matchAgencies.ts
// (см. worker/lib/matchAgenciesServer.js).
//
// A2-LEAD-EMAIL (D-025): у Agency (data/a11y/types.ts) нет поля email — только
// website. Уведомляем ТОЛЬКО совпавшие агентства, которые реально claimed и
// verified (claims.email — адрес, введённый и подтверждённый самим владельцем
// профиля через A2-CLAIM-API/A2-CLAIM-EMAIL, не выдуманный и не собранный
// вслепую). Незаявленные агентства не получают ничего — у нас просто нет для
// них проверенного адреса; расширение (email в agencies.json и т.п.) — вне
// scope этого узла, отдельное решение владельца.

import { matchAgencies, agencies, taxonomies } from '../lib/matchAgenciesServer.js'
import { verifyTurnstile } from '../lib/turnstile.js'
import { sendEmail, SANDBOX_FROM, VERIFIED_FROM } from '../lib/resend.js'

// Владелец: cold-start-приоритет D-174 (2026-08-15) сознательно отложил
// outreach агентствам ДО появления реального объёма лидов — а значит сейчас
// (0 claimed-профилей) каждый лид пишется в D1 и молча уходит в никуда, если
// ни одно совпавшее агентство не заявлено. Пока это так, единственный
// адресат, которому есть смысл сообщать о новом лиде, — владелец: это и есть
// сигнал «спрос начался», ради которого продукт сейчас существует.
const OWNER_NOTIFY_EMAIL = 'info@verscala.com'

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

// Возвращает [{agencySlug, email}] — только claimed+verified среди matched.
// Пусто, если matched пуст или ни одно совпавшее агентство не заявлено.
async function findClaimedEmails(db, matchedSlugs) {
  if (matchedSlugs.length === 0) return []
  const placeholders = matchedSlugs.map(() => '?').join(',')
  const { results } = await db
    .prepare(`SELECT agency_slug, email FROM claims WHERE verified = 1 AND agency_slug IN (${placeholders})`)
    .bind(...matchedSlugs)
    .all()
  return results ?? []
}

function buildLeadNotificationEmail({ agencyName, lead }) {
  const lines = [
    `A new accessibility service request matched your listing on Verscala (${agencyName}).`,
    '',
    `Country: ${lead.country}`,
    `Standard: ${lead.standard}`,
    `Service: ${lead.service}`,
    `Budget: ${lead.budget}`,
    lead.deadline ? `Deadline: ${lead.deadline}` : null,
    '',
    `Contact: ${lead.contact.email}${lead.contact.company ? ` (${lead.contact.company})` : ''}`,
    '',
    'Reply directly to this email to reach out — Verscala does not route responses.',
  ].filter((l) => l !== null)
  return { subject: `New accessibility request matching ${agencyName}`, text: lines.join('\n') }
}

// Best-effort, как sendVerifyEmailBestEffort в claim.js: запись лида в D1 не
// зависит от Resend, отправка уведомлений — некритичный побочный эффект.
// Возвращает число НАЙДЕННЫХ claimed-совпадений (не число реально доставленных
// писем — та же степень точности, что уже была нужна вызывающему коду до этой
// правки, просто раньше значение никуда не уходило за пределы функции).
async function notifyClaimedAgenciesBestEffort(env, { matchedSlugs, lead }) {
  if (!env.RESEND_API_KEY || matchedSlugs.length === 0) return 0
  let claimed
  try {
    claimed = await findClaimedEmails(env.DB, matchedSlugs)
  } catch (err) {
    console.error('A2-LEAD-EMAIL: failed to look up claimed agencies', err?.message ?? err)
    return 0
  }
  for (const { agency_slug: agencySlug, email } of claimed) {
    const agency = agencies.find((a) => a.slug === agencySlug)
    const { subject, text } = buildLeadNotificationEmail({ agencyName: agency?.name ?? agencySlug, lead })
    try {
      await sendEmail(env.RESEND_API_KEY, { from: SANDBOX_FROM, to: email, subject, text })
    } catch (err) {
      console.error(`A2-LEAD-EMAIL: failed to notify ${agencySlug}`, err?.message ?? err)
    }
  }
  return claimed.length
}

// D-174 (2026-08-15): каждый лид владельцу, безусловно — не только когда есть
// claimed-совпадение. Сейчас (0 claimed-профилей) это ЕДИНСТВЕННЫЙ канал,
// который вообще узнаёт о лиде: claimedCount=0 означает, что письмо выше
// никому не ушло, а лид без этого уведомления был бы виден только тому, кто
// вручную открыл D1. Как только появятся claimed-профили, это письмо не
// теряет смысла — оно же телеметрия «пришёл ли реальный спрос», ради которой
// D-174 сознательно отложил outreach.
function buildOwnerNotificationEmail({ lead, scanId, matchedSlugs, claimedCount }) {
  const matchedNames = matchedSlugs
    .map((slug) => agencies.find((a) => a.slug === slug)?.name ?? slug)
    .slice(0, 5)
  const lines = [
    `New request-a-quote lead on Verscala.`,
    '',
    `Country: ${lead.country}`,
    `Standard: ${lead.standard}`,
    `Service: ${lead.service}`,
    `Budget: ${lead.budget}`,
    lead.deadline ? `Deadline: ${lead.deadline}` : null,
    '',
    `Contact: ${lead.contact.email}${lead.contact.company ? ` (${lead.contact.company})` : ''}`,
    scanId ? `From scan report: ${scanId}` : null,
    '',
    matchedNames.length
      ? `Matched agencies (${matchedSlugs.length}): ${matchedNames.join(', ')}${matchedSlugs.length > matchedNames.length ? '…' : ''}`
      : 'Matched agencies: none for this country/service combination.',
    claimedCount > 0
      ? `${claimedCount} of them are claimed+verified and were emailed directly.`
      : 'None of them are claimed yet — this lead was NOT routed to any agency automatically. Reply to this email to follow up by hand.',
  ].filter((l) => l !== null)
  return { subject: `New lead: ${lead.service} / ${lead.country}`, text: lines.join('\n') }
}

// Best-effort, тот же принцип, что notifyClaimedAgenciesBestEffort: запись
// лида в D1 уже случилась и не зависит от Resend.
async function notifyOwnerBestEffort(env, { matchedSlugs, claimedCount, lead, scanId }) {
  if (!env.RESEND_API_KEY) return
  const { subject, text } = buildOwnerNotificationEmail({ lead, scanId, matchedSlugs, claimedCount })
  try {
    await sendEmail(env.RESEND_API_KEY, { from: VERIFIED_FROM, to: OWNER_NOTIFY_EMAIL, subject, text })
  } catch (err) {
    console.error('A2-LEAD-EMAIL: failed to notify owner', err?.message ?? err)
  }
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
  const scanId = typeof body.scanId === 'string' ? body.scanId : undefined
  const contact = {
    email: body.contact.email.trim(),
    company: typeof body.contact.company === 'string' && body.contact.company.trim() ? body.contact.company.trim() : undefined,
  }

  const lead = {
    country: body.country,
    standard: body.standard,
    service: body.service,
    budget: body.budget,
    deadline: body.deadline || undefined,
    contact,
  }

  await insertLead(env.DB, { id, scanId, ...lead, matched, createdAt })

  const claimedCount = await notifyClaimedAgenciesBestEffort(env, { matchedSlugs: matched, lead })
  await notifyOwnerBestEffort(env, { matchedSlugs: matched, claimedCount, lead, scanId })

  return Response.json({ leadId: id, matched }, { status: 201 })
}
