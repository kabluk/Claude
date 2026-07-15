import { useState } from 'react'
import ScreenNav from '../components/ScreenNav.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'

// County names are proper jurisdiction names — kept in English, not translated.
const COUNTIES = [
  'Los Angeles',
  'San Diego',
  'Orange',
  'Riverside',
  'San Bernardino',
]

export default function County() {
  const { t } = useI18n()
  const { user, caseRec, updateUser, updateCase } = useAppState()
  const [county, setCounty] = useState(user.county || '')
  const [hasMinors, setHasMinors] = useState(!!caseRec.has_children)

  const chooseCounty = (value) => {
    setCounty(value)
    updateUser({ county: value })
  }
  const toggleMinors = () => {
    const next = !hasMinors
    setHasMinors(next)
    updateCase({ has_children: next })
  }

  return (
    <section className="screen">
      <p className="screen__eyebrow">{t.county.eyebrow}</p>
      <h1 className="screen__title">{t.county.title}</h1>
      <p className="screen__lead">{t.county.lead}</p>

      <div className="panel">
        <div className="field">
          <label className="field__label" htmlFor="county">
            {t.county.label}
          </label>
          <div className="select-wrap">
            <select
              id="county"
              value={county}
              onChange={(e) => chooseCounty(e.target.value)}
            >
              <option value="" disabled>
                {t.county.placeholder}
              </option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c} County
                </option>
              ))}
            </select>
          </div>
          <p className="field__hint">{t.county.hint}</p>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <span className="field__label">{t.county.toggleTitle}</span>
          <button
            type="button"
            className="toggle"
            onClick={toggleMinors}
            aria-pressed={hasMinors}
            style={{ width: '100%', textAlign: 'left' }}
          >
            <span className="toggle__text">
              <strong>{t.county.toggleStrong}</strong>
              <span>{t.county.toggleSpan}</span>
            </span>
            <span className={`switch ${hasMinors ? 'is-on' : ''}`}>
              <span className="switch__dot" />
            </span>
          </button>
        </div>
      </div>

      <ScreenNav current={2} nextDisabled={!county} />
    </section>
  )
}
