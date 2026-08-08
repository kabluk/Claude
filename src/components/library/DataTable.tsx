import { useMemo, useState, type ReactNode } from 'react'

// Accessible sortable data table. Real `<table>` markup — never a div grid
// dressed up to look like one — with one interactive mechanic layered on top:
// clicking a column header re-orders the rows. The APG documents this exact
// combination as its "Sortable Table" example, so the shape below follows
// that example's structure rather than inventing one; what still needs
// spelling out is *why* each piece is there, because the two failure modes
// below are what a naive implementation gets wrong first.
//
//   1. THE CLICK TARGET IS A BUTTON, NOT THE HEADER CELL. It would be less
//      markup to put `onClick` straight on the `<th>`. That is also exactly
//      how a sortable header goes wrong: a `<th>` has no interactive role of
//      its own, so a bare `onClick` on one is invisible to a screen reader
//      (nothing announces it as clickable) and invisible to the keyboard (a
//      `<th>` is not in the Tab order and Enter/Space do nothing on it). A
//      real `<button>` *inside* the `<th>` gets both for free — it is
//      focusable, Enter and Space already "click" it natively, no key
//      handler to hand-write and possibly get half right — while leaving the
//      cell's own `scope="col"` semantics completely intact for the column
//      it heads.
//   2. `aria-sort` LIVES ON THE `<th>`, NOT ON THE BUTTON INSIDE IT. The
//      attribute describes a property of the *column* (how the table is
//      currently ordered with respect to it) — the header cell is what
//      states that fact structurally; the button is just the control that
//      changes it. Putting `aria-sort` on the button instead would describe
//      the wrong thing.
//
// `aria-sort` TAKES EXACTLY ONE OF THREE VALUES: "ascending", "descending",
// or — the one easy to get wrong — *absent*. The spec also allows the literal
// string "none", but the APG guidance is not to write it on every column that
// has simply never been the sort key: a screen reader user does not need
// "not sorted" announced on all four other columns every time they arrive at
// one, that is noise, not information. So sortable-but-inactive columns here
// carry no `aria-sort` attribute at all (`undefined`, which React drops from
// the DOM), and exactly one `<th>` — the current sort column — carries the
// real value.
//
// The harder case the APG text does not spell out: a column that WAS the
// sort key and then the user clicks a *different* column — does the old one
// get `aria-sort="none"` written explicitly, or does the attribute just come
// off? This component removes it, same as a never-sorted column, for one
// reason: by the time sorting has moved elsewhere, "was sorted a moment ago"
// is not a distinct state from "is not currently sorted" — both describe a
// column the table is not currently ordered by, and the row order on screen
// already reflects only the new sort. Writing `"none"` there would imply a
// third, meaningfully-different state that does not exist; the component's
// state is a single `{ key, direction } | undefined` for exactly this
// reason — there is nothing per-column to remember once sorting moves on.
//
// DIRECTION CYCLE: first click on a column sorts it ascending; a second
// click on the *same* column flips to descending; clicking a *different*
// column always starts that column at ascending again (a column does not
// remember which direction it was on last time it was active). There is no
// third "back to unsorted" state on repeated clicks — once a user has
// picked a sort column, the table stays sorted by *something*, which is
// simpler to predict than a control that can silently return to its
// original, unlabelled order.
//
// THE ROW ORDER ITSELF ACTUALLY CHANGES. `rows` is re-sorted with a real
// comparator on every click (via `sortValue`, not by reading text back out
// of already-rendered cells) — the DOM order of `<tr>` elements changes,
// which is what makes Tab/reading-order and a sighted "top to bottom" scan
// agree with each other. A version that only swapped a visual sort-arrow
// icon while leaving row order untouched would look right and be useless.
//
// THE LIVE ANNOUNCEMENT IS THE ONLY WAY A SCREEN-READER USER LEARNS SORTING
// HAPPENED. `aria-sort` describes the *current* state of a column a user has
// to already be on to discover; it says nothing at the moment a click lands.
// Same reasoning as Toast.tsx's live region: a `role="status"` element is
// rendered once, from first paint, sitting empty — assistive tech is already
// watching it before the first click, so the *change* when a sentence lands
// in it ("Sorted by Founded, ascending.") is what gets announced. Visually
// the same information is a small aria-hidden chevron next to the header
// text — decorative reinforcement for a sighted user, never the only carrier
// of the fact (WCAG 1.4.1), since `aria-sort` and the live sentence already
// carry it structurally and audibly.
//
// FOCUS STAYS ON THE BUTTON. Sorting swaps the *contents* of `<tbody>`, not
// the header row — the button that was clicked is never removed from the
// DOM or replaced, so the browser's default focus behaviour (nothing moves
// it) is already correct; there is no focus-management code in this file for
// that reason, not because it was overlooked.

