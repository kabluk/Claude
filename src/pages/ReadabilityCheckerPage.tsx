// G-TOOL-READABILITY: второй бесплатный чекер-магнит, тот же приём, что у
// /tools/contrast-checker/ (D-144): чисто клиентский расчёт (никакой
// себестоимости), но пререндерится (статический сегмент /tools/), поэтому в
// обоих захардкоженных списках (page-lists.test.mjs). Интерактив и его
// дисциплина гидрации — в src/components/ReadabilityChecker.tsx.
//
// ЧЕСТНОСТЬ ПРО СТАНДАРТ (важное отличие от контраст-чекера): читаемость —
// WCAG 2.2 SC 3.1.5 Reading Level, уровень AAA. Это НЕ часть базового AA,
// на который указывают EAA/EN 301 549 — и это сказано прямым текстом, а не
// растворено в общей формулировке (тот же приём честности, что на
// /bfsg-check/ и /tools/contrast-checker/: границы стандарта называются на
// самой странице). Формулы английские — тоже сказано явно.

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { OtherCheckers } from '@/components/OtherCheckers'
import { ReadabilityChecker } from '@/components/ReadabilityChecker'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'

const WCAG_315 = 'https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html'
const EN301549 = 'https://www.etsi.org/deliver/etsi_en/301500_301599/301549/'

export default function ReadabilityCheckerPage() {
  const title = 'Readability checker — Flesch, Fog, SMOG and more'
  const description =
    'Free, instant readability checker. Paste your text and see Flesch Reading Ease, Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau and ARI scores update live, in plain language. English text only, no sign-up.'

  return (
    <Layout title={title} description={description} path={paths.readabilityChecker()}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Verscala readability checker',
          description,
          url: `${ORIGIN}${paths.readabilityChecker()}`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }}
      />

      <h1 className="h1 max-w-3xl">Readability checker</h1>
      <p className="lede max-w-3xl">
        Paste your text and see six well-known readability formulas update live — plus a
        plain-language read on how easy the text is to follow, and roughly what US school grade it
        matches. Nothing is uploaded: the whole calculation runs in your browser. Free, instant,
        no sign-up.
      </p>

      <ReadabilityChecker />

      <section className="mt-14 max-w-3xl">
        <h2 className="h2">What the scores mean</h2>
        <p className="mt-2 text-on-surface-variant">
          All six formulas estimate how hard a piece of English text is to read, from sentence
          length and word length (mostly syllable count). They don&rsquo;t know what the words
          mean — a short, technically accurate sentence can still score as &ldquo;easy&rdquo; while
          being wrong, and a long, correct one can score as &ldquo;difficult&rdquo;. Use the scores
          as a signal about sentence and word length, not a verdict on quality.
        </p>
        <ul className="mt-4 space-y-3 text-on-surface-variant">
          <li>
            <strong className="text-on-surface">Flesch Reading Ease.</strong> A 0–100 scale where
            higher means easier to read; the most widely cited of the six, from Rudolf Flesch&rsquo;s
            original 1948 formula.
          </li>
          <li>
            <strong className="text-on-surface">Flesch–Kincaid Grade Level, Gunning Fog, SMOG,
            Coleman–Liau, and the Automated Readability Index (ARI).</strong> Five different ways
            of estimating the US school grade (or years of education) a reader needs to follow the
            text on a first read. They rarely agree exactly — each weighs sentence length, word
            length or syllables slightly differently — which is why we show all five side by side
            rather than picking one.
          </li>
        </ul>
      </section>

      {/* ЧЕСТНОСТЬ ПРО СТАНДАРТ: AAA, не AA — граница названа прямо, как на
          /tools/contrast-checker/ и /bfsg-check/. */}
      <section className="mt-14 max-w-3xl">
        <h2 className="h2">Where this sits in the law</h2>
        <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">
              Reading level is WCAG 2.2 Success Criterion 3.1.5 — Level AAA. It is good practice,
              not the legal minimum.
            </strong>{' '}
            The harmonised standard{' '}
            <a className="underline underline-offset-2" href={EN301549} rel="noopener noreferrer">
              EN 301 549
            </a>{' '}
            and the national laws transposing the European Accessibility Act generally require
            Level AA — the tier that our{' '}
            <Link className="underline underline-offset-2" to={paths.contrastChecker()}>
              contrast checker
            </Link>{' '}
            covers. Plain, simple writing is one of the few AAA criteria worth aiming for anyway
            (clearer text helps every reader, not just people covered by a specific law), but skip
            this page if you&rsquo;re checking a strict legal AA obligation — it doesn&rsquo;t
            apply there.{' '}
            <a className="underline underline-offset-2" href={WCAG_315} rel="noopener noreferrer">
              Understanding 3.1.5
            </a>
            .
          </p>
          <p className="mt-3">
            The formulas above are calibrated for <strong className="text-on-surface">English</strong>{' '}
            only — sentence and syllable patterns differ enough between languages that the same
            coefficients don&rsquo;t transfer. This is orientation, not legal advice, and we show
            no fine amounts.
          </p>
        </div>
      </section>

      {/* МОСТ В ПРОДУКТ: проверил текст → а весь сайт? */}
      <section className="mt-14 max-w-3xl">
        <h2 className="h2">Readable text is one piece. Your whole site is more.</h2>
        <p className="mt-2 text-on-surface-variant">
          Wording is one of dozens of things that shape whether a page actually works for people.
          Point our free scanner at a real URL and it checks the whole page against WCAG 2.2 — the
          Level AA criteria that laws actually require — and tells you what to fix first, with the
          legal context for the site&rsquo;s jurisdiction.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link className="btn" to={paths.scan()}>
            Scan a full page — free
          </Link>
          <Link className="underline underline-offset-2 text-sm" to={paths.agencies()}>
            Or find a specialist to fix it →
          </Link>
        </div>
        <p className="mt-4 text-sm text-on-surface-variant">
          Want to check colour contrast too?{' '}
          <Link className="underline underline-offset-2" to={paths.contrastChecker()}>
            Try the contrast checker
          </Link>
          , or see{' '}
          <Link className="underline underline-offset-2" to={paths.methodology()}>
            what our scanner covers
          </Link>
          , criterion by criterion.
        </p>
      </section>

      <OtherCheckers current={paths.readabilityChecker()} />
    </Layout>
  )
}
