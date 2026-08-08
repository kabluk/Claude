import { useEffect, useId, useRef, useState } from 'react'

// Accessible menu button — the WAI-ARIA Menu Button pattern (a button that
// opens a menu of actions, `role="menu"` / `role="menuitem"`).
//
// The one thing that makes this pattern different from Combobox, this
// library's other composite: DOM FOCUS REALLY MOVES ONTO THE MENU ITEMS.
// This is a genuine roving tabindex, the same mechanism Tabs.tsx uses — every
// item carries `tabIndex={-1}` except the one the user is "on", which gets
// `tabIndex={0}`, and moving between items calls a real `.focus()` on the
// target `<button role="menuitem">` via a ref. There is no
// `aria-activedescendant` here, and there should not be: a menu's items are
// not editable text, so nothing needs to keep the caret elsewhere the way
// Combobox's input does. Real focus is the simpler, correct choice for this
// pattern — Combobox's virtual focus is the exception forced on it by having
// a text field, not the default other composites should copy.
//
// Traps this component is built to close, in the order people hit them:
//
//   1. Focus is not "restored" to the button when it should stay put. Escape
//      and Enter/Space both close the menu and move focus back to the
//      trigger — that is correct for keyboard dismissal/activation. But a
//      mouse click outside the menu closes it too, and there focus is left
//      exactly where the click landed (the menu never owned it), and Tab
//      closes the menu and lets focus continue moving forward through the
//      page — pulling focus back to the button on every close path would
//      fight the browser's own tab order.
//   2. Opening always drops the user at index 0. The button's ArrowUp is a
//      real trap: pressing Up to open should land on the LAST item (you are
//      approaching the menu "from the bottom"), the same convention as
//      native OS menus — not a marginal nicety.
//   3. Type-ahead as a modal search box. A menu's letter search is a single
//      keystroke jumping to the next matching item, cyclically — it is not a
//      buffered multi-character filter (that is a listbox/combobox feature).
//   4. `aria-expanded` drifting from the real state because it is set in more
//      than one place. Every path that opens or closes the menu goes through
//      `open`/`close()`, so the attribute can never disagree with reality.
//
// Documented behaviour choices (the pattern allows either):
//   • Arrow keys WRAP inside the menu (last → first, first → last), matching
//     Tabs and Combobox on this site.
//   • Tab closes the menu WITHOUT re-focusing the button — APG is explicit
//     that Tab is a "move to what's next" key, not a dismiss key, so
//     hijacking it to jump focus back would fight the browser's own order.
//   • Clicking outside closes without activating a item and without forcing
//     focus anywhere — the user already told the browser where they wanted
//     to go with the click.
//
// Deliberately not animated: opening is instantaneous, matching every other
// disclosure in this library that has no motion to disable under
// prefers-reduced-motion (§35).

export interface MenuItemDef {
  label: string
  onSelect: () => void
}

export function MenuButton({ label, items }: { label: string; items: MenuItemDef[] }) {
  const baseId = useId()
  const menuId = `${baseId}-menu`
  const itemId = (i: number) => `${baseId}-item-${i}`

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const last = items.length - 1

  // Real DOM focus follows `active` while the menu is open — this is the
  // roving-tabindex move, not a highlight. Runs after every open and after
  // every arrow/Home/End/type-ahead change to `active`.
  useEffect(() => {
    if (open) itemRefs.current[active]?.focus()
  }, [open, active])

  function openMenu(startAt: number) {
    setActive(startAt)
    setOpen(true)
  }

  // `restoreFocus` distinguishes "the user asked to leave" (Escape, Enter/
  // Space activation) from "the user's click already decided where focus
  // goes" (outside click) and "the browser's own Tab order decides"  (Tab).
  function close(restoreFocus: boolean) {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }

  function activate(i: number) {
    items[i]?.onSelect()
    close(true)
  }

  // Click outside the open menu closes it without activating anything and
  // without moving focus — the click already put focus/attention somewhere.
  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      if (itemRefs.current.some((el) => el?.contains(target))) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  function onButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      openMenu(0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      openMenu(last)
    }
  }

  function onMenuKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
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
        activate(active)
        return
      case 'Escape':
        e.preventDefault()
        close(true)
        return
      case 'Tab':
        // Not preventDefault()'d — the browser is left to move focus to
        // whatever is next in tab order; the menu just closes out from under it.
        close(false)
        return
      default:
        // Type-ahead: a single printable character jumps to the next item
        // (cyclically, starting just after the current one) whose label
        // starts with it — not a buffered filter, one keystroke at a time.
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const needle = e.key.toLowerCase()
          for (let step = 1; step <= items.length; step++) {
            const i = (active + step) % items.length
            if (items[i].label.toLowerCase().startsWith(needle)) {
              e.preventDefault()
              setActive(i)
              break
            }
          }
        }
    }
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu(0))}
        onKeyDown={onButtonKeyDown}
        className="btn-ghost"
      >
        {label}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute left-0 top-full z-30 mt-1 min-w-[12rem] rounded-xl border border-outline-variant bg-surface-container-low py-1 shadow-md"
        >
          {items.map((item, i) => (
            <button
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              id={itemId(i)}
              role="menuitem"
              tabIndex={i === active ? 0 : -1}
              onKeyDown={onMenuKeyDown}
              onClick={() => activate(i)}
              className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-secondary-container hover:text-on-secondary-container focus-visible:bg-secondary-container focus-visible:text-on-secondary-container focus-visible:outline-none"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
