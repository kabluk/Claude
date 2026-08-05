import { Link } from 'react-router-dom'
import { Layout } from '@dir/components/Layout'
import { JsonLd, ORIGIN, SITE_NAME } from '@dir/lib/seo'
import {
  SERVICES,
  STANDARDS,
  agencies,
  countries,
  paths,
  serviceLabel,
  standardLabel,
  withService,
  withStandard,
} from '@dir/lib/data'
import { guides } from '@dir/lib/guides'

export default function HomePage() {
  const certified = agencies.filter((a) => a.certs.length > 0).length
  return (
    <Layout
      title={`${SITE_NAME}: ${agencies.length} verified WCAG & EAA audit agencies`}
      description={`Find a verified digital-accessibility agency in ${countries.length} countries. WCAG 2.2, EN 301 549, Section 508, EAA, BITV, RGAA — real auditors, no overlays, every listing with cited sources.`}
      path="/"
    >
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: `${ORIGIN}/`,
        }}
      />
      <section className="py-8 sm:py-12">
        <h1 className="h1 max-w-3xl">
          Find a verified accessibility audit agency — before the deadline finds you
        </h1>
        <p className="lede">
          {agencies.length} agencies across {countries.length} countries, checked against public
          sources: WCAG 2.2, EN 301 549, Section 508, the European Accessibility Act, BITV and
          RGAA. {certified} hold independently verifiable certifications. No automated
          «overlay» vendors — real auditors only.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn" to={paths.countries()}>
            Browse by country
          </Link>
          <Link className="btn-ghost" to={paths.services()}>
            Browse by service
          </Link>
        </div>
      </section>

      <section>
        <h2 className="h2">By country</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {countries.slice(0, 12).map((c) => (
            <Link key={c.code} to={paths.country(c)} className="card tile">
              <span className="font-semibold">{c.name}</span>
              <span className="text-sm text-slate-500">{c.count} agencies</span>
            </Link>
          ))}
        </div>
        {countries.length > 12 && (
          <p className="mt-3 text-sm">
            <Link className="underline underline-offset-2" to={paths.countries()}>
              All {countries.length} countries →
            </Link>
          </p>
        )}
      </section>

      <section>
        <h2 className="h2">By service</h2>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <Link key={s} to={paths.service(s)} className="chip hover:border-slate-400">
              {serviceLabel(s)} · {withService(agencies, s).length}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h2">By standard</h2>
        <div className="flex flex-wrap gap-2">
          {STANDARDS.map((s) => (
            <Link key={s} to={paths.standard(s)} className="chip hover:border-slate-400">
              {standardLabel(s)} · {withStandard(agencies, s).length}
            </Link>
          ))}
        </div>
      </section>

      {guides.length > 0 && (
        <section>
          <h2 className="h2">Compliance guides</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guides.slice(0, 6).map((g) => (
              <Link key={g.slug} to={`/guides/${g.slug}/`} className="card" lang={g.locale}>
                <span className="font-semibold">{g.title}</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm">
            <Link className="underline underline-offset-2" to="/guides/">
              All guides →
            </Link>
          </p>
        </section>
      )}

      <section className="mt-12 max-w-2xl rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <h2 className="text-base font-semibold text-slate-800">How listings are verified</h2>
        <p className="mt-2">
          Every agency here is backed by at least one public source — a certification register
          (BIK BITV-Test, IAAP), a government procurement framework, a mandatory accessibility
          statement naming the auditor, or the agency's own published service pages. The source
          links are shown on each profile. Fields we could not verify stay empty — we never
          guess prices, certifications or locations.
        </p>
      </section>
    </Layout>
  )
}
