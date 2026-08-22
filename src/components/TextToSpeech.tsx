// G-CHECKERS-BATCH-1 / G-CHECKER-TTS-NEURAL: interactive text-to-speech
// reader for /checkers/text-to-speech/. Two engines, one tool:
//
//  - Instant — window.speechSynthesis (Web Speech API). Zero download, the
//    default mode, works exactly as it always has. The owner's own
//    assessment of these system voices: "полный ужас, старьё" — hence Neural.
//  - Neural — Kokoro-82M (Apache 2.0), run 100% client-side through the
//    `kokoro-js` package (transformers.js under the hood). STRICTLY opt-in:
//    not one byte of the ~90 MB model is fetched until the visitor presses
//    "Load neural voice" — `kokoro-js` is only ever reached via a dynamic
//    `import()` inside that button's click handler, never a static import,
//    so the main page bundle does not grow at all for visitors who never
//    click it (verified by comparing `dist/assets` chunk sizes before/after
//    this change — see DECISIONS.md).
//
// Accessibility discipline (same standard as every other checker):
//  - the textarea and every control (voice selects, rate/pitch sliders, the
//    Instant/Neural mode toggle) has a real <label> or accessible name;
//  - speaking/loading state is announced through aria-live="polite" regions,
//    one per concern (Instant status vs Neural status/model-load progress) —
//    loading progress is throttled to ~25% steps so a screen reader isn't
//    spammed on every percent (see `announceLoadProgress` below);
//  - Play/Pause/Stop/Load are real <button>s; while the model downloads the
//    Load button is `disabled` with a text status next to it, never a bare
//    spinner;
//  - the Instant/Neural toggle reuses the site's existing chip/chip-btn
//    pattern (`aria-pressed`, see FilterableList.tsx facets) rather than
//    inventing a new toggle style;
//  - own chrome styled ONLY with tokens.
//
// SSG-hydration discipline (prerender has no window/speechSynthesis/
// navigator.gpu/Web Audio):
//  - `supported` (Instant) and `neuralDevice` (Neural) both start as `null`
//    ("not yet determined") — the initial render is IDENTICAL on the server
//    and the first client paint regardless of what the real browser
//    supports; both are only resolved inside a mount effect, never during
//    render;
//  - `kokoro-js` itself is never imported outside of `loadNeuralModel()`,
//    which only ever runs from a click handler — so it is never touched
//    during prerendering, and there is no window/WASM/WebGPU access at
//    build time.
//
// Sentence-by-sentence streaming (why): feeding the whole textarea to the
// model as one block means silence until the ENTIRE text has been
// synthesised — on a long paste, the better part of a minute on WASM. The
// pure splitter in `src/lib/ttsSentences.ts` (unit-tested separately) cuts
// the text into chunks; `playNeural()` below generates and queues audio one
// chunk at a time and starts playback as soon as the FIRST chunk is ready,
// while later chunks keep generating in the background.

import { useEffect, useId, useRef, useState } from 'react'
import type { KokoroTTS } from 'kokoro-js'
import { chunkForSpeech } from '@/lib/ttsSentences'
import { CURATED_KOKORO_VOICES, DEFAULT_KOKORO_VOICE_ID, kokoroVoiceLabel, findKokoroVoice } from '@/lib/kokoroVoices'
import { pickKokoroDevice, pickKokoroDtype, type KokoroDevice } from '@/lib/kokoroDevice'

const SAMPLE_TEXT = `Plain language helps everyone. This tool reads text aloud right in your browser — nothing you type here is sent anywhere.`

// onnx-community's ONNX export of hexgrad/Kokoro-82M, the model kokoro-js's
// own README uses as its canonical example.
const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'

type SpeakState = 'idle' | 'speaking' | 'paused'
type Mode = 'instant' | 'neural'
type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'
type NeuralPlayback = 'idle' | 'generating' | 'playing' | 'paused'

// transformers.js progress_callback events; we only act on the 'progress'
// kind (per-file download percentage) — narrow, informal shape, not worth a
// full type import for three fields we read.
interface ProgressEvent {
  status?: string
  file?: string
  progress?: number
}

