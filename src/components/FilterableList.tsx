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
} from '@/lib/data'
import { AgencyCard } from './AgencyCard'

const CERT_KINDS = [
  ['iaap-org-member', 'IAAP member'],
  ['bitv-pruefstelle', 'BITV Prüfstelle'],
  // D-042: один фасет на оба случая — фильтр отвечает на «названы ли вообще»,
  // а чья это декларация (орган власти или частная компания), видно в подписи
  // бейджа на карточке (certLabel в data.ts).
  ['statement-named-auditor', 'Named in a statement'],
  ['dhs-trusted-tester', 'DHS Trusted Tester'],
] as const

function toggle<T>(set: Set<T>, v: T): Set<T> {
  const next = new Set(set)
  if (next.has(v)) next.delete(v)
  else next.add(v)
  return next
}

// "1 agency" / "20 agencies" — для aria-label кнопки-чипа: число рядом с
// подписью читается скринридером слитно («Training 20»), поэтому полную
// формулировку даём отдельно через aria-label, а видимый текст оставляем
// компактным (подпись + число классом .num).
const agencyCount = (n: number) => `${n} ${n === 1 ? 'agency' : 'agencies'}`

export function FilterableList({
  items,
  heading = 'Agencies',
  hideServiceFacet = false,
  hideStandardFacet = false,
}: {
  items: Agency[]
  heading?: string // подпись раздела: h1 страницы → этот h2 → h3 карточек (иначе разрыв уровней)
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

  // Фасет виден, только если на этой странице есть хотя бы одно агентство под
  // него — считаем по items (полный список страницы), а не по shown, иначе
  // чипы исчезали бы по мере выбора других фильтров (дезориентирует). Порог
  // >= 1: одно агентство — уже валидный результат, прятать его нечестно.
  const facetHidden = (avail: number) => (avail >= 1 ? '' : 'hidden')

  const hasActiveFilters =
    services.size > 0 || standards.size > 0 || certs.size > 0 || prices.size > 0 || q.trim() !== ''

  const resetFilters = () => {
    setServices(new Set())
    setStandards(new Set())
    setCerts(new Set())
    setPrices(new Set())
    setQ('')
  }

  const serviceCounts = useMemo(
    () =>
      new Map(SERVICES.map((s) => [s, items.filter((a) => a.services.includes(s)).length])),
    [items],
  )
  const standardCounts = useMemo(
    () =>
      new Map(STANDARDS.map((s) => [s, items.filter((a) => a.standards.includes(s)).length])),
    [items],
  )
  const certCounts = useMemo(
    () =>
      new Map(
        CERT_KINDS.map(([kind]) => [kind, items.filter((a) => a.certs.some((c) => c.kind === kind)).length]),
      ),
    [items],
  )
  const priceCounts = useMemo(
    () =>
      new Map(
        (Object.keys(tax.priceBands) as PriceBand[]).map((p) => [
          p,
          items.filter((a) => a.priceBand === p).length,
        ]),
      ),
    [items],
  )

  return (
    <div>
      <h2 className="h2">{heading}</h2>
      <div className="space-y-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or city…"
          aria-label="Search agencies"
          className="w-full max-w-sm rounded-lg border border-outline px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {!hideServiceFacet &&
            SERVICES.map((s) => {
              const count = serviceCounts.get(s) ?? 0
              return (
                <button
                  key={s}
                  type="button"
                  className={`chip chip-btn ${facetHidden(count)}`}
                  aria-pressed={services.has(s)}
                  aria-label={`${serviceLabel(s)}, ${agencyCount(count)}`}
                  onClick={() => setServices(toggle(services, s))}
                >
                  <span aria-hidden="true">
                    {serviceLabel(s)} <span className="num">{count}</span>
                  </span>
                </button>
              )
            })}
          {!hideStandardFacet &&
            STANDARDS.map((s) => {
              const count = standardCounts.get(s) ?? 0
              return (
                <button
                  key={s}
                  type="button"
                  className={`chip chip-btn ${facetHidden(count)}`}
                  aria-pressed={standards.has(s)}
                  aria-label={`${standardLabel(s)}, ${agencyCount(count)}`}
                  onClick={() => setStandards(toggle(standards, s))}
                >
                  <span aria-hidden="true">
                    {standardLabel(s)} <span className="num">{count}</span>
                  </span>
                </button>
              )
            })}
          {CERT_KINDS.map(([kind, label]) => {
            const count = certCounts.get(kind) ?? 0
            return (
              <button
                key={kind}
                type="button"
                className={`chip chip-btn ${facetHidden(count)}`}
                aria-pressed={certs.has(kind)}
                aria-label={`${label}, ${agencyCount(count)}`}
                onClick={() => setCerts(toggle(certs, kind))}
              >
                <span aria-hidden="true">
                  ✓ {label} <span className="num">{count}</span>
                </span>
              </button>
            )
          })}
          {(Object.keys(tax.priceBands) as PriceBand[]).map((p) => {
            const count = priceCounts.get(p) ?? 0
            return (
              <button
                key={p}
                type="button"
                className={`chip chip-btn ${facetHidden(count)}`}
                aria-pressed={prices.has(p)}
                aria-label={`${priceLabel(p)}, ${agencyCount(count)}`}
                onClick={() => setPrices(toggle(prices, p))}
              >
                <span aria-hidden="true">
                  {priceLabel(p)} <span className="num">{count}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-on-surface-variant">
        {shown.length} of {items.length} agencies
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {shown.map((a) => (
          <AgencyCard key={a.slug} a={a} />
        ))}
      </div>
      {shown.length === 0 && (
        <div className="mt-6">
          <p className="text-on-surface-variant">No agencies match these filters yet.</p>
          {hasActiveFilters && (
            <button type="button" className="btn-ghost mt-3" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
