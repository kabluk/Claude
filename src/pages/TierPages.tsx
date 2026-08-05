// Ярусные страницы-оглавления: /countries/, /services/, /standards/,
// /agencies/. Дают ботам короткий путь до любой страницы (глубина ≤3).

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import {
  SERVICES,
  STANDARDS,
  agencies,
  countries,
  paths,
  serviceLabel,
  sortListing,
  standardLabel,
  withService,
  withStandard,
} from '@/lib/data'

export function CountriesPage() {
  return (
    <Layout
      title={`Accessibility agencies by country (${countries.length})`}
      description={`Browse ${agencies.length} verified digital-accessibility agencies across ${countries.length} countries — each country page lists local providers, the applicable law and its deadline.`}
      path={paths.countries()}
      crumbs={[]}
    >
      <h1 className="h1">Agencies by country</h1>
      <p className="lede">
        Every country page shows verified local providers plus the accessibility law that applies
        there.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((c) => (
          <Link key={c.code} to={paths.country(c)} className="card tile">
            <span className="font-semibold">{c.name}</span>
            <span className="text-sm text-slate-500">{c.count}</span>
          </Link>
        ))}
      </div>
    </Layout>
  )
}

export function ServicesPage() {
  return (
    <Layout
      title="Accessibility services: audit, remediation, VPAT, training"
      description={`Compare ${agencies.length} verified agencies by service line — accessibility audits, remediation, VPAT/ACR reports, training, monitoring and consulting.`}
      path={paths.services()}
      crumbs={[]}
    >
      <h1 className="h1">Services</h1>
      <p className="lede">What kind of help do you need? Each service page lists verified providers worldwide, filterable by country.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <Link key={s} to={paths.service(s)} className="card tile">
            <span className="font-semibold">{serviceLabel(s)}</span>
            <span className="text-sm text-slate-500">{withService(agencies, s).length}</span>
          </Link>
        ))}
      </div>
    </Layout>
  )
}

export function StandardsPage() {
  return (
    <Layout
      title="Accessibility standards: WCAG, EN 301 549, Section 508, EAA"
      description="Find auditors by compliance standard — WCAG 2.2, EN 301 549, Section 508, ADA, the European Accessibility Act, BITV 2.0 and RGAA."
      path={paths.standards()}
      crumbs={[]}
    >
      <h1 className="h1">Standards</h1>
      <p className="lede">Start from the rule you must comply with; each page lists agencies that audit against it.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STANDARDS.map((s) => (
          <Link key={s} to={paths.standard(s)} className="card tile">
            <span className="font-semibold">{standardLabel(s)}</span>
            <span className="text-sm text-slate-500">{withStandard(agencies, s).length}</span>
          </Link>
        ))}
      </div>
    </Layout>
  )
}

export function AgenciesIndexPage() {
  const list = sortListing(agencies)
  return (
    <Layout
      title={`All ${agencies.length} verified accessibility agencies, A–Z`}
      description={`Full A–Z index of ${agencies.length} verified digital-accessibility agencies with cited sources — audits, remediation, VPAT, training and monitoring.`}
      path={paths.agencies()}
      crumbs={[]}
    >
      <h1 className="h1">All agencies</h1>
      <p className="lede">{agencies.length} verified listings. Prefer a shortlist? Start from your <Link className="underline underline-offset-2" to={paths.countries()}>country</Link> or <Link className="underline underline-offset-2" to={paths.services()}>service</Link>.</p>
      <ul className="mt-6 columns-1 gap-6 sm:columns-2 lg:columns-3">
        {[...list]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((a) => (
            <li key={a.slug} className="mb-1.5 break-inside-avoid text-sm">
              <Link className="hover:underline" to={paths.agency(a.slug)}>
                {a.name}
              </Link>{' '}
              <span className="text-slate-400">{a.hq.countryCode}</span>
            </li>
          ))}
      </ul>
    </Layout>
  )
}
