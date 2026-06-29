import ScreenNav from '../components/ScreenNav.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

// Support calculator — stub only (no formula yet).
export default function Calculator() {
  const { t } = useI18n()
  const c = t.calculator

  return (
    <section className="screen">
      <p className="screen__eyebrow">{c.eyebrow}</p>
      <h1 className="screen__title">{c.title}</h1>
      <p className="screen__lead">{c.lead}</p>

      <div className="calc">
        <div className="panel">
          <div className="field">
            <label className="field__label">{c.incomeYou}</label>
            <input type="number" placeholder="0" disabled />
          </div>
          <div className="field">
            <label className="field__label">{c.incomeSpouse}</label>
            <input type="number" placeholder="0" disabled />
          </div>
          <div className="field">
            <label className="field__label">{c.children}</label>
            <input type="number" placeholder="0" disabled />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field__label">{c.timeshare}</label>
            <input type="text" placeholder={c.timesharePh} disabled />
          </div>
          <span className="stub-badge" style={{ marginTop: 18 }}>
            {c.fieldsDisabled}
          </span>
        </div>

        <div className="calc__result">
          <span className="stub-badge">{c.stub}</span>
          <div className="calc__amount">{t.common.amountPlaceholder}</div>
          <p className="calc__note">{c.note}</p>
        </div>
      </div>

      <ScreenNav current={4} nextLabel={c.toPackage} />
    </section>
  )
}
