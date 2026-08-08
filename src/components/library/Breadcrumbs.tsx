import { Link } from 'react-router-dom'

// Accessible breadcrumb trail — the pattern this site already runs in its own
// Layout, extracted so the library shows working code rather than a lookalike.
//
// Four decisions carry the accessibility here, and each is easy to get wrong:
//
//   1. `<nav aria-label="Breadcrumb">` — a landmark needs a NAME when a page
//      has more than one nav (this site has the main nav too). Without the
//      label, a screen-reader user hears "navigation" twice and cannot tell
//      which is which.
//   2. `<ol>`, not `<ul>` — a trail is ordered. The list also tells assistive
//      technology how many levels there are before the user starts moving.
//   3. Separators are drawn by CSS (`::after`), never typed into the markup.
//      A literal "/" between items is announced — "Home slash Countries slash
//      Germany" — and the noise scales with depth. Decoration belongs in the
//      stylesheet, where screen readers do not go.
//   4. The current page is NOT a link and carries `aria-current="page"`. Two
//      things at once: nobody needs a link to where they already are, and
//      `aria-current` is what announces "this is your position" rather than
//      leaving the last item indistinguishable from its ancestors.
//
// `label` is a prop, not a constant, because uniqueness is a property of the
// PAGE, not of the component. This very page proves it: the site's own layout
// already renders a "Breadcrumb" landmark above, so a second one with the
// default name would leave two landmarks a screen-reader user cannot tell
// apart — axe's `landmark-unique`, which is decision 1 failing one level up.
// Hard-coding the name would have made that unfixable without editing the
// component.

export type Crumb = { name: string; path: string }

export function Breadcrumbs({
  trail,
  current,
  label = 'Breadcrumb',
}: {
  trail: Crumb[]
  current: string
  label?: string
}) {
  return (
    <nav aria-label={label} className="text-sm text-on-surface-variant">
      <ol className="flex flex-wrap gap-1">
        {trail.map((c) => (
          <li key={c.path} className="after:mx-1 after:content-['/']">
            <Link className="underline-offset-2 hover:text-on-surface hover:underline" to={c.path}>
              {c.name}
            </Link>
          </li>
        ))}
        {/* Current page: plain text + aria-current, deliberately not a link. */}
        <li aria-current="page" className="text-on-surface">
          {current}
        </li>
      </ol>
    </nav>
  )
}
