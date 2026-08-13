import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  tokenizeWords,
  splitSentences,
  countSyllablesInWord,
  countSyllables,
  isComplexWord,
  textStats,
  fleschReadingEase,
  fleschKincaidGrade,
  gunningFog,
  smogIndex,
  colemanLiauIndex,
  automatedReadabilityIndex,
  fleschBand,
  analyzeReadability,
} from './readability.ts'

const near = (a, b, eps = 0.5) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b} (±${eps})`)

// --- Токенизация: слова и предложения на известном предложении.
test('tokenizeWords: counts words, ignores punctuation, keeps internal apostrophes', () => {
  const words = tokenizeWords("The cat sat. It didn't move.")
  assert.deepEqual(words, ['The', 'cat', 'sat', 'It', "didn't", 'move'])
  assert.equal(words.length, 6)
})

test('splitSentences: two sentences with terminal punctuation', () => {
  const sentences = splitSentences('The cat sat. It did not move.')
  assert.equal(sentences.length, 2)
})

test('splitSentences: text without terminal punctuation still counts as one sentence (no crash)', () => {
  const sentences = splitSentences('hello world')
  assert.equal(sentences.length, 1)
})

// --- Слоги: якорные значения на известных словах.
test('countSyllablesInWord: known words', () => {
  assert.equal(countSyllablesInWord('cat'), 1)
  assert.equal(countSyllablesInWord('the'), 1)
  assert.equal(countSyllablesInWord('cake'), 1)
  assert.equal(countSyllablesInWord('simple'), 2)
  assert.equal(countSyllablesInWord('syllable'), 3)
  assert.equal(countSyllablesInWord('education'), 4)
  assert.equal(countSyllablesInWord('beautiful'), 3)
})

test('countSyllables: sums across a word list', () => {
  assert.equal(countSyllables(['the', 'cat', 'sat']), 3)
})

test('isComplexWord: true at 3+ syllables, false below', () => {
  assert.equal(isComplexWord('cat'), false)
  assert.equal(isComplexWord('education'), true)
})

// --- textStats: known sentence, and the empty/whitespace guard.
test('textStats: a known short sentence', () => {
  const s = textStats('The cat sat on the mat.')
  assert.equal(s.words, 6)
  assert.equal(s.sentences, 1)
  assert.equal(s.syllables, 6) // the(1) cat(1) sat(1) on(1) the(1) mat(1)
  assert.equal(s.complexWords, 0)
})

test('textStats: empty or whitespace-only input returns the well-defined no-text state, never NaN', () => {
  for (const input of ['', '   ', '\n\t  ', '...', '???']) {
    const s = textStats(input)
    assert.deepEqual(s, { sentences: 0, words: 0, syllables: 0, complexWords: 0, letters: 0 })
  }
})

test('analyzeReadability: empty input has hasText=false, null scores, null band — not NaN/crash', () => {
  const result = analyzeReadability('   ')
  assert.equal(result.hasText, false)
  assert.equal(result.band, null)
  for (const key of Object.keys(result.scores)) {
    assert.equal(result.scores[key], null)
  }
})

// --- Формулы: текст попроще против текста посложнее — лёгкий должен
// получить БОЛЬШИЙ Flesch Reading Ease (легче читать) и МЕНЬШИЙ класс школы
// по grade-индексам (ниже требуемый уровень образования), на каждой формуле.
const EASY_TEXT =
  'The cat sat on the mat. The dog ran fast. I like cake. We go to the shop. The sun is hot today.'

const HARD_TEXT =
  'The multifaceted implementation of interdisciplinary methodological frameworks necessitates ' +
  'comprehensive reconceptualization of institutionalized organizational paradigms, particularly ' +
  'when confronting unprecedented epistemological complexities inherent to contemporary ' +
  'socioeconomic transformations.'

test('Flesch Reading Ease: easy text scores higher (easier) than hard text', () => {
  const easyScore = fleschReadingEase(textStats(EASY_TEXT))
  const hardScore = fleschReadingEase(textStats(HARD_TEXT))
  assert.ok(Number.isFinite(easyScore))
  assert.ok(Number.isFinite(hardScore))
  assert.ok(easyScore > hardScore, `${easyScore} > ${hardScore}`)
})

test('all six formulas return a finite number on real text', () => {
  const stats = textStats(EASY_TEXT)
  for (const fn of [
    fleschReadingEase,
    fleschKincaidGrade,
    gunningFog,
    smogIndex,
    colemanLiauIndex,
    automatedReadabilityIndex,
  ]) {
    const value = fn(stats)
    assert.ok(Number.isFinite(value), `${fn.name} should be finite, got ${value}`)
  }
})

test('grade-level formulas rank the hard paragraph above the easy one', () => {
  const easyStats = textStats(EASY_TEXT)
  const hardStats = textStats(HARD_TEXT)
  for (const fn of [fleschKincaidGrade, gunningFog, smogIndex, colemanLiauIndex, automatedReadabilityIndex]) {
    const easyGrade = fn(easyStats)
    const hardGrade = fn(hardStats)
    assert.ok(hardGrade > easyGrade, `${fn.name}: hard(${hardGrade}) > easy(${easyGrade})`)
  }
})

// --- Anchor values on a very simple, hand-countable sentence: known ASL/ASW
// let us check the Flesch formula's exact arithmetic, not just direction.
test('Flesch Reading Ease: exact arithmetic on a hand-countable sentence', () => {
  // "The cat sat on the mat." → 6 words, 1 sentence, 6 syllables (all monosyllabic).
  const s = textStats('The cat sat on the mat.')
  assert.equal(s.words, 6)
  assert.equal(s.sentences, 1)
  assert.equal(s.syllables, 6)
  // FRE = 206.835 - 1.015*(6/1) - 84.6*(6/6) = 206.835 - 6.09 - 84.6 = 116.145
  near(fleschReadingEase(s), 116.145, 0.01)
})

// --- Bands: cover the documented example thresholds and never crash on
// out-of-table extremes.
test('fleschBand: known bands match the published table', () => {
  assert.equal(fleschBand(95).label, 'very easy')
  assert.equal(fleschBand(65).label, 'plain English')
  assert.equal(fleschBand(40).label, 'difficult')
  assert.equal(fleschBand(5).label, 'extremely difficult')
})

test('fleschBand: handles out-of-range scores (below 0, above 100) without crashing', () => {
  assert.equal(fleschBand(150).label, 'very easy')
  assert.equal(fleschBand(-50).label, 'extremely difficult')
})

test('analyzeReadability: happy path wires stats, scores and band together', () => {
  const result = analyzeReadability(EASY_TEXT)
  assert.equal(result.hasText, true)
  assert.ok(result.stats.words > 0)
  assert.ok(Number.isFinite(result.scores.fleschReadingEase))
  assert.ok(result.band && typeof result.band.label === 'string')
})
