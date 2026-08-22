import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CURATED_KOKORO_VOICES,
  DEFAULT_KOKORO_VOICE_ID,
  kokoroVoiceLabel,
  findKokoroVoice,
} from './kokoroVoices.ts'

// Real kokoro-js VOICES keys as of kokoro-js 1.2.1 (node_modules/kokoro-js/
// types/voices.d.ts) — kept as a plain literal here (not imported) so this
// test does not depend on the heavy package being installed to run.
const REAL_KOKORO_VOICE_IDS = new Set([
  'af_heart',
  'af_alloy',
  'af_aoede',
  'af_bella',
  'af_jessica',
  'af_kore',
  'af_nicole',
  'af_nova',
  'af_river',
  'af_sarah',
  'af_sky',
  'am_adam',
  'am_echo',
  'am_eric',
  'am_fenrir',
  'am_liam',
  'am_michael',
  'am_onyx',
  'am_puck',
  'am_santa',
  'bf_emma',
  'bf_isabella',
  'bm_george',
  'bm_lewis',
  'bf_alice',
  'bf_lily',
  'bm_daniel',
  'bm_fable',
])

test('curates a shortlist of 6-8 voices, not the full 54-voice roster', () => {
  assert.ok(CURATED_KOKORO_VOICES.length >= 6 && CURATED_KOKORO_VOICES.length <= 8)
})

test('every curated id is a real kokoro-js voice key', () => {
  for (const v of CURATED_KOKORO_VOICES) {
    assert.ok(REAL_KOKORO_VOICE_IDS.has(v.id), `${v.id} is not a real kokoro-js voice id`)
  }
})

test('curated ids are unique', () => {
  const ids = CURATED_KOKORO_VOICES.map((v) => v.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('covers both accents and both genders (US/GB x female/male)', () => {
  const combos = new Set(CURATED_KOKORO_VOICES.map((v) => `${v.accent}-${v.gender}`))
  assert.ok(combos.has('US-female'))
  assert.ok(combos.has('US-male'))
  assert.ok(combos.has('GB-female'))
  assert.ok(combos.has('GB-male'))
})

test('default voice id is present in the curated list', () => {
  assert.ok(CURATED_KOKORO_VOICES.some((v) => v.id === DEFAULT_KOKORO_VOICE_ID))
})

test('kokoroVoiceLabel is a plain-language label, not the raw id', () => {
  const heart = CURATED_KOKORO_VOICES.find((v) => v.id === 'af_heart')
  const label = kokoroVoiceLabel(heart)
  assert.ok(!label.includes('af_heart'))
  assert.match(label, /Heart/)
  assert.match(label, /US English/)
  assert.match(label, /female/)
})

test('findKokoroVoice returns the matching voice by id', () => {
  const v = findKokoroVoice('bm_george')
  assert.equal(v.name, 'George')
  assert.equal(v.accent, 'GB')
})

test('findKokoroVoice falls back to the first curated voice for an unknown id', () => {
  const v = findKokoroVoice('zz_nonexistent')
  assert.equal(v.id, CURATED_KOKORO_VOICES[0].id)
})
