// Блок «подходящие агентства» под отчётом сканера (A1-MATCH, INTERFACES.md §5,
// VISION.md UX-требование 5). Страна — явный выбор пользователя (без гадания
// по IP/домену, см. matchAgencies.ts), услуга и бюджет выводятся из отчёта.
//
// D-143: перерисован из сетки крупных `AgencyCard` в компактный список строк
// («аватар-буква + имя + услуги + стрелка»), потому что теперь это ЛЕВАЯ
// панель нижней конверсионной пары на /report/:id, а не полноширинная секция.
// Данные те же и настоящие: `matchAgencies` по реальному `agencies.json`,
// ссылки ведут на реальные профили. Карточка каталога `AgencyCard` осталась
// нетронутой — её используют страницы списков.

import { useMemo, useState } from 'react'
import type { ScanFinding } from '@/lib/scanner'
import type { Agency, PriceBand, ServiceSlug } from '@data/a11y/types'
import { matchAgencies } from '@/lib/matchAgencies'
import { countries, countryByCode, paths, serviceLabel } from '@/lib/data'
import { Link } from 'react-router-dom'

const MATCH_LIMIT = 3
// Сколько услуг помещается в строку под именем, не превращая её в простыню.
const SERVICES_SHOWN = 2

function MatchRow({ a }: { a: Agency }) {
  const country = countryByCode(a.hq.countryCode)
  // Вторая строка — только реальные поля профиля: где сидит агентство и что
  // делает. Ничего не додумывается: нет города — строка просто короче.
  const meta = [
    [a.hq.city, country?.name ?? a.hq.countryCode].filter(Boolean).join(', '),
    ...a.services.slice(0, SERVICES_SHOWN).map(serviceLabel),
  ].join(' · ')

  return (
    <li>
      <Link
        to={paths.agency(a.slug)}
        className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 transition hover:border-outline"
      >
        {/* Аватар-буква — декорация (имя агентства стоит рядом текстом). */}
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-sm font-semibold text-on-secondary-container"
        >
          {a.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-on-surface">{a.name}</span>
          <span className="block truncate text-xs text-on-surface-variant">{meta}</span>
        </span>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-on-surface-variant"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M6 3.5 10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </li>
  )
}

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
    <section className="flex h-full flex-col rounded-2xl border border-outline-variant bg-surface-container-low p-5 sm:p-6">
      <h2 className="h2 mt-0 mb-0">Need help fixing this?</h2>
      <p className="mt-2 text-sm text-on-surface-variant">
        Real agencies from our catalog that work on {service === 'remediation' ? 'remediation' : 'audits'} — each
        profile is checked against published sources.
      </p>

      <label className="mt-4 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
        Country
        <select
          className="input px-2 py-1 text-sm"
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

      {matches.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {matches.map((a) => (
            <MatchRow key={a.slug} a={a} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-on-surface-variant">
          No agencies matched this filter yet — try a different country.
        </p>
      )}

      <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-5 text-sm">
        <Link className="underline underline-offset-2" to={paths.agencies()}>
          View all agencies →
        </Link>
        <Link
          className="underline underline-offset-2"
          to={scanId ? `${paths.requestQuote()}?scanId=${encodeURIComponent(scanId)}` : paths.requestQuote()}
        >
          Request a quote →
        </Link>
      </p>
    </section>
  )
}
