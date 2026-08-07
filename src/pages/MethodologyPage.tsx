import { Layout } from '@/components/Layout'
import { paths } from '@/lib/data'
import {
  beyondStandard,
  coverageByPrinciple,
  coverageGeneratedFrom,
  coverageSummary,
  uncoveredRows,
  type CoverageRow,
} from '@/lib/coverage'

// Публичная карта покрытия (D-037). Смысл страницы — не похвастаться процентом,
// а честно показать границу: что находит машина, а где нужен человек. Именно
// поэтому раздел про непокрытое такой же заметный, как про покрытое, и ведёт
// в каталог агентств — это и есть мост к ним, а не рекламная вставка.
function StatusChip({ row }: { row: CoverageRow }) {
  if (row.status === 'none') return <span className="chip">Manual review</span>
  return <span className="chip chip-accent">Automated</span>
}

export default function MethodologyPage() {
  const groups = coverageByPrinciple()
  const uncovered = uncoveredRows()

  return (
    <Layout
      title="What our scanner checks — and what it can't"
      description="An honest map of which EN 301 549 requirements our free accessibility scan covers automatically, and which ones need a human auditor."
      path={paths.methodology()}
      crumbs={[]}
    >
      <h1 className="h1">What our scanner checks — and what it can't</h1>
      <p className="lede">
        Accessibility requirements are the same across the EU: one harmonised standard,{' '}
        <strong>EN 301 549</strong>, referenced by the European Accessibility Act. Its chapter 9
        covers websites and contains {coverageSummary.total} requirements. Here is exactly how many
        of them a machine can check — and where it stops.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 p-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-4xl font-bold">
            {coverageSummary.covered}/{coverageSummary.total}
          </span>
          <span className="text-slate-500">requirements checked automatically ({coverageSummary.percent}%)</span>
        </div>
        <p className="mt-2 max-w-prose text-sm text-slate-600">
          «Checked automatically» means a test exists that can find failures of that requirement — it
          does <strong>not</strong> mean conformance is proven. An automated test finds some
          violations; it cannot confirm a requirement is met. No number on this page is a statement
          of conformance, and nothing here is legal advice.
        </p>
        {/* CN-WCAG-PAGES (D-066): вход в per-criterion справочник — анти-orphan. */}
        <p className="mt-2 max-w-prose text-sm text-slate-600">
          Every automated criterion also has its own page naming the exact rules —{' '}
          <a className="underline underline-offset-2" href={paths.wcag()}>
            browse the WCAG criteria reference
          </a>
          .
        </p>
      </div>

      <section className="mt-10">
        <h2 className="h2">By principle</h2>
        <ul className="mt-4 space-y-4">
          {groups.map((g) => (
            <li key={g.key} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="text-base font-medium">{g.title}</h3>
                <span className="text-sm text-slate-500">
                  {g.covered} of {g.total} automated
                </span>
              </div>
              <p className="mt-1 max-w-prose text-sm text-slate-600">{g.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="h2">Checks that go beyond the technical standard</h2>
        <p className="max-w-prose text-sm text-slate-600">
          EN 301 549 describes technical accessibility; it says nothing about documents. These duties
          come from the Accessibility Act itself, and in several countries they are the first thing a
          regulator looks at. They are counted separately, not folded into the number above.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {beyondStandard.map((b) => (
            <li key={b.label} className="flex flex-wrap items-baseline gap-x-2">
              <span className="chip chip-accent">Automated</span>
              <span>{b.label}</span>
              <span className="text-slate-500">— {b.basis}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="h2">Where a person is still needed</h2>
        <p className="max-w-prose text-sm text-slate-600">
          The remaining {uncovered.length} requirements depend on meaning, context and judgement —
          whether reading order makes sense, whether an error message actually helps, whether a
          gesture has a simple alternative. Some would require typing into your forms, which we
          deliberately never do. No scanner can close this gap honestly, ours included.
        </p>
        <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
          {uncovered.map((r) => (
            <li key={r.clause} className="text-slate-600">
              <span className="font-medium text-slate-800">{r.title}</span>{' '}
              <span className="text-xs text-slate-500">(WCAG {r.wcag})</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm">
          This is where a qualified auditor comes in.{' '}
          <a className="underline underline-offset-2" href={paths.agencies()}>
            Compare accessibility agencies
          </a>{' '}
          or{' '}
          <a className="underline underline-offset-2" href={paths.requestQuote()}>
            request quotes
          </a>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="h2">Full requirement list</h2>
        <details className="mt-2 rounded-lg border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Show all {coverageSummary.total} chapter 9 requirements
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                EN 301 549 chapter 9 requirements and whether our scanner checks them automatically
              </caption>
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className="py-2 pr-3 font-medium">Clause</th>
                  <th scope="col" className="py-2 pr-3 font-medium">WCAG</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Requirement</th>
                  <th scope="col" className="py-2 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {/* Полный список намеренно спрятан в <details>: страница должна
                    читаться как обзор, а не как выгрузка на 50 строк — владелец
                    просил лёгкость. Но список доступен целиком, без «напишите нам». */}
                {coverageByPrinciple().flatMap((g) => g.rows).map((r) => (
                  <tr key={r.clause} className="border-b border-slate-100">
                    <td className="py-2 pr-3 align-top text-slate-500">{r.clause}</td>
                    <td className="py-2 pr-3 align-top text-slate-500">{r.wcag}</td>
                    <td className="py-2 pr-3 align-top">
                      {/* Покрытый критерий ведёт на свою страницу (D-066);
                          непокрытый страницы не имеет — порог thin-content. */}
                      {r.status !== 'none' ? (
                        <a className="underline underline-offset-2" href={`/wcag/${r.wcag.replace(/\./g, '-')}/`}>
                          {r.title}
                        </a>
                      ) : (
                        r.title
                      )}
                    </td>
                    <td className="py-2 align-top">
                      <StatusChip row={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Derived from {coverageGeneratedFrom}.</p>
        </details>
      </section>

      <p className="mt-10 text-sm">
        <a className="underline underline-offset-2" href={paths.scan()}>
          Run a free scan
        </a>{' '}
        to see which of these apply to your site.
      </p>
    </Layout>
  )
}
