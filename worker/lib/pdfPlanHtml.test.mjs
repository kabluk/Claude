// A2-PDF-PLAN HTML rendering — pure string builder, no browser needed.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderPlanHtml, buildHeaderTemplate, buildFooterTemplate } from './pdfPlanHtml.js'
import { buildPlanData, buildCheckYourself } from './pdfPlan.js'

const f = (over) => ({ ruleId: 'x', impact: 'moderate', selector: 'body', page: 'https://x.test/', wcag: [], ...over })

function scanFixture(over = {}) {
  return {
    id: 's1', url: 'https://example.com', status: 'done',
    pages: ['https://example.com/'], findings: [], score: 90,
    error: null, errorCode: null, createdAt: '2026-08-10T00:00:00Z', completedAt: '2026-08-10T00:01:00Z',
    ...over,
  }
}

const DE_JURISDICTION = {
  country: 'DE', law: 'BFSG', lawFull: 'Barrierefreiheitsstärkungsgesetz',
  statementRequired: true, verified: true, citation: 'Anlage 3 zu §14 BFSG',
}
const FR_JURISDICTION = {
  country: 'FR', law: 'RGAA', lawFull: "Référentiel général d'amélioration de l'accessibilité",
  statementRequired: true, verified: false,
}

const MONEY_NEAR_FINE_RE =
  /\b(fine|penalty|penalties|Bußgeld|Geldbuße|sanction)\b[^.]{0,80}(?:€|EUR)\s?\d|(?:€|EUR)\s?\d[^.]{0,80}\b(fine|penalty|penalties|Bußgeld|Geldbuße|sanction)\b/i

