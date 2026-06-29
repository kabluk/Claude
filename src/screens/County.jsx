import { useState } from 'react'
import ScreenNav from '../components/ScreenNav.jsx'

const COUNTIES = [
  'Los Angeles',
  'San Diego',
  'Orange',
  'Riverside',
  'San Bernardino',
]

export default function County() {
  const [county, setCounty] = useState('')
  const [hasMinors, setHasMinors] = useState(false)

  return (
    <section className="screen">
      <p className="screen__eyebrow">Шаг 2 из 6 · Юрисдикция</p>
      <h1 className="screen__title">Округ и состав семьи</h1>
      <p className="screen__lead">
        Укажите округ суда, в который будете подавать документы, и есть ли в семье
        несовершеннолетние дети — это влияет на состав пакета форм.
      </p>

      <div className="panel">
        <div className="field">
          <label className="field__label" htmlFor="county">
            Округ (County)
          </label>
          <div className="select-wrap">
            <select
              id="county"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
            >
              <option value="" disabled>
                Выберите округ…
              </option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c} County
                </option>
              ))}
            </select>
          </div>
          <p className="field__hint">
            Доступны округа Южной Калифорнии. Другие округа — скоро.
          </p>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <span className="field__label">Несовершеннолетние дети</span>
          <button
            type="button"
            className="toggle"
            onClick={() => setHasMinors((v) => !v)}
            aria-pressed={hasMinors}
            style={{ width: '100%', textAlign: 'left' }}
          >
            <span className="toggle__text">
              <strong>Есть несовершеннолетние дети</strong>
              <span>
                Добавит формы по опеке и алиментам на детей (FL-105, FL-150 и др.)
              </span>
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
