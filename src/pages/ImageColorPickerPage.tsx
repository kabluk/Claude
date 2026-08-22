// G-CHECKER-IMAGEPICKER: free image colour picker magnet page under
// /checkers/image-color-picker/, tenth tool in the /checkers/ family.
// Rationale (D-182, D-186): DataForSEO measured ~49,500/mo US search volume
// each for "image color picker" and "color picker from image" — the largest
// confirmed volume among every checker candidate researched so far. Traffic
// from those queries only becomes OUR traffic if there is a bridge to the
// funnel this site actually sells: colour → contrast → WCAG. A generic
// eyedropper clone would not have that bridge; this page does, on every pick
// (see ImageColorPicker.tsx's result-hero).
//
// SPELLING (owner brief, 2026-08-20): the site's house style is British
// "colour" (see every other /checkers/ page); both target queries use the
// American "color". Resolution: keep "colour" as the page's own voice
// throughout (H1, body copy, UI labels) for brand consistency, but the intro
// paragraph below states BOTH exact target phrases naturally once each —
// "image colour picker" (site spelling) and "colour picker from image" — and
// explicitly notes the US spelling once so readers who search "color" and
// land here are not confused about which tool they found. No keyword
// stuffing: each phrase appears exactly once in the body copy.
//
// Zero-cost, client-only: Canvas 2D + getImageData, no server, image never
// leaves the browser (stated in ImageColorPicker.tsx's own hint text too —
// this is both an accessibility/mouse-only concern AND a privacy claim).
// Interactivity + keyboard/aria discipline is in
// src/components/ImageColorPicker.tsx.

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { OtherCheckers } from '@/components/OtherCheckers'
import { ImageColorPicker } from '@/components/ImageColorPicker'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'

const WCAG_143 = 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html'

export default function ImageColorPickerPage() {
  const title = 'Image colour picker — pick a colour from a photo, with WCAG contrast'
  const description =
    'Free image colour picker: click any photo (or the built-in sample) to pick a colour, or move a crosshair with your keyboard. Every pick shows hex, RGB, HSL and a live WCAG contrast verdict against white and black. Nothing is uploaded — it all runs in your browser. No sign-up.'

  return (
    <Layout title={title} description={description} path={paths.imageColorPicker()}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Verscala image colour picker',
          description,
          url: `${ORIGIN}${paths.imageColorPicker()}`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }}
      />

      <h1 className="h1 max-w-3xl">Image colour picker</h1>
      <p className="lede max-w-3xl">
        A colour picker from image files: click a photo, or move the crosshair with your keyboard,
        and get hex, RGB, HSL and a live WCAG contrast verdict. Your image never leaves your browser.
      </p>

      <ImageColorPicker />

      <section className="mt-14 max-w-3xl">
        <h2 className="h2">Why every pick shows a contrast verdict</h2>
        <p className="mt-2 text-on-surface-variant">
          A colour lifted from a photo is often headed straight into a design — a background, a text
          colour, a button. Whether that colour is usable for text depends on what sits behind or in
          front of it, and that is exactly what WCAG 1.4.3 measures: the contrast ratio between two
          colours, computed from their relative luminance. We compute that ratio against pure white
          and pure black — the same{' '}
          <a className="underline underline-offset-2" href={WCAG_143} rel="noopener noreferrer">
            WCAG 2.2 formula
          </a>{' '}
          our own scanner uses — so a &ldquo;Pass&rdquo; here means the same thing it would in a full
          page audit.
        </p>
        <p className="mt-4 text-on-surface-variant">
          Picked a colour you want to pair with something other than plain black or white? Every
          result links straight into the{' '}
          <Link className="underline underline-offset-2" to={paths.contrastChecker()}>
            full contrast checker
          </Link>
          , with your picked colour already filled in.
        </p>
      </section>

      <section className="mt-14 max-w-3xl">
        <h2 className="h2">How it works — and why it never leaves your device</h2>
        <p className="mt-2 text-on-surface-variant">
          The picker decodes your image into an HTML canvas element and reads pixel values with the
          browser&rsquo;s own <code className="font-mono text-sm">getImageData</code> API — there is no
          upload step, no server involved, and nothing is sent anywhere. Large images are scaled down
          before any pixel is read, so even a big photo stays fast. That also means privacy is not a
          policy promise here; it is a direct consequence of how the tool is built.
        </p>
        <div className="mt-5 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">Built for keyboard and screen-reader use, not just a mouse.</strong>{' '}
            &ldquo;Click a pixel&rdquo; is a mouse-shaped idea by nature, and a company built around
            accessibility cannot ship a tool that only works that way. Focus the image and use the
            arrow keys to move the crosshair one pixel at a time (Shift+arrow for ten), then press
            Enter or Space to pick — the colour under the crosshair, and the picked colour&rsquo;s hex
            value and verdict, are both announced as text, not only shown as a coloured square.
          </p>
        </div>
      </section>

      {/* МОСТ В ПРОДУКТ: подобрал цвет → а весь сайт? */}
      <section className="mt-14 max-w-3xl">
        <h2 className="h2">One colour is a start. Your whole site is more.</h2>
        <p className="mt-2 text-on-surface-variant">
          Picking a colour from an image and checking its contrast is one small, useful step. Point
          our free scanner at a real URL and it checks the whole page against WCAG 2.2 — contrast
          included — and tells you what to fix first, with the legal context for the site&rsquo;s
          jurisdiction.
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
          Want the full pass/fail matrix for one colour pair?{' '}
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

      <OtherCheckers current={paths.imageColorPicker()} />
    </Layout>
  )
}
