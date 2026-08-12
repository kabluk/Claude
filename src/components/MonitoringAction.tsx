// A3-CRON-MONITORING-PAGES (D-139): общий каркас двух брендовых страниц —
// /monitoring/confirm и /monitoring/unsubscribe. Обе делают одно и то же:
// читают ?token= из URL, client-side зовут воркер (monitoring.ts) и показывают
// один из четырёх исходов — loading / success / error / нет токена. Разнятся
// только тексты и сам вызов, поэтому машина состояний живёт здесь, а страницы
// передают конфиг (тот же приём, что FilterableList под несколько шаблонов).
//
// Три вещи, которые здесь не украшение:
//   1. Токен читается ТОЛЬКО в useEffect (клиент), а не при рендере. Страница
//      пререндерится (vite-react-ssg, статический маршрут без ':'), и на сервере
//      токена нет — если бы состояние зависело от него при первом рендере,
//      SSR-разметка («нет токена») разошлась бы с первым клиентским рендером
//      («loading»), то есть hydration mismatch. Стартовое состояние 'working'
//      одинаково на сервере и на клиенте; token и результат приезжают в эффекте.
//   2. Живой регион смонтирован с первого рендера и пуст (тот же урок, что в
//      SubscribeForm/Toast): скринридер объявляет ИЗМЕНЕНИЯ региона, за которым
//      уже наблюдает, поэтому регион, появляющийся вместе с первым сообщением,
//      часто не читается вовсе.
//   3. Ошибка — не тупик (§38): каждый неуспех даёт путь вперёд (скан/каталог),
//      человеческим текстом, никогда кодом и никогда сырым ответом сервера.

import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { paths } from '@/lib/data'
import type { MonitoringErrorReason, MonitoringResult } from '@/lib/monitoring'

type ViewState =
  | { kind: 'working' }
  | { kind: 'no-token' }
  | { kind: 'success'; url: string | null }
  | { kind: 'error'; reason: MonitoringErrorReason }

export type MonitoringActionConfig = {
  // Сетевой вызов (confirmMonitoring / unsubscribeMonitoring из monitoring.ts).
  run: (token: string) => Promise<MonitoringResult>
  // Заголовок и текст на время ожидания ответа.
  workingHeading: string
  workingBody: string
  // Заголовок и рендер тела успеха; url — что мониторится/отписано (может быть null).
  successHeading: string
  renderSuccess: (url: string | null) => ReactNode
  // Заголовок ошибки + человеческий текст по коду (без кодов/статусов на экране).
  errorHeading: string
  errorBody: (reason: MonitoringErrorReason) => string
  // Заголовок и текст ветки «в ссылке нет токена» (ссылку открыли без ?token=).
  noTokenHeading: string
  noTokenBody: string
  // Односложная фраза статуса для sr-only live-региона (объявляется скринридеру).
  liveWorking: string
  liveSuccess: string
  liveError: string
}

export function MonitoringAction(config: MonitoringActionConfig) {
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<ViewState>({ kind: 'working' })

  useEffect(() => {
    let cancelled = false
    const token = searchParams.get('token')
    if (!token) {
      setState({ kind: 'no-token' })
      return
    }
    setState({ kind: 'working' })
    config.run(token).then((result) => {
      if (cancelled) return
      setState(
        result.kind === 'ok'
          ? { kind: 'success', url: result.url }
          : { kind: 'error', reason: result.reason },
      )
    })
    return () => {
      cancelled = true
    }
    // config identity is stable per page (module-scope object); token drives the
    // effect. Re-running only when the token changes is exactly right.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const liveMessage =
    state.kind === 'working'
      ? config.liveWorking
      : state.kind === 'success'
        ? config.liveSuccess
        : state.kind === 'error'
          ? config.liveError
          : ''

  return (
    <div className="mx-auto max-w-2xl">
      {/* Единый live-регион на все переходы (working → success/error): существует
          с первого рендера, поэтому смена статуса слышна скринридеру. */}
      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>

      {state.kind === 'working' && (
        <div>
          <h1 className="h1">{config.workingHeading}</h1>
          <p className="lede">{config.workingBody}</p>
        </div>
      )}

      {state.kind === 'success' && (
        <div className="rounded-xl border border-[color:var(--color-success-border)] bg-[color:var(--color-success-soft)] p-6">
          <h1 className="h1 mt-0 text-[color:var(--color-success)]">{config.successHeading}</h1>
          <div className="lede mt-2 text-on-surface">{config.renderSuccess(state.url)}</div>
          <p className="mt-6">
            <Link className="btn" to={paths.scan()}>
              Scan another site
            </Link>
          </p>
        </div>
      )}

      {state.kind === 'error' && (
        <div>
          <h1 className="h1">{config.errorHeading}</h1>
          <p className="lede">{config.errorBody(state.reason)}</p>
          <p className="mt-6 flex flex-wrap gap-3">
            <Link className="btn" to={paths.scan()}>
              Run a new scan
            </Link>
            <Link className="btn-ghost" to="/">
              Back to home
            </Link>
          </p>
        </div>
      )}

      {state.kind === 'no-token' && (
        <div>
          <h1 className="h1">{config.noTokenHeading}</h1>
          <p className="lede">{config.noTokenBody}</p>
          <p className="mt-6">
            <Link className="btn" to={paths.scan()}>
              Run a new scan
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
