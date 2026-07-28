import { Link } from 'react-router-dom'
import type { DirectoryContent, Lang, UIStrings } from '@/lib/types'
import { Layout, Footer } from '@/components/Layout'
import { pathFor } from '@/lib/slugs'
import states from '@data/states.json'
import courts from '@data/courts.json'
import facilities from '@data/facilities.json'
import type { CourtRec, FacilityRec, StateRec } from '@data/types'

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
  const stFacilities = (facilities as FacilityRec[]).filter((f) => f.state_code === code)
  const d = dir.statePage

  return (
    <Layout lang={lang} pageKey={pageKey} ui={ui} title={`${st.name[lang]} · DETNAV`} description={d.lede}>
      <h1 className="page-h1">{st.name[lang]}</h1>
      <p className="lede">{d.lede}</p>
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
        stFacilities.map((f) => (
          <Link key={f.slug} className="ghost" to={pathFor(lang, `facility-${f.slug}`)}>
            {f.name} →
          </Link>
        ))
      ) : (
        <p className="body-p dim">{ui.dirEmpty}</p>
      )}

      <h2 className="page-h2">{d.helpH2}</h2>
      {st.funded_representation && <p className="body-p dim">{d.fundedLine}</p>}
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
