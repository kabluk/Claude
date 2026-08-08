// Accessible pagination — not a named WAI-ARIA APG pattern (unlike Combobox,
// Menu, or Listbox), which is exactly why it is easy to make LOOK right while
// being practically useless. This applies general navigation-accessibility
// principles to one specific job: moving through a long, page-broken list.
//
// The real traps, in the order people hit them:
//
//   1. LANDMARK NAME. The wrapper is `<nav aria-label={label}>` — a `<nav>`
//      needs a NAME the moment a page has more than one (this site's Layout
//      already renders "Main", "Breadcrumb", and "Legal" nav landmarks, and a
//      component-library page adds its own "Components" prev/next nav below
//      this one). `label` is a prop, not a hard-coded constant, for the same
//      reason Breadcrumbs.tsx made the same call: uniqueness is a property of
//      the PAGE a pagination control is mounted on, not of the component. A
//      page showing two paginated lists side by side needs two distinct
//      names, or axe's `landmark-unique` catches the collision — the same
//      lesson Breadcrumbs already paid for (D-077).
//   2. `<ul>` INSIDE THE NAV. A row of page numbers is a list of items, and
//      APG's own pagination example endorses wrapping them in one — the list
//      announces its length ("list of 7 items") before the user starts
//      moving through it, the same benefit Breadcrumbs gets from its `<ol>`.
//   3. THE CURRENT PAGE IS NOT A LINK TO ITSELF. A page number that is a
//      `<button>`/`<a>` pointing at the page already showing is the
//      "link that reloads what you're already looking at" antipattern —
//      useless at best, and it silently eats the current position out of
//      `aria-current` if not handled. This component renders the current
//      page as plain text (an unstyled `<span>` inside its `<li>`), never a
//      control, carrying `aria-current="page"` — the exact literal string
//      "page", not `"true"`. `aria-current` is a small enumerated attribute
//      (page/step/location/date/time/true/false) and "page" is the one
//      built for this: it tells a screen reader "this is where you are in a
//      set of pages", which the generic boolean does not.
//   4. BARE ARROW GLYPHS AS THE ONLY NAME. "‹"/"›" characters are decoration,
//      not accessible names — a screen reader announces a button with no
//      accessible text as just "button". Both the Previous and Next controls
//      carry visible text containing the word, so the accessible name reads
//      correctly with no reliance on an icon a screen reader cannot see.
//   5. DISABLED-BY-CSS-ONLY. Prev on page 1 / Next on the last page must be
//      distinguishable as unavailable to more than sighted mouse users — see
//      the `aria-disabled` note below for which mechanism and why.
//   6. A CLICKABLE ELLIPSIS. The "…" gap marker used when the page range is
//      truncated is not a jump-to-page control here (no "type a page number"
//      affordance exists to jump to what it represents) — it is rendered as
//      `aria-hidden="true"` plain text, so it is never announced as an
//      interactive item with no destination.
//
// KEYBOARD: every focusable element here — Previous, each page-number
// button, Next — is a real `<button>`. Tab / Shift+Tab already walk them in
// visual order for free; there is no roving-tabindex/arrow-key layer to
// build, unlike Tabs or Menu button. Confirmed deliberately, not assumed:
// this is a flat row of independent controls (each one either navigates or
// does nothing), not a single composite widget with one internal position —
// the roving-tabindex pattern exists for the latter case (Tabs' selected
// tab, a menu's active item), which this is not.

