// Compact inline SVG flags — render crisply everywhere (unlike emoji flags,
// which fall back to letters on many platforms).
const STAR =
  'M0,-6 L1.41,-1.94 5.71,-1.85 2.28,0.74 3.53,4.85 0,2.4 -3.53,4.85 -2.28,0.74 -5.71,-1.85 -1.41,-1.94 Z'

const FLAGS = {
  en: (
    <>
      <rect width="20" height="14" fill="#B22234" />
      <g fill="#fff">
        <rect y="1.08" width="20" height="1.08" />
        <rect y="3.23" width="20" height="1.08" />
        <rect y="5.38" width="20" height="1.08" />
        <rect y="7.54" width="20" height="1.08" />
        <rect y="9.69" width="20" height="1.08" />
        <rect y="11.85" width="20" height="1.08" />
      </g>
      <rect width="9" height="7.54" fill="#3C3B6E" />
      <g fill="#fff">
        <circle cx="2" cy="1.6" r="0.5" />
        <circle cx="4.5" cy="1.6" r="0.5" />
        <circle cx="7" cy="1.6" r="0.5" />
        <circle cx="3.25" cy="3.4" r="0.5" />
        <circle cx="5.75" cy="3.4" r="0.5" />
        <circle cx="2" cy="5.2" r="0.5" />
        <circle cx="4.5" cy="5.2" r="0.5" />
        <circle cx="7" cy="5.2" r="0.5" />
      </g>
    </>
  ),
  es: (
    <>
      <rect width="20" height="14" fill="#AA151B" />
      <rect y="3.5" width="20" height="7" fill="#F1BF00" />
    </>
  ),
  ru: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect y="4.67" width="20" height="4.67" fill="#0039A6" />
      <rect y="9.33" width="20" height="4.67" fill="#D52B1E" />
    </>
  ),
  zh: (
    <>
      <rect width="20" height="14" fill="#DE2910" />
      <path transform="translate(5,5) scale(0.5)" d={STAR} fill="#FFDE00" />
      <path transform="translate(10,2.4) scale(0.18)" d={STAR} fill="#FFDE00" />
      <path transform="translate(11.6,4.6) scale(0.18)" d={STAR} fill="#FFDE00" />
      <path transform="translate(11.6,7.2) scale(0.18)" d={STAR} fill="#FFDE00" />
      <path transform="translate(10,9.2) scale(0.18)" d={STAR} fill="#FFDE00" />
    </>
  ),
  vi: (
    <>
      <rect width="20" height="14" fill="#DA251D" />
      <path transform="translate(10,7) scale(0.7)" d={STAR} fill="#FFFF00" />
    </>
  ),
}

export default function Flag({ code, className }) {
  // Unknown code → neutral placeholder showing the locale code, so ADDING a new
  // locale needs only a translations.js bundle (zero edits here). Drop in a real
  // SVG above later if desired.
  const fallback = (
    <>
      <rect width="20" height="14" fill="#e6e6e6" />
      <text x="10" y="10" textAnchor="middle" fontSize="7" fill="#555" fontFamily="sans-serif">
        {String(code || '').toUpperCase().slice(0, 2)}
      </text>
    </>
  )
  return (
    <svg
      className={className}
      viewBox="0 0 20 14"
      width="22"
      height="15"
      role="img"
      aria-hidden="true"
    >
      {FLAGS[code] || fallback}
    </svg>
  )
}
