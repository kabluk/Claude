// G-CHECKER-HTML-PARSER (D-183): общий UI двух чекеров (alt-text и heading
// structure) на одном движке. Проп `mode` выбирает, что извлекать и
// показывать; вся логика — в src/lib/htmlAudit.ts (чистая, 16 тестов),
// извлечение — src/lib/htmlExtract.ts (DOMParser). Две страницы используют
// этот компонент с разным mode → два URL, два поисковых кластера, один код.
//
// Дисциплина доступности (инструмент ПРО доступность, тот же стандарт, что у
// остальных чекеров): textarea со своим <label>; результат в <output>
// aria-live="polite"; findings — список, severity передаётся не только
// цветом, но и текстовой меткой (Error/Warning), иначе дальтоник не отличит.
//
// Дисциплина SSG-гидрации: DOMParser — browser-only, поэтому разбор идёт
// ТОЛЬКО в обработчике ввода, не в теле рендера; начальное состояние
// детерминировано образцом, одинаково на сервере и клиенте.

import { useEffect, useId, useState } from 'react'
import { analyzeAltText, analyzeHeadings, summarize, type Finding } from '@/lib/htmlAudit'
import { extractHeadings, extractImages } from '@/lib/htmlExtract'

type Mode = 'alt' | 'headings'

const SAMPLES: Record<Mode, string> = {
  alt: `<img src="/logo.png">
<img src="hero-banner.jpg" alt="hero-banner.jpg">
<img src="/bike.png" alt="Image of a red bicycle">
<img src="/chart.png" alt="Quarterly revenue rose 12% from Q1 to Q2">
<img src="/divider.png" alt="" role="presentation">`,
  headings: `<h1>Product overview</h1>
<h2>Features</h2>
<h4>Pricing details</h4>
<h2></h2>
<h3>Support</h3>`,
}

export function HtmlAuditTool({ mode }: { mode: Mode }) {
  const [html, setHtml] = useState(SAMPLES[mode])
  const formId = useId()

  // Результат живёт в состоянии и считается ТОЛЬКО в useEffect — не в теле
  // рендера. Причина ровно из LEARNING_LOG (hydration mismatch): DOMParser
  // браузерный, и разбор в теле рендера дал бы на сервере пусто, а при первом
  // клиентском рендере — распарсенный образец, то есть разные деревья и
  // сорванную гидрацию. `null` = «ещё не считали» — одинаково на сервере и в
  // первом клиентском рендере; эффект наполняет уже после монтирования.
  const [result, setResult] = useState<{
    findings: Finding[]
    outline: { level: number; text: string }[] | null
  } | null>(null)

  useEffect(() => {
    if (!html.trim()) {
      setResult({ findings: [], outline: null })
      return
    }
    if (mode === 'alt') {
      setResult({ findings: analyzeAltText(extractImages(html)), outline: null })
    } else {
      const res = analyzeHeadings(extractHeadings(html))
      setResult({ findings: res.findings, outline: res.outline })
    }
  }, [html, mode])

  const findings = result?.findings ?? []
  const outline = result?.outline ?? null
  const counts = summarize(findings)
  const hasInput = html.trim().length > 0
  // Пока эффект не отработал (SSR и самый первый клиентский рендер) result
  // === null — показываем нейтральную строку, одинаковую с обеих сторон.
  const computed = result !== null

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div>
        <label htmlFor={`${formId}-html`} className="block text-sm font-medium text-on-surface-variant">
          Paste your HTML
        </label>
        <p id={`${formId}-hint`} className="mt-1 text-xs text-on-surface-variant">
          {mode === 'alt'
            ? 'Copy the page source (or just the part with images) and paste it here. Nothing is uploaded — the parsing happens entirely in your browser.'
            : 'Copy the page source and paste it here. We read only the heading tags (h1–h6); nothing is uploaded or executed.'}
        </p>
        <textarea
          id={`${formId}-html`}
          aria-describedby={`${formId}-hint`}
          className="input-area mt-2 block h-80 w-full font-mono text-xs"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          spellCheck={false}
        />
        <button
          type="button"
          className="btn-ghost mt-3"
          onClick={() => setHtml(SAMPLES[mode])}
        >
          Reset to sample
        </button>
      </div>

      <div>
        <h2 className="h2 mt-0">Results</h2>

        <output aria-live="polite" className="mt-2 block">
          {!computed ? (
            <p className="text-on-surface-variant">Analysing…</p>
          ) : !hasInput ? (
            <p className="text-on-surface-variant">Paste some HTML on the left to see results here.</p>
          ) : (
            <>
              <p className="text-sm">
                {counts.errors === 0 && counts.warnings === 0 ? (
                  <span className="font-semibold text-[color:var(--color-success)]">
                    No {mode === 'alt' ? 'alt-text' : 'heading'} issues found in the pasted markup.
                  </span>
                ) : (
                  <span className="text-on-surface-variant">
                    <span className="font-semibold text-[color:var(--color-critical)]">{counts.errors}</span>{' '}
                    {counts.errors === 1 ? 'error' : 'errors'},{' '}
                    <span className="font-semibold text-[color:var(--color-moderate)]">{counts.warnings}</span>{' '}
                    {counts.warnings === 1 ? 'warning' : 'warnings'}.
                  </span>
                )}
              </p>

              {mode === 'headings' && outline && outline.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-on-surface">Outline</h3>
                  <ul className="mt-2 space-y-0.5 text-sm">
                    {outline.map((h, i) => (
                      <li
                        key={i}
                        style={{ paddingLeft: `${(h.level - 1) * 1.25}rem` }}
                        className="text-on-surface-variant"
                      >
                        <span className="font-mono text-xs text-on-surface">h{h.level}</span>{' '}
                        {h.text || <em className="text-[color:var(--color-critical)]">(empty)</em>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {findings.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {findings.map((f, i) => (
                    <li
                      key={i}
                      className={`rounded-md border px-4 py-3 text-sm ${
                        f.severity === 'error'
                          ? 'border-[color:var(--color-critical-border)] bg-[color:var(--color-critical-soft)]'
                          : 'border-[color:var(--color-moderate-border)] bg-[color:var(--color-moderate-soft)]'
                      }`}
                    >
                      <span
                        className={`font-semibold ${
                          f.severity === 'error'
                            ? 'text-[color:var(--color-critical)]'
                            : 'text-[color:var(--color-moderate)]'
                        }`}
                      >
                        {f.severity === 'error' ? 'Error' : 'Warning'}
                      </span>{' '}
                      <span className="font-mono text-xs text-on-surface-variant">{f.context}</span>
                      <p className="mt-1 text-on-surface-variant">{f.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </output>
      </div>
    </div>
  )
}
