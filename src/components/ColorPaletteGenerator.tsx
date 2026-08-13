// G-CHECKER-PALETTE: interactive colour-palette generator for
// /checkers/color-palette-generator/. All colour math is imported from
// src/lib/contrast.ts (parseColor/toHex/…) and src/lib/palette.ts
// (generatePalette/bestTextColor/…), both already unit-tested. This component
// is UI and state only — same template as ContrastChecker.tsx / ColorConverter.tsx.
//
// THE ANGLE: every swatch shows its real WCAG contrast, not just a hue. Harmony
// (the hue rotation) is aesthetic guidance; contrast is the measurable, tested
// part — that pairing is the point of this tool, not a footnote.
//
// Accessibility discipline (same as ContrastChecker.tsx):
//  - every input has a real <label>; the colour group is a <fieldset>/<legend>;
//  - the palette + verdicts live in one aria-live="polite" region;
//  - each swatch's pass/fail is TEXT ("Pass"/"Fail"), never colour alone (1.4.1);
//  - own chrome is styled ONLY with tokens (BRAND_BOOK); the swatches themselves
//    use the generated colours as inline style — that is user DATA (the subject
//    being checked), not component styling, same convention as the other checkers;
//  - all interactive controls (scheme select, copy/randomise buttons) meet the
//    ≥24px target-size guidance.
//
// SSG-hydration discipline (prerender without window):
//  - initial state is a deterministic default (base colour + scheme), so the
//    static prerendered HTML and the first client render are byte-identical;
//  - "Randomise" calls Math.random() ONLY inside its onClick handler, never
//    during render — the initial render never touches Math.random;
//  - the permalink (?base=&scheme=) is read in useEffect AFTER mount, not in
//    render — otherwise server (no query) and client (query) would diverge;
//  - the address bar is synced ONLY from user-action handlers, never from an
//    effect on [base, scheme] — an effect there would clobber an incoming
//    permalink on the very first run.

import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { type RGB, parseColor, toHex, toHslString, toRgbString } from '@/lib/contrast'
import { type SchemeName, SCHEME_DESCRIPTIONS, SCHEME_LABELS, SCHEME_NAMES, generateSwatches } from '@/lib/palette'
import { copyText } from '@/components/library/CopyButton'
import { paths } from '@/lib/data'

// Deterministic default — a mid brand-adjacent blue. Same colour + scheme on
// every first render (server and client), so the a11y prerender is stable.
const DEFAULT_COLOR = '#4450b7'
const DEFAULT_SCHEME: SchemeName = 'complementary'

const isSchemeName = (v: string | null): v is SchemeName =>
  !!v && (SCHEME_NAMES as string[]).includes(v)

