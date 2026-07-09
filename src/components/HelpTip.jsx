import { useEffect, useRef, useState } from 'react'

// "?" icon that reveals a short explanation + example for a field.
export default function HelpTip({ help, example, exampleLabel, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span className="help" ref={ref}>
      <button
        type="button"
        className="help__btn"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ?
      </button>
      {open && (
        <span className="help__pop" role="tooltip">
          <span className="help__text">{help}</span>
          {example && (
            <span className="help__ex">
              <b>{exampleLabel}</b> {example}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
