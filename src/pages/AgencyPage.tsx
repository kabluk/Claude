import { Link, useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { AgencyCard } from '@/components/AgencyCard'
import { JsonLd, ORIGIN } from '@/lib/seo'
import {
  agencyBySlug,
  certLabel,
  countryByCode,
  paths,
  priceLabel,
  relatedTo,
  serviceLabel,
  standardLabel,
  tax,
} from '@/lib/data'

export default function AgencyPage() {
  const { slug } = useParams()
  const a = agencyBySlug(slug!)
  if (!a) return null
  const country = countryByCode(a.hq.countryCode)
  const place = [a.hq.city, country?.name ?? a.hq.countryCode].filter(Boolean).join(', ')
  const related = relatedTo(a)

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: a.name,
    url: `https://${a.website}`,
    address: {
      '@type': 'PostalAddress',
      ...(a.hq.city ? { addressLocality: a.hq.city } : {}),
      addressCountry: a.hq.countryCode,
    },
    areaServed: a.countriesServed.filter((c) => /^[A-Z]{2}$/.test(c)),
    ...(a.languages.length ? { availableLanguage: a.languages } : {}),
    knowsAbout: a.standards.map((s) => standardLabel(s)),
    ...(a.certs.some((c) => c.kind === 'iaap-org-member')
      ? { memberOf: { '@type': 'Organization', name: 'International Association of Accessibility Professionals' } }
      : {}),
    '@id': `${ORIGIN}${paths.agency(a.slug)}`,
  }

  const title = `${a.name} — accessibility ${a.services.includes('audit') ? 'audit ' : ''}agency${country ? `, ${country.name}` : ''}`
  const description =
    a.description.en ??
    `${a.name}${place ? ` (${place})` : ''}: ${a.services.map(serviceLabel).join(', ').toLowerCase()}. Standards: ${a.standards.map(standardLabel).join(', ') || '—'}. Verified listing with cited sources.`

  return (
    <Layout
      title={title}
      description={description.slice(0, 300)}
      path={paths.agency(a.slug)}
      crumbs={
        country
          ? [{ name: 'Countries', path: paths.countries() }, { name: country.name, path: paths.country(country) }]
          : [{ name: 'Experts', path: paths.agencies() }]
      }
    >
      <JsonLd data={ld} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="h1">{a.name}</h1>
          {place && <p className="mt-1 text-slate-500">{place}</p>}
        </div>
        <a className="btn" href={`https://${a.website}`} target="_blank" rel="noopener noreferrer nofollow">
          Visit website ↗
        </a>
      </div>

      {a.certs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {a.certs.map((c) => (
            <span key={c.kind} className="chip chip-accent">
              ✓ {certLabel(c)}
              {c.kind === 'iaap-certified-staff' && ` (${c.count})`}
            </span>
          ))}
        </div>
      )}

      {a.description.en && <p className="lede">{a.description.en}</p>}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="h2 mt-0">Services</h2>
          <div className="flex flex-wrap gap-1.5">
            {a.services.map((s) => (
              <Link key={s} to={country ? paths.combo(country, s) : paths.service(s)} className="chip hover:border-slate-400">
                {serviceLabel(s)}
              </Link>
            ))}
            {a.services.length === 0 && <p className="text-sm text-slate-500">Pending verification.</p>}
          </div>

          <h2 className="h2">Standards</h2>
          <div className="flex flex-wrap gap-1.5">
            {a.standards.map((s) => (
              <Link key={s} to={paths.standard(s)} className="chip hover:border-slate-400">
                {standardLabel(s)}
              </Link>
            ))}
            {a.standards.length === 0 && <p className="text-sm text-slate-500">Pending verification.</p>}
          </div>
        </section>

        <section>
          <h2 className="h2 mt-0">Details</h2>
          <dl className="space-y-2 text-sm">
            {a.priceBand && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Typical audit price</dt>
                <dd>{priceLabel(a.priceBand)}</dd>
              </div>
            )}
            {a.founded != null && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">In business since</dt>
                <dd>{a.founded}</dd>
              </div>
            )}
            {a.languages.length > 0 && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Working languages</dt>
                <dd className="uppercase">{a.languages.join(', ')}</dd>
              </div>
            )}
            {a.countriesServed.length > 0 && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Serves</dt>
                <dd className="text-right">
                  {a.countriesServed
                    .map((c) =>
                      c === 'remote-global' ? 'Worldwide (remote)' : c === 'remote-eu' ? 'EU (remote)' : (countryByCode(c)?.name ?? c),
                    )
                    .join(', ')}
                </dd>
              </div>
            )}
            {a.industries.length > 0 && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Industries</dt>
                <dd className="text-right">{a.industries.map((i) => tax.industries[i]?.en ?? i).join(', ')}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 pb-2">
              <dt className="text-slate-500">Last verified</dt>
              <dd>{a.lastVerified}</dd>
            </div>
          </dl>

          <h2 className="h2">Listing sources</h2>
          <ul className="space-y-1 text-sm">
            {a.sourceRefs.map((r) => (
              <li key={r.url}>
                <a className="text-[color:var(--color-accent)] underline decoration-slate-300 underline-offset-2 hover:decoration-current" href={r.url} target="_blank" rel="noopener noreferrer nofollow">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Every listing on this site cites where its facts come from. Spotted an error?
            The agency can claim this profile to correct it.
          </p>
        </section>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="h2">Similar agencies{country ? ` in ${country.name}` : ''}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <AgencyCard key={r.slug} a={r} />
            ))}
          </div>
        </section>
      )}
    </Layout>
  )
}
