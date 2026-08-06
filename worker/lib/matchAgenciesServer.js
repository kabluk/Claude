// Server-side re-implementation of src/lib/matchAgencies.ts (+ the slice of
// src/lib/data.ts it depends on: agenciesIn/withService/withStandard/sortListing/
// isFeatured). Necessary because worker/ is a plain ESM Cloudflare Worker, not
// bundled by Vite — it cannot use the `@data/a11y/*` alias or import .ts files.
// Same filtering/ordering rules, INTERFACES.md §5 ("тот же алгоритм переиспользует
// POST /api/lead"). Kept in sync by hand; if src/lib/matchAgencies.ts changes,
// mirror the change here too.
//
// Pure functions take agencies/taxonomies as parameters (default: the real
// catalog) so tests can inject fixtures instead of depending on the live,
// changing dataset — same style as worker/lib/retention.js (db injected).

import agenciesJson from '../../data/a11y/agencies.json' with { type: 'json' }
import taxonomiesJson from '../../data/a11y/taxonomies.json' with { type: 'json' }

export const agencies = agenciesJson
export const taxonomies = taxonomiesJson

export function isFeatured(agency, today = new Date().toISOString().slice(0, 10)) {
  return !!agency.featured && agency.featured.until >= today
}

// Тот же порядок, что sortListing в src/lib/data.ts: featured -> больше
// сертификаций -> есть описание -> по имени.
export function sortListing(list) {
  return [...list].sort(
    (a, b) =>
      Number(isFeatured(b)) - Number(isFeatured(a)) ||
      b.certs.length - a.certs.length ||
      Object.keys(b.description).length - Object.keys(a.description).length ||
      a.name.localeCompare(b.name),
  )
}

export function agenciesIn(pool, code) {
  return sortListing(pool.filter((a) => a.hq.countryCode === code || a.countriesServed.includes(code)))
}

export function withService(list, service) {
  return sortListing(list.filter((a) => a.services.includes(service)))
}

export function withStandard(list, standard) {
  return sortListing(list.filter((a) => a.standards.includes(standard)))
}

// Стандарт выводим из страны через taxonomies.countries[code].law.slug — та же
// связь, что matchAgencies.ts::standardForCountry.
export function standardForCountry(tax, countryCode) {
  return tax.countries?.[countryCode]?.law?.slug
}

// criteria: { countryCode?, service, priceBand? } — см. MatchCriteria в
// matchAgencies.ts. Возвращает массив Agency (не только slug) — вызывающий код
// решает, что из этого взять (POST /api/lead берёт .slug для matched[]).
export function matchAgencies(criteria, limit = 5, pool = agencies, tax = taxonomies) {
  let result = criteria.countryCode ? agenciesIn(pool, criteria.countryCode) : pool

  result = withService(result, criteria.service)

  // Стандарт сужает пул, только если после сужения кто-то остался — иначе
  // честнее показать агентства по стране+услуге без указания стандарта, чем
  // 0 результатов (см. matchAgencies.ts).
  const standard = criteria.countryCode ? standardForCountry(tax, criteria.countryCode) : undefined
  if (standard) {
    const narrowed = withStandard(result, standard)
    if (narrowed.length > 0) result = narrowed
  }

  // Бюджет — мягкий приоритет (тай-брейкер), не жёсткий фильтр; sort стабилен.
  if (criteria.priceBand) {
    result = [...result].sort(
      (a, b) => Number(b.priceBand === criteria.priceBand) - Number(a.priceBand === criteria.priceBand),
    )
  }

  return result.slice(0, limit)
}
