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

// D-165: strong-phrase vs weak-word link matching.
test('D-165: a bare "Accessibility" link IS recognised as the statement link', () => {
  const html = '<footer><a href="/a11y/">Accessibility</a></footer>'
  assert.equal(findStatementLink(html, 'https://x.test'), 'https://x.test/a11y/')
})

test('D-165: "Barrierefreiheit am Arbeitsplatz" (careers) is NOT taken as the statement link', () => {
  const html = '<nav><a href="/karriere/">Barrierefreiheit am Arbeitsplatz</a></nav>'
  assert.equal(findStatementLink(html, 'https://x.test'), null)
})

test('D-165: single-quoted href on the statement link is found (extractAnchors fix)', () => {
  const html = "<a href='/erklaerung/'>Barrierefreiheitserklärung</a>"
  assert.equal(findStatementLink(html, 'https://x.test'), 'https://x.test/erklaerung/')
})

test('D-165: an unrelated "financial audit" no longer makes methodology complete', () => {
  const html = '<p>This statement applies to our site. Partially compliant. ' +
    'Read our 2025 financial audit report. Enforcement body: the ombudsman, complaints procedure here.</p>'
  const out = evaluateStatementContent(html)
  assert.equal(out.methodology, false)
})

test('D-165: HTML-entity-encoded apostrophe in a French statement still matches scope', () => {
  const html = '<p>Cette d&eacute;claration s&rsquo;applique au site.</p>'
  const out = evaluateStatementContent(html)
  assert.equal(out.serviceDescription, true)
})

// D-166 (live-found on verscala.com): a site that PUBLISHES guides about accessibility
// statements must not have a guide title hijack the statement link. Ranking must prefer
// the real /accessibility-statement/ page over an article whose title merely contains
// the phrase — otherwise the scanner evaluates the wrong page and reports a bogus
// statement-incomplete. This hits almost every agency in our own catalog.
test('D-166: a guide title containing the phrase does not hijack the real statement link', () => {
  const html = `
    <a href="/guides/audit-rgaa-guide/">Audit RGAA : obligations et déclaration d'accessibilité</a>
    <a href="/guides/barrierefreiheitserklaerung-bfsg-anlage3/">Barrierefreiheitserklärung nach BFSG</a>
    <footer><a href="/accessibility-statement/">Accessibility Statement</a></footer>`
  assert.equal(findStatementLink(html, 'https://x.test'), 'https://x.test/accessibility-statement/')
})

test('D-166: a statement-looking href wins even when the link text is generic', () => {
  const html = '<a href="/blog/a11y-tips/">Accessibility statement basics</a>' +
    '<a href="/barrierefreiheitserklaerung/">Mehr erfahren</a>'
  assert.equal(findStatementLink(html, 'https://x.test'), 'https://x.test/barrierefreiheitserklaerung/')
})
