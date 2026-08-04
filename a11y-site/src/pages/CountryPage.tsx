import { Link, useParams } from 'react-router-dom'
import { Layout } from '@dir/components/Layout'
import { FilterableList } from '@dir/components/FilterableList'
import { JsonLd, itemListLd } from '@dir/lib/seo'
import {
  INDEX_THRESHOLD,
  SERVICES,
  agenciesIn,
  countryBySlug,
  paths,
  serviceLabel,
  withService,
} from '@dir/lib/data'

export default function CountryPage() {
  const { country: slug } = useParams()
  const c = countryBySlug(slug!)
  if (!c) return null
  const list = agenciesIn(c.code)
  const certified = list.filter((a) => a.certs.length > 0).length
  const law = c.meta.law

  const title = `Accessibility audit agencies in ${c.name} (${list.length})`
  const description = `${list.length} verified digital-accessibility agencies serving ${c.name}${
    certified ? `, ${certified} with verified certifications` : ''
  }${law ? `. Local rule: ${law.name}` : ''}. Compare services, standards and sources.`

  return (
    <Layout
      title={title}
      description={description}
      path={paths.country(c)}
      index={list.length >= INDEX_THRESHOLD}
      crumbs={[{ name: 'Countries', path: paths.countries() }]}
    >
      <JsonLd data={itemListLd(list.map((a) => paths.agency(a.slug)))} />
      <h1 className="h1">Accessibility audit agencies in {c.name}</h1>
      <p className="lede">
        {list.length} verified {list.length === 1 ? 'agency' : 'agencies'} audit, remediate and
        certify digital accessibility for organisations in {c.name}
        {certified > 0 && (
          <> — {certified} carry independently verifiable certifications</>
        )}
        . Every listing cites its source.
      </p>

      {law && (
        <div className="mt-5 max-w-2xl rounded-xl border border-indigo-100 bg-[color:var(--color-accent-soft)] p-4 text-sm">
          <p>
            <strong>Applicable law in {c.name}:</strong> {law.name}
            {law.inForce && <> — in force since {law.inForce}</>}
            {'.'}{' '}
            <Link className="underline underline-offset-2" to={paths.standard(law.slug)}>
              Agencies for this standard →
            </Link>
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {SERVICES.map((s) => {
          const n = withService(list, s).length
          return n > 0 ? (
            <Link key={s} to={paths.combo(c, s)} className="chip hover:border-slate-400">
              {serviceLabel(s)} · {n}
            </Link>
          ) : null
        })}
      </div>

      <FilterableList items={list} />
    </Layout>
  )
}