export interface PaginationProps {
  /** 1-based index of the page currently showing. */
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Landmark name — must be unique among the `<nav>` elements on whatever
   *  page this is mounted on (see note 1 above). Defaults to something
   *  reasonable for a page with only one paginated list. */
  label?: string
  /** How many page numbers to show on each side of the current page before
   *  collapsing the rest into an ellipsis. First and last page are always
   *  shown. */
  siblingCount?: number
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

// Builds the truncated page list: 1, …, current-sibling..current+sibling, …,
// total — collapsing a run down to a single page number instead of a
// pointless one-page "gap" (e.g. skipping straight from page 1 to page 3
// would otherwise show "1 … 3" for a gap of exactly one page).
function buildPageItems(current: number, total: number, siblingCount: number): PageItem[] {
  const totalNumbered = siblingCount * 2 + 5 // first + last + current + 2 ellipses worth of slack
  if (total <= totalNumbered) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const left = Math.max(current - siblingCount, 1)
  const right = Math.min(current + siblingCount, total)

  const items: PageItem[] = [1]
  if (left > 2) items.push('ellipsis-start')
  else if (left === 2) items.push(2)

  for (let p = Math.max(left, 2); p <= Math.min(right, total - 1); p++) items.push(p)

  if (right < total - 1) items.push('ellipsis-end')
  else if (right === total - 1) items.push(total - 1)

  items.push(total)
  return items
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  label = 'Pagination',
  siblingCount = 1,
}: PaginationProps) {
  const isFirst = currentPage <= 1
  const isLast = currentPage >= totalPages
  const items = buildPageItems(currentPage, totalPages, siblingCount)

  // DISABLED STATE: `aria-disabled="true"` on a real, still-focusable
  // <button>, deliberately NOT the native `disabled` attribute. The APG
  // guidance on disabled controls prefers this when a control's disabled
  // state is temporary/contextual rather than permanent: `disabled` removes
  // the element from the Tab sequence entirely, so a screen-reader or
  // keyboard-only user tabbing through the control row would find Previous
  // simply *missing* on page 1 — nothing to explain why, and the row's tab
  // stops shift depending on which page happens to be showing. Leaving it
  // focusable with `aria-disabled` keeps the control row's shape constant
  // and lets an assistive-technology user land on it and be told
  // "dimmed"/"unavailable", which is more informative than an element that
  // silently isn't there. The trade-off this accepts: a sighted mouse user
  // tabbing past it also stops there — an acceptable cost for a two-button
  // row. The click/keyboard handler below still has to enforce the "does
  // nothing" half by hand, since aria-disabled is informational only and
  // does not itself block a native <button>'s onClick.
  function go(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange(page)
  }

  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          <button
            type="button"
            aria-disabled={isFirst || undefined}
            onClick={() => {
              if (isFirst) return
              go(currentPage - 1)
            }}
            className={`inline-flex h-9 items-center gap-1 rounded-full border border-outline px-3 font-mono text-xs font-medium tracking-[0.05em] uppercase transition ${
              isFirst
                ? 'cursor-not-allowed text-on-surface-variant opacity-50'
                : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Previous
          </button>
        </li>

        {items.map((item, idx) =>
          typeof item === 'number' ? (
            <li key={item}>
              {item === currentPage ? (
                // Current page: plain text, never a link/button pointing at
                // itself — see note 3 in the file header.
                <span
                  aria-current="page"
                  className="flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-2 font-mono text-xs font-medium text-on-primary num"
                >
                  {item}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => go(item)}
                  className="flex h-9 min-w-9 items-center justify-center rounded-full px-2 font-mono text-xs font-medium text-on-surface num transition hover:bg-surface-container"
                >
                  {item}
                </button>
              )}
            </li>
          ) : (
            // Ellipsis: decorative only — it does not represent a clickable
            // "jump to page" control, so it carries no interactive role and
            // is hidden from assistive technology (note 6 above).
            <li key={`${item}-${idx}`} aria-hidden="true" className="flex h-9 w-9 items-center justify-center text-on-surface-variant">
              …
            </li>
          )
        )}

        <li>
          <button
            type="button"
            aria-disabled={isLast || undefined}
            onClick={() => {
              if (isLast) return
              go(currentPage + 1)
            }}
            className={`inline-flex h-9 items-center gap-1 rounded-full border border-outline px-3 font-mono text-xs font-medium tracking-[0.05em] uppercase transition ${
              isLast
                ? 'cursor-not-allowed text-on-surface-variant opacity-50'
                : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            Next
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  )
}
