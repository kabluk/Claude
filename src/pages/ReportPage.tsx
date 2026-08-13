import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ScanStream } from '@/components/ScanStream'
import { paths, tax } from '@/lib/data'
import {
  ScannerUnavailableError,
  fetchScan,
  formatWcagTag,
  groupFindingsByRule,
  impactLabel,
  scanErrorMessage,
  scoreGrade,
  scoreGradeLabel,
  scoreGradeChipClass,
  scanPdfUrl,
  decidePlanPanel,
  createPlanCheckout,
  type PlanPanelState,
  type ScanFinding,
  type ScanReport,
} from '@/lib/scanner'
import { publicRuleInfo } from '@/lib/wcag'
import { estimateCost, formatCostEstimate, type CostCurrency, type CostEstimate } from '@/lib/costEstimate'
import { conversionDisclaimer } from '@/lib/currency'
import { decidePollNext, type PollAttempt } from '@/lib/reportPolling'
import { MatchedAgencies } from '@/components/MatchedAgencies'
import { SubscribeForm } from '@/components/SubscribeForm'
import { copyText } from '@/components/library/CopyButton'
import { useToasts, ToastRegion } from '@/components/library/Toast'
import { Accordion } from '@/components/library/Accordion'
import { uncoveredRows } from '@/lib/coverage'
import type { PriceBand } from '@data/a11y/types'

// D-143 (редизайн по макету владельца, Stitch): страница отчёта — главная
// коммерческая поверхность продукта. Композиция сверху вниз: HERO (статус +
// реальная дата скана + сводка + score-кольцо + обе CTA), «короткая версия» с
// оценкой стоимости, находки с фильтром по серьёзности, чек-лист ручных
// проверок, панель плана (пейволл D-114), и внизу пара конверсионных панелей —
// агентства и мониторинг. Всё содержимое D-130 сохранено, перемещено, а не
// удалено. Что из макета сознательно НЕ перенесено — см. DECISIONS.md D-143.

// A4-REPORT-CHECKLIST (D-130): the exact same static rows the public /wcag/
// index already labels "manual review only" (WcagIndexPage.tsx) — criteria
// automated scanning cannot detect at all (needs human judgement: does this
// heading actually describe the section, is this alt text meaningful). Real
// site data (en301549-coverage.json via coverage.ts), not scan-dependent —
// computed once at module scope, same reasoning as CURRENCY_OPTIONS above.
const UNCOVERED_ROWS = uncoveredRows()

// A4-REPORT-BRIEF (D-130): scope language, never a duration. This project has
// no time-to-fix field anywhere (no such column in data/a11y/types.ts or
// agencies.json) — inventing "usually takes 2 weeks" would be exactly the
// fabricated-number dishonesty D-035/D-046 exist to rule out. Keyed off the
// same cost.band already shown on the Remediation estimate card above
// (costEstimate.ts's BAND_BOUNDS) — never a second scale.
const SCOPE_PHRASE: Record<PriceBand, string> = {
  budget: 'a small number of straightforward fixes',
  mid: 'a moderate, well-scoped project',
  premium: 'a substantial engineering effort',
  enterprise: 'a large-scale remediation project',
}

// A4-SITE-COUNTRY (D-126): EUR — the estimate's native currency (BAND_BOUNDS in
// costEstimate.ts) — is always a valid choice, plus every currency actually
// used by one of the 19 markets in taxonomies.json, deduped and sorted (there
// are fewer unique currencies than countries — several EU markets share EUR).
// Computed once at module scope, not per-render: `tax` is static build-time
// data, not per-report state.
const EUR_CURRENCY: CostCurrency = { code: 'EUR', symbol: '€' }
const CURRENCY_OPTIONS: CostCurrency[] = Array.from(
  new Map(
    [EUR_CURRENCY, ...Object.values(tax.countries).map((c) => c.currency)].map((c) => [c.code, c]),
  ).values(),
).sort((a, b) => a.code.localeCompare(b.code))

// A2-STRIPE-CHECKOUT tail: Stripe redirects the browser back to
// success_url/cancel_url set in worker/routes/planCheckout.js, both of which
// are this exact report URL plus `?checkout=success|cancel` — nothing else
// on the site produces this param, so its mere presence is the signal.
const UNLOCK_POLL_MS = 2500
const UNLOCK_POLL_ATTEMPTS = 4

type LoadState =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'not-found' }
  | { kind: 'load-error'; message: string }
  | { kind: 'report'; report: ScanReport }

type Notify = ReturnType<typeof useToasts>['notify']
type FindingGroup = ReturnType<typeof groupFindingsByRule>[number]

