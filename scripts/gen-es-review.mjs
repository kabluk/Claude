#!/usr/bin/env node
// Собирает docs/ES-review-packet.md — испанские тексты на вычитку носителем.
// Читает исходники, поэтому пакет всегда соответствует коду: после внесения
// правок достаточно перезапустить скрипт, и вычитанные страницы уходят из
// списка, а изменённые строки обновляются.
//
// Страницу, прошедшую вычитку, добавить в REVIEWED — она исчезнет из пакета.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const ES = join(ROOT, 'content/es')
const OUT = join(ROOT, 'docs/ES-review-packet.md')

// Вычитано носителем — в пакет не попадает. Формат: ['имя файла без .ts', 'дата'].
const REVIEWED = [
  ['home', '16.08.2026'],
  ['firstcall', '16.08.2026'],
  ['connect', '16.08.2026'],
  ['prepare', '16.08.2026'],
  ['deadlines', '16.08.2026'],
  ['habeas', '16.08.2026'],
  ['journey', '16.08.2026'],
]

// Человеческие названия разделов; для остальных берётся title из файла.
const NAMES = {
  ui: 'Строки интерфейса',
  legal: 'Служебные страницы (о сервисе, данные, дисклеймер)',
  journey: 'Маршрут (12 шагов)',
  directory: 'Справочник: штаты и учреждения',
  intake: 'Опрос и задачи',
}

// Служебные значения, которые не являются текстом для читателя.
const CODE_TOKENS = new Set([
  'callout', 'p', 'h2', 'list', 'steps', 'fields', 'ext', 'ilink', 'onward',
  'memcard', 'phones', 'tool', 'print', 'officefinder', 'visitfinder', 'docpack',
  'r', 'y', 'g', 'n', 'self', 'other', 'en', 'es', 'ru',
])

const isProse = (s) => {
  if (!s || s.length < 4) return false
  if (/^https?:\/\//.test(s)) return false // ссылки
  if (CODE_TOKENS.has(s)) return false
  if (/^[a-z][a-z0-9_-]*$/.test(s)) return false // ключи страниц, slug'и
  if (/^[A-Z_]+$/.test(s) && !s.includes(' ')) return false // константы
  if (!/[a-záéíóúüñ]/i.test(s)) return false // без букв — числа, символы
  return s.includes(' ') || s.length > 14
}

// Достаёт строковые литералы, сохраняя порядок появления в файле.
function strings(src) {
  const out = []
  const re = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g
  let m
  while ((m = re.exec(src))) {
    const raw = (m[1] ?? m[2]).replace(/\\'/g, "'").replace(/\\n/g, ' / ')
    if (isProse(raw)) out.push(raw)
  }
  return [...new Set(out)] // повторы (один текст в нескольких местах) — один раз
}

const reviewedNames = new Set(REVIEWED.map(([f]) => f))
const files = readdirSync(ES)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => f.replace(/\.ts$/, ''))
  .filter((f) => !reviewedNames.has(f))
  .sort()

const sections = []
let total = 0

for (const name of files) {
  const src = readFileSync(join(ES, `${name}.ts`), 'utf8')
  const items = strings(src)
  if (!items.length) continue
  total += items.length
  const titleMatch = src.match(/^\s*title:\s*'([^']+)'/m)
  const human = NAMES[name] ?? titleMatch?.[1] ?? name
  sections.push(
    `## ${human}  (\`es/${name}.ts\`)\n\n${items.map((s) => `- ${s}`).join('\n')}`,
  )
}

// Опрос лежит отдельно от страниц.
if (!reviewedNames.has('intake')) {
  const items = strings(readFileSync(join(ROOT, 'content/intake/es.ts'), 'utf8'))
  total += items.length
  sections.push(`## ${NAMES.intake}  (\`content/intake/es.ts\`)\n\n${items.map((s) => `- ${s}`).join('\n')}`)
}

