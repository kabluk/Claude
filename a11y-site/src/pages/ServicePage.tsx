import { Link, useParams } from 'react-router-dom'
import { Layout } from '@dir/components/Layout'
import { FilterableList } from '@dir/components/FilterableList'
import { JsonLd, itemListLd } from '@dir/lib/seo'
import {
  INDEX_THRESHOLD,
  agencies,
  countries,
  paths,
  serviceFromSeg,
  serviceLabel,
  withService,
} from '@dir/lib/data'

export default function ServicePage() {
  const { service: seg } = useParams()
  const s = serviceFromSeg(seg!)
  if (!s) return null
  const list = withService(agencies, s)
  const label = serviceLabel(s)

  const title = `${label}: ${list.length} verified providers worldwide`
  const description = `${list.length} agencies offering ${label.toLowerCase()} across ${
    countries.length
  } countries — with verifiable certifications and cited sources. Filter by standard, certification and price.`

  return (
    <Layout
      title={title}
      description={description}
      path={paths.service(s)}
      index={list.length >= INDEX_THRESHOLD}
      crumbs={[{ name: 'Services', path: paths.services() }]}
    >
      <JsonLd data={itemListLd(list.slice(0, 50).map((a) => paths.agency(a.slug)))} />
      <h1 className="h1">{label}</h1>
      <p className="lede">
        {list.length} verified {list.length === 1 ? 'agency offers' : 'agencies offer'}{' '}
        {label.toLowerCase()} worldwide. Narrow down by country:
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {countries.map((c) => {
          const n = withService(
            agencies.filter((a) => a.hq.countryCode === c.code || a.countriesServed.includes(c.code)),
            s,
          ).length
          return n > 0 ? (
            <Link key={c.code} to={paths.combo(c, s)} className="chip hover:border-slate-400">
              {c.name} · {n}
            </Link>
          ) : null
        })}
      </div>

      <FilterableList items={list} hideServiceFacet />
    </Layout>
  )
}
