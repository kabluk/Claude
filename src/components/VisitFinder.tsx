import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Lang, UIStrings } from '@/lib/types'
import { pathFor } from '@/lib/slugs'
import { IceGate } from './IceGate'
import facilities from '@data/facilities.json'
import states from '@data/states.json'
import type { FacilityRec, StateRec } from '@data/types'

// «Вводят учреждение — получают полный ответ»: карточка из проверенной
// базы, а для любого другого учреждения — скрипт одного звонка
// и официальная страница ICE. Таблицы часов не копируем: они меняются
// по блокам и без предупреждения (RESEARCH-visits §1).

function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е')
}

export function VisitFinder({ lang, ui }: { lang: Lang; ui: UIStrings }) {
  const v = ui.visitFinder
  const [q, setQ] = useState('')

  const matches = useMemo(() => {
    const nq = norm(q.trim())
    if (nq.length < 2) return []
    return (facilities as FacilityRec[]).filter((f) => {
      const st = (states as StateRec[]).find((s) => s.code === f.state_code)
      const hay = norm(
        [f.name, f.address, f.state_code, st?.name.en ?? '', st ? st.name[lang] : ''].join(' '),
      )
      return nq.split(/\s+/).every((w) => hay.includes(w))
    })
  }, [q, lang])

  const searched = norm(q.trim()).length >= 2

  return (
    <div className="toolbox visitfinder">
      <label htmlFor="vf-in">{v.label}</label>
      <input
        id="vf-in"
        type="text"
        value={q}
        placeholder={v.placeholder}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
      />
      {!searched && (
        <p className="hint" style={{ marginTop: 10 }}>
          {v.inBase}{' '}
          {(facilities as FacilityRec[]).map((f) => (
            <button key={f.slug} type="button" className="vf-chip" onClick={() => setQ(f.name)}>
              {f.name}
            </button>
          ))}
        </p>
      )}

      {matches.map((f) => (
        <div key={f.slug} className="vf-card">
          <h3>{f.name}</h3>
          <p className="vf-addr">{f.address}</p>
          <p className="vf-addr">
            <a href={`tel:${f.phone.replace(/[^\d+]/g, '')}`}>{f.phone}</a>
          </p>
          {f.visit && (
            <ul className="blist">
              {f.visit[lang].map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
          <Link className="ghost" to={pathFor(lang, `facility-${f.slug}`)}>
            {v.facilityPage} →
          </Link>
        </div>
      ))}

      {searched && matches.length === 0 && (
        <div className="vf-fallback">
          <h3>{v.notFoundTitle}</h3>
          <p className="body-p">{v.notFoundBody}</p>
          <p className="vf-ask-t">{v.askTitle}</p>
          <ul className="blist">
            {v.ask.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <IceGate href="https://www.ice.gov/detention-facilities" label={v.iceLabel} ui={ui} />
          <p className="hint">{v.drilNote}</p>
        </div>
      )}
    </div>
  )
}
