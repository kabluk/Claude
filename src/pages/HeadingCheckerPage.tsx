// G-CHECKER-HTML-PARSER (D-183): /checkers/heading-structure-checker/.
// Кандидат №4 исследования рынка (D-179). Даёт двойной поисковый кластер:
// a11y (heading structure, WCAG 1.3.1 / 2.4.6) И SEO («h1 tag checker»,
// «heading hierarchy»), то есть трафик шире, чем чистая a11y-ниша.
//
// Строго клиентский, тот же движок, что alt-text-checker (HtmlAuditTool с
// mode="headings"). Разбор вставленного HTML через DOMParser.

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { HtmlAuditTool } from '@/components/HtmlAuditTool'
import { OtherCheckers } from '@/components/OtherCheckers'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'

export default function HeadingCheckerPage() {
  const title = 'Heading structure checker — h1–h6 hierarchy and outline'
  const description =
    'Paste your HTML and check the heading hierarchy: missing or multiple h1, skipped levels, empty headings, plus a visual outline. Free, instant, nothing uploaded.'
  const path = paths.headingChecker()

  return (
    <Layout title={title} description={description} path={path} crumbs={[{ name: 'Checkers', path: paths.checkers() }]}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Verscala heading structure checker',
          description,
          url: `${ORIGIN}${path}`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }}
      />

      <h1 className="h1 max-w-3xl">Heading structure checker</h1>
      <p className="lede max-w-3xl">
        Paste your page's HTML to see its heading outline and the structural problems screen-reader
        users trip over — no h1, several h1s, a skipped level, or an empty heading. Nothing is
        uploaded; the parsing runs entirely in your browser.
      </p>

      <HtmlAuditTool mode="headings" />

      <section className="mt-12 max-w-3xl">
        <h2 className="h2">Why heading order matters</h2>
        <p className="mt-2 text-on-surface-variant">
          Screen-reader users navigate a page by its headings the way sighted users skim it with
          their eyes — jumping heading to heading to find the part they want. When levels are
          skipped (an h2 followed straight by an h4) or the page has no h1, that mental map breaks:
          a gap reads as a missing section. Good heading structure is also one of the oldest SEO
          signals, so this is one of the few accessibility fixes that helps two audiences at once.
        </p>
        <p className="mt-4 text-sm text-on-surface-variant">
          This checks the levels and their order, not whether each heading's wording is a good
          description — that still takes a human. For a whole live page instead of one pasted
          snippet, use our{' '}
          <Link className="underline underline-offset-2" to={paths.scan()}>
            free scanner
          </Link>
          , or{' '}
          <Link className="underline underline-offset-2" to={paths.altTextChecker()}>
            check the images' alt text
          </Link>{' '}
          while you're here.
        </p>
      </section>

      <OtherCheckers current={path} />
    </Layout>
  )
}
