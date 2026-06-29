import { useNavigate } from 'react-router-dom'
import { nextStep, prevStep } from '../data/steps.js'
import { useI18n } from '../i18n/I18nContext.jsx'

// Bottom Back / Next navigation, wired to the global step order.
export default function ScreenNav({ current, nextLabel, nextDisabled = false }) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const prev = prevStep(current)
  const next = nextStep(current)

  return (
    <div className="actions">
      {prev ? (
        <button className="btn btn--ghost" onClick={() => navigate(prev.path)}>
          ← {t.common.back}
        </button>
      ) : (
        <span />
      )}

      {next ? (
        <button
          className="btn btn--primary"
          disabled={nextDisabled}
          onClick={() => navigate(next.path)}
        >
          {nextLabel || t.common.next} →
        </button>
      ) : (
        <span />
      )}
    </div>
  )
}
