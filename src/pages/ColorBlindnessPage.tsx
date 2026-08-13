// G-CHECKERS-BATCH-1: free colour-blindness-simulator magnet page under
// /checkers/color-blindness-simulator/, third tool in the /checkers/ family
// (contrast checker D-144, readability checker). Same template: chisto
// client-side (canvas math, zero server cost) but prerendered, so it lives in
// both hardcoded lists (page-lists.test.mjs). Interactivity + its hydration
// discipline is in src/components/ColorBlindnessSimulator.tsx.
//
// HONESTY (same discipline as the other two checkers): the simulation is an
// APPROXIMATION (Wickline/HCIRN model, cited in src/lib/cvd.ts) — stated on
// the page itself, not just in code comments.

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ColorBlindnessSimulator } from '@/components/ColorBlindnessSimulator'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'

const WCAG_141 = 'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html'

export default function ColorBlindnessPage() {
  const title = 'Colour blindness simulator — protanopia, deuteranopia, tritanopia'
  const description =
    'Free colour blindness simulator. Upload an image, or use the built-in sample, and see it approximated for protanopia, deuteranopia and tritanopia side by side with the original. Runs entirely in your browser — nothing is uploaded. No sign-up.'

  return (
    <Layout title={title} description={description} path={paths.colorBlindnessSimulator()}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Verscala colour blindness simulator',
          description,
          url: `${ORIGIN}${paths.colorBlindnessSimulator()}`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }}
      />

      <h1 className="h1 max-w-3xl">Colour blindness simulator</h1>
      <p className="lede max-w-3xl">
        Upload an image — or load the built-in sample — and see it approximated for the three main
        types of colour blindness, side by side with the original. Everything runs in your browser:
        nothing you upload ever leaves your device. Free, instant, no sign-up.
      </p>

      <ColorBlindnessSimulator />

      <section className="mt-14 max-w-3xl">
        <h2 className="h2">What the three types mean</h2>
        <p className="mt-2 text-on-surface-variant">
          Colour blindness (more precisely, colour vision deficiency) usually means one of the
          eye&rsquo;s three cone types responds weakly or not at all, so certain colour pairs become
          hard to tell apart. Roughly 1 in 12 men and 1 in 200 women worldwide have some form of it —
          almost always red-green.
        </p>
        <ul className="mt-4 space-y-3 text-on-surface-variant">
          <li>
            <strong className="text-on-surface">Protanopia — red-blind.</strong> The long-wavelength
            (red) cone is missing or non-functional; reds appear darker and can be confused with
            greens or browns.
          </li>
          <li>
            <strong className="text-on-surface">Deuteranopia — green-blind.</strong> The
            medium-wavelength (green) cone is affected; this is the most common form and shares many
            of the same red/green confusions as protanopia.
          </li>
          <li>
            <strong className="text-on-surface">Tritanopia — blue-blind.</strong> The
            short-wavelength (blue) cone is affected; much rarer, it confuses blue with green and
            yellow with violet.
          </li>
        </ul>
      </section>

      <section className="mt-14 max-w-3xl">
        <h2 className="h2">How this works</h2>
        <p className="mt-2 text-on-surface-variant">
          Each simulation multiplies every pixel&rsquo;s red, green and blue values by a fixed 3×3
          matrix — the widely used Wickline/HCIRN &ldquo;Color Blind Web Page Filter&rdquo; set — and
          redraws the result on a canvas. Nothing is uploaded anywhere: the file never leaves your
          device, the image is decoded and processed by your own browser, and it is discarded the
          moment you close or reload the page.
        </p>
      </section>

      {/* ЧЕСТНОСТЬ ПРО МЕТОД: приближение, не медицинский/точный рендеринг —
          та же дисциплина, что «AAA, не AA» на readability и «no fine amounts»
          на contrast/bfsg-check. */}
      <section className="mt-14 max-w-3xl">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">What this is — and isn&rsquo;t.</strong> This
            simulation approximates common types of dichromacy using a well-known mathematical model.
            It is a design aid, useful for spotting colour pairs that might cause trouble — it is{' '}
            <strong className="text-on-surface">not</strong> a medically accurate rendering of any
            individual&rsquo;s vision, and it doesn&rsquo;t cover anomalous trichromacy (partial colour
            weakness, more common than total colour blindness) or achromatopsia (total colour
            blindness). Use it alongside, not instead of, the WCAG rule it supports:{' '}
            <a className="underline underline-offset-2" href={WCAG_141} rel="noopener noreferrer">
              1.4.1 Use of Colour
            </a>{' '}
            — never make colour the only way to convey information.
          </p>
        </div>
      </section>

      {/* МОСТ В ПРОДУКТ: проверил изображение → а весь сайт? */}
      <section className="mt-14 max-w-3xl">
        <h2 className="h2">One image is a start. Your whole site is more.</h2>
        <p className="mt-2 text-on-surface-variant">
          Colour is one of dozens of things a page can get wrong for people with low vision or colour
          blindness. Point our free scanner at a real URL and it checks the whole page against WCAG
          2.2 — including colour contrast — and tells you what to fix first, with the legal context
          for the site&rsquo;s jurisdiction.
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
          Also want to check colour contrast directly?{' '}
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
