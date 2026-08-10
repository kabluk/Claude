// GET /api/scan/:id/pdf -> application/pdf (A2-PDF-PLAN).
// D1 read (worker/lib/db.js) + jurisdiction resolution (worker/lib/jurisdiction.js,
// untouched) + pure plan assembly (worker/lib/pdfPlan.js) + pure HTML render
// (worker/lib/pdfPlanHtml.js) + Browser Rendering print. A2-REPORT-PAYWALL:
// access gate lives right here, after the status checks and before the
// BROWSER check / generatePdf() — see handleGetScanPdf below.

import puppeteer from '@cloudflare/puppeteer'
import { getScan, reapStaleScan, hasLeadForScan } from '../lib/db.js'
import { isScanStale } from './scan.js'
import { resolveJurisdiction } from '../lib/jurisdiction.js'
import { buildPlanData } from '../lib/pdfPlan.js'
import { renderPlanHtml, buildHeaderTemplate, buildFooterTemplate } from '../lib/pdfPlanHtml.js'

// worker/lib/axe.js keeps launchBrowser/closeBrowserSafely private and must not
// be touched functionally for this task — so the same PATTERN (not the same
// function) is reimplemented here: env.__launchBrowser test seam, keep_alive
// sized to this route's own timeout, best-effort bounded close() in `finally`.
//
// PDF_TIMEOUT_MS: generation here is one setContent() of a fully self-contained
// document (no external requests, no navigation, no axe) plus one pdf() print —
// nothing like the multi-page crawl SCAN_TIMEOUT_MS (120s, worker/lib/axe.js)
// guards against. Real prints of a document this size finish in low
// single-digit seconds; 30s is an order of magnitude of headroom for a slow
// Browser Rendering response, while still failing far faster than a scan would.
// Deliberately NOT reusing SCAN_TIMEOUT_MS: a stuck PDF request is a different
// failure class, and pinning it to an unrelated constant would hide a
// PDF-specific regression behind a number tuned for something else.
const PDF_TIMEOUT_MS = 30000
// Comfortably above PDF_TIMEOUT_MS so WE close the session via
// closeBrowserSafely in `finally` before the platform's own idle timeout would,
// same reasoning as KEEP_ALIVE_MS in worker/lib/axe.js, scaled down.
const KEEP_ALIVE_MS = 60000
const CLOSE_TIMEOUT_MS = 5000

// Same test seam pattern as worker/lib/axe.js::resolveScanTimeoutMs (D-067):
// lets a test exercise the watchdog in milliseconds instead of actually
// waiting 30s. Mustard/garbage values fall back to the real default — a typo
// in a future env var must not silently disable the watchdog.
export function resolvePdfTimeoutMs(env) {
  const raw = Number(env?.PDF_TIMEOUT_MS)
  return Number.isFinite(raw) && raw > 0 ? raw : PDF_TIMEOUT_MS
}

function launchBrowser(env) {
  if (typeof env?.__launchBrowser === 'function') return env.__launchBrowser()
  return puppeteer.launch(env.BROWSER, { keep_alive: KEEP_ALIVE_MS })
}

async function closeBrowserSafely(browser) {
  let timer
  try {
    await Promise.race([
      browser.close(),
      new Promise((resolve) => { timer = setTimeout(resolve, CLOSE_TIMEOUT_MS) }),
    ])
  } catch {
    // best-effort teardown — a torn-down-badly session must not turn a
    // successful PDF (or a clear error) into an unrelated crash.
  } finally {
    clearTimeout(timer)
  }
}

function jsonError(status, error, code) {
  return Response.json({ error, code }, { status })
}

// The scans table does not persist the countryCode a caller supplied to
// POST /api/scan (INTERFACES.md §4 — no column for it); the queue message
// carries it only into the consumer (worker/lib/scanJob.js), which recomputes
// jurisdiction and stamps jurisdictionCountry onto findings, but ONLY on the
// two statement rules where it was legally decisive
// (worker/lib/jurisdiction.js::applyJurisdictionWeight). Reusing that value
// here reconstructs the SAME jurisdiction the scan actually used whenever it
// mattered; otherwise resolveJurisdiction() below falls back to its own honest
// TLD guess — the same behaviour a fresh, never-scanned URL would get. This is
// the accurate limitation, not a guess: we do not invent a country we never
// actually used.
function findOverrideCountry(findings) {
  return findings.find((f) => f.jurisdictionCountry)?.jurisdictionCountry
}

