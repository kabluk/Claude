import { useEffect, useId, useRef, useState } from 'react'

// Accessible select — the WAI-ARIA Listbox pattern, "collapsible single-select
// listbox" variant (a button that opens a popup `role="listbox"`, visually a
// stand-in for a native <select> for cases where the native control cannot be
// styled to the design's requirements — the native element stays the honest
// default choice everywhere else on this site).
//
// FOCUS MECHANISM, decided and documented here because the pattern allows
// either one and this library already has a precedent for both:
//
//   • Combobox.tsx uses VIRTUAL focus (`aria-activedescendant`) because its
//     trigger is an editable text input — DOM focus must stay in the field so
//     the user keeps typing, and a real `.focus()` on an <li> would send
//     keystrokes nowhere useful. That is a constraint forced on it by having
//     an editable field, not a stylistic default.
//   • MenuButton.tsx uses REAL roving tabindex because its trigger is a
//     plain button and its items are actions, not text — nothing needs to
//     keep a caret anywhere else.
//
// This component's trigger is a <button>, exactly like MenuButton's, and
// nothing inside the popup is editable — there is no field whose caret needs
// protecting. So the constraint that forces Combobox into virtual focus does
// not apply here, and this component follows MenuButton's precedent instead:
// REAL roving tabindex. Exactly one <li role="option"> carries `tabIndex={0}`
// (the one the user is "on"); every other one carries `tabIndex={-1}`; moving
// between options calls a real `.focus()` via a ref. A screen-reader user
// arrowing through the list hears each option as it becomes actually
// focused, the same as arrowing through MenuButton's items — not a highlight
// moving under a focus that never left the button.
//
// SELECTION FOLLOWS FOCUS? No — deliberately not. APG allows either for a
// single-select listbox, and the two give different Escape behaviour:
// "selection follows focus" (the native <select> model) commits every
// option you merely arrow past, so Escape can only restore the value you
// started with by tracking a separate "value on open" snapshot. This
// component instead keeps `active` (focus, i.e. what Down/Up/Home/End/type-
// ahead move) and `selected` (the committed value, i.e. what `aria-selected`
// marks and what the button label shows) as two different pieces of state.
// Arrowing through options only moves `active`; Enter/Space copies `active`
// into `selected` and closes; Escape closes and touches nothing. That makes
// "close without changing the value" (Escape) and "close while changing it"
// (Enter/Space/click) two genuinely different code paths instead of one path
// plus a revert, and it is why a fully browsed-through option is not
// announced as selected until the user actually commits to it.
//
// Traps this component is built to close, in the order people hit them:
//
//   1. A <button> that shows the *placeholder* forever because the label
//      only reads `options[selected]` — with no selection yet, `selected` is
//      -1 and this must fall back to a visible, honest placeholder string,
//      not an empty label a screen reader announces as nothing.
//   2. Opening always drops focus on option 0. Re-opening a select that
//      already has a value should land the user back on that value — losing
//      your place every time you reopen a 40-item list is the single most
//      reported native-<select>-replacement complaint.
//   3. `aria-expanded` drifting out of sync because it is written in more
//      than one place. Every open/close path here funnels through
//      `openListbox()`/`close()`, exactly like MenuButton.
//   4. Outside click closing the popup by re-stealing focus back onto the
//      button. The click already told the browser where the user's
//      attention is going — see MenuButton's identical reasoning.
//
// Documented behaviour choices (the pattern allows either):
//   • Arrow keys WRAP inside the popup (last → first, first → last),
//     matching Tabs, Combobox and MenuButton on this site.
//   • Type-ahead is a single keystroke jumping to the next option starting
//     with that letter, cyclically — the MenuButton convention, not
//     Combobox's buffered multi-character filter (nothing here is filtered;
//     the full option list is always present).
//   • Clicking outside closes without changing the selection and without
//     forcing focus anywhere, matching MenuButton.
//
// Deliberately not animated: opening is instantaneous, matching every other
// disclosure in this library that has no motion to disable under
// prefers-reduced-motion (§35).

export interface ListboxSelectOption {
  value: string
  label: string
  /** Optional secondary text (e.g. a scope) shown at the end of the row. */
  hint?: string
}

