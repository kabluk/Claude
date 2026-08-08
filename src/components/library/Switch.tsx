import { useId } from 'react'

// Accessible on/off toggle — the WAI-ARIA APG "Switch" pattern. The simplest
// widget in this library, but the one whose most common real-world bug is a
// semantic mix-up rather than a missing keyboard handler:
//
//   SWITCH IS NOT A CHECKBOX. A checkbox reports "checked / not checked" — a
//   member of a set, or an agreement to a statement. A switch reports
//   "on / off" — an immediate state change, usually with an immediate
//   effect (a setting flips right now, no form submission pending). Giving a
//   switch `role="checkbox"`, or leaving a bare `<input type="checkbox">`
//   with no role at all, tells a screen reader to announce "checked", which
//   is the wrong word for what just happened. `role="switch"` is what fixes
//   that — it is an ARIA role in its own right, not a checkbox variant.
//
//   This component uses a native <button role="switch">, not
//   <input type="checkbox" role="switch">, precisely to avoid that mix-up by
//   construction: there is no underlying checkbox semantics to override, and
//   no way to accidentally ship the input without its role. It also means
//   Enter and Space both activate it for free — a real <button> already
//   treats both as "click" natively, so there is no hand-written key handler
//   that could get only one of the two right. (A checkbox-based switch is
//   the APG's other listed variant and would only need Space; a switch
//   accepting Enter too is intentional here, matching a <button>'s default.)
//
//   `aria-checked` is the single source of truth for state, on this element
//   and nowhere else — there is exactly one boolean prop (`checked`) driving
//   both `aria-checked` and the thumb's position, so the two can never draw
//   from different state and drift apart the way Toast's and MenuButton's
//   own "don't let the announced state and the visual state disagree"
//   pitfalls warn about for their patterns.
//
// LABEL ASSOCIATION: the visible label is rendered as an adjacent <span>,
// linked with `aria-labelledby`, not wrapped inside the <button> or into a
// <label> around an <input>. Reasons: (1) there is no underlying <input> to
// wrap, by the choice above; (2) keeping the label outside the button means
// the button's own hit target stays exactly the track's visual bounds — a
// wrapping <label> would silently grow the clickable area to cover the text
// too, which is convenient but not what this component promises its caller.
// `aria-labelledby` still gives the switch a correct accessible name either
// way.
//
// STATE IS NEVER COLOR-ONLY (WCAG 1.4.1): the thumb's track position (left
// vs. right) is itself a shape/position difference, not a color difference —
// that alone already satisfies "not conveyed by color alone". The on/off
// color change on the track is additional, not load-bearing. The optional
// "On"/"Off" caption below is a second, textual signal, kept `aria-hidden`
// so it never gets read as a competing announcement alongside "switch,
// on/off" from `aria-checked` — one spoken source of truth, one visible
// reinforcement for sighted users who don't rely on color.

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  // Shows a literal "On"/"Off" caption next to the track, always derived
  // from `checked` — never a second, independently-set piece of state that
  // could say something different from what aria-checked announces.
  showStateLabel?: boolean
}

export function Switch({ checked, onChange, label, disabled = false, showStateLabel = false }: SwitchProps) {
  const labelId = useId()

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`switch-track relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'border-primary bg-primary' : 'border-outline-variant bg-surface-container-low'
        }`}
      >
        <span
          aria-hidden="true"
          className={`block h-5 w-5 rounded-full bg-background shadow transition-transform duration-150 motion-reduce:transition-none ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span id={labelId} className="select-none text-sm text-on-surface">
        {label}
      </span>
      {showStateLabel && (
        <span aria-hidden="true" className="text-xs font-medium text-on-surface-variant">
          {checked ? 'On' : 'Off'}
        </span>
      )}
    </div>
  )
}