async function generatePdf(env, planData) {
  let browser
  let watchdog
  try {
    browser = await launchBrowser(env)
    const page = await browser.newPage()
    const html = renderPlanHtml(planData)

    const work = (async () => {
      // 'load' is correct (not 'domcontentloaded' as in axe.js's live navigation):
      // there is no network here, setContent() only needs its own document +
      // inline <style> to be ready, and 'load' is the more conservative/complete
      // signal — the small cost is irrelevant for a document with no external
      // resources to wait for.
      await page.setContent(html, { waitUntil: 'load' })
      return page.pdf({
        format: 'a4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: buildHeaderTemplate(planData.url),
        footerTemplate: buildFooterTemplate(),
        margin: { top: '90px', bottom: '70px', left: '48px', right: '48px' },
      })
    })()
    // Same D-108 lesson as axe.js: a promise that never settles must still be
    // handled once the watchdog wins the race, or it becomes an unhandled
    // rejection in the isolate after this request has already answered.
    work.catch(() => {})

    const timeoutMs = resolvePdfTimeoutMs(env)
    return await Promise.race([
      work,
      new Promise((_resolve, reject) => {
        watchdog = setTimeout(
          () => reject(new Error(`pdf generation timeout: no result after ${timeoutMs}ms`)),
          timeoutMs,
        )
      }),
    ])
  } finally {
    clearTimeout(watchdog)
    if (browser) await closeBrowserSafely(browser)
  }
}

export async function handleGetScanPdf(id, env) {
  let scan = await getScan(env.DB, id)
  if (!scan) return jsonError(404, 'not found', 'not_found')

  // Same reap-on-read rubric as GET /api/scan/:id (worker/routes/scan.js,
  // D-109): a scan that looks 'running' but has outlived its watchdog by the
  // grace window is dead, not slow — closing it here means a PDF request
  // doesn't wait forever on a scan nothing will ever finish.
  if (isScanStale(scan, env)) {
    await reapStaleScan(env.DB, {
      id,
      error: 'scan timeout: worker died mid-scan, closed by watchdog on read',
    })
    scan = await getScan(env.DB, id)
  }

  if (scan.status === 'running') {
    return jsonError(409, 'scan is still running — the plan can be generated once it completes', 'scan_not_ready')
  }
  if (scan.status === 'error') {
    return jsonError(422, 'scan failed — there is no result to build a plan from', 'scan_failed')
  }

  // A2-REPORT-PAYWALL: access gate. Unlocked = a lead was left for this scan
  // (the free branch of the funnel, HANDOFF "Воронка" — "сделайте за меня"
  // gives the plan away because the lead is worth more than €19.99). Paid
  // unlock (Stripe) is a separate, not-yet-built node — this slice only
  // wires the free branch, which needed no schema change (leads.scan_id
  // already exists, migrations/0003_leads.sql).
  //
  // Placed HERE — after the cheap status checks above, BEFORE the BROWSER
  // check and generatePdf() below — so a locked request never spends
  // Browser Rendering (a paid, rate-limited resource) generating a plan
  // nobody is allowed to have yet.
  //
  // 402 Payment Required is the accurate status: this is not 403 (caller
  // isn't forbidden by identity/permissions) or 404 (the plan's source data
  // exists — the scan is done) — what's missing is specifically payment, or
  // its free-branch substitute, a lead. 'plan_locked' (not 'forbidden') so
  // the frontend can render "buy the plan / request a quote" rather than a
  // generic access-denied message.
  if (!(await hasLeadForScan(env.DB, id))) {
    return jsonError(402, 'this plan is not unlocked yet', 'plan_locked')
  }

  // Fail loudly before any expensive work, same rubric as POST /api/scan's
  // SCAN_QUEUE check (worker/routes/scan.js) — a missing binding is a
  // deployment misconfiguration, not a transient PDF generation failure, and
  // conflating the two would make this error look like it's our fault every
  // time instead of once, obviously, at deploy time.
  if (!env.BROWSER && typeof env.__launchBrowser !== 'function') {
    return jsonError(503, 'PDF rendering is not configured on this deployment', 'pdf_unavailable')
  }

  const jurisdiction = resolveJurisdiction(scan.url, findOverrideCountry(scan.findings))
  const planData = buildPlanData(scan, jurisdiction)

  let pdfBuffer
  try {
    pdfBuffer = await generatePdf(env, planData)
  } catch (err) {
    return jsonError(502, `could not generate PDF: ${err?.message ?? String(err)}`, 'pdf_generation_failed')
  }

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="verscala-accessibility-plan-${id}.pdf"`,
    },
  })
}
