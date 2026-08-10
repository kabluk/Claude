// Renders worker/lib/pdfPlan.js's plan data into a self-contained HTML string
// for Puppeteer's page.setContent() + page.pdf() (worker/routes/scanPdf.js).
// Pure function of (planData) -> string — no browser, testable without one
// (worker/lib/pdfPlanHtml.test.mjs).
//
// Self-contained on purpose (task requirement): no CDN fonts, no external
// images, no network calls from inside setContent — those either don't
// resolve (Browser Rendering's setContent has no navigation context to fetch
// from reliably) or slow printing down for no benefit. System font stack only;
// Geist (the brand font used on the live site) is deliberately NOT pulled in
// here — it is loaded from Google Fonts / a hosted file on verscala.com, which
// is exactly the kind of external dependency this document must not have.

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c])
}

const IMPACT_LABEL = { critical: 'Critical', serious: 'Serious', moderate: 'Moderate', minor: 'Minor' }
const IMPACT_COLOR = { critical: '#b91c1c', serious: '#c2410c', moderate: '#a16207', minor: '#4b5563' }

function impactChip(impact) {
  const color = IMPACT_COLOR[impact] ?? '#4b5563'
  const label = IMPACT_LABEL[impact] ?? esc(impact)
  return `<span class="chip" style="color:${color};border-color:${color}">${label}</span>`
}

function fmtDate(iso) {
  if (!iso) return 'unknown'
  return String(iso).slice(0, 10)
}

const STATEMENT_STATUS_TEXT = {
  present: 'An accessibility statement was found and no missing required content was flagged.',
  missing: 'No accessibility statement was found on the scanned pages.',
  incomplete: 'An accessibility statement was found, but it is missing required content.',
  'not-required': 'Our jurisdiction data does not mark an accessibility statement as required here.',
}

function renderLegalSection(legal) {
  if (!legal?.known) {
    return `<section class="block">
      <h2>Legal context</h2>
      <p class="muted">We could not determine a specific national transposition law for this site's
      jurisdiction from the domain alone. General EU Accessibility Act requirements may still apply if
      the site serves an EU market — this section is left blank rather than guessed.</p>
    </section>`
  }
  const lawLine = legal.lawFull ? `${esc(legal.law)} — ${esc(legal.lawFull)}` : esc(legal.law)
  const citation = legal.verified && legal.citation
    ? `<p><span class="label">Citation:</span> ${esc(legal.citation)}</p>`
    : `<p class="muted">Legal basis indicative — not verified against primary law text for this
       country.</p>`
  const statementLine = legal.statementRequired
    ? `<p><span class="label">Accessibility statement:</span> ${esc(STATEMENT_STATUS_TEXT[legal.statementStatus] ?? '')}</p>${
        legal.statementStatus === 'incomplete' && legal.incompleteDetail
          ? `<p class="muted">${esc(legal.incompleteDetail)}</p>`
          : ''
      }`
    : `<p class="muted">${esc(STATEMENT_STATUS_TEXT['not-required'])}</p>`

  return `<section class="block">
    <h2>Legal context</h2>
    <p><span class="label">Jurisdiction:</span> ${esc(legal.country)} — ${lawLine}</p>
    ${citation}
    ${statementLine}
    <p class="muted">Microenterprises — fewer than 10 staff and no more than &euro;2M annual turnover or
    balance sheet — are exempt from the EAA's service requirements under Article 4(5), so a small
    business may fall outside this regime entirely. We deliberately do not quote penalty figures: they
    depend on circumstances we cannot see from a scan. This is general legal information, not legal
    advice for your specific situation.</p>
  </section>`
}

function renderCoverageSection(coverage) {
  const pages = coverage.pagesScanned ?? []
  const skippedList = coverage.skipped.length
    ? `<ul class="plain">${coverage.skipped
        .map((s) => `<li><span class="mono">${esc(s.page)}</span> — ${esc(s.reason)}</li>`)
        .join('')}</ul>`
    : ''
  const skippedNote = coverage.skipped.length
    ? `<p class="warn"><strong>${coverage.skipped.length} page${coverage.skipped.length === 1 ? '' : 's'} could not be checked</strong> and ${coverage.skipped.length === 1 ? 'is' : 'are'} not covered by this plan:</p>${skippedList}`
    : `<p class="muted">All pages selected for this scan were successfully checked.</p>`

  return `<section class="block">
    <h2>Scan coverage</h2>
    <p>${pages.length} page${pages.length === 1 ? '' : 's'} scanned.</p>
    ${skippedNote}
  </section>`
}

