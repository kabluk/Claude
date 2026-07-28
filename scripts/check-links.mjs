#!/usr/bin/env node
// Проверка внутренних ссылок по собранному сайту: каждый href, ведущий
// внутрь, должен разрешаться в существующий файл dist/. Ловит битые
// слаги, опечатки в pathFor и ссылки на неснятые страницы.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* htmlFiles(p)
    else if (name.endsWith('.html')) yield p
  }
}

function resolves(href) {
  const clean = href.split('#')[0].split('?')[0]
  if (clean === '' || clean === '/') return existsSync(join(DIST, 'index.html'))
  const p = join(DIST, clean)
  return (
    existsSync(p) ||
    existsSync(join(p, 'index.html')) ||
    existsSync(p + '.html')
  )
}

let checked = 0
let broken = 0
const seen = new Set()

for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, 'utf8')
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1]
    if (!href.startsWith('/')) continue
    if (href.startsWith('//')) continue
    checked++
    if (seen.has(href)) continue
    seen.add(href)
    if (!resolves(href)) {
      broken++
      console.error(`БИТАЯ ССЫЛКА ${href}  ←  ${relative(DIST, file)}`)
    }
  }
}

console.log(`check-links: проверено ${checked} внутренних ссылок (${seen.size} уникальных)`)
if (broken) {
  console.error(`check-links: ${broken} битых`)
  process.exit(1)
}
console.log('check-links: битых нет')