export function TextToSpeech() {
  const [mode, setMode] = useState<Mode>('instant')

  // --- Instant (Web Speech API) — unchanged behaviour from before Neural. ---
  const [text, setText] = useState(SAMPLE_TEXT)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [speaking, setSpeaking] = useState<SpeakState>('idle')
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // --- Neural (Kokoro-82M) ---
  const [neuralDevice, setNeuralDevice] = useState<KokoroDevice | null>(null)
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle')
  const [modelError, setModelError] = useState('')
  const [loadProgress, setLoadProgress] = useState(0)
  const [loadStatusText, setLoadStatusText] = useState('')
  const [neuralVoiceId, setNeuralVoiceId] = useState(DEFAULT_KOKORO_VOICE_ID)
  const [neuralPlayback, setNeuralPlayback] = useState<NeuralPlayback>('idle')

  const kokoroRef = useRef<KokoroTTS | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const neuralQueueRef = useRef<string[]>([]) // object URLs, one per generated chunk, in order
  const neuralIndexRef = useRef(0) // index of the chunk currently playing/about to play
  const neuralGenerationRef = useRef(0) // bumped on every stop/restart; acts as a cancellation token
  const neuralStillGeneratingRef = useRef(false)
  const lastAnnouncedRef = useRef('')

  const textareaId = useId()
  const voiceId = useId()
  const neuralVoiceSelectId = useId()
  const rateId = useId()
  const pitchId = useId()
  const hintId = useId()

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false)
      return
    }
    setSupported(true)
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices()
      setVoices(list)
      setVoiceURI((current) => current || list[0]?.voiceURI || '')
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      window.speechSynthesis.cancel()
    }
  }, [])

  // Neural device detection — browser-only (navigator.gpu), so it can only
  // run after mount. Starts `null` so server and first client render agree.
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    setNeuralDevice(pickKokoroDevice('gpu' in navigator))
  }, [])

  function play() {
    if (typeof window === 'undefined' || supported !== true || !text.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = voices.find((v) => v.voiceURI === voiceURI)
    if (voice) utterance.voice = voice
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.onend = () => setSpeaking('idle')
    utterance.onerror = () => setSpeaking('idle')
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setSpeaking('speaking')
  }

  function pause() {
    if (typeof window === 'undefined' || supported !== true) return
    window.speechSynthesis.pause()
    setSpeaking('paused')
  }

  function resume() {
    if (typeof window === 'undefined' || supported !== true) return
    window.speechSynthesis.resume()
    setSpeaking('speaking')
  }

  function stop() {
    if (typeof window === 'undefined' || supported !== true) return
    window.speechSynthesis.cancel()
    setSpeaking('idle')
  }

  // Cleanup on unmount: don't leave a browser tab talking after navigation,
  // and release every neural audio blob URL so we don't leak memory.
  useEffect(
    () => () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
      neuralGenerationRef.current++
      for (const url of neuralQueueRef.current) URL.revokeObjectURL(url)
    },
    [],
  )

  // ---- Neural engine ----

  function announceLoadProgress(event: ProgressEvent) {
    if (event.status !== 'progress' || typeof event.progress !== 'number') return
    const pct = Math.max(0, Math.min(100, Math.round(event.progress)))
    setLoadProgress(pct)
    // Throttle the *announced* (aria-live) text to ~25% steps per file, so a
    // screen reader hears "25%… 50%… 75%…", not every single percent tick.
    const quartile = Math.floor(pct / 25) * 25
    const key = `${event.file ?? ''}:${quartile}`
    if (key === lastAnnouncedRef.current) return
    lastAnnouncedRef.current = key
    setLoadStatusText(`Downloading ${event.file ?? 'model files'} — ${quartile}%…`)
  }

  async function loadNeuralModel() {
    if (modelStatus === 'loading' || modelStatus === 'ready' || typeof window === 'undefined') return
    setModelStatus('loading')
    setModelError('')
    setLoadProgress(0)
    lastAnnouncedRef.current = ''
    setLoadStatusText('Starting download…')
    try {
      const device = neuralDevice ?? pickKokoroDevice(typeof navigator !== 'undefined' && 'gpu' in navigator)
      const dtype = pickKokoroDtype(device)
      const { KokoroTTS: KokoroTTSCtor } = await import('kokoro-js')
      const tts = await KokoroTTSCtor.from_pretrained(KOKORO_MODEL_ID, {
        dtype,
        device,
        progress_callback: announceLoadProgress,
      })
      kokoroRef.current = tts
      setLoadProgress(100)
      setLoadStatusText('Neural voice model loaded and cached in this browser. Ready to play.')
      setModelStatus('ready')
    } catch {
      setModelStatus('error')
      setModelError(
        'Could not load the neural voice model — this can happen with a slow or interrupted connection. Instant mode above still works without any download; you can also try loading the neural voice again.',
      )
    }
  }

  function stopNeuralPlayback() {
    neuralGenerationRef.current++
    neuralStillGeneratingRef.current = false
    const audioEl = audioElRef.current
    if (audioEl) {
      audioEl.pause()
      audioEl.removeAttribute('src')
    }
    for (const url of neuralQueueRef.current) URL.revokeObjectURL(url)
    neuralQueueRef.current = []
    neuralIndexRef.current = 0
    setNeuralPlayback('idle')
  }

  // Plays the chunk at `neuralIndexRef.current` if the audio element is free
  // and that chunk has already been generated; otherwise does nothing (the
  // generation loop or `handleNeuralAudioEnded` will call this again once
  // there's something to play).
  function tryAdvanceNeuralQueue() {
    const audioEl = audioElRef.current
    if (!audioEl) return
    if (audioEl.src && !audioEl.paused && !audioEl.ended) return // already playing something
    const url = neuralQueueRef.current[neuralIndexRef.current]
    if (!url) {
      setNeuralPlayback(neuralStillGeneratingRef.current ? 'generating' : 'idle')
      return
    }
    audioEl.src = url
    void audioEl.play()
    setNeuralPlayback('playing')
  }

  async function playNeural() {
    if (!kokoroRef.current || modelStatus !== 'ready' || !text.trim()) return
    if (neuralPlayback === 'paused') {
      void audioElRef.current?.play()
      setNeuralPlayback('playing')
      return
    }
    stopNeuralPlayback()
    const generation = ++neuralGenerationRef.current
    const chunks = chunkForSpeech(text)
    if (chunks.length === 0) return
    neuralStillGeneratingRef.current = true
    setNeuralPlayback('generating')
    for (const chunk of chunks) {
      if (neuralGenerationRef.current !== generation) return
      // `neuralVoiceId` is a plain `string` (see kokoroVoices.ts — that
      // module deliberately does NOT import kokoro-js's own voice-id union
      // type, to stay import-free from the heavy package); the curated-list
      // unit tests already guarantee every id we offer is a real kokoro-js
      // voice key, so this cast is safe.
      const audio = await kokoroRef.current.generate(chunk, {
        voice: neuralVoiceId as Parameters<KokoroTTS['generate']>[1] extends { voice?: infer V } ? V : never,
        speed: rate,
      })
      if (neuralGenerationRef.current !== generation) return
      neuralQueueRef.current.push(URL.createObjectURL(audio.toBlob()))
      tryAdvanceNeuralQueue()
    }
    if (neuralGenerationRef.current === generation) neuralStillGeneratingRef.current = false
  }

  function pauseNeural() {
    audioElRef.current?.pause()
    setNeuralPlayback('paused')
  }

  function handleNeuralAudioEnded() {
    neuralIndexRef.current++
    tryAdvanceNeuralQueue()
  }

  function switchMode(next: Mode) {
    if (next === mode) return
    if (mode === 'instant') stop()
    else stopNeuralPlayback()
    setMode(next)
  }

  const instantStatusText = speaking === 'speaking' ? 'Reading aloud.' : speaking === 'paused' ? 'Paused.' : ''
  const neuralStatusText =
    neuralPlayback === 'playing'
      ? 'Reading aloud with the neural voice.'
      : neuralPlayback === 'paused'
        ? 'Paused.'
        : neuralPlayback === 'generating'
          ? 'Generating speech…'
          : ''
  const selectedNeuralVoice = findKokoroVoice(neuralVoiceId)

  return (
    <div className="panel mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="space-y-6">
        <div>
          <span className="label text-on-surface-variant">Voice engine</span>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Voice engine">
            <button
              type="button"
              className="chip chip-btn"
              aria-pressed={mode === 'instant'}
              onClick={() => switchMode('instant')}
            >
              Instant (built-in)
            </button>
            <button
              type="button"
              className="chip chip-btn"
              aria-pressed={mode === 'neural'}
              onClick={() => switchMode('neural')}
            >
              Neural (AI voice)
            </button>
          </div>
        </div>

        <div>
          <label htmlFor={textareaId} className="label text-on-surface-variant">
            Text to read aloud
          </label>
          <textarea
            id={textareaId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            aria-describedby={hintId}
            className="input-area mt-2 w-full resize-y"
            placeholder="Paste or type the text you want read aloud…"
          />
          <p id={hintId} className="mt-2 text-xs text-on-surface-variant">
            {mode === 'instant'
              ? "Uses your browser's own installed voices. Nothing you type here is sent anywhere — the whole thing runs on your device."
              : 'Nothing you type here is sent anywhere — the neural voice model downloads to your device once, then every reading happens locally on your device too.'}
          </p>
        </div>

        {mode === 'instant' ? (
          supported === false ? (
            <p className="text-on-surface">
              Your browser doesn&rsquo;t support the Web Speech API this mode relies on, so it can&rsquo;t read text
              aloud here. Try the Neural voice above instead, a recent version of Chrome, Edge or Safari, or your
              operating system&rsquo;s own screen reader or speech feature.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={`btn-ghost ${supported !== true || !text.trim() ? 'cursor-not-allowed opacity-50' : ''}`}
                  onClick={speaking === 'paused' ? resume : play}
                  disabled={supported !== true || !text.trim()}
                >
                  <span aria-hidden="true">▶</span> {speaking === 'paused' ? 'Resume' : 'Play'}
                </button>
                <button
                  type="button"
                  className={`btn-ghost ${supported !== true || speaking !== 'speaking' ? 'cursor-not-allowed opacity-50' : ''}`}
                  onClick={pause}
                  disabled={supported !== true || speaking !== 'speaking'}
                >
                  <span aria-hidden="true">❚❚</span> Pause
                </button>
                <button
                  type="button"
                  className={`btn-ghost ${supported !== true || speaking === 'idle' ? 'cursor-not-allowed opacity-50' : ''}`}
                  onClick={stop}
                  disabled={supported !== true || speaking === 'idle'}
                >
                  <span aria-hidden="true">■</span> Stop
                </button>
                <span role="status" aria-live="polite" className="text-sm text-on-surface-variant">
                  {instantStatusText}
                </span>
              </div>

              <div>
                <label htmlFor={voiceId} className="label text-on-surface-variant">
                  Voice
                </label>
                <select
                  id={voiceId}
                  className="input mt-2 w-full sm:max-w-sm"
                  value={voiceURI}
                  onChange={(e) => setVoiceURI(e.target.value)}
                  disabled={voices.length === 0}
                >
                  {voices.length === 0 ? (
                    <option value="">Loading voices…</option>
                  ) : (
                    voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </>
          )
        ) : (
          <div className="space-y-4">
            {modelStatus !== 'ready' && (
              <p className="text-sm text-on-surface-variant">
                {neuralDevice === 'wasm'
                  ? "Your browser doesn't support WebGPU, so the neural voice will run in software on your device's CPU — generation can be slower than real time, especially for long text."
                  : neuralDevice === 'webgpu'
                    ? 'Your browser supports WebGPU, so the neural voice should generate speech at or faster than real time.'
                    : ''}
              </p>
            )}

            {modelStatus === 'idle' && (
              <button type="button" className="btn-ghost" onClick={() => void loadNeuralModel()}>
                Load neural voice (~90 MB, downloads once, then cached)
              </button>
            )}

            {modelStatus === 'loading' && (
              <div>
                <button type="button" className="btn-ghost cursor-not-allowed opacity-50" disabled>
                  Loading neural voice…
                </button>
                <progress value={loadProgress} max={100} className="mt-2 block w-full max-w-sm" aria-hidden="true" />
                <p role="status" aria-live="polite" className="mt-2 text-sm text-on-surface-variant">
                  {loadStatusText}
                </p>
              </div>
            )}

            {modelStatus === 'error' && (
              <div>
                <p role="alert" className="text-sm text-[color:var(--color-critical)]">
                  {modelError}
                </p>
                <button type="button" className="btn-ghost mt-3" onClick={() => void loadNeuralModel()}>
                  Try loading the neural voice again
                </button>
              </div>
            )}

            {modelStatus === 'ready' && (
              <>
                <p role="status" aria-live="polite" className="sr-only">
                  {loadStatusText}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={`btn-ghost ${!text.trim() ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={() => void playNeural()}
                    disabled={!text.trim() || neuralPlayback === 'generating'}
                  >
                    <span aria-hidden="true">▶</span> {neuralPlayback === 'paused' ? 'Resume' : 'Play'}
                  </button>
                  <button
                    type="button"
                    className={`btn-ghost ${neuralPlayback !== 'playing' ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={pauseNeural}
                    disabled={neuralPlayback !== 'playing'}
                  >
                    <span aria-hidden="true">❚❚</span> Pause
                  </button>
                  <button
                    type="button"
                    className={`btn-ghost ${neuralPlayback === 'idle' ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={stopNeuralPlayback}
                    disabled={neuralPlayback === 'idle'}
                  >
                    <span aria-hidden="true">■</span> Stop
                  </button>
                  <span role="status" aria-live="polite" className="text-sm text-on-surface-variant">
                    {neuralStatusText}
                  </span>
                </div>

                <div>
                  <label htmlFor={neuralVoiceSelectId} className="label text-on-surface-variant">
                    Voice
                  </label>
                  <select
                    id={neuralVoiceSelectId}
                    className="input mt-2 w-full sm:max-w-sm"
                    value={neuralVoiceId}
                    onChange={(e) => setNeuralVoiceId(e.target.value)}
                  >
                    {CURATED_KOKORO_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {kokoroVoiceLabel(v)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    Showing {CURATED_KOKORO_VOICES.length} of Kokoro-82M&rsquo;s English voices, picked for quality.
                    Currently selected: {selectedNeuralVoice.name}.
                  </p>
                </div>

                {/* eslint-disable-next-line jsx-a11y/media-has-caption -- generated speech, no captions to attach */}
                <audio ref={audioElRef} onEnded={handleNeuralAudioEnded} className="hidden" />
              </>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={rateId} className="label text-on-surface-variant">
              Rate — {rate.toFixed(1)}×
            </label>
            <input
              id={rateId}
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="mt-3 h-6 w-full accent-[color:var(--color-primary)]"
            />
          </div>
          {mode === 'instant' && (
            <div>
              <label htmlFor={pitchId} className="label text-on-surface-variant">
                Pitch — {pitch.toFixed(1)}
              </label>
              <input
                id={pitchId}
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="mt-3 h-6 w-full accent-[color:var(--color-primary)]"
              />
            </div>
          )}
        </div>
        {mode === 'neural' && (
          <p className="text-xs text-on-surface-variant">
            Pitch isn&rsquo;t adjustable for the neural voice — only rate/speed is.
          </p>
        )}
      </div>

      <div>
        <h2 className="h2 mt-0 text-lg">Privacy</h2>
        <div className="mt-3 rounded-2xl border border-outline-variant p-5">
          <p className="text-sm text-on-surface-variant">
            Instant mode speaks using voices your browser or operating system already has installed — nothing is
            downloaded or sent anywhere. Neural mode downloads the open-weight{' '}
            <a
              href="https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX"
              className="underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              Kokoro-82M
            </a>{' '}
            model (Apache 2.0 licence) from Hugging Face&rsquo;s CDN to your device — after that one-time download,
            every reading in either mode happens entirely on your device, and nothing you type is ever sent to a
            server. Kokoro&rsquo;s text-to-phoneme step also loads a small espeak-ng-based component (GPL-licensed,
            fetched separately from the model itself) the first time you use Neural mode.
          </p>
        </div>
      </div>
    </div>
  )
}