function renderEffortSection(effort) {
  if (!effort) {
    return `<section class="block">
      <h2>Effort estimate</h2>
      <p class="muted">No engineering-relevant findings on the scanned pages — no estimate to show.</p>
    </section>`
  }
  return `<section class="block">
    <h2>Effort estimate</h2>
    <p class="estimate">${esc(effort.formatted)}</p>
    <p class="muted">A rough estimate based on the number and severity of issues found on the scanned
    pages — <strong>not a quote, an offer, or legal advice</strong>. Actual cost depends on your
    codebase, team, and how the fixes are made.</p>
  </section>`
}

function renderPriorityRow(p, rank) {
  const criterion = p.wcag
    ? `<a href="${esc(p.link)}">WCAG ${esc(p.wcag)}</a> — ${esc(p.wcagTitle)}`
    : p.wcagTitle
      ? esc(p.wcagTitle)
      : '<span class="muted">not mapped to a WCAG criterion</span>'
  return `<tr>
    <td class="num">${rank}</td>
    <td>${impactChip(p.impact)}</td>
    <td class="mono">${esc(p.ruleId)}</td>
    <td>${criterion}</td>
    <td class="num">${p.instanceCount}</td>
    <td class="num">${p.pageCount}</td>
  </tr>`
}

function renderPrioritiesSection(priorities) {
  if (priorities.length === 0) {
    return `<section class="block">
      <h2>Priorities</h2>
      <p class="muted">No findings on the scanned pages beyond scan-quality notes.</p>
    </section>`
  }
  return `<section class="block">
    <h2>Priorities</h2>
    <p class="muted">Sorted by severity, then by how many pages are affected.</p>
    <table>
      <thead><tr><th>#</th><th>Severity</th><th>Rule</th><th>WCAG criterion</th><th>Instances</th><th>Pages</th></tr></thead>
      <tbody>${priorities.map((p, i) => renderPriorityRow(p, i + 1)).join('')}</tbody>
    </table>
  </section>`
}

function renderBriefEntry(item, rank) {
  const criterionLine = item.wcag
    ? `<a href="${esc(item.link)}">WCAG ${esc(item.wcag)}</a>${item.clause ? ` &middot; EN 301 549 ${esc(item.clause)}` : ''} — ${esc(item.wcagTitle)}`
    : item.kind === 'beyond-standard'
      ? `${esc(item.basis)}${item.wcagTitle ? ` — ${esc(item.wcagTitle)}` : ''}`
      : '<span class="muted">not mapped to a WCAG criterion or EN 301 549 clause</span>'

  const whatLine = item.what
    ? `<p>${esc(item.what)}</p>`
    : `<p class="muted">${esc(item.caveat ?? 'no automated description available')}</p>`
  const caveatLine = item.what && item.caveat ? `<p class="muted"><em>${esc(item.caveat)}</em></p>` : ''

  const instanceRows = item.instances
    .map(
      (inst) => `<tr>
        <td class="mono">${esc(inst.page)}</td>
        <td class="mono">${esc(inst.selector)}</td>
        <td class="mono wrap">${inst.html ? esc(inst.html) : '<span class="muted">—</span>'}</td>
      </tr>`,
    )
    .join('')
  const moreLine = item.moreInstances > 0
    ? `<p class="muted">+${item.moreInstances} more instance${item.moreInstances === 1 ? '' : 's'} of the same rule, not listed individually.</p>`
    : ''

  return `<article class="brief-item">
    <h3>${rank}. ${impactChip(item.impact)} <span class="mono">${esc(item.ruleId)}</span></h3>
    <p class="criterion">${criterionLine}</p>
    ${whatLine}
    ${caveatLine}
    <table class="instances">
      <thead><tr><th>Page</th><th>Selector</th><th>HTML</th></tr></thead>
      <tbody>${instanceRows}</tbody>
    </table>
    ${moreLine}
  </article>`
}

