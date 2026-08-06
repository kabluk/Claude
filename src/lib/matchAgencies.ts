// Подбор агентств под отчёт сканера (INTERFACES.md §5, VISION.md UX-требование 5).
// Переиспользует sortListing (featured → сертификации → полнота профиля → имя,
// data.ts) — тот же приоритет, что и в обычных списках каталога, не изобретаем
// новый порядок специально для этого блока.

import { agenciesIn, agencies, countryByCode, withService, withStandard } from './data'
import type { Agency, PriceBand, ServiceSlug, StandardSlug } from '@data/a11y/types'

export type MatchCriteria = {
  countryCode?: string // ISO alpha-2, из выбора пользователя — не гадаем по IP/домену
  service: ServiceSlug
  priceBand?: PriceBand // мягкий тай-брейкер, не жёсткий фильтр (см. ниже почему)
}

// Стандарт выводим из страны через taxonomies.countries[code].law.slug — та же
// связь, что использует scripts/gen-a11y-sitemap.mjs для комбо-страниц.
export function standardForCountry(countryCode: string): StandardSlug | undefined {
  const country = countryByCode(countryCode)
  const slug = country?.meta.law?.slug
  return slug as StandardSlug | undefined
}

export function matchAgencies(criteria: MatchCriteria, limit = 5): Agency[] {
  let pool = criteria.countryCode ? agenciesIn(criteria.countryCode) : agencies

  pool = withService(pool, criteria.service)

  // Стандарт сужает пул, только если после сужения кто-то остался — иначе
  // честнее показать агентства по стране+услуге без указания стандарта, чем
  // 0 результатов (у многих профилей standards[] ещё не заполнен).
  const standard = criteria.countryCode ? standardForCountry(criteria.countryCode) : undefined
  if (standard) {
    const narrowed = withStandard(pool, standard)
    if (narrowed.length > 0) pool = narrowed
  }

  // Бюджет — мягкий приоритет, не фильтр: priceBand заполнен всего у горстки
  // профилей (см. RISKS.md/STATUS.md), жёсткая фильтрация по нему почти всегда
  // давала бы пустой список. Точное совпадение просто поднимается наверх;
  // sort стабилен (спецификация ES2019+), порядок внутри групп не ломается.
  if (criteria.priceBand) {
    pool = [...pool].sort((a, b) => Number(b.priceBand === criteria.priceBand) - Number(a.priceBand === criteria.priceBand))
  }

  return pool.slice(0, limit)
}
