import { useEffect, useState } from 'react'
import ScreenNav from '../components/ScreenNav.jsx'
import HelpTip from '../components/HelpTip.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'
import { evaluateFeeWaiver, FEE_WAIVER_BENEFITS } from '../data/feeWaiver.js'
import PaystubImport from '../components/PaystubImport.jsx'

// Section order. `situation` is an early contested-filter gate (§10.1): the flow
// only continues on an agreement/default answer.
const SECTIONS = ['situation', 'parties', 'children', 'property', 'income', 'fees', 'consent', 'review']
// Answers that let the intake proceed (agree / spouse-not-responding=default).
const SITUATION_PROCEED = new Set(['1', '2'])

// Top-level field component (stable type ⇒ inputs keep focus across re-renders).
function Field({
  def,
  type = 'text',
  options,
  value,
  onChange,
  common, // { exampleLabel, helpLabel, selectPlaceholder }
}) {
  return (
    <div className="field">
      <label className="field__label">
        <span>{def.label}</span>
        <HelpTip
          help={def.help}
          example={def.example}
          exampleLabel={common.exampleLabel}
          ariaLabel={common.helpLabel}
        />
      </label>
      {type === 'select' ? (
        <div className="select-wrap">
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="" disabled>
              {common.selectPlaceholder}
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

export default function Wizard() {
  const { t, fmt } = useI18n()
  const w = t.wizard
  const { user, caseRec, getAnswer, saveAnswer, updateCase } = useAppState()

  const total = SECTIONS.length
  const [active, setActive] = useState(() =>
    Math.min(caseRec.wizard_step ?? 0, total - 1),
  )
  const sectionKey = SECTIONS[active]
  const pct = Math.round(((active + 1) / total) * 100)

  // Remember position so returning resumes here.
  useEffect(() => {
    updateCase({ wizard_step: active })
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- value helpers (autosave) ---
  const val = (k) => getAnswer(k)
  const setVal = (k, v) => saveAnswer(k, v)
  const getList = (k) => {
    try {
      const r = JSON.parse(getAnswer(k) || '[]')
      return Array.isArray(r) ? r : []
    } catch {
      return []
    }
  }
  const setList = (k, arr) => saveAnswer(k, JSON.stringify(arr))

  const common = {
    exampleLabel: w.example,
    helpLabel: w.help,
    selectPlaceholder: w.ui.selectOption,
  }
  // Shorthand for a scalar-keyed field.
  const F = (fk, type = 'text', options) => (
    <Field
      def={w.f[fk]}
      type={type}
      options={options}
      value={val(fk)}
      onChange={(v) => setVal(fk, v)}
      common={common}
    />
  )

  const sexOptions = [
    { value: 'male', label: w.sex.male },
    { value: 'female', label: w.sex.female },
    { value: 'x', label: w.sex.x },
  ]
  const assetCatOptions = [
    { value: 'real_estate', label: w.assetCat.real_estate },
    { value: 'vehicle', label: w.assetCat.vehicle },
    { value: 'financial', label: w.assetCat.financial },
    { value: 'personal', label: w.assetCat.personal },
    { value: 'business', label: w.assetCat.business },
  ]

  // ---- Children + nested residence history ----
  const children = getList('children')
  const addChild = () =>
    setList('children', [
      ...children,
      { name: '', dob: '', birthplace: '', sex: '', residences: [] },
    ])
  const removeChild = (i) =>
    setList('children', children.filter((_, j) => j !== i))
  const updateChild = (i, key, value) => {
    const arr = children.map((c, j) => (j === i ? { ...c, [key]: value } : c))
    setList('children', arr)
  }
  const addRes = (ci) => {
    const arr = children.map((c, j) =>
      j === ci
        ? {
            ...c,
            residences: [
              ...(c.residences || []),
              { period: '', city_state: '', lived_with: '', relationship: '' },
            ],
          }
        : c,
    )
    setList('children', arr)
  }
  const removeRes = (ci, ri) => {
    const arr = children.map((c, j) =>
      j === ci
        ? { ...c, residences: (c.residences || []).filter((_, k) => k !== ri) }
        : c,
    )
    setList('children', arr)
  }
  const updateRes = (ci, ri, key, value) => {
    const arr = children.map((c, j) =>
      j === ci
        ? {
            ...c,
            residences: (c.residences || []).map((r, k) =>
              k === ri ? { ...r, [key]: value } : r,
            ),
          }
        : c,
    )
    setList('children', arr)
  }

  // ---- Assets / Debts ----
  const assets = getList('assets')
  const addAsset = () =>
    setList('assets', [...assets, { category: '', description: '', value: '' }])
  const removeAsset = (i) => setList('assets', assets.filter((_, j) => j !== i))
  const updateAsset = (i, key, value) =>
    setList('assets', assets.map((a, j) => (j === i ? { ...a, [key]: value } : a)))

  const debts = getList('debts')
  const addDebt = () =>
    setList('debts', [...debts, { creditor: '', type: '', balance: '' }])
  const removeDebt = (i) => setList('debts', debts.filter((_, j) => j !== i))
  const updateDebt = (i, key, value) =>
    setList('debts', debts.map((d, j) => (j === i ? { ...d, [key]: value } : d)))

  const fieldOf = (def, value, onChange, type = 'text', options) => (
    <Field
      def={def}
      type={type}
      options={options}
      value={value}
      onChange={onChange}
      common={common}
    />
  )

  const dash = (v) => (v && String(v).trim() ? v : w.ui.notFilled)

  // Scenario chips derived from stored case/user.
  const scenarioChips = [
    caseRec.type ? t.caseType[caseRec.type].title : null,
    caseRec.has_children ? w.withChildren : null,
    user.county ? `${user.county} County` : null,
  ].filter(Boolean)

  // ----------------------------- section renderers -----------------------------
  // §10.1 contested filter. Answer 1/2 → proceed; 3 → stop-screen; 4 → explain.
  const renderSituation = () => {
    const sq = t.situation
    const value = val('situation')
    const opts = [
      { v: '1', label: sq.opt1 },
      { v: '2', label: sq.opt2 },
      { v: '3', label: sq.opt3 },
      { v: '4', label: sq.opt4 },
    ]
    return (
      <>
        <p className="wz-section-intro">{sq.question}</p>
        <div className="wz-checks">
          {opts.map((o) => (
            <label className="wz-check" key={o.v}>
              <input
                type="radio"
                name="situation"
                checked={value === o.v}
                onChange={() => setVal('situation', o.v)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>

        {value === '3' && (
          <div className="gate-stop">
            <h3>{sq.stopTitle}</h3>
            <p>{sq.stopBody}</p>
          </div>
        )}
        {value === '4' && (
          <div className="gate-info">
            <h3>{sq.unsureTitle}</h3>
            <p>{sq.unsureBody}</p>
          </div>
        )}
      </>
    )
  }

  const renderParties = () => (
    <div className="wz-grid">
      {F('petitioner_name')}
      {F('respondent_name')}
      {/* Petitioner contact — stored structurally (single source for form captions) */}
      {F('party_street')}
      {F('party_city')}
      {F('party_state')}
      {F('party_zip')}
      {F('party_phone')}
      {F('party_email')}
      {F('respondent_address')}
      {F('marriage_date', 'date')}
      {F('separation_date', 'date')}
    </div>
  )

  const renderChildren = () => (
    <>
      {children.length === 0 && <p className="wz-empty">{w.ui.noneYet}</p>}
      {children.map((child, ci) => (
        <div className="wz-item" key={ci}>
          <div className="wz-item__head">
            <strong>
              {w.ui.child} {ci + 1}
            </strong>
            <button className="btn-remove" onClick={() => removeChild(ci)}>
              {w.ui.remove}
            </button>
          </div>
          <div className="wz-grid">
            {fieldOf(w.f.child_name, child.name || '', (v) => updateChild(ci, 'name', v))}
            {fieldOf(w.f.child_dob, child.dob || '', (v) => updateChild(ci, 'dob', v), 'date')}
            {fieldOf(w.f.child_birthplace, child.birthplace || '', (v) => updateChild(ci, 'birthplace', v))}
            {fieldOf(w.f.child_sex, child.sex || '', (v) => updateChild(ci, 'sex', v), 'select', sexOptions)}
          </div>

          <div className="wz-sub">
            <div className="wz-sub__head">{w.ui.residenceTitle}</div>
            {(child.residences || []).map((r, ri) => (
              <div className="wz-subitem" key={ri}>
                <div className="wz-item__head">
                  <span>
                    {w.ui.period} {ri + 1}
                  </span>
                  <button className="btn-remove" onClick={() => removeRes(ci, ri)}>
                    {w.ui.remove}
                  </button>
                </div>
                <div className="wz-grid">
                  {fieldOf(w.f.res_period, r.period || '', (v) => updateRes(ci, ri, 'period', v))}
                  {fieldOf(w.f.res_city_state, r.city_state || '', (v) => updateRes(ci, ri, 'city_state', v))}
                  {fieldOf(w.f.res_lived_with, r.lived_with || '', (v) => updateRes(ci, ri, 'lived_with', v))}
                  {fieldOf(w.f.res_relationship, r.relationship || '', (v) => updateRes(ci, ri, 'relationship', v))}
                </div>
              </div>
            ))}
            <button className="btn-add" onClick={() => addRes(ci)}>
              + {w.ui.addPeriod}
            </button>
          </div>
        </div>
      ))}
      <button className="btn-add btn-add--main" onClick={addChild}>
        + {w.ui.addChild}
      </button>
    </>
  )

  const renderProperty = () => (
    <>
      <h3 className="wz-block-title">{w.ui.assetsTitle}</h3>
      {assets.length === 0 && <p className="wz-empty">{w.ui.noneYet}</p>}
      {assets.map((a, i) => (
        <div className="wz-item" key={i}>
          <div className="wz-item__head">
            <strong>
              {w.ui.asset} {i + 1}
            </strong>
            <button className="btn-remove" onClick={() => removeAsset(i)}>
              {w.ui.remove}
            </button>
          </div>
          <div className="wz-grid">
            {fieldOf(w.f.asset_category, a.category || '', (v) => updateAsset(i, 'category', v), 'select', assetCatOptions)}
            {fieldOf(w.f.asset_description, a.description || '', (v) => updateAsset(i, 'description', v))}
            {fieldOf(w.f.asset_value, a.value || '', (v) => updateAsset(i, 'value', v), 'number')}
          </div>
        </div>
      ))}
      <button className="btn-add btn-add--main" onClick={addAsset}>
        + {w.ui.addAsset}
      </button>

      <h3 className="wz-block-title" style={{ marginTop: 28 }}>
        {w.ui.debtsTitle}
      </h3>
      {debts.length === 0 && <p className="wz-empty">{w.ui.noneYet}</p>}
      {debts.map((d, i) => (
        <div className="wz-item" key={i}>
          <div className="wz-item__head">
            <strong>
              {w.ui.debt} {i + 1}
            </strong>
            <button className="btn-remove" onClick={() => removeDebt(i)}>
              {w.ui.remove}
            </button>
          </div>
          <div className="wz-grid">
            {fieldOf(w.f.debt_creditor, d.creditor || '', (v) => updateDebt(i, 'creditor', v))}
            {fieldOf(w.f.debt_type, d.type || '', (v) => updateDebt(i, 'type', v))}
            {fieldOf(w.f.debt_balance, d.balance || '', (v) => updateDebt(i, 'balance', v), 'number')}
          </div>
        </div>
      ))}
      <button className="btn-add btn-add--main" onClick={addDebt}>
        + {w.ui.addDebt}
      </button>
    </>
  )

  const renderIncome = () => (
    <>
      <PaystubImport />
      <div className="wz-grid">
        {F('petitioner_income', 'number')}
        {F('respondent_income', 'number')}
        {F('monthly_expenses', 'number')}
        {F('deductions', 'number')}
      </div>
    </>
  )

  const renderFees = () => {
    const fw = w.fees
    const benefits = getList('fee_waiver_benefits')
    const requested = val('fee_waiver_requested') === 'yes'
    const toggleBenefit = (key) => {
      const next = benefits.includes(key)
        ? benefits.filter((b) => b !== key)
        : [...benefits, key]
      setList('fee_waiver_benefits', next)
    }
    const evalResult = evaluateFeeWaiver({
      benefits,
      monthlyIncome: val('fee_waiver_income'),
      householdSize: val('fee_waiver_household'),
    })
    const resultMsg =
      evalResult.basis === 'benefits'
        ? fw.resultBenefits
        : evalResult.basis === 'income'
          ? fw.resultIncome
          : requested
            ? fw.resultRequested
            : fw.resultNone
    const showResult = requested || evalResult.eligible

    return (
      <>
        <div className="field">
          <label className="wz-check">
            <input
              type="checkbox"
              checked={requested}
              onChange={(e) => setVal('fee_waiver_requested', e.target.checked ? 'yes' : '')}
            />
            <span>{fw.requestLabel}</span>
            <HelpTip help={fw.requestHelp} exampleLabel={w.example} ariaLabel={w.help} />
          </label>
        </div>

        <div className="wz-grid">
          {fieldOf(
            { label: fw.householdLabel, help: fw.householdHelp },
            val('fee_waiver_household'),
            (v) => setVal('fee_waiver_household', v),
            'number',
          )}
          {fieldOf(
            { label: fw.incomeLabel, help: fw.incomeHelp },
            val('fee_waiver_income'),
            (v) => setVal('fee_waiver_income', v),
            'number',
          )}
        </div>

        {val('fee_waiver_household') && (
          <p className="wz-section-intro">
            {fmt(fw.limitNote, {
              n: evalResult.householdSize,
              limit: evalResult.limit.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            })}
          </p>
        )}

        <h3 className="wz-block-title">{fw.benefitsTitle}</h3>
        <div className="wz-checks">
          {FEE_WAIVER_BENEFITS.map((b) => (
            <label className="wz-check" key={b.key}>
              <input
                type="checkbox"
                checked={benefits.includes(b.key)}
                onChange={() => toggleBenefit(b.key)}
              />
              <span>{fw.benefits[b.key]}</span>
            </label>
          ))}
        </div>

        {showResult && <p className="wz-fee-result">{resultMsg}</p>}
      </>
    )
  }

  const renderConsent = () => (
    <>
      <div className="field">
        <label className="wz-check">
          <input
            type="checkbox"
            checked={val('respondent_consent') === 'yes'}
            onChange={(e) =>
              setVal('respondent_consent', e.target.checked ? 'yes' : '')
            }
          />
          <span>{w.f.respondent_consent.label}</span>
          <HelpTip
            help={w.f.respondent_consent.help}
            example={w.f.respondent_consent.example}
            exampleLabel={w.example}
            ariaLabel={w.help}
          />
        </label>
      </div>
      <div className="wz-grid">
        {F('respondent_name_confirm')}
        {F('respondent_signature')}
        {F('signature_date', 'date')}
      </div>
    </>
  )

  const reviewRow = (label, value) => (
    <div className="review-row">
      <dt>{label}</dt>
      <dd>{dash(value)}</dd>
    </div>
  )

  const renderReview = () => (
    <div className="review">
      <p className="review-ready">✓ {w.reviewReady}</p>

      <h3 className="wz-block-title">{w.sec.parties.title}</h3>
      <dl className="review-list">
        {reviewRow(w.f.petitioner_name.label, val('petitioner_name'))}
        {reviewRow(w.f.petitioner_address.label, val('petitioner_address'))}
        {reviewRow(w.f.respondent_name.label, val('respondent_name'))}
        {reviewRow(w.f.respondent_address.label, val('respondent_address'))}
        {reviewRow(w.f.marriage_date.label, val('marriage_date'))}
        {reviewRow(w.f.separation_date.label, val('separation_date'))}
      </dl>

      <h3 className="wz-block-title">{w.sec.children.title}</h3>
      {children.length === 0 && <p className="wz-empty">{w.ui.noneYet}</p>}
      {children.map((c, i) => (
        <dl className="review-list" key={i}>
          {reviewRow(
            `${w.ui.child} ${i + 1}`,
            [dash(c.name), c.dob, c.birthplace, c.sex ? w.sex[c.sex] : '']
              .filter((x) => x && x !== w.ui.notFilled)
              .join(' · '),
          )}
          {reviewRow(w.ui.residenceTitle, `${(c.residences || []).length}`)}
        </dl>
      ))}

      <h3 className="wz-block-title">{w.ui.assetsTitle}</h3>
      {assets.length === 0 && <p className="wz-empty">{w.ui.noneYet}</p>}
      {assets.map((a, i) => (
        <dl className="review-list" key={i}>
          {reviewRow(
            `${w.ui.asset} ${i + 1}`,
            [a.category ? w.assetCat[a.category] : '', a.description, a.value ? `$${a.value}` : '']
              .filter(Boolean)
              .join(' · '),
          )}
        </dl>
      ))}

      <h3 className="wz-block-title">{w.ui.debtsTitle}</h3>
      {debts.length === 0 && <p className="wz-empty">{w.ui.noneYet}</p>}
      {debts.map((d, i) => (
        <dl className="review-list" key={i}>
          {reviewRow(
            `${w.ui.debt} ${i + 1}`,
            [d.creditor, d.type, d.balance ? `$${d.balance}` : '']
              .filter(Boolean)
              .join(' · '),
          )}
        </dl>
      ))}

      <h3 className="wz-block-title">{w.sec.income.title}</h3>
      <dl className="review-list">
        {reviewRow(w.f.petitioner_income.label, val('petitioner_income'))}
        {reviewRow(w.f.respondent_income.label, val('respondent_income'))}
        {reviewRow(w.f.monthly_expenses.label, val('monthly_expenses'))}
        {reviewRow(w.f.deductions.label, val('deductions'))}
      </dl>

      <h3 className="wz-block-title">{w.sec.consent.title}</h3>
      <dl className="review-list">
        {reviewRow(
          w.f.respondent_consent.label,
          val('respondent_consent') === 'yes' ? t.common.yes : t.common.no,
        )}
        {reviewRow(w.f.respondent_name_confirm.label, val('respondent_name_confirm'))}
        {reviewRow(w.f.respondent_signature.label, val('respondent_signature'))}
        {reviewRow(w.f.signature_date.label, val('signature_date'))}
      </dl>
    </div>
  )

  const SECTION_RENDERERS = {
    situation: renderSituation,
    parties: renderParties,
    children: renderChildren,
    property: renderProperty,
    income: renderIncome,
    fees: renderFees,
    consent: renderConsent,
    review: renderReview,
  }

  // The contested gate blocks progress until the answer is agreement/default.
  const gateBlocked = sectionKey === 'situation' && !SITUATION_PROCEED.has(val('situation'))

  return (
    <section className="screen">
      <p className="screen__eyebrow">{w.eyebrow}</p>
      <h1 className="screen__title">{w.title}</h1>
      <p className="screen__lead">{w.lead}</p>

      {scenarioChips.length > 0 && (
        <div className="wz-scenario">
          <span className="wz-scenario__label">{w.scenario}:</span>
          {scenarioChips.map((c) => (
            <span className="wz-scenario__chip" key={c}>
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="wizard__head">
          <strong style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>
            {w.sec[sectionKey].title}
          </strong>
          <span className="wizard__count">
            {fmt(w.counter, { a: active + 1, b: total, p: pct })}
          </span>
        </div>

        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="wizard__steps">
          {SECTIONS.map((key, i) => (
            <button
              key={key}
              className={`wizard__chip ${
                i === active ? 'is-active' : i < active ? 'is-done' : ''
              }`}
              // While the contested gate is unresolved, only the gate step is reachable.
              disabled={gateBlocked && i > 0}
              onClick={() => setActive(i)}
            >
              {i + 1}. {w.sec[key].title}
            </button>
          ))}
        </div>

        <p className="wz-section-intro">{w.sec[sectionKey].intro}</p>

        {SECTION_RENDERERS[sectionKey]()}

        {sectionKey !== 'review' && (
          <p className="autosave">
            <span className="autosave__dot" /> {w.saved}
          </p>
        )}

        <div
          className="actions"
          style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)' }}
        >
          <button
            className="btn btn--ghost"
            disabled={active === 0}
            onClick={() => setActive((i) => Math.max(0, i - 1))}
          >
            ← {w.prev}
          </button>
          <button
            className="btn btn--dark"
            disabled={active === total - 1 || gateBlocked}
            onClick={() => setActive((i) => Math.min(total - 1, i + 1))}
          >
            {w.next} →
          </button>
        </div>
      </div>

      <ScreenNav current={3} nextLabel={w.toCalculator} />
    </section>
  )
}