// Отчёт существует только по прямой ссылке (id непредсказуем, генерируется
// Worker'ом) — не в getStaticPaths, попадает под клиентский catch-all
// routes.tsx (не пререндерится, но подхватывается после гидратации).
export default function ReportPage() {
  const { id } = useParams()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toasts, notify, dismiss } = useToasts()
  // Guards the whole ?checkout= side effect to fire exactly once — without it,
  // clearing the query param below (a setState) would re-run the effect on
  // its own change, and a StrictMode double-invoke would fire it twice.
  const checkoutHandledRef = useRef(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    // Серия сбоев ПОДРЯД (D-106). Живёт в замыкании эффекта, общее для всех
    // вызовов poll(); обнуляется любым успешным ответом внутри decidePollNext.
    let consecutiveErrors = 0

    // Не-report исходы (404 / сканер не настроен / сбой сети). Вынесено, чтобы
    // report-путь оставался линейным. Всё решение — в чистой decidePollNext
    // (проверяется reportPolling.test.mjs); здесь только маппинг в setState.
    function handleNonReport(attempt: PollAttempt, message: string) {
      const decision = decidePollNext(attempt, consecutiveErrors)
      switch (decision.show) {
        case 'not-found':
          setState({ kind: 'not-found' })
          break
        case 'unavailable':
          setState({ kind: 'unavailable' })
          break
        case 'retry':
          // НЕ трогаем state: последний показанный прогресс остаётся на экране,
          // пользователь не видит мигания «ошибка» на каждом блипе сети.
          consecutiveErrors = decision.consecutiveErrors
          timerRef.current = setTimeout(poll, decision.delayMs)
          break
        case 'load-error':
          setState({ kind: 'load-error', message })
          break
        // 'report' сюда не приходит: report-исход обрабатывается в poll() выше.
      }
    }

    async function poll() {
      try {
        const report = await fetchScan(id!)
        if (cancelled) return
        if (report) {
          consecutiveErrors = 0
          setState({ kind: 'report', report })
          const next = decidePollNext({ kind: 'ok', status: report.status }, 0)
          if (next.show === 'report' && next.keepPolling) {
            timerRef.current = setTimeout(poll, next.retryDelayMs)
          }
          return
        }
        handleNonReport({ kind: 'not-found' }, '') // fetchScan вернул null → HTTP 404
      } catch (err) {
        if (cancelled) return
        const attempt: PollAttempt =
          err instanceof ScannerUnavailableError
            ? { kind: 'unavailable' }
            : { kind: 'transient-error' }
        handleNonReport(attempt, err instanceof Error ? err.message : String(err))
      }
    }
    poll()

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
    }
  }, [id])

  // Handle the redirect back from Stripe Checkout (worker/routes/planCheckout.js
  // sets success_url/cancel_url to this exact page + ?checkout=success|cancel).
  // Only meaningful once the report itself has loaded — status:'done' is
  // required anyway for planUnlocked to mean anything.
  useEffect(() => {
    if (checkoutHandledRef.current) return
    if (state.kind !== 'report' || state.report.status !== 'done') return
    const checkoutParam = searchParams.get('checkout')
    if (checkoutParam !== 'success' && checkoutParam !== 'cancel') return
    checkoutHandledRef.current = true

    // Strip the param immediately (not after the async work below) so a
    // reload — or the retry loop's own setState — never re-shows the toast.
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('checkout')
    setSearchParams(nextParams, { replace: true })

    if (checkoutParam === 'cancel') {
      notify('Checkout cancelled — no payment was made.')
      return
    }

    if (state.report.planUnlocked) {
      notify('Payment successful — your plan is unlocked below.')
      return
    }

    // Stripe's webhook (the only thing that actually flips planUnlocked,
    // worker/routes/planCheckout.js) can land a beat after the browser
    // redirect — reportPolling.ts already stopped polling once status
    // reached 'done', so re-poll a few times here instead of assuming the
    // webhook won.
    let cancelled = false
    let attempt = 0
    const scanId = state.report.id
    async function pollForUnlock() {
      attempt++
      try {
        const fresh = await fetchScan(scanId)
        if (cancelled) return
        if (fresh?.planUnlocked) {
          setState({ kind: 'report', report: fresh })
          notify('Payment successful — your plan is unlocked below.')
          return
        }
      } catch {
        // Transient — fall through to the retry/give-up logic below same as a
        // successful-but-still-locked response; never a silent dead end.
      }
      if (cancelled) return
      if (attempt < UNLOCK_POLL_ATTEMPTS) {
        setTimeout(pollForUnlock, UNLOCK_POLL_MS)
      } else {
        notify('Payment received — this can take a moment to appear. Refresh the page if the plan is still locked.', {
          duration: null,
        })
      }
    }
    notify('Payment received — unlocking your plan…')
    pollForUnlock()

    return () => {
      cancelled = true
    }
    // Deliberately NOT depending on searchParams/setSearchParams/notify:
    // setSearchParams above changes searchParams on its own, which would
    // re-run this effect immediately and tear down the retry loop via the
    // cleanup above before its first fetchScan() even resolved (caught live
    // in a Playwright run — race case, not exercised by the unit/axe
    // fixtures, which mock an already-unlocked report). checkoutHandledRef
    // already makes every re-entry into this effect after the first a no-op,
    // so state is the only dependency that can meaningfully re-trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  if (!id) return null

  // Единый live-регион на все переходы состояний (loading → running → done/
  // error): существует с первого рендера, поэтому скринридер слышит смену
  // статуса, даже когда визуальный блок целиком заменяется отчётом. Тикающий
  // elapsed сюда сознательно НЕ входит (см. ScanStream).
  const liveMessage =
    state.kind === 'loading'
      ? 'Loading report'
      : state.kind === 'report'
        ? state.report.status === 'running'
          ? 'Scan in progress'
          : state.report.status === 'done'
            ? 'Scan finished, report ready'
            : 'Scan failed'
        : ''

  return (
    <Layout title="Accessibility scan report" description="Automated accessibility scan results." path={paths.report(id)} index={false}>
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>
      {state.kind === 'loading' && <p className="lede">Loading report…</p>}

      {state.kind === 'unavailable' && (
        <div role="alert" className="rounded-lg border border-[color:var(--color-moderate-border)] bg-[color:var(--color-moderate-soft)] p-4 text-[color:var(--color-moderate)]">
          <h1 className="h1">Scanner is not configured</h1>
          <p className="mt-2">This deployment does not have a scanner backend connected yet.</p>
        </div>
      )}

      {state.kind === 'not-found' && (
        <div role="alert">
          <h1 className="h1">Report not found</h1>
          <p className="lede">This scan link doesn't exist, or the report has expired. Double-check the link, or run a new scan.</p>
        </div>
      )}

      {state.kind === 'load-error' && (
        <div role="alert">
          <h1 className="h1">Couldn't load this report</h1>
          <p className="lede">A network problem prevented us from loading the scan results. Try reloading the page.</p>
        </div>
      )}

      {state.kind === 'report' && <ReportBody report={state.report} notify={notify} />}
    </Layout>
  )
}

// A2-STRIPE-CHECKOUT: единый вход в платный анлок для ВСЕЙ страницы. До D-143
// это состояние жило внутри одной панели плана; теперь тот же флоу запускают
// три поверхности (главная CTA в hero, замок-тизер в каждой карточке находки,
// панель плана), и вторая копия обработчика означала бы вторую трактовку 503.
// Возвращает состояние и одну функцию — решение «куда вести» принимается
// здесь, а не в каждой кнопке.
// Исход рассказывается ТОСТОМ, а не строчкой под одной из кнопок: до D-143
// кнопка была одна и подпись под ней всегда попадала в поле зрения, теперь
// оплату можно запустить и из hero, и из любой карточки находки внизу
// страницы. Строка под hero-кнопкой означала бы, что человек, нажавший замок
// в последней карточке, не увидит ответа вовсе. Тост фиксирован на экране, а
// tone 'alert' не гасится по таймеру (Toast.tsx) — сообщение, требующее
// действия, не должно исчезать само (WCAG 2.2.1). Тот же канал, которым
// страница уже говорит об исходе оплаты после возврата из Stripe (D-124).
function usePlanUnlock(reportId: string, notify: Notify) {
  const [loading, setLoading] = useState(false)

  const start = useCallback(async () => {
    setLoading(true)
    try {
      const result = await createPlanCheckout(reportId)
      if (result.kind === 'redirect') {
        window.location.href = result.url
        return // keep the button in 'loading' — the page is navigating away
      }
      if (result.kind === 'already-unlocked') {
        // Already accessible (a lead was left, or it was already paid) — send
        // the user straight to the plan instead of charging again.
        window.location.href = scanPdfUrl(reportId)
        return
      }
      // 503: degrade honestly to the free branch, never a silent no-op.
      notify(
        'Card payment isn’t available yet — you can still get the plan free by asking a specialist for a quote.',
        { tone: 'alert' },
      )
    } catch {
      notify(
        'Something went wrong starting the payment. Please try again, or get the plan free via a specialist request.',
        { tone: 'alert' },
      )
    }
    setLoading(false)
  }, [reportId, notify])

  return { loading, start }
}

type Unlock = ReturnType<typeof usePlanUnlock>

function ReportBody({ report, notify }: { report: ScanReport; notify: Notify }) {
  // A4-SITE-COUNTRY (D-126): '' means "use the auto-detected default" — the
  // ONLY thing this state remembers is an explicit user choice, never a
  // synced copy of the detected default. That sidesteps an effect entirely:
  // report.countryCode is null while status is 'running' (ReportBody mounts
  // then already, before the early returns below) and only becomes real once
  // status flips to 'done' — a useState initializer reading it would freeze
  // the stale null from first mount, and syncing it in a useEffect would risk
  // clobbering a choice the user already made. Declared unconditionally here,
  // before the early returns, per the rules of hooks (this component must
  // call the same hooks on every render regardless of report.status).
  const [currencyOverride, setCurrencyOverride] = useState('')
  const unlock = usePlanUnlock(report.id, notify)

  // CN-SCAN-STREAM: running/error рисуются deploy-подобным потоком шагов
  // (ScanStream) из РЕАЛЬНЫХ полей API. Прежний текст «Scanned N pages so far»
  // снят как раз поэтому: pages_json пишется одним куском при завершении,
  // счётчик всегда показывал 0 и лишь притворялся живым прогрессом.
  if (report.status === 'running') {
    return (
      <div>
        <h1 className="h1">Scanning {report.url}</h1>
        <p className="lede">
          Most sites finish in under a minute — this page updates on its own, no need to reload.
        </p>
        <ScanStream report={report} />
      </div>
    )
  }

  if (report.status === 'error') {
    return (
      <div role="alert">
        <h1 className="h1">Couldn't scan {report.url}</h1>
        <p className="lede">{scanErrorMessage(report.errorCode)}</p>
        <ScanStream report={report} />
        {/* §38: ошибка — не тупик, путь вперёд обязателен. */}
        <p className="mt-8">
          <Link className="btn" to={paths.scan()}>
            Run a new scan
          </Link>
        </p>
      </div>
    )
  }

  const groups = groupFindingsByRule(report.findings)
  const cost = estimateCost(report.findings)
  const planPanel = decidePlanPanel(report, groups.length)
  // A4-SITE-COUNTRY (D-126): default currency comes from the detected site
  // country (worker/lib/siteCountry.js); falls back to EUR display when
  // countryCode is null/unrecognized (never crash, never guess a currency).
  // An explicit user pick (currencyOverride) always wins over the detected
  // default — same override-wins pattern the jurisdiction `<select>` already
  // uses on ScanPage — and this override is PURELY local display state: it
  // re-renders the already-known EUR figure, it never re-fetches the report.
  const defaultCurrency = (report.countryCode && tax.countries[report.countryCode]?.currency) || EUR_CURRENCY
  const activeCurrency = CURRENCY_OPTIONS.find((c) => c.code === currencyOverride) ?? defaultCurrency

  return (
    <div>
      <ReportHero report={report} groups={groups} planPanel={planPanel} unlock={unlock} notify={notify} />

      {/* A4-REPORT-BRIEF (D-130) переехал НАВЕРХ (D-143): это и есть «главное
          сразу» — простыми словами, что нашли, насколько это большой объём
          работы и бесплатный путь к плану через заявку. Рядом — оценка
          стоимости (A1-COST), потому что обе цифры отвечают на один и тот же
          вопрос «во что мне это обойдётся». */}
      {cost && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ReportBrief report={report} groups={groups} cost={cost} />
          </div>
          <div className="card flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="label mt-0 mb-0 text-on-surface-variant">Remediation estimate</h2>
                {/* A4-SITE-COUNTRY (D-126): local display state only — changes
                    which currency the already-known EUR estimate is shown in,
                    never triggers a new scan or request. Same override-wins
                    spirit as the jurisdiction <select> on ScanPage, but this
                    one corrects DISPLAY, not the scan's legal analysis. */}
                <label htmlFor="report-currency" className="sr-only">
                  Show remediation estimate in
                </label>
                <select
                  id="report-currency"
                  value={currencyOverride}
                  onChange={(e) => setCurrencyOverride(e.target.value)}
                  aria-describedby="report-currency-help"
                  className="input px-2 py-1 text-xs"
                >
                  <option value="">
                    Auto ({defaultCurrency.code}
                    {report.countryCode ? ` — ${report.countryCode}` : ''})
                  </option>
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="num mt-3 text-4xl font-bold tracking-tight">
                {formatCostEstimate(cost, activeCurrency)}
              </div>
              <p id="report-currency-help" className="mt-3 text-xs text-on-surface-variant">
                A rough estimate based on the number and severity of issues found here — not a
                quote or an offer. Actual cost depends on your codebase, team, and how the fixes
                are made.
                {activeCurrency.code !== 'EUR' && <> {conversionDisclaimer()}</>}
              </p>
            </div>
            <Link
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-primary)] underline underline-offset-2"
              to={paths.agencies()}
            >
              Compare agencies for a real quote →
            </Link>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        /* Success-состояние (§37): семантический токен + следующий шаг, не тупик.
           Честная оговорка остаётся — чистый автоскан ≠ полная доступность. */
        <div className="mt-8 max-w-2xl rounded-2xl border border-[color:var(--color-success-border)] bg-[color:var(--color-success-soft)] p-5">
          <p className="font-semibold text-[color:var(--color-success)]">
            No automatically-detectable issues found on the scanned pages.
          </p>
          <p className="mt-1.5 text-sm text-on-surface-variant">
            That covers what automation can see — criteria that depend on meaning and judgement
            still need a human review.{' '}
            <a className="underline underline-offset-2" href={paths.methodology()}>
              What this scan covers
            </a>
          </p>
        </div>
      ) : (
        <FindingsSection report={report} groups={groups} planPanel={planPanel} unlock={unlock} />
      )}

      <CheckYourselfSection />

      <RemediationPlanPanel report={report} groups={groups} planPanel={planPanel} unlock={unlock} />

      {/* Нижняя конверсионная пара (D-143, макет владельца): «кто починит» и
          «как не сломаться снова», рядом, в одном ряду. Порядок сохраняет
          логику D-135: платные/срочные пути — выше, бесплатная отсрочка
          «мы просто последим» — не раньше них. */}
      <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
        <MatchedAgencies findings={report.findings} priceBand={cost?.band} scanId={report.id} />
        <SubscribeForm url={report.url} tone="inverted" />
      </div>
    </div>
  )
}

