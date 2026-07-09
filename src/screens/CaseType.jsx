import { useState } from 'react'
import ScreenNav from '../components/ScreenNav.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'

// icon + English legal term (meta) stay constant; titles/descriptions translate.
const CASES = [
  { key: 'uncontested', icon: '🤝', meta: 'Uncontested Dissolution' },
  { key: 'contested', icon: '⚖', meta: 'Contested Dissolution' },
  { key: 'supportOnly', icon: '💵', meta: 'Support Only' },
]

export default function CaseType() {
  const { t } = useI18n()
  const { caseRec, updateCase } = useAppState()
  const [selected, setSelected] = useState(caseRec.type || null)

  const choose = (key) => {
    setSelected(key)
    updateCase({ type: key, status: 'in_progress' })
  }

  return (
    <section className="screen">
      <p className="screen__eyebrow">{t.caseType.eyebrow}</p>
      <h1 className="screen__title">{t.caseType.title}</h1>
      <p className="screen__lead">{t.caseType.lead}</p>

      <div className="grid grid--3">
        {CASES.map((c) => (
          <button
            key={c.key}
            className={`option-card ${selected === c.key ? 'is-selected' : ''}`}
            onClick={() => choose(c.key)}
          >
            <span className="option-card__icon" aria-hidden="true">
              {c.icon}
            </span>
            <h2 className="option-card__title">{t.caseType[c.key].title}</h2>
            <p className="option-card__desc">{t.caseType[c.key].desc}</p>
            <span className="option-card__meta">{c.meta}</span>
          </button>
        ))}
      </div>

      <ScreenNav current={1} nextDisabled={!selected} />
    </section>
  )
}
