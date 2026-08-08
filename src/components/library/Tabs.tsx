import { useId, useRef, useState, type ReactNode } from 'react'

// Accessible tabs — the WAI-ARIA Tabs pattern with a roving tabindex.
//
// The tablist holds exactly one tab in the Tab sequence at a time: the selected
// tab has tabindex 0, the rest tabindex -1. So Tab moves the user *out* of the
// tablist to the panel, while Left/Right (and Home/End) move *between* tabs and
// move focus with them. This is the part people most often get wrong — either
// every tab is a tab stop (so Tab walks through all of them), or the arrow keys
// do nothing.
//
// Activation follows focus (Left/Right selects immediately). That is the correct
// default when showing a panel is cheap; for expensive panels the pattern allows
// manual activation (arrows move focus, Enter/Space selects) — out of scope for
// this demo, and called out in the pitfalls.

export interface TabItem {
  label: string
  content: ReactNode
}

export function Tabs({ tabs, label }: { tabs: TabItem[]; label: string }) {
  const baseId = useId()
  const [selected, setSelected] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(e: React.KeyboardEvent) {
    const last = tabs.length - 1
    let next: number | null = null
    if (e.key === 'ArrowRight') next = selected === last ? 0 : selected + 1
    else if (e.key === 'ArrowLeft') next = selected === 0 ? last : selected - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    setSelected(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap gap-1 border-b border-outline-variant">
        {tabs.map((t, i) => {
          const isSel = i === selected
          return (
            <button
              key={i}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={isSel}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={isSel ? 0 : -1}
              onClick={() => setSelected(i)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
                isSel
                  ? 'border-[color:var(--color-primary)] text-[color:var(--color-primary)]'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {tabs.map((t, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${baseId}-panel-${i}`}
          aria-labelledby={`${baseId}-tab-${i}`}
          hidden={i !== selected}
          tabIndex={0}
          className="px-1 py-4 text-sm text-on-surface-variant"
        >
          {t.content}
        </div>
      ))}
    </div>
  )
}