test('rendered plan is one self-contained HTML document with no external asset references', () => {
  const plan = buildPlanData(scanFixture({ findings: [f({ ruleId: 'color-contrast', impact: 'serious' })] }), DE_JURISDICTION)
  const html = renderPlanHtml(plan)
  assert.match(html, /^<!doctype html>/)
  assert.doesNotMatch(html, /https?:\/\/[^"']*\.(?:css|woff2?|ttf)/i, 'no external font/stylesheet reference')
  assert.doesNotMatch(html, /<link\s/i, 'no <link> tags (would fetch externally)')
  assert.doesNotMatch(html, /fonts\.googleapis\.com|cdn\.jsdelivr\.net/i)
})

test('no fine amount is ever rendered, for a jurisdiction WITH a verified citation (DE)', () => {
  const plan = buildPlanData(
    scanFixture({ findings: [f({ ruleId: 'a11y-statement-missing', impact: 'critical' })] }),
    DE_JURISDICTION,
  )
  const html = renderPlanHtml(plan)
  assert.doesNotMatch(html, MONEY_NEAR_FINE_RE)
  assert.match(html, /Anlage 3 zu §14 BFSG/) // citation IS shown — just never a sum
})

test('no fine amount is ever rendered, for an unverified jurisdiction (FR)', () => {
  const plan = buildPlanData(
    scanFixture({ findings: [f({ ruleId: 'a11y-statement-missing', impact: 'critical' })] }),
    FR_JURISDICTION,
  )
  const html = renderPlanHtml(plan)
  assert.doesNotMatch(html, MONEY_NEAR_FINE_RE)
})

test('canary: a hardcoded fine amount WOULD be caught by the guard above', () => {
  const bait = '<p>Germany: fine up to €10,000 for non-compliance.</p>'
  assert.match(bait, MONEY_NEAR_FINE_RE, 'the regex itself must be able to fail — canary for the two tests above')
})

test('effort estimate disclaimer is present whenever an estimate is shown (D-006)', () => {
  const plan = buildPlanData(scanFixture({ findings: [f({ ruleId: 'color-contrast', impact: 'serious' })] }), DE_JURISDICTION)
  const html = renderPlanHtml(plan)
  assert.ok(plan.effort, 'fixture must actually produce an estimate for this test to mean anything')
  assert.match(html, /not a quote, an offer, or legal advice/)
})

test('skipped page is mentioned honestly in the rendered document', () => {
  const plan = buildPlanData(
    scanFixture({
      findings: [f({ ruleId: 'scan-meta-page-skipped', page: 'https://example.com/kontakt', html: 'nav timeout after 2 retries' })],
    }),
    DE_JURISDICTION,
  )
  const html = renderPlanHtml(plan)
  assert.match(html, /could not be checked/)
  assert.match(html, /example\.com\/kontakt/)
  assert.match(html, /nav timeout after 2 retries/)
})

test('scan-meta-page-skipped never appears as a priority or dev-brief entry itself', () => {
  const plan = buildPlanData(
    scanFixture({
      findings: [
        f({ ruleId: 'scan-meta-page-skipped', page: 'https://example.com/kontakt', html: 'nav timeout' }),
        f({ ruleId: 'color-contrast', impact: 'serious' }),
      ],
    }),
    DE_JURISDICTION,
  )
  assert.equal(plan.priorities.some((p) => p.ruleId.startsWith('scan-meta-')), false)
  assert.equal(plan.devBrief.some((d) => d.ruleId.startsWith('scan-meta-')), false)
})

test('a real captured HTML fragment is escaped, not injected raw into the document', () => {
  const evil = '<script>alert(1)</script><div class="broken">'
  const plan = buildPlanData(
    scanFixture({ findings: [f({ ruleId: 'color-contrast', impact: 'serious', html: evil })] }),
    DE_JURISDICTION,
  )
  const html = renderPlanHtml(plan)
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/)
  assert.match(html, /&lt;script&gt;/)
})

test('legal block text matches the jurisdiction actually passed in (DE vs FR)', () => {
  const findings = [f({ ruleId: 'a11y-statement-missing', impact: 'critical' })]
  const htmlDe = renderPlanHtml(buildPlanData(scanFixture({ findings }), DE_JURISDICTION))
  const htmlFr = renderPlanHtml(buildPlanData(scanFixture({ findings }), FR_JURISDICTION))
  assert.match(htmlDe, /BFSG/)
  assert.doesNotMatch(htmlDe, /RGAA/)
  assert.match(htmlFr, /RGAA/)
  assert.doesNotMatch(htmlFr, /BFSG/)
})

test('header/footer templates carry the brand and the scanned URL, and Puppeteer page-number classes', () => {
  const header = buildHeaderTemplate('https://example.com/')
  const footer = buildFooterTemplate()
  assert.match(header, /Verscala/)
  assert.match(header, /example\.com/)
  assert.match(footer, /class="pageNumber"/)
  assert.match(footer, /class="totalPages"/)
  assert.match(footer, /verscala\.com/)
})

test('priorities table is present and sorted the same as plan.priorities', () => {
  const findings = [
    f({ ruleId: 'critical-rule', impact: 'critical' }),
    f({ ruleId: 'minor-rule', impact: 'minor' }),
  ]
  const plan = buildPlanData(scanFixture({ findings }), DE_JURISDICTION)
  const html = renderPlanHtml(plan)
  const criticalIdx = html.indexOf('critical-rule')
  const minorIdx = html.indexOf('minor-rule')
  assert.ok(criticalIdx > -1 && minorIdx > -1)
  assert.ok(criticalIdx < minorIdx, 'critical must render before minor')
})

// --- D-131: axe-core's own fix guidance in the Developer brief ---------------

const REAL_IMAGE_ALT_HELP = 'Images must have alternative text'
const REAL_IMAGE_ALT_HELP_URL = 'https://dequeuniversity.com/rules/axe/4.13/image-alt?application=axeAPI'
const REAL_FAILURE_SUMMARY = 'Fix any of the following:\n  Element does not have an alt attribute'

test('D-131: the brief renders axe-core help text, its Deque link, and per-instance failureSummary', () => {
  const plan = buildPlanData(
    scanFixture({
      findings: [f({
        ruleId: 'image-alt', impact: 'critical', selector: 'img.logo',
        help: REAL_IMAGE_ALT_HELP, helpUrl: REAL_IMAGE_ALT_HELP_URL, failureSummary: REAL_FAILURE_SUMMARY,
      })],
    }),
    DE_JURISDICTION,
  )
  const html = renderPlanHtml(plan)
  assert.match(html, /Images must have alternative text/)
  assert.match(html, /href="https:\/\/dequeuniversity\.com\/rules\/axe\/4\.13\/image-alt\?application=axeAPI"/)
  assert.match(html, /Deque, maintainers of axe-core/, 'the third-party source must be attributed, not passed off as ours')
  assert.match(html, /Element does not have an alt attribute/, 'failureSummary must be VISIBLE, not merely carried in the data')
  // The WCAG criterion survives alongside the new guidance (owner: add, don't replace).
  assert.match(html, /WCAG 1\.1\.1/)
})

test('D-131: without help/failureSummary the brief renders exactly the old way, nothing empty or invented', () => {
  const plan = buildPlanData(
    scanFixture({ findings: [f({ ruleId: 'image-alt', impact: 'critical', selector: 'img.logo' })] }),
    DE_JURISDICTION,
  )
  const html = renderPlanHtml(plan)
  assert.doesNotMatch(html, /dequeuniversity\.com/, 'no Deque link may be constructed from a ruleId')
  assert.doesNotMatch(html, /class="summary-row"/, 'no empty failureSummary row')
  assert.match(html, /not the specific problem on the page/, 'the honest pre-D-131 caveat is still there')
})

// --- D-131: "Check these yourself" section ------------------------------------

test('D-131: the plan carries a "Check these yourself" section with every uncovered criterion', () => {
  const plan = buildPlanData(scanFixture({ findings: [f({ ruleId: 'image-alt', impact: 'critical' })] }), DE_JURISDICTION)
  const html = renderPlanHtml(plan)
  assert.match(html, /<h2>Check these yourself<\/h2>/)
  for (const row of buildCheckYourself()) {
    assert.ok(html.includes(row.title), `criterion "${row.title}" is missing from the rendered plan`)
    assert.ok(html.includes(`href="${row.understandingUrl}"`), `W3C link for ${row.wcag} is missing`)
  }
})

test('D-131: the section is honest about WHY these are listed — no pass/fail is claimed for them', () => {
  const plan = buildPlanData(scanFixture({ findings: [] }), DE_JURISDICTION)
  const html = renderPlanHtml(plan)
  assert.match(html, /outside what any automated scan can check/)
  assert.match(html, /neither found nor ruled out/)
})

test('D-131: the value sentence never invents a saving (R1 / D-035, applies to the PAID document too)', () => {
  const plan = buildPlanData(scanFixture({ findings: [f({ ruleId: 'image-alt', impact: 'critical' })] }), DE_JURISDICTION)
  const section = renderPlanHtml(plan).split('<h2>Check these yourself</h2>')[1]
  assert.ok(section, 'section must exist')
  // No money, no percentage, no hours/days saved anywhere in this section.
  assert.doesNotMatch(section, /(?:€|EUR|\$|£)\s?\d/i)
  assert.doesNotMatch(section, /\d+\s?%/)
  assert.doesNotMatch(section, /\bsave[sd]?\b|\bsaving/i)
  assert.doesNotMatch(section, /\b\d+\s?(hours?|days?|weeks?|months?)\b/i)
  // ...and it does say the honest version.
  // \s+ not a literal space: the source template wraps this sentence across lines.
  assert.match(section, /can reduce how much\s+you need from them/)
})

test('D-131: every W3C link in the rendered plan points at w3.org, never a guessed host or path', () => {
  const plan = buildPlanData(scanFixture({ findings: [] }), DE_JURISDICTION)
  const html = renderPlanHtml(plan)
  const understandingLinks = [...html.matchAll(/href="([^"]*Understanding[^"]*)"/g)].map((m) => m[1])
  assert.equal(understandingLinks.length, buildCheckYourself().length)
  for (const url of understandingLinks) {
    assert.match(url, /^https:\/\/www\.w3\.org\/WAI\/WCAG22\/Understanding\/[a-z0-9-]+\.html$/)
  }
})

test('D-131: a plan built by an OLDER worker (no checkYourself field) renders without the section, not a crash', () => {
  const plan = buildPlanData(scanFixture({ findings: [] }), DE_JURISDICTION)
  delete plan.checkYourself
  const html = renderPlanHtml(plan)
  assert.doesNotMatch(html, /Check these yourself/)
  assert.match(html, /^<!doctype html>/)
})
