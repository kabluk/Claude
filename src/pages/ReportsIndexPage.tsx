import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, itemListLd } from '@/lib/seo'
import { paths } from '@/lib/data'
import { reports, stats } from '@/lib/reports'

// CN-RESEARCH (§23, D-071): index of AccessAtlas data products. Every report
// here is built from the catalog's own structured data (data/a11y/agencies.json)
// via a build-time aggregator — not a benchmark of third-party websites, which we
// have no verified corpus for. Numbers on the cards read out of the computed
// stats, never hand-typed.
export default function ReportsIndexPage() {
  return (
    <Layout
      title="Reports — original data from the AccessAtlas catalog"
      description={`Original, recurring data products built from the ${stats.total}-record AccessAtlas catalog of verified digital-accessibility specialists. Every figure is computed from the data, with the method shown in full.`}
      path={paths.reports()}
      crumbs={[]}
    >
      <JsonLd data={itemListLd(reports.map((r) => paths.reportDoc(r.slug)))} />
      <h1 className="h1">Reports</h1>
      <p className="lede">
        Original analysis built from the AccessAtlas catalog itself — {stats.total} verified
        digital-accessibility specialists across {stats.hqCountries.count} countries. Every number is
        computed from the underlying data at build time, and each report shows exactly what was counted
        and what we could not verify.
      </p>
      <p className="mt-3 max-w-prose text-sm text-slate-600">
        These are analyses of our own structured dataset, not benchmarks of other companies&rsquo;
        websites — we do not publish scores we cannot verify.
      </p>

      <ul className="mt-8 space-y-4">
        {reports.map((r) => (
          <li key={r.slug}>
            <Link
              to={paths.reportDoc(r.slug)}
              className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:shadow-sm"
            >
              <h2 className="text-lg font-semibold tracking-tight text-[color:var(--color-ink)]">
                {r.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{r.dek}</p>
              <p className="mt-2 text-xs text-slate-500">
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
        <span className="ml-2 text-slate-600">Free instant check against the automated rules we run.</span>
      </p>
    </Layout>
  )
}
