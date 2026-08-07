// Слой данных каталога: единственная точка, где страницы берут агентства,
// таксономии и производные (слаги стран, счётчики, порог индексации).
// Источник истины — data/a11y/*.json; здесь только чтение и выборки.

import agenciesJson from '@data/a11y/agencies.json'
import taxonomiesJson from '@data/a11y/taxonomies.json'
import type {
  Agency,
  CountryMeta,
  Declarant,
  ServiceSlug,
  StandardSlug,
  Taxonomies,
} from '@data/a11y/types'

export const agencies = agenciesJson as unknown as Agency[]
export const tax = taxonomiesJson as unknown as Taxonomies

// Порог индексации списочных страниц (см. scripts/build-a11y.mjs):
// меньше трёх листингов — noindex,follow до наполнения.
export const INDEX_THRESHOLD = 3

export const SERVICES = Object.keys(tax.services) as ServiceSlug[]
export const STANDARDS = Object.keys(tax.standards) as StandardSlug[]

// URL-сегменты услуг — ключевые слова, а не внутренние слаги.
export const SERVICE_SEG: Record<ServiceSlug, string> = {
  audit: 'accessibility-audit',
  remediation: 'accessibility-remediation',
  vpat: 'vpat',
  training: 'accessibility-training',
  monitoring: 'accessibility-monitoring',
  consulting: 'accessibility-consulting',
}
const SEG_SERVICE = new Map(
  (Object.entries(SERVICE_SEG) as [ServiceSlug, string][]).map(([k, v]) => [v, k]),
)
export const serviceFromSeg = (seg: string): ServiceSlug | undefined => SEG_SERVICE.get(seg)

