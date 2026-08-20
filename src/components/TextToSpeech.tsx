// G-CHECKERS-BATCH-1: interactive text-to-speech reader for
// /checkers/text-to-speech/. No lib needed — this wraps the browser's own
// Web Speech API (window.speechSynthesis). Same template as the other
// checkers for state/UI discipline.
//
// Accessibility discipline:
//  - the textarea and every control (voice select, rate/pitch sliders) has a
//    real <label>;
//  - speaking state is announced through a single aria-live="polite" region;
//  - Play/Pause/Stop are real <button>s, sized the same as every other
//    .btn-ghost control on the site (already ≥24px target size);
//  - own chrome styled ONLY with tokens.
//
// SSG-hydration discipline (prerender has no window/speechSynthesis):
//  - `supported` starts as `null` ("not yet determined") — the initial
//    render is IDENTICAL on the server and the first client paint (controls
//    shown, Play disabled, voice list empty) regardless of whether the real
//    browser supports the API or not;
//  - feature detection + the voice list are only read inside a mount effect
//    (never during render), and the 'voiceschanged' event keeps the list in
//    sync since it loads asynchronously in some browsers;
//  - once the effect resolves `supported` to true/false, React re-renders
//    normally — that's a post-hydration update, not a mismatch, because both
//    the server HTML and the first client render agreed on `null`.

import { useEffect, useId, useRef, useState } from 'react'

const SAMPLE_TEXT = `Plain language helps everyone. This tool reads text aloud using your browser's own built-in voices — nothing you type here is sent anywhere.`

type SpeakState = 'idle' | 'speaking' | 'paused'

export function TextToSpeech() {
  const [text, setText] = useState(SAMPLE_TEXT)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [speaking, setSpeaking] = useState<SpeakState>('idle')

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const textareaId = useId()
  const voiceId = useId()
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

  // Cleanup on unmount: don't leave a browser tab talking after navigation.
  useEffect(
    () => () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    },
    [],
  )

  const statusText = speaking === 'speaking' ? 'Reading aloud.' : speaking === 'paused' ? 'Paused.' : ''

  if (supported === false) {
    return (
      <div className="panel mt-8 max-w-2xl">
        <p className="text-on-surface">
          Your browser doesn&rsquo;t support the Web Speech API this tool relies on, so it can&rsquo;t
          read text aloud here. Try a recent version of Chrome, Edge or Safari, or use your operating
          system&rsquo;s own screen reader or speech feature instead.
        </p>
      </div>
    )
  }

  return (
    <div className="panel mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="space-y-6">
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
            Uses your browser&rsquo;s own installed voices. Nothing you type here is sent anywhere —
            the whole thing runs on your device.
          </p>
        </div>

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
            {statusText}
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
        </div>
      </div>

      <div>
        <h2 className="h2 mt-0 text-lg">Privacy</h2>
        <div className="mt-3 rounded-2xl border border-outline-variant p-5">
          <p className="text-sm text-on-surface-variant">
            Speech happens entirely on your device, using voices your browser or operating system
            already has installed. Nothing you type is ever sent to a server.
          </p>
        </div>
      </div>
    </div>
  )
}
