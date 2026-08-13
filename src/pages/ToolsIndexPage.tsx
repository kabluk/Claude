// G-TOOL-READABILITY / G-CHECKERS-BATCH-1 / G-CHECKER-PALETTE: index of the
// free tool-magnet pages — contrast checker, readability checker, colour
// blindness simulator, colour converter, text-to-speech reader, colour
// palette generator. Future tools get a card here the same way. Same card
// pattern as ReportsIndexPage.tsx, own Meta via Layout.

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, itemListLd } from '@/lib/seo'
import { paths } from '@/lib/data'

const TOOLS = [
  {
    href: paths.contrastChecker(),
    title: 'Colour contrast checker',
    dek: 'Enter two colours and get a live WCAG 2.2 AA/AAA pass or fail for normal text, large text and UI — hex, RGB or HSL.',
  },
  {
    href: paths.readabilityChecker(),
    title: 'Readability checker',
    dek: 'Paste your text and see six readability formulas — Flesch, Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau and ARI — update live, in plain language.',
  },
  {
    href: paths.colorBlindnessSimulator(),
    title: 'Colour blindness simulator',
    dek: 'Upload an image, or use the built-in sample, and see it approximated for protanopia, deuteranopia and tritanopia side by side.',
  },
  {
    href: paths.colorConverter(),
    title: 'Colour converter',
    dek: 'Enter a colour in hex, rgb() or hsl() and get all three notations at once, with contrast ratios against black and white.',
  },
  {
    href: paths.textToSpeech(),
    title: 'Text-to-speech reader',
    dek: 'Paste text and hear it read aloud with your browser’s own voices — adjustable rate and pitch, nothing sent anywhere.',
  },
  {
    href: paths.colorPaletteGenerator(),
    title: 'Colour palette generator',
    dek: 'Generate complementary, triadic and other harmonious palettes — every swatch shows its readable text colour, WCAG contrast ratio and AA pass/fail.',
  },
]

export default function ToolsIndexPage() {
  const title = 'Free accessibility checkers'
  const description =
    'Free, instant accessibility tools — no sign-up, nothing uploaded. Check colour contrast against WCAG 2.2, or how readable your text is.'

  return (
    <Layout title={title} description={description} path={paths.checkers()} crumbs={[]}>
      <JsonLd data={itemListLd(TOOLS.map((t) => t.href))} />
      <h1 className="h1">Free accessibility checkers</h1>
      <p className="lede max-w-3xl">
        Small, focused checks you can run right now — free, instant, and nothing you enter is
        uploaded anywhere. Each one covers a single WCAG criterion in depth; for a full page, use
        our{' '}
        <Link className="underline underline-offset-2" to={paths.scan()}>
          free scanner
        </Link>{' '}
        instead.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link to={tool.href} className="card block h-full">
              <h2 className="text-lg font-semibold tracking-tight text-on-surface">{tool.title}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">{tool.dek}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm">
        <Link className="btn" to={paths.scan()}>
          Scan a full page — free
        </Link>{' '}
        <span className="ml-2 text-on-surface-variant">
          One colour or one paragraph is a start — a real page has dozens of these checks at once.
        </span>
      </p>
    </Layout>
  )
}
