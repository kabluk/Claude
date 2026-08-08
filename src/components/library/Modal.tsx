import { useEffect, useId, useRef, type ReactNode } from 'react'

// Accessible modal dialog — the WAI-ARIA Dialog (Modal) pattern.
//
// Controlled by `open` / `onClose`. When open it renders role="dialog" with
// aria-modal="true" and an aria-labelledby pointing at its title. Three things
// make it actually usable, and all three are things static markup cannot give
// you — they are verified live with Playwright, not just by reading the code:
//
//   1. Focus moves into the dialog on open (to the first focusable element).
//   2. Focus is trapped: Tab and Shift+Tab cycle within the dialog and never
//      reach the page behind it.
//   3. On close — whether by the close button, the Escape key, or a backdrop
//      click — focus returns to the element that opened the dialog.
//
// The keydown listener is attached in the capture phase so Escape and the Tab
// trap win even if something inside the dialog also handles those keys.

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // The element that had focus when the dialog opened — the trigger. Captured
    // here (not from a prop) so focus returns to whatever actually opened it.
    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    focusables()[0]?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      // Wrap at both ends, and pull focus back in if it has somehow escaped.
      if (e.shiftKey && (active === first || !dialog?.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !dialog?.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      // Restore focus to the trigger on any close path (button, Escape, backdrop).
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={(e) => {
        // Backdrop click closes; clicks inside the dialog do not bubble here.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-panel w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-[color:var(--color-ink)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 12 12" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="mt-3 text-sm text-slate-600">{children}</div>
      </div>
    </div>
  )
}
