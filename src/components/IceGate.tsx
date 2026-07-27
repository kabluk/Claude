import { useState } from 'react'
import type { UIStrings } from '@/lib/types'

// Промежуточный экран перед переходом на сайт ICE (DOCS-AND-FIXES §4).
// Сайт ведомства по собственному уведомлению записывает IP и домен посетителя.
// Referrer-Policy: no-referrer — откуда пришёл человек, мы не сообщаем.
export function IceGate({ href, label, ui }: { href: string; label: string; ui: UIStrings }) {
  const [open, setOpen] = useState(false)
  const [askMode, setAskMode] = useState(false)

  return (
    <>
      <button className="ghost" type="button" onClick={() => setOpen(true)}>
        {label} ↗
      </button>
      {open && (
        <div className="gate" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="gate-in" onClick={(e) => e.stopPropagation()}>
            <h3>{ui.iceGate.title}</h3>
            {ui.iceGate.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {askMode && (
              <p>
                {ui.iceGate.askHint} <code>{href}</code>
              </p>
            )}
            <a
              className="cta"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              {ui.iceGate.open} ↗
            </a>{' '}
            <button className="ghost" type="button" onClick={() => setAskMode(true)}>
              {ui.iceGate.ask}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
