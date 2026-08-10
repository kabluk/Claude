// A2-PDF-PLAN route: GET /api/scan/:id/pdf. Browser Rendering is a paid
// resource and unavailable here — same test seam as worker/lib/axe.test.mjs,
// env.__launchBrowser.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleGetScanPdf } from './scanPdf.js'

// Mini-D1: same shape as worker/lib/db.test.mjs::fakeScansDb, trimmed to the
// SQL forms this route actually triggers (getScan + reapStaleScan), PLUS
// A2-REPORT-PAYWALL's `SELECT 1 FROM leads WHERE scan_id = ?` (hasLeadForScan)
// — `leadScanIds` names which scan ids have a lead on file in this test.
function fakeScansDb(initialRows = [], leadScanIds = []) {
  const rows = [...initialRows]
  const find = (id) => rows.find((r) => r.id === id)
  return {
    rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (/^SELECT \* FROM scans WHERE id/.test(sql)) return find(args[0]) ?? null
              if (/^SELECT 1 FROM leads WHERE scan_id = \? LIMIT 1/.test(sql)) {
                return leadScanIds.includes(args[0]) ? { 1: 1 } : null
              }
              return null
            },
            async run() {
              if (/^UPDATE scans SET status = 'error'.*AND status = 'running'/s.test(sql)) {
                const [error, completed, id] = args
                const row = find(id)
                if (row && row.status === 'running') {
                  Object.assign(row, { status: 'error', error, error_code: 'timeout', completed_at: completed, progress_json: null })
                  return { meta: { changes: 1 } }
                }
                return { meta: { changes: 0 } }
              }
              return { meta: { changes: 0 } }
            },
          }
        },
      }
    },
  }
}

function scanRow(over = {}) {
  return {
    id: 's1', url: 'https://example.com', status: 'done', pages_json: JSON.stringify(['https://example.com/']),
    findings_json: JSON.stringify([{ ruleId: 'color-contrast', impact: 'serious', selector: 'body', page: 'https://example.com/', wcag: [] }]),
    score: 88, error: null, error_code: null, email: null,
    created_at: '2026-08-10T00:00:00.000Z', completed_at: '2026-08-10T00:01:00.000Z', progress_json: null,
    ...over,
  }
}

function fakePdfBrowser({ hang = false, pdfBytes = new Uint8Array([1, 2, 3]) } = {}) {
  const calls = { setContent: null, pdfOptions: null, closed: false }
  const browser = {
    async newPage() {
      return {
        async setContent(html, opts) { calls.setContent = { html, opts } },
        async pdf(options) {
          calls.pdfOptions = options
          if (hang) return new Promise(() => {}) // never resolves — watchdog must catch this
          return pdfBytes
        },
      }
    },
    async close() { calls.closed = true },
  }
  return { browser, calls }
}

test('unknown scan id -> 404, same contract as GET /api/scan/:id', async () => {
  const env = { DB: fakeScansDb([]) }
  const res = await handleGetScanPdf('missing', env)
  assert.equal(res.status, 404)
  const body = await res.json()
  assert.equal(body.code, 'not_found')
})

test('scan still running -> 409, not a PDF and not a silent empty document', async () => {
  // created_at must be recent — isScanStale (D-109, reused as-is) would
  // otherwise reap a scan whose fixed test timestamp has aged past the
  // watchdog+grace window by the time this test actually runs.
  const env = {
    DB: fakeScansDb([scanRow({
      status: 'running', findings_json: null, score: null, completed_at: null,
      created_at: new Date().toISOString(),
    })]),
  }
  const res = await handleGetScanPdf('s1', env)
  assert.equal(res.status, 409)
  const body = await res.json()
  assert.equal(body.code, 'scan_not_ready')
})

test('scan failed -> 422, meaningful refusal instead of an empty plan', async () => {
  const env = { DB: fakeScansDb([scanRow({ status: 'error', error: 'boom', error_code: 'internal', findings_json: null, score: null })]) }
  const res = await handleGetScanPdf('s1', env)
  assert.equal(res.status, 422)
  const body = await res.json()
  assert.equal(body.code, 'scan_failed')
})

test('a scan stuck "running" past the watchdog+grace window is reaped, then treated as failed (D-109 reuse)', async () => {
  const staleRow = scanRow({
    status: 'running', findings_json: null, score: null, completed_at: null,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
  })
  const db = fakeScansDb([staleRow])
  const env = { DB: db, SCAN_TIMEOUT_MS: 1000 } // 1s timeout + 60s grace << 10 minutes
  const res = await handleGetScanPdf('s1', env)
  assert.equal(res.status, 422) // reaped -> status becomes 'error'
  assert.equal(db.rows[0].status, 'error')
})

