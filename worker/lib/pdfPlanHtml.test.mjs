// A2-PDF-PLAN HTML rendering — pure string builder, no browser needed.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderPlanHtml, buildHeaderTemplate, buildFooterTemplate } from './pdfPlanHtml.js'
import { buildPlanData } from './pdfPlan.js'

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
