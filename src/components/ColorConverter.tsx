// G-CHECKERS-BATCH-1: interactive colour converter for
// /checkers/color-converter/. NO new math here — every calculation is
// imported from src/lib/contrast.ts (parseColor/toHex/toRgbString/
// toHslString/contrastRatio/roundRatio), already tested there. This
// component is UI and state only, same template as ContrastChecker.tsx.
//
// Accessibility discipline:
//  - every input has a real <label> (fieldset/legend for the colour group,
//    same pattern as ContrastChecker's ColorControl);
//  - the live output is a single aria-live="polite" region;
//  - each format row is real text (HEX/RGB/HSL labels), never colour alone;
//  - own chrome styled ONLY with tokens; the swatch itself uses the user's
//    colour value as inline style — that is DATA, not component styling
//    (same convention as ContrastChecker's preview panel).
//
// SSG-hydration discipline: the default colour is a deterministic constant
// (our own brand primary), so the static prerender and the first client
// render compute byte-identical output — no window/navigator access at all
// in this component (CopyButton, which we reuse, only touches the clipboard
// inside its own click handler).

import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { contrastRatio, parseColor, roundRatio, toHex, toHslString, toRgbString } from '@/lib/contrast'
import { CopyButton } from '@/components/library/CopyButton'
import { paths } from '@/lib/data'

const DEFAULT_COLOR = '#4450b7'
const WHITE = { r: 255, g: 255, b: 255 }
const BLACK = { r: 0, g: 0, b: 0 }

export function ColorConverter() {
  const [input, setInput] = useState(DEFAULT_COLOR)
  const [valid, setValid] = useState(true)

  const idBase = useId()
  const swatchId = `${idBase}-swatch`
  const textId = `${idBase}-text`
  const hintId = `${idBase}-hint`

  // Держим последний ВАЛИДНЫЙ цвет для расчёта, даже пока пользователь
  // печатает промежуточный невалидный ввод (тот же приём, что в
  // ContrastChecker: строка поля и распарсенный цвет — разное состояние).
  const [lastValid, setLastValid] = useState(DEFAULT_COLOR)
  const rgb = useMemo(() => parseColor(lastValid) ?? parseColor(DEFAULT_COLOR)!, [lastValid])

  function onText(value: string) {
    setInput(value)
    const parsed = parseColor(value)
    if (parsed) {
      setValid(true)
      setLastValid(value)
    } else {
      setValid(false)
    }
  }

  function onNative(value: string) {
    setInput(value)
    setValid(true)
    setLastValid(value)
  }

  const hex = toHex(rgb)
  const rgbStr = toRgbString(rgb)
  const hslStr = toHslString(rgb)
  const ratioWhite = roundRatio(contrastRatio(rgb, WHITE))
  const ratioBlack = roundRatio(contrastRatio(rgb, BLACK))

  const summary = `${hex} — contrast ${ratioWhite.toFixed(2)}:1 against white, ${ratioBlack.toFixed(2)}:1 against black.`

  return (
    <div className="panel mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="space-y-6">
        <fieldset className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
          <legend className="label px-1 text-on-surface-variant">Colour to convert</legend>
          <div className="mt-2 flex items-center gap-3">
            <label htmlFor={swatchId} className="sr-only">
              Colour to convert — colour picker
            </label>
            <input
              id={swatchId}
              type="color"
              value={hex}
              onChange={(e) => onNative(e.target.value)}
              className="h-11 w-14 cursor-pointer rounded-lg border border-outline bg-surface p-1"
            />
            <div className="min-w-0 flex-1">
              <label htmlFor={textId} className="sr-only">
                Colour to convert — hex, RGB or HSL value
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
          </div>
          <p id={hintId} className="mt-2 text-xs text-on-surface-variant">
            {valid ? (
              'Accepts hex, rgb(), hsl() or the colour picker.'
            ) : (
              <span className="text-[color:var(--color-critical)]">
                Not a recognised colour — showing the last valid one below.
              </span>
            )}
          </p>
        </fieldset>

        {/* Все три нотации + копирование — главный результат экрана
            (диагноз E), один живой регион, SR слышит пересчёт целиком. */}
        <div className="result-hero" aria-live="polite">
          <p className="label text-on-surface-variant">All formats</p>
          <dl className="mt-3 space-y-4">
            {[
              { label: 'HEX', value: hex },
              { label: 'RGB', value: rgbStr },
              { label: 'HSL', value: hslStr },
            ].map((row) => (
              // dl content model (WCAG/axe definition-list): a <div> wrapper directly under
              // <dl> may contain ONLY dt/dd — the copy button lives INSIDE <dd> (whose own
              // content model is unrestricted flow content), not as a sibling of the div.
              <div key={row.label}>
                <dt className="text-xs text-on-surface-variant">{row.label}</dt>
                <dd className="mt-1 flex flex-wrap items-center justify-between gap-3">
                  <span className="num font-mono text-2xl text-on-surface sm:text-3xl">{row.value}</span>
                  <CopyButton text={row.value} />
                </dd>
              </div>
            ))}
          </dl>
          <p className="sr-only">{summary}</p>
        </div>

        <div className="rounded-2xl border border-outline-variant p-5">
          <p className="label text-on-surface-variant">Contrast against black &amp; white</p>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-on-surface-variant">vs. white</dt>
              <dd className="num text-2xl font-semibold text-on-surface">{ratioWhite.toFixed(2)}:1</dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface-variant">vs. black</dt>
              <dd className="num text-2xl font-semibold text-on-surface">{ratioBlack.toFixed(2)}:1</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-on-surface-variant">
            Checking this colour as text on a background of your own?{' '}
            <Link className="underline underline-offset-2" to={paths.contrastChecker()}>
              Try the full contrast checker
            </Link>
            .
          </p>
        </div>
      </div>

      <div>
        <h2 className="h2 mt-0 text-lg">Swatch</h2>
        <div
          className="mt-3 aspect-square w-full rounded-2xl border border-outline-variant"
          style={{ backgroundColor: hex }}
          role="img"
          aria-label={`Colour swatch showing ${hex}`}
        />
        <p className="mt-2 text-xs text-on-surface-variant">
          The swatch shows your colour exactly. Everything else on this page uses our own verified
          palette.
        </p>
      </div>
    </div>
  )
}
