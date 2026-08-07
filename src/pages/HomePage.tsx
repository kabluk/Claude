import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { useScanForm } from '@/components/ScanForm'
import { TurnstileWidget } from '@/components/TurnstileWidget'
import {
  SERVICES,
  STANDARDS,
  agencies,
  countries,
  paths,
  serviceLabel,
  standardLabel,
  withService,
  withStandard,
} from '@/lib/data'
import { guides } from '@/lib/guides'
import { coverageSummary } from '@/lib/coverage'

export default function HomePage() {
  const certified = agencies.filter((a) => a.certs.length > 0).length
  // CN-HERO (конституция §7): главная — вход в живой продукт, не лендинг.
  // Логика отправки полностью общая со /scan/ (useScanForm) — здесь только
  // разметка. Никаких выдуманных счётчиков («sites scanned today» показывать
  // нечем — реального агрегата в D1 у статической главной нет, D-063).
  const { url, setUrl, state, submit } = useScanForm()
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>()

  return (
    <Layout
      title={`${SITE_NAME}: free accessibility scan + ${agencies.length} verified audit agencies`}
      description={`Check your website accessibility with a free instant scan, then find a verified audit agency in ${countries.length} countries. WCAG 2.2, EN 301 549, Section 508, EAA, BITV, RGAA — real auditors, no overlays, every listing with cited sources.`}
      path="/"
    >
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: `${ORIGIN}/`,
        }}
      />

      {/* 1. Функциональный hero (§7-8, §59): продукт объясняет себя взаимодействием. */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="h1">Check your website accessibility</h1>
          <p className="lede mx-auto">
            Know where your website stands: an instant automated scan against WCAG — including the
            accessibility-statement checks European regulators start with.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submit({ turnstileToken })
            }}
            className="mx-auto mt-6 max-w-xl"
            noValidate
          >
            <label htmlFor="hero-scan-url" className="sr-only">
              Website URL
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="hero-scan-url"
                type="url"
                inputMode="url"
                required
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={state.kind === 'submitting'}
                aria-describedby={state.kind === 'error' ? 'hero-scan-error' : undefined}
                aria-invalid={state.kind === 'error'}
                className="input min-w-0 flex-1 px-4 py-3 !text-base"
              />
              <button type="submit" className="btn px-6 py-3 !text-base" disabled={state.kind === 'submitting'}>
                {state.kind === 'submitting' ? 'Starting scan…' : 'Scan website'}
              </button>
            </div>
            {state.kind === 'error' && (
              <p
                id="hero-scan-error"
                role="alert"
                className="mt-2 text-left text-sm font-medium text-[color:var(--color-critical)]"
              >
                {state.message}
              </p>
            )}
            <p className="mt-3 text-sm text-slate-500">
              Free instant scan. No signup required.{' '}
              <Link className="underline underline-offset-2 hover:text-slate-700" to={paths.scan()}>
                Advanced options
              </Link>
            </p>
            <TurnstileWidget onToken={setTurnstileToken} />
          </form>
        </div>

        {/* 2. Live product proof (§8) — только реальные числа из данных сборки,
            каждое считается из agencies.json / en301549-coverage.json. */}
        <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {/* flex-col-reverse: число визуально сверху, DOM-порядок dt→dd валиден */}
          <div className="flex flex-col-reverse">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Verified agencies</dt>
            <dd className="num mt-1 text-2xl font-bold">{agencies.length}</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Countries</dt>
            <dd className="num mt-1 text-2xl font-bold">{countries.length}</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Verifiable certifications</dt>
            <dd className="num mt-1 text-2xl font-bold">{certified}</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">EN 301 549 checks</dt>
            <dd className="num mt-1 text-2xl font-bold">
              {coverageSummary.covered}
              <span className="text-base font-medium text-slate-500">/{coverageSummary.total}</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* 3+. Каталог и доверие остаются ниже hero — порядок §8. */}
      <section>
        <h2 className="h2">Find a verified audit agency</h2>
        <p className="max-w-2xl text-sm text-slate-600">
          When the scan finds work to do, these are the people who fix it: {agencies.length} audit
          and remediation specialists, checked against public sources — no automated «overlay»
          vendors, {certified} with independently verifiable certifications.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {countries.slice(0, 12).map((c) => (
            <Link key={c.code} to={paths.country(c)} className="card tile">
              <span className="font-semibold">{c.name}</span>
              <span className="num text-sm text-slate-500">{c.count} agencies</span>
            </Link>
          ))}
        </div>
        {countries.length > 12 && (
          <p className="mt-3 text-sm">
            <Link className="underline underline-offset-2" to={paths.countries()}>
              All {countries.length} countries →
            </Link>
          </p>
        )}
      </section>

      <section>
        <h2 className="h2">By service</h2>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <Link key={s} to={paths.service(s)} className="chip hover:border-slate-400">
              {serviceLabel(s)} · <span className="num">{withService(agencies, s).length}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h2">By standard</h2>
        <div className="flex flex-wrap gap-2">
          {STANDARDS.map((s) => (
            <Link key={s} to={paths.standard(s)} className="chip hover:border-slate-400">
              {standardLabel(s)} · <span className="num">{withStandard(agencies, s).length}</span>
            </Link>
          ))}
        </div>
      </section>

      {guides.length > 0 && (
        <section>
          <h2 className="h2">Compliance guides</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guides.slice(0, 6).map((g) => (
              <Link key={g.slug} to={`/guides/${g.slug}/`} className="card" lang={g.locale}>
                <span className="font-semibold">{g.title}</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm">
            <Link className="underline underline-offset-2" to="/guides/">
              All guides →
            </Link>
          </p>
        </section>
      )}

      {/* Два парных блока доверия: как проверен каталог и что умеет сканер.
          Второй (D-038) намеренно называет ГРАНИЦУ, а не процент как достижение —
          для нового посетителя это ответ на «зачем мне агентство, если есть
          бесплатный сканер», то есть вход в каталог, а не отговорка от него.
          Цифры берутся из coverageSummary (данные, посчитанные скриптом), а не
          вписаны руками — иначе при следующем росте покрытия главная бы врала. */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          <h2 className="text-base font-semibold text-slate-800">How listings are verified</h2>
          <p className="mt-2">
            Every agency here is backed by at least one public source — a certification register
            (BIK BITV-Test, IAAP), a government procurement framework, a mandatory accessibility
            statement naming the auditor, or the agency's own published service pages. The source
            links are shown on each profile. Fields we could not verify stay empty — we never
            guess prices, certifications or locations.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          <h2 className="text-base font-semibold text-slate-800">What a free scan can and can't tell you</h2>
          <p className="mt-2">
            Our scanner checks {coverageSummary.covered} of the {coverageSummary.total} website
            requirements in EN 301 549 — the standard the European Accessibility Act points to —
            plus whether your accessibility statement exists and holds up. The other{' '}
            {coverageSummary.total - coverageSummary.covered} depend on meaning and judgement and
            need a human auditor. No scanner closes that gap, ours included.
          </p>
          <p className="mt-3">
            <Link className="underline underline-offset-2" to={paths.methodology()}>
              See the full list of what we check →
            </Link>
          </p>
        </section>
      </div>
    </Layout>
  )
}
