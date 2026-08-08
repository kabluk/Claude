import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, itemListLd } from '@/lib/seo'
import { paths } from '@/lib/data'
import { reports, stats } from '@/lib/reports'

// CN-RESEARCH (§23, D-071) / CN-RESEARCH-EN301549-AUTOMATION: index of
// AccessAtlas data products. Each report is built from one of AccessAtlas's own
// structured datasets (see each report's own "How this was made" section for
// which one) via a build-time aggregator — not a benchmark of third-party
// websites, which we have no verified corpus for. Numbers on the cards read out
// of each report's own computed stats, never hand-typed. The intro below is
// deliberately source-neutral now that reports draw from two different
// datasets (the agency catalog, and the EN 301 549 coverage map) — see each
// card's own dek for its specific dataset and figures.
export default function ReportsIndexPage() {
  return (
    <Layout
      title="Reports — original data from AccessAtlas's own datasets"
      description="Original, recurring data products built from AccessAtlas's own structured data — not benchmarks of other companies' websites. Every figure is computed from the data, with the method shown in full."
      path={paths.reports()}
      crumbs={[]}
    >
      <JsonLd data={itemListLd(reports.map((r) => paths.reportDoc(r.slug)))} />
      <h1 className="h1">Reports</h1>
      <p className="lede">
        Original analysis built from AccessAtlas&rsquo;s own structured data — the {stats.total}-record
        specialist catalog, the EN 301 549 automation-coverage map that powers our scanner&rsquo;s{' '}
        <Link className="underline underline-offset-2" to={paths.methodology()}>
          methodology
        </Link>
        , and any dataset a future report adds. Every number is computed from the underlying data at
        build time, and each report shows exactly what was counted and what we could not verify.
      </p>
      <p className="mt-3 max-w-prose text-sm text-on-surface-variant">
        These are analyses of our own structured datasets, not benchmarks of other companies&rsquo;
        websites — we do not publish scores we cannot verify.
      </p>

      <ul className="mt-8 space-y-4">
        {reports.map((r) => (
          <li key={r.slug}>
            <Link
              to={paths.reportDoc(r.slug)}
              className="block rounded-xl border border-outline-variant bg-surface-container-low p-5 transition hover:border-outline hover:shadow-sm"
            >
              <h2 className="text-lg font-semibold tracking-tight text-[color:var(--color-on-surface)]">
                {r.title}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">{r.dek}</p>
              <p className="mt-2 text-xs text-on-surface-variant">
                Updated <span className="num">{r.updated}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm">
        <Link className="btn" to={paths.scan()}>
          Scan your website
        </Link>{' '}
        <span className="ml-2 text-on-surface-variant">Free instant check against the automated rules we run.</span>
      </p>
    </Layout>
  )
}
