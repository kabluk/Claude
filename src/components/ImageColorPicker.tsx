// G-CHECKER-IMAGEPICKER: interactive image colour picker for
// /checkers/image-color-picker/, tenth tool in the /checkers/ family. Canvas
// geometry + palette maths are imported from src/lib/colorPicker.ts (pure,
// tested separately); contrast/format maths reused from src/lib/contrast.ts.
// This component is UI, canvas plumbing and state only — same template as
// ColorBlindnessSimulator.tsx (image loading) and ContrastChecker.tsx / result-hero.
//
// THE ANGLE (D-186): this is NOT a generic colour-from-image tool. The picked
// colour immediately shows its WCAG contrast against white and black, with an
// AA/AAA verdict and a link into the full contrast checker — a colour picker
// that happens to bridge into the accessibility funnel, not a bolt-on.
//
// Accessibility discipline — a mouse-only picker is not acceptable from an
// accessibility company (see the page-level comment for the full rationale):
//  - the canvas is a real focusable element (tabIndex=0) with a visible focus
//    ring (never suppressed); arrow keys move the crosshair 1px, Shift+arrow
//    10px, Enter/Space picks the colour under it — all via pure functions in
//    colorPicker.ts, unit-tested independently of any DOM;
//  - TWO separate aria-live="polite" regions announce colour as TEXT, never
//    only via a coloured square (WCAG 1.4.1): one for the colour currently
//    under the crosshair (updates as it moves), one for the picked/selected
//    colour plus its AA/AAA verdict (updates only on an explicit pick, inside
//    the same region as the numeric result so the two never get out of sync);
//  - the extracted palette is a list of real <button>s labelled with their
//    hex text, not bare colour tiles — clickable and keyboard-reachable like
//    any other control, not a mouse-only shortcut;
//  - own chrome styled ONLY with tokens (BRAND_BOOK); the picked colour itself
//    (swatch backgrounds) is the user's own image DATA, not component styling.
//
// SSG-hydration discipline (prerender has no window/canvas/FileReader):
//  - initial state is "no image loaded yet" — identical static HTML on server
//    and first client paint (no canvas draws, no getImageData) — same pattern
//    as ColorBlindnessSimulator.tsx;
//  - ALL canvas/FileReader/Image work happens inside event handlers (file
//    input change, "load sample" click, canvas click/keydown) — never during
//    render, never in a mount effect either.
//
// Performance: uploads are downscaled to MAX_DIM before ANY getImageData call
// (scaledSize in colorPicker.ts) — reading pixels off a 6000px original would
// be slow and is unnecessary for a picker whose canvas never renders that big.

import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  type RGB,
  type Level,
  contrastRatio,
  passes,
  roundRatio,
  toHex,
  toHslString,
  toRgbString,
} from '@/lib/contrast'
import { scaledSize, clampPoint, moveCrosshair, mapClientToCanvas, extractPalette } from '@/lib/colorPicker'
import { CopyButton } from '@/components/library/CopyButton'
import { paths } from '@/lib/data'

const MAX_DIM = 640 // downscale large uploads before any getImageData read — see header
const MAX_FILE_BYTES = 8 * 1024 * 1024
const PALETTE_SIZE = 8
const WHITE: RGB = { r: 255, g: 255, b: 255 }
const BLACK: RGB = { r: 0, g: 0, b: 0 }
const LEVELS: Level[] = ['AA', 'AAA']

type Status = 'empty' | 'loaded'
type Point = { x: number; y: number }

function hexNoHash(rgb: RGB) {
  return toHex(rgb).replace('#', '')
}