export function ColorPaletteGenerator() {
  const [input, setInput] = useState(DEFAULT_COLOR)
  const [lastValid, setLastValid] = useState(DEFAULT_COLOR)
  const [valid, setValid] = useState(true)
  const [scheme, setScheme] = useState<SchemeName>(DEFAULT_SCHEME)
  const [status, setStatus] = useState('')

  const idBase = useId()
  const swatchPickerId = `${idBase}-swatch`
  const textId = `${idBase}-text`
  const hintId = `${idBase}-hint`
  const schemeId = `${idBase}-scheme`

  const base: RGB = useMemo(() => parseColor(lastValid) ?? parseColor(DEFAULT_COLOR)!, [lastValid])
  const swatches = useMemo(() => generateSwatches(base, scheme), [base, scheme])

  function syncUrl(nextBase: RGB, nextScheme: SchemeName) {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    params.set('base', toHex(nextBase).replace('#', ''))
    params.set('scheme', nextScheme)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }

  function onText(value: string) {
    setInput(value)
    const parsed = parseColor(value)
    if (parsed) {
      setValid(true)
      setLastValid(value)
      syncUrl(parsed, scheme)
    } else {
      setValid(false)
    }
  }

  function onNative(value: string) {
    setInput(value)
    setValid(true)
    setLastValid(value)
    const parsed = parseColor(value)
    if (parsed) syncUrl(parsed, scheme)
  }

  function onScheme(value: string) {
    if (!isSchemeName(value)) return
    setScheme(value)
    syncUrl(base, value)
  }

  // Random ONLY here, inside a click handler — never during render.
  function randomise() {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    const rgb: RGB = { r, g, b }
    const hex = toHex(rgb)
    setInput(hex)
    setValid(true)
    setLastValid(hex)
    syncUrl(rgb, scheme)
  }

  async function copyHexList() {
    const list = swatches.map((s) => toHex(s.rgb)).join('\n')
    const ok = await copyText(list)
    setStatus(ok ? 'Palette hex values copied to clipboard.' : 'Could not copy — select and copy manually.')
  }

  async function copyCssVars() {
    const css = swatches
      .map((s, i) => `  --palette-${i === 0 ? 'base' : i}: ${toHex(s.rgb)};`)
      .join('\n')
    const ok = await copyText(`:root {\n${css}\n}`)
    setStatus(ok ? 'Palette copied as CSS custom properties.' : 'Could not copy — select and copy manually.')
  }

  // Permalink: read query AFTER mount, never during render.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const baseP = params.get('base')
    const schemeP = params.get('scheme')
    const parsed = baseP ? parseColor(baseP) : null
    if (parsed) {
      const hex = toHex(parsed)
      setInput(hex)
      setLastValid(hex)
    }
    if (isSchemeName(schemeP)) setScheme(schemeP)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const baseHex = toHex(base)

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <fieldset className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
          <legend className="label px-1 text-on-surface-variant">Base colour</legend>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label htmlFor={swatchPickerId} className="sr-only">
              Base colour — colour picker
            </label>
            <input
              id={swatchPickerId}
              type="color"
              value={baseHex}
              onChange={(e) => onNative(e.target.value)}
              className="h-11 w-14 cursor-pointer rounded-lg border border-outline bg-surface p-1"
            />
            <div className="min-w-0 flex-1">
              <label htmlFor={textId} className="sr-only">
                Base colour — hex, RGB or HSL value
              </label>
              <input
                id={textId}
                type="text"
                value={input}
                onChange={(e) => onText(e.target.value)}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                aria-invalid={!valid}
                aria-describedby={hintId}
                className="input w-full font-mono"
                placeholder="#4450b7, rgb(68,80,183), hsl(233,46%,49%)"
              />
            </div>
            <div>
              <label htmlFor={schemeId} className="sr-only">
                Colour scheme
              </label>
              <select
                id={schemeId}
                value={scheme}
                onChange={(e) => onScheme(e.target.value)}
                className="input font-medium"
              >
                {SCHEME_NAMES.map((s) => (
                  <option key={s} value={s}>
                    {SCHEME_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn-ghost" onClick={randomise}>
              <span aria-hidden="true">🎲</span> Randomise
            </button>
          </div>
          <p id={hintId} className="mt-2 text-xs text-on-surface-variant">
            {valid ? (
              SCHEME_DESCRIPTIONS[scheme]
            ) : (
              <span className="text-[color:var(--color-critical)]">
                Not a recognised colour — showing the last valid one below.
              </span>
            )}
          </p>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-ghost" onClick={copyHexList}>
          <span aria-hidden="true">⧉</span> Copy palette (hex)
        </button>
        <button type="button" className="btn-ghost" onClick={copyCssVars}>
          <span aria-hidden="true">{'{ }'}</span> Copy as CSS variables
        </button>
        <span role="status" aria-live="polite" className="text-sm text-on-surface-variant">
          {status}
        </span>
      </div>

      {/* Палитра + вердикты — один живой регион, SR слышит пересчёт целиком. */}
      <div aria-live="polite">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {swatches.map((s, i) => {
            const hex = toHex(s.rgb)
            return (
              <li key={`${hex}-${i}`} className="overflow-hidden rounded-2xl border border-outline-variant">
                <div
                  className="flex aspect-[4/3] w-full flex-col justify-end p-4"
                  style={{ backgroundColor: hex, color: s.text.name === 'white' ? '#ffffff' : '#000000' }}
                  role="img"
                  aria-label={`Swatch ${i === 0 ? '(base colour)' : `${i + 1} of ${swatches.length}`}: ${hex}`}
                >
                  <p className="font-mono text-sm font-semibold">{hex}</p>
                  <p className="mt-1 text-xs">
                    {s.text.name} text · {s.text.ratio.toFixed(2)}:1
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 bg-surface-container-low p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-on-surface-variant">
                      {toRgbString(s.rgb)}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">{toHslString(s.rgb)}</p>
                  </div>
                  <span
                    className={
                      s.text.passesAA
                        ? 'chip chip-success shrink-0'
                        : 'chip shrink-0 text-[color:var(--color-critical)]'
                    }
                  >
                    {s.text.passesAA ? 'AA text: Pass' : 'AA text: Fail'}
                  </span>
                </div>
                {i === 0 && (
                  <p className="border-t border-outline-variant bg-surface-container-low px-3 pb-2 text-[11px] text-on-surface-variant">
                    Base colour
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <p className="text-sm text-on-surface-variant">
        Each swatch shows the more readable of black or white text on it, with the exact WCAG
        contrast ratio and an AA pass/fail — that is what makes a palette{' '}
        <strong className="text-on-surface">accessible</strong>, not just harmonious. For contrast
        between two colours of your choosing (e.g. text on a background from this palette), use the{' '}
        <Link className="underline underline-offset-2" to={paths.contrastChecker()}>
          contrast checker
        </Link>
        .
      </p>
    </div>
  )
}
