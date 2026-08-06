import { useEffect, useRef } from 'react'
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
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'error-callback'?: () => void }) => string
      remove: (widgetId: string) => void
    }
  }
}

// Не рендерится вообще без VITE_TURNSTILE_SITE_KEY — форма сканера остаётся
// рабочей в dev/без ключа (сервер сам пропускает проверку без секрета, см.
// worker/lib/turnstile.js). Не блокирует отправку, только даёт токен, когда есть.
export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !containerRef.current) return
    let cancelled = false
    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: onToken,
      })
    })
    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current)
    }
    // onToken намеренно не в deps: тот же колбэк на протяжении жизни формы,
    // пересоздавать виджет при каждом ре-рендере не нужно.
  }, [])

  if (!TURNSTILE_SITE_KEY) return null
  return <div ref={containerRef} />
}
