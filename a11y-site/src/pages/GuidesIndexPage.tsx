import { Link } from 'react-router-dom'
import { Layout } from '@dir/components/Layout'
import { guides } from '@dir/lib/guides'
import { countryByCode, standardLabel } from '@dir/lib/data'

const LOCALE_NAME: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  pl: 'Polski',
  es: 'Español',
}

export default function GuidesIndexPage() {
  return (
    <Layout
      title="Accessibility compliance guides: BFSG, EAA, Section 508, VPAT, RGAA"
      description="Practical guides to digital-accessibility law and audits — the European Accessibility Act, BFSG, Section 508, ADA, VPAT/ACR, RGAA and WCAG — with verified sources."
      path="/guides/"
      crumbs={[]}
    >
      <h1 className="h1">Guides</h1>
      <p className="lede">
        Practical, source-linked guides to accessibility law and audits. Each one ends where it
        should: with verified providers who do this work.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {guides.map((g) => {
          const country = g.countryCode ? countryByCode(g.countryCode) : undefined
          return (
            <Link key={g.slug} to={`/guides/${g.slug}/`} className="card">
              <h2 className="font-semibold" lang={g.locale}>
                {g.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600" lang={g.locale}>
                {g.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="chip">{LOCALE_NAME[g.locale] ?? g.locale}</span>
                {g.standard && <span className="chip">{standardLabel(g.standard)}</span>}
                {country && <span className="chip">{country.name}</span>}
              </div>
            </Link>
          )
        })}
      </div>
      {guides.length === 0 && <p className="mt-6 text-slate-500">Guides are being written.</p>}
    </Layout>
  )
}
