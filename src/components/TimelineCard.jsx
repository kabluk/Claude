import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'
import { generateMilestones } from '../timeline/milestones.js'
import { renderMilestones } from '../timeline/render.js'

// Cabinet card: case timeline + opt-in reminder settings. FACTUAL only — dates
// and form names, never advice. Reminder delivery is opt-in (channel + handle +
// consent) and is actually sent by the notify-milestone Edge Function at deploy.
export default function TimelineCard() {
  const { t } = useI18n()
  const { getAnswer, saveAnswer } = useAppState()
  const m = t.milestones

  const serviceDate = getAnswer('service_date')
  const consent = getAnswer('reminder_consent') === 'yes'
  const channel = getAnswer('reminder_channel') || 'telegram'
  const handle = getAnswer('reminder_handle')

  const milestones = renderMilestones(t, generateMilestones({ serviceDate }))

  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <h2 style={{ fontFamily: 'var(--serif)', marginTop: 0 }}>{m.cardTitle}</h2>
      <p className="field__hint" style={{ marginTop: 0 }}>{m.cardLead}</p>

      <div className="field" style={{ maxWidth: 280 }}>
        <label className="field__label" htmlFor="service_date">{m.serviceDateLabel}</label>
        <input
          id="service_date"
          type="date"
          value={serviceDate}
          onChange={(e) => saveAnswer('service_date', e.target.value)}
        />
      </div>

      {milestones.length === 0 ? (
        <p className="wz-empty">{m.none}</p>
      ) : (
        <>
          <h3 className="wz-block-title">{m.upcoming}</h3>
          <ul className="timeline-list">
            {milestones.map((ms) => (
              <li key={ms.key} className="tl-row">
                <span className="tl-date">{ms.dueDate}</span>
                <span className="tl-body">
                  <strong>{ms.title}</strong>
                  <span>{ms.body}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="field" style={{ marginTop: 8 }}>
            <label className="wz-check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => saveAnswer('reminder_consent', e.target.checked ? 'yes' : '')}
              />
              <span>{m.consentLabel}</span>
            </label>
            <p className="field__hint">{m.consentNote}</p>
          </div>

          {consent && (
            <div className="wz-grid">
              <div className="field">
                <label className="field__label">{m.channelLabel}</label>
                <div className="select-wrap">
                  <select value={channel} onChange={(e) => saveAnswer('reminder_channel', e.target.value)}>
                    <option value="telegram">{m.channels.telegram}</option>
                    <option value="whatsapp">{m.channels.whatsapp}</option>
                    <option value="email">{m.channels.email}</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field__label">{m.handleLabel}</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => saveAnswer('reminder_handle', e.target.value)}
                />
              </div>
            </div>
          )}

          <p className="field__hint">{m.deliveryNote}</p>
        </>
      )}
    </div>
  )
}