// Заметки по штатам живут в данных, а не в контенте.
const states = JSON.parse(readFileSync(join(ROOT, 'data/states.json'), 'utf8'))
const stateNotes = states.filter((s) => s.notes?.es).map((s) => `- **${s.code}:** ${s.notes.es}`)
const orgNotes = states.flatMap((s) =>
  (s.orgs ?? []).filter((o) => o.note?.es).map((o) => `- **${s.code} · ${o.name}:** ${o.note.es}`),
)
const stateSection = [...stateNotes, ...orgNotes]
if (stateSection.length) {
  total += stateSection.length
  sections.push(`## Заметки по штатам и организации помощи  (\`data/states.json\`)\n\n${stateSection.join('\n')}`)
}

const doneLine = REVIEWED.map(([f, d]) => `\`es/${f}.ts\` (${d})`).join(', ')

const md = `# Пакет ES-контента на вычитку носителем

Собран автоматически: \`node scripts/gen-es-review.mjs\`. Пакет читает исходники,
поэтому всегда соответствует текущему сайту.

**Целевой диалект:** US Spanish (мексиканский/центральноамериканский) —
читатели живут в США. НЕ español de España.

**Регистр:** везде **usted**, без исключений. Императивы формы \`tú\`
(\`Responde\`, \`Recibe\`, \`Sigue\`) — ошибка.

**Аудитория и тон:** семьи людей, задержанных иммиграционной службой, часто
в первые часы после задержания. Нужен спокойный, конкретный, человеческий
язык — не юридический и не корпоративный.

**Важно:** мы не даём юридических советов. Формулировки вида «вы имеете
право», «вам следует», «мы рекомендуем», «ваш лучший вариант» недопустимы
по построению продукта — если такая фраза встретится, это ошибка, сообщите.

**Уже вычитано (в пакет не входит):** ${doneLine}.

**Частично вычитано:** \`content/intake/es.ts\` — носитель нашёл там отдельные
ошибки (регистр в скрипте разговора, кальки), они исправлены, но файл самый
большой и остаётся в пакете целиком. Это самый важный раздел: опрос формирует
персональный список задач, его читают все.

На главной странице носитель нашёл такие кальки с английского — их стоит
искать и здесь:

| Было | Стало |
|---|---|
| pago perdido | pago atrasado |
| resultado vacío | cuando no aparece en el sistema |
| dice para qué es | indica para qué sirve |
| sobre qué callar | qué no decir |
| abogados concretos | abogados específicos |
| arreglar el contacto | establecer contacto |
| sale su mensaje | se le notifica |
| fondear la cuenta | recargar la cuenta |
| gente viva de al lado | personas que tiene cerca |
| el juego largo | el proceso a largo plazo |
| transcripciones de impuestos | declaraciones de impuestos |
| talones de pago | recibos de nómina |
| verificación de entrada | verificación de inicio de sesión |
| no es por fuga | no es por evadir a la corte |
| jurista | abogado |
| pasta blanda | pasta suave |
| billetera | cartera |
| bodega (= магазин в мекс.) | almacén de depósito (storage) |

Ниже — ${total} фрагментов по разделам. Отмечать нужно только те, где текст
звучит неестественно или неверно; остальное можно пропускать.

**Если времени мало — порядок важности.** Первые три раздела люди читают
в первые часы после задержания, ошибка там дороже всего:

1. \`es/where.ts\` — как найти человека
2. \`es/firstcall.ts\` — первый звонок
3. \`es/documents.ts\` — что означают бумаги и что не подписывать
4. \`es/connect.ts\`, \`es/visit.ts\` — связь и свидания
5. \`content/intake/es.ts\` — опрос (самый объёмный раздел)
6. остальное — справочники, служебные страницы, интерфейс

---

${sections.join('\n\n---\n\n')}
`

writeFileSync(OUT, md)
console.log(`gen-es-review: ${total} фрагментов, ${sections.length} разделов → docs/ES-review-packet.md`)
