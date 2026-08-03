import { Link } from 'react-router-dom'
import type { Lang, UIStrings } from '@/lib/types'
import { pathFor } from '@/lib/slugs'

// Нижняя навигация из макета Stitch: четыре постоянных входа.
// Простые линейные глифы (инлайн SVG) — без внешних иконок (CSP).
const ICONS: Record<string, JSX.Element> = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9" />
  ),
  tasks: (
    <>
      <path d="M9 11l2 2 4-4" />
      <rect x="3" y="4" width="18" height="16" rx="2" />
    </>
  ),
  docs: (
    <>
      <path d="M14 3v5h5" />
      <path d="M14 3H6v18h12V8z" />
    </>
  ),
  find: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
}

const TABS: { key: keyof UIStrings['tabs']; page: string; match: string[] }[] = [
  { key: 'home', page: 'home', match: ['home'] },
  { key: 'tasks', page: 'intake', match: ['intake'] },
  { key: 'docs', page: 'docpack', match: ['docpack', 'documents', 'forms'] },
  { key: 'find', page: 'visit', match: ['visit', 'facility-adelanto', 'state-ca', 'state-tx', 'state-la'] },
]

export function TabBar({ lang, pageKey, ui }: { lang: Lang; pageKey: string; ui: UIStrings }) {
  return (
    <nav className="tabbar" aria-label="tabs">
      {TABS.map((t) => {
        const on = t.match.includes(pageKey)
        return (
          <Link key={t.key} to={pathFor(lang, t.page)} className={on ? 'tab on' : 'tab'}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ICONS[t.key]}
            </svg>
            <span>{ui.tabs[t.key]}</span>
          </Link>
        )
      })}
    </nav>
  )
}
