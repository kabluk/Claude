#!/usr/bin/env node
// Проверяет, что все внутренние href/src в собранном сайте (dist/) разрешаются
// в существующие файлы. Запускать после `npm run build`. Блокирующий шаг CI.

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

if (!existsSync(DIST)) {
  console.error('Нет dist/ — сперва сборка (npm run build).')
  process.exit(1)
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

function resolvesToFile(urlPath) {
  const clean = urlPath.split('#')[0].split('?')[0]
  if (!clean || clean === '/') return existsSync(join(DIST, 'index.html'))
  const asFile = join(DIST, clean)
  if (extname(clean)) return existsSync(asFile)
  // Директория-стиль: /foo/ → dist/foo/index.html; /foo (без слэша) — тоже
  const withSlash = clean.endsWith('/') ? clean : clean + '/'
  return existsSync(join(DIST, withSlash, 'index.html'))
}

const HREF_RE = /(?:href|src)="([^"]+)"/g
const files = walk(DIST)
const broken = []
let checked = 0
const seen = new Set()

for (const file of files) {
  const html = readFileSync(file, 'utf8')
  let m
  while ((m = HREF_RE.exec(html))) {
    const url = m[1]
    if (!url.startsWith('/') || url.startsWith('//')) continue // внешние, protocol-relative
    checked++
    if (seen.has(url)) continue
    seen.add(url)
    if (!resolvesToFile(url)) {
      broken.push({ url, in: file.replace(DIST + '/', 'dist/') })
    }
  }
}

if (broken.length) {
  console.error(`\ncheck-links: ${broken.length} битых внутренних ссылок из ${seen.size} уникальных (${checked} вхождений, ${files.length} файлов):\n`)
  for (const b of broken.slice(0, 30)) console.error(`  ${b.url}  (впервые в ${b.in})`)
  if (broken.length > 30) console.error(`  … и ещё ${broken.length - 30}`)
  process.exit(1)
}

console.log(`✓ check-links: ${seen.size} уникальных внутренних ссылок (${checked} вхождений, ${files.length} файлов) — битых нет`)
