// Gate: worker/lib/oursDescriptions.js is a hand-duplicated mirror of
// OURS_DESCRIPTIONS in this file (worker/ cannot reliably import wcag.ts — see
// worker/lib/oursDescriptions.js header). The PDF plan (worker/lib/pdfPlan.js)
// must describe our own checks with the exact same prose the public /wcag/
// pages already use — a silent drift here would make the paid document
// contradict our own free reference page for the same ruleId.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OURS_DESCRIPTIONS as tsDescriptions } from './wcag.ts'
import { OURS_DESCRIPTIONS as workerDescriptions } from '../../worker/lib/oursDescriptions.js'

test('worker/lib/oursDescriptions.js is byte-for-byte identical to src/lib/wcag.ts::OURS_DESCRIPTIONS', () => {
  assert.deepEqual(workerDescriptions, tsDescriptions)
})

test('canary: the comparison above can actually fail', () => {
  const tampered = { ...tsDescriptions, 'a11y-keyboard-trap': { does: 'something else entirely' } }
  assert.notDeepEqual(tampered, tsDescriptions)
})
