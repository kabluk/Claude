import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'
import { generateFL100, fl105Required } from '../pdf/fl100.js'

function download(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// "Generate FL-100" — fills the official PDF from the current case and downloads
// a DRAFT-watermarked copy. Surfaces the FL-105 business rule for minor children.
export default function Fl100Generate() {
  const { t } = useI18n()
  const c = t.cabinet
  const { user, caseRec, answers } = useAppState()
  const [status, setStatus] = useState('idle') // idle | working | error

  const needsFl105 = fl105Required({ caseRec })

  const onGenerate = async () => {
    setStatus('working')
    try {
      const { bytes } = await generateFL100({ user, caseRec, answers })
      download(bytes, 'FL-100-DRAFT.pdf')
      setStatus('idle')
    } catch (err) {
      console.error('FL-100 generation failed:', err)
      setStatus('error')
    }
  }

  return (
    <div className="fl100">
      <button
        className="btn btn--primary btn--block"
        onClick={onGenerate}
        disabled={status === 'working'}
      >
        {status === 'working' ? c.fl100Generating : c.fl100Btn}
      </button>
      <p className="fl100__hint">{c.fl100Hint}</p>
      {status === 'error' && <p className="fl100__error">{c.fl100Error}</p>}
      {needsFl105 && <p className="fl100__fl105">⚠ {c.fl105Required}</p>}
    </div>
  )
}
