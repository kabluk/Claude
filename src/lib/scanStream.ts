// CN-SCAN-STREAM (конституция §10): deploy-подобный поток состояний скана.
//
// ЖЁСТКОЕ правило: шаги строятся ТОЛЬКО из полей, которые воркер реально пишет
// в D1 и отдаёт через GET /api/scan/:id (worker/lib/db.js::getScan,
// INTERFACES.md §3): status 'running'|'done'|'error', createdAt, completedAt,
// pages, findings, errorCode — и, с CN-SCAN-PHASES (D-067), `progress`
// (phase + pagesDone/pagesTotal), когда воркер его реально отдаёт.
//
// Два честных режима:
// - progress есть (новый воркер, скан running) → реальные фазовые шаги;
// - progress нет (СТАРЫЙ задеплоенный воркер — деплой ждёт решения владельца,
//   D-022; старые записи; done/error) → трёхшаговый поток D-064.
// Фейковые таймеры, не привязанные к реальному состоянию воркера, по-прежнему
// запрещены — тот же класс запрета, что D-035/D-045.

import type { ScanPhase, ScanProgress, ScanReport } from './scanner'

export type StreamStepStatus = 'done' | 'active' | 'failed' | 'pending'

export type StreamStep = {
  id: 'requested' | 'scanning' | 'report' | 'discovering' | 'statement' | 'pages' | 'aggregating'
  label: string
  detail: string | null
  status: StreamStepStatus
}

// Человеческий формат длительности: '42s', '1m 05s'. Отрицательное (рассинхрон
// часов клиент/сервер) честно прижимается к нулю, а не показывается как мусор.
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

// Длительность завершённого скана считается ТОЛЬКО по серверным меткам
// (createdAt и completedAt пишет один и тот же воркер) — часы клиента здесь
// не участвуют, рассинхрона нет по построению.
function scanDuration(report: ScanReport): string | null {
  if (!report.completedAt) return null
  const ms = Date.parse(report.completedAt) - Date.parse(report.createdAt)
  return Number.isFinite(ms) ? formatElapsed(ms) : null
}

// CN-SCAN-PHASES (D-067): реальные фазовые шаги, когда воркер отдаёт progress.
// Порядок видимых шагов; axe и dom-checks чередуются по страницам и оба живут
// в одном видимом шаге 'pages' — иначе таймлайн прыгал бы туда-сюда.
const PHASE_TO_STEP: Record<ScanPhase, number> = {
  discovering: 0,
  statement: 1,
  axe: 2,
  'dom-checks': 2,
  aggregating: 3,
}

function statusFor(stepIndex: number, currentIndex: number): StreamStepStatus {
  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'active'
  return 'pending'
}

function phasedSteps(progress: ScanProgress): StreamStep[] {
  const current = PHASE_TO_STEP[progress.phase]
  const { pagesDone, pagesTotal } = progress
  // «Page N of M» — только когда воркер реально прислал оба счётчика.
  const pageCounter =
    pagesTotal != null && pagesDone != null
      ? `page ${Math.min(pagesDone + 1, pagesTotal)} of ${pagesTotal}`
      : null

  const pagesDetail =
    current < 2
      ? 'axe-core rules and browser checks (reflow, keyboard, media) on every visited page.'
      : current > 2
        ? `${pagesTotal != null ? pagesTotal : 'All'} page${pagesTotal === 1 ? '' : 's'} checked.`
        : progress.phase === 'axe'
          ? `Running axe-core rules — ${pageCounter ?? 'in progress'}.`
          : `Browser checks (reflow, keyboard, media, headings) — ${pageCounter ?? 'in progress'}.`

  return [
    {
      id: 'requested',
      label: 'Scan requested',
      detail: 'Accepted by the scanner — a headless browser is doing the work.',
      status: 'done',
    },
    {
      id: 'discovering',
      label: 'Discovering pages',
      detail:
        current === 0
          ? 'Loading the home page and picking up to 6 pages to scan — transactional pages first.'
          : pagesTotal != null
            ? `${pagesTotal} page${pagesTotal === 1 ? '' : 's'} selected — transactional pages first.`
            : 'Pages selected.',
      status: statusFor(0, current),
    },
    {
      id: 'statement',
      label: 'Accessibility statement & feedback channel',
      detail:
        current <= 1
          ? 'Looking for the accessibility statement and a way to report barriers — the first things a regulator checks.'
          : 'Checked.',
      status: statusFor(1, current),
    },
    {
      id: 'pages',
      label: 'Checking pages',
      detail: pagesDetail,
      status: statusFor(2, current),
    },
    {
      id: 'aggregating',
      label: 'Aggregating results',
      detail:
        current < 3
          ? 'Site-level checks, legal weighting and the score come last.'
          : 'Site-level checks (navigation consistency, multiple ways), legal weighting, score.',
      status: statusFor(3, current),
    },
    {
      id: 'report',
      label: 'Report',
      detail: 'Appears here as soon as the scan finishes — no reload needed.',
      status: 'pending',
    },
  ]
}

export function scanStreamSteps(report: ScanReport): StreamStep[] {
  const { status } = report

  // D-067: реальные фазы — только пока скан running И воркер их реально отдал.
  // done/error всегда сводятся к итоговому трёхшаговому виду (воркер стирает
  // прогресс при завершении; даже устаревший progress здесь игнорируется).
  if (status === 'running' && report.progress) return phasedSteps(report.progress)

  const requested: StreamStep = {
    id: 'requested',
    // Строка в D1 существует (иначе GET отдал бы 404) — значит, воркер принял
    // запрос и запустил работу. Это факт, а не предположение.
    label: 'Scan requested',
    detail: 'Accepted by the scanner — a headless browser is doing the work.',
    status: 'done',
  }

  const scanning: StreamStep = {
    id: 'scanning',
    label: 'Scanning site',
    detail:
      status === 'running'
        ? // Честно про гранулярность: воркер не отдаёт список страниц до конца
          // скана, поэтому «up to 6 pages» — это контракт (MAX_PAGES), а не
          // живой счётчик, которого у нас нет.
          'Visiting up to 6 pages live: accessibility statement, feedback channel, DOM checks and axe-core rules. Page-by-page progress is not reported by the scanner — the full report appears in one step below.'
        : status === 'done'
          ? (() => {
              const d = scanDuration(report)
              return d ? `Finished in ${d}.` : 'Finished.'
            })()
          : // status === 'error': короткая констатация здесь, полное объяснение
            // (scanErrorMessage) — в шаге ниже и в заголовке страницы.
            'The scan stopped before it could finish.',
    status: status === 'running' ? 'active' : status === 'done' ? 'done' : 'failed',
  }

  const reportStep: StreamStep = {
    id: 'report',
    label: 'Report',
    detail:
      status === 'done'
        ? `${report.pages.length} page${report.pages.length === 1 ? '' : 's'} scanned, ${report.findings.length} issue instance${report.findings.length === 1 ? '' : 's'} found.`
        : status === 'error'
          ? // Полный человеческий текст ошибки (scanErrorMessage) уже стоит в
            // заголовке страницы (ReportPage) — здесь не дублируем.
            'Not produced — the scan did not complete.'
          : 'Appears here as soon as the scan finishes — no reload needed.',
    status: status === 'done' ? 'done' : status === 'error' ? 'failed' : 'pending',
  }

  return [requested, scanning, reportStep]
}
