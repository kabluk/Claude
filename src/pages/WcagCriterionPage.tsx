import { Link, useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'
import { guidesFor } from '@/lib/guides'
import { OURS_DESCRIPTIONS, wcagNeighbours, wcagPageBySlug } from '@/lib/wcag'

// CN-WCAG-PAGES (D-066): страница одного критерия. Вся фактура — из
// data/a11y/en301549-coverage.json (какие axe-правила, какой наш модуль);
// описания наших модулей — src/lib/wcag.ts, выведены из кода воркера.
// Страница существует только для критериев с реальной автоматикой — порог
// осмысленности в src/lib/wcag.ts.
export default function WcagCriterionPage() {
  const { criterion } = useParams()
  const p = wcagPageBySlug(criterion!)
  if (!p) return null
  const { row } = p
  const path = paths.wcagCriterion(p.slug)
  const { prev, next } = wcagNeighbours(p.slug)
  const ours = row.ours ? OURS_DESCRIPTIONS[row.ours] : undefined
  // Реально релевантные гайды: про сам стандарт EN 301 549 и про WCAG-аудит —
  // страница живёт на пересечении этих двух тем. Никаких ручных списков.
  const relatedGuides = [...guidesFor({ standard: 'en-301-549' }), ...guidesFor({ standard: 'wcag-2-2' })]

  const techArticleLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `WCAG ${row.wcag} ${row.title}: automated test coverage`,
    description: `Which automated checks cover WCAG ${row.wcag} (EN 301 549 clause ${row.clause}) and what still needs a human auditor.`,
    mainEntityOfPage: `${ORIGIN}${path}`,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  }

  return (
    <Layout
      title={`WCAG ${row.wcag} ${row.title} — automated checks and their limits`}
      description={`WCAG ${row.wcag} "${row.title}" is EN 301 549 clause ${row.clause}. See exactly which axe-core rules${row.ours ? ' and browser checks' : ''} test it automatically — and what only a human audit can confirm.`}
      path={path}
      crumbs={[{ name: 'WCAG criteria', path: paths.wcag() }]}
    >
      <JsonLd data={techArticleLd} />
      <h1 className="h1">
        <span className="num">WCAG {row.wcag}</span>: {row.title}
      </h1>
      <p className="lede">
        In European law this criterion is <strong>EN 301 549 clause {row.clause}</strong> — chapter
        9, the part of the harmonised standard that applies to websites under the European
        Accessibility Act.
      </p>

      <section className="mt-8 max-w-3xl">
        <h2 className="h2">What automation checks</h2>
        {row.axeRules.length > 0 && (
          <>
            <p className="text-sm text-on-surface-variant">
              {row.axeRules.length === 1 ? 'One axe-core rule tests' : `${row.axeRules.length} axe-core rules test`}{' '}
              failures of this criterion. Our scanner runs {row.axeRules.length === 1 ? 'it' : 'them'} on
              every page it visits:
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {row.axeRules.map((r) => (
                <li key={r}>
                  <code className="chip">{r}</code>
                </li>
              ))}
            </ul>
          </>
        )}
        {row.ours && ours && (
          <p className="mt-4 text-sm text-on-surface-variant">
            {row.axeRules.length > 0 ? 'On top of axe-core, our' : 'axe-core has no rule for this criterion, so our'}{' '}
            own browser check <code className="chip">{row.ours}</code> {ours.does}.
            {ours.caveat && <> Honest limitation: {ours.caveat}.</>}
          </p>
        )}
      </section>

      <section className="mt-8 max-w-3xl">
        <h2 className="h2">What automation cannot prove</h2>
        <p className="text-sm text-on-surface-variant">
          An automated test finds <em>some</em> failures of WCAG {row.wcag}; it cannot confirm the
          criterion is met. Whether the result actually works for people — in context, with real
          content — is a judgement call that needs a human auditor. Nothing on this page is a
          statement of conformance or legal advice. The full map of what our scanner covers and
          where it stops is on{' '}
          <Link className="underline underline-offset-2" to={paths.methodology()}>
            what our scanner checks
          </Link>
          .
        </p>
      </section>

      {relatedGuides.length > 0 && (
        <section className="mt-8 max-w-3xl">
          <h2 className="h2">Related guides</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {relatedGuides.map((g) => (
              <li key={g.slug}>
                <Link
                  className="underline underline-offset-2"
                  to={`/guides/${g.slug}/`}
                  lang={g.locale}
                >
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 max-w-3xl rounded-xl border border-outline-variant bg-secondary-container p-6">
        <p className="font-semibold">Does your site pass {row.axeRules.length + (row.ours ? 1 : 0) === 1 ? 'this check' : 'these checks'}?</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Free instant scan. No signup required. WCAG {row.wcag} is one of the criteria it tests.
        </p>
        <Link className="btn mt-4" to={paths.scan()}>
          Scan website
        </Link>
      </div>

      <nav aria-label="Criteria" className="mt-10 flex flex-wrap justify-between gap-3 text-sm">
        {prev ? (
          <Link className="underline underline-offset-2" to={paths.wcagCriterion(prev.slug)}>
            ← <span className="num">{prev.row.wcag}</span> {prev.row.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link className="underline underline-offset-2" to={paths.wcagCriterion(next.slug)}>
            <span className="num">{next.row.wcag}</span> {next.row.title} →
          </Link>
        )}
      </nav>
    </Layout>
  )
}
