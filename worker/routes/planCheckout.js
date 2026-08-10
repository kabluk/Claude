// POST /api/scan/:id/checkout -> {url} (A2-STRIPE-CHECKOUT).
// Creates a Stripe Checkout Session PROGRAMMATICALLY (Stripe API, needs
// STRIPE_SECRET_KEY) for the one-time €19.99 PDF-plan unlock, and returns the
// hosted-checkout URL for the browser to redirect to.
//
// Why programmatic, not a static Payment Link like featured (D-027): the plan
// is PER-SCAN — the session MUST carry this scan's id so the webhook can unlock
// exactly this scan (worker/routes/stripeHook.js). A Dashboard Payment Link
// carries only static metadata (same for every buyer), so it cannot do this;
// see the long note in stripeHook.js. The scan_id travels in metadata[scan_id],
// which comes back on session.metadata (NOT custom_fields — that is the
// featured path, and the two are told apart by whether metadata.scan_id exists).
//
// SECURITY: the €19.99 amount (1999 minor units, EUR) is set HERE, on the
// server, and never read from the request body — otherwise a client could
// dictate their own price (e.g. 0). The purchase is only ever honoured by the
// signature-verified webhook writing plan_purchases; a success_url redirect is
// NOT trusted (the client can forge it without paying). This route only starts
// the payment; it never unlocks anything itself.
//
// Test seam: env.__stripeFetch ?? fetch — same pattern as env.__launchBrowser
// in scanPdf.js. A unit test injects a fake so it never calls Stripe for real.

import { getScan, reapStaleScan, isPlanUnlocked } from '../lib/db.js'
import { isScanStale } from './scan.js'

// €19.99 in minor units (Stripe requires an integer amount). Server-owned
// constant — never sourced from the request body (see file header).
const PLAN_UNIT_AMOUNT = 1999
const PLAN_CURRENCY = 'eur'
const PLAN_PRODUCT_NAME = 'Accessibility remediation plan'

function jsonError(status, error, code) {
  return Response.json({ error, code }, { status })
}

// success/cancel URLs must return to THIS scan's report page. Origin is taken
// from configuration (env.ALLOWED_ORIGIN, the deployed site — same var CORS
// already relies on, wrangler.jsonc) and falls back to the request's Origin
// header; never hardcoded. '*' (the permissive CORS default) is not a usable
// redirect target, so it is treated as "not configured" and we fall back.
function resolveSiteOrigin(request, env) {
  const configured = env?.ALLOWED_ORIGIN
  if (typeof configured === 'string' && configured && configured !== '*') return configured.replace(/\/+$/, '')
  const header = request?.headers?.get?.('origin')
  if (typeof header === 'string' && header) return header.replace(/\/+$/, '')
  return null
}

function stripeFetch(env) {
  return typeof env?.__stripeFetch === 'function' ? env.__stripeFetch : fetch
}

export async function handlePostPlanCheckout(id, request, env) {
  // Missing STRIPE_SECRET_KEY -> 503, same "this path isn't configured on this
  // deployment" rubric as the webhook without STRIPE_WEBHOOK_SECRET and
  // /api/explain without ANTHROPIC_API_KEY. NOT a silent fallback: card
  // payment simply isn't wired here, and the frontend degrades honestly to the
  // free (lead) branch on this exact code.
  if (!env?.STRIPE_SECRET_KEY) {
    return jsonError(503, 'card payment is not configured on this deployment', 'checkout_unavailable')
  }

  let scan = await getScan(env.DB, id)
  if (!scan) return jsonError(404, 'not found', 'not_found')

  // Same reap-on-read rubric as GET /api/scan/:id/pdf (D-109): a scan that
  // outlived its watchdog is dead, not slow — close it here so we classify it
  // as failed below instead of selling a plan for a scan nothing will finish.
  if (isScanStale(scan, env)) {
    await reapStaleScan(env.DB, { id, error: 'scan timeout: worker died mid-scan, closed by watchdog on read' })
    scan = await getScan(env.DB, id)
  }

  // Can't buy a plan for a scan that has no result to build one from. Same
  // status semantics the PDF route already uses (running -> 409, error -> 422)
  // so the two endpoints agree on what "not ready" means.
  if (scan.status === 'running') {
    return jsonError(409, 'scan is still running — the plan can be purchased once it completes', 'scan_not_ready')
  }
  if (scan.status === 'error') {
    return jsonError(422, 'scan failed — there is no plan to purchase', 'scan_failed')
  }

  // Already unlocked (a lead was left, or it was already paid) -> do NOT create
  // a session; charging again for something already accessible would take money
  // for nothing. 200 (not 4xx): the caller's desired end state — access to the
  // plan — already holds, so this is a success, not an error. The frontend
  // reads `alreadyUnlocked` and sends the user straight to the plan instead of
  // to Stripe.
  if (await isPlanUnlocked(env.DB, id)) {
    return Response.json({ alreadyUnlocked: true }, { status: 200 })
  }

  const origin = resolveSiteOrigin(request, env)
  if (!origin) {
    return jsonError(503, 'no site origin available to build return URLs', 'checkout_unavailable')
  }
  const reportUrl = `${origin}/report/${encodeURIComponent(id)}/`

  // Amount, currency and product name are server-owned literals above; only
  // the scan id (a path param we already validated by loading the scan) flows
  // in from the request. The client's request body is never read for pricing.
  const form = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price_data][currency]': PLAN_CURRENCY,
    'line_items[0][price_data][unit_amount]': String(PLAN_UNIT_AMOUNT),
    'line_items[0][price_data][product_data][name]': PLAN_PRODUCT_NAME,
    'line_items[0][quantity]': '1',
    'metadata[scan_id]': id,
    success_url: `${reportUrl}?checkout=success`,
    cancel_url: `${reportUrl}?checkout=cancel`,
  })

  let stripeRes
  try {
    stripeRes = await stripeFetch(env)('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })
  } catch (err) {
    // Network/transport failure reaching Stripe — a genuine upstream error,
    // not a client mistake and not a success. 502.
    return jsonError(502, `could not reach Stripe: ${err?.message ?? String(err)}`, 'checkout_failed')
  }

  if (!stripeRes.ok) {
    // Stripe answered non-2xx (bad key, API error, etc). Never pass this off
    // as success — the browser would redirect to nothing. 502 with a code the
    // frontend can surface honestly.
    const detail = await stripeRes.text().catch(() => '')
    console.error('A2-STRIPE-CHECKOUT: Stripe session create failed', { status: stripeRes.status, detail: detail.slice(0, 500) })
    return jsonError(502, `Stripe rejected the checkout session (HTTP ${stripeRes.status})`, 'checkout_failed')
  }

  let session
  try {
    session = await stripeRes.json()
  } catch {
    return jsonError(502, 'Stripe returned an unparseable response', 'checkout_failed')
  }

  if (!session?.url || typeof session.url !== 'string') {
    return jsonError(502, 'Stripe response had no checkout URL', 'checkout_failed')
  }

  return Response.json({ url: session.url }, { status: 200 })
}
