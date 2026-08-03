import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { LANGS, type Lang, type UIStrings } from '@/lib/types'
import { pathFor } from '@/lib/slugs'
import { Listen } from './Listen'
import { TabBar } from './TabBar'

const ORIGIN = 'https://detnav.com'

export function Layout({
  lang,
  pageKey,
  ui,
  title,
  description,
  listen = true,
  children,
}: {
  lang: Lang
  pageKey: string
  ui: UIStrings
  title: string
  description?: string
  listen?: boolean
  children: ReactNode
}) {
  const isHome = pageKey === 'home'

  // Плавное появление блоков при скролле. Включается только когда есть
  // JavaScript (класс на <html>): без него страница полностью видима.
  useEffect(() => {
    document.documentElement.classList.add('reveal-ready')
    const main = document.querySelector('main')
    if (!main || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('rev-in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    for (const el of main.children) io.observe(el)
    return () => io.disconnect()
  }, [pageKey, lang])

  return (
    <div className="phone">
      <Head>
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        {LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`${ORIGIN}${pathFor(l, pageKey)}`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${ORIGIN}${pathFor('en', pageKey)}`} />
        <link rel="canonical" href={`${ORIGIN}${pathFor(lang, pageKey)}`} />
      </Head>
      <header className="site-header">
        <div className="hrow">
          <Link to={pathFor(lang, 'home')} className="brand">
            <i />
            DETNAV
          </Link>
          <nav className="langs">
            {LANGS.map((l) => (
              <Link key={l} to={pathFor(l, pageKey)} className={l === lang ? 'on' : ''} hrefLang={l}>
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
        {!isHome && (
          <Link to={pathFor(lang, 'home')} className="back">
            {ui.back}
          </Link>
        )}
      </header>
      {listen && <Listen lang={lang} ui={ui} />}
      <main>{children}</main>
      <TabBar lang={lang} pageKey={pageKey} ui={ui} />
    </div>
  )
}

export function Footer({ ui }: { ui: UIStrings }) {
  return (
    <p className="foot">
      {ui.updated}
      <br />
      <br />
      {ui.disclaimer}
    </p>
  )
}

export function PageIndex({ lang, ui }: { lang: Lang; ui: UIStrings }) {
  // Свёрнутый индекс на нативном <details>: без JavaScript список просто
  // открыт, так что навигация доступна всегда. Первая группа открыта.
  return (
    <nav className="idx">
      <h2 className="page-h2" style={{ marginTop: 0 }}>
        {ui.allPages}
      </h2>
      {ui.navGroups.map((g, gi) => (
        <details key={g.label} className="idx-acc" open={gi === 0}>
          <summary>
            <span className="idx-label">{g.label}</span>
            <span className="idx-count">{g.keys.length}</span>
            <span className="idx-chev" aria-hidden="true">
              ›
            </span>
          </summary>
          <div className="idx-links">
            {g.keys.map((key) => (
              <Link key={key} to={pathFor(lang, key)}>
                {ui.nav[key]} →
              </Link>
            ))}
          </div>
        </details>
      ))}
    </nav>
  )
}
