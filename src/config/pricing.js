// Pricing — the SINGLE source of truth for every amount shown in the product.
// No component or doc should hardcode a tier price; import from here.
//
// Model (DECISIONS.md, 2026-07): prices moved from $99/$149 → $299/$499 as the
// product grew (16 forms, Court-Readiness Check, Fee Waiver, 6-month timeline,
// paystub/served-docs vision, attorney review). Anchor is a $5k retainer / Hello
// Divorce ($400 DIY / $2k Pro) — not commodity form-fillers.
//
// Money flows are kept separate and labelled in the UI (transparency as a
// feature, not a footnote):
//   - tiers (essentials/family) → OUR Stripe (our revenue).
//   - attorneyReview            → paid DIRECTLY to the attorney (never our
//                                 revenue; a second, separate transaction — Rule 5.4).
//   - courtFee                  → government pass-through to the court (not ours).

export const PRICING = {
  essentials: 299, // uncontested/default, no minor children
  family: 499, // + FL-105, FL-341/342, support calculation
  attorneyReview: { min: 75, max: 125 }, // paid to the attorney, not to us
  courtFee: 435, // first-appearance dissolution fee — paid to the court, NOT our revenue
}

// Who each amount is paid to — drives the UI money-flow labels.
export const PAYEE = {
  tier: 'us', // Califormis (our Stripe)
  attorneyReview: 'attorney', // the reviewing attorney, directly
  courtFee: 'court', // the superior court
}

// Which tier a case falls into. Cases with minor children / support use Family.
export function tierForCase({ caseRec = {} } = {}) {
  return caseRec.has_children ? 'family' : 'essentials'
}

// The platform (software) price for a case — our revenue, tier-dependent.
export function priceForCase(state = {}) {
  return PRICING[tierForCase(state)]
}

// "$75–125" style range for the attorney review add-on.
export function attorneyReviewRange() {
  return [PRICING.attorneyReview.min, PRICING.attorneyReview.max]
}
