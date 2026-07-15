#!/usr/bin/env node
// Unit test for timeline date arithmetic (src/timeline/milestones.js).
//   npm run check-milestones
// Exit 0 on pass, 1 on any mismatch (for CI).

import { generateMilestones, addMonths, addDays, toISO, parseISO } from '../src/timeline/milestones.js'

let failed = 0
const check = (label, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${label}`)
  if (!cond) failed++
}
const on = (ms, key) => ms.find((m) => m.key === key)?.dueDate

// --- primary case: served 2026-01-15 ---
const ms = generateMilestones({ serviceDate: '2026-01-15' })
check('proof_of_service = service date', on(ms, 'proof_of_service') === '2026-01-15')
check('response_deadline = +30 days (2026-02-14)', on(ms, 'response_deadline') === '2026-02-14')
check('disclosures_due = +60 days (2026-03-16)', on(ms, 'disclosures_due') === '2026-03-16')
check('waiting_period_end = +6mo +1d (2026-07-16)', on(ms, 'waiting_period_end') === '2026-07-16')
check('judgment_prep = waiting_end −30d (2026-06-16)', on(ms, 'judgment_prep') === '2026-06-16')
check('milestones sorted ascending', ms.every((m, i) => i === 0 || ms[i - 1].dueDate <= m.dueDate))

// --- disclosures anchor to filing date when provided ---
const ms2 = generateMilestones({ serviceDate: '2026-01-15', petitionFiledDate: '2026-01-01' })
check('disclosures anchor to filing (2026-01-01 +60 = 2026-03-02)', on(ms2, 'disclosures_due') === '2026-03-02')
check('waiting still anchored to service (2026-07-16)', on(ms2, 'waiting_period_end') === '2026-07-16')

// --- month-end clamp: Aug 31 + 6 months → Feb (clamped) ---
check('addMonths clamps Aug 31 +6mo → 2025-02-28', toISO(addMonths(parseISO('2024-08-31'), 6)) === '2025-02-28')
check('leap-year clamp: 2027-08-31 +6mo → 2028-02-29', toISO(addMonths(parseISO('2027-08-31'), 6)) === '2028-02-29')

// --- year rollover on day add ---
check('addDays rolls over year (2026-12-20 +30 = 2027-01-19)', toISO(addDays(parseISO('2026-12-20'), 30)) === '2027-01-19')

// --- no service date → empty ---
check('no service date → []', generateMilestones({}).length === 0)

if (failed) {
  console.error(`\n✖ milestone self-test: ${failed} check(s) failed`)
  process.exit(1)
}
console.log('\n✓ milestone self-test: all checks passed')