function renderDevBriefSection(devBrief) {
  if (devBrief.length === 0) {
    return `<section class="block"><h2>Developer brief</h2><p class="muted">No findings to brief.</p></section>`
  }
  return `<section class="block">
    <h2>Developer brief</h2>
    <p class="muted">One entry per rule — what to fix, where, and which standard it maps to. This
    names WCAG criteria and, where we have one, describes what our own check looks for; it is not a
    substitute for a manual accessibility review.</p>
    ${devBrief.map((item, i) => renderBriefEntry(item, i + 1)).join('')}
  </section>`
}

const STYLE = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    font-size: 11px;
    line-height: 1.5;
  }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; word-break: break-word; }
  .wrap { white-space: pre-wrap; max-width: 260px; }
  .muted { color: #6b7280; }
  .warn { color: #b45309; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .label { font-weight: 600; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 0 0 8px; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; }
  h3 { font-size: 12px; margin: 0 0 4px; }
  section.block { margin: 0 0 22px; break-inside: avoid-page; }
  article.brief-item { margin: 0 0 16px; padding: 8px 0; border-top: 1px solid #e5e7eb; break-inside: avoid; }
  p { margin: 4px 0; }
  ul.plain { margin: 4px 0; padding-left: 18px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.03em; color: #6b7280; }
  .chip {
    display: inline-block; border: 1px solid; border-radius: 999px;
    padding: 1px 8px; font-size: 9px; font-weight: 600; text-transform: uppercase;
  }
  .cover { margin-bottom: 28px; }
  .cover .meta { color: #6b7280; margin-top: 6px; }
  .estimate { font-size: 20px; font-weight: 700; margin: 6px 0; }
  a { color: #1d4ed8; text-decoration: underline; }
`

// Full HTML document. `planData` is worker/lib/pdfPlan.js::buildPlanData()'s
// output. Kept as one string builder (not a template engine) — there is no
// runtime dependency to justify one, and the whole thing must stay debuggable
// by reading it top to bottom.
export function renderPlanHtml(planData) {
  const scoreLine = planData.score == null ? 'not available' : `${planData.score} / 100`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Verscala accessibility plan — ${esc(planData.url)}</title>
<style>${STYLE}</style>
</head>
<body>
  <section class="cover">
    <h1>Accessibility remediation plan</h1>
    <p>${esc(planData.url)}</p>
    <p class="meta">Automated score: ${scoreLine} &middot; Scan completed: ${fmtDate(planData.scanCompletedAt)}
    &middot; Plan generated: ${fmtDate(planData.generatedAt)}</p>
    <p class="muted">This is an automated plan based on a single automated scan. It is not a
    certification of WCAG conformance and does not constitute legal advice. A clean scan does not
    guarantee full accessibility — manual review by a qualified auditor is still required.</p>
  </section>

  ${renderCoverageSection(planData.coverage)}
  ${renderPrioritiesSection(planData.priorities)}
  ${renderLegalSection(planData.legal)}
  ${renderEffortSection(planData.effort)}
  ${renderDevBriefSection(planData.devBrief)}
</body>
</html>`
}

// Puppeteer header/footer templates are separate small HTML fragments, styled
// inline (external <style> does not apply to them) — see PDFOptions.headerTemplate
// in node_modules/@cloudflare/puppeteer/lib/types.d.ts. `.pageNumber`/`.totalPages`
// classes are filled in by Chromium itself.
export function buildHeaderTemplate(siteUrl) {
  return `<div style="font-size:8px;width:100%;padding:0 24px;color:#6b7280;
    font-family:-apple-system,Helvetica,Arial,sans-serif;display:flex;justify-content:space-between;">
    <span>Verscala &mdash; accessibility remediation plan</span>
    <span>${esc(siteUrl)}</span>
  </div>`
}

export function buildFooterTemplate() {
  return `<div style="font-size:8px;width:100%;padding:0 24px;color:#6b7280;
    font-family:-apple-system,Helvetica,Arial,sans-serif;display:flex;justify-content:space-between;">
    <span>verscala.com</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`
}
