// G-CHECKERS-BATCH-1: free text-to-speech magnet page under
// /checkers/text-to-speech/, fourth/fifth tool in the /checkers/ family. All
// speech logic lives in src/components/TextToSpeech.tsx, wrapping the
// browser's own Web Speech API — zero server cost, feature-detected with a
// graceful fallback.

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { TextToSpeech } from '@/components/TextToSpeech'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'

export default function TextToSpeechPage() {
  const title = 'Text-to-speech reader — free, in your browser'
  const description =
    'Free text-to-speech reader. Paste text and hear it read aloud using your browser’s own built-in voices, with adjustable rate and pitch. Nothing you type is sent anywhere. No sign-up.'

  return (
    <Layout title={title} description={description} path={paths.textToSpeech()}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Verscala text-to-speech reader',
          description,
          url: `${ORIGIN}${paths.textToSpeech()}`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }}
      />

      <h1 className="h1 max-w-3xl">Text-to-speech reader</h1>
      <p className="lede max-w-3xl">
        Paste or type any text and have it read aloud, right in your browser — pick a voice, adjust
        rate and pitch, and play, pause or stop whenever you like. Nothing you type is sent anywhere.
        Free, instant, no sign-up.
      </p>

      <TextToSpeech />

      <section className="mt-14 max-w-3xl">
        <h2 className="h2">What this is for</h2>
        <p className="mt-2 text-on-surface-variant">
          This tool wraps your browser&rsquo;s own speech engine — the same technology behind
          operating-system screen readers and read-aloud features. It&rsquo;s useful for proofreading
          your own writing by ear, previewing how a page might sound before a real accessibility test,
          or simply as an easy way to listen to text instead of reading it on screen.
        </p>
      </section>

      {/* ЧЕСТНОСТЬ ПРО ГРАНИЦЫ: браузерные голоса — не полноценный AT-тест. */}
      <section className="mt-14 max-w-3xl">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">What this is — and isn&rsquo;t.</strong> This reads
            plain text you paste in, using whichever voices your browser or operating system already
            has installed — voice quality, available languages and how natural it sounds vary a lot by
            device. It is <strong className="text-on-surface">not</strong> a substitute for testing a
            real page with real assistive technology (NVDA, JAWS, VoiceOver, TalkBack) or with people
            who use it every day — it&rsquo;s a quick, free way to hear your own words before those
            tests.
          </p>
        </div>
      </section>

      {/* МОСТ В ПРОДУКТ: услышал текст → а весь сайт? */}
      <section className="mt-14 max-w-3xl">
        <h2 className="h2">Hearing your text is one signal. Your whole site is more.</h2>
        <p className="mt-2 text-on-surface-variant">
          How your words sound is one of dozens of things that shape whether a page actually works for
          people. Point our free scanner at a real URL and it checks the whole page against WCAG 2.2 —
          the Level AA criteria that laws actually require — and tells you what to fix first, with the
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
          Want to check how readable your text is first?{' '}
          <Link className="underline underline-offset-2" to={paths.readabilityChecker()}>
            Try the readability checker
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
