import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { agencies, countries, paths } from '@/lib/data'
import { Meta, JsonLd, breadcrumbsLd, SITE_NAME, type Crumb } from '@/lib/seo'

export function Layout({
  title,
  description,
  path,
  index = true,
  crumbs,
  children,
}: {
  title: string
  description: string
  path: string
  index?: boolean
  crumbs?: Crumb[] // без последнего звена-самой-страницы — оно добавится
  children: ReactNode
}) {
  const trail: Crumb[] = crumbs ? [{ name: 'Home', path: '/' }, ...crumbs] : []
  return (
    <>
      <Meta title={title} description={description} path={path} index={index} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface-container focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      {/* CN-NAV (шапка, D-063) + CN-BRANDBOOK (D-072): sticky-шапка с лёгким
          backdrop-blur, как в макетах; Scan — первый и единственный акцентный
          элемент навигации, остальные пункты нейтральные. CTA справа — pill
          secondary-container (макет), не второй primary: один акцент на
          поверхность. */}
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-background/80 backdrop-blur-xl">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            {/* Логотип D-072: скруглённая плашка primary с белым stroke-глифом
                карты. СВОЙ inline-SVG в стиле иконочной системы проекта
                (stroke, currentColor, ~1.75) — Material Symbols/иконочные
                шрифты с CDN сознательно НЕ подключаются (§29: один икон-стиль;
                CSP/self-host, D-063). В dark плашка — primary-container, глиф
                остаётся светлым (токены brand-plate/brand-glyph). */}
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-plate text-brand-glyph"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" />
                <path d="M9 4v14" />
                <path d="M15 6v14" />
              </svg>
            </span>
            {SITE_NAME}
          </Link>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-4 text-sm font-medium text-on-surface-variant">
            <Link
              className="font-semibold text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-hover)]"
              to={paths.scan()}
            >
              Scan
            </Link>
            <Link className="hover:text-on-surface" to={paths.countries()}>
              Countries
            </Link>
            <Link className="hover:text-on-surface" to={paths.services()}>
              Services
            </Link>
            <Link className="hover:text-on-surface" to={paths.standards()}>
              Standards
            </Link>
            {/* CN-NAV (D-062 §6): подписи IA — «Knowledge»/«Experts». URL /guides/ и
                /agencies/ сознательно НЕ переименованы (SEO/внешние ссылки живут);
                модель данных agencies тоже не трогается — только UI-ярлыки. */}
            <Link className="hover:text-on-surface" to="/guides/">
              Knowledge
            </Link>
            {/* CN-COMPONENTS (D-068): публичная библиотека доступных компонентов
                (§22) — часть Knowledge-поверхности, отдельный пункт для веса. */}
            <Link className="hover:text-on-surface" to={paths.components()}>
              Components
            </Link>
            {/* CN-RESEARCH (D-071): data products из каталога — флагманская
                SEO-поверхность (§23), в навигации для веса и анти-orphan. */}
            <Link className="hover:text-on-surface" to={paths.reports()}>
              Reports
            </Link>
            <Link className="hover:text-on-surface" to={paths.agencies()}>
              Experts
            </Link>
          </nav>
          <Link
            className="ml-auto inline-flex items-center rounded-full bg-secondary-container px-4 py-1.5 font-mono text-xs font-medium tracking-[0.05em] uppercase text-on-secondary-container transition hover:bg-primary-container hover:text-on-primary-container"
            to={paths.scan()}
          >
            Scan website
          </Link>
        </div>
      </header>
      {trail.length > 0 && (
        <nav aria-label="Breadcrumb" className="container-page pt-4 text-sm text-on-surface-variant">
          <JsonLd data={breadcrumbsLd([...trail, { name: title, path }])} />
          <ol className="flex flex-wrap gap-1">
            {trail.map((c) => (
              <li key={c.path} className="after:mx-1 after:content-['/']">
                <Link className="hover:text-on-surface" to={c.path}>
                  {c.name}
                </Link>
              </li>
            ))}
            <li aria-current="page" className="text-on-surface-variant">
              {title}
            </li>
          </ol>
        </nav>
      )}
      <main id="main" className="container-page pb-16 pt-6">
        {children}
      </main>
      <footer className="border-t border-outline-variant bg-surface-container-low py-10 text-sm text-on-surface-variant">
        <div className="container-page space-y-3">
          <p>
            {SITE_NAME} — <span className="num">{agencies.length}</span> verified
            digital-accessibility agencies across <span className="num">{countries.length}</span>{' '}
            countries. Every listing cites its source; nothing is invented.
          </p>
          <p>
            We list audit and remediation specialists only — no automated «overlay» widgets.
            Listings are free; agencies can claim their profile to keep it current.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
            <Link className="hover:text-on-surface" to={paths.about()}>
              About
            </Link>
            <Link className="hover:text-on-surface" to={paths.methodology()}>
              What we check
            </Link>
            <Link className="hover:text-on-surface" to={paths.contact()}>
              Contact
            </Link>
            <Link className="hover:text-on-surface" to={paths.privacy()}>
              Privacy
            </Link>
            <Link className="hover:text-on-surface" to={paths.imprint()}>
              Imprint
            </Link>
            <Link className="hover:text-on-surface" to={paths.accessibilityStatement()}>
              Accessibility Statement
            </Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
