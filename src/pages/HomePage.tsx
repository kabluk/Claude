import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { useScanForm } from '@/components/ScanForm'
import { TurnstileWidget, type TurnstileHandle } from '@/components/TurnstileWidget'
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

// CN-BRANDBOOK-V2: ISO alpha-2 → regional-indicator flag emoji, вычислено из
// кода страны (нет своего изображения/шрифта иконок для флагов, D-068 §29
// держит одну icon-систему — эмодзи не часть её, но и не требует подключения
// ничего). Декоративно (aria-hidden) — рядом всегда идёт текстовое название
// страны, дублировать его для скринридера не нужно.
function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

// Инлайн stroke-SVG, стиль иконочной системы проекта (currentColor, ~1.75,
// round caps/joins — как логотип в Layout.tsx и индикаторы ScanStream.tsx).
// Material Symbols/CDN-иконки сознательно не подключаются (§29, D-068).
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 15 15 9" />
      <path d="M11 6.5 13 4.5a3.5 3.5 0 0 1 5 5l-2 2" />
      <path d="M13 17.5 11 19.5a3.5 3.5 0 0 1-5-5l2-2" />
    </svg>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export default function HomePage() {
  const certified = agencies.filter((a) => a.certs.length > 0).length
  // CN-HERO (конституция §7): главная — вход в живой продукт, не лендинг.
  // Логика отправки полностью общая со /scan/ (useScanForm) — здесь только
  // разметка. Никаких выдуманных счётчиков («sites scanned today» показывать
  // нечем — реального агрегата в D1 у статической главной нет, D-063).
  const { url, setUrl, state, submit } = useScanForm()
  const turnstileRef = useRef<TurnstileHandle>(null)

  // CN-BRANDBOOK-V2 bento (§6 задачи): top-N стран по числу агентств.
  // `countries` уже отсортирован по count убывания (src/lib/data.ts), поэтому
  // здесь ничего не пересчитывается и не хардкодится — просто срез топа.
  const topCountries = countries.slice(0, 6)

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

      {/* 1. Функциональный hero (§7-8, §59): продукт объясняет себя взаимодействием.
          CN-BRANDBOOK-V2: композиция по новому Stitch-макету владельца
          (scratchpad mockup-home.html) — бейдж/h1-акцент/форма/stats-бар из
          него, подзаголовок и блоки доверия ниже — существующий контент
          сайта (копирайтинг не входит в этот узел, D-035/D-045: не берём
          выдуманные данные и плейсхолдеры макета). */}
      <section className="relative overflow-hidden py-12 sm:py-16">
        {/* Декоративные фоновые кольца — только форма, ничего не сообщают;
            вращение снимается под prefers-reduced-motion (.hero-ring, §35). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-20"
        >
          <svg viewBox="0 0 800 800" className="hero-ring h-[44rem] w-[44rem]" fill="none">
            <circle
              cx="400"
              cy="400"
              r="300"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="10 20"
              className="text-primary"
            />
            <circle
              cx="400"
              cy="400"
              r="200"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="5 15"
              className="text-primary-container"
            />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          {/* Бейдж: факт о том, как работает сканер, а не выдуманная
              телеметрия «engine active» из макета (D-035/D-045). */}
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 shadow-sm">
            <span aria-hidden="true" className="badge-dot h-2 w-2 rounded-full bg-primary" />
            <span className="label text-on-surface-variant">Instant automated scan against WCAG</span>
          </div>

          {/* Рукописное подчёркивание из макета убрано по указанию владельца
              (2026-08-08): акцент несёт цвет слова, второй маркер избыточен. */}
          <h1 className="display mt-4">
            Check your website{' '}
            <span className="text-[color:var(--color-primary)]">accessibility</span>
          </h1>
          <p className="lede mx-auto">
            Know where your website stands: an instant automated scan against WCAG — including the
            accessibility-statement checks European regulators start with.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void (async () => {
                // D-169: execute() запускает невидимую проверку ровно в момент
                // сабмита. Провал/незагруженный виджет не блокирует отправку —
                // сервер сам решает, обязателен ли токен (та же деградация,
                // что была при eager-рендере).
                let turnstileToken: string | undefined
                try {
                  turnstileToken = await turnstileRef.current?.execute()
                } catch {
                  turnstileToken = undefined
                }
                void submit({ turnstileToken })
              })()
            }}
            className="mx-auto mt-6 max-w-xl"
            noValidate
          >
            <label htmlFor="hero-scan-url" className="sr-only">
              Website URL
            </label>
            <div className="flex items-center gap-1 rounded-2xl bg-surface p-2 shadow-xl">
              <span aria-hidden="true" className="hidden shrink-0 items-center pl-3 text-on-surface-variant sm:flex">
                <LinkIcon className="h-5 w-5" />
              </span>
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
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-on-surface placeholder:text-on-surface-variant disabled:opacity-60"
              />
              <button
                type="submit"
                className="btn shrink-0 whitespace-nowrap px-6 py-3"
                disabled={state.kind === 'submitting'}
              >
                {state.kind === 'submitting' ? 'Starting scan…' : 'Scan website'}
                {state.kind !== 'submitting' && <ArrowRightIcon className="h-4 w-4" />}
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
            <p className="mt-3 text-sm text-on-surface-variant">
              Free instant scan. No signup required.{' '}
              <Link className="underline underline-offset-2 hover:text-on-surface" to={paths.scan()}>
                Advanced options
              </Link>
            </p>
            <TurnstileWidget ref={turnstileRef} />
          </form>
        </div>

        {/* 2. Live product proof (§8) — только реальные числа из данных сборки,
            каждое считается из agencies.json / en301549-coverage.json. */}
        <dl className="relative z-10 mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 rounded-2xl bg-[color:var(--color-surface-container-low)]/60 p-6 text-center sm:grid-cols-4 sm:gap-8">
          {/* flex-col-reverse: число визуально сверху, DOM-порядок dt→dd валиден.
              justify-end — в column-reverse «end» это ВЕРХ ячейки: без него
              содержимое прижато к низу, и у метрики с двухстрочной подписью
              («Verifiable certifications») число уезжало выше остальных
              (замечено владельцем на живом сайте 2026-08-08). */}
          <div className="flex flex-col-reverse justify-end">
            <dt className="label mt-1 text-on-surface-variant">Verified agencies</dt>
            <dd className="num text-[2rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--color-primary)]">
              {agencies.length}
            </dd>
          </div>
          <div className="flex flex-col-reverse justify-end">
            <dt className="label mt-1 text-on-surface-variant">Countries</dt>
            <dd className="num text-[2rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--color-primary)]">
              {countries.length}
            </dd>
          </div>
          <div className="flex flex-col-reverse justify-end">
            <dt className="label mt-1 text-on-surface-variant">Verifiable certifications</dt>
            <dd className="num text-[2rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--color-primary)]">
              {certified}
            </dd>
          </div>
          <div className="flex flex-col-reverse justify-end">
            <dt className="label mt-1 text-on-surface-variant">EN 301 549 checks</dt>
            <dd className="num text-[2rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--color-primary)]">
              {coverageSummary.covered}
              <span className="text-base font-medium text-on-surface-variant">/{coverageSummary.total}</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* 3. Bento: агентства по странам (реальные счётчики из countries/agenciesIn,
          src/lib/data.ts — уже отсортировано по убыванию) + фильтры по
          услуге/стандарту. Замена прежних отдельных секций «By service»/«By
          standard» ниже по странице — макет сводит их в одну панель рядом со
          списком стран, дублировать их дальше по странице незачем. */}
      <section className="mt-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="h2 mt-0">Find a verified audit agency</h2>
                <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
                  When the scan finds work to do, these are the people who fix it: {agencies.length} audit
                  and remediation specialists, checked against public sources — no automated «overlay»
                  vendors, {certified} with independently verifiable certifications.
                </p>
              </div>
              <Link
                className="label inline-flex shrink-0 items-center gap-1 text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-hover)]"
                to={paths.countries()}
              >
                All {countries.length} countries
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {topCountries.map((c) => (
                <Link
                  key={c.code}
                  to={paths.country(c)}
                  className="card flex items-center justify-between gap-3"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-lg"
                    >
                      {flagEmoji(c.code)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-on-surface">{c.name}</span>
                      <span className="label block text-on-surface-variant">{c.count} agencies</span>
                    </span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-outline-variant" />
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="card flex flex-col gap-6 p-6">
              <div>
                <h3 className="label text-on-surface">By service</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SERVICES.map((s) => (
                    <Link key={s} to={paths.service(s)} className="chip hover:border-outline">
                      {serviceLabel(s)} · <span className="num">{withService(agencies, s).length}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="label text-on-surface">By standard</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {STANDARDS.map((s) => (
                    <Link key={s} to={paths.standard(s)} className="chip hover:border-outline">
                      {standardLabel(s)} · <span className="num">{withStandard(agencies, s).length}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {guides.length > 0 && (
        <section className="mt-12">
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
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 text-sm text-on-surface-variant">
          <h2 className="text-base font-semibold text-on-surface">How listings are verified</h2>
          <p className="mt-2">
            Every agency here is backed by at least one public source — a certification register
            (BIK BITV-Test, IAAP), a government procurement framework, a mandatory accessibility
            statement naming the auditor, or the agency's own published service pages. The source
            links are shown on each profile. Fields we could not verify stay empty — we never
            guess prices, certifications or locations.
          </p>
        </section>

        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 text-sm text-on-surface-variant">
          <h2 className="text-base font-semibold text-on-surface">What a free scan can and can't tell you</h2>
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
