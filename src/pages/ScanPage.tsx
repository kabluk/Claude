import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { TurnstileWidget, type TurnstileHandle } from '@/components/TurnstileWidget'
import { useScanForm } from '@/components/ScanForm'
import { JURISDICTION_OPTIONS } from '@/lib/jurisdictions'
import { paths } from '@/lib/data'

export default function ScanPage() {
  // Логика отправки/валидации — общая с hero главной (useScanForm, CN-HERO):
  // здесь остаётся только то, чего нет в hero — юрисдикция и Turnstile.
  const { url, setUrl, state, submit } = useScanForm()
  // '' = определить по домену (поведение до D-032, остаётся по умолчанию —
  // не заставляем выбирать страну ради простого скана).
  const [countryCode, setCountryCode] = useState('')
  const turnstileRef = useRef<TurnstileHandle>(null)

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
    // D-169: execute() запускает невидимую проверку ровно в момент сабмита —
    // провал/незагруженный виджет не блокирует отправку, сервер сам решает,
    // обязателен ли токен.
    let turnstileToken: string | undefined
    try {
      turnstileToken = await turnstileRef.current?.execute()
    } catch {
      turnstileToken = undefined
    }
    void submit({ turnstileToken, ...(countryCode ? { countryCode } : {}) })
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
        <label htmlFor="scan-url" className="block text-sm font-medium text-on-surface-variant">
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
            className="input min-w-0 flex-1"
          />
          <button type="submit" className="btn" disabled={state.kind === 'submitting'}>
            {state.kind === 'submitting' ? 'Starting scan…' : 'Scan now'}
          </button>
        </div>

        {state.kind === 'error' && (
          <p id="scan-url-error" role="alert" className="mt-2 text-sm font-medium text-[color:var(--color-critical)]">
            {state.message}
          </p>
        )}

        <div className="mt-4">
          <label htmlFor="scan-country" className="block text-sm font-medium text-on-surface-variant">
            Which country's rules should we check against?{' '}
            <span className="font-normal text-on-surface-variant">(optional)</span>
          </label>
          <select
            id="scan-country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={state.kind === 'submitting'}
            aria-describedby="scan-country-help"
            className="input mt-1.5 w-full max-w-xs"
          >
            <option value="">Detect from the domain</option>
            {JURISDICTION_OPTIONS.map((j) => (
              <option key={j.code} value={j.code}>
                {j.label}
              </option>
            ))}
          </select>
          <p id="scan-country-help" className="mt-1.5 max-w-prose text-xs text-on-surface-variant">
            By default we guess from the domain ending — a <code>.de</code> site is checked against
            German rules. That guess can't work for a <code>.com</code> site, so pick the country you
            serve if you want the legal notes in your report. If you sell across several EU countries,
            enforcement can come from each of them separately — this picks one to report on, not the
            only one that applies to you.
          </p>
        </div>

        <div className="mt-4">
          <TurnstileWidget ref={turnstileRef} />
        </div>
      </form>

      <section className="mt-10 max-w-2xl">
        <h2 className="h2 mt-0">What this does — and doesn't — do</h2>
        <ul className="space-y-2 text-sm text-on-surface-variant">
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
