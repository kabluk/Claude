// Блок «подходящие агентства» под отчётом сканера (A1-MATCH, INTERFACES.md §5,
// VISION.md UX-требование 5). Страна — явный выбор пользователя (без гадания
// по IP/домену, см. matchAgencies.ts), услуга и бюджет выводятся из отчёта.

import { useMemo, useState } from 'react'
import type { ScanFinding } from '@/lib/scanner'
import type { PriceBand, ServiceSlug } from '@data/a11y/types'
import { matchAgencies } from '@/lib/matchAgencies'
import { AgencyCard } from './AgencyCard'
import { countries, paths } from '@/lib/data'

const MATCH_LIMIT = 3

export function MatchedAgencies({
  findings,
  priceBand,
  scanId,
}: {
  findings: ScanFinding[]
  priceBand?: PriceBand
  scanId?: string
}) {
  const [countryCode, setCountryCode] = useState('')

  // Есть серьёзная находка — предлагаем ремедиацию, а не просто ещё один аудит.
  const service: ServiceSlug = findings.some((f) => f.impact === 'critical' || f.impact === 'serious')
    ? 'remediation'
    : 'audit'

  const matches = useMemo(
    () => matchAgencies({ countryCode: countryCode || undefined, service, priceBand }, MATCH_LIMIT),
    [countryCode, service, priceBand],
  )

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="h2 mt-0">Agencies that can help</h2>
        <label className="flex items-center gap-2 text-sm text-on-surface-variant">
          Country
          <select
            className="rounded border border-outline bg-surface px-2 py-1 text-sm"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            <option value="">Any</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {matches.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((a) => (
            <AgencyCard key={a.slug} a={a} />
          ))}
        </div>
      ) : (
        <p className="lede mt-4">No agencies matched this filter yet — try a different country.</p>
      )}

      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-on-surface-variant">
        <a className="underline underline-offset-2" href={paths.agencies()}>
          Compare all agencies in the catalog →
        </a>
        <a
          className="underline underline-offset-2"
          href={scanId ? `${paths.requestQuote()}?scanId=${encodeURIComponent(scanId)}` : paths.requestQuote()}
        >
          Request a quote from matching agencies →
        </a>
      </p>
    </section>
  )
}
