import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ScanStream } from '@/components/ScanStream'
import { paths } from '@/lib/data'
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
  type ScanReport,
} from '@/lib/scanner'
import { estimateCost, formatCostEstimate } from '@/lib/costEstimate'
import { decidePollNext, type PollAttempt } from '@/lib/reportPolling'
import { MatchedAgencies } from '@/components/MatchedAgencies'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'not-found' }
  | { kind: 'load-error'; message: string }
  | { kind: 'report'; report: ScanReport }

// Отчёт существует только по прямой ссылке (id непредсказуем, генерируется
// Worker'ом) — не в getStaticPaths, попадает под клиентский catch-all
// routes.tsx (не пререндерится, но подхватывается после гидратации).
export default function ReportPage() {
  const { id } = useParams()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

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

      {state.kind === 'report' && <ReportBody report={state.report} />}
    </Layout>
  )
}

function ReportBody({ report }: { report: ScanReport }) {
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
  const uniquePages = report.pages.length
  const cost = estimateCost(report.findings)
  // Кольцо-визуализация (D-107, макет владельца): длина окружности постоянна
  // (r=45 → 2πr≈282.7), меняется только dashoffset — 0 при 100/100 (кольцо
  // закрыто целиком), полная окружность при 0 (кольцо пустое). score может
  // быть null (тип ScanReport допускает старые записи без него, scanner.ts) —
  // тогда кольцо не рисуем вовсе, а не показываем «0/100» мимо реального грейда.
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 45
  const grade = report.score != null ? scoreGrade(report.score) : null

  return (
    <div>
      <h1 className="h1">Accessibility report for {report.url}</h1>
      <p className="num mt-1 text-on-surface-variant">
        {uniquePages} page{uniquePages === 1 ? '' : 's'} scanned · {report.findings.length} issue instance
        {report.findings.length === 1 ? '' : 's'} across {groups.length} distinct rule{groups.length === 1 ? '' : 's'}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Score — 2 колонки на широком экране, как в макете владельца (Stitch). */}
        <div className="card flex flex-col justify-between gap-8 sm:flex-row sm:items-center lg:col-span-2">
          <div>
            <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
              Overall score
            </span>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className="num text-6xl font-bold tracking-tight">{report.score ?? '—'}</span>
              <span className="num text-xl text-on-surface-variant">/ 100</span>
              {/* Грейд текстом рядом с числом (не только цветом кольца) —
                  тот же принцип «цвет не единственный носитель», что и у
                  severity-чипов находок ниже. */}
              {grade && <span className={`chip ${scoreGradeChipClass(grade)}`}>{scoreGradeLabel(grade)}</span>}
            </div>
            <p className="mt-3 max-w-prose text-xs text-on-surface-variant">
              This score is a rough heuristic for comparing pages over time — it is not a
              certification of WCAG conformance and does not constitute legal advice. A
              clean automated scan does not guarantee full accessibility; manual review by
              a qualified auditor is still required.{' '}
              <a className="underline underline-offset-2" href={paths.methodology()}>
                See exactly what this scan covers
              </a>
              .
            </p>
          </div>
          {grade && report.score != null && (
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center self-center sm:self-auto" aria-hidden="true">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
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
                  strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - report.score / 100)}
                />
              </svg>
              <span className="absolute text-sm font-semibold">{scoreGradeLabel(grade)}</span>
            </div>
          )}
        </div>

        {cost && (
          <div className="card flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                Remediation estimate
              </span>
              <div className="num mt-3 text-4xl font-bold tracking-tight">{formatCostEstimate(cost)}</div>
              <p className="mt-3 text-xs text-on-surface-variant">
                A rough estimate based on the number and severity of issues found here — not a
                quote or an offer. Actual cost depends on your codebase, team, and how the fixes
                are made.
              </p>
            </div>
            <Link
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-primary)] underline underline-offset-2"
              to={paths.agencies()}
            >
              Compare agencies for a real quote →
            </Link>
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        /* Success-состояние (§37): семантический токен + следующий шаг, не тупик.
           Честная оговорка остаётся — чистый автоскан ≠ полная доступность. */
        <div className="mt-8 max-w-2xl rounded-xl border border-[color:var(--color-success-border)] bg-[color:var(--color-success-soft)] p-5">
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
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="h2 mt-0">Findings</h2>
            {/* Сводка серьёзности рядом с заголовком (макет владельца) — те же
                числа, что уже есть в groups, просто агрегированы по impact.
                Считаем ГРУППЫ (различимые правила), не инстансы — тот же
                принцип дедупа, что и everywhere в отчёте (effortScore и т.д.),
                иначе один экран с 50 инстансами одного правила выглядел бы
                серьёзнее сайта с 5 разными проблемами. */}
            <div className="flex flex-wrap gap-2">
              {(['critical', 'serious', 'moderate', 'minor'] as const).map((impact) => {
                const n = groups.filter((g) => g.impact === impact).length
                return n > 0 ? (
                  <span key={impact} className={`chip chip-${impact}`}>
                    {n} {impactLabel(impact)}
                  </span>
                ) : null
              })}
            </div>
          </div>
          <ul className="mt-6 space-y-4">
            {groups.map((g) => (
              <FindingGroupCard key={g.ruleId} group={g} />
            ))}
          </ul>
        </section>
      )}

      <RemediationPlanPanel report={report} groups={groups} />

      <MatchedAgencies findings={report.findings} priceBand={cost?.band} scanId={report.id} />

      {/* Замена «Book a call» из макета владельца (Stitch): бронирования звонков
          у нас нет и не выдумываем — ведёт на РЕАЛЬНЫЙ /request-quote/ (тот же
          путь, что и текстовая ссылка внутри MatchedAgencies чуть выше), просто
          с визуальным весом, каким в макете был контакт с «экспертом». */}
      <div className="mt-8 rounded-3xl bg-[color:var(--color-primary)] p-8 text-[color:var(--color-on-primary)]">
        <h3 className="text-lg font-bold">Want someone else to fix this?</h3>
        <p className="mt-2 max-w-prose text-sm text-[color:var(--color-on-primary)]/80">
          Send this report to matching agencies from our catalog and get quotes — no obligation.
        </p>
        <Link
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-on-primary)] px-5 py-2.5 text-sm font-bold text-[color:var(--color-primary)]"
          to={`${paths.requestQuote()}?scanId=${encodeURIComponent(report.id)}`}
        >
          Request a quote →
        </Link>
      </div>
    </div>
  )
}

