import { cloneElement, useId, type ReactElement } from 'react'

// Generalises the `Field` wrapper already proven in production on
// /request-quote/ (src/components/LeadForm.tsx, A2-LEAD-FORM) — same
// label/htmlFor/error/role="alert" contract, extracted from a working example
// rather than designed from a spec (same precedent as Breadcrumbs, D-077).
//
// Two things LeadForm's Field didn't need yet, added here:
//
//   1. A hint, described ALONGSIDE the error, not replaced by it. LeadForm's
//      Field only ever wires up `error` into aria-describedby; it has no hint
//      concept at all. The single most common way real forms break this
//      pattern is losing the hint's aria-describedby the instant an error's
//      aria-describedby takes over — exactly the moment a user most needs
//      to be reminded what a field is for. Both ids are joined, never one
//      replacing the other.
//
//   2. Automatic wiring of id/aria-invalid/aria-describedby onto the control
//      itself. LeadForm's six fields currently repeat that wiring by hand on
//      every single <input>/<select> (id={`${formId}-x`}, aria-invalid=
//      {!!errors.x}, aria-describedby={errors.x ? `${formId}-x-error` :
//      undefined} — see LeadForm.tsx lines ~79-186). FormField closes that
//      gap by construction: it clones `children` (the one real control) and
//      injects those three attributes itself, the same cloneElement pattern
//      this library already uses in Tooltip.tsx. A consumer cannot forget the
//      wiring because there is no wiring left to forget.
//
// FormField never renders the control — <input>/<select>/<textarea>/a custom
// widget is passed in as `children`, exactly like LeadForm's Field. The
// library stays composable with whatever control a form actually needs
// instead of growing its own text-input primitive that would duplicate the
// site's existing `.input` class.

export function FormField({
  label,
  hint,
  error,
  id,
  children,
}: {
  label: string
  hint?: string
  error?: string
  /** Supply your own id to match an existing naming scheme (e.g. a shared
   *  `${formId}-x` convention). Omit it and FormField generates one with
   *  useId() — safe to mount several instances on one page without id
   *  collisions. */
  id?: string
  children: ReactElement
}) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  // Both hint and error described together when both exist — never one
  // clobbering the other. Attribute is omitted entirely (not set to ""),
  // when there is neither a hint nor an error to point at.
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const control = cloneElement(children, {
    id: fieldId,
    // true only when there is a real error — never a hardcoded "false".
    // Screen readers treat an explicit aria-invalid="false" as noise, and it
    // also erases the one moment this attribute is actually meaningful.
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  } as Record<string, unknown>)

  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-on-surface-variant">
        {label}
      </label>
      {control}
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        // role="alert" (not aria-live on a wrapper) so the error is announced
        // the instant it renders, without moving focus off the field the
        // user is still typing into — same mechanism LeadForm's Field
        // already relies on.
        <p id={errorId} role="alert" className="mt-1 text-sm font-medium text-[color:var(--color-critical)]">
          {error}
        </p>
      )}
    </div>
  )
}
