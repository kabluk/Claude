#!/usr/bin/env node
// Сборка каталога агентств доступности: валидация → дедуп → индексы →
// счётчики комбо-страниц (порог индексации) → route-манифест → отчёт
// полноты. Читает data/a11y/{agencies,taxonomies}.json, пишет в
// data/a11y/_generated/. Запуск: node scripts/build-a11y.mjs [--strict]
//
// Ничего не выдумывает: сообщает, каких данных не хватает, но не заполняет.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const A11Y = join(ROOT, 'data', 'a11y')
const OUT = join(A11Y, '_generated')

const SERVICES = ['audit', 'remediation', 'vpat', 'training', 'monitoring', 'consulting']
const STANDARDS = ['wcag-2-2', 'en-301-549', 'section-508', 'eaa', 'bitv', 'rgaa', 'ada']
const PRICE_BANDS = ['budget', 'mid', 'premium', 'enterprise']
const LOCALES = ['en', 'de', 'fr', 'pl', 'es']
// Должны совпадать с CertBadge/Declarant в data/a11y/types.ts.
const CERT_KINDS = [
  'iaap-org-member',
  'bitv-pruefstelle',
  'dhs-trusted-tester',
  'iaap-certified-staff',
  'statement-named-auditor',
]
const DECLARANTS = ['public-body', 'private', 'unknown']
const INDEX_THRESHOLD = 3 // списочная страница индексируется только при ≥3 листингах

const strict = process.argv.includes('--strict')
const read = (f) => JSON.parse(readFileSync(join(A11Y, f), 'utf8'))

const agencies = read('agencies.json')
const tax = read('taxonomies.json')
const COUNTRIES = Object.keys(tax.countries)

const errors = []
const warnings = []
const seenSlug = new Map()
const seenDomain = new Map()

function domainOf(website) {
  return String(website).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase()
}
const inEnum = (v, set) => set.includes(v)
const hostOf = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}
// «Регистрируемая» часть домена — грубо, последние две метки: достаточно, чтобы
// поймать отчёт на поддомене агентства (toegankelijkheidsrapport.swink.nl).
const registrable = (h) => h.split('.').slice(-2).join('.')

