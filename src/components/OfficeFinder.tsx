import { useMemo, useState } from 'react'
import type { UIStrings } from '@/lib/types'
import offices from '@data/offices.json'
import type { OfficeRec } from '@data/types'

// «Введите город или штат — получите офис ICE». Поиск по официальному
// справочнику (Deportation Data Project): имя, тип, адрес, зона (AOR).
// Часы и телефоны не храним — они волатильны.
const OFF = offices as OfficeRec[]
const MAX = 12

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

function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е')
}

export function OfficeFinder({ ui }: { ui: UIStrings }) {
  const v = ui.officeFinder
  const [q, setQ] = useState('')

  const all = useMemo(() => {
    const nq = norm(q.trim())
    if (nq.length < 2) return []
    const terms = nq.split(/\s+/)
    return OFF.filter((o) => {
      const hay = norm([o.name, o.city, o.state, STATE_NAMES[o.state] ?? '', o.aor].join(' '))
      return terms.every((t) => hay.includes(t))
    })
  }, [q])

  const searched = norm(q.trim()).length >= 2
  const shown = all.slice(0, MAX)

  return (
    <div className="toolbox visitfinder">
      <label htmlFor="of-in">{v.label}</label>
      <input
        id="of-in"
        type="text"
        value={q}
        placeholder={v.placeholder}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
      />
      {!searched && (
        <p className="hint" style={{ marginTop: 10 }}>
          {v.hint}
        </p>
      )}

      {shown.map((o, i) => (
        <div key={i} className="vf-card">
          <h3>{o.name}</h3>
          <p className="vf-addr">{o.address}</p>
          <p className="vf-meta">
            {o.type === 'Sub-office' ? v.typeSub : v.typeField}
            {o.aor ? ` · ${v.aorLabel}: ${o.aor}` : ''}
          </p>
        </div>
      ))}

      {searched && all.length > MAX && <p className="hint">{ui.visitFinder.moreResults}</p>}
      {searched && all.length > 0 && <p className="hint">{v.note}</p>}
      {searched && all.length === 0 && (
        <div className="vf-fallback">
          <p className="body-p">{v.empty}</p>
        </div>
      )}
    </div>
  )
}