export interface CountryInfo {
  code: string
  slug: string // '/germany/' ← из английского имени
  name: string
  meta: CountryMeta
  count: number
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Агентство «принадлежит» стране, если там HQ или страна в countriesServed.
export function agenciesIn(code: string): Agency[] {
  return sortListing(
    agencies.filter((a) => a.hq.countryCode === code || a.countriesServed.includes(code)),
  )
}

export const countries: CountryInfo[] = Object.entries(tax.countries)
  .map(([code, meta]) => ({
    code,
    slug: slugify(meta.name.en ?? code),
    name: meta.name.en ?? code,
    meta,
    count: agenciesIn(code).length,
  }))
  .filter((c) => c.count > 0)
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

const BY_COUNTRY_SLUG = new Map(countries.map((c) => [c.slug, c]))
export const countryBySlug = (slug: string) => BY_COUNTRY_SLUG.get(slug)
export const countryByCode = (code: string) => countries.find((c) => c.code === code)

export const agencyBySlug = (slug: string) => agencies.find((a) => a.slug === slug)

export function withService(list: Agency[], s: ServiceSlug): Agency[] {
  return sortListing(list.filter((a) => a.services.includes(s)))
}
export function withStandard(list: Agency[], s: StandardSlug): Agency[] {
  return sortListing(list.filter((a) => a.standards.includes(s)))
}

// Детерминированный порядок листинга: featured → больше подтверждённых
// сертификаций → есть описание → по имени. Стабильность между билдами
// важна для внутренних ссылок и снапшотов.
export function sortListing(list: Agency[]): Agency[] {
  return [...list].sort(
    (a, b) =>
      Number(isFeatured(b)) - Number(isFeatured(a)) ||
      b.certs.length - a.certs.length ||
      Object.keys(b.description).length - Object.keys(a.description).length ||
      a.name.localeCompare(b.name),
  )
}

// function-декларация (hoisted): вызывается из sortListing при вычислении
// top-level констант модуля выше по файлу.
export function isFeatured(a: Agency): boolean {
  return !!a.featured && a.featured.until >= new Date().toISOString().slice(0, 10)
}

// Агентства, названные внешним прюфером в ОПУБЛИКОВАННОЙ декларации о
// доступности (DE: «Erklärung zur Barrierefreiheit») конкретной страны.
// Отбор идёт по `cert.country`, а не по стране HQ: доказательство привязано к
// документу, а не к адресу агентства. Каждая запись несёт `evidenceUrl` — сам
// документ, поэтому утверждение проверяемо читателем, а не только нами.
export function namedInStatements(countryCode: string): Agency[] {
  return sortListing(
    agencies.filter((a) =>
      a.certs.some((c) => c.kind === 'statement-named-auditor' && c.country === countryCode),
    ),
  )
}

// Ссылки на сами декларации, в которых агентство названо (в этой стране),
// вместе с тем, чья это декларация. D-042: читателю важно отличить орган
// публичной власти от частной компании — раньше оба выглядели одинаково.
export function statementEvidence(
  a: Agency,
  countryCode: string,
): { url: string; declarant: Declarant }[] {
  // flatMap, а не filter().map(): filter не сужает тип элемента объединения,
  // и `evidenceUrl` был бы недоступен без каста.
  return a.certs.flatMap((c) =>
    c.kind === 'statement-named-auditor' && c.country === countryCode
      ? [{ url: c.evidenceUrl, declarant: c.declarant }]
      : [],
  )
}

// «Похожие агентства» на профиле: та же страна HQ + общая услуга.
export function relatedTo(a: Agency, n = 5): Agency[] {
  return sortListing(
    agencies.filter(
      (x) =>
        x.slug !== a.slug &&
        x.hq.countryCode === a.hq.countryCode &&
        x.services.some((s) => a.services.includes(s)),
    ),
  ).slice(0, n)
}

// Пути (везде с завершающим слэшем — так пишет SSG в dirStyle: nested).
export const paths = {
  home: () => '/',
  agencies: () => '/agencies/',
  agency: (slug: string) => `/agencies/${slug}/`,
  countries: () => '/countries/',
  country: (c: CountryInfo) => `/${c.slug}/`,
  combo: (c: CountryInfo, s: ServiceSlug) => `/${c.slug}/${SERVICE_SEG[s]}/`,
  services: () => '/services/',
  service: (s: ServiceSlug) => `/services/${SERVICE_SEG[s]}/`,
  standards: () => '/standards/',
  standard: (s: StandardSlug) => `/standards/${s}/`,
  about: () => '/about/',
  contact: () => '/contact/',
  privacy: () => '/privacy/',
  imprint: () => '/imprint/',
  accessibilityStatement: () => '/accessibility-statement/',
  scan: () => '/scan/',
  methodology: () => '/methodology/',
  // CN-WCAG-PAGES (D-066): справочник критериев из en301549-coverage.json.
  wcag: () => '/wcag/',
  wcagCriterion: (slug: string) => `/wcag/${slug}/`,
  // Немецкий входной путь (D-041). Статический сегмент — react-router ранжирует
  // его выше динамического '/:country', поэтому конфликта со страной нет.
  bfsgCheck: () => '/bfsg-check/',
  report: (id: string) => `/report/${id}/`,
  requestQuote: () => '/request-quote/',
}

export const serviceLabel = (s: ServiceSlug) => tax.services[s].en ?? s
export const standardLabel = (s: StandardSlug) => tax.standards[s].label.en ?? s
export const priceLabel = (p: NonNullable<Agency['priceBand']>) => tax.priceBands[p].en ?? p

// Подписи бейджей сертификаций (только проверяемые виды из types.ts).
// Принимает сам бейдж, а не его `kind`: подпись «названы в декларации»
// зависит ещё и от того, ЧЬЯ это декларация (D-042).
export function certLabel(cert: Agency['certs'][number]): string {
  const kind = cert.kind
  switch (kind) {
    case 'iaap-org-member':
      return 'IAAP organizational member'
    case 'bitv-pruefstelle':
      return 'BIK BITV-Test Prüfstelle'
    case 'dhs-trusted-tester':
      return 'DHS Trusted Tester'
    case 'iaap-certified-staff':
      return 'IAAP-certified staff'
    // D-042: перепроверены все 96 доказательств. Общий знаменатель — «названы
    // внешним прюфером в опубликованной декларации», но декларант у 13 записей
    // частный (mazda.de, proximus.be, stiftung.adac.de, shop.kelly.at…), и это
    // должно быть видно в подписи, а не растворяться в общей формулировке.
    // 'unknown' — владелец сайта-декларанта не назван на самой странице.
    case 'statement-named-auditor':
      return cert.declarant === 'public-body'
        ? 'Named auditor in a public-sector accessibility statement'
        : cert.declarant === 'private'
          ? 'Named auditor in a private organisation’s accessibility statement'
          : 'Named auditor in a published accessibility statement'
  }
}
