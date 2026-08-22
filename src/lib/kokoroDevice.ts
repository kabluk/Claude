// G-CHECKER-TTS-NEURAL: device/precision selection for the Kokoro-82M neural
// TTS engine. Pure, dependency-free (no `kokoro-js` import) so it is
// testable without the heavy package and stays out of any bundle weight.
//
// Device: prefer WebGPU when the browser exposes `navigator.gpu` — it's
// dramatically faster than WASM for a model this size. WASM is the
// universal fallback everywhere WebGPU isn't available (older browsers,
// Safari without the flag, most of Firefox as of this writing).
//
// Precision (dtype): kokoro-js's own README explicitly recommends `fp32`
// when running on WebGPU, and uses `q8` as the default in its primary WASM
// example (fp32 on WASM is documented elsewhere as too slow/heavy for a
// browser tab). We follow both of those upstream defaults here.
//
// HONESTY NOTE (see DECISIONS.md, G-CHECKER-TTS-NEURAL entry): the task
// asked us to verify with a real generation in Playwright whether `q8`
// produces broken/garbled audio in this build, and fall back to `q4`/`fp16`
// if so. We could NOT do that: this sandbox's outbound network reaches
// registries/HTTPS via a proxy from `curl`/Node, but a Playwright-launched
// Chromium process could not reach the same proxy (connection reset on
// every attempt, with or without `--proxy-server`/`--no-sandbox`), so no
// real model weights could be downloaded into a real browser tab here. The
// `wasm` dtype below is therefore the *documented upstream default*, not an
// empirically-verified choice for this app. `WASM_DTYPE` is a single named
// constant specifically so a future session with working network access can
// re-run the live check and flip it to `'q4'` in one place if needed.
export type KokoroDevice = 'webgpu' | 'wasm'
export type KokoroDtype = 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16'

export const WEBGPU_DTYPE: KokoroDtype = 'fp32'
export const WASM_DTYPE: KokoroDtype = 'q8'

/** `hasWebGPU` should be `typeof navigator !== 'undefined' && 'gpu' in navigator`. */
export function pickKokoroDevice(hasWebGPU: boolean): KokoroDevice {
  return hasWebGPU ? 'webgpu' : 'wasm'
}

export function pickKokoroDtype(device: KokoroDevice): KokoroDtype {
  return device === 'webgpu' ? WEBGPU_DTYPE : WASM_DTYPE
}
