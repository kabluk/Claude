import { Link, useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { FilterableList } from '@/components/FilterableList'
import { JsonLd, itemListLd } from '@/lib/seo'
import {
  INDEX_THRESHOLD,
  SERVICES,
  agenciesIn,
  countryBySlug,
  paths,
  serviceLabel,
  withService,
} from '@/lib/data'
import { guidesFor } from '@/lib/guides'

// Вход на языке страны — только там, где для него есть материал (D-041).
const COUNTRY_ENTRY: Record<
  string,
  { path: string; label: string; blurb: string; lang: string }
> = {
  DE: {
    path: paths.bfsgCheck(),
    lang: 'de',
    blurb:
      'Auf Deutsch: Prüfen Sie zuerst, ob Ihre Website eine Erklärung zur Barrierefreiheit nach Anlage 3 zu § 14 BFSG hat.',
    label: 'Zum BFSG-Check',
  },
}

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
        <div className="mt-5 max-w-2xl rounded-xl border border-outline-variant bg-secondary-container p-4 text-sm">
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

      {/* D-041: страна, для которой у нас есть собственный вход на её языке.
          Карта, а не `if (code === 'DE')`, — чтобы следующая страна добавлялась
          строкой данных; сейчас в ней честно ровно одна запись, потому что
          verified-ссылка и названные в декларациях прюферы есть только у DE. */}
      {COUNTRY_ENTRY[c.code] && (
        <div className="mt-4 max-w-2xl rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm">
          <p lang={COUNTRY_ENTRY[c.code].lang}>
            {COUNTRY_ENTRY[c.code].blurb}{' '}
            <Link
              className="font-medium underline underline-offset-2"
              to={COUNTRY_ENTRY[c.code].path}
            >
              {COUNTRY_ENTRY[c.code].label} →
            </Link>
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {SERVICES.map((s) => {
          const n = withService(list, s).length
          return n > 0 ? (
            <Link key={s} to={paths.combo(c, s)} className="chip hover:border-outline">
              {serviceLabel(s)} · {n}
            </Link>
          ) : null
        })}
      </div>

      {guidesFor({ countryCode: c.code }).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {guidesFor({ countryCode: c.code }).map((g) => (
            <Link key={g.slug} to={`/guides/${g.slug}/`} className="chip hover:border-outline" lang={g.locale}>
              📖 {g.title}
            </Link>
          ))}
        </div>
      )}

      <FilterableList items={list} heading={`Agencies in ${c.name}`} />
    </Layout>
  )
}