export function ListboxSelect({
  label,
  options,
  placeholder = 'Select an option…',
  onSelect,
}: {
  label: string
  options: ListboxSelectOption[]
  placeholder?: string
  onSelect?: (option: ListboxSelectOption) => void
}) {
  const baseId = useId()
  const labelId = `${baseId}-label`
  const buttonId = `${baseId}-button`
  const listboxId = `${baseId}-listbox`
  const optionId = (i: number) => `${baseId}-option-${i}`

  const [open, setOpen] = useState(false)
  // Committed value: -1 means "nothing chosen yet" — the honest placeholder
  // state, distinct from an empty string that would look like a bug.
  const [selected, setSelected] = useState(-1)
  // Real DOM focus target while the popup is open (roving tabindex).
  const [active, setActive] = useState(-1)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLLIElement | null)[]>([])
  const last = options.length - 1

  // Real focus follows `active` — this is the roving-tabindex move itself,
  // not a highlight. Runs after opening and after every arrow/Home/End/
  // type-ahead change.
  useEffect(() => {
    if (open && active >= 0) optionRefs.current[active]?.focus()
  }, [open, active])

  function openListbox() {
    // Land on the current selection so re-opening never loses your place;
    // only fall back to the first option when nothing is selected yet.
    setActive(selected >= 0 ? selected : 0)
    setOpen(true)
  }

  // `restoreFocus` distinguishes "the user asked to leave" (Escape,
  // Enter/Space commit) from "the user's click already decided where focus
  // goes" (outside click) — same distinction MenuButton makes.
  function close(restoreFocus: boolean) {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }

  function commit(i: number) {
    const option = options[i]
    if (!option) return
    setSelected(i)
    close(true)
    onSelect?.(option)
  }

  // Click outside the open popup closes it without changing the selection
  // and without moving focus — the click already told the browser where the
  // user's attention is going.
  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      if (optionRefs.current.some((el) => el?.contains(target))) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  function onButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault()
        openListbox()
        return
    }
  }

  function onOptionKeyDown(e: React.KeyboardEvent<HTMLLIElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive(active === last ? 0 : active + 1)
        return
      case 'ArrowUp':
        e.preventDefault()
        setActive(active === 0 ? last : active - 1)
        return
      case 'Home':
        e.preventDefault()
        setActive(0)
        return
      case 'End':
        e.preventDefault()
        setActive(last)
        return
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(active)
        return
      case 'Escape':
        e.preventDefault()
        // Dismiss only: the committed selection is untouched.
        close(true)
        return
      default:
        // Type-ahead: a single printable character jumps to the next option
        // (cyclically, starting just after the focused one) whose label
        // starts with it — a single keystroke, not a buffered filter.
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const needle = e.key.toLowerCase()
          for (let step = 1; step <= options.length; step++) {
            const i = (active + step) % options.length
            if (options[i].label.toLowerCase().startsWith(needle)) {
              e.preventDefault()
              setActive(i)
              break
            }
          }
        }
    }
  }

  const current = selected >= 0 ? options[selected] : undefined

  return (
    <div className="relative inline-block max-w-sm">
      {/* A <span>, not a <label htmlFor>: labels only associate with form
          controls, and a button here is not one. aria-labelledby on the
          button below joins this text with the button's own visible value,
          the same two-id pattern the ARIA APG collapsible-listbox example
          uses, so the announced name is "<label> <current value or
          placeholder>" — never just a bare "button". */}
      <span id={labelId} className="block text-sm font-medium text-on-surface">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        id={buttonId}
        aria-haspopup="listbox"
        aria-expanded={open}
        // Pointed at the popup only while it exists — an aria-controls that
        // references a removed id is a broken relationship, not a harmless
        // one (same rule as Combobox/MenuButton's aria-controls).
        aria-controls={open ? listboxId : undefined}
        aria-labelledby={`${labelId} ${buttonId}`}
        onClick={() => (open ? close(false) : openListbox())}
        onKeyDown={onButtonKeyDown}
        className="input mt-1 flex w-full items-center justify-between gap-3 text-left"
      >
        <span className={current ? 'text-on-surface' : 'text-on-surface-variant'}>
          {current ? current.label : placeholder}
        </span>
        <span aria-hidden="true" className="text-on-surface-variant">
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-outline-variant bg-surface-container-low py-1 shadow-md"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={optionId(i)}
              role="option"
              aria-selected={i === selected}
              tabIndex={i === active ? 0 : -1}
              ref={(el) => {
                optionRefs.current[i] = el
              }}
              onKeyDown={onOptionKeyDown}
              onClick={() => commit(i)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 text-sm focus-visible:outline-none ${
                i === selected
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface hover:bg-secondary-container hover:text-on-secondary-container focus-visible:bg-secondary-container focus-visible:text-on-secondary-container'
              }`}
            >
              <span>{o.label}</span>
              {o.hint && <span className="num text-xs text-on-surface-variant">{o.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
