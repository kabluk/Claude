import { useCallback, useRef, useState } from 'react'

// Accessible toast / status message — the WAI-ARIA live-region pattern.
//
// A toast tells the user something happened WITHOUT moving focus — that is what
// separates it from a dialog. The user is never yanked out of what they were
// doing; the message is announced by the screen reader in the background. Two
// things make that actually work, and both are invisible if you only read the
// visible markup:
//
//   1. The live region is in the DOM from the start — empty, waiting. A screen
//      reader only announces *changes* to a region it is already watching. If
//      the region and its first message mount together, the change is often
//      missed entirely. So <ToastRegion> is always rendered; only the toast
//      items inside it come and go. This is the single most common reason
//      hand-rolled toasts "work on screen but say nothing".
//   2. Politeness matches urgency. role="status" (an implicit aria-live
//      "polite") waits for a natural pause — correct for success/info.
//      role="alert" (implicit "assertive") interrupts immediately — reserved
//      for errors that genuinely need attention now. Both are used here, each
//      in its own always-present region.
//
// Dismissal policy is itself an accessibility decision (WCAG 2.2.1, Timing
// Adjustable): a polite status auto-clears after a few seconds, but an error
// (alert) stays until the user dismisses it — a message someone has to act on
// must not disappear on a timer. Nothing critical ever lives *only* inside an
// auto-dismissing toast.
//
// The visible entrance is a few-pixel rise (transform-only), removed entirely
// under prefers-reduced-motion — the meaning is carried by the role and the
// text, never by motion.

export type ToastTone = 'status' | 'alert'

export interface ToastMsg {
  id: number
  message: string
  tone: ToastTone
}

export interface NotifyOptions {
  tone?: ToastTone
  // Milliseconds until auto-dismiss, or null to stay until dismissed by hand.
  // Default: alerts persist (null), polite status messages clear after 5s.
  duration?: number | null
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const idRef = useRef(0)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (message: string, opts: NotifyOptions = {}) => {
      const tone = opts.tone ?? 'status'
      const duration = opts.duration === undefined ? (tone === 'alert' ? null : 5000) : opts.duration
      const id = ++idRef.current
      setToasts((list) => [...list, { id, message, tone }])
      if (duration != null) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        )
      }
      return id
    },
    [dismiss],
  )

  return { toasts, notify, dismiss }
}

function ToastItem({ toast, onDismiss }: { toast: ToastMsg; onDismiss: (id: number) => void }) {
  const isAlert = toast.tone === 'alert'
  return (
    <div
      className={`toast-item flex items-start gap-3 rounded-xl border p-3 shadow-md ${
        isAlert
          ? 'border-[color:var(--color-critical-border)] bg-[color:var(--color-critical-soft)]'
          : 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-soft)]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${isAlert ? 'text-[color:var(--color-critical)]' : 'text-[color:var(--color-success)]'}`}
      >
        {isAlert ? (
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 5v3.5M8 11h.01" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M5.25 8.25 7 10l3.75-4.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <p className="flex-1 text-sm text-[color:var(--color-on-surface)]">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-lg p-1 text-on-surface-variant hover:bg-black/5 hover:text-on-surface"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// Always-rendered live regions. The outer element is present from first paint,
// so assistive tech is already watching when a toast is inserted. Alerts sit in
// an assertive region, polite status messages in their own polite region.
export function ToastRegion({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  const alerts = toasts.filter((t) => t.tone === 'alert')
  const statuses = toasts.filter((t) => t.tone === 'status')
  return (
    <div className="toast-viewport pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      <div role="alert" aria-live="assertive" aria-atomic="false" className="flex flex-col gap-2 [&>*]:pointer-events-auto">
        {alerts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
      <div role="status" aria-live="polite" aria-atomic="false" className="flex flex-col gap-2 [&>*]:pointer-events-auto">
        {statuses.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  )
}