// ── A2-REPORT-PAYWALL: access gate ──────────────────────────────────────────

test('no lead for this scan -> 402 plan_locked, generatePdf/browser never touched', async () => {
  let launched = false
  const env = {
    DB: fakeScansDb([scanRow()]), // done scan, no lead registered for 's1'
    __launchBrowser: async () => {
      launched = true
      throw new Error('must not be called: gate should have short-circuited before generatePdf')
    },
  }
  const res = await handleGetScanPdf('s1', env)
  assert.equal(res.status, 402)
  const body = await res.json()
  assert.equal(body.code, 'plan_locked')
  assert.equal(launched, false, 'a locked request must never spend Browser Rendering')
})

test('a lead exists for this scan -> gate passes, no BROWSER binding still -> 503 (not 402)', async () => {
  const env = { DB: fakeScansDb([scanRow()], ['s1']) }
  const res = await handleGetScanPdf('s1', env)
  assert.equal(res.status, 503)
  const body = await res.json()
  assert.equal(body.code, 'pdf_unavailable')
})

test('happy path: done scan with a lead on file -> 200 application/pdf, real bytes from page.pdf()', async () => {
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // "%PDF"
  const { browser, calls } = fakePdfBrowser({ pdfBytes: bytes })
  const env = { DB: fakeScansDb([scanRow()], ['s1']), __launchBrowser: async () => browser }

  const res = await handleGetScanPdf('s1', env)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('content-type'), 'application/pdf')
  assert.match(res.headers.get('content-disposition') ?? '', /filename="verscala-accessibility-plan-s1\.pdf"/)
  const body = new Uint8Array(await res.arrayBuffer())
  assert.deepEqual(body, bytes)

  // setContent got a real, self-contained HTML document mentioning the scanned URL.
  assert.match(calls.setContent.html, /example\.com/)
  assert.equal(calls.setContent.opts.waitUntil, 'load')
  // Header/footer wired through with the brand + page-number classes.
  assert.equal(calls.pdfOptions.displayHeaderFooter, true)
  assert.match(calls.pdfOptions.headerTemplate, /Verscala/)
  assert.match(calls.pdfOptions.footerTemplate, /pageNumber/)
  assert.equal(calls.pdfOptions.format, 'a4')
})

test('browser session is closed even on success (finally)', async () => {
  const { browser, calls } = fakePdfBrowser()
  const env = { DB: fakeScansDb([scanRow()], ['s1']), __launchBrowser: async () => browser }
  await handleGetScanPdf('s1', env)
  assert.equal(calls.closed, true)
})

test('a page.pdf() that never resolves is caught by the PDF-specific watchdog, not left hanging', async () => {
  const { browser, calls } = fakePdfBrowser({ hang: true })
  const env = { DB: fakeScansDb([scanRow()], ['s1']), __launchBrowser: async () => browser, PDF_TIMEOUT_MS: 30 }

  const startedAt = Date.now()
  const res = await handleGetScanPdf('s1', env)
  const elapsed = Date.now() - startedAt

  assert.equal(res.status, 502)
  const body = await res.json()
  assert.equal(body.code, 'pdf_generation_failed')
  assert.match(body.error, /timeout/)
  assert.ok(elapsed < 5000, `watchdog should fire near PDF_TIMEOUT_MS=30ms, took ${elapsed}ms`)
  assert.equal(calls.closed, true, 'browser must still be closed after a timeout')
})

test('jurisdiction override is reconstructed from a real jurisdictionCountry finding, not guessed from a .com TLD', async () => {
  // example.com has no TLD mapping at all (worker/lib/jurisdiction.js has no
  // 'com' entry) — without reusing jurisdictionCountry from the finding, the
  // legal block for this scan would render empty even though the scan itself
  // determined Germany applied (via an explicit countryCode override at scan
  // time, D-032). Run through the REAL route, not just the extractor in
  // isolation, so a wiring mistake in scanPdf.js would fail this test too.
  const findings = [{
    ruleId: 'a11y-statement-missing', impact: 'critical', selector: 'body', page: 'https://example.com/',
    wcag: [], jurisdictionCountry: 'DE', jurisdictionNote: 'DE: BFSG, Anlage 3 zu §14 BFSG',
  }]
  const row = scanRow({ findings_json: JSON.stringify(findings) })
  const { browser, calls } = fakePdfBrowser()
  const env = { DB: fakeScansDb([row], ['s1']), __launchBrowser: async () => browser }

  const res = await handleGetScanPdf('s1', env)
  assert.equal(res.status, 200)
  assert.match(calls.setContent.html, /BFSG/)
  assert.match(calls.setContent.html, /Barrierefreiheitsstärkungsgesetz/)
})
