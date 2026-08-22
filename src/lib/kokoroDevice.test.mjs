import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickKokoroDevice, pickKokoroDtype, WEBGPU_DTYPE, WASM_DTYPE } from './kokoroDevice.ts'

test('picks webgpu when navigator.gpu is present', () => {
  assert.equal(pickKokoroDevice(true), 'webgpu')
})

test('falls back to wasm when navigator.gpu is absent', () => {
  assert.equal(pickKokoroDevice(false), 'wasm')
})

test('webgpu uses fp32 per kokoro-js upstream recommendation', () => {
  assert.equal(pickKokoroDtype('webgpu'), 'fp32')
  assert.equal(WEBGPU_DTYPE, 'fp32')
})

test('wasm uses a quantized dtype (not the heavy fp32) for browser-sized downloads', () => {
  const dtype = pickKokoroDtype('wasm')
  assert.notEqual(dtype, 'fp32')
  assert.equal(dtype, WASM_DTYPE)
})
