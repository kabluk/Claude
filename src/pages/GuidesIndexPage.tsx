import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { guides } from '@/lib/guides'
import { countryByCode, standardLabel } from '@/lib/data'

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
      {/* CN-NAV (D-062 §6): IA-ярлык раздела — «Knowledge»; сами материалы
          по-прежнему называются guides (тип контента, не пункт навигации). */}
      <h1 className="h1">Knowledge</h1>
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
      {/* CN-WCAG-PAGES (D-066) / CN-COMPONENTS (D-068): справочники — часть
          Knowledge-раздела. */}
      <section className="mt-10">
        <h2 className="h2">Reference</h2>
        <p className="max-w-prose text-sm text-slate-600">
          <Link className="underline underline-offset-2" to="/wcag/">
            WCAG success criteria: what automation can check
          </Link>{' '}
          — per-criterion pages naming the exact axe-core rules and browser checks our scanner runs,
          and what still needs a human auditor.
        </p>
        <p className="mt-2 max-w-prose text-sm text-slate-600">
          <Link className="underline underline-offset-2" to="/components/">
            Accessible component library
          </Link>{' '}
          — real, keyboard-accessible UI patterns with their keyboard map, screen-reader behaviour,
          ARIA notes, copyable source, and the pitfalls that most often break them.
        </p>
      </section>
    </Layout>
  )
}
