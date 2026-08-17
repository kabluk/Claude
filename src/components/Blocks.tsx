import { Link } from 'react-router-dom'
import type { Block, Lang, UIStrings } from '@/lib/types'
import { pathFor } from '@/lib/slugs'
import { Inline } from '@/lib/inline'
import { IceGate } from './IceGate'
import { NameVariants } from './NameVariants'
import { ANumberField } from './ANumberField'
import { DocPack } from './DocPack'
import { VisitFinder } from './VisitFinder'
import { OfficeFinder } from './OfficeFinder'
import { DocMap } from './DocMap'

const TONE: Record<string, string> = { r: 'r', y: 'y', g: 'g', n: '' }

// Иконки callout'ов (как в макетах Stitch): красный — стоп/необратимо,
// жёлтый — осторожно, зелёный — безопасно, нейтральный — справка.
const CALLOUT_ICON: Record<string, JSX.Element> = {
  r: (
    <>
      <path d="M7.9 3h8.2L21 7.9v8.2L16.1 21H7.9L3 16.1V7.9z" />
      <line x1="12" y1="8" x2="12" y2="12.5" />
      <line x1="12" y1="16" x2="12" y2="16" />
    </>
  ),
  y: (
    <>
      <path d="M12 3 22 20H2z" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <line x1="12" y1="17" x2="12" y2="17" />
    </>
  ),
  g: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  n: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <line x1="12" y1="8" x2="12" y2="8" />
    </>
  ),
}

function CalloutIcon({ tone }: { tone: string }) {
  return (
    <svg
      className="box-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CALLOUT_ICON[tone] ?? CALLOUT_ICON.n}
    </svg>
  )
}

export function Blocks({ blocks, lang, ui }: { blocks: Block[]; lang: Lang; ui: UIStrings }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h2':
            return (
              <h2 key={i} className="page-h2">
                {b.text}
              </h2>
            )
          case 'p':
            return (
              <p key={i} className={`body-p ${b.dim ? 'dim' : ''}`}>
                <Inline text={b.text} />
              </p>
            )
          case 'list':
            return (
              <ul key={i} className="blist">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            )
          case 'steps':
            return (
              <div key={i} className="steps-block">
                {b.title && <div className="steps-title">{b.title}</div>}
                <ol className="steps">
                  {b.items.map((it, j) => (
                    <li key={j}>
                      <Inline text={it} />
                    </li>
                  ))}
                </ol>
              </div>
            )
          case 'fields':
            return (
              <div key={i} className="fields-block">
                {b.title && <div className="fields-title">{b.title}</div>}
                {b.items.map((label, j) => (
                  <div key={j} className="field">
                    <span className="field-label">
                      <Inline text={label} />
                    </span>
                  </div>
                ))}
              </div>
            )
          case 'terms':
            return (
              <dl key={i} className="terms">
                {b.items.map((it, j) => (
                  <div key={j} className="term-item">
                    <dt>
                      <Inline text={it.term} />
                    </dt>
                    <dd>
                      <Inline text={it.def} />
                    </dd>
                  </div>
                ))}
              </dl>
            )
          case 'callout':
            return (
              <div key={i} className={`box ${TONE[b.tone]}`}>
                <CalloutIcon tone={b.tone} />
                <div className="box-main">
                  <h3>{b.title}</h3>
                  {b.body.map((p, j) => (
                    <p key={j}>
                      <Inline text={p} />
                    </p>
                  ))}
                </div>
              </div>
            )
          case 'ext':
            return b.gate ? (
              <IceGate key={i} href={b.href} label={b.label} ui={ui} />
            ) : (
              <a key={i} className="ghost" href={b.href} target="_blank" rel="noopener noreferrer">
                {b.label} ↗
              </a>
            )
          case 'ilink':
            return (
              <Link key={i} className="ghost" to={pathFor(lang, b.page)}>
                {b.label} →
              </Link>
            )
          case 'onward':
            return (
              <div key={i} className="onward">
                {b.next && (
                  <Link className="next-step" to={pathFor(lang, b.next.page)}>
                    <span className="ns-eyebrow">{ui.onward.next}</span>
                    <span className="ns-title">{b.next.label} →</span>
                    {b.next.desc && <span className="ns-desc">{b.next.desc}</span>}
                  </Link>
                )}
                {b.related && b.related.length > 0 && (
                  <details className="rel-acc">
                    <summary>
                      <span className="rel-label">{ui.onward.related}</span>
                      <span className="rel-count">{b.related.length}</span>
                      <span className="rel-chev" aria-hidden="true">
                        ›
                      </span>
                    </summary>
                    <div className="rel-links">
                      {b.related.map((r, j) => (
                        <Link key={j} to={pathFor(lang, r.page)}>
                          {r.label} →
                        </Link>
                      ))}
                    </div>
                  </details>
                )}
                {b.sources && b.sources.length > 0 && (
                  <div className="onward-sources">
                    <div className="src-label">{ui.onward.sources}</div>
                    {b.sources.map((s, j) =>
                      s.gate ? (
                        <IceGate key={j} href={s.href} label={s.label} ui={ui} />
                      ) : (
                        <a
                          key={j}
                          className="src-ext"
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {s.label} ↗
                        </a>
                      ),
                    )}
                  </div>
                )}
              </div>
            )
          case 'memcard':
            return (
              <div key={i} className="memcard">
                <div className="t">{b.title}</div>
                {b.lines.map((l, j) => (
                  <div key={j} className="q">
                    {l}
                  </div>
                ))}
                {b.alts?.map((l, j) => (
                  <p key={j} className="alt">
                    {l}
                  </p>
                ))}
              </div>
            )
          case 'phones':
            return (
              <div key={i}>
                {b.entries.map((e, j) => (
                  <div key={j} className="phoneline">
                    <div className="num">
                      <a href={`tel:${e.num.replace(/[^\d+]/g, '')}`}>{e.num}</a>
                    </div>
                    <div className="who">{e.who}</div>
                    <div className="note">{e.note}</div>
                  </div>
                ))}
                {b.footer && <p className="body-p dim">{b.footer}</p>}
              </div>
            )
          case 'kv':
            return (
              <div key={i}>
                {b.rows.map(([k, v], j) => (
                  <div key={j} className="kv">
                    <span>{k}</span>
                    <span>
                      <Inline text={v} />
                    </span>
                  </div>
                ))}
              </div>
            )
          case 'tool':
            if (b.tool === 'namevariants') return <NameVariants key={i} ui={ui} />
            if (b.tool === 'anumber') return <ANumberField key={i} ui={ui} />
            if (b.tool === 'docpack') return <DocPack key={i} ui={ui} />
            if (b.tool === 'visitfinder') return <VisitFinder key={i} lang={lang} ui={ui} />
            if (b.tool === 'officefinder') return <OfficeFinder key={i} ui={ui} />
            if (b.tool === 'docmap') return <DocMap key={i} ui={ui} />
            if (b.tool === 'print')
              return (
                <button key={i} className="cta" type="button" onClick={() => window.print()}>
                  {ui.printPage}
                </button>
              )
            return null
          default:
            return null
        }
      })}
    </>
  )
}
