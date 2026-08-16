import { Link } from 'react-router-dom'
import type { DirectoryContent, Lang, UIStrings } from '@/lib/types'
import { Layout, Footer } from '@/components/Layout'
import { FacilityStay } from '@/components/FacilityStay'
import { pathFor } from '@/lib/slugs'
import directory from '@data/directory.json'
import states from '@data/states.json'
import type { DirectoryFacility, StateRec } from '@data/types'

// Штаты со своими страницами — на них ведём ссылку.
const STATE_PAGES = new Set((states as StateRec[]).map((s) => s.code))

const fill = (tpl: string, f: DirectoryFacility) =>
  tpl.replace('{name}', f.name).replace('{city}', f.city).replace('{st}', f.state)

export function FacilityDirPage({
  lang,
  code,
  ui,
  dir,
}: {
  lang: Lang
  code: string
  ui: UIStrings
  dir: DirectoryContent
}) {
  const f = (directory as DirectoryFacility[]).find((x) => x.code === code)!
  const d = dir.dirFacility
  const L = dir.facility.labels

  const rows: [string, string][] = [
    [L.addr, `${f.address}, ${f.city}, ${f.state} ${f.zip}`],
    [d.countyLabel, f.county],
    [L.st, f.state],
    [L.circuit, dir.circuitNames[f.circuit] ?? f.circuit],
    [d.officeLabel, f.field_office],
  ]

  return (
    <Layout
      lang={lang}
      pageKey={`fac-${f.code}`}
      ui={ui}
      title={fill(d.metaTitle, f)}
      description={fill(d.metaDesc, f)}
    >
      <h1 className="page-h1">{f.name}</h1>
      <p className="lede">{fill(d.lede, f)}</p>
      {rows
        .filter(([, v]) => v && v.trim() !== '')
        .map(([k, v], i) => (
          <div key={i} className="kv">
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      <FacilityStay code={f.code} ui={ui} />
      <h2 className="page-h2">{d.findH2}</h2>
      {d.findLinks.map((l) => (
        <Link key={l.page} className="ghost" to={pathFor(lang, l.page)}>
          {l.label} →
        </Link>
      ))}
      <h2 className="page-h2">{dir.facility.lettersH2}</h2>
      <ul className="blist">
        {dir.facility.letters.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      {STATE_PAGES.has(f.state) && (
        <Link className="ghost" to={pathFor(lang, `state-${f.state.toLowerCase()}`)}>
          {dir.facility.stateH2} →
        </Link>
      )}
      <Link className="ghost" to={pathFor(lang, 'facilities')}>
        {dir.dirIndex.title} →
      </Link>
      <p className="body-p dim">{d.sourceNote}</p>
      <Footer ui={ui} />
    </Layout>
  )
}

export function DirIndexPage({
  lang,
  ui,
  dir,
}: {
  lang: Lang
  ui: UIStrings
  dir: DirectoryContent
}) {
  const d = dir.dirIndex
  const byState = new Map<string, DirectoryFacility[]>()
  for (const f of directory as DirectoryFacility[]) {
    if (!byState.has(f.state)) byState.set(f.state, [])
    byState.get(f.state)!.push(f)
  }
  const stateCodes = [...byState.keys()].sort()

  return (
    <Layout
      lang={lang}
      pageKey="facilities"
      ui={ui}
      title={d.metaTitle}
      description={d.metaDesc}
    >
      <h1 className="page-h1">{d.title}</h1>
      <p className="lede">{d.lede}</p>
      {stateCodes.map((st) => {
        const rec = (states as StateRec[]).find((s) => s.code === st)
        return (
          <section key={st}>
            <h2 className="page-h2">{rec ? rec.name[lang] : st}</h2>
            {byState
              .get(st)!
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((f) => (
                <Link
                  key={f.code}
                  className="ghost"
                  to={pathFor(lang, f.code === 'ADLNTCA' ? 'facility-adelanto' : `fac-${f.code}`)}
                >
                  {f.name} · {f.city} →
                </Link>
              ))}
          </section>
        )
      })}
      <p className="body-p dim">{d.note}</p>
      <Footer ui={ui} />
    </Layout>
  )
}
