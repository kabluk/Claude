// G-CHECKER-TTS-NEURAL: pure sentence-splitting for the neural (Kokoro-82M)
// text-to-speech mode.
//
// WHY this exists: the neural engine generates audio from raw text, and
// generating one huge block for the whole textarea means the listener hears
// nothing until the ENTIRE input has been synthesised — on a long paste that
// can be the better part of a minute, especially on WASM. Splitting the
// input into sentences lets the caller generate and play audio one sentence
// at a time (see StreamingKokoroJS-style usage in TextToSpeech.tsx), so the
// first sound starts almost immediately and playback continues while later
// sentences are still being synthesised.
//
// This module is deliberately dependency-free (no kokoro-js import) so it
// stays out of the eagerly-loaded main bundle and is trivially unit-testable
// with `tsx --test`.
//
// Known, documented limitations (good enough for a read-aloud tool, not a
// full NLP sentence tokenizer):
//  - abbreviation handling covers a fixed, common list (Mr., Dr., etc.) —
//    an abbreviation outside that list will still cause an early split;
//  - a quoted/parenthesised sentence-ending punctuation mark followed by more
//    prose on the same "sentence" (e.g. `She said "Really?" and left.`) may
//    split earlier than a linguist would — acceptable here because an extra
//    pause in read-aloud speech is a much smaller problem than a minute of
//    silence on long text.

const ABBREVIATIONS = /\b(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|e\.g|i\.e|approx|fig|no)\.$/i

const TERMINATORS = new Set(['.', '!', '?'])
const TRAILING_CLOSERS = new Set(['"', "'", '”', '’', ')', ']'])

/**
 * Split arbitrary text into an ordered list of sentence-ish chunks, suitable
 * for feeding a TTS engine one chunk at a time. Whitespace (including
 * newlines) is collapsed to single spaces between sentences. Returns `[]`
 * for empty/whitespace-only input.
 */
export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const sentences: string[] = []
  let start = 0

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    if (!TERMINATORS.has(ch)) continue

    // Absorb any run of extra terminators/closing quotes/parens right after
    // the punctuation mark (e.g. `?!`, `."`, `!"`).
    let end = i + 1
    while (end < normalized.length && (TERMINATORS.has(normalized[end]) || TRAILING_CLOSERS.has(normalized[end]))) {
      end++
    }

    const candidate = normalized.slice(start, end)
    const nextChar = normalized[end]

    if (ch === '.') {
      const prevChar = normalized[i - 1] ?? ''
      // Decimal number guard: "3.14" is not two sentences.
      if (/\d/.test(prevChar) && /\d/.test(normalized[i + 1] ?? '')) continue
      // Common abbreviation guard: "Dr. Smith" is not two sentences.
      if (ABBREVIATIONS.test(candidate)) continue
    }

    // A real sentence boundary is followed by whitespace or end of input —
    // not by another word character glued to the punctuation.
    if (nextChar !== undefined && nextChar !== ' ') continue

    sentences.push(candidate.trim())
    start = end
    i = end - 1
  }

  const rest = normalized.slice(start).trim()
  if (rest) sentences.push(rest)

  return sentences
}

/** Default hard cap used by `chunkForSpeech` — long enough to sound natural,
 * short enough that a single chunk without any punctuation still starts
 * playing in a few seconds rather than after the whole textarea. */
const DEFAULT_MAX_CHARS = 300

/**
 * Same as `splitSentences`, but any single sentence longer than `maxChars`
 * is further split on word boundaries. Protects against pathological input
 * (one giant paragraph with no punctuation at all) still blocking playback
 * for a long time on a single chunk.
 */
export function chunkForSpeech(text: string, maxChars: number = DEFAULT_MAX_CHARS): string[] {
  const sentences = splitSentences(text)
  const chunks: string[] = []

  for (const sentence of sentences) {
    if (sentence.length <= maxChars) {
      chunks.push(sentence)
      continue
    }
    const words = sentence.split(' ')
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (candidate.length > maxChars && current) {
        chunks.push(current)
        current = word
      } else {
        current = candidate
      }
    }
    if (current) chunks.push(current)
  }

  return chunks
}