// D-143 HERO. Первый экран отвечает на три вопроса сразу: насколько плохо
// (бейдж + кольцо score), что именно смотрели и когда (реальный createdAt,
// реальное число страниц/находок) и что делать дальше (главная CTA + Share).
// Ни одно число здесь не вычисляется заново — всё из того же ScanReport и тех
// же групп, что рисует список находок ниже.
function ReportHero({
  report,
  groups,
  planPanel,
  unlock,
  notify,
}: {
  report: ScanReport
  groups: FindingGroup[]
  planPanel: PlanPanelState
  unlock: Unlock
  notify: Notify
}) {
  const uniquePages = report.pages.length
  const grade = report.score != null ? scoreGrade(report.score) : null
  // Худшая серьёзность — из уже отсортированных групп (impactRank), не второй
  // сортировкой: groups[0] по построению самая тяжёлая.
  const worst = groups[0]?.impact ?? null

  async function onShare() {
    // Ссылка без query: `?checkout=…` — хвост возврата из Stripe, делиться им
    // бессмысленно (у получателя он вызвал бы тост об оплате чужого скана).
    const url = `${window.location.origin}${window.location.pathname}`
    const ok = await copyText(url)
    if (ok) notify('Report link copied — anyone with the link can open this report.')
    else notify('Couldn’t copy the link automatically — copy it from the address bar.', { tone: 'alert' })
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 shadow-sm sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {worst ? (
              <span className={`chip chip-${worst}`}>{impactLabel(worst)} issues found</span>
            ) : (
              <span className="chip chip-success">No automatic issues</span>
            )}
            <ScanDate createdAt={report.createdAt} />
          </div>

          {/* Адрес — часть заголовка (по нему отчёт и узнают), но отдельной
              строкой: длинный URL внутри 32px-заголовка на 375px переносится
              посреди домена и читается как опечатка. */}
          <h1 className="h1 mt-4">
            Accessibility report for{' '}
            <span className="mt-1 block text-xl leading-snug font-medium break-all text-on-surface-variant sm:text-2xl">
              {report.url}
            </span>
          </h1>

          <p className="lede">
            We scanned <span className="num">{uniquePages}</span> page{uniquePages === 1 ? '' : 's'} and found{' '}
            <span className="num">{report.findings.length}</span> issue instance
            {report.findings.length === 1 ? '' : 's'} across <span className="num">{groups.length}</span> distinct
            rule{groups.length === 1 ? '' : 's'}, checked against the WCAG criteria our scanner can test
            automatically (EN 301 549 chapter 9).
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {planPanel === 'unlocked' && (
              <a className="btn" href={scanPdfUrl(report.id)} target="_blank" rel="noreferrer">
                Download the fix plan (PDF)
              </a>
            )}
            {planPanel === 'locked' && (
              <button
                type="button"
                onClick={unlock.start}
                disabled={unlock.loading}
                className="btn disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant"
              >
                {unlock.loading ? 'Redirecting…' : 'Get the fix plan (PDF) — €19.99'}
              </button>
            )}
            {/* Чистый скан: продавать план нечего (decidePlanPanel → 'hidden'),
                и притворяться, что есть, было бы враньём. Главное действие для
                такого сайта — остаться чистым. */}
            {planPanel === 'hidden' && (
              <a className="btn" href="#monitoring">
                Watch this site for regressions
              </a>
            )}
            <button type="button" onClick={onShare} className="btn-ghost">
              Share
            </button>
          </div>
          {planPanel === 'locked' && (
            <p className="mt-3 max-w-prose text-sm text-on-surface-variant">
              Or get the same plan free:{' '}
              <Link
                className="font-medium text-[color:var(--color-primary)] underline underline-offset-2"
                to={`${paths.requestQuote()}?scanId=${encodeURIComponent(report.id)}`}
              >
                ask a specialist for a quote
              </Link>
              .
            </p>
          )}
        </div>

        {grade && report.score != null && (
          <div className="flex flex-col items-center gap-4 lg:w-60">
            <ScoreRing score={report.score} grade={grade} />
            <SeverityBreakdown groups={groups} />
          </div>
        )}
      </div>

      <p className="mt-8 max-w-prose border-t border-outline-variant pt-4 text-xs text-on-surface-variant">
        The score is a rough heuristic for comparing pages over time — it is not a certification of
        WCAG conformance and does not constitute legal advice. A clean automated scan does not
        guarantee full accessibility; manual review by a qualified auditor is still required.{' '}
        <a className="underline underline-offset-2" href={paths.methodology()}>
          See exactly what this scan covers
        </a>
        .
      </p>
    </section>
  )
}

