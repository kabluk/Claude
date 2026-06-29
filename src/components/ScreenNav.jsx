import { useNavigate } from 'react-router-dom'
import { nextStep, prevStep } from '../data/steps.js'

// Bottom Back / Next navigation, wired to the global step order.
export default function ScreenNav({ current, nextLabel = 'Далее', nextDisabled = false }) {
  const navigate = useNavigate()
  const prev = prevStep(current)
  const next = nextStep(current)

  return (
    <div className="actions">
      {prev ? (
        <button className="btn btn--ghost" onClick={() => navigate(prev.path)}>
          ← Назад
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
          {nextLabel} →
        </button>
      ) : (
        <span />
      )}
    </div>
  )
}
