import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { HomeContent, Lang, UIStrings } from '@/lib/types'
import { Layout, Footer, PageIndex } from '@/components/Layout'
import { Demo } from '@/components/Demo'
import { pathFor } from '@/lib/slugs'

// Плюсы сменяют друг друга, как сценарии в демонстрации: мягкий выезд
// снизу с расфокусом, градиентный текст. При prefers-reduced-motion —
// статичный список целиком, без смены кадров.
function HeroPoints({ lead, points }: { lead: string; points: string[] }) {
  const [idx, setIdx] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reduced) return
    const t = setTimeout(() => setIdx((i) => (i + 1) % points.length), 2400)
    return () => clearTimeout(t)
  }, [idx, reduced, points.length])

  if (reduced) {
    return (
      <div className="hero-points">
        <p className="hero-lead">{lead}</p>
        {points.map((p, i) => (
          <div key={i} className="hp in">
            {p}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="hero-lead">{lead}</p>
      {/* скринридеру — весь список сразу, без «болтовни» о смене кадров */}
      <ul className="sr-only">
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
      <div className="rotator" aria-hidden="true">
        <span className="pt" key={idx}>
          {points[idx]}
        </span>
      </div>
      <div className="rot-dots" aria-hidden="true">
        {points.map((_, i) => (
          <i key={i} className={i === idx ? 'on' : ''} />
        ))}
      </div>
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
        <h2 className="landing-h2">{c.benefitsTitle}</h2>
        {c.benefits.map((x, i) => (
          <div key={i} className="limit">
            <b>{x.b}</b>
            <p>{x.p}</p>
          </div>
        ))}
      </section>

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
