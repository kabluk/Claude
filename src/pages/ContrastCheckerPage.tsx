// G-TOOL-CONTRAST (D-144): бесплатный чекер контраста как страница-магнит под
// кластер «contrast checker» (≈27k/мес US, LOW-конкуренция, замер DataForSEO
// 2026-08-13 — growth.md). У WebAIM (#1, 20 лет авторитета) фичами не выиграть;
// место есть у #2 coolors / #4 colourcontrast.cc (непрофильные, берут скоростью)
// и #5 accessibleweb.com (вендор нашего калибра).
//
// НАШ уникальный слой, которого нет ни у одного из разобранных конкурентов:
// закон юрисдикции рядом с результатом (13 юрисдикций, EN 301 549 → WCAG AA) +
// мост в реальный продукт (проверил цвет → «а весь сайт?» → скан → отчёт →
// PDF / каталог агентств). Реализация чисто клиентская, нулевая себестоимость.
//
// Страница ПРО доступность обязана быть образцово доступной (WCAG 2.2 AA): она в
// gen-a11y-sitemap.mjs И audit-own-a11y.mjs (page-lists.test.mjs следит), стилизация
// только токенами (BRAND_BOOK, светлая тема D-073). Интерактив и его дисциплина
// гидрации — в src/components/ContrastChecker.tsx.

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { OtherCheckers } from '@/components/OtherCheckers'
import { ContrastChecker } from '@/components/ContrastChecker'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { JURISDICTION_OPTIONS } from '@/lib/jurisdictions'
import { paths } from '@/lib/data'

const WCAG_143 = 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html'
const WCAG_146 = 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html'
const WCAG_1411 = 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html'
const EN301549 = 'https://www.etsi.org/deliver/etsi_en/301500_301599/301549/'

