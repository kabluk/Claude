import { useEffect, useState } from 'react'
import ScreenNav from '../components/ScreenNav.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'

// Stable field_key per interview section — used as the Answer key (autosave).
const FIELD_KEYS = ['parties', 'marriage', 'children', 'property', 'finance', 'review']

export default function Wizard() {
  const { t, fmt } = useI18n()
  const { caseRec, getAnswer, saveAnswer, updateCase } = useAppState()
  const sections = t.wizard.steps
  const total = sections.length
  const [active, setActive] = useState(() =>
    Math.min(caseRec.wizard_step ?? 0, total - 1),
  )
  const pct = Math.round(((active + 1) / total) * 100)
  const cur = sections[active]
  const fieldKey = FIELD_KEYS[active]

  // Remember the current position so returning resumes here.
  useEffect(() => {
    updateCase({ wizard_step: active })
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <label className="field__label" htmlFor="answer">
            {cur.question}
          </label>
          <textarea
            id="answer"
            rows={3}
            placeholder={t.wizard.answerPlaceholder}
            value={getAnswer(fieldKey)}
            onChange={(e) => saveAnswer(fieldKey, e.target.value)}
          />
          {/* Field explanation — translated for the user's understanding. */}
          <p className="field-explain">{cur.hint}</p>
          <p className="autosave">
            <span className="autosave__dot" /> {t.wizard.saved}
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