export type SortDirection = 'ascending' | 'descending'

export interface DataTableColumn<T> {
  /** Stable identifier for the column; also the sort key. */
  key: string
  header: string
  /** Renders a cell's on-screen content for one row. */
  cell: (row: T) => ReactNode
  /** Present only on columns that can be sorted. Extracts the comparable
   *  value used to order rows — kept separate from `cell` because a cell's
   *  rendered content (a link, a formatted string) is not always what
   *  should drive the comparison. Omit for columns with no meaningful order
   *  (e.g. a trailing "actions" column) — that column's header then renders
   *  as plain text, never a sort button with nothing to sort by. */
  sortValue?: (row: T) => string | number
}

export interface DataTableProps<T> {
  /** Accessible table caption — announced before the data, describes what
   *  the table holds (visually hidden here; the page already has a visible
   *  heading above the table, so a second visible caption would repeat it). */
  caption: string
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  /** Optional starting sort. Left unset by default — a table that opens
   *  sorted by a column the caller never asked for is a surprise dressed up
   *  as a feature. The demo on this page sets one deliberately so the
   *  page's static, no-interaction HTML already shows a real `aria-sort`
   *  value (same reasoning as Accordion/Switch/FormField's demos already
   *  showing an interesting state without a click). */
  initialSort?: { key: string; direction: SortDirection }
}

function SortIcon({ direction }: { direction?: SortDirection }) {
  // Decorative only (WCAG 1.4.1) — `aria-sort` plus the live announcement
  // below already carry the fact structurally and audibly; this chevron is
  // reinforcement for a sighted user, never the only signal. Same shape for
  // every sortable header so the affordance ("this is clickable") is visible
  // even before anything is sorted, just dimmer; it points up for ascending
  // and flips for descending rather than switching to a different glyph, so
  // the direction reads as one continuous rotation, not two unrelated icons.
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${
        direction === 'descending' ? 'rotate-180' : ''
      } ${direction ? 'opacity-100' : 'opacity-35'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M3 7l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DataTable<T>({ caption, columns, rows, getRowId, initialSort }: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort)
  const [announcement, setAnnouncement] = useState('')

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const factor = sort.direction === 'ascending' ? 1 : -1
    // Copy before sorting — Array.prototype.sort mutates in place, and `rows`
    // is a prop the caller still owns.
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av).localeCompare(String(bv)) * factor
    })
  }, [rows, columns, sort])

  function handleSort(col: DataTableColumn<T>) {
    if (!col.sortValue) return
    const direction: SortDirection = sort?.key === col.key && sort.direction === 'ascending' ? 'descending' : 'ascending'
    setSort({ key: col.key, direction })
    setAnnouncement(`Sorted by ${col.header}, ${direction}.`)
  }

  return (
    <div>
      <table className="w-full border-collapse text-sm">
        {/* A <caption> is already the table's accessible name per the HTML
            spec — no aria-labelledby needed on top of it. Visually hidden
            because the page above the demo already carries a visible
            heading naming the table; screen reader users still get it. */}
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sort?.key === col.key
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={isSorted ? sort.direction : undefined}
                  className="border-b-2 border-outline-variant px-3 py-2 text-left font-semibold"
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col)}
                      className="inline-flex items-center gap-1 rounded text-left font-semibold text-on-surface hover:text-primary"
                    >
                      {col.header}
                      <SortIcon direction={isSorted ? sort.direction : undefined} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={getRowId(row)} className="transition hover:bg-surface-container-low">
              {columns.map((col) => (
                <td key={col.key} className="border-b border-outline-variant px-3 py-2 align-top">
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Always rendered, starting empty — see the live-announcement note in
          the file header. role="status" + aria-live="polite" together, same
          belt-and-braces pairing Toast.tsx uses for its own status region. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
