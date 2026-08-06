import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeOverlay, applyOverlay } from './apply-d1-overlay.mjs'

const AGENCIES = [
  { slug: 'deque-systems', name: 'Deque Systems' },
  { slug: 'tpgi', name: 'TPGi' },
  { slug: 'already-featured', name: 'Already Featured', featured: { until: '2020-01-01' } },
]

test('computeOverlay: only includes featured rows whose until has not passed', () => {
  const { featuredBySlug } = computeOverlay({
    claimedRows: [],
    featuredRows: [
      { agency_slug: 'deque-systems', until: '2027-01-01' }, // future
      { agency_slug: 'tpgi', until: '2020-01-01' }, // past
    ],
    today: '2026-08-06',
  })
  assert.ok(featuredBySlug.has('deque-systems'))
  assert.equal(featuredBySlug.size, 1)
})

test('applyOverlay: sets claimed=true only for agencies with a verified claim', () => {
  const overlay = computeOverlay({
    claimedRows: [{ agency_slug: 'deque-systems' }],
    featuredRows: [],
    today: '2026-08-06',
  })
  const { patched, claimedCount } = applyOverlay(AGENCIES, overlay)
  assert.equal(claimedCount, 1)
  assert.equal(patched.find((a) => a.slug === 'deque-systems').claimed, true)
  assert.equal(patched.find((a) => a.slug === 'tpgi').claimed, undefined)
})

test('applyOverlay: sets featured for a currently-active D1 row', () => {
  const overlay = computeOverlay({
    claimedRows: [],
    featuredRows: [{ agency_slug: 'tpgi', until: '2027-06-01' }],
    today: '2026-08-06',
  })
  const { patched, featuredCount } = applyOverlay(AGENCIES, overlay)
  assert.equal(featuredCount, 1)
  assert.deepEqual(patched.find((a) => a.slug === 'tpgi').featured, { until: '2027-06-01' })
})

test('applyOverlay: removes a stale featured flag that D1 no longer backs (expired or refunded)', () => {
  // 'already-featured' carries a featured field in the fixture but D1 has no
  // current row for it -> the static field must not survive the overlay.
  const overlay = computeOverlay({ claimedRows: [], featuredRows: [], today: '2026-08-06' })
  const { patched } = applyOverlay(AGENCIES, overlay)
  const agency = patched.find((a) => a.slug === 'already-featured')
  assert.equal(agency.featured, undefined)
})

test('applyOverlay: is idempotent — running it twice with the same D1 state gives identical output', () => {
  const overlay = computeOverlay({
    claimedRows: [{ agency_slug: 'deque-systems' }],
    featuredRows: [{ agency_slug: 'tpgi', until: '2027-06-01' }],
    today: '2026-08-06',
  })
  const first = applyOverlay(AGENCIES, overlay).patched
  const second = applyOverlay(first, overlay).patched // re-run against already-patched output
  assert.deepEqual(first, second)
})

test('applyOverlay: does not mutate the input array (pure function)', () => {
  const overlay = computeOverlay({ claimedRows: [{ agency_slug: 'deque-systems' }], featuredRows: [], today: '2026-08-06' })
  const before = JSON.stringify(AGENCIES)
  applyOverlay(AGENCIES, overlay)
  assert.equal(JSON.stringify(AGENCIES), before)
})

test('applyOverlay: does not touch fields outside claimed/featured', () => {
  const overlay = computeOverlay({ claimedRows: [{ agency_slug: 'deque-systems' }], featuredRows: [], today: '2026-08-06' })
  const { patched } = applyOverlay(AGENCIES, overlay)
  assert.equal(patched.find((a) => a.slug === 'deque-systems').name, 'Deque Systems')
})
