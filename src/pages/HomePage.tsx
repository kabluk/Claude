import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { HomeContent, Lang, UIStrings } from '@/lib/types'
import { Layout, Footer, PageIndex } from '@/components/Layout'
import { Demo } from '@/components/Demo'
import { pathFor } from '@/lib/slugs'

// Плюсы появляются строчка за строчкой; при prefers-reduced-motion
// CSS показывает все сразу без анимации.
function HeroPoints({ lead, points }: { lead: string; points: string[] }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= points.length) return
    const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 350 : 750)
    return () => clearTimeout(t)
  }, [shown, points.length])
  return (
    <div className="hero-points">
      <p className="hero-lead">{lead}</p>
      {points.map((p, i) => (
        <div key={i} className={`hp ${i < shown ? 'in' : ''}`}>
          {p}
        </div>
      ))}
    </div>
  )
}

export function HomePage({ lang, c, ui }: { lang: Lang; c: HomeContent; ui: UIStrings }) {
  return (
    <Layout lang={lang} pageKey="home" ui={ui} title="DETNAV" description={c.sub}>
      <div className="hero">
        <h1>
          {c.title.split('\n').map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>
        <HeroPoints lead={c.heroLead} points={c.heroPoints} />
        <Demo c={c} />
        <h2 className="landing-h2" style={{ marginTop: 4 }}>
          {c.benefitsTitle}
        </h2>
        {c.benefits.map((x, i) => (
          <div key={i} className="limit">
            <b>{x.b}</b>
            <p>{x.p}</p>
          </div>
        ))}
        <div style={{ height: 10 }} />
        <Link className="cta-block" to={pathFor(lang, 'intake')}>
          {c.cta}
        </Link>
        <Link className="cta2" to={pathFor(lang, 'journey')}>
          {c.cta2}
        </Link>
        <div className="trust">
          {c.trust.map((t) => (
            <span key={t} className="tg">
              {t}
            </span>
          ))}
        </div>
      </div>

      <section className="landing-section">
        <h2 className="landing-h2">{c.stepsTitle}</h2>
        {c.steps.map((s, i) => (
          <div key={i} className="step" style={i === c.steps.length - 1 ? { marginBottom: 0 } : undefined}>
            <div className="n">{i + 1}</div>
            <div>
              <b>{s.b}</b>
              <p>{s.p}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="landing-section">
        <h2 className="landing-h2">{c.dataTitle}</h2>
        <div className="big">
          <b>{c.dataBig.b}</b>
          <p>{c.dataBig.p1}</p>
          <p>{c.dataBig.p2}</p>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-h2">{c.priceTitle}</h2>
        <div className="price">
          <div className="ph">
            <b>{c.freeTitle}</b>
            <span className="amt">{c.freeAmt}</span>
          </div>
          <ul className="pl">
            {c.freeItems.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </div>
        <div className="price">
          <div className="ph">
            <b>{c.paidTitle}</b>
            <span className="amt pend">{c.paidAmt}</span>
          </div>
          <ul className="pl">
            {c.paidItems.map((it, i) => (
              <li key={i} className="no">
                {it}
              </li>
            ))}
          </ul>
        </div>
        <p className="pnote">{c.priceNote}</p>
      </section>

      <section className="landing-section">
        <h2 className="landing-h2">{c.limitsTitle}</h2>
        {c.limits.map((l, i) => (
          <div key={i} className="limit">
            <b>{l.b}</b>
            <p>{l.p}</p>
          </div>
        ))}
      </section>

      <PageIndex lang={lang} ui={ui} />
      <Footer ui={ui} />
    </Layout>
  )
}
