import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitSentences, chunkForSpeech } from './ttsSentences.ts'

test('empty and whitespace-only input returns an empty array', () => {
  assert.deepEqual(splitSentences(''), [])
  assert.deepEqual(splitSentences('   \n\t  '), [])
})

test('splits a simple multi-sentence paragraph on ./!/?', () => {
  const out = splitSentences('Plain language helps everyone. Does it help you? Yes it does!')
  assert.deepEqual(out, ['Plain language helps everyone.', 'Does it help you?', 'Yes it does!'])
})

test('text with no terminal punctuation is returned as a single sentence', () => {
  assert.deepEqual(splitSentences('no punctuation here'), ['no punctuation here'])
})

test('newlines and repeated whitespace are collapsed between sentences', () => {
  const out = splitSentences('Hello.\n\n   World.\tAgain.')
  assert.deepEqual(out, ['Hello.', 'World.', 'Again.'])
})

test('common abbreviations do not force an early split', () => {
  const out = splitSentences('This is Dr. Smith. He is here.')
  assert.deepEqual(out, ['This is Dr. Smith.', 'He is here.'])
})

test('decimal numbers are not treated as sentence boundaries', () => {
  const out = splitSentences('The value is 3.14 exactly. Nothing else follows.')
  assert.deepEqual(out, ['The value is 3.14 exactly.', 'Nothing else follows.'])
})

test('trailing closing quote after terminal punctuation stays attached', () => {
  const out = splitSentences('She said "stop." Then she left.')
  assert.deepEqual(out, ['She said "stop."', 'Then she left.'])
})

test('consecutive terminators (ellipsis, ?!) are kept as one boundary', () => {
  const out = splitSentences('Wait... Really?! Yes.')
  assert.deepEqual(out, ['Wait...', 'Really?!', 'Yes.'])
})

test('a trailing sentence without terminal punctuation is still included', () => {
  const out = splitSentences('First one. and a trailing fragment with no full stop')
  assert.deepEqual(out, ['First one.', 'and a trailing fragment with no full stop'])
})

// --- chunkForSpeech: hard cap on top of sentence splitting -----------------

test('chunkForSpeech leaves short sentences untouched', () => {
  const out = chunkForSpeech('One. Two. Three.', 50)
  assert.deepEqual(out, ['One.', 'Two.', 'Three.'])
})

test('chunkForSpeech splits a sentence with no punctuation on word boundaries once it exceeds maxChars', () => {
  const longSentence = Array.from({ length: 20 }, (_, i) => `word${i}`).join(' ')
  const out = chunkForSpeech(longSentence, 30)
  assert.ok(out.length > 1, 'expected more than one chunk')
  for (const chunk of out) assert.ok(chunk.length <= 30 || !chunk.includes(' '), `chunk too long: "${chunk}"`)
  // Re-joining every chunk reproduces the original words in order.
  assert.equal(out.join(' '), longSentence)
})

test('chunkForSpeech never returns an empty chunk', () => {
  const out = chunkForSpeech('Short. ' + 'x'.repeat(500) + ' done.', 40)
  for (const chunk of out) assert.ok(chunk.length > 0)
})
