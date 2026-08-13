// G-CHECKERS-BATCH-1: free colour-converter magnet page under
// /checkers/color-converter/ — targets "rgb to hex" / "hex to rgb" search
// intent. Same template as the other two checkers: chisto client-side (all
// math reused from src/lib/contrast.ts, zero new formulas), prerendered, in
// both hardcoded lists (page-lists.test.mjs). Interactivity is in
// src/components/ColorConverter.tsx.

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ColorConverter } from '@/components/ColorConverter'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'

export default function ColorConverterPage() {
  const title = 'Colour converter — HEX, RGB and HSL, instantly'
  const description =
    'Free colour converter. Enter a colour in hex, rgb() or hsl() — or pick it with the colour picker — and get all three notations at once, with contrast ratios against black and white. No sign-up.'

  return (
    <Layout title={title} description={description} path={paths.colorConverter()}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Verscala colour converter',
          description,
          url: `${ORIGIN}${paths.colorConverter()}`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }}
      />

      <h1 className="h1 max-w-3xl">Colour converter</h1>
      <p className="lede max-w-3xl">
        Enter one colour — hex, <code className="font-mono text-sm">rgb()</code>,{' '}
        <code className="font-mono text-sm">hsl()</code>, or pick it with the native colour picker —
        and see it converted to all three notations at once, with a swatch and its contrast ratio
        against black and white. Free, instant, no sign-up.
      </p>

      <ColorConverter />

      <section className="mt-14 max-w-3xl">
        <h2 className="h2">HEX, RGB and HSL, in plain terms</h2>
        <p className="mt-2 text-on-surface-variant">
          These are three ways of writing the exact same colour — none is more &ldquo;correct&rdquo;
          than the others, but each is more convenient in different places.
        </p>
        <ul className="mt-4 space-y-3 text-on-surface-variant">
          <li>
            <strong className="text-on-surface">HEX</strong> (e.g. <span className="num">#4450b7</span>
            ) packs red, green and blue into six hexadecimal digits. The most common format in CSS,
            design tools and image editors.
          </li>
          <li>
            <strong className="text-on-surface">RGB</strong> (e.g.{' '}
            <span className="num">rgb(68, 80, 183)</span>) spells out red, green and blue as plain
            numbers from 0 to 255 — easier to read and to tweak one channel at a time than hex.
          </li>
          <li>
            <strong className="text-on-surface">HSL</strong> (e.g.{' '}
            <span className="num">hsl(233, 46%, 49%)</span>) describes hue, saturation and lightness
            instead — often the most intuitive for adjusting a colour (lighter, more muted, a
            different hue) without hunting through RGB numbers.
          </li>
        </ul>
      </section>

      <section className="mt-14 max-w-3xl">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">What this does — and doesn&rsquo;t.</strong> This is
            exact arithmetic between three common colour notations, computed the same way our own
            scanner does it. It doesn&rsquo;t account for colour profiles, monitor calibration or gamut
            — the same numbers can look slightly different from screen to screen. For whether a colour
            pair actually passes WCAG, use the{' '}
            <Link className="underline underline-offset-2" to={paths.contrastChecker()}>
              contrast checker
            </Link>{' '}
            above the fold on this section.
          </p>
        </div>
      </section>

      {/* МОСТ В ПРОДУКТ: сконвертировал цвет → а весь сайт? */}
      <section className="mt-14 max-w-3xl">
        <h2 className="h2">One colour is a start. Your whole site is more.</h2>
        <p className="mt-2 text-on-surface-variant">
          Getting a colour value right is one small step. Point our free scanner at a real URL and it
          checks the whole page against WCAG 2.2 — contrast included — and tells you what to fix
          first, with the legal context for the site&rsquo;s jurisdiction.
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
          Want the full pass/fail matrix for a colour pair?{' '}
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
    </Layout>
  )
}
