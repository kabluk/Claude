import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'
import { extractionToDraft, applyConfirmed } from '../vision/paystub.js'

// Deploy-gated endpoint for the extract-paystub Edge Function. Absent in dev/
// preview builds → the component shows the manual-entry path only.
const ENDPOINT = import.meta.env.VITE_EXTRACT_PAYSTUB_URL

const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] || '')
    r.onerror = reject
    r.readAsDataURL(file)
  })

// Paystub photo → FL-150 income. The photo is ONLY a draft source: every value
// is shown for explicit confirmation before it is written. Manual entry (the
// fields rendered by the wizard below this card) stays a first-class path.
export default function PaystubImport() {
  const { t } = useI18n()
  const { getAnswer, saveAnswer } = useAppState()
  const p = t.paystub
  const [status, setStatus] = useState('idle') // idle | reading | ready | unavailable | unreadable | applied
  const [draft, setDraft] = useState([])
  const [confirmed, setConfirmed] = useState([])

  const toggle = (key) =>
    setConfirmed((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]))

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ENDPOINT) {
      setStatus('unavailable')
      return
    }
    setStatus('reading')
    try {
      const image_base64 = await readAsBase64(file)
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64, media_type: file.type }),
      })
      const data = await res.json()
      const d = data?.ok ? extractionToDraft(data.extraction) : []
      if (!d.length) {
        setStatus('unreadable')
        return
      }
      setDraft(d)
      setConfirmed(d.map((x) => x.key)) // pre-ticked, but the user can uncheck
      setStatus('ready')
    } catch {
      setStatus('unavailable')
    }
  }

  const apply = () => {
    const fl150 = (() => {
      try {
        return JSON.parse(getAnswer('fl150_profile') || '{}')
      } catch {
        return {}
      }
    })()
    const { fl150_profile, petitioner_income } = applyConfirmed(fl150, draft, confirmed)
    saveAnswer('fl150_profile', JSON.stringify(fl150_profile))
    if (petitioner_income != null) saveAnswer('petitioner_income', String(petitioner_income))
    setStatus('applied')
  }

  return (
    <div className="paystub">
      <h3 className="wz-block-title" style={{ marginTop: 0 }}>{p.title}</h3>
      <p className="wz-section-intro">{p.intro}</p>

      <label className="btn btn--ghost paystub__choose">
        {status === 'reading' ? p.reading : p.choose}
        <input type="file" accept="image/*" hidden onChange={onFile} disabled={status === 'reading'} />
      </label>

      {status === 'unavailable' && <p className="paystub__note">{p.unavailable}</p>}
      {status === 'unreadable' && <p className="paystub__note">{p.unreadable}</p>}

      {status === 'ready' && (
        <div className="paystub__draft">
          <h4>{p.draftTitle}</h4>
          <ul className="paystub__list">
            {draft.map((d) => (
              <li key={d.key} className="paystub__item">
                <label className="wz-check">
                  <input type="checkbox" checked={confirmed.includes(d.key)} onChange={() => toggle(d.key)} />
                  <span>
                    <strong>{p.fields[d.key] || d.key}:</strong> {d.value}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button className="btn btn--dark" disabled={!confirmed.length} onClick={apply}>
            {p.apply}
          </button>
        </div>
      )}

      {status === 'applied' && <p className="paystub__note paystub__note--ok">{p.applied}</p>}
      <p className="field__hint">{p.privacy}</p>
    </div>
  )
}
