import { useState } from 'react'
import ScreenNav from '../components/ScreenNav.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

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
  const [county, setCounty] = useState('')
  const [hasMinors, setHasMinors] = useState(false)

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
              onChange={(e) => setCounty(e.target.value)}
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
            onClick={() => setHasMinors((v) => !v)}
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
