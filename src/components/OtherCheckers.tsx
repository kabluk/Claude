// G-CHECKER-INTERLINK (D-179, 2026-08-15): блок «Other free checkers» в
// подвале каждой страницы чекера. Один компонент вместо шести копий списка —
// добавление седьмого чекера в CHECKERS автоматически появляется на всех
// остальных страницах, без правки каждой.
//
// Ведёт и на соседей, и на индекс `/checkers/`: сам индекс раньше был
// ЕДИНСТВЕННЫМ путём от чекера к чекеру (структура «звезда», D-179), и он
// остаётся полезной точкой обзора — но перестаёт быть обязательной
// пересадкой.

import { Link } from 'react-router-dom'
import { relatedCheckers } from '@/lib/checkers'
import { paths } from '@/lib/data'

export function OtherCheckers({ current }: { current: string }) {
  const others = relatedCheckers(current)
  if (others.length === 0) return null

  return (
    <section className="mt-12 border-t border-outline-variant pt-8">
      <h2 className="h2 mt-0">Other free checkers</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {others.map((c) => (
          <li key={c.href}>
            <Link to={c.href} className="card block h-full">
              <h3 className="font-semibold tracking-tight text-on-surface">{c.title}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{c.dek}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link className="underline underline-offset-2" to={paths.checkers()}>
          All free checkers
        </Link>
      </p>
    </section>
  )
}
