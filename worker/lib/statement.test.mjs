import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { findStatementLink, evaluateStatementContent } from './statement.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => fs.readFileSync(path.join(dir, '__fixtures__', name), 'utf8')

// Живая проверка (2026-08-06): реальные страницы bundesregierung.de и impots.gouv.fr,
// сохранены как фикстуры. Первая версия эвристики (точные фразы "diese erklärung
// gilt für", "wurde geprüft"/"selbstbewertung", закрытая кавычка ASCII) реально
// провалилась на этих страницах — немецкий текст вставляет слова между "Erklärung"
// и "gilt für", методология названа поимённо ("BITV-Test"), французский апостроф
// типографский (’), не ASCII ('). Паттерны исправлены по факту, не по догадке.

test('finds the real accessibility-statement link on bundesregierung.de home page', () => {
  const home = fixture('statement-breg-home.html')
  const link = findStatementLink(home, 'https://www.bundesregierung.de/')
  assert.equal(link, 'https://www.bundesregierung.de/breg-de/barrierefreiheit?view=')
})

test('does not false-positive on prose mentioning "accessibility" without a statement link', () => {
  const html = '<html><body><p>Read more about accessibility statement requirements in our blog.</p>' +
    '<a href="/other">Other page</a></body></html>'
  assert.equal(findStatementLink(html, 'https://example.com/'), null)
})

test('returns null when no statement link exists at all', () => {
  const html = '<html><body><a href="/about">About us</a><a href="/contact">Contact</a></body></html>'
  assert.equal(findStatementLink(html, 'https://example.com/'), null)
})

test('real BFSG statement (bundesregierung.de) is detected as complete — all 4 Anlage-3 parts present', () => {
  const html = fixture('statement-breg-statement.html')
  const result = evaluateStatementContent(html)
  assert.equal(result.complete, true)
  assert.deepEqual(result.missingParts, [])
})

test('real RGAA statement (impots.gouv.fr, French) is detected as complete', () => {
  const html = fixture('statement-impots.html')
  const result = evaluateStatementContent(html)
  assert.equal(result.complete, true)
  assert.deepEqual(result.missingParts, [])
})

test('thin statement missing scope/methodology/enforcement body is flagged incomplete', () => {
  const html = '<html><body><h1>Accessibility</h1>' +
    '<p>This site is not fully compliant with WCAG.</p></body></html>'
  const result = evaluateStatementContent(html)
  assert.equal(result.complete, false)
  assert.deepEqual(result.missingParts, ['serviceDescription', 'methodology', 'enforcementBody'])
  assert.equal(result.complianceExplanation, true) // "not fully compliant" -> статус есть
})

test('empty page has all four parts missing', () => {
  const result = evaluateStatementContent('<html><body></body></html>')
  assert.equal(result.complete, false)
  assert.equal(result.missingParts.length, 4)
})