// Настоящая дата скана из report.createdAt (D-143: в макете стояло выдуманное
// «Updated: Today 14:30»). UTC и фиксированная локаль — чтобы одна и та же
// запись читалась одинаково в любом часовом поясе; машинная форма остаётся в
// datetime. Неразбираемая дата не рисуется вовсе — прочерк вместо даты хуже,
// чем отсутствие строки.
function ScanDate({ createdAt }: { createdAt: string }) {
  const ms = Date.parse(createdAt)
  if (!Number.isFinite(ms)) return null
  const label = new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return (
    <span className="text-sm text-on-surface-variant">
      Scanned <time dateTime={createdAt}>{label}</time>
    </span>
  )
}

// Кольцо-визуализация score (D-107, макет владельца): длина окружности
// постоянна (r=45 → 2πr≈282.7), меняется только dashoffset — 0 при 100/100
// (кольцо закрыто целиком), полная окружность при 0. Само число — обычный
// текст поверх кольца, а не подпись внутри SVG: кольцо декоративно
// (aria-hidden), смысл несут число и словесный грейд рядом.
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 45

function ScoreRing({ score, grade }: { score: number; grade: ReturnType<typeof scoreGrade> }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-40 w-40 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-outline-variant)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={
              grade === 'poor'
                ? 'stroke-[color:var(--color-critical)]'
                : grade === 'needs-work'
                  ? 'stroke-[color:var(--color-moderate)]'
                  : 'stroke-[color:var(--color-success)]'
            }
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - score / 100)}
          />
        </svg>
        <span className="absolute flex flex-col items-center">
          <span className="num text-5xl font-semibold tracking-tight">{score}</span>
          <span className="label mt-1 text-on-surface-variant">/100 points</span>
        </span>
      </div>
      <span className={`chip ${scoreGradeChipClass(grade)} mt-3`}>{scoreGradeLabel(grade)}</span>
    </div>
  )
}

