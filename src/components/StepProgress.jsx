import { STEPS } from '../data/steps.js'
import { useI18n } from '../i18n/I18nContext.jsx'

// Global cross-screen progress: «Step X of 6».
export default function StepProgress({ current }) {
  const { t } = useI18n()
  return (
    <nav className="steps" aria-label="Progress">
      <div className="steps__inner">
        {STEPS.map((s) => {
          const state =
            s.n === current ? 'is-active' : s.n < current ? 'is-done' : ''
          return (
            <div key={s.key} className={`step-pill ${state}`}>
              <span className="step-pill__num">{s.n < current ? '✓' : s.n}</span>
              <span>{t.steps[s.key]}</span>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
