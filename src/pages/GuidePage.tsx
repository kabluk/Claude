import { Link, useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { AgencyCard } from '@/components/AgencyCard'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { guideBySlug } from '@/lib/guides'
import { agencyBySlug, countryByCode, paths, standardLabel } from '@/lib/data'
import { chromeDict, type ChromeLocale } from '@/lib/i18n'

export default function GuidePage() {
  const { slug } = useParams()
  const g = guideBySlug(slug!)
  if (!g) return null
  const related = g.relatedAgencies.map(agencyBySlug).filter((a) => a != null)
  const country = g.countryCode ? countryByCode(g.countryCode) : undefined
  const path = `/guides/${g.slug}/`

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: g.description,
    dateModified: g.updated,
    inLanguage: g.locale,
    mainEntityOfPage: `${ORIGIN}${path}`,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  }
  const faqLd =
    g.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: g.faq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null

  // G-I18N-CHROME (D-102): словарь есть на en/de/fr/pl — ровно на тех
  // локалях, на которых существует контент. `es` входит в A11Y_LOCALES
  // (data/a11y/types.ts), но гайдов на нём пока нет; сводим его к 'en' ЯВНО,
  // а не молчаливым fallback — когда испанский гайд появится, TypeScript
  // здесь ничего не подскажет, зато подскажет этот комментарий.
  // htmlLang — отдельно язык ДОКУМЕНТА (g.locale). Сейчас для de/fr/pl он
  // совпадает с chrome, но развязка сохраняется намеренно: для будущего
  // испанского гайда тело останется 'es', а chrome честно упадёт на 'en'.
  const chromeLocale: ChromeLocale = g.locale === 'es' ? 'en' : g.locale
  const t = chromeDict(chromeLocale)

  return (
    <Layout
      title={g.title}
      description={g.description}
      path={path}
      crumbs={[{ name: t.nav.knowledge, path: '/guides/' }]}
      locale={chromeLocale}
      htmlLang={g.locale}
    >
      <JsonLd data={articleLd} />
      {faqLd && <JsonLd data={faqLd} />}

      <article lang={g.locale}>
        <h1 className="h1 max-w-3xl">{g.title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {/* Одним выражением, а не «{label} {date}»: соседние текстовые узлы
              React SSR разделяет служебными <!-- --> — лишний мусор в разметке
              на ровном месте. */}
          {`${t.guide.updated} ${g.updated}`}
          {g.standard && (
            <>
              {' · '}
              <Link className="underline underline-offset-2" to={paths.standard(g.standard)}>
                {standardLabel(g.standard)}
              </Link>
            </>
          )}
          {country && (
            <>
              {' · '}
              <Link className="underline underline-offset-2" to={paths.country(country)}>
                {country.name}
              </Link>
            </>
          )}
        </p>
        <div
          className="prose-guide mt-6 max-w-3xl"
          dangerouslySetInnerHTML={{ __html: g.html }}
        />

        {g.faq.length > 0 && (
          <section className="mt-10 max-w-3xl">
            <h2 className="h2">{t.guide.faq}</h2>
            <dl className="space-y-5">
              {g.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-1 text-on-surface-variant">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </article>

      {g.cta && (
        <div className="mt-10 max-w-3xl rounded-xl border border-outline-variant bg-secondary-container p-6">
          <p className="font-semibold">{t.guide.ctaTitle}</p>
          <p className="mt-1 text-sm text-on-surface-variant">{t.guide.ctaSubtitle}</p>
          <Link className="btn mt-4" to={g.cta.path}>
            {g.cta.label}
          </Link>
        </div>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="h2">{t.guide.relatedAgencies}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((a) => (
              <AgencyCard key={a.slug} a={a} />
            ))}
          </div>
        </section>
      )}
    </Layout>
  )
}
