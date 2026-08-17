import { Link } from 'react-router-dom'
import type { DirectoryContent, Lang, UIStrings } from '@/lib/types'
import { Layout, Footer } from '@/components/Layout'
import { pathFor } from '@/lib/slugs'
import states from '@data/states.json'
import courts from '@data/courts.json'
import facilities from '@data/facilities.json'
import directory from '@data/directory.json'
import type { CourtRec, DirectoryFacility, FacilityRec, StateRec } from '@data/types'

// Расширенные учреждения (свои страницы) — по коду к slug.
const ENH_SLUG = new Map(
  (facilities as FacilityRec[]).filter((f) => f.code).map((f) => [f.code as string, f.slug]),
)

export function StatePage({
  lang,
  code,
  pageKey,
  dir,
  ui,
}: {
  lang: Lang
  code: string
  pageKey: string
  dir: DirectoryContent
  ui: UIStrings
}) {
  const st = (states as StateRec[]).find((x) => x.code === code)!
  const stCourts = (courts as CourtRec[]).filter((c) => c.state_code === code)
  const stFacilities = (directory as DirectoryFacility[])
    .filter((f) => f.state === code)
    .sort((a, b) => a.name.localeCompare(b.name))
  const d = dir.statePage

  return (
    <Layout lang={lang} pageKey={pageKey} ui={ui} title={`${st.name[lang]} · DETNAV`} description={d.lede}>
      <h1 className="page-h1">{st.name[lang]}</h1>
      <p className="lede">{d.lede}</p>
      <p className="updated-badge">{ui.updatedShort}</p>
      <div className="kv">
        <span>{d.circuitLine}</span>
        <span>{dir.circuitNames[String(st.circuit)]}</span>
      </div>
      {st.notes[lang] && (
        <div className="box y">
          <p>{st.notes[lang]}</p>
        </div>
      )}

      <h2 className="page-h2">{d.courtsH2}</h2>
      {stCourts.length ? (
        stCourts.map((c) => (
          <div key={c.slug} className="kv">
            <span>{c.name}</span>
            <span>{c.address}</span>
          </div>
        ))
      ) : (
        <p className="body-p dim">{ui.dirEmpty}</p>
      )}

      <h2 className="page-h2">{d.facilitiesH2}</h2>
      {stFacilities.length ? (
        stFacilities.map((f) => {
          const slug = ENH_SLUG.get(f.code)
          return (
            <Link
              key={f.code}
              className="ghost"
              to={pathFor(lang, slug ? `facility-${slug}` : `fac-${f.code}`)}
            >
              {f.name} · {f.city} →
            </Link>
          )
        })
      ) : (
        <p className="body-p dim">{ui.dirEmpty}</p>
      )}

      <Link className="ghost" to={pathFor(lang, 'facilities')}>
        {dir.dirIndex.title} →
      </Link>

      <h2 className="page-h2">{d.helpH2}</h2>
      {st.funded_representation && <p className="body-p dim">{d.fundedLine}</p>}
      {st.orgs?.map((o, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <a className="ghost" href={o.href} target="_blank" rel="noopener noreferrer">
            {o.name} ↗
          </a>
          <p className="body-p dim" style={{ marginTop: 4 }}>
            {o.note[lang]}
          </p>
        </div>
      ))}
      {d.helpLinks.map((h, i) => (
        <a key={i} className="ghost" href={h.href} target="_blank" rel="noopener noreferrer">
          {h.label} ↗
        </a>
      ))}

      <p className="body-p dim">{d.verifyNote}</p>
      <Footer ui={ui} />
    </Layout>
  )
}
