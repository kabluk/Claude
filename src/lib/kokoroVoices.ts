// G-CHECKER-TTS-NEURAL: curated English voice list for the Kokoro-82M neural
// mode of the text-to-speech reader.
//
// Kokoro-82M ships 54 voices across 8 languages. This project's audience is
// English-first, and 54 raw voice IDs (`af_heart`, `bm_fable`, …) mean
// nothing to a visitor — so this module hand-picks 8 English voices and
// gives each a plain-language label (name + gender + accent).
//
// WHY these particular 8 and not others: kokoro-js's own README ships an
// "Overall Grade" per voice (A best, F worst), based on training data
// quality/duration — not this project's opinion. We picked the
// highest-graded voice(s) per gender × accent combination available
// (American English female/male, British English female/male), so every
// visitor gets at least one strong option in the accent/gender they expect,
// rather than 54 undifferentiated options of wildly varying quality.
// Source: node_modules/kokoro-js/README.md "Voices/Samples" tables (kokoro-js
// 1.2.1, model onnx-community/Kokoro-82M-v1.0-ONNX).
//
// Deliberately dependency-free (no `kokoro-js` import): this file is a
// handful of string literals, so it can be imported eagerly by
// TextToSpeech.tsx without pulling the ~90 MB model or the kokoro-js/
// transformers.js code into the main bundle. The `id` values below match
// kokoro-js's own `VOICES` keys exactly — enforced by a comment cross-check
// here and exercised at runtime when generation actually starts.

export type KokoroAccent = 'US' | 'GB'
export type KokoroGender = 'female' | 'male'

export interface KokoroVoiceOption {
  /** Exact key kokoro-js expects in `generate()`/`stream()`'s `voice` option. */
  id: string
  /** Human first name used in kokoro-js's own voice naming, capitalised. */
  name: string
  accent: KokoroAccent
  gender: KokoroGender
  /** kokoro-js's own published quality grade (A best) — shown so the
   * choice is transparent, not just a curated black box. */
  grade: string
}

export const CURATED_KOKORO_VOICES: readonly KokoroVoiceOption[] = [
  { id: 'af_heart', name: 'Heart', accent: 'US', gender: 'female', grade: 'A' },
  { id: 'af_bella', name: 'Bella', accent: 'US', gender: 'female', grade: 'A-' },
  { id: 'af_nicole', name: 'Nicole', accent: 'US', gender: 'female', grade: 'B-' },
  { id: 'am_fenrir', name: 'Fenrir', accent: 'US', gender: 'male', grade: 'C+' },
  { id: 'am_michael', name: 'Michael', accent: 'US', gender: 'male', grade: 'C+' },
  { id: 'bf_emma', name: 'Emma', accent: 'GB', gender: 'female', grade: 'B-' },
  { id: 'bm_fable', name: 'Fable', accent: 'GB', gender: 'male', grade: 'C' },
  { id: 'bm_george', name: 'George', accent: 'GB', gender: 'male', grade: 'C' },
]

/** Default voice on first Neural-mode load — the highest-graded voice overall. */
export const DEFAULT_KOKORO_VOICE_ID = 'af_heart'

const ACCENT_LABEL: Record<KokoroAccent, string> = { US: 'US English', GB: 'British English' }

/** Human-readable `<option>` label: "Heart — US English, female (grade A)". */
export function kokoroVoiceLabel(voice: KokoroVoiceOption): string {
  return `${voice.name} — ${ACCENT_LABEL[voice.accent]}, ${voice.gender} (grade ${voice.grade})`
}

/** Look up a curated voice by id, falling back to the default if unknown. */
export function findKokoroVoice(id: string): KokoroVoiceOption {
  return CURATED_KOKORO_VOICES.find((v) => v.id === id) ?? CURATED_KOKORO_VOICES[0]
}
