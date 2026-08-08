import { cloneElement, useEffect, useId, useRef, useState, type ReactElement } from 'react'

// Accessible tooltip — the WAI-ARIA Tooltip pattern (role="tooltip" +
// aria-describedby), built around the trap that breaks most hand-rolled
// tooltips: showing it only on `mouseover`. A mouse-only trigger is invisible
// to anyone who navigates by keyboard, so this component shows on FOCUS as
// well as hover — focus is the primary trigger, hover is additive, never a
// replacement.
//
// `content` is a plain string, not a slot for arbitrary children — on purpose.
// A tooltip is a supplementary label, not a container: if what you want to
// show needs its own interactive elements (a link, a button), the ARIA
// tooltip role does not support that and the right pattern is a popover, not
// a tooltip. Enforcing `string` here makes that limitation impossible to
// violate by accident.
//
// Three requirements this component is built to satisfy, none of them
// optional (this is the whole teaching point of the pattern):
//
//   1. Focus AND hover both trigger it (not hover-only).
//   2. Escape hides the tooltip without moving focus off the trigger
//      (WCAG 1.4.13, "dismissible" — the user stays exactly where they were).
//   3. Hoverable + persistent (WCAG 1.4.13): moving the pointer from the
//      trigger onto the tooltip itself must not make it disappear, and it
//      must not vanish on its own timer while still hovered or focused. A
//      short grace period on mouseleave gives the pointer time to travel
//      from the trigger onto the tooltip; the tooltip's own mouseenter
//      cancels that timer.

export function Tooltip({ content, children }: { content: string; children: ReactElement }) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const show = () => {
    clearHideTimer()
    setOpen(true)
  }

  // Grace period, not an immediate hide — WCAG 1.4.13 "hoverable": the
  // pointer needs time to travel from the trigger onto the tooltip bubble
  // without the tooltip closing out from under it.
  const scheduleHide = () => {
    clearHideTimer()
    hideTimer.current = setTimeout(() => setOpen(false), 150)
  }

  const hideNow = () => {
    clearHideTimer()
    setOpen(false)
  }

  useEffect(() => clearHideTimer, [])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      // Dismiss the tooltip only — focus deliberately stays on the trigger.
      // A tooltip that steals focus on Escape defeats its own purpose: the
      // user was never doing anything else, they were just reading a label.
      hideNow()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const trigger = cloneElement(children, {
    'aria-describedby': open ? tooltipId : undefined,
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e)
      show()
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e)
      hideNow()
    },
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e)
      show()
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e)
      scheduleHide()
    },
  } as Record<string, unknown>)

  return (
    <span className="relative inline-block">
      {trigger}
      {open && (
        <span
          role="tooltip"
          id={tooltipId}
          // Hoverable: the bubble itself also cancels a pending hide, so the
          // pointer can rest on the tooltip text (e.g. to select it) without
          // it closing.
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
          className="absolute left-1/2 top-full z-50 mt-2 w-max max-w-[16rem] -translate-x-1/2 rounded-md border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-xs text-on-surface shadow-md"
        >
          {content}
        </span>
      )}
    </span>
  )
}
