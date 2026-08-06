import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidRuleId, normalizeLocale, cacheKey, buildExplainPrompt, parseExplainResponse } from './explain.js'

test('isValidRuleId accepts real axe-core-shaped rule ids', () => {
  assert.equal(isValidRuleId('image-alt'), true)
  assert.equal(isValidRuleId('color-contrast'), true)
  assert.equal(isValidRuleId('aria-hidden-body'), true)
})

test('isValidRuleId rejects garbage input', () => {
  assert.equal(isValidRuleId(''), false)
  assert.equal(isValidRuleId('DROP TABLE scans'), false)
  assert.equal(isValidRuleId('a'.repeat(101)), false)
  assert.equal(isValidRuleId(null), false)
  assert.equal(isValidRuleId(undefined), false)
  assert.equal(isValidRuleId(42), false)
})

test('normalizeLocale falls back to en for unsupported locales', () => {
  assert.equal(normalizeLocale('en'), 'en')
  assert.equal(normalizeLocale('de'), 'en') // не в SUPPORTED_LOCALES пока UI EN-only
  assert.equal(normalizeLocale(undefined), 'en')
  assert.equal(normalizeLocale(''), 'en')
})

test('cacheKey is stable and namespaced by rule and locale', () => {
  assert.equal(cacheKey('image-alt', 'en'), 'explain:image-alt:en')
  assert.notEqual(cacheKey('image-alt', 'en'), cacheKey('color-contrast', 'en'))
})

test('buildExplainPrompt embeds the exact ruleId and asks for JSON-only output', () => {
  const prompt = buildExplainPrompt('image-alt', 'en')
  assert.match(prompt, /"image-alt"/)
  assert.match(prompt, /JSON/)
  assert.match(prompt, /do not invent/i)
})

test('parseExplainResponse accepts well-formed JSON', () => {
  const result = parseExplainResponse('{"explanation": "Images need alt text.", "fixExamples": ["Add alt attributes."]}')
  assert.deepEqual(result, { explanation: 'Images need alt text.', fixExamples: ['Add alt attributes.'] })
})

test('parseExplainResponse rejects malformed JSON', () => {
  assert.equal(parseExplainResponse('not json at all'), null)
  assert.equal(parseExplainResponse('{"explanation": "ok"'), null) // truncated
})

test('parseExplainResponse rejects wrong shapes', () => {
  assert.equal(parseExplainResponse('null'), null)
  assert.equal(parseExplainResponse('"just a string"'), null)
  assert.equal(parseExplainResponse('{"explanation": 42, "fixExamples": []}'), null)
  assert.equal(parseExplainResponse('{"explanation": "ok", "fixExamples": "not an array"}'), null)
  assert.equal(parseExplainResponse('{"explanation": "ok", "fixExamples": [1, 2]}'), null)
})

test('parseExplainResponse treats an empty explanation as "model does not know" -> null', () => {
  assert.equal(parseExplainResponse('{"explanation": "", "fixExamples": []}'), null)
  assert.equal(parseExplainResponse('{"explanation": "   ", "fixExamples": []}'), null)
})

test('parseExplainResponse strips blank fixExamples entries', () => {
  const result = parseExplainResponse('{"explanation": "ok", "fixExamples": ["real fix", "", "  "]}')
  assert.deepEqual(result.fixExamples, ['real fix'])
})

// Реальный ответ Claude Haiku на этот промпт, зафиксированный живой проверкой
// (D-020): модель обернула JSON в markdown code fence, несмотря на "ONLY a
// JSON object" в промпте. До фикса это давало 502 на каждый cache-miss.
test('parseExplainResponse handles a ```json fenced response (actual model behavior)', () => {
  const fenced = '```json\n{"explanation": "Images need alt text.", "fixExamples": ["Add alt attributes."]}\n```'
  const result = parseExplainResponse(fenced)
  assert.deepEqual(result, { explanation: 'Images need alt text.', fixExamples: ['Add alt attributes.'] })
})

test('parseExplainResponse handles a fence without the "json" language tag', () => {
  const fenced = '```\n{"explanation": "ok", "fixExamples": []}\n```'
  // fixExamples пуст, а explanation не пустой -> валиден (пустой массив это нормально, не "не знаю")
  assert.deepEqual(parseExplainResponse(fenced), { explanation: 'ok', fixExamples: [] })
})

test('parseExplainResponse still rejects fenced-but-malformed JSON', () => {
  assert.equal(parseExplainResponse('```json\n{"explanation": "truncated"\n```'), null)
})
