import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'
import { runReadiness } from '../readiness/checks.js'

// Wizard step order (mirrors Wizard.jsx SECTIONS) — used to resolve a section
// anchor to a wizard_step index so "Fix" lands on the right step.
const WIZARD_SECTIONS = ['parties', 'children', 'property', 'income', 'consent', 'review']

const ICON = { ok: '✅', warn: '⚠️', error: '❌' }
const GROUP_ORDER = ['fields', 'consistency', 'forms', 'county', 'signatures']

export default function Readiness() {
  const navigate = useNavigate()
  const { t, fmt } = useI18n()
  const { user, caseRec, answers, updateCase } = useAppState()
  const r = t.readiness

  const { items, counts } = runReadiness({ user, caseRec, answers })

  // Resolve an item's display text from i18n, injecting resolved field/who labels.
  const textFor = (it) => {
    const params = { ...it.params }
    if (params.field != null) params.field = r.fieldLabels[params.field] || params.field
    if (params.who != null) params.who = r.who[params.who] || params.who
    return fmt(r.msg[it.key] || it.key, params)
  }

  // "Fix" → navigate to the anchor. Wizard sections resume via wizard_step.
  const goFix = (anchor) => {
    if (!anchor) return
    if (anchor.section) {
      const idx = WIZARD_SECTIONS.indexOf(anchor.section)
      if (idx >= 0) updateCase({ wizard_step: idx })
    }
    navigate(anchor.route)
  }

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    label: r.groups[g],
    rows: items.filter((it) => it.group === g),
  })).filter((g) => g.rows.length > 0)

  const clean = counts.error === 0 && counts.warn === 0

  return (
    <section className="screen">
      <p className="screen__eyebrow">{r.eyebrow}</p>
      <h1 className="screen__title">{r.title}</h1>
      <p className="screen__lead">{r.lead}</p>

      <div className="readiness-summary">
        <span className="rd-pill rd-pill--ok">{ICON.ok} {counts.ok} · {r.status.ok}</span>
        <span className="rd-pill rd-pill--warn">{ICON.warn} {counts.warn} · {r.status.warn}</span>
        <span className="rd-pill rd-pill--error">{ICON.error} {counts.error} · {r.status.error}</span>
      </div>

      {clean && <p className="readiness-clear">✅ {r.allClear}</p>}

      {grouped.map((g) => (
        <div className="panel readiness-group" key={g.group}>
          <h2 className="wz-block-title" style={{ marginTop: 0 }}>{g.label}</h2>
          <ul className="readiness-list">
            {g.rows.map((it, i) => (
              <li key={i} className={`rd-row rd-row--${it.severity}`}>
                <span className="rd-row__icon">{ICON[it.severity]}</span>
                <span className="rd-row__text">{textFor(it)}</span>
                {it.severity !== 'ok' && it.anchor && (
                  <button className="btn btn--ghost rd-row__fix" onClick={() => goFix(it.anchor)}>
                    {r.fix} →
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="actions">
        <button className="btn btn--ghost" onClick={() => navigate('/preview')}>
          ← {t.common.back}
        </button>
        <button className="btn btn--primary" onClick={() => navigate('/cabinet')}>
          {t.common.next} →
        </button>
      </div>
    </section>
  )
}
