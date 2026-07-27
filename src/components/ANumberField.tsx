import { useState } from 'react'
import type { UIStrings } from '@/lib/types'

// A-Number бывает 8 или 9 цифр: дополняем нулями в начале (DOCS-AND-FIXES §3).
// Номер есть на браслете — можно попросить прочитать вслух.
export function ANumberField({ ui }: { ui: UIStrings }) {
  const [digits, setDigits] = useState('')
  const [copied, setCopied] = useState(false)

  const clean = digits.replace(/\D/g, '').slice(0, 9)
  const full = clean.length >= 8 ? `A${clean.padStart(9, '0')}` : null

  async function copy() {
    if (!full) return
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard недоступен — номер виден на экране, можно переписать
    }
  }

  return (
    <div className="toolbox">
      <label htmlFor="an-in">{ui.aNumber.label}</label>
      <input
        id="an-in"
        type="text"
        inputMode="numeric"
        value={digits}
        placeholder={ui.aNumber.placeholder}
        onChange={(e) => setDigits(e.target.value)}
        autoComplete="off"
      />
      {full && (
        <div className="anum-out">
          <span className="val">{full}</span>
          <button className="ghost" type="button" onClick={copy}>
            {copied ? ui.aNumber.copied : ui.aNumber.copy}
          </button>
        </div>
      )}
      <p className="hint" style={{ margin: '10px 0 0' }}>
        {ui.aNumber.hint}
      </p>
    </div>
  )
}
