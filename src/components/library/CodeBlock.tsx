import { CopyButton } from './CopyButton'

// A code block with a working copy button. The code is shown verbatim — for the
// library pages it is the real source of the component imported with Vite's
// ?raw, so what a reader copies is exactly what runs, and it cannot drift out of
// sync with the live example above it.
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-outline-variant">
      <figcaption className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-3 py-2">
        <span className="font-mono text-xs text-on-surface-variant">{label ?? 'Source'}</span>
        <CopyButton text={code} />
      </figcaption>
      {/* tabIndex 0 gives keyboard users access to the horizontal scroll of a
          long line (axe: scrollable-region-focusable); the label names the
          region for assistive tech. */}
      <pre
        tabIndex={0}
        role="group"
        aria-label={`${label ?? 'Source'} code`}
        className="overflow-x-auto bg-surface p-4 text-[0.8rem] leading-relaxed"
      >
        <code className="font-mono text-on-surface">{code}</code>
      </pre>
    </figure>
  )
}