export default function ContrastCheckerPage() {
  const title = 'Contrast checker — WCAG 2.2 colour contrast ratio'
  const description =
    'Free, instant WCAG 2.2 colour contrast checker. Live AA/AAA pass-fail for normal text, large text and UI — hex, RGB or HSL, with an eyedropper and a shareable link. No sign-up.'

  return (
    <Layout title={title} description={description} path={paths.contrastChecker()}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Verscala contrast checker',
          description,
          url: `${ORIGIN}${paths.contrastChecker()}`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }}
      />

      <h1 className="h1 max-w-3xl">Colour contrast checker</h1>
      <p className="lede max-w-3xl">
        Enter two colours and see the WCAG 2.2 contrast ratio update live — with a pass/fail for
        normal text, large text and UI components at Level AA and AAA. Hex, RGB or HSL, an eyedropper
        where your browser supports it, and a link you can share. Free, instant, no sign-up.
      </p>

      <ContrastChecker />

      <section className="mt-14 max-w-3xl">
        <h2 className="h2">What the thresholds mean</h2>
        <p className="mt-2 text-on-surface-variant">
          Contrast is a ratio between 1:1 (identical colours) and 21:1 (black on white), computed
          from the relative luminance of each colour. The exact formula is defined by WCAG and is the
          same one our own scanner (axe-core) uses, so a result here matches what a{' '}
          <Link className="underline underline-offset-2" to={paths.scan()}>
            full-page scan
          </Link>{' '}
          would report.
        </p>
        <ul className="mt-4 space-y-3 text-on-surface-variant">
          <li>
            <strong className="text-on-surface">Normal text — 1.4.3 Contrast (Minimum), AA.</strong>{' '}
            At least <span className="num">4.5:1</span>. This is the level almost every accessibility
            law points to.{' '}
            <a className="underline underline-offset-2" href={WCAG_143} rel="noopener noreferrer">
              Understanding 1.4.3
            </a>
            {' · '}
            <Link className="underline underline-offset-2" to="/wcag/1-4-3/">
              how our scanner checks it
            </Link>
            .
          </li>
          <li>
            <strong className="text-on-surface">Large text — also 1.4.3, AA.</strong> At least{' '}
            <span className="num">3:1</span>. Large means ≥24px, or ≥18.66px (14pt) bold.
          </li>
          <li>
            <strong className="text-on-surface">Enhanced — 1.4.6 Contrast (Enhanced), AAA.</strong>{' '}
            <span className="num">7:1</span> for normal text, <span className="num">4.5:1</span> for
            large.{' '}
            <a className="underline underline-offset-2" href={WCAG_146} rel="noopener noreferrer">
              Understanding 1.4.6
            </a>
            .
          </li>
          <li>
            <strong className="text-on-surface">UI &amp; graphics — 1.4.11 Non-text Contrast, AA.</strong>{' '}
            <span className="num">3:1</span> for the boundaries of buttons, form fields, focus
            indicators and meaningful graphics. There is no AAA level for this criterion.{' '}
            <a className="underline underline-offset-2" href={WCAG_1411} rel="noopener noreferrer">
              Understanding 1.4.11
            </a>
            .
          </li>
        </ul>
      </section>

      {/* УНИКАЛЬНЫЙ СЛОЙ: закон юрисдикции рядом с результатом. Данные — общий
          источник JURISDICTION_OPTIONS (зеркало воркера, D-143), никаких «своих»
          формулировок закона; verified — только DE (D-034); сумм штрафов нет
          (D-035). */}
      <section className="mt-14">
        <h2 className="h2">Where AA contrast is required by law</h2>
        <p className="mt-2 max-w-3xl text-on-surface-variant">
          Contrast is not just a guideline. Across Europe, the harmonised standard{' '}
          <a className="underline underline-offset-2" href={EN301549} rel="noopener noreferrer">
            EN 301 549
          </a>{' '}
          adopts the WCAG Level AA success criteria — including 1.4.3 — and national laws
          transposing the European Accessibility Act point to it. These are the{' '}
          {JURISDICTION_OPTIONS.length} jurisdictions in our catalogue with such a law:
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {JURISDICTION_OPTIONS.map((j) => (
            <li key={j.code} className="card">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold text-on-surface">{j.label}</h3>
                {j.verified ? (
                  <span className="chip chip-success">✓ verified</span>
                ) : (
                  <span className="chip">reference unverified</span>
                )}
              </div>
              <p className="mt-1 font-mono text-xs text-on-surface-variant">{j.law}</p>
            </li>
          ))}
        </ul>

        {/* Границы названы на самой странице, а не только в наших документах
            (R1, D-035) — тот же приём честности, что на /bfsg-check/. */}
        <div className="mt-6 max-w-3xl rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">What we deliberately don&rsquo;t do:</strong> we show
            no fine amounts — they depend on facts a colour pair can&rsquo;t reveal, and micro-enterprises
            are exempt from the service obligations under the EAA. Only Germany&rsquo;s reference (BFSG)
            is marked <em>verified</em> — checked against the primary legal text; the others we label
            unverified rather than overstate. This page is orientation, not legal advice.
          </p>
        </div>
      </section>

      {/* МОСТ В ПРОДУКТ: проверил цвет → а весь сайт? */}
      <section className="mt-14 max-w-3xl">
        <h2 className="h2">One colour pair is a start. Your whole site is more.</h2>
        <p className="mt-2 text-on-surface-variant">
          Contrast is one of dozens of things a page can get wrong. Point our free scanner at a real
          URL and it checks the whole page against WCAG 2.2 — contrast included — and tells you what
          to fix first, with the legal context for the site&rsquo;s jurisdiction.
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
          Want to check the maths yourself? See{' '}
          <Link className="underline underline-offset-2" to={paths.methodology()}>
            what our scanner covers
          </Link>
          , criterion by criterion.
        </p>
      </section>

      <OtherCheckers current={paths.contrastChecker()} />
    </Layout>
  )
}
