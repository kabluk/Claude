// California guideline child support — Family Code §4055.
//
//   CS = K × [HN − (H% × TN)]
//
//   K   = multiplier × fraction (see §4055(b)(3))
//   HN  = high earner's net monthly disposable income
//   H%  = high earner's share of parenting time (0–1)
//   TN  = total net monthly disposable income of both parents
//
// For more than one child, CS is multiplied by the §4055(b)(4) factor.
// Inputs here are treated as net monthly disposable income (no tax modelling).

// §4055(b)(4) multi-child multipliers (applied to the one-child CS).
const CHILD_FACTOR = {
  1: 1,
  2: 1.6,
  3: 2,
  4: 2.3,
  5: 2.5,
  6: 2.625,
  7: 2.75,
  8: 2.813,
  9: 2.844,
  10: 2.86,
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// §4055(b)(3) income fraction by total net disposable income (TN).
function kFraction(TN) {
  if (TN <= 800) return 0.2 + TN / 16000
  if (TN <= 6666) return 0.25
  if (TN <= 10000) return 0.1 + 1000 / TN
  return 0.12 + 800 / TN
}

// timeshareA = percent (0–100) of time children spend with parent A (petitioner).
export function computeGuideline({ incomeA, incomeB, timeshareA, children }) {
  const a = Math.max(0, Number(incomeA) || 0)
  const b = Math.max(0, Number(incomeB) || 0)
  const n = Math.floor(Number(children) || 0)
  const TN = a + b
  if (n <= 0 || TN <= 0) return null

  const aIsHigh = a >= b
  const HN = Math.max(a, b)
  const tsA = clamp(Number(timeshareA) || 0, 0, 100) / 100
  // H% = high earner's timeshare.
  const Hpct = aIsHigh ? tsA : 1 - tsA

  const fraction = kFraction(TN)
  const multiplier = Hpct <= 0.5 ? 1 + Hpct : 2 - Hpct
  const K = multiplier * fraction

  const csOneChild = K * (HN - Hpct * TN)
  const factor = CHILD_FACTOR[clamp(n, 1, 10)]
  let total = csOneChild * factor
  if (!Number.isFinite(total) || total < 0) total = 0

  return {
    total: Math.round(total),
    perChild: Math.round(total / n),
    K: Number(K.toFixed(4)),
    payer: aIsHigh ? 'A' : 'B', // higher earner is the obligor
    children: n,
  }
}
