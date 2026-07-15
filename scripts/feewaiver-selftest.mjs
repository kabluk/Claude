#!/usr/bin/env node
// Self-test for fee-waiver eligibility (src/data/feeWaiver.js) and the packet
// gate (fw001Required). Verifies the directive's "checklist adds / does not add
// FW" acceptance criterion. Exit 0 on pass, 1 on any mismatch (for CI).

import { evaluateFeeWaiver, monthlyIncomeLimit } from '../src/data/feeWaiver.js'
import { fw001Required } from '../src/pdf/fw001.js'

const A = (o) => Object.entries(o).map(([field_key, value]) => ({ field_key, value }))
let failed = 0
const check = (label, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${label}`)
  if (!cond) failed++
}

// --- income limits (FW-001 Rev. Mar 1, 2026) ---
check('limit hh1 = 2660', monthlyIncomeLimit(1) === 2660.0)
check('limit hh6 = 7393.33', monthlyIncomeLimit(6) === 7393.33)
check('limit hh8 = 7393.33 + 2×946.67', Math.abs(monthlyIncomeLimit(8) - (7393.33 + 2 * 946.67)) < 0.01)

// --- eligibility basis ---
check('benefit → basis=benefits', evaluateFeeWaiver({ benefits: ['snap'] }).basis === 'benefits')
check('income at/below → basis=income', evaluateFeeWaiver({ monthlyIncome: 3200, householdSize: 3 }).basis === 'income')
check('income at limit → eligible', evaluateFeeWaiver({ monthlyIncome: 4553.33, householdSize: 3 }).eligible === true)
check('income above limit, no benefit → not eligible', evaluateFeeWaiver({ monthlyIncome: 9000, householdSize: 3 }).eligible === false)
check('unknown benefit key ignored', evaluateFeeWaiver({ benefits: ['bogus'] }).eligible === false)

// --- packet gate ---
check('adds FW when a benefit is checked', fw001Required({ answers: A({ fee_waiver_benefits: JSON.stringify(['medical']) }) }) === true)
check('adds FW when income qualifies', fw001Required({ answers: A({ fee_waiver_income: '3200', fee_waiver_household: '3' }) }) === true)
check('adds FW when explicitly requested', fw001Required({ answers: A({ fee_waiver_requested: 'yes' }) }) === true)
check('does NOT add FW when nothing set', fw001Required({ answers: A({}) }) === false)
check('does NOT add FW when income high + no benefit', fw001Required({ answers: A({ fee_waiver_income: '9000', fee_waiver_household: '2' }) }) === false)

if (failed) {
  console.error(`\n✖ fee-waiver self-test: ${failed} check(s) failed`)
  process.exit(1)
}
console.log('\n✓ fee-waiver self-test: all checks passed')