// Раскладка по серьёзности — те же группы (различимые правила), что и список
// находок ниже, а не инстансы: сайт с 50 повторами одного правила не должен
// выглядеть тяжелее сайта с пятью разными проблемами (тот же принцип дедупа,
// что в score/effort).
function SeverityBreakdown({ groups }: { groups: FindingGroup[] }) {
  const rows = (['critical', 'serious', 'moderate', 'minor'] as const)
    .map((impact) => ({ impact, n: groups.filter((g) => g.impact === impact).length }))
    .filter((r) => r.n > 0)
  if (rows.length === 0) return null
  return (
    <div className="w-full">
      <p className="label text-on-surface-variant">Distinct rules</p>
      <ul className="mt-2 space-y-1.5">
        {rows.map(({ impact, n }) => (
          <li key={impact} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: IMPACT_BORDER_VAR[impact] }}
              />
              {impactLabel(impact)}
            </span>
            <span className="num font-semibold">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Сколько карточек показываем до нажатия «Show remaining». 6 — весь первый
// экран списка на десктопе; остальное схлопнуто, чтобы отчёт с 30 правилами
// не превращался в стену, но НИЧЕГО не прятал за платой (D-114: находки
// бесплатны целиком, кнопка раскрывает их тут же, без единого условия).
const VISIBLE_FINDINGS = 6

type SeverityFilter = 'all' | ScanFinding['impact']

function FindingsSection({
  report,
  groups,
  planPanel,
  unlock,
}: {
  report: ScanReport
  groups: FindingGroup[]
  planPanel: PlanPanelState
  unlock: Unlock
}) {
  const [filter, setFilter] = useState<SeverityFilter>('all')
  const [showAll, setShowAll] = useState(false)
  const listId = useId()

  const criticalCount = groups.filter((g) => g.impact === 'critical').length
  const seriousCount = groups.filter((g) => g.impact === 'serious').length
  // Табов ровно столько, сколько имеет смысл: фильтр, который гарантированно
  // даёт пустой список, не показывается вовсе (тот же порог, что у фасетов
  // FilterableList — пустые чипы скрыты, а не задизейблены).
  const filters = (
    [
      { key: 'critical', label: 'Critical', n: criticalCount },
      { key: 'serious', label: 'Serious', n: seriousCount },
      { key: 'all', label: 'All', n: groups.length },
    ] as { key: SeverityFilter; label: string; n: number }[]
  ).filter((f) => f.n > 0)

  const filtered = filter === 'all' ? groups : groups.filter((g) => g.impact === filter)
  const visible = showAll ? filtered : filtered.slice(0, VISIBLE_FINDINGS)
  const remaining = filtered.length - visible.length

  return (
    <section className="mt-10">
      <h2 className="h2 mt-0">Detailed findings</h2>
      <p className="lede">
        Every issue this scan found, most severe first. Findings are free and complete — what the
        paid plan adds is the fix for each one.
      </p>

      {filters.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter findings by severity">
          {filters.map((f) => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(f.key)
                  setShowAll(false)
                }}
                aria-label={`${f.label}: ${f.n} finding${f.n === 1 ? '' : 's'}`}
                className={`inline-flex min-h-[36px] items-center gap-2 rounded-lg border px-3.5 font-mono text-[11px] font-medium tracking-[0.05em] uppercase transition ${
                  active
                    ? 'border-transparent bg-primary text-on-primary'
                    : 'border-outline-variant bg-surface text-on-surface-variant hover:border-outline'
                }`}
              >
                <span aria-hidden="true">
                  {f.label} (<span className="num">{f.n}</span>)
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Смена фильтра/раскрытия не двигает фокус и визуально меняет список
          ниже — для скринридера это молчаливая перестановка, поэтому итог
          объявляется явно. */}
      <p className="sr-only" role="status">
        Showing {visible.length} of {groups.length} findings
      </p>

      <ul id={listId} className="mt-6 space-y-4">
        {visible.map((g) => (
          <FindingGroupCard key={g.ruleId} group={g} report={report} planPanel={planPanel} unlock={unlock} />
        ))}
      </ul>

      {(remaining > 0 || showAll) && filtered.length > VISIBLE_FINDINGS && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          aria-controls={listId}
          className="btn-ghost mt-5"
        >
          {showAll ? 'Show fewer findings' : `Show remaining ${remaining}`}
        </button>
      )}
    </section>
  )
}

// A4-REPORT-CHECKLIST (D-130): always renders — uncoveredRows() is static
// site data, not scan-dependent (unlike everything else on this page). ~19
// rows (50 - 31 per /methodology/'s own coverage numbers) is too many to
// leave permanently expanded above the findings/plan below, so the list sits
// inside the shared Accordion primitive (D-068) rather than a hand-rolled
// disclosure. A single-item Accordion is a clean fit: the item's own heading
// (h3, nested correctly under this section's h2) doubles as the disclosure
// trigger, and its panel already ships the right ARIA (aria-expanded/
// aria-controls, region+aria-labelledby) — no new pattern to invent or audit.
function CheckYourselfSection() {
  return (
    <section className="mt-10">
      <h2 className="h2 mt-0">Check these yourself</h2>
      <p className="lede">
        Automated scanning has real limits — some checks need a human to judge, not a machine to
        detect (does this heading actually describe the section, is this alt text meaningful). These{' '}
        {UNCOVERED_ROWS.length} WCAG criteria are outside what any automated scanner, including this
        one, can check. Review them yourself, or have a specialist do it as part of the plan below.
      </p>
      <div className="mt-4 max-w-2xl">
        <Accordion
          headingLevel={3}
          items={[
            {
              title: `Show all ${UNCOVERED_ROWS.length} criteria`,
              content: (
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {UNCOVERED_ROWS.map((r) => (
                    <li key={r.clause}>
                      <span className="num">{r.wcag}</span> {r.title}
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      </div>
      <p className="mt-3 text-sm text-on-surface-variant">
        Full reference:{' '}
        <Link className="underline underline-offset-2" to={paths.wcag()}>
          what our scanner can and can't check
        </Link>
        .
      </p>
    </section>
  )
}

// A4-REPORT-BRIEF (D-130): plain-language summary that states the problem
// from numbers already computed above (never a second count), states scope
// QUALITATIVELY via SCOPE_PHRASE (never a duration — see the note at that
// constant's definition), and pitches the free lead in the report's existing
// honest, non-alarmist tone (R1 — no invented urgency, no legal-threat
// language beyond what's already stated elsewhere on this page, e.g. the
// jurisdictionNote blocks above). Only mounted when cost is non-null (see
// call site) — a clean scan has nothing to summarize, same rubric
// estimateCost() itself uses to return null.
function ReportBrief({
  report,
  groups,
  cost,
}: {
  report: ScanReport
  groups: FindingGroup[]
  cost: CostEstimate
}) {
  const criticalCount = groups.filter((g) => g.impact === 'critical').length
  const seriousCount = groups.filter((g) => g.impact === 'serious').length
  const severityPhrase = [
    criticalCount > 0 ? `${criticalCount} critical` : null,
    seriousCount > 0 ? `${seriousCount} serious` : null,
  ]
    .filter(Boolean)
    .join(' and ')
  // Same top-priority pick LockedPlanPanel's teaser already uses above
  // (groups[0], the highest-impact rule, same sort as Findings) — not a
  // second "find the worst issue" implementation.
  const top = groups[0]

  return (
    <div className="h-full rounded-2xl bg-[color:var(--color-primary)] p-6 text-[color:var(--color-on-primary)] sm:p-8">
      <h2 className="h2 mt-0 text-[color:var(--color-on-primary)]">The short version</h2>
      <p className="mt-2 max-w-prose text-sm text-[color:var(--color-on-primary)]/90">
        This scan found {report.findings.length} issue instance{report.findings.length === 1 ? '' : 's'} across{' '}
        {groups.length} distinct rule{groups.length === 1 ? '' : 's'}
        {severityPhrase && <> — {severityPhrase}</>}. The single biggest priority:{' '}
        {impactLabel(top.impact).toLowerCase()} issue <span className="font-mono">{top.ruleId}</span>. Fixing
        everything here is {SCOPE_PHRASE[cost.band]} — we won't put a timeline on that, since it depends on your
        codebase and team, not on us.
      </p>
      <p className="mt-4 max-w-prose text-sm text-[color:var(--color-on-primary)]/90">
        You don't have to do this yourself. Send this report to matching agencies from our real catalog and get
        quotes — free, no obligation, and it's the same free branch that unlocks your full PDF plan at no cost.
      </p>
      <Link
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[color:var(--color-on-primary)] px-5 py-2.5 font-mono text-[11px] font-medium tracking-[0.05em] uppercase text-[color:var(--color-primary)]"
        to={`${paths.requestQuote()}?scanId=${encodeURIComponent(report.id)}`}
      >
        Request a quote →
      </Link>
    </div>
  )
}

// A2-REPORT-PAYWALL: owner-approved paywall layout (variant 1). Findings stay
// fully open above this (HANDOFF "Воронка", reconfirmed D-114 after the NYT
// paywall reference, reconfirmed a third time in D-143) — only the PDF *plan*
// is gated. Which panel to show is a pure decision (decidePlanPanel,
// src/lib/scanner.ts, unit-tested) — computed once in ReportBody and passed
// down, because the hero CTA and every finding card need the same answer.
function RemediationPlanPanel({
  report,
  groups,
  planPanel,
  unlock,
}: {
  report: ScanReport
  groups: FindingGroup[]
  planPanel: PlanPanelState
  unlock: Unlock
}) {
  if (planPanel === 'hidden') return null

  if (planPanel === 'unlocked') {
    return (
      <section className="mt-10">
        <h2 className="h2 mt-0">Your remediation plan</h2>
        {/* Same success-panel pattern as the "no issues found" block above
            (rounded border/soft-bg, no .card) — .card's hover:border-outline
            would otherwise fight this border's semantic success color. */}
        <div className="rounded-2xl border border-[color:var(--color-success-border)] bg-[color:var(--color-success-soft)] p-5">
          <p className="font-semibold text-[color:var(--color-success)]">Your plan is ready</p>
          <p className="mt-1.5 max-w-prose text-sm text-on-surface-variant">
            Priorities, legal context, an effort estimate and a developer brief — all built from
            this scan.
          </p>
          <a className="btn mt-5" href={scanPdfUrl(report.id)} target="_blank" rel="noreferrer">
            Download plan (PDF)
          </a>
        </div>
      </section>
    )
  }

  // planPanel === 'locked'
  // Teaser copy below is built entirely from real fields of `groups[0]` (the
  // highest-priority group — same impact sort the Findings list above already
  // uses) — nothing about the fix itself is invented (D-035/D-045: no field
  // without a source).
  const top = groups[0]
  const pagesAffected = new Set(top.instances.map((f) => f.page)).size

  return (
    <section className="mt-10">
      <h2 className="h2 mt-0">Your remediation plan</h2>
      <div className="card">
        <p className="max-w-prose text-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">Fix this first: </span>
          {impactLabel(top.impact).toLowerCase()} issue <span className="font-mono">{top.ruleId}</span>, found{' '}
          {top.instances.length} time{top.instances.length === 1 ? '' : 's'} across {pagesAffected} page
          {pagesAffected === 1 ? '' : 's'}. It's ranked first because it's the most severe class of problem this
          scan found — severe issues are the ones most likely to stop someone from using your site at all. The
          full plan orders every issue this way, adds the legal basis where one applies, an effort estimate, and
          a brief you can hand straight to a developer.
        </p>

        {/* Decorative skeleton standing in for the locked plan body. This is
            NOT a CSS blur over real text (D-114: obscured-but-still-in-the-DOM
            text would be readable via view-source and by a screen reader —
            unacceptable for an accessibility product). These bars carry no
            content at all — the real plan text lives only in the PDF, behind
            the server-side gate in worker/routes/scanPdf.js. aria-hidden so a
            screen reader doesn't announce empty decoration. */}
        <div className="relative mt-5 overflow-hidden rounded-lg" aria-hidden="true">
          <div className="space-y-3 p-4">
            <div className="h-3 w-11/12 rounded-full bg-outline-variant/50" />
            <div className="h-3 w-full rounded-full bg-outline-variant/50" />
            <div className="h-3 w-4/5 rounded-full bg-outline-variant/50" />
            <div className="h-3 w-full rounded-full bg-outline-variant/50" />
            <div className="h-3 w-3/5 rounded-full bg-outline-variant/50" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-container-low to-transparent" />
        </div>

        <div className="mt-6 flex flex-wrap items-baseline gap-2">
          <span className="num text-3xl font-bold tracking-tight">€19.99</span>
          <span className="text-sm text-on-surface-variant">one-time, for this scan</span>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-on-surface-variant">
          <li>Every issue type found, ordered by priority</li>
          <li>Which law applies to your site, and why</li>
          <li>An effort estimate for each fix</li>
          <li>A ready brief for your developer</li>
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={unlock.start}
            disabled={unlock.loading}
            className="btn disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant"
          >
            {unlock.loading ? 'Redirecting…' : 'Get the plan — €19.99'}
          </button>
          <Link
            className="btn-ghost"
            to={`${paths.requestQuote()}?scanId=${encodeURIComponent(report.id)}`}
          >
            Have a specialist do it — plan free
          </Link>
        </div>
        {/* Исход оплаты (503 «карта ещё не подключена» / неожиданный сбой)
            рассказывает тост — см. usePlanUnlock. */}

        <p className="mt-5 max-w-prose text-xs text-on-surface-variant">
          An estimate for planning, not a compliance certificate or legal advice.
        </p>
      </div>
    </section>
  )
}

const IMPACT_BORDER_VAR: Record<string, string> = {
  critical: 'var(--color-critical)',
  serious: 'var(--color-serious)',
  moderate: 'var(--color-moderate)',
  minor: 'var(--color-minor)',
}

// Иконка замка — своя stroke-SVG (§29/design.md: один икон-стиль, никаких
// иконочных шрифтов с CDN). Декоративная: смысл несёт текст рядом.
function LockIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.25" y="7" width="9.5" height="6.75" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" />
    </svg>
  )
}

// D-143 ЗАМОК-ТИЗЕР вместо макетного блока «Solution». Макет владельца показывал
// готовое решение прямо в карточке — это ровно то, за что продукт берёт деньги
// (D-114/D-131), поэтому здесь стоит честный замок со ссылкой на тот же самый
// флоу разблокировки, что и главная CTA. Никакого «размытого текста»: ни одной
// буквы инструкции в DOM нет вовсе (help/helpUrl/failureSummary на эту страницу
// не приходят даже в пропсах — см. publicRuleInfo).
function FixTeaser({
  report,
  planPanel,
  unlock,
}: {
  report: ScanReport
  planPanel: PlanPanelState
  unlock: Unlock
}) {
  if (planPanel === 'unlocked') {
    return (
      <p className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--color-success-border)] bg-[color:var(--color-success-soft)] px-3 py-2 text-sm text-on-surface-variant">
        <span className="text-[color:var(--color-success)]">
          <LockIcon />
        </span>
        How to fix this is in your PDF plan.{' '}
        <a
          className="font-medium text-[color:var(--color-primary)] underline underline-offset-2"
          href={scanPdfUrl(report.id)}
          target="_blank"
          rel="noreferrer"
        >
          Download it
        </a>
      </p>
    )
  }
  if (planPanel === 'hidden') return null
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-container px-3 py-2.5">
      <p className="flex items-center gap-2 text-sm text-on-surface-variant">
        <LockIcon />
        How to fix this — included in the paid remediation plan
      </p>
      <button
        type="button"
        onClick={unlock.start}
        disabled={unlock.loading}
        className="btn-ghost disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-on-surface-variant"
      >
        {unlock.loading ? 'Redirecting…' : 'Unlock — €19.99'}
      </button>
    </div>
  )
}

function FindingGroupCard({
  group: g,
  report,
  planPanel,
  unlock,
}: {
  group: FindingGroup
  report: ScanReport
  planPanel: PlanPanelState
  unlock: Unlock
}) {
  const [expanded, setExpanded] = useState(false)
  const first = g.instances[0]
  const info = publicRuleInfo(g.ruleId)
  const pagesAffected = new Set(g.instances.map((f) => f.page)).size
  // Уровень соответствия (wcag2a/wcag21aa) — это НЕ номер критерия: теги
  // критериев уводятся в ссылку на страницу критерия, а версия/уровень
  // остаются чипом. Разделение по той же регулярке, что formatWcagTag.
  const levelTags = g.wcag.filter((t) => /^wcag(2|21|22)(a|aa|aaa)$/.test(t))
  // Собственные проверки воркера пишут в html человеческую фразу, а не
  // фрагмент разметки («no accessibility feedback channel … found») — код
  // показываем как код только когда это действительно код.
  const htmlIsMarkup = !!first?.html && first.html.trimStart().startsWith('<')

  return (
    <li
      className="card relative overflow-hidden border-l-4 pl-5"
      style={{ borderLeftColor: IMPACT_BORDER_VAR[g.impact] }}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">
            {info.title ?? <span className="font-mono">{g.ruleId}</span>}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Severity — семантические токены (CN-TOKENS, §27), не акцент
                бренда: акцент зарезервирован за интерактивом/evidence.
                Цвет никогда не единственный носитель — метка текстом. */}
            <span className={`chip chip-${g.impact}`}>{impactLabel(g.impact)}</span>
            <span className="font-mono text-sm text-on-surface-variant">{g.ruleId}</span>
            {levelTags.map((tag) => (
              <span key={tag} className="chip">
                {formatWcagTag(tag)}
              </span>
            ))}
          </div>
          {/* Короткое описание — только из уже опубликованных данных сайта:
              что делает НАША проверка (та же строка, что на /wcag/), либо
              честная констатация, что правило вне главы 9. Ни одной подсказки
              axe-core «как чинить» (D-131). */}
          {info.ours ? (
            <p className="mt-3 max-w-prose text-sm text-on-surface-variant">
              Our own browser check <span className="font-mono">{g.ruleId}</span> {info.ours}.
              {info.caveat && <> Honest limitation: {info.caveat}.</>}
            </p>
          ) : info.page ? (
            <p className="mt-3 max-w-prose text-sm text-on-surface-variant">
              Automated rule <span className="font-mono">{g.ruleId}</span> failed here — it tests WCAG{' '}
              <span className="num">{info.page.row.wcag}</span> {info.page.row.title.toLowerCase()}.
            </p>
          ) : info.basis ? (
            /* Правило вне главы 9 EN 301 549 — называть его «best practice»
               было бы неверно: основание нормативное, и оно приходит из того
               же места, что в PDF-плане (BEYOND_STANDARD_INFO). */
            <p className="mt-3 max-w-prose text-sm text-on-surface-variant">
              Our own check <span className="font-mono">{g.ruleId}</span> — outside chapter 9 of EN 301 549, so it
              has no WCAG number. Basis: {info.basis}.
            </p>
          ) : (
            <p className="mt-3 max-w-prose text-sm text-on-surface-variant">
              Automated best-practice rule <span className="font-mono">{g.ruleId}</span> — it isn't tied to a
              single WCAG success criterion, but it points at a real barrier.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className="chip">
            Found on <span className="num">{pagesAffected}</span> page{pagesAffected === 1 ? '' : 's'}
          </span>
          {info.page && (
            <Link
              className="text-sm font-medium text-[color:var(--color-primary)] underline underline-offset-2"
              to={paths.wcagCriterion(info.page.slug)}
            >
              WCAG <span className="num">{info.page.row.wcag}</span> →
            </Link>
          )}
        </div>
      </div>

      {/* Первый инстанс — реальный HTML-фрагмент со страницы (f.html), а не
          выдуманный пример: то же поле, что воркер уже пишет в findings
          (worker/lib/axe.js). */}
      {first?.html && (
        <div className="mt-4">
          <p className="label text-on-surface-variant">{htmlIsMarkup ? 'Problematic code' : 'What we found'}</p>
          <pre className="mt-1.5 overflow-x-auto rounded-lg border border-outline-variant bg-surface p-3 font-mono text-xs text-on-surface-variant">
            <code>{first.html}</code>
          </pre>
        </div>
      )}

      {/* Правовая пометка приходит только на находки об отсутствующем
          заявлении о доступности и только в юрисдикции, где оно
          подтверждённо обязательно (D-030/D-031). Формулировка воркера уже
          осторожна — суммы штрафов попадают в текст только если сверены с
          законом.

          Вторая строка — константа, а не данные из API: факт гармонизации
          одинаков для всех юрисдикций, тащить его через воркер незачем.
          Сверено с текстом Directive (EU) 2019/882 (D-033): требования
          гармонизированы (EN 301 549), а надзор — нет; механизма «одного
          окна» как в GDPR ст. 56 в EAA не существует. Одна честная строка
          вместо перечня из 12 статей — осознанный выбор владельца против
          fear-marketing (R1). a11y-statement-missing и -incomplete
          взаимоисключающи (см. axe.js), поэтому блок не может
          продублироваться. */}
      {g.jurisdictionNote && (
        <div className="mt-4 rounded-lg border border-[color:var(--color-moderate-border)] bg-[color:var(--color-moderate-soft)] px-3 py-2 text-sm text-[color:var(--color-moderate)]">
          <p>
            <span className="font-medium">Legal basis:</span> {g.jurisdictionNote}
          </p>
          <p className="mt-1.5 text-xs text-[color:var(--color-moderate)]">
            Accessibility requirements are harmonised across the EU by EN 301 549, so this
            finding reads the same in every EU market. Enforcement is not centralised: under
            Directive (EU) 2019/882 each country supervises services provided in its own
            territory through its national transposition — there is no EU-level authority and
            no one-stop-shop.
          </p>
          {/* D-034: без этой оговорки мы пугали бы штрафом бизнес, который
              по закону вообще вне режима. Art. 4(5) директивы — исключение
              микропредприятий действует во ВСЕХ странах ЕС одинаково,
              поэтому это константа UI, а не поле юрисдикции. */}
          {/* D-035: сумм штрафов не показываем нигде и никогда — причины
              в шапке worker/lib/jurisdiction.js. Оговорка про scope
              остаётся: без неё мы называли бы «обязанностью» то, от чего
              конкретный бизнес освобождён самой директивой. */}
          <p className="mt-1.5 text-xs text-[color:var(--color-moderate)]">
            <span className="font-medium">Scope:</span> microenterprises — fewer than 10 staff
            and no more than €2M annual turnover or balance sheet — are exempt from the EAA's
            service requirements under Article 4(5), so a small business may fall outside this
            regime entirely. We deliberately do not quote penalty figures: they depend on
            circumstances we cannot see from a scan. This report is not legal advice.
          </p>
          {/* D-041: конец цепочки, ради которой правовая пометка вообще
              существует. Германия — единственная юрисдикция, где ссылка
              сверена с первоисточником И где у нас есть прюферы, названные
              в опубликованных декларациях; поэтому путь есть только для DE,
              а не выдуман для всех. Условие идёт по коду страны, а не по
              разбору текста заметки (см. scanner.ts). */}
          {g.jurisdictionCountry === 'DE' && (
            <p className="mt-2 text-xs">
              <a
                className="font-medium underline underline-offset-2"
                href={paths.bfsgCheck()}
                lang="de"
              >
                Auf Deutsch: was Anlage 3 zu § 14 BFSG verlangt — und welche Prüfer in
                veröffentlichten Erklärungen namentlich genannt sind →
              </a>
            </p>
          )}
        </div>
      )}

      {g.instances.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 inline-flex min-h-[24px] items-center gap-1 text-sm font-medium text-[color:var(--color-primary)] underline underline-offset-2"
            aria-expanded={expanded}
          >
            {expanded ? 'Hide instances' : `View all ${g.instances.length} instances`}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
              {g.instances.map((f, i) => (
                <li key={i} className="truncate">
                  {f.page} — <code className="text-xs">{f.selector}</code>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        first && (
          <p className="mt-4 truncate text-sm text-on-surface-variant">
            {first.page} — <code className="text-xs">{first.selector}</code>
          </p>
        )
      )}

      <FixTeaser report={report} planPanel={planPanel} unlock={unlock} />
    </li>
  )
}