// One built-in sample so the tool works with zero uploads (same idea as
// ColorBlindnessSimulator's SAMPLE_BARS) — a small gradient plus solid bands,
// varied enough that the crosshair and the extracted palette both have
// something interesting to show on first use.
const SAMPLE_WIDTH = 320
const SAMPLE_HEIGHT = 200
function drawSample(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, SAMPLE_WIDTH, 0)
  grad.addColorStop(0, '#4450b7')
  grad.addColorStop(0.5, '#e7b34a')
  grad.addColorStop(1, '#1f6d42')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT * 0.6)
  const bands: [string, number][] = [
    ['#ba1a1a', 0],
    ['#ffffff', SAMPLE_WIDTH * 0.25],
    ['#1a1a2e', SAMPLE_WIDTH * 0.5],
    ['#8fd6ab', SAMPLE_WIDTH * 0.75],
  ]
  const bandHeight = SAMPLE_HEIGHT * 0.4
  const bandWidth = SAMPLE_WIDTH / bands.length
  bands.forEach(([color], i) => {
    ctx.fillStyle = color
    ctx.fillRect(i * bandWidth, SAMPLE_HEIGHT * 0.6, bandWidth, bandHeight)
  })
}

function Verdict({ ratio, level }: { ratio: number; level: Level }) {
  const result = passes(ratio, 'normal', level)
  return (
    <span
      className={
        result
          ? 'inline-flex items-center gap-1 font-medium text-[color:var(--color-success)]'
          : 'inline-flex items-center gap-1 font-medium text-[color:var(--color-critical)]'
      }
    >
      <span aria-hidden="true">{result ? '✓' : '✕'}</span>
      {result ? 'Pass' : 'Fail'}
    </span>
  )
}

