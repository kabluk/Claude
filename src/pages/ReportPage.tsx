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
  type ScanReport,
} from '@/lib/scanner'
import { estimateCost, formatCostEstimate } from '@/lib/costEstimate'
import { MatchedAgencies } from '@/components/MatchedAgencies'

const POLL_INTERVAL_MS = 2500

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

    async function poll() {
      try {
        const report = await fetchScan(id!)
        if (cancelled) return
        if (!report) {
          setState({ kind: 'not-found' })
          return
        }
        setState({ kind: 'report', report })
        if (report.status === 'running') {
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof ScannerUnavailableError) setState({ kind: 'unavailable' })
        else setState({ kind: 'load-error', message: err instanceof Error ? err.message : String(err) })
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

  return (
    <div>
      <h1 className="h1">Accessibility report for {report.url}</h1>
      <p className="num mt-1 text-on-surface-variant">
        {uniquePages} page{uniquePages === 1 ? '' : 's'} scanned · {report.findings.length} issue instance
        {report.findings.length === 1 ? '' : 's'} across {groups.length} distinct rule{groups.length === 1 ? '' : 's'}
      </p>

      <div className="mt-6 flex flex-wrap items-start gap-x-10 gap-y-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="num text-4xl font-bold">{report.score ?? '—'}</span>
            <span className="num text-on-surface-variant">/ 100</span>
          </div>
          <p className="mt-1 max-w-prose text-xs text-on-surface-variant">
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

        {cost && (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="num text-4xl font-bold">{formatCostEstimate(cost)}</span>
              <span className="text-on-surface-variant">estimated to fix</span>
            </div>
            <p className="mt-1 max-w-prose text-xs text-on-surface-variant">
              A rough estimate based on the number and severity of issues found here — not a
              quote or an offer. Actual cost depends on your codebase, team, and how the fixes
              are made.{' '}
              <a className="underline underline-offset-2" href={paths.agencies()}>
                Compare agencies for a real quote
              </a>
              .
            </p>
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
          <h2 className="h2 mt-0">Findings</h2>
          <ul className="space-y-3">
            {groups.map((g) => (
              <li key={g.ruleId} className="rounded-lg border border-outline-variant p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Severity — семантические токены (CN-TOKENS, §27), не акцент
                      бренда: акцент зарезервирован за интерактивом/evidence.
                      Цвет никогда не единственный носитель — метка текстом. */}
                  <span className={`chip chip-${g.impact}`}>{impactLabel(g.impact)}</span>
                  <span className="font-medium">{g.ruleId}</span>
                  <span className="num text-sm text-on-surface-variant">
                    {g.instances.length} instance{g.instances.length === 1 ? '' : 's'}
                  </span>
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
                <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                  {g.instances.slice(0, 5).map((f, i) => (
                    <li key={i} className="truncate">
                      {f.page} — <code className="text-xs">{f.selector}</code>
                    </li>
                  ))}
                  {g.instances.length > 5 && <li>… and {g.instances.length - 5} more</li>}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <MatchedAgencies findings={report.findings} priceBand={cost?.band} scanId={report.id} />
    </div>
  )
}
