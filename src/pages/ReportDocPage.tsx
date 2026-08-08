import { Link, useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'
import { reportBySlug, stats } from '@/lib/reports'

// CN-RESEARCH (§23, D-071): a single data-product page. The prose is authored;
// every number is read from `stats` (computed by scripts/reports-data.mjs from
// data/a11y/agencies.json, gated by scripts/reports-data.test.mjs). The framing
// is deliberately exact — this analyses OUR catalog's records, it is not a
// benchmark of third-party websites, for which we have no verified scan corpus
// (D-010); claiming otherwise would need invented figures (D-045/D-047).

function StatTile({ value, label, note }: { value: string | number; label: string; note?: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <div className="num text-2xl font-bold text-[color:var(--color-on-surface)]">{value}</div>
      <div className="mt-1 text-sm font-medium text-on-surface-variant">{label}</div>
      {note && <div className="mt-1 text-xs text-on-surface-variant">{note}</div>}
    </div>
  )
}

// A labelled bar per row. The bar is decorative (aria-hidden); the count next to
// it is real text, so length is never the only carrier of the value. Rendered as
// a table with row headers so a screen reader reads "France, 28".
function BarList({ caption, rows }: { caption: string; rows: { key: string; label: string; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <table className="mt-4 w-full border-collapse text-sm">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <th scope="row" className="w-44 py-1.5 pr-3 text-left align-middle font-normal text-on-surface-variant">
              {r.label}
            </th>
            <td className="py-1.5 align-middle">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 rounded-full bg-[color:var(--color-info-border)]"
                  style={{ width: `${Math.max(3, (r.count / max) * 100)}%` }}
                />
                <span className="num text-on-surface-variant">{r.count}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ReportDocPage() {
  const { slug } = useParams()
  const meta = reportBySlug(slug!)
  if (!meta) return null
  const path = paths.reportDoc(meta.slug)

  const pct = (n: number) => Math.round((n / stats.total) * 100)
  const e = stats.evidence

  const datasetLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: meta.title,
    description: meta.dek,
    creator: { '@type': 'Organization', name: SITE_NAME },
    dateModified: meta.updated,
    isAccessibleForFree: true,
    measurementTechnique: 'Aggregated from verified public sources cited per catalog record',
    variableMeasured: [
      'Headquarters country',
      'Declared standards',
      'Third-party accessibility-statement evidence',
      'Declarant type (public body vs. private)',
      'Founding year',
      'Price band',
    ],
    mainEntityOfPage: `${ORIGIN}${path}`,
  }
  const reportLd = {
    '@context': 'https://schema.org',
    '@type': 'Report',
    headline: meta.title,
    description: meta.dek,
    datePublished: meta.updated,
    dateModified: meta.updated,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: `${ORIGIN}${path}`,
  }

  return (
    <Layout
      title={`${meta.title} — AccessAtlas`}
      description={meta.dek}
      path={path}
      crumbs={[{ name: 'Reports', path: paths.reports() }]}
    >
      <JsonLd data={datasetLd} />
      <JsonLd data={reportLd} />

      <h1 className="h1">{meta.title}</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        Updated <span className="num">{meta.updated}</span> · computed from{' '}
        <span className="num">{stats.total}</span> catalog records
      </p>
      <p className="lede">{meta.dek}</p>

      {/* Honest framing up front (§21): say what this is and, just as loudly,
          what it is not. */}
      <div className="mt-6 rounded-xl border border-[color:var(--color-info-border)] bg-[color:var(--color-info-soft)] p-4 text-sm text-on-surface-variant">
        <p>
          <strong>What this is.</strong> An analysis of the AccessAtlas catalog as a dataset: who is
          listed, where they are based, which standards they name, and — the part most directories skip
          — what independent evidence backs each listing.
        </p>
        <p className="mt-2">
          <strong>What this is not.</strong> It is not a ranking or accessibility score of anyone&rsquo;s
          website. We have no scan corpus of third-party sites, so there are no site scores here to
          invent. Every figure below is counted from our own records and is only as complete as the
          catalog itself.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="h2">The catalog at a glance</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile value={stats.total} label="Listed specialists" />
          <StatTile value={stats.hqCountries.count} label="Headquarters countries" note={`${stats.countriesCovered} covered by service area`} />
          <StatTile value={e.recordsWithAnyCert} label="With a verifiable credential" note={`${pct(e.recordsWithAnyCert)}% of listings`} />
          <StatTile value={e.recordsWithNamedAuditorStatement} label="Named in a published statement" note={`${pct(e.recordsWithNamedAuditorStatement)}% of listings`} />
        </div>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">Where the specialists are based</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          Headquarters country of each listing. The market the catalog has reached so far is
          concentrated in the EAA/BFSG and US-Section-508 economies — Germany and the United States lead,
          with Poland, France, the United Kingdom and the Netherlands close behind.
        </p>
        <BarList
          caption="Number of listed specialists by headquarters country"
          rows={stats.hqCountries.distribution.map((c) => ({ key: c.code, label: c.name, count: c.count }))}
        />
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">By which standard they work</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          Standards each specialist declares it audits against (a listing can name several). WCAG 2.2 is
          the near-universal baseline; the European harmonised standard EN 301 549 and the EAA follow,
          reflecting where regulatory demand is sharpest.
        </p>
        <BarList
          caption="Number of listed specialists by declared standard"
          rows={stats.standards.map((s) => ({ key: s.slug, label: s.label, count: s.count }))}
        />
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">By what evidence they are listed</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          A directory is only as trustworthy as the proof behind each entry. The strongest evidence we
          record is being named as the auditor in someone else&rsquo;s <em>published</em> accessibility
          statement — evidence that lives on a third party&rsquo;s domain, not the agency&rsquo;s own.{' '}
          <span className="num">{e.recordsWithNamedAuditorStatement}</span> of{' '}
          <span className="num">{stats.total}</span> listings carry exactly that.
        </p>
        <BarList
          caption="Listed specialists by type of verifiable credential"
          rows={[
            { key: 'statement', label: 'Named in a published statement', count: e.certKinds['statement-named-auditor'] ?? 0 },
            { key: 'bitv', label: 'BIK BITV-Test Prüfstelle', count: e.certKinds['bitv-pruefstelle'] ?? 0 },
            { key: 'iaap-org', label: 'IAAP organisational member', count: e.certKinds['iaap-org-member'] ?? 0 },
            { key: 'dhs', label: 'DHS Trusted Tester', count: e.certKinds['dhs-trusted-tester'] ?? 0 },
            { key: 'iaap-staff', label: 'IAAP-certified staff', count: e.certKinds['iaap-certified-staff'] ?? 0 },
          ]}
        />
        <h3 className="mt-6 text-base font-semibold text-on-surface">Who published that statement</h3>
        <p className="max-w-prose text-sm text-on-surface-variant">
          For the {e.recordsWithNamedAuditorStatement} named-auditor statements, we record who declared
          it — because &ldquo;a public body named them&rdquo; and &ldquo;a private company named
          them&rdquo; are different strengths of evidence, and we refuse to blur the two.
        </p>
        <BarList
          caption="Named-auditor statements by declarant type"
          rows={[
            { key: 'public', label: 'Public body', count: e.namedAuditorByDeclarant['public-body'] ?? 0 },
            { key: 'private', label: 'Private organisation', count: e.namedAuditorByDeclarant['private'] ?? 0 },
            { key: 'unknown', label: 'Declarant not named', count: e.namedAuditorByDeclarant['unknown'] ?? 0 },
          ]}
        />
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">What we deliberately do not claim</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          The honest shape of a dataset includes its gaps. Two fields are populated only where a source
          proves them, and left empty otherwise rather than guessed:
        </p>
        <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
          <li className="rounded-xl border border-outline-variant p-4">
            <strong className="text-on-surface">Price.</strong> We publish a price band for only{' '}
            <span className="num">{stats.priceBands.withBand}</span> of{' '}
            <span className="num">{stats.total}</span> listings — the{' '}
            <span className="num">{stats.priceBands.withoutBand}</span> others have no verifiable
            published price, so we show none. A band is never inferred from a company&rsquo;s size or
            country.
          </li>
          <li className="rounded-xl border border-outline-variant p-4">
            <strong className="text-on-surface">Founding year.</strong>{' '}
            <span className="num">{stats.founded.withYear}</span> listings have a founding year we could
            verify against an imprint, register, or company-history page (the oldest dates to{' '}
            <span className="num">{stats.founded.oldest}</span>, the median to{' '}
            <span className="num">{stats.founded.median}</span>); the remaining{' '}
            <span className="num">{stats.founded.withoutYear}</span> are left blank rather than filled
            from an unverified third-party profile.
          </li>
        </ul>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">How this was made</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          Every number on this page is computed at build time from{' '}
          <span className="font-mono text-xs">data/a11y/agencies.json</span> by a single aggregator
          script — nothing here is transcribed by hand, and a test recomputes the figures from the
          catalog and fails if the published snapshot drifts. Each record in the catalog carries at
          least one cited source; across all {stats.total} listings there are{' '}
          <span className="num">{stats.sources.totalRefs}</span> source references, and{' '}
          <span className="num">{stats.sources.recordsWithMultiple}</span> listings stand on two or
          more.
        </p>
        <p className="mt-3 max-w-prose text-sm text-on-surface-variant">
          How each field is verified — and its limits — is documented in our{' '}
          <Link className="underline underline-offset-2" to={paths.methodology()}>
            methodology
          </Link>
          . You can browse the underlying records in the{' '}
          <Link className="underline underline-offset-2" to={paths.agencies()}>
            directory
          </Link>
          .
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link className="btn" to={paths.scan()}>
          Scan your website
        </Link>{' '}
        <span className="ml-2 text-on-surface-variant">
          Free instant check, then find a verified specialist from this dataset.
        </span>
      </p>
    </Layout>
  )
}