// A2-REPORT-PAYWALL: owner-approved paywall layout (variant 1). Findings stay
// fully open above this (HANDOFF "Воронка", reconfirmed D-114 after the NYT
// paywall reference) — only the PDF *plan* is gated. Which panel to show is a
// pure decision (decidePlanPanel, src/lib/scanner.ts, unit-tested) — this
// component only renders the outcome.
function RemediationPlanPanel({
  report,
  groups,
}: {
  report: ScanReport
  groups: ReturnType<typeof groupFindingsByRule>
}) {
  const panel = decidePlanPanel(report, groups.length)
  if (panel === 'hidden') return null

  if (panel === 'unlocked') {
    return (
      <section className="mt-10">
        <h2 className="h2 mt-0">Your remediation plan</h2>
        {/* Same success-panel pattern as the "no issues found" block above
            (rounded-xl border/soft-bg, no .card) — .card's hover:border-outline
            would otherwise fight this border's semantic success color. */}
        <div className="rounded-xl border border-[color:var(--color-success-border)] bg-[color:var(--color-success-soft)] p-5">
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

  // panel === 'locked'. Teaser copy below is built entirely from real fields
  // of `groups[0]` (the highest-priority group — same impact sort the
  // Findings list above already uses) — nothing about the fix itself is
  // invented (D-035/D-045: no field without a source).
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
            disabled
            aria-describedby="plan-payment-note"
            className="btn disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant"
          >
            Get the plan — €19.99
          </button>
          <Link
            className="btn-ghost"
            to={`${paths.requestQuote()}?scanId=${encodeURIComponent(report.id)}`}
          >
            Have a specialist do it — plan free
          </Link>
        </div>
        <p id="plan-payment-note" className="mt-2 text-xs text-on-surface-variant">
          Card payment coming soon.
        </p>

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
// Фон счётчика инстансов — готовые -soft токены (styles.css), не самодельный
// color-mix: первая версия (18% примеси поверх --color-surface-container-low)
// давала критичному тексту контраст 4.30:1 — провал AA (нужно 4.5), поймано
// расчётом перед деплоем, а не аудитом постфактум. -soft токены уже
// откалиброваны для пары «свой текст поверх своего фона» (мин. 5.7:1 у всех
// четырёх, см. .chip-critical и т.д.) — переиспользуем их, а не изобретаем
// заново тот же расчёт с риском повторить ту же ошибку.
const IMPACT_SOFT_VAR: Record<string, string> = {
  critical: 'var(--color-critical-soft)',
  serious: 'var(--color-serious-soft)',
  moderate: 'var(--color-moderate-soft)',
  minor: 'var(--color-minor-soft)',
}

function FindingGroupCard({ group: g }: { group: ReturnType<typeof groupFindingsByRule>[number] }) {
  const [expanded, setExpanded] = useState(false)
  const first = g.instances[0]

  return (
    <li
      className="card relative overflow-hidden border-l-4 pl-6"
      style={{ borderLeftColor: IMPACT_BORDER_VAR[g.impact] }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Severity — семантические токены (CN-TOKENS, §27), не акцент
                бренда: акцент зарезервирован за интерактивом/evidence.
                Цвет никогда не единственный носитель — метка текстом. */}
            <span className={`chip chip-${g.impact}`}>{impactLabel(g.impact)}</span>
            <span className="font-mono text-sm text-on-surface-variant">{g.ruleId}</span>
          </div>
          {g.wcag.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {g.wcag.map((tag) => (
                <span key={tag} className="chip">
                  {formatWcagTag(tag)}
                </span>
              ))}
            </div>
          )}
        </div>
        <span
          className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={{ backgroundColor: IMPACT_SOFT_VAR[g.impact], color: IMPACT_BORDER_VAR[g.impact] }}
          title={`${g.instances.length} instance${g.instances.length === 1 ? '' : 's'}`}
        >
          {g.instances.length}
        </span>
      </div>

      {/* Первый инстанс — реальный HTML-фрагмент со страницы (f.html), а не
          выдуманный пример: то же поле, что воркер уже пишет в findings
          (worker/lib/axe.js), просто до этой правки нигде не показывалось. */}
      {first?.html && (
        <div className="mt-4 overflow-x-auto rounded-lg bg-surface-container-low p-3 font-mono text-xs text-on-surface-variant">
          <code className="whitespace-pre">{first.html}</code>
        </div>
      )}

      {/* Правовая пометка приходит только на находки об отсутствующем
                    заявлении о доступности и только в юрисдикции, где оно
                    подтверждённо обязательно (D-030/D-031). Формулировка
                    воркера уже осторожна — суммы штрафов попадают в текст
                    только если сверены с законом.

                    Вторая строка — константа, а не данные из API: факт
                    гармонизации одинаков для всех юрисдикций, тащить его через
                    воркер незачем. Сверено с текстом Directive (EU) 2019/882
                    (D-033): требования гармонизированы (EN 301 549), а надзор —
                    нет; механизма «одного окна» как в GDPR ст. 56 в EAA не
                    существует. Одна честная строка вместо перечня из 12 статей —
                    осознанный выбор владельца против fear-marketing (R1).
                    a11y-statement-missing и -incomplete взаимоисключающи
                    (см. axe.js), поэтому блок не может продублироваться. */}
                {g.jurisdictionNote && (
                  <div className="mt-2 rounded-md border border-[color:var(--color-moderate-border)] bg-[color:var(--color-moderate-soft)] px-3 py-2 text-sm text-[color:var(--color-moderate)]">
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
      {g.instances.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--color-primary)] underline underline-offset-2"
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
      )}
      {g.instances.length === 1 && first && (
        <p className="mt-4 truncate text-sm text-on-surface-variant">
          {first.page} — <code className="text-xs">{first.selector}</code>
        </p>
      )}
    </li>
  )
}
