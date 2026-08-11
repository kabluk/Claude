// Renders worker/lib/pdfPlan.js's plan data into a self-contained HTML string
// for Puppeteer's page.setContent() + page.pdf() (worker/routes/scanPdf.js).
// Pure function of (planData) -> string — no browser, testable without one
// (worker/lib/pdfPlanHtml.test.mjs).
//
// SELF-CONTAINED ON PURPOSE. Browser Rendering's setContent() has no reliable
// navigation context to fetch external resources from, so anything not inside
// this string either does not resolve at all or resolves slowly and silently
// wrong. Concretely, and permanently: no <link>, no <script src>, no CDN, no
// Google Fonts, no remote images. Fonts come in as base64 data: URIs from
// worker/lib/pdfFonts.js; icons are inline SVG. The only external URLs in the
// output are <a href> targets a human clicks — real destinations (w3.org,
// dequeuniversity.com, verscala.com), never resources the renderer fetches.
//
// DESIGN SYSTEM (D-132). The visual language below is the owner's own, produced
// in Google Stitch and handed over as four HTML mockups (cover/summary, a
// dev-brief rule page, "Check these yourself", and a fuller Priorities table).
// Those mockups are Tailwind-CDN pages with a shared `tailwind.config` token
// block; every token used here was translated by hand into the real CSS custom
// properties in :root below, at the exact values that config declares — there
// is no Tailwind at runtime and no approximated palette. What could NOT be
// carried over, and why, is recorded in DECISIONS.md D-132:
//   - the fixed app nav (REPORT / ARCHIVE / avatar) — web-app chrome with
//     nothing to navigate to inside a downloaded document;
//   - "ISO 27001" / "GDPR COMPLIANT" footer badges — Verscala holds neither
//     certification, so shipping them would be a false claim (D-035/D-046/D-114);
//   - the 12-column desktop grid — A4 gives this document a 698px content
//     column, which the priorities and dev-brief tables need in full;
//   - box-shadow / backdrop-blur depth — replaced with borders and tinted
//     fills, which print deterministically.

import { FONT_FACE_CSS } from './pdfFonts.js'

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c])
}

// --- Icons -------------------------------------------------------------------
// The mockups draw these with Material Symbols Outlined, loaded from Google
// Fonts. An icon webfont is the wrong shape for this document twice over: it is
// an external resource setContent cannot fetch, and embedding a whole variable
// icon font (hundreds of KB) to draw seven glyphs is absurd. Each is redrawn
// below as a stroke SVG in Material's own 24px grid and line style, inheriting
// currentColor and sized by CSS — so an icon can never render as a stray
// ligature word ("calendar_today") the way a missing icon font does.
const ICONS = {
  // calendar_today
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  // article
  article:
    '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  // find_in_page
  findInPage:
    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><circle cx="11.5" cy="13.5" r="2.5"/><path d="M13.4 15.4 16 18"/>',
  // work_history
  workHistory:
    '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3"/><path d="M9 6V4h6v2"/><path d="M3 8v9a2 2 0 0 0 2 2h6"/><circle cx="17.5" cy="16.5" r="4.5"/><path d="M17.5 14.5v2l1.5 1"/>',
  // gavel
  gavel:
    '<path d="m14.5 3.5 6 6M17.5 6.5l-4 4M11.5 6.5l-4 4M9.5 4.5l6 6"/><path d="m10.5 9.5-7 7 2 2 7-7"/><path d="M13 21h8"/>',
  // help
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.6.2-.7.8-.7 1.3v.3"/><path d="M12 17h.01"/>',
  // open_in_new
  openInNew: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
}

