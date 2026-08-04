import { Link, useParams } from 'react-router-dom'
import { Layout } from '@dir/components/Layout'
import { FilterableList } from '@dir/components/FilterableList'
import { JsonLd, itemListLd } from '@dir/lib/seo'
import {
  INDEX_THRESHOLD,
  agenciesIn,
  countryBySlug,
  paths,
  serviceFromSeg,
  serviceLabel,
  withService,
} from '@dir/lib/data'

export default function ComboPage() {
  const { country: cSlug, service: sSeg } = useParams()
  const c = countryBySlug(cSlug!)
  const s = serviceFromSeg(sSeg!)
  if (!c || !s) return null
  const list = withService(agenciesIn(c.code), s)
  const label = serviceLabel(s)
  const law = c.meta.law

  const title = `${label}: ${list.length} ${list.length === 1 ? 'provider' : 'providers'} in ${c.name}`
  const description = `Compare ${list.length} verified providers of ${label.toLowerCase()} services in ${c.name}${
    law ? ` (${law.name})` : ''
  }. Filter by standard, certification and price band.`

  return (
    <Layout
      title={title}
      description={description}
      path={paths.combo(c, s)}
      index={list.length >= INDEX_THRESHOLD}
      crumbs={[
        { name: 'Countries', path: paths.countries() },
        { name: c.name, path: paths.country(c) },
      ]}
    >
      <JsonLd data={itemListLd(list.map((a) => paths.agency(a.slug)))} />
      <h1 className="h1">
        {label} in {c.name}
      </h1>
      <p className="lede">
        {list.length} verified {list.length === 1 ? 'provider offers' : 'providers offer'}{' '}
        {label.toLowerCase()} for organisations in {c.name}
        {law && (
          <>
            {' '}
            — the market where <strong>{law.name}</strong>
            {law.inForce && <> (in force since {law.inForce})</>} sets the compliance bar
          </>
        )}
        . Sources are cited on every profile.
      </p>
      <p className="mt-3 text-sm text-slate-500">
        See also:{' '}
        <Link className="underline underline-offset-2" to={paths.country(c)}>
          all agencies in {c.name}
        </Link>{' '}
        ·{' '}
        <Link className="underline underline-offset-2" to={paths.service(s)}>
          {label} worldwide
        </Link>
      </p>

      <FilterableList items={list} hideServiceFacet />
    </Layout>
  )
}
