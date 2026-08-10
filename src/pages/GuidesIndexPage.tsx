import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { guides } from '@/lib/guides'
import { countryByCode, standardLabel } from '@/lib/data'

const LOCALE_NAME: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  pl: 'Polski',
  es: 'Español',
}

// Гайды сгруппированы по языку (просьба владельца): немецкий читатель хочет
// немецкие материалы вместе, а не вперемешку с 16 английскими — с ростом
// раздела плоский список стал бы только хуже. Порядок предпочтения; локали не
// из списка (будущие) дописываются в конец, чтобы гайд не пропал молча.
const LOCALE_ORDER = ['en', 'de', 'fr', 'pl', 'es']

function guidesByLocale() {
  const present = [...new Set(guides.map((g) => g.locale as string))]
  const ordered = [
    ...LOCALE_ORDER.filter((l) => present.includes(l)),
    ...present.filter((l) => !LOCALE_ORDER.includes(l)),
  ]
  // guides уже отсортирован по title (src/lib/guides.ts) — внутри языка порядок
  // сохраняется, отдельная сортировка не нужна.
  return ordered.map((locale) => ({ locale, items: guides.filter((g) => g.locale === locale) }))
}

export default function GuidesIndexPage() {
  return (
    <Layout
      title="Accessibility compliance guides: BFSG, EAA, Section 508, VPAT, RGAA"
      description="Practical guides to digital-accessibility law and audits — the European Accessibility Act, BFSG, Section 508, ADA, VPAT/ACR, RGAA and WCAG — with verified sources."
      path="/guides/"
      crumbs={[]}
    >
      {/* CN-NAV (D-062 §6): IA-ярлык раздела — «Knowledge»; сами материалы
          по-прежнему называются guides (тип контента, не пункт навигации). */}
      <h1 className="h1">Knowledge</h1>
      <p className="lede">
        Practical, source-linked guides to accessibility law and audits. Each one ends where it
        should: with verified providers who do this work.
      </p>
      {guidesByLocale().map(({ locale, items }) => (
        <section key={locale} className="mt-8">
          {/* Заголовок секции — название языка НА этом языке, с lang для
              скринридера (Deutsch/Français и т.д.). Уровень h2 (h1 Knowledge →
              h2 язык → h3 карточка) — карточки понижены до h3, иначе heading-order
              (axe) краснеет. Чип языка на карточке убран — секция уже сообщает язык. */}
          <h2 className="h2" lang={locale}>
            {LOCALE_NAME[locale] ?? locale}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {items.map((g) => {
              const country = g.countryCode ? countryByCode(g.countryCode) : undefined
              return (
                <Link key={g.slug} to={`/guides/${g.slug}/`} className="card">
                  <h3 className="font-semibold" lang={g.locale}>
                    {g.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant" lang={g.locale}>
                    {g.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.standard && <span className="chip">{standardLabel(g.standard)}</span>}
                    {country && <span className="chip">{country.name}</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
      {guides.length === 0 && <p className="mt-6 text-on-surface-variant">Guides are being written.</p>}
      {/* CN-WCAG-PAGES (D-066) / CN-COMPONENTS (D-068): справочники — часть
          Knowledge-раздела. */}
      <section className="mt-10">
        <h2 className="h2">Reference</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          <Link className="underline underline-offset-2" to="/wcag/">
            WCAG success criteria: what automation can check
          </Link>{' '}
          — per-criterion pages naming the exact axe-core rules and browser checks our scanner runs,
          and what still needs a human auditor.
        </p>
        <p className="mt-2 max-w-prose text-sm text-on-surface-variant">
          <Link className="underline underline-offset-2" to="/components/">
            Accessible component library
          </Link>{' '}
          — real, keyboard-accessible UI patterns with their keyboard map, screen-reader behaviour,
          ARIA notes, copyable source, and the pitfalls that most often break them.
        </p>
      </section>
    </Layout>
  )
}
