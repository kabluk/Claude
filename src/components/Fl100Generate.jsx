import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'
import { generateFL100 } from '../pdf/fl100.js'
import { generateFL105, fl105Required, fl105NeedsContinuation } from '../pdf/fl105.js'

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
  const { user, caseRec, answers, getAnswer, saveAnswer } = useAppState()
  const [status, setStatus] = useState('idle') // idle | working | error

  const state = { user, caseRec, answers }
  const needsFl105 = fl105Required({ caseRec })
  const continuation = needsFl105 && fl105NeedsContinuation(state)
  const residency = getAnswer('residency_party') || 'petitioner' // §2 default: Petitioner

  const onGenerate = async () => {
    setStatus('working')
    try {
      // FL-100 always; FL-105 (UCCJEA) alongside it when there are minor children.
      const fl100 = await generateFL100(state)
      download(fl100.bytes, 'FL-100-DRAFT.pdf')
      if (needsFl105) {
        const fl105 = await generateFL105(state)
        download(fl105.bytes, 'FL-105-DRAFT.pdf')
      }
      setStatus('idle')
    } catch (err) {
      console.error('Form generation failed:', err)
      setStatus('error')
    }
  }

  return (
    <div className="fl100">
      <label className="fl100__reslabel" htmlFor="residency">
        {c.residencyLabel}
      </label>
      <div className="select-wrap">
        <select
          id="residency"
          value={residency}
          onChange={(e) => saveAnswer('residency_party', e.target.value)}
        >
          <option value="petitioner">{c.resPetitioner}</option>
          <option value="respondent">{c.resRespondent}</option>
          <option value="both">{c.resBoth}</option>
        </select>
      </div>

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
      {continuation && <p className="fl100__fl105">⚠ {c.fl105Continuation}</p>}
    </div>
  )
}
