import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'
import { serviceToDraft, applyConfirmedService } from '../vision/service.js'

// Deploy-gated endpoint for the extract-service Edge Function. Absent in dev/
// preview → the component shows the manual-entry path only.
const ENDPOINT = import.meta.env.VITE_EXTRACT_SERVICE_URL

const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] || '')
    r.onerror = reject
    r.readAsDataURL(file)
  })

// Served-documents photo → FL-115 + service_date. Photo is only a draft source:
// every value is shown for explicit confirmation before it is written. Manual
// entry stays a first-class path. `onApplied` lets the parent refresh (e.g. the
// timeline, which recomputes from service_date).
export default function ServiceImport({ onApplied }) {
  const { t } = useI18n()
  const { getAnswer, saveAnswer } = useAppState()
  const s = t.service
  const [status, setStatus] = useState('idle') // idle | reading | ready | unavailable | unreadable | applied
  const [draft, setDraft] = useState([])
  const [confirmed, setConfirmed] = useState([])

  const toggle = (key) =>
    setConfirmed((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]))

  const label = (item) => {
    if (item.key === 'service_method') return s.fields.service_method
    return s.fields[item.key] || item.key
  }

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
      const d = data?.ok ? serviceToDraft(data.extraction) : []
      if (!d.length) {
        setStatus('unreadable')
        return
      }
      setDraft(d)
      setConfirmed(d.map((x) => x.key))
      setStatus('ready')
    } catch {
      setStatus('unavailable')
    }
  }

  const apply = () => {
    const { answers } = applyConfirmedService(draft, confirmed)
    for (const [k, v] of Object.entries(answers)) saveAnswer(k, v)
    setStatus('applied')
    onApplied?.()
  }

  // Suppress an unused-var lint on getAnswer while keeping the hook shape stable.
  void getAnswer

  return (
    <div className="paystub">
      <h3 className="wz-block-title" style={{ marginTop: 0 }}>{s.title}</h3>
      <p className="wz-section-intro">{s.intro}</p>

      <label className="btn btn--ghost paystub__choose">
        {status === 'reading' ? s.reading : s.choose}
        <input type="file" accept="image/*" hidden onChange={onFile} disabled={status === 'reading'} />
      </label>

      {status === 'unavailable' && <p className="paystub__note">{s.unavailable}</p>}
      {status === 'unreadable' && <p className="paystub__note">{s.unreadable}</p>}

      {status === 'ready' && (
        <div className="paystub__draft">
          <h4>{s.draftTitle}</h4>
          <ul className="paystub__list">
            {draft.map((d) => (
              <li key={d.key} className="paystub__item">
                <label className="wz-check">
                  <input type="checkbox" checked={confirmed.includes(d.key)} onChange={() => toggle(d.key)} />
                  <span>
                    <strong>{label(d)}:</strong> {d.value}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button className="btn btn--dark" disabled={!confirmed.length} onClick={apply}>
            {s.apply}
          </button>
        </div>
      )}

      {status === 'applied' && <p className="paystub__note paystub__note--ok">{s.applied}</p>}
      <p className="field__hint">{s.privacy}</p>
    </div>
  )
}
