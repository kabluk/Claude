import { Link } from 'react-router-dom'
import type { DirectoryContent, Lang, UIStrings } from '@/lib/types'
import { Layout, Footer } from '@/components/Layout'
import { FacilityStay } from '@/components/FacilityStay'
import { pathFor } from '@/lib/slugs'
import facilities from '@data/facilities.json'
import states from '@data/states.json'
import type { FacilityRec, StateRec } from '@data/types'

export function FacilityPage({
  lang,
  slug,
  pageKey,
  dir,
  ui,
}: {
  lang: Lang
  slug: string
  pageKey: string
  dir: DirectoryContent
  ui: UIStrings
}) {
  const f = (facilities as FacilityRec[]).find((x) => x.slug === slug)!
  const st = (states as StateRec[]).find((x) => x.code === f.state_code)
  const warn = dir.facility.warnByFacility[slug]
  const L = dir.facility.labels

  const rows: [string, string][] = [
    [L.addr, f.address],
    [L.phone, f.phone],
    [L.tablets, f.phone_provider],
    [L.st, st ? st.name[lang] : f.state_code],
    [L.circuit, st ? dir.circuitNames[String(st.circuit)] : ''],
  ]
  if (f.hours) rows.splice(2, 0, [L.hours, f.hours])

  return (
    <Layout lang={lang} pageKey={pageKey} ui={ui} title={`${f.name} · DETNAV`}>
      <h1 className="page-h1">{f.name.split(' ')[0]}</h1>
      <p className="lede">
        {f.name} · {st ? st.name[lang] : f.state_code}
      </p>
      {rows
        .filter(([, v]) => v !== '')
        .map(([k, v], i) => (
          <div key={i} className="kv">
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      {(warn || f.notes[lang]) && (
        <div className="box y">
          {warn && <h3>{warn.title}</h3>}
          {(warn?.body ?? [f.notes[lang]]).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {f.code && <FacilityStay code={f.code} ui={ui} />}
      <h2 className="page-h2">{dir.facility.lettersH2}</h2>
      <ul className="blist">
        {dir.facility.letters.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <h2 className="page-h2">{st ? st.name[lang] : dir.facility.stateH2}</h2>
      <Link className="ghost" to={pathFor(lang, `state-${f.state_code.toLowerCase()}`)}>
        {dir.facility.stateH2} →
      </Link>
      <Footer ui={ui} />
    </Layout>
  )
}
