import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'

export default function Cabinet() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { user, caseRec, payment, updateUser, startNewCase } = useAppState()
  const c = t.cabinet

  const typeLabel = caseRec.type ? t.caseType[caseRec.type].title : t.common.notSet
  const statusLabel = t.common.caseStatus[caseRec.status] || caseRec.status

  const onNewCase = () => {
    startNewCase()
    navigate('/')
  }

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

      <div className="panel" style={{ marginTop: 20 }}>
        <h2 style={{ fontFamily: 'var(--serif)', marginTop: 0 }}>{c.dataTitle}</h2>

        <div className="field" style={{ maxWidth: 420 }}>
          <label className="field__label" htmlFor="email">
            {c.emailLabel}
          </label>
          <input
            id="email"
            type="text"
            placeholder={c.emailPlaceholder}
            value={user.email}
            onChange={(e) => updateUser({ email: e.target.value })}
          />
          <p className="field__hint">{c.emailHint}</p>
        </div>

        <dl className="data-list">
          <div>
            <dt>{c.typeLabel}</dt>
            <dd>{typeLabel}</dd>
          </div>
          <div>
            <dt>{t.county.label}</dt>
            <dd>{user.county ? `${user.county} County` : t.common.notSet}</dd>
          </div>
          <div>
            <dt>{t.county.toggleTitle}</dt>
            <dd>{caseRec.has_children ? t.common.yes : t.common.no}</dd>
          </div>
          <div>
            <dt>{c.statusLabel}</dt>
            <dd>{statusLabel}</dd>
          </div>
          <div>
            <dt>{c.paymentLabel}</dt>
            <dd>
              ${payment.amount} ·{' '}
              <span className="badge-unpaid">{t.common.unpaid}</span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="actions">
        <button className="btn btn--ghost" onClick={() => navigate('/preview')}>
          ← {t.common.back}
        </button>
        <button className="btn btn--primary" onClick={onNewCase}>
          {c.newCase} →
        </button>
      </div>
    </section>
  )
}
