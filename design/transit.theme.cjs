// Detention Navigator — "Transit" Tailwind theme extension.
// theme: { extend: require('./design/transit.theme.cjs') }
// Reuse landing/fonts.css for the actual font files (Commissioner / Spectral / IBM Plex Mono).

module.exports = {
  colors: {
    ink:   '#182231',
    paper: '#F1EEE4',
    card:  '#FBF8F0',
    brass: { DEFAULT: '#A9772A', 600: '#8A601F', onInk: '#E6C67C' },
    teal:  { DEFAULT: '#215C63', 700: '#184449' },  // the route line + progress
    sage:  '#3F6B4E',                                // "done" only
    line:  { DEFAULT: '#DCD3C2', 2: '#CBBFA6' },
  },
  fontFamily: {
    sign: ['Commissioner', 'Segoe UI', 'system-ui', 'sans-serif'], // DISPLAY (signage grotesque)
    read: ['Spectral', 'Georgia', 'serif'],                        // BODY / reading
    mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],          // labels, numbers
  },
  fontSize: {
    eyebrow: ['12.5px', { letterSpacing: '0.22em', lineHeight: '1.2' }],
    kicker:  ['12px',   { letterSpacing: '0.12em', lineHeight: '1.2' }],
    body:    ['18px',   { lineHeight: '1.6' }],   // never below 17px
    title:   ['21px',   { lineHeight: '1.2', fontWeight: '600' }],
    h2:      ['clamp(24px,4vw,34px)', { lineHeight: '1.06' }],
    display: ['clamp(40px,10vw,84px)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
  },
  borderRadius: { card: '18px', ctrl: '14px', pill: '999px' },
  boxShadow: { navy: '0 24px 50px -34px rgba(24,34,49,.9)' },
};
