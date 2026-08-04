import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { agencies, countries, paths } from '@dir/lib/data'
import { Meta, JsonLd, breadcrumbsLd, SITE_NAME, type Crumb } from '@dir/lib/seo'

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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-200">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight">
            <span aria-hidden="true" className="mr-1.5 text-[color:var(--color-accent)]">
              ⌗
            </span>
            {SITE_NAME}
          </Link>
          <nav aria-label="Main" className="flex gap-4 text-sm font-medium text-slate-600">
            <Link className="hover:text-slate-900" to={paths.countries()}>
              Countries
            </Link>
            <Link className="hover:text-slate-900" to={paths.services()}>
              Services
            </Link>
            <Link className="hover:text-slate-900" to={paths.standards()}>
              Standards
            </Link>
            <Link className="hover:text-slate-900" to={paths.agencies()}>
              All agencies
            </Link>
          </nav>
        </div>
      </header>
      {trail.length > 0 && (
        <nav aria-label="Breadcrumb" className="container-page pt-4 text-sm text-slate-500">
          <JsonLd data={breadcrumbsLd([...trail, { name: title, path }])} />
          <ol className="flex flex-wrap gap-1">
            {trail.map((c) => (
              <li key={c.path} className="after:mx-1 after:content-['/']">
                <Link className="hover:text-slate-900" to={c.path}>
                  {c.name}
                </Link>
              </li>
            ))}
            <li aria-current="page" className="text-slate-700">
              {title}
            </li>
          </ol>
        </nav>
      )}
      <main id="main" className="container-page pb-16 pt-6">
        {children}
      </main>
      <footer className="border-t border-slate-200 py-10 text-sm text-slate-500">
        <div className="container-page space-y-3">
          <p>
            {SITE_NAME} — {agencies.length} verified digital-accessibility agencies across{' '}
            {countries.length} countries. Every listing cites its source; nothing is invented.
          </p>
          <p>
            We list audit and remediation specialists only — no automated «overlay» widgets.
            Listings are free; agencies can claim their profile to keep it current.
          </p>
        </div>
      </footer>
    </>
  )
}