for (const [i, a] of agencies.entries()) {
  const at = `agencies[${i}] ${a.slug || a.name || '?'}`
  // обязательные поля
  for (const f of ['slug', 'name', 'website', 'hq', 'sourceRefs', 'lastVerified']) {
    if (a[f] == null || (Array.isArray(a[f]) && a[f].length === 0)) errors.push(`${at}: missing ${f}`)
  }
  if (a.slug && !/^[a-z0-9-]+$/.test(a.slug)) errors.push(`${at}: slug must be kebab-case`)
  // уникальность slug и домена (дедуп-ключ)
  if (a.slug) {
    if (seenSlug.has(a.slug)) errors.push(`${at}: duplicate slug (also ${seenSlug.get(a.slug)})`)
    else seenSlug.set(a.slug, at)
  }
  if (a.website) {
    const d = domainOf(a.website)
    if (seenDomain.has(d)) errors.push(`${at}: duplicate domain ${d} (also ${seenDomain.get(d)})`)
    else seenDomain.set(d, at)
  }
  // enum-валидация
  for (const s of a.services || []) if (!inEnum(s, SERVICES)) errors.push(`${at}: unknown service "${s}"`)
  for (const s of a.standards || []) if (!inEnum(s, STANDARDS)) errors.push(`${at}: unknown standard "${s}"`)
  if (a.priceBand && !inEnum(a.priceBand, PRICE_BANDS)) errors.push(`${at}: unknown priceBand "${a.priceBand}"`)
  if (a.hq && a.hq.countryCode && !/^[A-Z]{2}$/.test(a.hq.countryCode)) errors.push(`${at}: hq.countryCode must be ISO alpha-2`)
  for (const c of a.countriesServed || []) {
    if (!/^[A-Z]{2}$/.test(c) && !['remote-eu', 'remote-global'].includes(c)) errors.push(`${at}: bad countriesServed "${c}"`)
  }
  // полнота (не ошибка — отчёт для ручного обогащения)
  if (!a.hq?.city) warnings.push(`${at}: hq.city empty → excluded from city pages until verified`)
  if (!a.services?.length) warnings.push(`${at}: no services`)
  if (!a.standards?.length) warnings.push(`${at}: no standards`)
  if (!Object.keys(a.description || {}).length) warnings.push(`${at}: no description (any locale)`)
  if (!a.priceBand) warnings.push(`${at}: no priceBand`)
  if (!a.certs?.length) warnings.push(`${at}: no verified certs`)
  // Бейджи доверия валидируются жёстко (D-042): опечатка в `kind` раньше
  // проходила молча и превращалась в бейдж, которого нет в types.ts, а
  // доказательство на домене самого агентства — в самоаттестацию.
  for (const c of a.certs || []) {
    if (!inEnum(c.kind, CERT_KINDS)) errors.push(`${at}: unknown cert kind "${c.kind}"`)
    if (c.kind !== 'statement-named-auditor') continue
    if (!/^[A-Z]{2}$/.test(c.country || '')) errors.push(`${at}: cert.country must be ISO alpha-2`)
    if (!inEnum(c.declarant, DECLARANTS)) errors.push(`${at}: unknown cert declarant "${c.declarant}"`)
    const host = hostOf(c.evidenceUrl)
    if (!host) errors.push(`${at}: cert.evidenceUrl is not a URL`)
    else if (registrable(host) === registrable(domainOf(a.website))) {
      errors.push(`${at}: evidenceUrl is on the agency's own domain (${host}) — self-attestation`)
    }
  }
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} error(s):`)
  for (const e of errors) console.error('  - ' + e)
  process.exit(1)
}

// компактный индекс для клиентских фильтров (усечённые поля)
const index = agencies.map((a) => ({
  slug: a.slug,
  name: a.name,
  country: a.hq.countryCode,
  city: a.hq.city || null,
  served: a.countriesServed || [],
  languages: a.languages || [],
  services: a.services || [],
  standards: a.standards || [],
  industries: a.industries || [],
  priceBand: a.priceBand || null,
  certs: (a.certs || []).map((c) => c.kind),
  featured: !!(a.featured && a.featured.until >= '2026-08-04'),
}))

// счётчики комбо-страниц страна×услуга (порог индексации)
const combo = {}
for (const a of agencies) {
  const cs = new Set([a.hq.countryCode, ...(a.countriesServed || []).filter((c) => /^[A-Z]{2}$/.test(c))])
  for (const c of cs) for (const s of a.services || []) {
    const key = `${c}/${s}`
    combo[key] = (combo[key] || 0) + 1
  }
}
const countBy = (pick) => {
  const m = {}
  for (const a of agencies) for (const v of pick(a)) m[v] = (m[v] || 0) + 1
  return m
}
const byCountry = countBy((a) => new Set([a.hq.countryCode, ...(a.countriesServed || []).filter((c) => /^[A-Z]{2}$/.test(c))]))
const byService = countBy((a) => a.services || [])
const byStandard = countBy((a) => a.standards || [])

// route-манифест: что достойно индексации (≥ порога), что noindex
const routes = { agencies: [], lists: [] }
for (const a of agencies) routes.agencies.push(`/agencies/${a.slug}/`)
for (const c of COUNTRIES) if ((byCountry[c] || 0) >= 1) routes.lists.push({ path: `/${c.toLowerCase()}/`, count: byCountry[c] || 0, index: (byCountry[c] || 0) >= INDEX_THRESHOLD })
for (const [key, n] of Object.entries(combo)) {
  const [c, s] = key.split('/')
  routes.lists.push({ path: `/${c.toLowerCase()}/${s}/`, count: n, index: n >= INDEX_THRESHOLD })
}
for (const s of SERVICES) if (byService[s]) routes.lists.push({ path: `/services/${s}/`, count: byService[s], index: byService[s] >= INDEX_THRESHOLD })
for (const s of STANDARDS) if (byStandard[s]) routes.lists.push({ path: `/standards/${s}/`, count: byStandard[s], index: byStandard[s] >= INDEX_THRESHOLD })

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'agencies.index.json'), JSON.stringify(index))
writeFileSync(join(OUT, 'facets.json'), JSON.stringify({ byCountry, byService, byStandard, combo }, null, 2))
writeFileSync(join(OUT, 'routes.manifest.json'), JSON.stringify(routes, null, 2))

const indexable = routes.lists.filter((r) => r.index).length
const pending = routes.lists.length - indexable
console.log(`✓ build-a11y: ${agencies.length} agencies, ${routes.lists.length} list pages (${indexable} indexable @≥${INDEX_THRESHOLD}, ${pending} noindex/pending)`)
console.log(`  countries with data: ${Object.keys(byCountry).length} · outputs → data/a11y/_generated/`)
if (warnings.length) {
  const shown = strict ? warnings : warnings.slice(0, 8)
  console.log(`\n⚠ ${warnings.length} completeness note(s)${strict ? '' : ' (first 8; --strict for all)'}:`)
  for (const w of shown) console.log('  - ' + w)
}
