import { useEffect, useState } from 'react'
import ScreenNav from '../components/ScreenNav.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'
import { computeGuideline } from '../data/childSupport.js'

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US')

export default function Calculator() {
  const { t } = useI18n()
  const c = t.calculator
  const { financeProfile, updateFinanceProfile, getAnswer } = useAppState()

  // Seed from the case's financial profile, falling back to wizard answers.
  const childCount = (() => {
    try {
      return JSON.parse(getAnswer('children') || '[]').length || ''
    } catch {
      return ''
    }
  })()

  const [form, setForm] = useState(() => ({
    incomeA: financeProfile.incomeA ?? getAnswer('petitioner_income') ?? '',
    incomeB: financeProfile.incomeB ?? getAnswer('respondent_income') ?? '',
    timeshareA: financeProfile.timeshareA ?? '',
    children: financeProfile.children ?? String(childCount || ''),
  }))

  const result = computeGuideline(form)

  // Persist inputs + computed result into the single financial profile.
  useEffect(() => {
    updateFinanceProfile({ ...form, result })
  }, [form]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <section className="screen">
      <p className="screen__eyebrow">{c.eyebrow}</p>
      <h1 className="screen__title">{c.title}</h1>
      <p className="screen__lead">{c.lead}</p>

      <div className="calc">
        <div className="panel">
          <div className="field">
            <label className="field__label">{c.incomePetitioner}</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.incomeA}
              onChange={(e) => set('incomeA', e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label">{c.incomeRespondent}</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.incomeB}
              onChange={(e) => set('incomeB', e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label">{c.timeshare}</label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder={c.timesharePh}
              value={form.timeshareA}
              onChange={(e) => set('timeshareA', e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field__label">{c.children}</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.children}
              onChange={(e) => set('children', e.target.value)}
            />
          </div>
          <p className="field__hint" style={{ marginTop: 16 }}>
            {c.netHint}
          </p>
        </div>

        <div className="calc__result">
          <span className="stub-badge">{c.resultTitle}</span>

          {result ? (
            <>
              <p className="calc__payer">
                {result.payer === 'A' ? c.payerPetitioner : c.payerRespondent}
              </p>
              <div className="calc__amount">
                {money(result.total)}
                <span className="calc__per">{c.perMonth}</span>
              </div>
              <div className="calc__breakdown">
                <span>{c.perChildLabel}</span>
                <b>
                  {money(result.perChild)}
                  {c.perMonth}
                </b>
              </div>
              <div className="calc__breakdown calc__breakdown--muted">
                <span>{c.kLabel}</span>
                <b>{result.K}</b>
              </div>
              <p className="calc__formula">{c.formula}</p>
            </>
          ) : (
            <p className="calc__note">{c.enterData}</p>
          )}

          {/* Required disclaimer — under the result, no advice on amount. */}
          <p className="calc__disclaimer">{c.disclaimer}</p>
        </div>
      </div>

      <ScreenNav current={4} nextLabel={c.toPackage} />
    </section>
  )
}
