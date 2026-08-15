// G-CHECKER-HTML-PARSER (D-183): /checkers/alt-text-checker/. Кандидат №3
// исследования рынка (D-179). Объём «alt text checker» скромный (110/мес,
// D-182), но это ядро WCAG 1.1.1 и первое, что называют в любой статье про
// a11y-аудит, а стоит дёшево — общий движок с heading-чекером.
//
// Строго клиентский: разбирает ВСТАВЛЕННЫЙ HTML через DOMParser (ввод URL
// невозможен из-за CORS — LEARNING_LOG 2026-08-15). Логика — htmlAudit.ts,
// извлечение — htmlExtract.ts, UI — HtmlAuditTool (общий с heading-чекером).

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { HtmlAuditTool } from '@/components/HtmlAuditTool'
import { OtherCheckers } from '@/components/OtherCheckers'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'

export default function AltTextCheckerPage() {
  const title = 'Alt text checker — find missing and poor image alt text'
  const description =
    'Paste your HTML and check every image for missing, empty, redundant or file-name alt text against WCAG 1.1.1. Free, instant, nothing uploaded — the parsing runs in your browser.'
  const path = paths.altTextChecker()

  return (
    <Layout title={title} description={description} path={path} crumbs={[{ name: 'Checkers', path: paths.checkers() }]}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Verscala alt text checker',
          description,
          url: `${ORIGIN}${path}`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }}
      />

      <h1 className="h1 max-w-3xl">Alt text checker</h1>
      <p className="lede max-w-3xl">
        Paste your page's HTML and see which images have missing, empty, redundant or file-name alt
        text — the four ways{' '}
        <Link className="underline underline-offset-2" to="/wcag/1-1-1/">
          WCAG 1.1.1
        </Link>{' '}
        most often gets broken. Nothing is uploaded; the parsing runs entirely in your browser.
      </p>

      <HtmlAuditTool mode="alt" />

      <section className="mt-12 max-w-3xl">
        <h2 className="h2">What this checks — and what it can't</h2>
        <p className="mt-2 text-on-surface-variant">
          This tool reads the markup you paste and flags the mechanical problems: an image with no{' '}
          <code>alt</code> attribute at all, an empty <code>alt=""</code> that might be hiding real
          content, alt text that's just the file name, or a redundant “image of…” prefix. What it{' '}
          <em>cannot</em> judge is whether a present, well-formed alt text actually{' '}
          <em>describes</em> the image well — that needs a human who can see it. A green result here
          means the alt text exists and is plausibly written, not that it's correct.
        </p>
        <div className="mt-4">
          <Link className="btn" to={paths.scan()}>
            Scan a whole live page — free
          </Link>
        </div>
        <p className="mt-4 text-sm text-on-surface-variant">
          Pasting one page's HTML is a spot check. A real site has this problem across templates and
          CMS content at once — our{' '}
          <Link className="underline underline-offset-2" to={paths.scan()}>
            free scanner
          </Link>{' '}
          crawls the live page for you, and if the fixes are bigger than one afternoon,{' '}
          <Link className="underline underline-offset-2" to={paths.agencies()}>
            these agencies
          </Link>{' '}
          do this for a living.
        </p>
      </section>

      <OtherCheckers current={path} />
    </Layout>
  )
}
