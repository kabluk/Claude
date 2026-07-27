#!/usr/bin/env node
// UPL-линтер: сканирует content/** и падает при совпадении с запрещённой
// формулировкой (BUILD-SPEC §7). Принцип продукта: «карта, а не навигатор» —
// мы не говорим «вам сюда», не оцениваем и не рекомендуем.
//
// Исключение — только явное, с причиной, в той же строке или строкой выше:
//   <!-- upl-ok: прямая речь пользователя, не наша рекомендация -->
// или в TS/JS-контенте:
//   // upl-ok: причина

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const CONTENT = join(ROOT, 'content')

const PHRASES = {
  ru: [
    'вы имеете право',
    'вам следует',
    'ваш лучший вариант',
    'в вашем случае',
    'ваши шансы',
    'мы рекомендуем',
    'вам подходит',
    'вам положено',
    'дорого',
    'дёшево',
    'дешево',
    'выгодно',
    'лучший адвокат',
    'гарантируем',
  ],
  es: [
    'usted tiene derecho',
    'usted debe',
    'su mejor opción',
    'su mejor opcion',
    'en su caso',
    'sus posibilidades',
    'recomendamos',
    'le conviene',
    'usted califica',
    'caro',
    'barato',
    'garantizamos',
    'el mejor abogado',
  ],
  en: [
    'you have the right',
    'you should',
    'your best option',
    'in your case',
    'your chances',
    'we recommend',
    'you qualify',
    'you are eligible',
    'cheap',
    'expensive',
    'guarantee',
    'best attorney',
  ],
}

const ALL = Object.values(PHRASES).flat()
const OK_MARK = /upl-ok\s*:\s*\S/i

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else yield p
  }
}

// Совпадение по границам слов: "caro" не должно ловить "cárcel" или "care".
// Для кириллицы \b не работает — граница задаётся вручную.
const BOUND = 'A-Za-zÀ-ÖØ-öø-ÿА-Яа-яЁё'
const matchers = ALL.map((p) => ({
  phrase: p,
  re: new RegExp(`(?<![${BOUND}])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![${BOUND}])`, 'iu'),
}))

let violations = 0

for (const file of walk(CONTENT)) {
  if (!/\.(ts|tsx|md|json|html|txt)$/.test(file)) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const { phrase, re } of matchers) {
      if (!re.test(line)) continue
      const prev = i > 0 ? lines[i - 1] : ''
      if (OK_MARK.test(line) || OK_MARK.test(prev)) continue
      violations++
      console.error(
        `UPL ${relative(ROOT, file)}:${i + 1} — запрещённая формулировка «${phrase}»\n  ${line.trim().slice(0, 160)}`,
      )
    }
  })
}

if (violations) {
  console.error(`\nlint-upl: ${violations} нарушений. Сборка остановлена.`)
  process.exit(1)
}
console.log('lint-upl: чисто')
