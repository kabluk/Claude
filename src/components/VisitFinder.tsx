import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Lang, UIStrings } from '@/lib/types'
import { pathFor } from '@/lib/slugs'
import { IceGate } from './IceGate'
import directory from '@data/directory.json'
import facilities from '@data/facilities.json'
import type { DirectoryFacility, FacilityRec } from '@data/types'

// «Вводят город или название — получают учреждение». Поиск по официальной
// директории ICE (данные собраны Deportation Data Project, июнь 2026):
// имя, адрес, округ, штат, федеральный округ. Часы и телефоны свиданий
// НЕ храним — они меняются; ведём на страницу ICE и на скрипт звонка.
// Для проверенных вручную учреждений (Аделанто) показываем правила + свою
// страницу.

const DIR = directory as DirectoryFacility[]
const ENHANCED = new Map(
  (facilities as FacilityRec[]).filter((f) => f.code).map((f) => [f.code as string, f]),
)
const MAX = 12

// Английские названия штатов — для поиска (город/штат/название) и подписи.
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  PR: 'Puerto Rico', GU: 'Guam',
}

const MANDATORY_CIRCUITS = new Set(['5', '8'])

function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е')
}

export function VisitFinder({ lang, ui }: { lang: Lang; ui: UIStrings }) {
  const v = ui.visitFinder
  const [q, setQ] = useState('')

  const all = useMemo(() => {
    const nq = norm(q.trim())
    if (nq.length < 2) return []
    const terms = nq.split(/\s+/)
    return DIR.filter((f) => {
      const hay = norm(
        [f.name, f.city, f.county, f.state, STATE_NAMES[f.state] ?? ''].join(' '),
      )
      return terms.every((t) => hay.includes(t))
    })
  }, [q])

  const searched = norm(q.trim()).length >= 2
  const shown = all.slice(0, MAX)

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
      {!searched && <p className="hint" style={{ marginTop: 10 }}>{v.inBase}</p>}

      {shown.map((f) => {
        const enh = ENHANCED.get(f.code)
        const warn = MANDATORY_CIRCUITS.has(f.circuit)
        return (
          <div key={f.code} className="vf-card">
            <h3>{f.name}</h3>
            <p className="vf-addr">
              {f.address}, {f.city}, {f.state} {f.zip}
            </p>
            <p className="vf-meta">
              {f.county ? `${f.county} · ` : ''}
              {v.fieldOfficeLabel}: {f.field_office}
            </p>
            <p className="vf-meta">
              {v.circuitLabel}: {v.circuits[f.circuit] ?? f.circuit}
            </p>
            {warn && <div className="vf-warn">{v.mandatoryWarn}</div>}

            {enh?.visit && (
              <ul className="blist">
                {enh.visit[lang].map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
            {enh?.phone && (
              <p className="vf-addr">
                <a href={`tel:${enh.phone.replace(/[^\d+]/g, '')}`}>{enh.phone}</a>
              </p>
            )}
            {enh && (
              <Link className="ghost" to={pathFor(lang, `facility-${enh.slug}`)}>
                {v.facilityPage} →
              </Link>
            )}

            <p className="vf-icehours">{v.iceHours}</p>
          </div>
        )
      })}

      {searched && all.length > MAX && <p className="hint">{v.moreResults}</p>}

      {searched && all.length > 0 && (
        <>
          <IceGate href="https://www.ice.gov/detain/detention-facilities/" label={v.iceLabel} ui={ui} />
          <p className="hint">{v.provenance}</p>
        </>
      )}

      {searched && all.length === 0 && (
        <div className="vf-fallback">
          <h3>{v.notFoundTitle}</h3>
          <p className="body-p">{v.notFoundBody}</p>
          <p className="vf-ask-t">{v.askTitle}</p>
          <ul className="blist">
            {v.ask.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <IceGate href="https://www.ice.gov/detain/detention-facilities/" label={v.iceLabel} ui={ui} />
          <p className="hint">{v.drilNote}</p>
        </div>
      )}
    </div>
  )
}
