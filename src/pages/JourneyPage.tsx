import { Link } from 'react-router-dom'
import type { JourneyContent, Lang, UIStrings } from '@/lib/types'
import { Layout, Footer } from '@/components/Layout'
import { pathFor } from '@/lib/slugs'

// Маршрут из 15 шагов. Открыты шесть, остальные честно помечены «готовим».
// Человек видит масштаб пути целиком — это снимает ощущение, что после
// освобождения всё закончится.
export function JourneyPage({ lang, c, ui }: { lang: Lang; c: JourneyContent; ui: UIStrings }) {
  return (
    <Layout lang={lang} pageKey="journey" ui={ui} title={`${c.title} · DETNAV`} description={c.lede}>
      <h1 className="page-h1">{c.title}</h1>
      <p className="lede">{c.lede}</p>
      {c.steps.map((s, i) => {
        const n = String(i + 1).padStart(2, '0')
        return s.page ? (
          <Link key={i} className="jstep rdy" to={pathFor(lang, s.page)}>
            <span className="n">{n}</span>
            <span style={{ flex: 1 }}>
              <b>{s.t}</b>
              <p>{s.p}</p>
            </span>
          </Link>
        ) : (
          <div key={i} className="jstep">
            <span className="n">{n}</span>
            <span style={{ flex: 1 }}>
              <b>{s.t}</b>
              <p>{s.p}</p>
            </span>
            <span className="soonlbl">{c.soonLabel}</span>
          </div>
        )
      })}
      <h2 className="page-h2">{c.tracksTitle}</h2>
      {c.tracks.map((t, i) => (
        <div key={i} className="box">
          <h3>{t.t}</h3>
          <p>{t.p}</p>
        </div>
      ))}
      <p className="body-p dim">{c.note}</p>
      <Footer ui={ui} />
    </Layout>
  )
}
