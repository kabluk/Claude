// G-CHECKER-STATEMENT-GEN (D-181): /checkers/accessibility-statement-generator/
// — седьмой инструмент-магнит. Кандидат №1 по исследованию рынка (D-179,
// domains/growth.md): такой генератор есть минимум у 8 игроков ниши, включая
// платящих $5–8 за клик, и он ближе всех к нашей воронке — человек, который
// публикует заявление о соответствии, обязан это соответствие чем-то
// подтвердить, а подтверждать нечем без проверки сайта.
//
// Вся логика текста — src/lib/statementGenerator.ts (чистая, 15 тестов).
// Ничего не отправляется: как и остальные чекеры, инструмент считает всё в
// браузере (CORS-ограничение ниши, LEARNING_LOG 2026-08-15 — клиентский
// инструмент не может читать чужой сайт, поэтому и серверу тут делать
// нечего).

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { OtherCheckers } from '@/components/OtherCheckers'
import { StatementGenerator } from '@/components/StatementGenerator'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'

export default function StatementGeneratorPage() {
  const title = 'Accessibility statement generator — free, no sign-up'
  const description =
    'Fill in a short form and get a ready accessibility statement in plain text or HTML — built on the W3C WAI structure, with the EU “compliant” wording where it applies. Nothing is uploaded.'
  const path = paths.statementGenerator()

  const howToLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Accessibility statement generator',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    url: `${ORIGIN}${path}`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  }

  return (
    <Layout title={title} description={description} path={path} crumbs={[{ name: 'Checkers', path: paths.checkers() }]}>
      <JsonLd data={howToLd} />

      <h1 className="h1">Accessibility statement generator</h1>
      <p className="lede max-w-3xl">
        Fill in the form and copy a ready statement — plain text or HTML. The structure follows{' '}
        <Link className="underline underline-offset-2" to="/guides/accessibility-statement-guide/">
          W3C WAI's guidance
        </Link>
        , and nothing you type leaves your browser.
      </p>

      <div
        role="note"
        className="mt-4 max-w-3xl rounded-md border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant"
      >
        <strong>This is a template, not legal advice.</strong> What a statement must contain — and
        whether you're required to publish one at all — depends on your country and sector. In EU
        scope the model statement uses “compliant”; W3C's own template says “conformant”. This tool
        follows whichever matches the standard you pick, but the facts you put in it are yours to
        verify.
      </div>

      <StatementGenerator />

      <section className="mt-12 max-w-3xl">
        <h2 className="h2">A statement is a claim — make it one you can back</h2>
        <p className="mt-2 text-on-surface-variant">
          Every statement names a conformance status. Writing “fully compliant” is easy; standing
          behind it is not. Before you publish, it's worth knowing what an automated pass actually
          finds on your pages — missing alt text, unlabelled form fields, contrast failures and a
          missing statement link are the four that regulators check first.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link className="btn" to={paths.scan()}>
            Scan your site — free
          </Link>
          <Link className="underline underline-offset-2 text-sm" to={paths.agencies()}>
            Or find an agency to audit it properly
          </Link>
        </div>
        <p className="mt-4 text-sm text-on-surface-variant">
          An automated scan is a floor, not a ceiling: it catches what tooling can prove, which is
          roughly a third of the criteria. If your statement claims an external audit, it needs a
          real one —{' '}
          <Link className="underline underline-offset-2" to={paths.methodology()}>
            here's exactly what we check and what we don't
          </Link>
          .
        </p>
      </section>

      <OtherCheckers current={path} />
    </Layout>
  )
}
