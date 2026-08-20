// G-TOOL-CONTRAST (D-144): интерактивный чекер контраста для /tools/contrast-checker/.
// Вся математика — в src/lib/contrast.ts (чистая, оттестирована отдельно). Здесь —
// только UI и состояние.
//
// Дисциплина доступности (страница ПРО доступность обязана быть образцовой):
//  - каждый ввод связан с <label>; группы цветов — <fieldset>/<legend>;
//  - вердикт озвучивается через aria-live="polite" (SR слышит пересчёт);
//  - матрица — настоящая <table> со scope; Pass/Fail несёт ТЕКСТ + иконку, не
//    только цвет (WCAG 1.4.1); символы иконок aria-hidden, слово — реальный текст;
//  - собственный chrome стилизован ТОЛЬКО токенами (BRAND_BOOK). Инлайновые
//    hex-цвета есть лишь у двух образцов и превью — это пользовательские ДАННЫЕ
//    (сам предмет проверки), а не стилизация компонента.
//
// Дисциплина SSG-гидрации (пререндер без window):
//  - начальное состояние — детерминированные дефолты (проходят AA), поэтому
//    статический HTML, который аудитирует axe, чист;
//  - permalink (?fg=&bg=) читается в useEffect ПОСЛЕ монтирования, не в рендере —
//    иначе сервер (без query) и клиент (с query) разошлись бы (hydration mismatch);
//  - кнопка пипетки появляется только после проверки window.EyeDropper в эффекте —
//    начальный клиентский рендер совпадает с серверным (кнопки нет), показ позже
//    это пост-гидрационное обновление, не рассинхрон;
//  - адресная строка синхронизируется ТОЛЬКО в обработчиках действий пользователя,
//    не эффектом на [fg,bg] — иначе первый же эффект затёр бы входящий permalink.

import { useEffect, useRef, useState } from 'react'
import {
  type RGB,
  type Level,
  type TextKind,
  contrastRatio,
  roundRatio,
  passes,
  parseColor,
  toHex,
  toRgbString,
  toHslString,
} from '@/lib/contrast'

// EyeDropper API ещё не в стандартных DOM-типах TS — минимальная локальная декларация.
type EyeDropperResult = { sRGBHex: string }
type EyeDropperCtor = new () => { open: () => Promise<EyeDropperResult> }

// Дефолты проходят AA с большим запасом (≈17:1) — статический пререндер, который
// проверяет axe, обязан быть чистым по контрасту (см. шапку).
const DEFAULT_FG: RGB = { r: 0x1a, g: 0x1a, b: 0x2e }
const DEFAULT_BG: RGB = { r: 0xff, g: 0xff, b: 0xff }

const hexNoHash = (rgb: RGB) => toHex(rgb).replace('#', '')

const ROWS: { kind: TextKind; label: string; note: string }[] = [
  { kind: 'normal', label: 'Normal text', note: 'below 24px (or 18.66px bold)' },
  { kind: 'large', label: 'Large text', note: '≥24px, or ≥18.66px (14pt) bold' },
  { kind: 'nonText', label: 'UI & graphics', note: 'icons, borders, chart parts (1.4.11)' },
]
const LEVELS: Level[] = ['AA', 'AAA']

