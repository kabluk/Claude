import { useEffect, useState } from 'react'
import { formatElapsed, scanStreamSteps, type StreamStep, type StreamStepStatus } from '@/lib/scanStream'
import type { ScanReport } from '@/lib/scanner'

// CN-SCAN-STREAM: вертикальный deploy-подобный поток шагов скана. Модель шагов
// (scanStream.ts) строится только из реальных полей GET /api/scan/:id — см.
// шапку того файла; здесь только отрисовка.
//
// Доступность:
// - статус шага никогда не передаётся одним цветом: у каждого индикатора своя
//   форма (галка/крест/кольцо/точка) плюс текст для скринридера (§27);
// - вращение спиннера — функциональный индикатор «идёт работа», при
//   prefers-reduced-motion: reduce снимается полностью (§35, .stream-spinner
//   в styles.css), остаётся статичное полукольцо;
// - тикающий elapsed НЕ находится в live-регионе: анонс каждой секунды —
//   шум для скринридера. Транзиции состояний анонсирует единый live-регион
//   в ReportPage.

const INDICATOR_BASE = 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2'

function StepIndicator({ status }: { status: StreamStepStatus }) {
  if (status === 'done') {
    return (
      <span
        className={`${INDICATOR_BASE} border-[color:var(--color-success-border)] bg-[color:var(--color-success-soft)]`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="var(--color-success)" strokeWidth="2">
          <path d="M2 6.5 5 9l5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span
        className={`${INDICATOR_BASE} border-[color:var(--color-critical-border)] bg-[color:var(--color-critical-soft)]`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="var(--color-critical)" strokeWidth="2">
          <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  if (status === 'active') {
    return (
      <span className={`${INDICATOR_BASE} border-transparent`} aria-hidden="true">
        <span className="stream-spinner h-5 w-5 rounded-full border-2 border-[color:var(--color-info-border)] border-t-[color:var(--color-primary)]" />
      </span>
    )
  }
  // pending
  return (
    <span className={`${INDICATOR_BASE} border-outline bg-surface`} aria-hidden="true">
      <span className="h-1.5 w-1.5 rounded-full bg-outline" />
    </span>
  )
}

// Текстовый дубль статуса для скринридера — цвет/форма не единственный носитель.
const STATUS_TEXT: Record<StreamStepStatus, string> = {
  done: 'completed',
  active: 'in progress',
  failed: 'failed',
  pending: 'waiting',
}

function StreamStepRow({ step, isLast, elapsed }: { step: StreamStep; isLast: boolean; elapsed: string | null }) {
  const labelColor =
    step.status === 'failed'
      ? 'text-[color:var(--color-critical)]'
      : step.status === 'pending'
        ? 'text-on-surface-variant'
        : 'text-[color:var(--color-on-surface)]'
  return (
    <li className="relative flex gap-3 pb-7 last:pb-0">
      {/* Соединительная линия таймлайна — чистая декорация, aria-hidden. */}
      {!isLast && (
        <span aria-hidden="true" className="absolute top-6 bottom-1 left-3 w-px -translate-x-1/2 bg-outline-variant" />
      )}
      <StepIndicator status={step.status} />
      <div className="min-w-0 pt-0.5">
        <p className={`text-sm font-semibold ${labelColor}`}>
          {step.label}
          <span className="sr-only"> — {STATUS_TEXT[step.status]}</span>
          {elapsed && (
            /* Реальное прошедшее время от серверного createdAt; вне live-региона,
               чтобы скринридер не читал каждый тик. */
            <span className="num ml-2 font-normal text-on-surface-variant">{elapsed}</span>
          )}
        </p>
        {step.detail && <p className="mt-1 max-w-prose text-sm text-on-surface-variant">{step.detail}</p>}
      </div>
    </li>
  )
}

export function ScanStream({ report }: { report: ScanReport }) {
  // Elapsed для активного шага: старт — серверный createdAt (переживает
  // перезагрузку страницы, в отличие от клиентского «с момента открытия»);
  // возможный рассинхрон часов клиента прижимается к нулю в formatElapsed,
  // а не показывается как отрицательный мусор.
  const running = report.status === 'running'
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [running])

  const createdMs = Date.parse(report.createdAt)
  const elapsed = running && Number.isFinite(createdMs) ? formatElapsed(now - createdMs) : null

  return (
    <ol className="mt-6 max-w-xl" aria-label="Scan progress">
      {scanStreamSteps(report).map((step, i, steps) => (
        <StreamStepRow
          key={step.id}
          step={step}
          isLast={i === steps.length - 1}
          elapsed={step.status === 'active' ? elapsed : null}
        />
      ))}
    </ol>
  )
}
