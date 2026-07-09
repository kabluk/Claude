import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import Flag from './Flag.jsx'

// Prominent header language selector: flag + native name, persisted choice.
export default function LanguageSwitcher() {
  const { lang, setLang, langs } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
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
  }, [])

  const current = langs.find((l) => l.code === lang) || langs[0]

  return (
    <div className="lang" ref={ref}>
      <button
        type="button"
        className="lang__btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
      >
        <Flag code={current.code} className="lang__flag" />
        <span className="lang__name">{current.native}</span>
        <span className={`lang__caret ${open ? 'is-open' : ''}`}>▾</span>
      </button>

      {open && (
        <ul className="lang__menu" role="listbox">
          {langs.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                className={`lang__item ${l.code === lang ? 'is-active' : ''}`}
                role="option"
                aria-selected={l.code === lang}
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
              >
                <Flag code={l.code} className="lang__flag" />
                <span className="lang__item-name">{l.native}</span>
                {l.code === lang && <span className="lang__check">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