export function ImageColorPicker() {
  // `loaded` gates which elements are in the DOM (including the display
  // canvas). `pendingImage` holds a decoded-but-not-yet-drawn image: it is
  // set the instant we know we have something to show (flips `loaded` to
  // true in the SAME render), and the actual canvas draw happens in an
  // effect that runs AFTER that render commits — by which point React has
  // already mounted the display canvas and attached `displayRef`. Drawing
  // straight from the file/sample handler would read a still-null
  // `displayRef` on first use, since the canvas does not exist until
  // `loaded` becomes true; that ordering bug is exactly what this two-step
  // handoff avoids.
  const [loaded, setLoaded] = useState(false)
  const [pendingImage, setPendingImage] = useState<{ img: HTMLImageElement; desc: string } | null>(null)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dims, setDims] = useState({ width: 0, height: 0 })
  const [crosshair, setCrosshair] = useState<Point>({ x: 0, y: 0 })
  const [hoverColor, setHoverColor] = useState<RGB | null>(null)
  const [pickedColor, setPickedColor] = useState<RGB | null>(null)
  const [palette, setPalette] = useState<RGB[]>([])
  const status: Status = loaded ? 'loaded' : 'empty'

  const fileId = useId()
  const hintId = useId()
  const canvasDescId = useId()

  // sourceRef: holds the decoded, downscaled pixels — the ONLY thing
  // getImageData ever reads from, so drawing the crosshair overlay on the
  // visible canvas can never corrupt a colour read. displayRef: what the user
  // sees (image + crosshair marker), redrawn on every position change.
  const sourceRef = useRef<HTMLCanvasElement | null>(null)
  const displayRef = useRef<HTMLCanvasElement | null>(null)

  function colorAt(x: number, y: number): RGB | null {
    const source = sourceRef.current
    const ctx = source?.getContext('2d')
    if (!source || !ctx) return null
    const { data } = ctx.getImageData(x, y, 1, 1)
    return { r: data[0], g: data[1], b: data[2] }
  }

  function redraw(pos: Point) {
    const source = sourceRef.current
    const display = displayRef.current
    const dctx = display?.getContext('2d')
    if (!source || !display || !dctx) return
    dctx.clearRect(0, 0, display.width, display.height)
    dctx.drawImage(source, 0, 0)
    // Crosshair: black outline + white centre so it reads on any background
    // colour underneath it — colour of the marker itself carries no meaning
    // (the hex text nearby does).
    const size = 9
    dctx.lineWidth = 3
    dctx.strokeStyle = 'rgba(0,0,0,0.85)'
    dctx.beginPath()
    dctx.moveTo(pos.x - size, pos.y)
    dctx.lineTo(pos.x + size, pos.y)
    dctx.moveTo(pos.x, pos.y - size)
    dctx.lineTo(pos.x, pos.y + size)
    dctx.stroke()
    dctx.lineWidth = 1.25
    dctx.strokeStyle = 'rgba(255,255,255,0.95)'
    dctx.beginPath()
    dctx.moveTo(pos.x - size, pos.y)
    dctx.lineTo(pos.x + size, pos.y)
    dctx.moveTo(pos.x, pos.y - size)
    dctx.lineTo(pos.x, pos.y + size)
    dctx.stroke()
  }

  function moveTo(pos: Point) {
    setCrosshair(pos)
    redraw(pos)
    setHoverColor(colorAt(pos.x, pos.y))
  }

  function pick(pos: Point) {
    moveTo(pos)
    const color = colorAt(pos.x, pos.y)
    if (color) setPickedColor(color)
  }

  // Runs AFTER `loaded` has flipped true and the display canvas has mounted
  // (see the state comment above) — the one place that actually decodes
  // pixels and draws both canvases.
  useEffect(() => {
    if (!pendingImage) return
    const { img, desc } = pendingImage
    const { width, height } = scaledSize(img.naturalWidth || img.width, img.naturalHeight || img.height, MAX_DIM)
    const source = sourceRef.current
    const display = displayRef.current
    const sctx = source?.getContext('2d')
    if (!source || !display || !sctx) return
    source.width = width
    source.height = height
    display.width = width
    display.height = height
    sctx.drawImage(img, 0, 0, width, height)
    const { data } = sctx.getImageData(0, 0, width, height)
    setPalette(extractPalette(data, PALETTE_SIZE))
    setDims({ width, height })
    setDescription(desc)
    const center = clampPoint(Math.floor(width / 2), Math.floor(height / 2), width, height)
    // Pick a sensible default straight away — the result is the point of the
    // tool, and a fresh image with nothing picked yet would leave the hero
    // result empty until the user acts. The centre pixel is a reasonable,
    // deterministic first answer; every value below is real image data.
    setCrosshair(center)
    redraw(center)
    const color = colorAt(center.x, center.y)
    setHoverColor(color)
    setPickedColor(color)
    setPendingImage(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingImage])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('That file does not look like an image. Please choose a JPG, PNG, GIF or WebP.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('That image is larger than 8 MB — please choose a smaller file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        setError(null)
        setLoaded(true)
        setPendingImage({ img, desc: `your uploaded image (${file.name})` })
      }
      img.onerror = () => setError('Could not read that image. Try a different file.')
      img.src = typeof reader.result === 'string' ? reader.result : ''
    }
    reader.onerror = () => setError('Could not read that file.')
    reader.readAsDataURL(file)
  }

  function loadSample() {
    // The sample is drawn into a throwaway canvas (not sourceRef — that one
    // is reserved for the real pixel buffer the effect above fills in) and
    // round-tripped through a real <img>, so the same scaling/draw path
    // handles uploads and the sample identically.
    const scratch = document.createElement('canvas')
    scratch.width = SAMPLE_WIDTH
    scratch.height = SAMPLE_HEIGHT
    const sctx = scratch.getContext('2d')
    if (!sctx) return
    drawSample(sctx)
    const img = new Image()
    img.onload = () => {
      setError(null)
      setLoaded(true)
      setPendingImage({ img, desc: 'the built-in colour sample (gradient and colour bands)' })
    }
    img.src = scratch.toDataURL()
  }

  function clear() {
    setLoaded(false)
    setPendingImage(null)
    setDescription('')
    setError(null)
    setPickedColor(null)
    setHoverColor(null)
    setPalette([])
    setDims({ width: 0, height: 0 })
    for (const canvas of [sourceRef.current, displayRef.current]) {
      if (!canvas) continue
      canvas.width = 0
      canvas.height = 0
    }
  }

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = displayRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pos = mapClientToCanvas(e.clientX, e.clientY, rect, canvas.width, canvas.height)
    pick(pos)
  }

  function onCanvasKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(crosshair)
      return
    }
    const next = moveCrosshair(crosshair, e.key, e.shiftKey, dims.width, dims.height)
    if (!next) return
    e.preventDefault()
    moveTo(next)
  }

  const liveMessage = error
    ? error
    : status === 'loaded'
      ? `Loaded ${description}. Click the image, or focus it and use the arrow keys, then press Enter or Space to pick a colour.`
      : ''

  const hoverHex = hoverColor ? toHex(hoverColor) : null
  const pickedHex = pickedColor ? toHex(pickedColor) : null
  const ratioWhite = pickedColor ? roundRatio(contrastRatio(pickedColor, WHITE)) : null
  const ratioBlack = pickedColor ? roundRatio(contrastRatio(pickedColor, BLACK)) : null

  const resultSummary =
    pickedColor && pickedHex && ratioWhite !== null && ratioBlack !== null
      ? `Picked colour ${pickedHex}. Contrast ${ratioWhite.toFixed(2)} to 1 against white, ${ratioBlack.toFixed(2)} to 1 against black. ${
          passes(ratioWhite, 'normal', 'AA') ? 'Passes' : 'Fails'
        } AA normal text against white; ${
          passes(ratioBlack, 'normal', 'AA') ? 'passes' : 'fails'
        } AA normal text against black.`
      : ''

  return (
    <div className="panel mt-8 space-y-6">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        <label htmlFor={fileId} className="label text-on-surface-variant">
          Upload an image
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            id={fileId}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            aria-describedby={hintId}
            className="input w-full max-w-sm sm:w-auto"
          />
          <button type="button" className="btn-ghost" onClick={loadSample}>
            <span aria-hidden="true">▦</span> Load a sample instead
          </button>
          {status === 'loaded' && (
            <button type="button" className="btn-ghost" onClick={clear}>
              <span aria-hidden="true">✕</span> Clear
            </button>
          )}
        </div>
        <p id={hintId} className="mt-2 text-xs text-on-surface-variant">
          Everything happens in your browser, via the canvas element — your image is never uploaded
          to a server. JPG, PNG, GIF or WebP, up to 8 MB.
        </p>
        <p role="status" aria-live="polite" className="mt-2 text-sm text-on-surface-variant">
          {liveMessage}
        </p>
      </div>

      {status === 'loaded' && (
        <>
          {/* Результат: главный ответ экрана (диагноз E) — hex/rgb/hsl +
              контраст с белым/чёрным + вердикт AA/AAA + мост в contrast
              checker с подставленным цветом (тот же формат ?fg=&bg=, что
              читает ContrastChecker.tsx — переиспользован, не изобретён).
              ПОРЯДОК НАМЕРЕННЫЙ: сразу после блока загрузки, ПЕРЕД канвой и
              палитрой — измерено Playwright'ом на 390×844 (см. HANDOFF.md):
              с канвой и палитрой выше результат уходил на ~1318px, глубоко
              под сгиб. Загрузка автоматически выбирает центральный пиксель
              (см. эффект выше), поэтому результат уже заполнен реальными
              данными к моменту первого рендера этого блока — не placeholder. */}
          <div className="result-hero" aria-live="polite">
            {pickedColor && pickedHex && ratioWhite !== null && ratioBlack !== null ? (
              <>
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="h-16 w-16 shrink-0 rounded-xl border border-outline-variant"
                    style={{ backgroundColor: pickedHex }}
                  />
                  <div>
                    <p className="label text-on-surface-variant">Picked colour</p>
                    <p className="num mt-1 font-mono text-3xl font-semibold text-on-surface sm:text-4xl">
                      {pickedHex}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'HEX', value: pickedHex },
                    { label: 'RGB', value: toRgbString(pickedColor) },
                    { label: 'HSL', value: toHslString(pickedColor) },
                  ].map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs text-on-surface-variant">{row.label}</dt>
                      <dd className="mt-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-sm text-on-surface">{row.value}</span>
                        <CopyButton text={row.value} />
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    { name: 'white' as const, ratio: ratioWhite },
                    { name: 'black' as const, ratio: ratioBlack },
                  ].map((row) => (
                    <div key={row.name} className="rounded-xl border border-outline-variant p-3">
                      <p className="text-xs text-on-surface-variant">Contrast vs. {row.name}</p>
                      <p className="num mt-1 text-xl font-semibold text-on-surface">{row.ratio.toFixed(2)}:1</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                        {LEVELS.map((lvl) => (
                          <span key={lvl} className="inline-flex items-center gap-1">
                            {lvl} normal text: <Verdict ratio={row.ratio} level={lvl} />
                          </span>
                        ))}
                      </div>
                      <Link
                        className="mt-2 inline-block text-xs underline underline-offset-2"
                        to={`${paths.contrastChecker()}?fg=${hexNoHash(pickedColor)}&bg=${hexNoHash(
                          row.name === 'white' ? WHITE : BLACK,
                        )}`}
                      >
                        Check this pair in the contrast checker →
                      </Link>
                    </div>
                  ))}
                </div>

                <p className="sr-only">{resultSummary}</p>
              </>
            ) : (
              <p className="text-on-surface-variant">
                Click the image, or focus it and press an arrow key then Enter, to pick a colour.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
            <h2 className="label text-on-surface-variant" id={canvasDescId}>
              Click the image, or use the arrow keys then Enter/Space
            </h2>
            <canvas
              ref={displayRef}
              tabIndex={0}
              onClick={onCanvasClick}
              onKeyDown={onCanvasKeyDown}
              aria-describedby={`${canvasDescId} ${hintId}`}
              aria-label={`${description}. Use arrow keys to move the crosshair one pixel at a time, Shift plus arrow keys for ten pixels, and Enter or Space to pick the colour underneath it.`}
              className="mt-2 block h-auto max-h-40 w-full cursor-crosshair rounded-lg border border-outline-variant bg-surface object-contain sm:max-h-64"
            />
            {/* «Текущий» цвет под перекрестием — озвучивается отдельно от
                выбранного, ТЕКСТОМ (hex), не только цветным квадратом. */}
            <p role="status" aria-live="polite" className="mt-2 flex items-center gap-2 text-sm text-on-surface-variant">
              {hoverHex ? (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block h-4 w-4 shrink-0 rounded border border-outline-variant"
                    style={{ backgroundColor: hoverHex }}
                  />
                  Under the crosshair: <span className="font-mono text-on-surface">{hoverHex}</span>
                </>
              ) : (
                'Move the crosshair to preview a colour.'
              )}
            </p>
          </div>

          {/* Извлечённая палитра — кнопки С ТЕКСТОВОЙ подписью (hex), не голые
              плашки; клавиатурно доступны как любая другая кнопка. */}
          {palette.length > 0 && (
            <div>
              <h2 className="label text-on-surface-variant">Dominant colours in this image</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {palette.map((rgb, i) => {
                  const hex = toHex(rgb)
                  return (
                    <li key={`${hex}-${i}`}>
                      <button
                        type="button"
                        onClick={() => setPickedColor(rgb)}
                        className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface py-1.5 pl-1.5 pr-3 text-xs font-medium text-on-surface hover:border-outline"
                      >
                        <span
                          aria-hidden="true"
                          className="h-6 w-6 shrink-0 rounded border border-outline-variant"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="font-mono">{hex}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Скрытая канва-исходник — хранит декодированные пиксели изображения,
          никогда не отображается, но реально есть в DOM и на сервере, и на
          клиенте (дисциплина гидрации из шапки файла). */}
      <canvas ref={sourceRef} aria-hidden="true" className="hidden" />
    </div>
  )
}
