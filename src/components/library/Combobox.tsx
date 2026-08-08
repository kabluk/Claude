import { useEffect, useId, useRef, useState } from 'react'

// Accessible combobox — the WAI-ARIA 1.2 Combobox pattern (editable text input
// + filtered listbox popup, single select, `aria-autocomplete="list"`).
//
// The one thing that makes this pattern different from every other composite in
// this library: DOM FOCUS NEVER LEAVES THE INPUT. The options are not focusable
// and there is no roving tabindex here (that is the Tabs pattern). The option
// the arrow keys are "on" is pointed at by `aria-activedescendant` on the input
// — a *virtual* focus that screen readers announce as if it were real, while
// the caret stays in the text field. That is not a stylistic preference, it is
// the only arrangement that works: an editable combobox must keep accepting
// keystrokes while the user walks the list, and real focus on an <li> would
// send those keystrokes somewhere the user cannot type. Every "combobox" that
// calls `option.focus()` breaks typing after the first arrow key, and every one
// that draws a highlight without `aria-activedescendant` leaves a screen-reader
// user with a list they are silently moving through.
//
// The traps this component is built to close, in the order people hit them:
//
//   1. Virtual focus, not real focus — see above. The highlight is a data
//      attribute; the announcement is `aria-activedescendant`. Because nothing
//      is really focused, the browser will not scroll the active option into
//      view either, so we do it ourselves.
//   2. Mouse selection vs. blur. `blur` closes the popup, and `mousedown` on an
//      option fires BEFORE `click` — so a naive implementation closes the popup
//      out from under the pointer and the click never lands. The options
//      `preventDefault()` on mousedown, which keeps focus on the input and lets
//      the click do its job.
//   3. `autoComplete="off"`. The browser's own autofill dropdown renders over
//      our popup and is driven by a different keyboard, so the user sees two
//      lists reacting to the same arrow keys.
//   4. Escape closes without selecting AND without moving focus or clearing the
//      field (the same dismissible principle as the Tooltip). Escape means "get
//      this popup out of my way", never "throw away what I typed".
//   5. An empty filter result is a sentence, not an empty box and not a fake
//      option. A "No matches" <li role="option"> is announced as "option 1 of
//      1" and can be *selected* — a value the user never chose. Here the empty
//      state is a `role="status"` line, so it is announced politely as the user
//      types and cannot be picked.
//
// Documented behaviour choices (the pattern allows either):
//   • Arrow keys WRAP (last → first, first → last), matching Tabs on this site.
//   • Home/End jump to the first/last *visible* option while the popup is open;
//     when it is closed they keep their normal meaning and move the caret.
//   • Typing never auto-activates the first match. Enter must commit something
//     the user actually moved to — auto-activation makes Enter select a value
//     nobody looked at, and re-announces a new "focused" option on every
//     keystroke.
//   • Re-opening after a selection (the field still holds the chosen label)
//     shows the whole list again, so the user can change their mind without
//     first deleting text.
//
// Deliberately not animated: the popup appears while the user is typing, and
// motion under the caret costs more than it adds (§35 — no decorative motion,
// nothing here would need it disabled under prefers-reduced-motion).

export interface ComboboxOption {
  value: string
  label: string
  /** Optional secondary text (e.g. a count) shown at the end of the row. */
  hint?: string
}

