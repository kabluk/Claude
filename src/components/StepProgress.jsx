import { STEPS } from '../data/steps.js'

// Global cross-screen progress: «Шаг X из 6».
export default function StepProgress({ current }) {
  return (
    <nav className="steps" aria-label="Прогресс по шагам">
      <div className="steps__inner">
        {STEPS.map((s) => {
          const state =
            s.n === current ? 'is-active' : s.n < current ? 'is-done' : ''
          return (
            <div key={s.key} className={`step-pill ${state}`}>
              <span className="step-pill__num">{s.n < current ? '✓' : s.n}</span>
              <span>{s.label}</span>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
