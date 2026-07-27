#!/usr/bin/env node
// Линтер минимизации данных: персональные данные на сервер не уходят никогда,
// поэтому полей для их сбора в коде и контенте быть не должно (BUILD-SPEC §7).
// Запрещены поля name · address · dob · status · a_number вне справочников
// (data/** — публичные данные учреждений и судов, там name и address легальны).
//
// Ловим ключи объектов и имена полей форм, а не слова в прозе:
//   "name": …   name: …   name=("|')…   <input … name="dob"
// Исключение — только явное, с причиной, в той же строке или строкой выше:
//   // min-ok: причина

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SCAN = ['src', 'content'].map((d) => join(ROOT, d))

const FIELDS = ['name', 'address', 'dob', 'status', 'a_number']
const OK_MARK = /min-ok\s*:\s*\S/i

const keyRe = new RegExp(
  `(?:["'](${FIELDS.join('|')})["']\\s*:|(?<![\\w$])(${FIELDS.join('|')})\\s*:(?!//)|name\\s*=\\s*["'](${FIELDS.join('|')})["'])`,
)

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else yield p
  }
}

let violations = 0

for (const dir of SCAN) {
  for (const file of walk(dir)) {
    if (!/\.(ts|tsx|js|jsx|json|html)$/.test(file)) continue
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const m = keyRe.exec(line)
      if (!m) return
      const prev = i > 0 ? lines[i - 1] : ''
      if (OK_MARK.test(line) || OK_MARK.test(prev)) return
      violations++
      const field = m[1] || m[2] || m[3]
      console.error(
        `MINIMIZE ${relative(ROOT, file)}:${i + 1} — поле «${field}» вне справочников\n  ${line.trim().slice(0, 160)}`,
      )
    })
  }
}

if (violations) {
  console.error(`\nlint-minimize: ${violations} нарушений. Сборка остановлена.`)
  process.exit(1)
}
console.log('lint-minimize: чисто')
