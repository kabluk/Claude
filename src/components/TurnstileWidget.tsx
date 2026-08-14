import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { TURNSTILE_SITE_KEY } from '@/lib/scanner'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
let scriptLoadPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('failed to load Turnstile script'))
    document.head.appendChild(script)
  })
  return scriptLoadPromise
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback: (token: string) => void
          'error-callback'?: () => void
          appearance?: 'always' | 'execute' | 'interaction-only'
        },
      ) => string
      remove: (widgetId: string) => void
      execute: (widgetId: string) => void
    }
  }
}

export interface TurnstileHandle {
  /** Резолвится реальным токеном, либо '' если сайт-ключ не настроен (тот же
   * graceful degrade, что и раньше — сервер сам пропускает проверку без
   * секрета, worker/lib/turnstile.js). Отклоняется, если виджет не успел
   * загрузиться/провалил проверку — вызывающий код решает, отправлять ли
   * форму без токена (сервер снова сам решит, обязателен ли он). */
  execute: () => Promise<string>
}

// D-169 (владелец, 2026-08-14): appearance:'execute' — виджет НЕ рендерит UI и
// НЕ запускает проверку сам при монтировании формы, только когда явно вызван
// execute() (обычно — в момент сабмита). Не снижает защиту: тот же движок,
// тот же поведенческий сигнал Cloudflare, что и в always-режиме — разница
// только в том, что не показывается визуально до нужного момента. Раньше
// виджет рендерился сразу при открытии страницы — то, что он у легитимного
// браузера сразу проходит без пазла, было ОЖИДАЕМЫМ поведением managed-режима
// (не признаком, что защита не работает), но визуально это выглядело как
// «всегда зелёный», поэтому по прямой просьбе владельца убран с глаз.
export const TurnstileWidget = forwardRef<TurnstileHandle>(function TurnstileWidget(_props, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const pendingRef = useRef<{ resolve: (token: string) => void; reject: (err: Error) => void } | null>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !containerRef.current) return
    let cancelled = false
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: 'execute',
          callback: (token) => {
            pendingRef.current?.resolve(token)
            pendingRef.current = null
          },
          'error-callback': () => {
            pendingRef.current?.reject(new Error('Turnstile verification failed'))
            pendingRef.current = null
          },
        })
      })
      // Скрипт не загрузился (сеть/блокировщик) — execute() ниже сам отклонится
      // за отсутствием widgetIdRef, вызывающий код деградирует штатно. Здесь
      // только гасим unhandled rejection, не re-throw.
      .catch(() => {})
    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current)
    }
    // Колбэки читают pendingRef.current на момент вызова, не замыкают старое
    // значение — пересоздавать виджет при каждом ре-рендере формы не нужно.
  }, [])

  useImperativeHandle(ref, () => ({
    execute: () =>
      new Promise<string>((resolve, reject) => {
        if (!TURNSTILE_SITE_KEY) {
          resolve('')
          return
        }
        if (!window.turnstile || !widgetIdRef.current) {
          reject(new Error('Turnstile is not ready yet'))
          return
        }
        pendingRef.current = { resolve, reject }
        window.turnstile.execute(widgetIdRef.current)
      }),
  }))

  if (!TURNSTILE_SITE_KEY) return null
  return <div ref={containerRef} />
})
