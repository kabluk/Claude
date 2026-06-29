import { useState } from 'react'
import ScreenNav from '../components/ScreenNav.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function Wizard() {
  const { t, fmt } = useI18n()
  const sections = t.wizard.steps
  const [active, setActive] = useState(0)
  const total = sections.length
  const pct = Math.round(((active + 1) / total) * 100)
  const cur = sections[active]

  return (
    <section className="screen">
      <p className="screen__eyebrow">{t.wizard.eyebrow}</p>
      <h1 className="screen__title">{t.wizard.title}</h1>
      <p className="screen__lead">{t.wizard.lead}</p>

      <div className="panel">
        <div className="wizard__head">
          <strong style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>
            {cur.title}
          </strong>
          <span className="wizard__count">
            {fmt(t.wizard.counter, { a: active + 1, b: total, p: pct })}
          </span>
        </div>

        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="wizard__steps">
          {sections.map((s, i) => (
            <button
              key={i}
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
          <strong>{cur.question}</strong>
          <div className="skeleton-row w-60" />
          <div className="skeleton-row w-80" />
          <div className="skeleton-row w-40" />
          {/* Field explanation — translated for the user's understanding. */}
          <p className="field-explain">{cur.hint}</p>
          <p style={{ marginBottom: 0, opacity: 0.7 }}>{t.wizard.note}</p>
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
            ← {t.wizard.prev}
          </button>
          <button
            className="btn btn--dark"
            disabled={active === total - 1}
            onClick={() => setActive((i) => Math.min(total - 1, i + 1))}
          >
            {t.wizard.next} →
          </button>
        </div>
      </div>

      <ScreenNav current={3} nextLabel={t.wizard.toCalculator} />
    </section>
  )
}