export function Combobox({
  label,
  options,
  placeholder,
  emptyMessage = 'No matches',
  onSelect,
}: {
  label: string
  options: ComboboxOption[]
  placeholder?: string
  emptyMessage?: string
  onSelect?: (option: ComboboxOption) => void
}) {
  const baseId = useId()
  const inputId = `${baseId}-input`
  const popupId = `${baseId}-popup`
  const optionId = (i: number) => `${baseId}-option-${i}`

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ComboboxOption | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const optionRefs = useRef<(HTMLLIElement | null)[]>([])

  const needle = query.trim().toLowerCase()
  // Show everything when the field is empty, and also when it still holds the
  // label of the current selection — otherwise re-opening after a choice shows
  // a list of exactly one item, the one already chosen.
  const showAll = needle === '' || (selected !== null && query === selected.label)
  const matches = showAll ? options : options.filter((o) => o.label.toLowerCase().includes(needle))

  // The stored index can outlive the list it pointed into (the filter narrows
  // as you type), so the index used for rendering is always re-validated here.
  // An out-of-range index means "nothing is active" — never a stale highlight
  // and never an aria-activedescendant pointing at an id that is gone.
  const activeIndex = active >= 0 && active < matches.length ? active : -1

  // Nothing is really focused, so the browser will not scroll for us.
  useEffect(() => {
    if (!open || activeIndex < 0) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  function close() {
    setOpen(false)
    setActive(-1)
  }

  function commit(i: number) {
    const option = matches[i]
    if (!option) return
    setSelected(option)
    setQuery(option.label)
    close()
    onSelect?.(option)
    // No .focus() call: focus was on the input the whole time, including for a
    // mouse click (the option's mousedown handler prevented the blur).
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        if (!open) {
          setOpen(true)
          // Alt+ArrowDown opens the popup without moving into it — the ARIA
          // convention for "show me the list, I am not choosing yet".
          setActive(e.altKey ? -1 : 0)
          return
        }
        if (matches.length === 0) return
        setActive(activeIndex >= matches.length - 1 ? 0 : activeIndex + 1)
        return
      }
      case 'ArrowUp': {
        e.preventDefault()
        if (!open) {
          setOpen(true)
          setActive(matches.length - 1)
          return
        }
        if (matches.length === 0) return
        setActive(activeIndex <= 0 ? matches.length - 1 : activeIndex - 1)
        return
      }
      case 'Home':
      case 'End': {
        // Only while the popup is open; closed, these belong to the text field.
        if (!open || matches.length === 0) return
        e.preventDefault()
        setActive(e.key === 'Home' ? 0 : matches.length - 1)
        return
      }
      case 'Enter': {
        if (!open) return
        // preventDefault even when nothing is active: Enter with an open popup
        // must not submit the surrounding form behind the user's back.
        e.preventDefault()
        if (activeIndex >= 0) commit(activeIndex)
        else close()
        return
      }
      case 'Escape': {
        if (!open) return
        e.preventDefault()
        // Dismiss only: the value stays, and so does focus.
        close()
        return
      }
    }
  }

  return (
    <div className="relative max-w-sm">
      <label htmlFor={inputId} className="block text-sm font-medium text-on-surface">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        // Pointed at the popup only while it exists — an aria-controls that
        // references a removed id is a broken relationship, not a harmless one.
        aria-controls={open ? popupId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        // The browser's own autofill list would render over this popup and
        // answer the same arrow keys — two dropdowns, one keyboard.
        autoComplete="off"
        spellCheck={false}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        // Clicking an option does not blur the input (see the option's
        // mousedown), so a blur here really is the user leaving: close without
        // selecting anything.
        onBlur={close}
        className="input mt-1 w-full"
      />

      {open &&
        (matches.length > 0 ? (
          <ul
            id={popupId}
            role="listbox"
            aria-label={label}
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-outline-variant bg-surface-container-low py-1 shadow-md"
          >
            {matches.map((o, i) => (
              <li
                key={o.value}
                id={optionId(i)}
                role="option"
                aria-selected={i === activeIndex}
                data-active={i === activeIndex ? '' : undefined}
                ref={(el) => {
                  optionRefs.current[i] = el
                }}
                // Keeps focus on the input so the click below can land, and so
                // the popup does not close before it does.
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => setActive(i)}
                onClick={() => commit(i)}
                className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 text-sm ${
                  i === activeIndex
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface'
                }`}
              >
                <span>{o.label}</span>
                {o.hint && <span className="num text-xs text-on-surface-variant">{o.hint}</span>}
              </li>
            ))}
          </ul>
        ) : (
          // A sentence, not an empty listbox and not a selectable "no results"
          // option. role="status" announces it politely while the user keeps
          // typing, and there is nothing here to accidentally choose.
          <p
            id={popupId}
            role="status"
            className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant shadow-md"
          >
            {emptyMessage} for “{query.trim()}”.
          </p>
        ))}
    </div>
  )
}
