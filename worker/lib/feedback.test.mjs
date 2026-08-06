import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectFeedbackChannel } from './feedback.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => fs.readFileSync(path.join(dir, '__fixtures__', name), 'utf8')

// Живая проверка (2026-08-06): наивная идея "искать <form> тег" провалилась на
// bundesregierung.de/breg-de/barrierefreiheit/barrierefreiheit-feedback — единственный
// <form> на реальной странице принадлежит cookie-consent баннеру, не форме обратной
// связи. Переключились на поиск официального EU-заголовка раздела ("Feedback and
// contact information" / "Retour d'information et contact" и переводы) + типовых фраз.

test('detects the real German feedback page (bundesregierung.de) via "Feedback-Formular"', () => {
  const html = fixture('feedback-breg.html')
  const result = detectFeedbackChannel(html)
  assert.equal(result.found, true)
  assert.equal(result.matchedPhrase, 'feedback-formular')
})

test('detects the real French RGAA feedback section via official EU heading, extracts plaintext email', () => {
  const html = fixture('statement-impots.html')
  const result = detectFeedbackChannel(html)
  assert.equal(result.found, true)
  assert.equal(result.matchedPhrase, "retour d'information et contact")
  assert.equal(result.contactLink, 'contact-accessibilite@dgfip.finances.gouv.fr')
})

test('does not false-positive on a bare cookie-consent <form> with no feedback wording', () => {
  const html = '<html><body><form class="cookie-consent"><input type="checkbox" name="allow-tracking">' +
    '<button>Accept</button></form></body></html>'
  assert.equal(detectFeedbackChannel(html).found, false)
})

test('does not pick up an unrelated mailto: share-widget link as the contact channel', () => {
  // Тот же класс ссылки, что реально встретился на bundesregierung.de: "поделиться по
  // почте" далеко от текста про обратную связь — окно ±400 симв. не должно её захватить.
  const filler = 'x'.repeat(600)
  const html = `<html><body><a href="mailto:?subject=share">Share this page</a>${filler}` +
    `<h3>Feedback and contact information</h3><p>No address given here.</p></body></html>`
  const result = detectFeedbackChannel(html)
  assert.equal(result.found, true)
  assert.equal(result.contactLink, null) // фраза найдена, но share-ссылка вне окна — честно null, не угадываем
})

test('no feedback channel found on a page with none of the patterns', () => {
  assert.deepEqual(detectFeedbackChannel('<html><body><p>Welcome to our site.</p></body></html>'), {
    found: false, matchedPhrase: null, contactLink: null,
  })
})
