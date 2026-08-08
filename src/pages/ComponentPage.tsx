import { Link, useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths } from '@/lib/data'
import { CodeBlock } from '@/components/library/CodeBlock'
import { readyComponentBySlug, readyComponents } from '@/lib/componentsLib'

// CN-COMPONENTS (§22, D-068): страница одного компонента. Существует только для
// готовых компонентов (getStaticPaths — readyComponents); каждый несёт по §22
// живой пример, клавиатуру, поведение скринридера, ARIA-заметки, реальный код
// (кнопка копирования) и типичные ошибки. Живой пример — настоящий React-
// примитив из src/components/library/, а показанный код — его же исходник
// (?raw), поэтому пример и код не расходятся.
export default function ComponentPage() {
  const { slug } = useParams()
  const c = readyComponentBySlug(slug!)
  if (!c) return null
  const Demo = c.demo
  const path = paths.component(c.slug)
  const i = readyComponents.findIndex((x) => x.slug === c.slug)
  const prev = i > 0 ? readyComponents[i - 1] : undefined
  const next = i >= 0 && i < readyComponents.length - 1 ? readyComponents[i + 1] : undefined

  const techArticleLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${c.name}: an accessible ${c.name.toLowerCase()} component`,
    description: c.summary,
    mainEntityOfPage: `${ORIGIN}${path}`,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  }

  return (
    <Layout
      title={`Accessible ${c.name} — keyboard, screen reader, ARIA, and pitfalls`}
      description={`${c.summary} Live keyboard-accessible example, the exact keys, screen-reader behaviour, ARIA notes, copyable source, and the accessibility pitfalls to avoid.`}
      path={path}
      crumbs={[{ name: 'Components', path: paths.components() }]}
    >
      <JsonLd data={techArticleLd} />
      <h1 className="h1">{c.name}</h1>
      <p className="mt-2 font-mono text-sm text-on-surface-variant">{c.pattern}</p>
      <p className="lede">{c.summary}</p>

      <section className="mt-8">
        <h2 className="h2">Live example</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          Real and interactive — use it with the mouse, or Tab to it and use the keys below.
        </p>
        <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-6">
          <Demo />
        </div>
      </section>

      <section className="mt-8 max-w-3xl">
        <h2 className="h2">Keyboard</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="border-b-2 border-outline-variant px-3 py-2 text-left font-semibold">
                Key
              </th>
              <th scope="col" className="border-b-2 border-outline-variant px-3 py-2 text-left font-semibold">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {c.keyboard?.map((k) => (
              <tr key={k.keys}>
                <td className="border-b border-outline-variant px-3 py-2 align-top">
                  <kbd className="rounded border border-outline bg-surface-container-low px-1.5 py-0.5 font-mono text-xs">
                    {k.keys}
                  </kbd>
                </td>
                <td className="border-b border-outline-variant px-3 py-2 align-top text-on-surface-variant">{k.does}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 max-w-3xl">
        <h2 className="h2">Screen reader</h2>
        <ul className="space-y-2 text-sm text-on-surface-variant">
          {c.screenReader?.map((s, idx) => (
            <li key={idx} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-outline" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 max-w-3xl">
        <h2 className="h2">ARIA notes</h2>
        <ul className="space-y-2 text-sm text-on-surface-variant">
          {c.ariaNotes?.map((s, idx) => (
            <li key={idx} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-info-border)]" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="h2">Code</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          The real source of the example above — copy it and it works. This is the file that renders
          on this page, so the code and the live example can never drift apart.
        </p>
        <div className="mt-4">
          <CodeBlock code={c.code} label={`src/components/library/${c.impl}.tsx`} />
        </div>
      </section>

      <section className="mt-8 max-w-3xl">
        <h2 className="h2">Accessibility pitfalls</h2>
        <ul className="space-y-4">
          {c.pitfalls?.map((p, idx) => (
            <li key={idx} className="rounded-xl border border-outline-variant p-4">
              <p className="flex gap-2 text-sm">
                <span className="chip chip-critical shrink-0">Avoid</span>
                <span className="text-on-surface-variant">{p.bad}</span>
              </p>
              <p className="mt-2 flex gap-2 text-sm">
                <span className="chip chip-success shrink-0">Do</span>
                <span className="text-on-surface-variant">{p.good}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Components" className="mt-10 flex flex-wrap justify-between gap-3 text-sm">
        {prev ? (
          <Link className="underline underline-offset-2" to={paths.component(prev.slug)}>
            ← {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link className="underline underline-offset-2" to={paths.component(next.slug)}>
            {next.name} →
          </Link>
        )}
      </nav>
    </Layout>
  )
}
