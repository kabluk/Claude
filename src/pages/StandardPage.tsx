import { Link, useParams } from 'react-router-dom'
import type { StandardSlug } from '@data/a11y/types'
import { Layout } from '@/components/Layout'
import { FilterableList } from '@/components/FilterableList'
import { JsonLd, itemListLd } from '@/lib/seo'
import { guidesFor } from '@/lib/guides'
import {
  INDEX_THRESHOLD,
  STANDARDS,
  agencies,
  paths,
  standardLabel,
  tax,
  withStandard,
} from '@/lib/data'

const SCOPE_LINE: Record<string, string> = {
  global: 'the international baseline for web accessibility',
  eu: 'the European requirement behind the EAA and public-sector rules',
  us: 'the United States compliance framework',
  de: 'the German federal implementation (BITV 2.0 / BFSG)',
  fr: 'the French public-sector standard (RGAA)',
}

export default function StandardPage() {
  const { standard } = useParams()
  const s = standard as StandardSlug
  if (!STANDARDS.includes(s)) return null
  const meta = tax.standards[s]
  const list = withStandard(agencies, s)
  const label = standardLabel(s)

  const title = `${label} auditors & agencies (${list.length})`
  const description = `${list.length} verified agencies audit against ${label} — ${
    SCOPE_LINE[meta.scope]
  }. Compare providers, certifications and prices; sources cited on every profile.`

  return (
    <Layout
      title={title}
      description={description}
      path={paths.standard(s)}
      index={list.length >= INDEX_THRESHOLD}
      crumbs={[{ name: 'Standards', path: paths.standards() }]}
    >
      <JsonLd data={itemListLd(list.slice(0, 50).map((a) => paths.agency(a.slug)))} />
      <h1 className="h1">{label}: auditors and agencies</h1>
      <p className="lede">
        {list.length} verified {list.length === 1 ? 'agency audits' : 'agencies audit'} against{' '}
        {label}, {SCOPE_LINE[meta.scope]}.{' '}
        {meta.about && (
          <a
            className="underline underline-offset-2"
            href={meta.about}
            target="_blank"
            rel="noopener noreferrer"
          >
            Official reference ↗
          </a>
        )}
      </p>

      {guidesFor({ standard: s }).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {guidesFor({ standard: s }).map((g) => (
            <Link key={g.slug} to={`/guides/${g.slug}/`} className="chip hover:border-outline" lang={g.locale}>
              📖 {g.title}
            </Link>
          ))}
        </div>
      )}

      <FilterableList items={list} heading={`${label} auditors`} hideStandardFacet />
    </Layout>
  )
}
