import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const CANCEL_SECONDS = 3

export function SosButton() {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<'idle' | 'confirming' | 'sent'>('idle')
  const [countdown, setCountdown] = useState(CANCEL_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function start() {
    setPhase('confirming')
    setCountdown(CANCEL_SECONDS)
  }

  function cancel() {
    clearInterval(timerRef.current!)
    setPhase('idle')
  }

  useEffect(() => {
    if (phase !== 'confirming') return
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current!)
          setPhase('sent')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase])

  if (phase === 'sent') {
    return (
      <div className="flex items-center gap-2 text-[#5B7A5E] font-semibold py-3">
        <span aria-live="assertive">{t('sos_sent')}</span>
      </div>
    )
  }

  if (phase === 'confirming') {
    return (
      <div className="flex flex-col gap-3" role="alertdialog" aria-label={t('sos_title')}>
        <p className="text-sm text-[#1F3550]/80">{t('sos_confirm')}</p>
        <button
          onClick={cancel}
          className="min-h-[44px] px-6 py-3 rounded-xl border border-[#C0564A] text-[#C0564A] font-semibold text-base"
          aria-live="polite"
        >
          {t('sos_cancel', { seconds: countdown })}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={start}
      className="min-h-[56px] w-full bg-[#C0564A] text-white font-bold text-lg rounded-xl active:scale-[0.98] transition-transform"
      aria-label={t('sos_title')}
    >
      {t('sos_title')}
    </button>
  )
}
