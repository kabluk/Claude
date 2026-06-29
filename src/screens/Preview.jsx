import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'

// Form codes + official English names are NEVER translated (filed in English).
// Only the explanatory sub-line is localized.
const DOCS = [
  { code: 'FL-100', name: 'Petition — Marriage/Domestic Partnership' },
  { code: 'FL-110', name: 'Summons' },
  { code: 'FL-105', name: 'Declaration Under UCCJEA' },
  { code: 'FL-150', name: 'Income and Expense Declaration' },
  { code: 'FL-141', name: 'Declaration of Disclosure' },
]

export default function Preview() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { caseRec, updateCase, price } = useAppState()
  const p = t.preview

  // Package assembled — mark the case ready (payment remains unpaid for now).
  useEffect(() => {
    if (caseRec.status !== 'ready') updateCase({ status: 'ready' })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="screen">
      <p className="screen__eyebrow">{p.eyebrow}</p>
      <h1 className="screen__title">{p.title}</h1>
      <p className="screen__lead">{p.lead}</p>

      <div
        className="preview-layout"
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}
      >
        <div className="panel">
          <h2 style={{ fontFamily: 'var(--serif)', marginTop: 0 }}>{p.included}</h2>
          <ul className="doc-list">
            {DOCS.map((d) => (
              <li key={d.code}>
                <span className="doc-code">{d.code}</span>
                <span className="doc-name">
                  {d.name}
                  <span>{p.docs[d.code]}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="summary">
          <div className="summary__row">
            <span>{p.rowPrep}</span>
            <span>${price}</span>
          </div>
          <div className="summary__row">
            <span>{p.rowInstr}</span>
            <span>{p.includedWord}</span>
          </div>
          <div className="summary__row">
            <span>{p.rowChecklist}</span>
            <span>{p.includedWord}</span>
          </div>
          <div className="summary__total">
            <span>{p.total}</span>
            <b>${price}</b>
          </div>
          <button
            className="btn btn--primary btn--block"
            onClick={() => navigate('/cabinet')}
          >
            {p.pay}
          </button>
          <p
            style={{
              fontSize: 12,
              color: 'rgba(247,244,238,0.55)',
              textAlign: 'center',
              marginTop: 12,
            }}
          >
            {p.payNote}
          </p>
        </aside>
      </div>

      <div className="actions">
        <button className="btn btn--ghost" onClick={() => navigate('/calculator')}>
          ← {t.common.back}
        </button>
        <span />
      </div>
    </section>
  )
}
