import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function Cabinet() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const c = t.cabinet

  return (
    <section className="screen">
      <p className="screen__eyebrow">{c.eyebrow}</p>
      <h1 className="screen__title">{c.title}</h1>
      <p className="screen__lead">{c.lead}</p>

      <div className="cabinet-grid">
        <div className="cab-card">
          <span className="cab-card__icon">📄</span>
          <h3>{c.pdfTitle}</h3>
          <p>{c.pdfDesc}</p>
          <button className="btn btn--dark btn--block">{c.pdfBtn}</button>
        </div>

        <div className="cab-card">
          <span className="cab-card__icon">📘</span>
          <h3>{c.instrTitle}</h3>
          <p>{c.instrDesc}</p>
          <button className="btn btn--ghost btn--block">{c.instrBtn}</button>
        </div>

        <div className="cab-card">
          <span className="cab-card__icon">✅</span>
          <h3>{c.checkTitle}</h3>
          <ul className="checklist">
            {c.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn--ghost" onClick={() => navigate('/preview')}>
          ← {t.common.back}
        </button>
        <button className="btn btn--primary" onClick={() => navigate('/')}>
          {c.newCase} →
        </button>
      </div>
    </section>
  )
}
