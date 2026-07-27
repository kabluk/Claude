import { useEffect, useRef, useState } from 'react'
import type { Lang, UIStrings } from '@/lib/types'

const VOICE: Record<Lang, string> = { en: 'en-US', es: 'es-ES', ru: 'ru-RU' }

// «Прослушать эту страницу» — SpeechSynthesis, на языке страницы.
// Значительная часть аудитории читает плохо. Нулевой трафик: голос синтезируется
// на устройстве, наружу ничего не уходит.
export function Listen({ lang, ui, extra }: { lang: Lang; ui: UIStrings; extra?: string[] }) {
  const [speaking, setSpeaking] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    }
  }, [])

  function toggle() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert(ui.noSpeech)
      return
    }
    if (speaking) {
      speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const main = document.querySelector('main')
    const text = [main?.innerText ?? '', ...(extra ?? [])].join('. ')
    const u = new SpeechSynthesisUtterance(text)
    u.lang = VOICE[lang]
    u.rate = 0.92
    u.onend = () => {
      if (mounted.current) setSpeaking(false)
    }
    speechSynthesis.speak(u)
    setSpeaking(true)
  }

  return (
    <button className="listen" onClick={toggle} type="button">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EDEFF1" strokeWidth="2" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      </svg>
      <span>{speaking ? ui.stop : ui.listen}</span>
    </button>
  )
}
