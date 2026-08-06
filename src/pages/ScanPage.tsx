import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { TurnstileWidget } from '@/components/TurnstileWidget'
import { isValidScanUrl, submitScan, ScannerUnavailableError } from '@/lib/scanner'
import { JURISDICTION_OPTIONS } from '@/lib/jurisdictions'
import { paths } from '@/lib/data'

type FormState = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'error'; message: string }

export default function ScanPage() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  // '' = определить по домену (поведение до D-032, остаётся по умолчанию —
  // не заставляем выбирать страну ради простого скана).
  const [countryCode, setCountryCode] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>()
  const [state, setState] = useState<FormState>({ kind: 'idle' })

  // D-041: `?country=DE` предвыбирает юрисдикцию — так работает ссылка с
  // немецкого входного пути (/bfsg-check/), где страна уже известна и повторно
  // спрашивать её незачем.
  //
  // Намеренно в useEffect, а не в инициализаторе useState: страница пререндерится SSG, где
  // query-строки нет вовсе. Инициализируй мы состояние из параметра — сервер
  // отрисовал бы пустой select, клиент выбранный, и React получил бы
  // расхождение при гидратации. Здесь же значение ставится ПОСЛЕ гидратации.
  //
  // Неизвестный код молча игнорируется (как и в воркере, D-032): это подсказка
  // из ссылки, а не валидируемый контракт — падать из-за неё страница не должна.
  const [searchParams] = useSearchParams()
  useEffect(() => {
    const raw = searchParams.get('country')?.trim().toUpperCase()
    if (raw && JURISDICTION_OPTIONS.some((j) => j.code === raw)) setCountryCode(raw)
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!isValidScanUrl(trimmed)) {
      setState({ kind: 'error', message: 'Enter a full URL starting with http:// or https://.' })
      return
    }
    setState({ kind: 'submitting' })
    try {
      const { scanId } = await submitScan(trimmed, {
        turnstileToken,
        ...(countryCode ? { countryCode } : {}),
      })
      navigate(paths.report(scanId))
    } catch (err) {
      if (err instanceof ScannerUnavailableError) {
        setState({ kind: 'error', message: 'The scanner is not available on this deployment yet.' })
      } else {
        setState({ kind: 'error', message: err instanceof Error ? err.message : 'Could not start the scan. Try again.' })
      }
    }
  }

  return (
    <Layout
      title="Free accessibility scan"
      description="Scan any website for accessibility issues — free automated WCAG check, no account required."
      path={paths.scan()}
      crumbs={[]}
    >
      <h1 className="h1">Scan your website for accessibility issues</h1>
      <p className="lede">
        Free automated scan of up to 6 pages, checked against WCAG with axe-core. Most sites finish
        in under a minute. No account or payment required.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl" noValidate>
        <label htmlFor="scan-url" className="block text-sm font-medium text-slate-700">
          Website URL
        </label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <input
            id="scan-url"
            type="url"
            inputMode="url"
            required
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={state.kind === 'submitting'}
            aria-describedby={state.kind === 'error' ? 'scan-url-error' : undefined}
            aria-invalid={state.kind === 'error'}
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button type="submit" className="btn" disabled={state.kind === 'submitting'}>
            {state.kind === 'submitting' ? 'Starting scan…' : 'Scan now'}
          </button>
        </div>

        {state.kind === 'error' && (
          <p id="scan-url-error" role="alert" className="mt-2 text-sm text-red-700">
            {state.message}
          </p>
        )}

        <div className="mt-4">
          <label htmlFor="scan-country" className="block text-sm font-medium text-slate-700">
            Which country's rules should we check against?{' '}
            <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <select
            id="scan-country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={state.kind === 'submitting'}
            aria-describedby="scan-country-help"
            className="mt-1.5 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Detect from the domain</option>
            {JURISDICTION_OPTIONS.map((j) => (
              <option key={j.code} value={j.code}>
                {j.label}
              </option>
            ))}
          </select>
          <p id="scan-country-help" className="mt-1.5 max-w-prose text-xs text-slate-500">
            By default we guess from the domain ending — a <code>.de</code> site is checked against
            German rules. That guess can't work for a <code>.com</code> site, so pick the country you
            serve if you want the legal notes in your report. If you sell across several EU countries,
            enforcement can come from each of them separately — this picks one to report on, not the
            only one that applies to you.
          </p>
        </div>

        <div className="mt-4">
          <TurnstileWidget onToken={setTurnstileToken} />
        </div>
      </form>

      <section className="mt-10 max-w-2xl">
        <h2 className="h2 mt-0">What this does — and doesn't — do</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>We scan the page you submit plus up to 5 linked pages on the same site, live, using a headless browser and axe-core.</li>
          <li>No account or email is required to run a scan.</li>
          <li>Your report is saved so we can show it to you again — reachable only through its private link, never indexed or listed publicly.</li>
          <li>If a site's robots.txt or bot protection refuses our scanner, we don't try to get around it.</li>
          <li>
            This is an automated check, not a certification of WCAG conformance or legal advice —
            axe-core catches a meaningful subset of issues, not everything a manual audit would find.
          </li>
        </ul>
      </section>
    </Layout>
  )
}
