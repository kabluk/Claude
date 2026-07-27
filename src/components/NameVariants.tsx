import { useMemo, useState } from 'react'
import type { UIStrings } from '@/lib/types'

// Генератор вариантов написания имени (DOCS-AND-FIXES §2).
// Имя в локаторе должно совпадать буква в букву; многие находят человека
// с третьей-четвёртой попытки. Всё в браузере, никуда не отправляется.

const DIACRITICS: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n',
  Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U', Ñ: 'N',
}

const CYR: [RegExp, string[]][] = [
  [/ий$/i, ['iy', 'y', 'i']],
  [/я/gi, ['ya', 'ia']],
  [/х/gi, ['kh', 'h']],
  [/ё/gi, ['e', 'yo']],
  [/е/gi, ['e', 'ye']],
  [/ж/gi, ['zh']],
  [/ч/gi, ['ch']],
  [/ш/gi, ['sh']],
  [/щ/gi, ['shch']],
  [/ц/gi, ['ts']],
  [/ю/gi, ['yu', 'iu']],
  [/й/gi, ['y', 'i']],
  [/ы/gi, ['y']],
  [/э/gi, ['e']],
  [/ъ|ь/gi, ['']],
  [/а/gi, ['a']], [/б/gi, ['b']], [/в/gi, ['v']], [/г/gi, ['g']], [/д/gi, ['d']],
  [/з/gi, ['z']], [/и/gi, ['i']], [/к/gi, ['k']], [/л/gi, ['l']], [/м/gi, ['m']],
  [/н/gi, ['n']], [/о/gi, ['o']], [/п/gi, ['p']], [/р/gi, ['r']], [/с/gi, ['s']],
  [/т/gi, ['t']], [/у/gi, ['u']], [/ф/gi, ['f']],
]

function stripDiacritics(s: string): string {
  return s.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, (c) => DIACRITICS[c] ?? c)
}

function translitVariants(word: string): string[] {
  if (!/[а-яё]/i.test(word)) return [word]
  let results = ['']
  for (const ch of [...word]) {
    let subs: string[] | null = null
    for (const [re, alts] of CYR) {
      re.lastIndex = 0
      if (re.test(ch)) {
        subs = alts
        break
      }
    }
    const use = subs ?? [ch]
    const next: string[] = []
    for (const r of results) for (const s of use) next.push(r + s)
    results = next.slice(0, 8)
  }
  return results.map((r) => r.charAt(0).toUpperCase() + r.slice(1))
}

function buildVariants(raw: string): string[] {
  const words = raw.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return []
  const out = new Set<string>()
  const push = (arr: string[]) => {
    const s = arr.join(' ')
    if (s) out.add(s)
    const plain = stripDiacritics(s)
    if (plain !== s) out.add(plain)
  }

  push(words)
  push([...words].reverse())
  const first = words[0]
  const rest = words.slice(1)
  // каждая фамилия по отдельности — у испаноязычных их часто две
  if (rest.length > 1) {
    for (const surname of rest) {
      push([first, surname])
      push([surname, first])
    }
  }
  // без среднего имени / отчества
  if (words.length > 2) {
    push([first, words[words.length - 1]])
  }
  // транслитерация кириллицы
  if (/[а-яё]/i.test(raw)) {
    const perWord = words.map((w) => translitVariants(w))
    let combos: string[][] = [[]]
    for (const variants of perWord) {
      const next: string[][] = []
      for (const c of combos) for (const v of variants.slice(0, 3)) next.push([...c, v])
      combos = next.slice(0, 12)
    }
    for (const c of combos) {
      push(c)
      push([...c].reverse())
    }
  }
  return [...out].slice(0, 24)
}

export function NameVariants({ ui }: { ui: UIStrings }) {
  const [raw, setRaw] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const variants = useMemo(() => buildVariants(raw), [raw])

  return (
    <div className="toolbox">
      <label htmlFor="nv-in">{ui.nameVariants.label}</label>
      <input
        id="nv-in"
        type="text"
        value={raw}
        placeholder={ui.nameVariants.placeholder}
        onChange={(e) => setRaw(e.target.value)}
        autoComplete="off"
      />
      {variants.length > 0 && (
        <>
          <p className="hint" style={{ margin: '12px 0 4px' }}>
            {ui.nameVariants.hint}
          </p>
          {variants.map((v) => (
            <label key={v} className={`variant ${checked[v] ? 'done' : ''}`}>
              <input
                type="checkbox"
                checked={!!checked[v]}
                onChange={() => setChecked((c) => ({ ...c, [v]: !c[v] }))}
              />
              {v}
            </label>
          ))}
        </>
      )}
    </div>
  )
}
