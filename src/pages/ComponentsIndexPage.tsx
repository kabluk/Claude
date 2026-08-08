import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, itemListLd } from '@/lib/seo'
import { paths } from '@/lib/data'
import { components } from '@/lib/componentsLib'

// CN-COMPONENTS (§22, D-068): индекс библиотеки. Список строится из
// data/a11y/components.json — не ручной перечень. Готовые компоненты ведут на
// свою страницу; запланированные показаны честно как «Planned», без ссылки и
// без битого URL (R1: не плодим страницы-заглушки). Собственные интерактивные
// примеры библиотеки сами обязаны проходить axe — постоянный гейт в
// scripts/audit-own-a11y.mjs (индекс + все три готовые страницы, модалка — в
// открытом состоянии).
export default function ComponentsIndexPage() {
  const ready = components.filter((c) => c.status === 'ready')
  const planned = components.filter((c) => c.status === 'planned')

  return (
    <Layout
      title="Accessible component library: keyboard, screen reader, ARIA, and the pitfalls"
      description="Real, working, keyboard-accessible UI components — accordion, tabs, modal dialog — each with its keyboard map, screen-reader behaviour, ARIA notes, copyable source, and the accessibility mistakes to avoid."
      path={paths.components()}
      crumbs={[]}
    >
      <JsonLd data={itemListLd(ready.map((c) => paths.component(c.slug)))} />
      <h1 className="h1">Component library</h1>
      <p className="lede">
        Common UI patterns, built to be actually accessible — every example here is real and works
        with the keyboard, not a screenshot. Each page maps the keys, describes what a screen reader
        hears, notes the ARIA that makes it work, shows copyable source, and lists the mistakes that
        most often break it. A directory about accessibility has to hold its own components to the
        same bar: each live example passes axe with no violations, checked on every build.
      </p>

      <section className="mt-8">
        <h2 className="sr-only">Available components</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ready.map((c) => (
            <li key={c.slug}>
              <Link to={paths.component(c.slug)} className="card h-full">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-[color:var(--color-ink)]">{c.name}</h3>
                  <span className="chip chip-success">Ready</span>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-500">{c.pattern}</p>
                <p className="mt-2 text-sm text-slate-600">{c.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="h2">Planned</h2>
        <p className="max-w-prose text-sm text-slate-600">
          The library is being built one exemplary component at a time — a page ships only when its
          live example is real and passes the same accessibility bar. These patterns are on the way;
          they are listed here honestly, with no page and no broken link until they are ready.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {planned.map((c) => (
            <li key={c.slug} className="rounded-xl border border-dashed border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-500">{c.name}</span>
                <span className="chip">Planned</span>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-500">{c.pattern}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 max-w-3xl rounded-xl border border-indigo-100 bg-[color:var(--color-accent-soft)] p-6">
        <p className="font-semibold">Need the same rigour on your own site?</p>
        <p className="mt-1 text-sm text-slate-600">
          Free instant scan against the automated checks — then compare verified auditors for the
          judgement calls automation cannot make.
        </p>
        <Link className="btn mt-4" to={paths.scan()}>
          Scan your website
        </Link>
      </div>
    </Layout>
  )
}