function icon(name, cls = 'icon') {
  const path = ICONS[name]
  if (!path) return ''
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`
}

// --- Severity ----------------------------------------------------------------
// Chip colours are the mockups' own literal hexes (the Priorities mockup writes
// them inline as border-[#ba1a1a] / bg-[#ffdad6]/20 rather than as named
// tokens, because the shared palette only carries `error`). The tint is the
// blended-over-white equivalent of that /20 alpha, so it prints as a flat fill
// with no dependence on what happens to sit behind it.
const IMPACT_LABEL = { critical: 'Critical', serious: 'Serious', moderate: 'Moderate', minor: 'Minor' }
const IMPACT_STYLE = {
  critical: { fg: '#ba1a1a', bg: '#fff8f7' },
  serious: { fg: '#b25c00', bg: '#fff8f2' },
  moderate: { fg: '#8a6800', bg: '#fff9eb' },
  minor: { fg: '#767684', bg: '#fbfafb' },
}

function impactChip(impact) {
  const style = IMPACT_STYLE[impact] ?? IMPACT_STYLE.minor
  const label = IMPACT_LABEL[impact] ?? esc(impact)
  return `<span class="chip" style="color:${style.fg};border-color:${style.fg};background:${style.bg}">${label}</span>`
}

function fmtDate(iso) {
  if (!iso) return 'unknown'
  return String(iso).slice(0, 10)
}

// --- Score -------------------------------------------------------------------
// The mockup's score widget is a copy of the one already on /report/:id, down to
// the geometry (r=45, 8px stroke, rotated -90deg, dashoffset = C x (1 - score/100)).
// The WORD next to it is not the mockup's to choose: Stitch wrote "Needs
// Improvement", but this project already has an owner-chosen score->word rule
// with explicit thresholds — src/lib/scanner.ts::scoreGrade (D-107). That rule is
// mirrored here rather than imported, for the same reason costEstimate.js and
// oursDescriptions.js are mirrored: a plain-ESM Worker cannot import the .ts
// (D-010). src/lib/scanner.ts stays the single source of truth; if the
// thresholds move there, they move here.
const SCORE_CIRCUMFERENCE = 2 * Math.PI * 45

function scoreGrade(score) {
  if (score >= 90) return { label: 'Excellent', color: 'var(--primary)' }
  if (score >= 70) return { label: 'Good', color: 'var(--primary)' }
  if (score >= 50) return { label: 'Needs work', color: '#8a6800' }
  return { label: 'Poor', color: '#ba1a1a' }
}

function renderScoreWidget(score) {
  if (score == null) {
    return `<div class="score-card">
      <div class="score-meta">
        <span class="eyebrow">Automated score</span>
        <span class="muted">not available for this scan</span>
      </div>
    </div>`
  }
  const grade = scoreGrade(score)
  const offset = (SCORE_CIRCUMFERENCE * (1 - score / 100)).toFixed(1)
  return `<div class="score-card">
    <div class="score-dial">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--surface-variant)" stroke-width="8" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="${grade.color}" stroke-width="8"
          stroke-linecap="round" stroke-dasharray="${SCORE_CIRCUMFERENCE.toFixed(1)}"
          stroke-dashoffset="${offset}" />
      </svg>
      <span class="score-value">${score}</span>
    </div>
    <div class="score-meta">
      <span class="eyebrow">Automated score</span>
      <span class="score-grade"><span class="dot" style="background:${grade.color}"></span>${grade.label} &middot; ${score} / 100</span>
    </div>
  </div>`
}

const STATEMENT_STATUS_TEXT = {
  present: 'An accessibility statement was found and no missing required content was flagged.',
  missing: 'No accessibility statement was found on the scanned pages.',
  incomplete: 'An accessibility statement was found, but it is missing required content.',
  'not-required': 'Our jurisdiction data does not mark an accessibility statement as required here.',
}

// A label/value pair in the Legal card — the mockup's own sidebar pattern
// (uppercase mono label above a medium-weight value).
function legalField(label, value, dot) {
  const marker = dot ? `<span class="dot" style="background:${dot}"></span>` : ''
  return `<div class="field">
    <span class="field-label">${esc(label)}</span>
    <span class="field-value">${marker}${value}</span>
  </div>`
}

function renderLegalSection(legal) {
  if (!legal?.known) {
    return `<section class="block card">
      <div class="card-head">${icon('gavel')}<h2>Legal context</h2></div>
      <p class="muted">We could not determine a specific national transposition law for this site's
      jurisdiction from the domain alone. General EU Accessibility Act requirements may still apply if
      the site serves an EU market — this section is left blank rather than guessed.</p>
    </section>`
  }
  const lawLine = legal.lawFull ? `${esc(legal.law)} — ${esc(legal.lawFull)}` : esc(legal.law)
  const citation = legal.verified && legal.citation
    ? legalField('Citation', esc(legal.citation))
    : `<p class="muted">Legal basis indicative — not verified against primary law text for this
       country.</p>`
  // The status dot is the mockup's cue on this field, coloured by what the scan
  // actually found — not decoration: 'missing' is a critical finding in the
  // priorities table above it.
  const statementDot = { missing: '#ba1a1a', incomplete: '#b25c00' }[legal.statementStatus] ?? '#767684'
  const statementLine = legal.statementRequired
    ? `${legalField('Accessibility statement', esc(STATEMENT_STATUS_TEXT[legal.statementStatus] ?? ''), statementDot)}${
        legal.statementStatus === 'incomplete' && legal.incompleteDetail
          ? `<p class="muted">${esc(legal.incompleteDetail)}</p>`
          : ''
      }`
    : `<p class="muted">${esc(STATEMENT_STATUS_TEXT['not-required'])}</p>`

  return `<section class="block card">
    <div class="card-head">${icon('gavel')}<h2>Legal context</h2></div>
    <div class="fields">
      ${legalField('Jurisdiction', `${esc(legal.country)} — ${lawLine}`)}
      ${citation}
      ${statementLine}
    </div>
    <p class="inset">Microenterprises — fewer than 10 staff and no more than &euro;2M annual turnover or
    balance sheet — are exempt from the EAA's service requirements under Article 4(5), so a small
    business may fall outside this regime entirely. We deliberately do not quote penalty figures: they
    depend on circumstances we cannot see from a scan. This is general legal information, not legal
    advice for your specific situation.</p>
  </section>`
}

function renderCoverageSection(coverage) {
  const pages = coverage.pagesScanned ?? []
  // The mockup's coverage card has one happy-path line and no slot for skipped
  // pages. Skipped pages are the whole point of this block (D-113) — someone
  // paying for a plan must be told which pages it does NOT cover — so the list
  // stays, rendered as a warn note inside the same card.
  const skippedNote = coverage.skipped.length
    ? `<p class="warn"><strong>${coverage.skipped.length} page${coverage.skipped.length === 1 ? '' : 's'} could not be checked</strong> and ${coverage.skipped.length === 1 ? 'is' : 'are'} not covered by this plan:</p>
       <ul class="plain">${coverage.skipped
         .map((s) => `<li><span class="mono">${esc(s.page)}</span> — ${esc(s.reason)}</li>`)
         .join('')}</ul>`
    : `<p class="muted">All pages selected for this scan were successfully checked.</p>`

  return `<section class="block">
    <h2>Scan coverage</h2>
    <div class="card media">
      <div class="media-icon">${icon('findInPage')}</div>
      <div class="media-body">
        <p class="media-title">${pages.length} page${pages.length === 1 ? '' : 's'} scanned.</p>
        ${skippedNote}
      </div>
    </div>
  </section>`
}

function renderEffortSection(effort) {
  if (!effort) {
    return `<section class="block">
      <h2>Effort estimate</h2>
      <p class="muted">No engineering-relevant findings on the scanned pages — no estimate to show.</p>
    </section>`
  }
  // The mockup runs this as a narrow sidebar widget with the figure stacked over
  // the disclaimer. On A4 that column does not exist, so it becomes a full-width
  // band with the figure and the disclaimer side by side — same card, same
  // inverted primary treatment, laid out for the page it actually prints on.
  return `<section class="block effort">
    <div class="effort-figure">
      <div class="effort-head">${icon('workHistory')}<span class="eyebrow">Effort estimate</span></div>
      <p class="effort-value">${esc(effort.formatted)}</p>
    </div>
    <p class="effort-note">A rough estimate based on the number and severity of issues found on the
    scanned pages — <strong>not a quote, an offer, or legal advice</strong>. Actual cost depends on your
    codebase, team, and how the fixes are made.</p>
  </section>`
}

function renderPriorityRow(p, rank) {
  const criterion = p.wcag
    ? `<a href="${esc(p.link)}">WCAG ${esc(p.wcag)}</a> <span class="crit-title">— ${esc(p.wcagTitle)}</span>`
    : p.wcagTitle
      ? esc(p.wcagTitle)
      : '<span class="muted">not mapped to a WCAG criterion</span>'
  return `<tr>
    <td class="num rank">${rank}</td>
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
  return `<section class="block card panel">
    <h2>Priorities</h2>
    <p class="muted">Sorted by severity, then by how many pages are affected.</p>
    <table class="priorities">
      <thead><tr><th class="num">#</th><th>Severity</th><th>Rule</th><th>WCAG criterion</th><th class="num">Instances</th><th class="num">Pages</th></tr></thead>
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
    ? `<p class="brief-what">${esc(item.what)}</p>`
    : `<p class="brief-what muted">${esc(item.caveat ?? 'no automated description available')}</p>`
  const caveatLine = item.what && item.caveat ? `<p class="brief-caveat">${esc(item.caveat)}</p>` : ''
  // D-131: Deque's own maintained page for this exact rule. Attributed, not
  // passed off as ours — it is the source of the `help` sentence above it.
  const helpUrlLine = item.helpUrl
    ? `<p class="help-line">${icon('help')}<span>Fix guidance for this rule:
       <a href="${esc(item.helpUrl)}">${esc(item.helpUrl)}</a>
       <span class="muted">(Deque, maintainers of axe-core)</span></span></p>`
    : ''

  // D-131 + D-132: failureSummary is per-instance and multi-line ("Fix any of
  // the following:\n  ..."), so it gets its own full-width row under the
  // element rather than a fourth column. The Stitch dev-brief mockup has no
  // slot for it at all — its instance grid is Page / Selector / HTML and stops
  // there — so this callout treatment is ours: the note styling the design
  // system already uses elsewhere (tinted fill, primary left rule), applied to
  // a row that spans the full table width.
  // One <tbody> per instance (valid HTML — a table may have many) so the
  // stylesheet can keep an element and its failureSummary on the same printed
  // page without also gluing the whole rule together.
  const instanceRows = item.instances
    .map(
      (inst) => `<tbody class="instance"><tr>
        <td class="mono"><a href="${esc(inst.page)}">${esc(inst.page)}</a></td>
        <td><code class="selector">${esc(inst.selector)}</code></td>
        <td>${inst.html ? `<div class="html-frag">${esc(inst.html)}</div>` : '<span class="muted">—</span>'}</td>
      </tr>${
        inst.failureSummary
          ? `<tr class="summary-row"><td colspan="3" class="summary">${esc(inst.failureSummary)}</td></tr>`
          : ''
      }</tbody>`,
    )
    .join('')
  const moreLine = item.moreInstances > 0
    ? `<p class="muted">+${item.moreInstances} more instance${item.moreInstances === 1 ? '' : 's'} of the same rule, not listed individually.</p>`
    : ''

  return `<article class="brief-item">
    <div class="brief-head">
      <h3>${rank}. <span class="mono">${esc(item.ruleId)}</span></h3>
      ${impactChip(item.impact)}
    </div>
    <p class="criterion">${criterionLine}</p>
    ${whatLine}
    ${caveatLine}
    ${helpUrlLine}
    <table class="instances">
      <thead><tr><th>Page</th><th>Selector</th><th>HTML</th></tr></thead>
      ${instanceRows}
    </table>
    ${moreLine}
  </article>`
}

function renderDevBriefSection(devBrief) {
  if (devBrief.length === 0) {
    return `<section class="block"><h2>Developer brief</h2><p class="muted">No findings to brief.</p></section>`
  }
  return `<section class="block brief-block">
    <h2>Developer brief</h2>
    <p class="muted">One entry per rule — what to fix, where, and which standard it maps to. Fix
    guidance for axe-core rules is axe-core's own text (Deque), reproduced as it was recorded during
    the scan; for our own checks it describes what that check looks for. It is not a substitute for
    a manual accessibility review.</p>
    ${devBrief.map((item, i) => renderBriefEntry(item, i + 1)).join('')}
  </section>`
}

// D-131: same content as /report/:id's "Check these yourself" (D-130), in the
// document someone actually works through. Every criterion here is one that NO
// automated scan reached — including this one — so this section reports no
// pass and no fail, only what was never examined.
function renderCheckYourselfSection(rows) {
  if (!rows || rows.length === 0) return ''
  const items = rows
    .map((r) => {
      // The full URL is the link TEXT on purpose: this document gets printed,
      // and a printed "How to check it" is a dead end. Same choice as the
      // Deque link in the developer brief.
      const link = r.understandingUrl
        ? `<a class="mono break" href="${esc(r.understandingUrl)}">${esc(r.understandingUrl)}</a>`
        : '<span class="muted">no verified W3C reference link for this criterion</span>'
      return `<tr>
        <td class="mono nowrap accent">${esc(r.wcag)}</td>
        <td>${esc(r.title)}</td>
        <td class="mono nowrap accent">${esc(r.clause)}</td>
        <td>${link}</td>
      </tr>`
    })
    .join('')

  return `<section class="block check-block">
    <h2>Check these yourself</h2>
    <p>The ${rows.length} criteria below are outside what any automated scan can check — this one
    included. Whether they pass depends on judgement about your own content: whether a video's audio
    description is adequate, whether an error message really tells someone how to correct their
    input. This scan neither found nor ruled out a problem for any of them; they were simply never
    examined.</p>
    <p>Some of this you can verify yourself. Each row links to W3C's own "Understanding" page for
    that criterion, which explains what it means and how to test it. Whatever you or your team
    confirm here is work a specialist does not have to start from scratch, which can reduce how much
    you need from them for the rest. We deliberately put no figure on that — a scan gives us no way
    to measure it.</p>
    <table class="check-yourself">
      <thead><tr><th>WCAG</th><th>Criterion</th><th>EN 301 549</th><th>Reference</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
  </section>`
}

// --- Stylesheet --------------------------------------------------------------
// Hand-written equivalent of the mockups' Tailwind utility classes. Every value
// in :root is copied from the `tailwind.config` block those mockups embed — the
// colours are that config's hexes verbatim, the radii are its
// DEFAULT/lg/xl/full (0.125/0.25/0.5/0.75rem), the type scale is its
// display/headline-lg/headline-md/body-lg/body-md/label-md/label-sm with the
// line-height, letter-spacing and weight it declares for each. Spacing that the
// mockups take from Tailwind's default scale (py-4, gap-6, ...) is translated at
// Tailwind's own 4px unit.
//
// COLOPHON. Each mockup ends in a fixed app footer carrying two certification
// chips Verscala does not hold. Both are removed outright rather than restyled —
// a false certification claim in a document a customer pays for is exactly what
// D-035/D-046/D-114 forbid. The mockups' "(c) 2024 ACCESSATLAS" is gone too, on
// two counts: the public brand is Verscala (AccessAtlas is the internal name,
// HANDOFF.md), and a hardcoded year in a template is a fact that rots — the
// colophon takes its year from planData.generatedAt instead. Puppeteer's own
// footerTemplate already carries verscala.com and the page number, so the
// colophon is one closing line, not a repeated in-content footer.
//
// NOTE: the two removed chip strings are deliberately NOT written out anywhere
// inside this template literal. Everything in STYLE is emitted into the shipped
// HTML, and a "no fabricated certification" grep over the output must not be
// able to trip over our own explanation of why they are absent.
const STYLE = `
${FONT_FACE_CSS}
  :root {
    /* Stitch palette — exact hexes from the mockups' tailwind.config. */
    --primary: #4450b7;
    --primary-container: #5e6ad2;
    --primary-fixed: #dfe0ff;
    --primary-fixed-dim: #bdc2ff;
    --on-primary: #ffffff;
    --on-primary-fixed: #000965;
    --surface: #fcf8fb;
    --surface-container-lowest: #ffffff;
    --surface-container-low: #f6f2f5;
    --surface-container: #f0edf0;
    --surface-container-high: #eae7ea;
    --surface-variant: #e5e1e4;
    --on-surface: #1c1b1d;
    --on-surface-variant: #454652;
    --outline: #767684;
    --outline-variant: #c6c5d5;
    --secondary: #5c5f60;
    --error: #ba1a1a;

    /* borderRadius: DEFAULT .125rem / lg .25rem / xl .5rem / full .75rem */
    --r-sm: 2px;
    --r-lg: 4px;
    --r-xl: 8px;
    --r-full: 12px;

    /* spacing tokens: unit 4px, gutter 24px, margin 32px */
    --gutter: 24px;
    --margin: 32px;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    /* The mockups paint the sheet "surface" (#fcf8fb) and float it on a darker
       desk. On paper the sheet IS the page, and Chromium only paints a body
       background inside the content box — printing #fcf8fb here drew a visible
       tinted rectangle with white gutters around it on every page. The paper is
       "surface-container-lowest" instead (the same token the Priorities mockup
       gives its panel), so the card fills read against it exactly as designed. */
    background: var(--surface-container-lowest);
    color: var(--on-surface);
    /* fontSize.body-md — 14px / 1.5 / 0 / 400 */
    font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    font-weight: 400;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* fontFamily.label-sm / label-md — JetBrains Mono */
  .mono, code, .selector, .html-frag, td.num, .rank {
    font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }

  a { color: var(--primary); text-decoration: underline; text-underline-offset: 2px; }
  strong { font-weight: 600; }
  p { margin: 8px 0; }
  .muted { color: var(--on-surface-variant); }
  .warn { color: #b25c00; }
  .accent { color: var(--secondary); }
  .break { word-break: break-all; }
  .nowrap { white-space: nowrap; }

  /* --- type scale (exact values from the config) --- */
  h1 {
    /* fontSize.display — 48px / 1.1 / -0.02em / 600 */
    font-size: 48px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 600;
    margin: 0;
  }
  h2 {
    /* fontSize.headline-md — 24px / 1.3 / -0.01em / 500 */
    font-size: 24px; line-height: 1.3; letter-spacing: -0.01em; font-weight: 500;
    margin: 0 0 8px;
  }
  h3 {
    /* fontSize.headline-lg — 32px / 1.2 / -0.02em / 600 (per-rule title in the
       dev-brief mockup) */
    font-size: 32px; line-height: 1.2; letter-spacing: -0.02em; font-weight: 600;
    margin: 0;
  }
  .eyebrow {
    /* fontSize.label-sm — 11px / 1.2 / .05em / 500, uppercase tracking-widest (.1em) */
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 11px; line-height: 1.2; letter-spacing: 0.1em; font-weight: 500;
    text-transform: uppercase; color: var(--on-surface-variant);
  }

  /* --- print discipline ---------------------------------------------------
     Sections and per-rule cards must not be sliced across a page boundary. The
     dev-brief and check-yourself blocks are DELIBERATELY excluded: both are
     many pages long, and forcing them whole would push most of the document
     onto blank pages. Their inner units (article.brief-item, each table row)
     carry the rule instead. */
  section.block { margin: 0 0 var(--margin); break-inside: avoid-page; }
  section.brief-block, section.check-block { break-inside: auto; }
  /* article.brief-item is deliberately NOT "break-inside: avoid". A rule with 8
     instances is routinely taller than a page, and Chromium's behaviour then is
     to push the whole thing to a fresh page, discover it still does not fit, and
     break it anyway — costing half a blank page for nothing. The atomic unit is
     one instance, not one rule: each instance row and its failureSummary callout
     share a <tbody> that does not break, so a "Fix any of the following" note can
     never be orphaned from the element it describes. */
  tbody.instance { break-inside: avoid; }
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
  h2, h3, .brief-head, .card-head { break-after: avoid; }

  /* --- cards --------------------------------------------------------------
     The mockups build depth with shadow-sm / shadow-xl / backdrop-blur. None of
     those print predictably (Chromium rasterises blurs, and a soft shadow on a
     printer is a smudge or nothing at all), so the same hierarchy is carried by
     the 1px outline-variant border and the tinted surface fills the palette
     already provides. */
  .card {
    background: var(--surface-container-low);
    border: 1px solid var(--outline-variant);
    border-radius: var(--r-xl);
    padding: var(--gutter);
  }
  .card.panel { background: var(--surface-container-lowest); padding: var(--margin); }
  .card h2 { margin-top: 0; }

  .card-head {
    display: flex; align-items: center; gap: 8px;
    border-bottom: 1px solid var(--outline-variant);
    padding-bottom: 12px; margin-bottom: 16px;
  }
  .card-head h2 { margin: 0; }
  .card-head .icon { color: var(--primary); }

  .icon { width: 18px; height: 18px; flex: 0 0 auto; }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: var(--r-full); margin-right: 8px; vertical-align: middle; }

  /* --- cover --------------------------------------------------------------- */
  .cover { padding-bottom: var(--margin); border-bottom: 1px solid var(--outline-variant); margin-bottom: var(--margin); }
  .cover-eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: var(--gutter); }
  .cover-eyebrow .rule { display: inline-block; width: 32px; height: 2px; background: var(--primary); }
  .cover-top { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--margin); }
  .cover-title { flex: 1 1 auto; }
  .cover-url {
    /* fontSize.body-lg — 16px / 1.6 / 0 / 400 */
    font-size: 16px; line-height: 1.6; font-weight: 400;
    display: inline-flex; align-items: center; gap: 8px; margin-top: 16px;
  }
  .cover-url .icon { width: 14px; height: 14px; }

  .score-card {
    flex: 0 0 auto;
    display: flex; align-items: center; gap: var(--gutter);
    background: var(--surface-container-low);
    border: 1px solid var(--outline-variant);
    border-radius: var(--r-xl);
    padding: var(--gutter);
  }
  .score-dial { position: relative; width: 80px; height: 80px; }
  .score-dial svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .score-value {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 24px; line-height: 1; letter-spacing: -0.01em; font-weight: 500;
  }
  .score-meta { display: flex; flex-direction: column; gap: 6px; }
  .score-grade { font-weight: 500; white-space: nowrap; }

  .cover-meta { display: flex; gap: var(--gutter); margin-top: var(--gutter); color: var(--on-surface-variant); }
  .cover-meta span.item { display: inline-flex; align-items: center; gap: 8px; }
  .cover-meta .icon { color: var(--primary); }

  /* The bordered note treatment the mockups use for the cover disclaimer —
     reused for every "read this caveat" block in the document. */
  .note {
    background: var(--surface-container-low);
    border-left: 2px solid var(--primary);
    border-radius: 0 var(--r-lg) var(--r-lg) 0;
    padding: 16px;
    color: var(--on-surface-variant);
    margin-top: var(--gutter);
  }
  .inset {
    background: var(--surface);
    border: 1px solid var(--outline-variant);
    border-radius: var(--r-lg);
    padding: 16px;
    margin-top: 16px;
    font-size: 13px;
    color: var(--on-surface-variant);
  }

  /* --- coverage card ------------------------------------------------------- */
  .media { display: flex; align-items: flex-start; gap: 16px; }
  .media-icon {
    width: 40px; height: 40px; border-radius: var(--r-full);
    background: var(--primary-fixed); color: var(--on-primary-fixed);
    display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
  }
  .media-icon .icon { width: 20px; height: 20px; }
  .media-body { flex: 1 1 auto; min-width: 0; }
  .media-title { font-size: 24px; line-height: 1.3; letter-spacing: -0.01em; font-weight: 500; margin: 0; }
  ul.plain { margin: 8px 0 0; padding-left: 18px; color: var(--on-surface-variant); }
  ul.plain li { margin-bottom: 4px; }

  /* --- effort band --------------------------------------------------------- */
  .effort {
    display: flex; align-items: center; gap: var(--margin);
    background: var(--primary); color: var(--on-primary);
    border-radius: 16px; /* rounded-2xl, Tailwind default 1rem */
    padding: var(--margin);
  }
  .effort-figure { flex: 0 0 auto; }
  .effort-head { display: flex; align-items: center; gap: 8px; }
  .effort-head .eyebrow { color: var(--primary-fixed-dim); }
  .effort-head .icon { color: var(--primary-fixed-dim); width: 20px; height: 20px; }
  .effort-value { font-size: 48px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 600; margin: 8px 0 0; white-space: nowrap; }
  .effort-note {
    flex: 1 1 auto; margin: 0; font-size: 13px; line-height: 1.6;
    color: var(--primary-fixed);
    border-left: 1px solid rgba(255,255,255,0.2); padding-left: var(--gutter);
  }
  .effort-note strong { color: #ffffff; font-weight: 500; }

  /* --- legal fields -------------------------------------------------------- */
  .fields { display: flex; flex-direction: column; gap: 16px; }
  .field { display: flex; flex-direction: column; gap: 2px; }
  .field-label {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 11px; line-height: 1.2; letter-spacing: 0.05em; font-weight: 500;
    text-transform: uppercase; color: var(--on-surface-variant);
  }
  .field-value { font-weight: 500; }

  /* --- tables -------------------------------------------------------------- */
  table { width: 100%; border-collapse: collapse; margin-top: 16px; table-layout: fixed; }
  th {
    /* fontSize.label-sm, uppercase tracking-wider (.05em) */
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 11px; line-height: 1.2; letter-spacing: 0.05em; font-weight: 500;
    text-transform: uppercase; color: var(--on-surface-variant);
    text-align: left; padding: 10px 8px;
    border-bottom: 1px solid var(--outline-variant);
  }
  td {
    text-align: left; padding: 10px 8px; vertical-align: top;
    border-bottom: 1px solid var(--surface-variant);
    word-break: break-word;
  }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.num { font-size: 13px; letter-spacing: 0.02em; }
  .rank { color: var(--on-surface-variant); }
  .crit-title { color: var(--on-surface-variant); }
  .chip {
    display: inline-block; border: 1px solid; border-radius: var(--r-full);
    padding: 2px 8px; white-space: nowrap;
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 11px; line-height: 1.2; letter-spacing: 0.05em; font-weight: 500;
    text-transform: uppercase;
  }

  /* Priorities column widths. The mockup sets min-w-[800px] and lets the page
     scroll; a printed page cannot scroll, so the six columns are proportioned
     to the 698px A4 content column instead. */
  table.priorities td.mono { font-size: 13px; letter-spacing: 0.02em; }
  table.priorities th:nth-child(1), table.priorities td:nth-child(1) { width: 5%; }
  table.priorities th:nth-child(2), table.priorities td:nth-child(2) { width: 14%; }
  table.priorities th:nth-child(3), table.priorities td:nth-child(3) { width: 27%; }
  table.priorities th:nth-child(4), table.priorities td:nth-child(4) { width: 34%; }
  table.priorities th:nth-child(5), table.priorities td:nth-child(5) { width: 10%; }
  table.priorities th:nth-child(6), table.priorities td:nth-child(6) { width: 10%; }

  /* --- developer brief ----------------------------------------------------- */
  article.brief-item { margin: var(--margin) 0 0; padding-top: var(--gutter); border-top: 1px solid var(--outline-variant); }
  .brief-head { display: flex; align-items: baseline; gap: 16px; }
  .brief-head h3 .mono { font-weight: 600; }
  .criterion { font-size: 16px; line-height: 1.6; color: var(--on-surface-variant); margin: 8px 0 0; }
  .brief-what { margin: 16px 0 0; }
  .brief-caveat { margin: 4px 0 0; font-style: italic; color: var(--on-surface-variant); }
  .help-line { display: flex; align-items: flex-start; gap: 8px; margin-top: 16px; }
  .help-line .icon { color: var(--primary); margin-top: 3px; width: 20px; height: 20px; }
  .help-line a { word-break: break-all; }

  table.instances th:nth-child(1), table.instances td:nth-child(1) { width: 33%; }
  table.instances th:nth-child(2), table.instances td:nth-child(2) { width: 25%; }
  table.instances th:nth-child(3), table.instances td:nth-child(3) { width: 42%; }
  table.instances td:nth-child(1) a {
    font-size: 13px; letter-spacing: 0.02em; font-weight: 500; word-break: break-all;
  }
  .selector {
    display: inline-block;
    font-size: 13px; letter-spacing: 0.02em; line-height: 1.4;
    color: var(--on-surface-variant);
    background: var(--surface-container);
    border-radius: var(--r-sm);
    padding: 2px 6px;
    word-break: break-all;
  }
  .html-frag {
    background: var(--surface-container-high);
    border-radius: var(--r-lg);
    padding: 10px;
    font-size: 11px; line-height: 1.4; letter-spacing: 0.05em;
    white-space: pre-wrap; word-break: break-all;
  }

  /* D-131 + D-132: axe-core's per-instance failureSummary. Full-width row under
     its element, in the document's note treatment. pre-wrap because axe
     generates real newlines ("Fix any of the following:\\n  ...") that would
     otherwise collapse into one run-on line. */
  tr.summary-row td.summary {
    white-space: pre-wrap;
    background: var(--surface-container-low);
    border-left: 2px solid var(--primary);
    border-bottom: 1px solid var(--surface-variant);
    color: var(--on-surface-variant);
    font-size: 13px; line-height: 1.5;
    padding: 10px 12px;
  }

  /* --- check yourself ------------------------------------------------------ */
  table.check-yourself th:nth-child(1), table.check-yourself td:nth-child(1) { width: 10%; }
  table.check-yourself th:nth-child(2), table.check-yourself td:nth-child(2) { width: 32%; }
  table.check-yourself th:nth-child(3), table.check-yourself td:nth-child(3) { width: 13%; }
  table.check-yourself th:nth-child(4), table.check-yourself td:nth-child(4) { width: 45%; }
  table.check-yourself td.mono { font-size: 13px; letter-spacing: 0.02em; }
  table.check-yourself td a { font-size: 11px; letter-spacing: 0.05em; line-height: 1.4; }

  /* --- colophon (see the note above STYLE in the JS source) --- */
  .colophon {
    margin-top: var(--margin); padding-top: 16px;
    border-top: 1px solid var(--outline-variant);
    display: flex; justify-content: space-between; gap: var(--gutter);
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 11px; line-height: 1.2; letter-spacing: 0.05em; font-weight: 500;
    text-transform: uppercase; color: var(--outline);
    break-inside: avoid;
  }
`

// Full HTML document. `planData` is worker/lib/pdfPlan.js::buildPlanData()'s
// output. Kept as one string builder (not a template engine) — there is no
// runtime dependency to justify one, and the whole thing must stay debuggable
// by reading it top to bottom.
export function renderPlanHtml(planData) {
  const year = fmtDate(planData.generatedAt).slice(0, 4) || String(new Date().getUTCFullYear())
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Verscala accessibility plan — ${esc(planData.url)}</title>
<style>${STYLE}</style>
</head>
<body>
  <section class="cover">
    <div class="cover-eyebrow"><span class="rule"></span><span class="eyebrow">Executive summary</span></div>
    <div class="cover-top">
      <div class="cover-title">
        <h1>Accessibility remediation plan</h1>
        <a class="cover-url" href="${esc(planData.url)}">${esc(planData.url)}${icon('openInNew')}</a>
      </div>
      ${renderScoreWidget(planData.score)}
    </div>
    <div class="cover-meta">
      <span class="item">${icon('calendar')}Scan completed: ${fmtDate(planData.scanCompletedAt)}</span>
      <span class="item">${icon('article')}Plan generated: ${fmtDate(planData.generatedAt)}</span>
    </div>
    <p class="note">This is an automated plan based on a single automated scan. It is not a
    certification of WCAG conformance and does not constitute legal advice. A clean scan does not
    guarantee full accessibility — manual review by a qualified auditor is still required.</p>
  </section>

  ${renderCoverageSection(planData.coverage)}
  ${renderPrioritiesSection(planData.priorities)}
  ${renderEffortSection(planData.effort)}
  ${renderLegalSection(planData.legal)}
  ${renderDevBriefSection(planData.devBrief)}
  ${renderCheckYourselfSection(planData.checkYourself)}

  <div class="colophon">
    <span>Verscala — automated accessibility scan report</span>
    <span>&copy; ${esc(year)} Verscala</span>
  </div>
</body>
</html>`
}

// Puppeteer header/footer templates are separate small HTML fragments, styled
// inline (external <style> does not apply to them, and neither do the @font-face
// rules above — Chromium renders these in an isolated document, so they get the
// system sans stack and CANNOT use Geist; that is a platform limit, not a
// choice). See PDFOptions.headerTemplate in
// node_modules/@cloudflare/puppeteer/lib/types.d.ts. `.pageNumber`/`.totalPages`
// classes are filled in by Chromium itself.
//
// D-132: restyled to the new palette (outline #767684 on the mockups' letter
// spacing) — content deliberately unchanged.
const RUNNING_STYLE =
  'font-size:8px;width:100%;padding:0 48px;color:#767684;letter-spacing:0.05em;' +
  'text-transform:uppercase;font-family:-apple-system,Helvetica,Arial,sans-serif;' +
  'display:flex;justify-content:space-between;'

export function buildHeaderTemplate(siteUrl) {
  return `<div style="${RUNNING_STYLE}">
    <span>Verscala &mdash; accessibility remediation plan</span>
    <span>${esc(siteUrl)}</span>
  </div>`
}

export function buildFooterTemplate() {
  return `<div style="${RUNNING_STYLE}">
    <span>verscala.com</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`
}
