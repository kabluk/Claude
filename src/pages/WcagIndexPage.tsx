import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, itemListLd } from '@/lib/seo'
import { paths } from '@/lib/data'
import { coverageByPrinciple, coverageSummary, isCovered } from '@/lib/coverage'
import { wcagSlug, wcagPages } from '@/lib/wcag'

// CN-WCAG-PAGES (D-066): индекс справочника критериев. Все 50 требований главы 9
// EN 301 549 честно перечислены; собственную страницу имеют только критерии с
// реальной автоматической проверкой (порог — src/lib/wcag.ts). Непокрытые
// критерии показаны без ссылки — про них сверх названия сказать нечего, и
// делать под это отдельную страницу запрещает R1 (thin content).
export default function WcagIndexPage() {
  const groups = coverageByPrinciple()
  return (
    <Layout
      title={`WCAG success criteria: what automation can check — ${coverageSummary.covered} of ${coverageSummary.total} explained`}
      description="Per-criterion reference of WCAG success criteria in EN 301 549 chapter 9: which axe-core rules and which of our own browser checks cover each one, and where only a human auditor helps."
      path={paths.wcag()}
      crumbs={[]}
    >
      <JsonLd data={itemListLd(wcagPages.map((p) => paths.wcagCriterion(p.slug)))} />
      <h1 className="h1">WCAG success criteria: what automation can check</h1>
      <p className="lede">
        EN 301 549 chapter 9 maps {coverageSummary.total} WCAG success criteria to European law. For
        the {coverageSummary.covered} criteria our scanner covers, each page below names the exact
        automated checks — axe-core rules and our own browser checks — and what they still cannot
        prove. The remaining {coverageSummary.total - coverageSummary.covered} depend on meaning and
        judgement; no automated page would add anything beyond their name, so they link nowhere.
      </p>
      <p className="mt-3 text-sm text-on-surface-variant">
        How the numbers are derived — and their limits — is documented in{' '}
        <Link className="underline underline-offset-2" to={paths.methodology()}>
          what our scanner checks
        </Link>
        .
      </p>

      {groups.map((g) => (
        <section key={g.key} className="mt-10">
          <h2 className="h2">
            {g.key}. {g.title}
          </h2>
          <p className="max-w-prose text-sm text-on-surface-variant">{g.blurb}</p>
          <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
            {g.rows.map((r) =>
              isCovered(r) ? (
                <li key={r.clause}>
                  <Link
                    className="underline underline-offset-2"
                    to={paths.wcagCriterion(wcagSlug(r.wcag))}
                  >
                    <span className="num">{r.wcag}</span> {r.title}
                  </Link>
                </li>
              ) : (
                <li key={r.clause} className="text-on-surface-variant">
                  <span className="num">{r.wcag}</span> {r.title}{' '}
                  <span className="text-xs">— manual review only</span>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}

      <p className="mt-10 text-sm">
        <Link className="btn" to={paths.scan()}>
          Scan your website
        </Link>{' '}
        <span className="ml-2 text-on-surface-variant">
          Free instant scan against every automated check listed here.
        </span>
      </p>
    </Layout>
  )
}
