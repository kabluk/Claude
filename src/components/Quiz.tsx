import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { IntakeContent, IntakeTask, Lang, UIStrings } from '@/lib/types'
import { pathFor } from '@/lib/slugs'
import { rules, visibleQuestions, type Ans, type Priority } from '@/lib/intake'

// Опрос целиком в браузере: ответы никуда не отправляются, состояние живёт
// в памяти вкладки. Закрыли вкладку — ничего не осталось.

function TaskCard({
  d,
  prio,
  reason,
  open,
  onToggle,
  c,
  lang,
  nav,
}: {
  d: IntakeTask
  prio: Priority
  reason: string
  open: boolean
  onToggle: () => void
  c: IntakeContent
  lang: Lang
  nav: UIStrings['nav']
}) {
  const s = c.ui.sections
  return (
    <div className={`task ${prio} ${open ? 'open' : ''}`}>
      <button className="thead" onClick={onToggle} type="button" aria-expanded={open}>
        <span className="tx">
          {d.ev && (
            <>
              <span className="badge">{c.ui.evBadge}</span>
              <br />
            </>
          )}
          <h3>{d.h}</h3>
          <p>{d.p}</p>
        </span>
        <span className="chev">›</span>
      </button>
      <div className="tbody">
        {d.why && (
          <>
            <h4>{s.why}</h4>
            <p>{d.why}</p>
          </>
        )}
        {d.how && (
          <>
            <h4>{s.how}</h4>
            <ol>
              {d.how.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
          </>
        )}
        {d.src && (
          <>
            <h4>{s.src}</h4>
            <div className="srcbox">
              {d.src.map(([label, addr], i) => (
                <div key={i}>
                  <b>{label}</b>
                  <span>{addr}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {d.info && (
          <>
            <h4>{s.info}</h4>
            <div className="formbox">{d.info}</div>
          </>
        )}
        {d.say && (
          <>
            <h4>{s.say}</h4>
            <div className="say">
              <em>{s.sayTag}</em>
              {d.say}
            </div>
          </>
        )}
        {d.form && (
          <>
            <h4>{s.form}</h4>
            <div className="formbox">{d.form}</div>
          </>
        )}
        {d.warn && (
          <>
            <h4>{s.warn}</h4>
            <div className="warnbox">{d.warn}</div>
          </>
        )}
        {d.pages && d.pages.length > 0 && (
          <>
            <h4>{c.ui.moreLabel}</h4>
            {d.pages.map((p) => (
              <Link key={p} className="ghost" to={pathFor(lang, p)}>
                {nav[p]} →
              </Link>
            ))}
          </>
        )}
        <div className="whyline">
          {c.ui.whyPrefix}: {reason}
        </div>
      </div>
    </div>
  )
}

export function Quiz({ c, lang, nav }: { c: IntakeContent; lang: Lang; nav: UIStrings['nav'] }) {
  const [ans, setAns] = useState<Ans>({})
  const [i, setI] = useState(0)
  const [fin, setFin] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const vis = visibleQuestions(ans)

  const blocks = [...new Set(vis.map((q) => q.block))]
  const curBlock = vis[i]?.block ?? 99
  const segs = blocks.map((b) => {
    const qs = vis.filter((q) => q.block === b)
    return qs.every((q) => ans[q.id] !== undefined) ? 'on' : b === curBlock ? 'cur' : ''
  })

  function pick(id: string, v: string) {
    setAns((a) => ({ ...a, [id]: v }))
  }
  function next() {
    if (i < vis.length - 1) setI(i + 1)
    else setFin(true)
    window.scrollTo(0, 0)
  }
  function prev() {
    if (i > 0) setI(i - 1)
    window.scrollTo(0, 0)
  }
  function again() {
    setAns({})
    setI(0)
    setFin(false)
    setOpen({})
    window.scrollTo(0, 0)
  }

  const progress = (
    <>
      <div className="bar" style={{ padding: '0 0 12px' }}>
        {segs.map((cl, k) => (
          <div key={k} className={`seg ${cl}`} />
        ))}
      </div>
      <div className="count mono" style={{ marginBottom: 18 }}>
        {fin ? c.ui.done : `${Math.min(i + 1, vis.length)} / ${vis.length}`}
      </div>
    </>
  )

  if (fin) {
    const T = rules(ans)
    const groups: Priority[] = ['now', 'soon', 'later']
    return (
      <div>
        {progress}
        <div className="eyebrow">{c.ui.resultEyebrow}</div>
        <h1 className="q-h1">
          {T.length} {c.ui.resultTitle}
        </h1>
        <p className="hint">{c.ui.resultHint}</p>
        <div className="box g">
          <p>{c.ui.resultIntro}</p>
        </div>
        {groups.map((p) => {
          const list = T.filter((t) => t.p === p)
          if (!list.length) return null
          return (
            <div key={p}>
              <div className="grp">{c.ui.groups[p]}</div>
              {list.map((t) => (
                <TaskCard
                  key={t.k}
                  d={c.tasks[t.k]}
                  prio={p}
                  reason={c.reasons[t.rk]}
                  open={!!open[t.k]}
                  onToggle={() => setOpen((o) => ({ ...o, [t.k]: !o[t.k] }))}
                  c={c}
                  lang={lang}
                  nav={nav}
                />
              ))}
            </div>
          )
        })}
        <div className="note">
          <h3>{c.ui.evNote.h}</h3>
          <p>{c.ui.evNote.p}</p>
        </div>
        <div className="note">
          <h3>{c.ui.zoneBNote.h}</h3>
          <p>{c.ui.zoneBNote.p}</p>
        </div>
        <div className="qnav">
          <button className="btn" onClick={() => window.print()} type="button">
            {c.ui.printBtn}
          </button>
          <button className="btn ghostbtn" onClick={again} type="button">
            {c.ui.againBtn}
          </button>
        </div>
        <p className="foot">{c.ui.foot}</p>
      </div>
    )
  }

  const q = vis[i]
  const qc = c.questions[q.id]
  const role = ans.role === 'self' ? 'self' : 'other'
  const qText = typeof qc.q === 'string' ? qc.q : qc.q[role]
  const optValues = q.opts(ans)
  const hasDunno = optValues.some((v) => qc.o[v]?.d)

  return (
    <div>
      {progress}
      <div className="eyebrow">{qc.bn}</div>
      <h1 className="q-h1">{qText}</h1>
      {qc.hint ? <p className="hint">{qc.hint}</p> : <div style={{ height: 12 }} />}
      {optValues.map((v) => {
        const o = qc.o[v]
        const label = typeof o.t === 'string' ? o.t : o.t[role]
        return (
          <button
            key={v}
            className={`opt ${o.d ? 'dunno' : ''} ${ans[q.id] === v ? 'sel' : ''}`}
            onClick={() => pick(q.id, v)}
            type="button"
          >
            {label}
            {o.s && <small>{o.s}</small>}
          </button>
        )
      })}
      {hasDunno && <p className="reassure">{c.ui.reassure}</p>}
      <div className="qnav">
        {i > 0 && (
          <button className="btn ghostbtn" onClick={prev} type="button">
            {c.ui.backBtn}
          </button>
        )}
        <button className="btn" onClick={next} disabled={ans[q.id] === undefined} type="button">
          {c.ui.nextBtn}
        </button>
      </div>
    </div>
  )
}
