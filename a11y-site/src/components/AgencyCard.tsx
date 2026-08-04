import { Link } from 'react-router-dom'
import type { Agency } from '@data/a11y/types'
import { certLabel, countryByCode, isFeatured, paths, serviceLabel, standardLabel, priceLabel } from '@dir/lib/data'

export function AgencyCard({ a }: { a: Agency }) {
  const c = countryByCode(a.hq.countryCode)
  const place = [a.hq.city, c?.name ?? a.hq.countryCode].filter(Boolean).join(', ')
  return (
    <Link
      to={paths.agency(a.slug)}
      className={`card ${isFeatured(a) ? 'ring-2 ring-[color:var(--color-accent)]' : ''}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold">{a.name}</h3>
        <span className="shrink-0 text-xs text-slate-500">{place}</span>
      </div>
      {a.description.en && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.description.en}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {a.certs.map((cert) => (
          <span key={cert.kind} className="chip chip-accent">
            ✓ {certLabel(cert.kind)}
          </span>
        ))}
        {a.services.slice(0, 4).map((s) => (
          <span key={s} className="chip">
            {serviceLabel(s)}
          </span>
        ))}
        {a.standards.slice(0, 3).map((s) => (
          <span key={s} className="chip">
            {standardLabel(s)}
          </span>
        ))}
        {a.priceBand && <span className="chip">{priceLabel(a.priceBand)}</span>}
      </div>
    </Link>
  )
}
