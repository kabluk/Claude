import { useId, useState, type ReactNode } from 'react'

// Accessible accordion — the WAI-ARIA Disclosure pattern.
//
// Each header is a real <button> inside a heading, so Enter and Space toggle it
// for free (no manual key handling — reimplementing native button keys is the
// most common way to get this wrong). The button owns aria-expanded and points
// at its panel with aria-controls; the panel is removed from the DOM while
// collapsed, so nothing hidden is reachable by keyboard or screen reader.
//
// `allowMultiple` (default true) lets several panels stay open at once, which is
// the more forgiving default — a single-open accordion that snaps other panels
// shut can lose a reader's place.

export interface AccordionItem {
  title: ReactNode
  content: ReactNode
}

export function Accordion({
  items,
  allowMultiple = true,
  headingLevel = 3,
}: {
  items: AccordionItem[]
  allowMultiple?: boolean
  headingLevel?: 2 | 3 | 4
}) {
  const baseId = useId()
  const [open, setOpen] = useState<Set<number>>(() => new Set())
  const Heading = `h${headingLevel}` as const

  function toggle(i: number) {
    setOpen((prev) => {
      const next = allowMultiple ? new Set(prev) : new Set<number>()
      if (prev.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
      {items.map((item, i) => {
        const expanded = open.has(i)
        const btnId = `${baseId}-h${i}`
        const panelId = `${baseId}-p${i}`
        return (
          <div key={i}>
            <Heading className="m-0">
              <button
                type="button"
                id={btnId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-[color:var(--color-ink)] hover:bg-slate-50"
              >
                {item.title}
                <Chevron expanded={expanded} />
              </button>
            </Heading>
            {expanded && (
              <div id={panelId} role="region" aria-labelledby={btnId} className="px-4 pb-4 text-sm text-slate-600">
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Single stroke-based glyph (currentColor), matching the icon style used by the
// scan-stream indicators. The rotation is a transition, not a keyframe loop, and
// it is suppressed under prefers-reduced-motion so the open/closed state is
// still carried by the glyph's direction, never by motion alone.
function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="h-3 w-3 shrink-0 text-slate-400 transition-transform duration-150 motion-reduce:transition-none"
      style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
