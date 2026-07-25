// Detention Navigator — Tailwind theme extension.
// Merge into the app's tailwind.config.js:  theme: { extend: require('./design/tailwind.theme.cjs') }
// These names map 1:1 to design/tokens.css. Prefer these over raw hexes.

module.exports = {
  colors: {
    navy:      { DEFAULT: '#17264A', 700: '#22345F' },
    brass:     { DEFAULT: '#B0842F', 600: '#946C22', onNavy: '#E7C77A' },
    paper:     '#F3EFE6',
    card:      '#FCFAF4',
    caution:   '#8A4B12',   // burnt amber — warnings. NEVER use red.
    sage:      '#3F6B4E',   // progress / done only
    slate:     '#5E5A4E',   // labels only, not body
    ink:       '#17264A',   // body text
    line:      { DEFAULT: '#DED6C6', strong: '#CABDA6' },
  },
  fontFamily: {
    serif: ['Spectral', 'Georgia', 'Times New Roman', 'serif'],       // headings
    sans:  ['Commissioner', 'Segoe UI', 'system-ui', 'sans-serif'],   // body / UI
    mono:  ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'], // labels, numbers
  },
  fontSize: {
    // rem-free px scale to match the reference exactly; body must stay >= 17px
    kicker:  ['12.5px', { letterSpacing: '0.13em', lineHeight: '1.2' }],
    tag:     ['11.5px', { letterSpacing: '0.10em', lineHeight: '1.2' }],
    hint:    ['15px',   { lineHeight: '1.45' }],
    body:    ['18px',   { lineHeight: '1.55' }],
    title:   ['18.5px', { lineHeight: '1.3', fontWeight: '600' }],  // component titles (sans)
    h2:      ['22px',   { lineHeight: '1.2' }],
    h1:      ['26px',   { lineHeight: '1.18' }],
    display: ['30px',   { lineHeight: '1.16' }],
  },
  borderRadius: { card: '14px', ctrl: '12px', pill: '999px' },
  boxShadow: {
    card: '0 14px 30px -22px rgba(23,38,74,.5)',
    navy: '0 20px 40px -30px rgba(23,38,74,.9)',
  },
  transitionDuration: { fast: '150ms' },
};
