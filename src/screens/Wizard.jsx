import { useState } from 'react'
import ScreenNav from '../components/ScreenNav.jsx'

// Interview sub-steps inside the wizard container (no logic yet — just the shell).
const WIZARD_STEPS = [
  { key: 'parties', title: 'Стороны' },
  { key: 'marriage', title: 'Брак' },
  { key: 'children', title: 'Дети' },
  { key: 'property', title: 'Имущество' },
  { key: 'finance', title: 'Финансы' },
  { key: 'review', title: 'Проверка' },
]

export default function Wizard() {
  const [active, setActive] = useState(0)
  const total = WIZARD_STEPS.length
  const pct = Math.round(((active + 1) / total) * 100)
  const cur = WIZARD_STEPS[active]

  return (
    <section className="screen">
      <p className="screen__eyebrow">Шаг 3 из 6 · Интервью</p>
      <h1 className="screen__title">Визард-интервью</h1>
      <p className="screen__lead">
        Ответьте на серию вопросов — мы заполним судебные формы за вас. Это
        каркас интервью: поля и логика добавятся позже.
      </p>

      <div className="panel">
        <div className="wizard__head">
          <strong style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>
            {cur.title}
          </strong>
          <span className="wizard__count">
            Вопрос {active + 1} из {total} · {pct}%
          </span>
        </div>

        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="wizard__steps">
          {WIZARD_STEPS.map((s, i) => (
            <button
              key={s.key}
              className={`wizard__chip ${
                i === active ? 'is-active' : i < active ? 'is-done' : ''
              }`}
              onClick={() => setActive(i)}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>

        <div className="placeholder-block">
          <strong>Раздел «{cur.title}»</strong>
          <div className="skeleton-row w-60" />
          <div className="skeleton-row w-80" />
          <div className="skeleton-row w-40" />
          <p style={{ marginBottom: 0 }}>
            Здесь появятся поля интервью для этого раздела.
          </p>
        </div>

        <div
          className="actions"
          style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)' }}
        >
          <button
            className="btn btn--ghost"
            disabled={active === 0}
            onClick={() => setActive((i) => Math.max(0, i - 1))}
          >
            ← Предыдущий вопрос
          </button>
          <button
            className="btn btn--dark"
            disabled={active === total - 1}
            onClick={() => setActive((i) => Math.min(total - 1, i + 1))}
          >
            Следующий вопрос →
          </button>
        </div>
      </div>

      <ScreenNav current={3} nextLabel="К калькулятору" />
    </section>
  )
}
