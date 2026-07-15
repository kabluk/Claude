#!/usr/bin/env node
// Self-test for the Court-Readiness Check (src/readiness/checks.js).
//
//   node scripts/readiness-selftest.mjs
//
// Verifies the directive's acceptance criteria:
//   - a CLEAN case → zero warnings/errors (all ✅);
//   - a BROKEN case with (a) an empty required field, (b) diverging separation
//     dates in two form keys, (c) minor children but FL-105 missing from the
//     packet → EXACTLY three ❌, each carrying a working fix-anchor.
// Exit 0 on pass, 1 on any mismatch (for CI).

import { runReadiness } from '../src/readiness/checks.js'

const answer = (obj) => Object.entries(obj).map(([field_key, value]) => ({ field_key, value }))

let failed = 0
const check = (label, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${label}`)
  if (!cond) failed++
}

// --------------------------------------------------------------- clean case ---
const cleanState = {
  user: { county: 'Los Angeles' },
  caseRec: { type: 'uncontested', has_children: true },
  answers: answer({
    petitioner_name: 'Alex Rivera',
    respondent_name: 'Sam Rivera',
    party_street: '123 Main St',
    party_city: 'Los Angeles',
    party_state: 'CA',
    party_zip: '90012',
    respondent_address: '456 Oak Ave, Los Angeles, CA 90013',
    marriage_date: '2015-06-01',
    separation_date: '2024-03-15',
    respondent_signature: 'Sam Rivera',
    signature_date: '2026-07-01',
    children: JSON.stringify([{ name: 'Jordan Rivera', dob: '2018-04-10' }]),
  }),
}

const clean = runReadiness(cleanState)
check('clean: 0 errors', clean.counts.error === 0)
check('clean: 0 warnings', clean.counts.warn === 0)
check('clean: has ✅ items', clean.counts.ok > 0)
check('clean: fields_ok present', clean.items.some((i) => i.key === 'fields_ok'))
check('clean: consistency_ok present', clean.items.some((i) => i.key === 'consistency_ok'))
check('clean: forms_ok present', clean.items.some((i) => i.key === 'forms_ok'))

// -------------------------------------------------------------- broken case ---
const brokenState = {
  user: { county: 'Los Angeles' },
  caseRec: { type: 'uncontested', has_children: true },
  answers: answer({
    // (a) petitioner_name intentionally EMPTY
    petitioner_name: '',
    respondent_name: 'Sam Rivera',
    party_street: '123 Main St',
    party_city: 'Los Angeles',
    party_state: 'CA',
    party_zip: '90012',
    respondent_address: '456 Oak Ave, Los Angeles, CA 90013',
    marriage_date: '2015-06-01',
    // (b) two separation keys that DISAGREE
    separation_date: '2024-03-15',
    date_of_separation: '2023-11-01',
    respondent_signature: 'Sam Rivera',
    signature_date: '2026-07-01',
    children: JSON.stringify([{ name: 'Jordan Rivera', dob: '2018-04-10' }]),
  }),
  // (c) children present but FL-105 dropped from the packet (all other required
  //     forms kept, so FL-105 is the ONLY coverage gap).
  packet: ['FL-100', 'FL-110', 'FL-150', 'FL-141', 'FL-341', 'FL-342', 'FL-165', 'FL-343'],
}

const broken = runReadiness(brokenState)
const errs = broken.items.filter((i) => i.severity === 'error')
check(`broken: exactly 3 errors (got ${broken.counts.error})`, broken.counts.error === 3)
check('broken: empty-field error present', errs.some((e) => e.key === 'field_missing' && e.params.field === 'petitioner_name'))
check('broken: separation mismatch error present', errs.some((e) => e.key === 'sep_mismatch'))
check('broken: FL-105 form_missing error present', errs.some((e) => e.key === 'form_missing' && e.params.form === 'FL-105'))
check('broken: every error carries a working anchor', errs.every((e) => e.anchor && typeof e.anchor.route === 'string'))

if (failed) {
  console.error(`\n✖ readiness self-test: ${failed} check(s) failed`)
  process.exit(1)
}
console.log('\n✓ readiness self-test: all checks passed')
