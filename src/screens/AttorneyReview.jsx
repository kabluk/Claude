import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { store } from '../data/repository.js'
import { listForms } from '../pdf/index.js'

// Attorney review queue (internal, feature-flagged). Side-by-side: the case's
// wizard answers ↔ the assembled packet (filled PDFs), with non-standard values
// highlighted for the reviewer. Approve, or return for correction with a note.
// Operates across cases, so it reads the store directly (not the client's
// current-case AppState).

const STR = {
  en: {
    title: 'Attorney review queue',
    empty: 'No cases in the review queue.',
    queue: 'Queue',
    answers: 'Wizard answers',
    packet: 'Assembled packet (filled PDFs)',
    flags: 'Flagged for review (non-standard values)',
    none: 'Nothing flagged — values match common defaults.',
    notes: 'Review notes / correction comment',
    approve: 'Approve packet',
    return: 'Return for correction',
    sla: 'SLA due',
    status: 'Status',
    approved: 'Approved',
    returned: 'Returned for correction',
  },
  ru: {
    title: 'Очередь проверки адвокатом',
    empty: 'В очереди нет дел.',
    queue: 'Очередь',
    answers: 'Ответы визарда',
    packet: 'Собранный пакет (заполненные PDF)',
    flags: 'Отмечено для проверки (нестандартные значения)',
    none: 'Ничего не отмечено — значения совпадают с типовыми.',
    notes: 'Заметки проверки / комментарий к возврату',
    approve: 'Одобрить пакет',
    return: 'Вернуть на исправление',
    sla: 'Срок SLA',
    status: 'Статус',
    approved: 'Одобрено',
    returned: 'Возвращено на исправление',
  },
}

// Heuristic: surface values a reviewer should look at (deviations from the
// common uncontested-default packet). Not legal advice — just navigation.
function flagAnswers(map) {
  const f = []
  const t = (k) => String(map[k] ?? '').toLowerCase()
  if (map.spousal_support_type && !['reserve', 'reserved'].includes(t('spousal_support_type')))
    f.push(`spousal_support_type = ${map.spousal_support_type}`)
  if (map.legal_custody_to && t('legal_custody_to') !== 'joint')
    f.push(`legal_custody_to = ${map.legal_custody_to}`)
  if (map.physical_custody_to && t('physical_custody_to') !== 'joint')
    f.push(`physical_custody_to = ${map.physical_custody_to}`)
  if (map.visitation_type && t('visitation_type') !== 'reasonable')
    f.push(`visitation_type = ${map.visitation_type}`)
  if (!map.respondent_name) f.push('respondent_name is empty')
  if (!map.date_of_marriage) f.push('date_of_marriage is empty')
  return f
}

export default function AttorneyReview() {
  const { lang } = useI18n()
  const L = STR[lang] || STR.en
  const [, force] = useState(0) // re-render after store writes
  const queue = store.listReviews()
  const [selId, setSelId] = useState(queue[0]?.id || null)
  const [notes, setNotes] = useState('')

  const sel = queue.find((r) => r.id === selId) || null
  const caseAnswers = sel ? store.getAnswers(sel.case_id) : []
  const answerMap = Object.fromEntries(caseAnswers.map((a) => [a.field_key, a.value]))
  const flags = flagAnswers(answerMap)
  const flaggedKeys = new Set(flags.map((s) => s.split(' ')[0]))
  const forms = listForms().map((f) => f.id)

  const act = (patch) => {
    store.updateReview(sel.id, patch)
    force((n) => n + 1)
    setNotes('')
  }

  if (!queue.length) {
    return (
      <section className="screen">
        <h1 className="screen__title">{L.title}</h1>
        <p className="screen__lead">{L.empty}</p>
      </section>
    )
  }

  return (
    <section className="screen">
      <h1 className="screen__title">{L.title}</h1>

      <div className="panel">
        <h2>{L.queue}</h2>
        <ul>
          {queue.map((r) => (
            <li key={r.id}>
              <button className="btn" onClick={() => setSelId(r.id)}>
                {r.case_id.slice(0, 12)} — {r.status} · {L.sla}: {String(r.sla_deadline).slice(0, 10)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {sel && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="panel">
            <h2>{L.answers}</h2>
            <table style={{ width: '100%', fontSize: '0.85rem' }}>
              <tbody>
                {caseAnswers.map((a) => {
                  const flagged = flaggedKeys.has(a.field_key)
                  return (
                    <tr key={a.id} style={flagged ? { background: 'rgba(200,140,0,0.18)' } : undefined}>
                      <td style={{ fontWeight: flagged ? 700 : 400 }}>{a.field_key}</td>
                      <td>{String(a.value).slice(0, 60)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h2>{L.packet}</h2>
            <ul>
              {forms.map((id) => (
                <li key={id}>{id}-DRAFT.pdf</li>
              ))}
            </ul>
            <h3>{L.flags}</h3>
            {flags.length ? (
              <ul>
                {flags.map((s) => (
                  <li key={s} style={{ color: '#b26a00' }}>⚑ {s}</li>
                ))}
              </ul>
            ) : (
              <p className="fl100__hint">{L.none}</p>
            )}
          </div>
        </div>
      )}

      {sel && (
        <div className="panel">
          <label className="field__label" htmlFor="review-notes">
            {L.notes}
          </label>
          <textarea
            id="review-notes"
            rows={3}
            style={{ width: '100%' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button
              className="btn btn--primary"
              onClick={() => act({ status: 'approved', approved_at: new Date().toISOString(), review_notes: notes })}
            >
              {L.approve}
            </button>{' '}
            <button
              className="btn"
              onClick={() => act({ status: 'returned_for_correction', review_notes: notes })}
            >
              {L.return}
            </button>
          </div>
          <p className="fl100__hint">
            {L.status}: {sel.status}
            {sel.approved_at ? ` · ${sel.approved_at.slice(0, 10)}` : ''}
          </p>
        </div>
      )}
    </section>
  )
}
