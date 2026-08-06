import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectPdfLinks } from './pdf.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => fs.readFileSync(path.join(dir, '__fixtures__', name), 'utf8')

test('finds all real PDF links on bundesregierung.de publications page (44 hrefs, 43 unique — one PDF is linked twice, live 2026-08-06)', () => {
  const html = fixture('pdf-breg-pubs.html')
  const links = detectPdfLinks(html, 'https://www.bundesregierung.de/breg-de/service/publikationen')
  assert.equal(links.length, 43)
  assert.ok(links.every((l) => l.startsWith('http')))
})

test('captures the real German ?__blob=publicationFile query pattern after .pdf', () => {
  const html = fixture('pdf-breg-pubs.html')
  const links = detectPdfLinks(html, 'https://www.bundesregierung.de/')
  const match = links.find((l) => l.includes('svik-monitoring-report-2025.pdf'))
  assert.ok(match)
  assert.ok(match.includes('__blob=publicationFile'))
})

test('finds real PDF references on a live Wikipedia fragment, resolves relative-safe absolute URLs', () => {
  const html = fixture('pdf-wikipedia-fragment.html')
  const links = detectPdfLinks(html, 'https://en.wikipedia.org/wiki/Portable_Document_Format')
  assert.equal(links.length, 3)
  assert.ok(links.includes('https://www.pdfa.org/norm-refs/warnock_camelot.pdf'))
})

test('true negative: a real statement page with no PDFs at all returns []', () => {
  const html = fixture('statement-impots.html')
  assert.deepEqual(detectPdfLinks(html, 'https://www.impots.gouv.fr/'), [])
})

test('resolves relative PDF links against baseUrl and dedupes repeats', () => {
  const html = '<a href="/docs/report.pdf">Report</a><a href="/docs/report.pdf">Same report again</a>' +
    '<a href="other.pdf?v=2#page=3">Other</a>'
  const links = detectPdfLinks(html, 'https://example.com/section/')
  assert.deepEqual(links, [
    'https://example.com/docs/report.pdf',
    'https://example.com/section/other.pdf?v=2#page=3',
  ])
})

test('ignores a genuinely malformed href without throwing', () => {
  const html = '<a href="http://[invalid.pdf">broken</a><a href="/ok.pdf">fine</a>'
  const links = detectPdfLinks(html, 'https://example.com/')
  assert.deepEqual(links, ['https://example.com/ok.pdf'])
})