function Verdict({ ratio, kind, level }: { ratio: number; kind: TextKind; level: Level }) {
  const result = passes(ratio, kind, level)
  if (result === null) {
    return (
      <span className="text-on-surface-variant">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not applicable at this level</span>
      </span>
    )
  }
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

export function ContrastChecker() {
  const [fg, setFg] = useState<RGB>(DEFAULT_FG)
  const [bg, setBg] = useState<RGB>(DEFAULT_BG)
  // Отдельные строки полей: пользователь может печатать частичный/невалидный ввод,
  // не теряя последний валидный цвет для расчёта.
  const [fgInput, setFgInput] = useState(toHex(DEFAULT_FG))
  const [bgInput, setBgInput] = useState(toHex(DEFAULT_BG))
  const [fgValid, setFgValid] = useState(true)
  const [bgValid, setBgValid] = useState(true)
  const [hasEyeDropper, setHasEyeDropper] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Пишем текущее состояние в адресную строку — вызывается ТОЛЬКО из действий
  // пользователя (см. шапку про порядок эффектов).
  function syncUrl(nextFg: RGB, nextBg: RGB) {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    params.set('fg', hexNoHash(nextFg))
    params.set('bg', hexNoHash(nextBg))
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }

  function applyFg(rgb: RGB) {
    setFg(rgb)
    setFgInput(toHex(rgb))
    setFgValid(true)
    syncUrl(rgb, bg)
  }
  function applyBg(rgb: RGB) {
    setBg(rgb)
    setBgInput(toHex(rgb))
    setBgValid(true)
    syncUrl(fg, rgb)
  }

  // Ввод в текстовое поле: обновляем строку всегда, цвет — только если распарсился.
  function onFgText(value: string) {
    setFgInput(value)
    const parsed = parseColor(value)
    if (parsed) {
      setFg(parsed)
      setFgValid(true)
      syncUrl(parsed, bg)
    } else {
      setFgValid(false)
    }
  }
  function onBgText(value: string) {
    setBgInput(value)
    const parsed = parseColor(value)
    if (parsed) {
      setBg(parsed)
      setBgValid(true)
      syncUrl(fg, parsed)
    } else {
      setBgValid(false)
    }
  }

  function swap() {
    const nextFg = bg
    const nextBg = fg
    setFg(nextFg)
    setBg(nextBg)
    setFgInput(toHex(nextFg))
    setBgInput(toHex(nextBg))
    setFgValid(true)
    setBgValid(true)
    syncUrl(nextFg, nextBg)
  }

  async function pickEyedropper(which: 'fg' | 'bg') {
    if (typeof window === 'undefined') return
    const Ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper
    if (!Ctor) return
    try {
      const { sRGBHex } = await new Ctor().open()
      const rgb = parseColor(sRGBHex)
      if (rgb) (which === 'fg' ? applyFg : applyBg)(rgb)
    } catch {
      // Пользователь отменил выбор — не ошибка, молча выходим.
    }
  }

  function copyLink() {
    if (typeof window === 'undefined') return
    const url = `${window.location.origin}${window.location.pathname}?fg=${hexNoHash(fg)}&bg=${hexNoHash(bg)}`
    // history тоже обновим, чтобы адресная строка совпала с тем, что скопировали.
    window.history.replaceState(null, '', `${window.location.pathname}?fg=${hexNoHash(fg)}&bg=${hexNoHash(bg)}`)
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  // Пипетка: показываем кнопку только там, где API есть. Начальный рендер (сервер
  // и первый клиентский) — без кнопки; показ после эффекта не ломает гидрацию.
  useEffect(() => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) setHasEyeDropper(true)
  }, [])

  // Permalink: читаем query ПОСЛЕ монтирования, не в рендере.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const fgP = params.get('fg')
    const bgP = params.get('bg')
    const fgParsed = fgP ? parseColor(fgP) : null
    const bgParsed = bgP ? parseColor(bgP) : null
    if (fgParsed) {
      setFg(fgParsed)
      setFgInput(toHex(fgParsed))
    }
    if (bgParsed) {
      setBg(bgParsed)
      setBgInput(toHex(bgParsed))
    }
  }, [])

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current)
  }, [])

  const ratioRaw = contrastRatio(fg, bg)
  const ratio = roundRatio(ratioRaw)
  const fgHex = toHex(fg)
  const bgHex = toHex(bg)

  // Краткая сводка для aria-live — SR слышит вердикт, а не только число.
  const normalAA = passes(ratioRaw, 'normal', 'AA')
  const normalAAA = passes(ratioRaw, 'normal', 'AAA')
  const summary = normalAAA
    ? 'Passes AA and AAA for normal text.'
    : normalAA
      ? 'Passes AA for normal text; fails AAA.'
      : passes(ratioRaw, 'large', 'AA')
        ? 'Fails AA for normal text; passes AA only for large text.'
        : 'Fails AA for both normal and large text.'

  return (
    <div className="panel mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      {/* Левая колонка: ввод цветов + результат + матрица */}
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorControl
            legend="Foreground (text) colour"
            idBase="fg"
            hex={fgHex}
            inputValue={fgInput}
            valid={fgValid}
            onNative={(v) => applyFg(parseColor(v) ?? fg)}
            onText={onFgText}
            hasEyeDropper={hasEyeDropper}
            onEyedropper={() => pickEyedropper('fg')}
            rgb={fg}
          />
          <ColorControl
            legend="Background colour"
            idBase="bg"
            hex={bgHex}
            inputValue={bgInput}
            valid={bgValid}
            onNative={(v) => applyBg(parseColor(v) ?? bg)}
            onText={onBgText}
            hasEyeDropper={hasEyeDropper}
            onEyedropper={() => pickEyedropper('bg')}
            rgb={bg}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-ghost" onClick={swap}>
            <span aria-hidden="true">⇅</span> Swap colours
          </button>
          <button type="button" className="btn-ghost" onClick={copyLink}>
            <span aria-hidden="true">🔗</span> Copy link to result
          </button>
          {/* Подтверждение копирования — вежливый live-регион, не самостоятельный фокус. */}
          <span role="status" aria-live="polite" className="text-sm text-on-surface-variant">
            {copied ? 'Link copied to clipboard.' : ''}
          </span>
        </div>

        {/* Результат: главный визуальный момент экрана (диагноз E) — крупное
            число + сводка, всё в одном live-регионе. .result-hero — самая
            сильная тень на странице, ровно один раз. */}
        <div className="result-hero" aria-live="polite">
          <p className="label text-on-surface-variant">Contrast ratio</p>
          <p className="mt-2">
            <span className="num text-6xl font-semibold tracking-tight text-on-surface sm:text-7xl">
              {ratio.toFixed(2)}
            </span>
            <span className="text-2xl text-on-surface-variant"> : 1</span>
          </p>
          <p className="mt-3 text-sm text-on-surface-variant">{summary}</p>
        </div>

        {/* Матрица AA/AAA × normal/large/UI. Настоящая таблица, scope, текст+иконка. */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              WCAG pass or fail for the current contrast ratio of {ratio.toFixed(2)} to 1, by text
              size and conformance level
            </caption>
            <thead>
              <tr className="border-b border-outline-variant text-left">
                <th scope="col" className="py-2 pr-3 font-medium text-on-surface">
                  Text / element
                </th>
                {LEVELS.map((lvl) => (
                  <th key={lvl} scope="col" className="py-2 px-3 font-medium text-on-surface">
                    Level {lvl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.kind} className="border-b border-outline-variant/60 align-top">
                  <th scope="row" className="py-3 pr-3 font-medium text-on-surface">
                    {row.label}
                    <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
                      {row.note}
                    </span>
                  </th>
                  {LEVELS.map((lvl) => (
                    <td key={lvl} className="py-3 px-3">
                      <Verdict ratio={ratioRaw} kind={row.kind} level={lvl} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Правая колонка: живое превью текста в выбранных цветах. */}
      <div>
        <h2 className="h2 mt-0 text-lg">Preview</h2>
        <div
          className="mt-3 rounded-2xl border border-outline-variant p-5"
          style={{ backgroundColor: bgHex, color: fgHex }}
        >
          <p className="text-sm">Small sample text — the quick brown fox jumps over the lazy dog.</p>
          <p className="mt-3 text-2xl font-semibold">Large sample heading</p>
          <p className="mt-3 text-base font-bold">Bold body text at 18.66px counts as large.</p>
          <div
            className="mt-4 inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium"
            style={{ borderColor: fgHex, color: fgHex }}
          >
            <span aria-hidden="true">▣</span>
            <span className="ml-2">Button / UI element</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          The preview uses your two colours exactly. Everything else on this page uses our own
          verified palette.
        </p>
      </div>
    </div>
  )
}

function ColorControl({
  legend,
  idBase,
  hex,
  inputValue,
  valid,
  onNative,
  onText,
  hasEyeDropper,
  onEyedropper,
  rgb,
}: {
  legend: string
  idBase: string
  hex: string
  inputValue: string
  valid: boolean
  onNative: (value: string) => void
  onText: (value: string) => void
  hasEyeDropper: boolean
  onEyedropper: () => void
  rgb: RGB
}) {
  const textId = `${idBase}-text`
  const swatchId = `${idBase}-swatch`
  const hintId = `${idBase}-hint`
  return (
    <fieldset className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <legend className="label px-1 text-on-surface-variant">{legend}</legend>
      <div className="mt-2 flex items-center gap-3">
        <label htmlFor={swatchId} className="sr-only">
          {legend} — colour picker
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
            {legend} — hex, RGB or HSL value
          </label>
          <input
            id={textId}
            type="text"
            value={inputValue}
            onChange={(e) => onText(e.target.value)}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            aria-invalid={!valid}
            aria-describedby={hintId}
            className="input w-full font-mono"
            placeholder="#1a1a2e, rgb(26,26,46), hsl(240,29%,14%)"
          />
        </div>
        {hasEyeDropper && (
          <button
            type="button"
            onClick={onEyedropper}
            className="btn-ghost shrink-0 px-3"
            title="Pick a colour from anywhere on screen"
          >
            <span aria-hidden="true">⚲</span>
            <span className="sr-only">Pick {legend} with the eyedropper</span>
          </button>
        )}
      </div>
      <p id={hintId} className="mt-2 text-xs text-on-surface-variant">
        {valid ? (
          <>
            {toRgbString(rgb)} · {toHslString(rgb)}
          </>
        ) : (
          <span className="text-[color:var(--color-critical)]">
            Not a recognised colour — showing the last valid one.
          </span>
        )}
      </p>
    </fieldset>
  )
}
