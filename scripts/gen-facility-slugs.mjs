#!/usr/bin/env node
// Добавляет в content/slugs.json записи fac-<code> для каждого учреждения
// из data/directory.json: /detention/<имя-кебабом>/. Слаг один на все языки
// (имена учреждений — собственные, не переводятся). Adelanto пропускается —
// у него своя расширенная страница facility-adelanto.
// Запускать после обновления directory.json; уже существующие слаги
// не меняются, чтобы URL оставались стабильными.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SLUGS_PATH = join(ROOT, 'content/slugs.json')

const dir = JSON.parse(readFileSync(join(ROOT, 'data/directory.json'), 'utf8'))
const slugs = JSON.parse(readFileSync(SLUGS_PATH, 'utf8'))

// Расширенные учреждения со своими страницами — генерик не нужен.
const SKIP = new Set(['ADLNTCA'])

const kebab = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const taken = new Map() // slug → code, для контроля коллизий
let added = 0

for (const f of dir) {
  if (SKIP.has(f.code)) continue
  const key = `fac-${f.code}`
  if (slugs[key]) {
    taken.set(slugs[key].en, f.code)
    continue
  }
  let slug = `detention/${kebab(f.name)}`
  if (taken.has(slug)) slug = `detention/${kebab(f.name)}-${f.state.toLowerCase()}`
  if (taken.has(slug)) slug = `detention/${kebab(f.name)}-${kebab(f.city)}`
  if (taken.has(slug)) {
    console.error(`gen-facility-slugs: неразрешимая коллизия ${f.code} ↔ ${taken.get(slug)}`)
    process.exit(1)
  }
  taken.set(slug, f.code)
  slugs[key] = { en: slug, es: slug, ru: slug }
  added++
}

writeFileSync(SLUGS_PATH, JSON.stringify(slugs, null, 2) + '\n')
console.log(`gen-facility-slugs: добавлено ${added}, всего записей ${Object.keys(slugs).length}`)
