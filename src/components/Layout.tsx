import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { LANGS, type Lang, type UIStrings } from '@/lib/types'
import { pathFor } from '@/lib/slugs'
import { TabBar } from './TabBar'

const ORIGIN = 'https://detnav.com'

// Запасное описание для соцпревью, если страница своего не задала.
const DEFAULT_DESC: Record<Lang, string> = {
  en: 'A map for families of people detained by U.S. immigration. Information and official links — not legal advice. Nothing about you is stored.',
  es: 'Un mapa para las familias de personas detenidas por inmigración en EE. UU. Información y enlaces oficiales — no consejo legal. No se guarda nada sobre usted.',
  ru: 'Карта для семей задержанных иммиграционной службой США. Информация и официальные ссылки — не юридический совет. Мы ничего о вас не храним.',
}
const OG_LOCALE: Record<Lang, string> = { en: 'en_US', es: 'es_ES', ru: 'ru_RU' }

// Structured data для поисковиков. Не исполняется браузером (type=ld+json),
// CSP script-src на такие блоки не распространяется.
const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      // min-ok: имя организации в structured data, не поле пользователя
      name: 'DETNAV',
      url: ORIGIN,
      logo: `${ORIGIN}/og.png`,
    },
    {
      '@type': 'WebSite',
      // min-ok: название сайта в structured data, не поле пользователя
      name: 'DETNAV',
      url: ORIGIN,
      inLanguage: ['en', 'es', 'ru'],
    },
  ],
})

export function Layout({
  lang,
  pageKey,
  ui,
  title,
  description,
  children,
}: {
  lang: Lang
  pageKey: string
  ui: UIStrings
  title: string
  description?: string
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
        <meta name="description" content={description ?? DEFAULT_DESC[lang]} />
        {LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`${ORIGIN}${pathFor(l, pageKey)}`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${ORIGIN}${pathFor('en', pageKey)}`} />
        <link rel="canonical" href={`${ORIGIN}${pathFor(lang, pageKey)}`} />
        {/* Соцпревью (WhatsApp/SMS/соцсети) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="DETNAV" />
        <meta property="og:locale" content={OG_LOCALE[lang]} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description ?? DEFAULT_DESC[lang]} />
        <meta property="og:url" content={`${ORIGIN}${pathFor(lang, pageKey)}`} />
        <meta property="og:image" content={`${ORIGIN}/og.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description ?? DEFAULT_DESC[lang]} />
        <meta name="twitter:image" content={`${ORIGIN}/og.png`} />
        {/* react-helmet рендерит содержимое script как есть, без экранирования */}
        <script type="application/ld+json">{JSON_LD}</script>
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
