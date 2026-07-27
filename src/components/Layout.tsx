import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { LANGS, type Lang, type UIStrings } from '@/lib/types'
import { pathFor } from '@/lib/slugs'
import { Listen } from './Listen'

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
  return (
    <nav className="idx">
      <h2 className="page-h2" style={{ marginTop: 0 }}>
        {ui.allPages}
      </h2>
      {Object.entries(ui.nav).map(([key, label]) => (
        <Link key={key} to={pathFor(lang, key)}>
          {label} →
        </Link>
      ))}
    </nav>
  )
}
