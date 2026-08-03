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

        <div className="hub">
          <div className="hub-eyebrow">{c.hub.eyebrow}</div>
          {c.hub.cards.map((card, i) => (
            <div key={i} className={`hubcard ${card.tone}`}>
              {(card.tone === 'r' || card.label) && (
                <div className="hub-top">
                  {card.tone === 'r' ? (
                    <svg
                      className="hub-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 2 22 12 12 22 2 12Z" />
                      <line x1="12" y1="8" x2="12" y2="13" />
                      <line x1="12" y1="16.5" x2="12" y2="16.5" />
                    </svg>
                  ) : (
                    <span />
                  )}
                  {card.label && <span className="hub-chip">{card.label}</span>}
                </div>
              )}
              <h2 className="hub-title">{card.title}</h2>
              <p className="hub-desc">{card.desc}</p>
              <div className="hub-actions">
                {card.actions.map((a, j) => (
                  <Link
                    key={j}
                    className={a.primary ? 'hub-btn primary' : 'hub-btn'}
                    to={pathFor(lang, a.page)}
                  >
                    {a.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Demo c={c} />
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
