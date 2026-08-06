// Схема данных каталога агентств аудита цифровой доступности.
// Источник истины — data/a11y/agencies.json (редактируется руками/скриптами).
// Только публичные, проверяемые факты; каждая запись несёт sourceRefs
// (доказуемость) и lastVerified (дата проверки). Ничего не выдумывать:
// неизвестное поле остаётся пустым, а не заполняется догадкой.

// Локали каталога отличаются от detnav (en/es/ru): здесь спрос живёт
// в языках регуляторики — английский, немецкий (BFSG/BITV),
// французский (RGAA), польский, испанский.
export const A11Y_LOCALES = ['en', 'de', 'fr', 'pl', 'es'] as const
export type A11yLocale = (typeof A11Y_LOCALES)[number]

// Услуги — фильтр «что делает агентство».
export type ServiceSlug =
  | 'audit' // аудит соответствия
  | 'remediation' // исправление найденного
  | 'vpat' // VPAT / ACR (US-рынок)
  | 'training' // обучение команд
  | 'monitoring' // непрерывный мониторинг
  | 'consulting' // консалтинг/стратегия

// Стандарты — фильтр «по какой норме».
export type StandardSlug =
  | 'wcag-2-2'
  | 'en-301-549' // европейский гармонизированный стандарт
  | 'section-508' // US federal
  | 'eaa' // European Accessibility Act
  | 'bitv' // Германия
  | 'rgaa' // Франция
  | 'ada' // US

// Ценовой диапазон за типовой аудит (band, не точная цена — её не выдумываем).
export type PriceBand = 'budget' | 'mid' | 'premium' | 'enterprise'
// budget <€3k · mid €3–10k · premium €10–30k · enterprise >€30k

// Кто опубликовал декларацию, в которой названо агентство. Разделение введено
// D-042: прежнее имя вида ('gov-declared-auditor') обещало орган публичной
// власти, а перепроверка всех 96 доказательств показала, что 13 деклараций
// опубликованы частными организациями (Mazda, Proximus, ADAC Stiftung, Kelly…).
// 'unknown' — законный владелец сайта-декларанта не назван на самой странице;
// это честнее, чем догадка (правило проекта: пустое лучше выдуманного).
export type Declarant = 'public-body' | 'private' | 'unknown'

// Сертификация/аккредитация — то, что реально проверяемо по источнику.
export type CertBadge =
  | { kind: 'iaap-org-member' } // организационное членство в IAAP
  | { kind: 'bitv-pruefstelle' } // BIK BITV-Test прюфстелле (DE)
  | { kind: 'dhs-trusted-tester' } // US DHS Trusted Tester
  | { kind: 'iaap-certified-staff'; count: number } // CPACC/WAS/CPWA в штате
  | { kind: 'statement-named-auditor'; country: string; evidenceUrl: string; declarant: Declarant }
// последний вид — агентство названо аудитором в ОПУБЛИКОВАННОЙ декларации
// о доступности; evidenceUrl указывает на саму декларацию (или на запись
// декларации в государственном реестре), declarant — чья это декларация.
// Инвариант (D-042): evidenceUrl не может лежать на домене самого агентства —
// самоаттестация не доказывает «нас назвал кто-то другой»; для NL, где отчёт
// аудитора по традиции живёт у аудитора, доказательством служит запись
// заказчика в реестре toegankelijkheidsverklaring.nl, а отчёт — в sourceRefs.

export type HeadcountBand = '1' | '2-10' | '11-50' | '51-200' | '200+'

export interface Office {
  city: string
  countryCode: string // ISO-3166 alpha-2, uppercase
  lat?: number
  lng?: number
}

export interface SourceRef {
  url: string
  label: string // напр. «live SERP US 2026-08-04», «IAAP org members»
}

export interface Agency {
  slug: string // стабильный идентификатор, kebab-case, напр. 'access42'
  name: string
  website: string // канонический домен — ключ дедупликации
  founded?: number
  headcountBand?: HeadcountBand
  hq: Office
  offices: Office[] // может быть пустым, если известен только HQ
  countriesServed: string[] // ISO-коды; спец-значения 'remote-eu','remote-global'
  languages: string[] // BCP-47: 'de','fr','en'…
  services: ServiceSlug[]
  standards: StandardSlug[]
  industries: string[] // 'public-sector','ecommerce','banking','saas','healthcare'…
  priceBand?: PriceBand
  certs: CertBadge[]
  // Описание 40–80 слов на локаль; заполняется только там, где написано
  // руками/вычитано. Пустой объект — валидно (профиль ждёт обогащения).
  description: Partial<Record<A11yLocale, string>>
  featured?: { until: string } // ISO-дата окончания платного размещения
  claimed?: boolean // владелец подтвердил профиль
  sourceRefs: SourceRef[] // минимум один — иначе запись невалидна
  lastVerified: string // ISO-дата последней проверки
}

export interface Guide {
  slug: string
  locale: A11yLocale
  title: string
  standard?: StandardSlug
  countryCode?: string
  updated: string // ISO-дата
  body: string // markdown
  relatedAgencies?: string[] // slug-и для блока «топ-агентства»
}

// Таксономии (data/a11y/taxonomies.json) — подписи и метаданные для
// фильтров и генерации страниц. Ключи должны совпадать со slug-ами выше.
export interface Taxonomies {
  services: Record<ServiceSlug, LocalizedLabel>
  standards: Record<StandardSlug, StandardMeta>
  priceBands: Record<PriceBand, LocalizedLabel>
  industries: Record<string, LocalizedLabel>
  countries: Record<string, CountryMeta> // ключ — ISO alpha-2
}

export type LocalizedLabel = Partial<Record<A11yLocale, string>>

export interface StandardMeta extends Object {
  label: LocalizedLabel
  scope: 'global' | 'eu' | 'us' | 'de' | 'fr'
  about?: string // ссылка на первоисточник нормы
}

export interface CountryMeta {
  name: LocalizedLabel
  region: 'eu' | 'us' | 'uk' | 'other'
  // локальная имплементация EAA и дедлайн — двигатель спроса по стране
  law?: { name: string; slug: StandardSlug; inForce?: string }
  topCities?: string[]
}
