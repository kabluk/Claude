// Worker-side mirror of the `does`/`caveat` text in src/lib/wcag.ts::OURS_DESCRIPTIONS
// (frontend, TypeScript — not reliably importable from worker/, see
// worker/lib/costEstimate.js header for why). Same duplication risk, smaller
// blast radius (prose text, not a pricing formula), same discipline anyway:
// gated by src/lib/wcag.workerMirror.test.mjs, which reads this file directly
// and deep-compares it against the real OURS_DESCRIPTIONS export.
//
// This is prose ABOUT what our own (non-axe) checks do — not an explanation of
// why it matters to the visitor. The PDF plan must not invent prose for rules
// that don't have it here (see worker/lib/pdfPlan.js).
export const OURS_DESCRIPTIONS = {
  'a11y-video-no-captions': {
    does: 'flags <video> elements that have no captions or subtitles track',
  },
  'a11y-autoplay-media': {
    does: 'flags audio or video that starts playing automatically without a mute or pause control',
  },
  'a11y-resize-200': {
    does: 'applies 200% zoom in a real browser and flags content that overflows horizontally',
    caveat: 'zoom is applied via CSS, an approximation of browser zoom — an honest limitation, not an exact simulation',
  },
  'a11y-reflow-320': {
    does: 'loads the page in a real 320 px-wide viewport and flags horizontal scrolling',
    caveat: 'the WCAG exception for data tables and maps is not detected — a flagged table may be legitimate',
  },
  'a11y-keyboard-trap': {
    does: 'walks the page with the Tab key in a real browser and flags focus that cannot move past an element',
  },
  'a11y-focus-order': {
    does: 'flags a tab order that repeatedly jumps backwards through the document, naming positive tabindex values when they are the cause',
    caveat: 'a modal or custom widget may reorder focus legitimately — single jumps are ignored for that reason',
  },
  'a11y-focus-invisible': {
    does: 'flags a focused element that shows no visible outline or box-shadow',
    caveat: 'heuristic — custom focus styles built from other CSS properties can trigger a false positive',
  },
  'a11y-empty-heading': {
    does: 'flags headings that contain no text and no accessible name',
  },
  'a11y-multiple-ways': {
    does: 'checks the scanned set of pages for at least two ways to find content — search, a sitemap link, or a navigation menu',
  },
  'a11y-inconsistent-navigation': {
    does: 'compares the relative order of shared navigation items across the scanned pages',
  },
  'a11y-inconsistent-identification': {
    does: 'flags the same navigation destination labelled with conflicting names on different pages',
  },
}
