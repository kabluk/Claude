// CN-SCAN-STREAM (конституция §10): deploy-подобный поток состояний скана.
//
// ЖЁСТКОЕ правило: шаги строятся ТОЛЬКО из полей, которые воркер реально пишет
// в D1 и отдаёт через GET /api/scan/:id (worker/lib/db.js::getScan,
// INTERFACES.md §3): status 'running'|'done'|'error', createdAt, completedAt,
// pages, findings, errorCode. Пофазного прогресса (statement/feedback/
// DOM-checks/axe по страницам) контракт НЕ отдаёт: pages_json/findings_json
// пишутся одним UPDATE при завершении (completeScan), промежуточных записей
// нет. Поэтому шага три — и ни одним больше.
//
// Фейковые таймеры вида «Checking semantic structure…», не привязанные к
// реальному состоянию воркера, — это выдумывание данных в UI, тот же класс
// запрета, что D-035/D-045 для данных каталога. Настоящий пофазный стрим —
// отдельный узел CN-SCAN-PHASES в GRAPH.yaml: требует изменения контракта
// API + деплоя воркера (деплой = решение владельца, D-022).

import type { ScanReport } from './scanner'

export type StreamStepStatus = 'done' | 'active' | 'failed' | 'pending'

export type StreamStep = {
  id: 'requested' | 'scanning' | 'report'
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

export function scanStreamSteps(report: ScanReport): StreamStep[] {
  const { status } = report

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
