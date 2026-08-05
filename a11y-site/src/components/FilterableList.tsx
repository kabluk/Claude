// Клиентские фильтры поверх SSG-списка: без JavaScript страница отдаёт
// полный список (initial state — фильтры выключены), с JS — мгновенная
// фильтрация в памяти. Внутри фасета — ИЛИ, между фасетами — И.

import { useMemo, useState } from 'react'
import type { Agency, PriceBand, ServiceSlug, StandardSlug } from '@data/a11y/types'
import {
  SERVICES,
  STANDARDS,
  priceLabel,
  serviceLabel,
  standardLabel,
  tax,
} from '@dir/lib/data'
import { AgencyCard } from './AgencyCard'

const CERT_KINDS = [
  ['iaap-org-member', 'IAAP member'],
  ['bitv-pruefstelle', 'BITV Prüfstelle'],
  ['gov-declared-auditor', 'Gov-declared auditor'],
  ['dhs-trusted-tester', 'DHS Trusted Tester'],
] as const

function toggle<T>(set: Set<T>, v: T): Set<T> {
  const next = new Set(set)
  if (next.has(v)) next.delete(v)
  else next.add(v)
  return next
}

export function FilterableList({
  items,
  hideServiceFacet = false,
  hideStandardFacet = false,
}: {
  items: Agency[]
  hideServiceFacet?: boolean // на комбо-страницах услуга уже зафиксирована URL-ом
  hideStandardFacet?: boolean
}) {
  const [services, setServices] = useState<Set<ServiceSlug>>(new Set())
  const [standards, setStandards] = useState<Set<StandardSlug>>(new Set())
  const [certs, setCerts] = useState<Set<string>>(new Set())
  const [prices, setPrices] = useState<Set<PriceBand>>(new Set())
  const [q, setQ] = useState('')

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter(
      (a) =>
        (!services.size || a.services.some((s) => services.has(s))) &&
        (!standards.size || a.standards.some((s) => standards.has(s))) &&
        (!certs.size || a.certs.some((c) => certs.has(c.kind))) &&
        (!prices.size || (a.priceBand != null && prices.has(a.priceBand))) &&
        (!needle ||
          a.name.toLowerCase().includes(needle) ||
          a.hq.city.toLowerCase().includes(needle)),
    )
  }, [items, services, standards, certs, prices, q])

  const facet = (avail: number) => (avail > 1 ? '' : 'hidden')

  return (
    <div>
      <div className="mt-6 space-y-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or city…"
          aria-label="Search agencies"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {!hideServiceFacet &&
            SERVICES.map((s) => (
              <button
                key={s}
                type="button"
                className="chip chip-btn"
                aria-pressed={services.has(s)}
                onClick={() => setServices(toggle(services, s))}
              >
                {serviceLabel(s)}
              </button>
            ))}
          {!hideStandardFacet &&
            STANDARDS.map((s) => (
              <button
                key={s}
                type="button"
                className="chip chip-btn"
                aria-pressed={standards.has(s)}
                onClick={() => setStandards(toggle(standards, s))}
              >
                {standardLabel(s)}
              </button>
            ))}
          {CERT_KINDS.map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              className="chip chip-btn"
              aria-pressed={certs.has(kind)}
              onClick={() => setCerts(toggle(certs, kind))}
            >
              ✓ {label}
            </button>
          ))}
          {(Object.keys(tax.priceBands) as PriceBand[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`chip chip-btn ${facet(items.filter((a) => a.priceBand === p).length)}`}
              aria-pressed={prices.has(p)}
              onClick={() => setPrices(toggle(prices, p))}
            >
              {priceLabel(p)}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-slate-500">
        {shown.length} of {items.length} agencies
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {shown.map((a) => (
          <AgencyCard key={a.slug} a={a} headingLevel="h2" />
        ))}
      </div>
      {shown.length === 0 && (
        <p className="mt-6 text-slate-500">No agencies match these filters yet.</p>
      )}
    </div>
  )
}
