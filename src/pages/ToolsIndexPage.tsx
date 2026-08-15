// G-TOOL-READABILITY / G-CHECKERS-BATCH-1 / G-CHECKER-PALETTE: index of the
// free tool-magnet pages. Same card pattern as ReportsIndexPage.tsx, own Meta
// via Layout.
//
// D-179: список переехал в `src/lib/checkers.ts` (общий реестр) — раньше он
// был захардкожен здесь, и потому существовал только для индекса; сами
// страницы чекеров о соседях не знали. Новый чекер достаточно добавить в
// реестр: карточка появится и тут, и в блоке «Other checkers» на всех
// остальных страницах.

import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, itemListLd } from '@/lib/seo'
import { paths } from '@/lib/data'
import { CHECKERS as TOOLS } from '@/lib/checkers'

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
