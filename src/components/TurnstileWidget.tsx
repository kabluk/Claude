import { forwardRef, useImperativeHandle, useRef } from 'react'
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

// D-184 (владелец, 2026-08-15): ПОЛНОСТЬЮ ленивая загрузка. Раньше (D-169)
// виджет рендерился в appearance:'execute' — визуально скрыт, НО скрипт
// Cloudflare (challenges.cloudflare.com) грузился и `render()` вызывался уже
// при МОНТИРОВАНИИ формы, то есть при открытии любой страницы со сканом/
// подпиской/лид-формой. Скрытый UI ≠ отсутствие виджета: сам факт загрузки
// стороннего скрипта и созданного виджета владелец видел «постоянно». По
// прямой просьбе — ничего не грузить и не рендерить, пока пользователь не
// нажмёт submit: скрипт, render() и execute() происходят ВСЕ вместе, в
// момент первого вызова execute(). До этого на странице нет ни строчки
// Cloudflare.
//
// Цена — задержка первого сабмита на загрузку скрипта (~200–500мс); сабмит и
// так асинхронный и показывает «Sending…», так что она не заметна. Виджет
// по-прежнему appearance:'execute' — у легитимного браузера проверка проходит
// невидимо; challenge всплывёт только если Cloudflare сочтёт запрос
// подозрительным, что и есть «появляется при проверке».
export const TurnstileWidget = forwardRef<TurnstileHandle>(function TurnstileWidget(_props, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const pendingRef = useRef<{ resolve: (token: string) => void; reject: (err: Error) => void } | null>(null)

  // Ленивая инициализация: грузит скрипт и рендерит виджет ОДИН раз, при
  // первом вызове. Повторные execute() переиспользуют уже отрендеренный
  // виджет. Возвращает widgetId или бросает, если не удалось.
  async function ensureWidget(): Promise<string> {
    if (widgetIdRef.current) return widgetIdRef.current
    await loadTurnstileScript()
    if (!containerRef.current || !window.turnstile) {
      throw new Error('Turnstile is not available')
    }
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
    return widgetIdRef.current
  }

  useImperativeHandle(ref, () => ({
    execute: async () => {
      // Без сайт-ключа виджета нет вовсе — сервер сам пропустит проверку без
      // токена (worker/lib/turnstile.js). Тот же graceful degrade, что был.
      if (!TURNSTILE_SITE_KEY) return ''
      const widgetId = await ensureWidget()
      return new Promise<string>((resolve, reject) => {
        pendingRef.current = { resolve, reject }
        window.turnstile!.execute(widgetId)
      })
    },
  }))

  // Контейнер нужен, чтобы render() было куда монтировать виджет, — но пустой
  // <div> до первого сабмита не грузит ничего стороннего и ничего не рисует.
  // Без сайт-ключа не рендерим и его.
  if (!TURNSTILE_SITE_KEY) return null
  return <div ref={containerRef} />
})
