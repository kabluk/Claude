import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/Button'

const TOTAL_STEPS = 4

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
]

interface OnboardingProps {
  onComplete: (data: { name: string; detainedName: string; lang: string }) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState(1)
  const [lang, setLang] = useState(i18n.language.slice(0, 2))
  const [name, setName] = useState('')
  const [detainedName, setDetainedName] = useState('')

  function changeLanguage(code: string) {
    setLang(code)
    i18n.changeLanguage(code)
  }

  function next() {
    if (step < TOTAL_STEPS) setStep(s => s + 1)
    else onComplete({ name, detainedName, lang })
  }

  const canNext =
    step === 1 ? true :
    step === 2 ? !!lang :
    step === 3 ? name.trim().length > 0 :
    detainedName.trim().length > 0

  return (
    <div className="min-h-svh flex flex-col bg-[#FBF7F2] px-5 py-8 max-w-md mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-[#1F3550]' : 'bg-[#1F3550]/20'}`}
          />
        ))}
      </div>
      <p className="text-sm text-[#1F3550]/60 mb-6">
        {t('onboarding.step_of', { current: step, total: TOTAL_STEPS })}
      </p>

      <div className="flex-1">
        {step === 1 && (
          <>
            <h1 className="text-3xl mb-4">{t('onboarding.welcome_title')}</h1>
            <p className="text-[#1F3550]/80 text-lg">{t('onboarding.welcome_body')}</p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-3xl mb-6">{t('onboarding.language_title')}</h1>
            <div className="flex flex-col gap-3">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => changeLanguage(l.code)}
                  className={[
                    'min-h-[56px] px-5 rounded-xl text-left font-semibold text-lg border-2 transition-colors',
                    lang === l.code
                      ? 'border-[#1F3550] bg-[#1F3550] text-[#FBF7F2]'
                      : 'border-[#1F3550]/30 text-[#1F3550]',
                  ].join(' ')}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-3xl mb-6">{t('onboarding.name_title')}</h1>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('onboarding.name_placeholder')}
              className="w-full min-h-[52px] px-4 py-3 rounded-xl border-2 border-[#1F3550]/30 bg-white text-[#1F3550] text-lg focus:border-[#1F3550] focus:outline-none"
              autoFocus
            />
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-3xl mb-6">{t('onboarding.detained_title')}</h1>
            <input
              type="text"
              value={detainedName}
              onChange={e => setDetainedName(e.target.value)}
              placeholder={t('onboarding.detained_placeholder')}
              className="w-full min-h-[52px] px-4 py-3 rounded-xl border-2 border-[#1F3550]/30 bg-white text-[#1F3550] text-lg focus:border-[#1F3550] focus:outline-none"
              autoFocus
            />
          </>
        )}
      </div>

      <div className="pt-6">
        <Button variant="primary" fullWidth onClick={next} disabled={!canNext}>
          {step === TOTAL_STEPS ? t('onboarding.done_title') : t('next')}
        </Button>
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-full min-h-[44px] mt-2 text-[#1F3550]/60 text-base"
          >
            {t('back')}
          </button>
        )}
      </div>
    </div>
  )
}
