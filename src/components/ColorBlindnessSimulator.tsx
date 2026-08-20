// G-CHECKERS-BATCH-1: interactive colour blindness simulator for
// /checkers/color-blindness-simulator/. Math lives in src/lib/cvd.ts (pure,
// tested separately). Here — only UI, canvas plumbing and state, same
// template as ContrastChecker.tsx / ReadabilityChecker.tsx.
//
// Accessibility discipline (a page ABOUT accessibility has to be exemplary):
//  - the file input is a real <input type="file"> with a real <label>;
//  - each canvas has role="img" + a text aria-label naming what it shows
//    (original vs. which CVD type) — colour differences are never the only
//    signal, the heading above each pane is plain text too (WCAG 1.4.1);
//  - status/errors are announced through a single aria-live="polite" region;
//  - own chrome styled ONLY with tokens (BRAND_BOOK); the pixels drawn onto
//    the canvases are the user's own image DATA, not component styling.
//
// SSG-hydration discipline (prerender has no window/canvas/FileReader):
//  - initial state is "no image loaded yet" — identical static HTML on
//    server and first client paint (empty <canvas> elements, no width/height
//    set imperatively until a user action happens);
//  - ALL canvas/FileReader/Image work happens inside event handlers (file
//    input change, "load sample" click) — never during render, never in a
//    mount effect either, since there is nothing to draw until the user acts.

import { useId, useRef, useState } from 'react'
import { type CvdType, type RGB, CVD_LABELS, CVD_TYPES, simulate } from '@/lib/cvd'
import { toRgbString } from '@/lib/contrast'

const MAX_DIM = 480 // downscale large uploads — this is a preview tool, not an image editor
const MAX_FILE_BYTES = 8 * 1024 * 1024

// Eight swatches chosen to include classic red/green and blue/yellow
// confusion pairs, so the sample is useful even without an upload.
const SAMPLE_BARS: RGB[] = [
  { r: 230, g: 25, b: 25 },
  { r: 245, g: 150, b: 20 },
  { r: 235, g: 220, b: 20 },
  { r: 35, g: 170, b: 70 },
  { r: 30, g: 120, b: 210 },
  { r: 110, g: 60, b: 200 },
  { r: 230, g: 90, b: 170 },
  { r: 120, g: 120, b: 120 },
]

type Status = 'empty' | 'loaded'

export function ColorBlindnessSimulator() {
  const [status, setStatus] = useState<Status>('empty')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fileId = useId()
  const hintId = useId()

  // Scratch canvas: holds the decoded source pixels so we can read them once
  // and reuse for all three simulations. Never shown — visually hidden, but
  // still a real element present in the DOM both server- and client-side.
  const sourceRef = useRef<HTMLCanvasElement | null>(null)
  const originalRef = useRef<HTMLCanvasElement | null>(null)
  const outputRefs = useRef<Partial<Record<CvdType, HTMLCanvasElement | null>>>({})

  function drawOriginal(width: number, height: number, imageData: ImageData) {
    const canvas = originalRef.current
    if (!canvas) return
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.putImageData(imageData, 0, 0)
  }

  function drawSimulated(width: number, height: number, sourceData: ImageData, type: CvdType) {
    const canvas = outputRefs.current[type]
    if (!canvas) return
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const out = ctx.createImageData(width, height)
    const data = sourceData.data
    for (let i = 0; i < data.length; i += 4) {
      const rgb = simulate({ r: data[i], g: data[i + 1], b: data[i + 2] }, type)
      out.data[i] = rgb.r
      out.data[i + 1] = rgb.g
      out.data[i + 2] = rgb.b
      out.data[i + 3] = data[i + 3]
    }
    ctx.putImageData(out, 0, 0)
  }

  function renderAllFrom(width: number, height: number, desc: string) {
    const source = sourceRef.current
    const sctx = source?.getContext('2d')
    if (!source || !sctx) return
    const imageData = sctx.getImageData(0, 0, width, height)
    drawOriginal(width, height, imageData)
    for (const type of CVD_TYPES) drawSimulated(width, height, imageData, type)
    setDescription(desc)
    setStatus('loaded')
    setError(null)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file next time
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('That file does not look like an image. Please choose a JPG, PNG, GIF or WebP.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('That image is larger than 8 MB — please choose a smaller file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > MAX_DIM || height > MAX_DIM) {
          const scale = MAX_DIM / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const source = sourceRef.current
        const sctx = source?.getContext('2d')
        if (!source || !sctx) return
        source.width = width
        source.height = height
        sctx.drawImage(img, 0, 0, width, height)
        renderAllFrom(width, height, `your uploaded image (${file.name})`)
      }
      img.onerror = () => setError('Could not read that image. Try a different file.')
      img.src = typeof reader.result === 'string' ? reader.result : ''
    }
    reader.onerror = () => setError('Could not read that file.')
    reader.readAsDataURL(file)
  }

  function loadSample() {
    const width = 320
    const height = 160
    const source = sourceRef.current
    const sctx = source?.getContext('2d')
    if (!source || !sctx) return
    source.width = width
    source.height = height
    const barWidth = width / SAMPLE_BARS.length
    SAMPLE_BARS.forEach((c, i) => {
      sctx.fillStyle = toRgbString(c)
      sctx.fillRect(Math.round(i * barWidth), 0, Math.ceil(barWidth), height)
    })
    renderAllFrom(width, height, 'the built-in colour test pattern (eight coloured bars)')
  }

  function clear() {
    setStatus('empty')
    setDescription('')
    setError(null)
    const canvases = [originalRef.current, ...CVD_TYPES.map((t) => outputRefs.current[t] ?? null)]
    for (const canvas of canvases) {
      if (!canvas) continue
      canvas.width = 0
      canvas.height = 0
    }
  }

  const liveMessage = error
    ? error
    : status === 'loaded'
      ? `Loaded ${description}. Showing the original plus three colour-blindness simulations.`
      : ''

  return (
    <div className="panel mt-8 space-y-6">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
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
          to a server. JPG, PNG, GIF or WebP, up to 8 MB.
        </p>
        <p role="status" aria-live="polite" className="mt-2 text-sm text-on-surface-variant">
          {liveMessage}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
          <h2 className="label text-on-surface-variant">Original</h2>
          <canvas
            ref={originalRef}
            role="img"
            aria-label={status === 'loaded' ? `Original colours of ${description}` : 'No image loaded yet'}
            className="mt-2 block h-auto max-h-64 w-full rounded-lg border border-outline-variant bg-surface object-contain"
          />
        </div>
        {CVD_TYPES.map((type) => (
          <div key={type} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
            <h2 className="label text-on-surface-variant">{CVD_LABELS[type]}</h2>
            <canvas
              ref={(el) => {
                outputRefs.current[type] = el
              }}
              role="img"
              aria-label={
                status === 'loaded'
                  ? `${description}, simulated for ${CVD_LABELS[type]}`
                  : 'No image loaded yet'
              }
              className="mt-2 block h-auto max-h-64 w-full rounded-lg border border-outline-variant bg-surface object-contain"
            />
          </div>
        ))}
      </div>

      {/* Scratch buffer — holds decoded source pixels, never rendered visibly. */}
      <canvas ref={sourceRef} aria-hidden="true" className="hidden" />
    </div>
  )
}
