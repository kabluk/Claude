import { Fragment } from 'react'

// Минимальная inline-разметка контента: `текст` → <code>.
export function Inline({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <code key={i}>{p}</code> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  )
}
