#!/usr/bin/env node
// Self-test for pricing + phased review model (src/config/pricing.js).
//   npm run check-pricing
// Verifies §9 tiers and the §10 "PHASE 1→2 flips the offer with no component
// edits" criterion (offer() is the single derive point). Exit 0/1 for CI.

import { PRICING, tierForCase, priceForCase, attorneyReviewRange, offer } from '../src/config/pricing.js'

let failed = 0
const check = (label, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${label}`)
  if (!cond) failed++
}

// --- §9 pricing ---
check('essentials = 299', PRICING.essentials === 299)
check('family = 499', PRICING.family === 499)
check('court fee = 435 (pass-through)', PRICING.courtFee === 435)
check('attorney range = 75–125', JSON.stringify(attorneyReviewRange()) === JSON.stringify([75, 125]))
check('no-children case → essentials $299', priceForCase({ caseRec: { has_children: false } }) === 299)
check('children case → family $499', priceForCase({ caseRec: { has_children: true } }) === 499)
check('tierForCase(children) = family', tierForCase({ caseRec: { has_children: true } }) === 'family')

// --- §10 phased review: offer() derives the whole model from PHASE ---
const p1 = offer(1)
const p2 = offer(2)
check('phase 1: review is optional add-on', p1.reviewOptional === true && p1.reviewDefault === false)
check('phase 1: shows "coming soon" honesty note', p1.showComingSoonNote === true)
check('phase 1: self-help available', p1.softTierAvailable === true)
check('phase 2: review is the default main path', p2.reviewDefault === true && p2.reviewOptional === false)
check('phase 2: no "coming soon" note', p2.showComingSoonNote === false)
check('phase 2 + softAvailable=false: bare self-help removed', offer(2, false).softTierAvailable === false)
check('phase 1 ≠ phase 2 composition (toggle changes flow)', JSON.stringify(p1) !== JSON.stringify(p2))

if (failed) {
  console.error(`\n✖ pricing self-test: ${failed} check(s) failed`)
  process.exit(1)
}
console.log('\n✓ pricing self-test: all checks passed')
