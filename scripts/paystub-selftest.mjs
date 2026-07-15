#!/usr/bin/env node
// Self-test for paystub extraction → FL-150 (src/vision/paystub.js).
//   npm run check-paystub
//
// The live vision call (extract-paystub Edge Function) is deploy-gated, so this
// drives 5 SYNTHETIC extraction objects — the JSON the model would return — and
// asserts: (1) no fabrication survives the validator, (2) unreadable → factual
// refusal (empty draft), (3) client-confirmed values flow into FL-150 and pass
// the real read-back. Exit 0 on pass, 1 on any mismatch (for CI).

import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { validateExtraction, extractionToDraft, normalizeMonthly, applyConfirmed } from '../src/vision/paystub.js'
import { buildFL150Profile, FL150_MAPPING } from '../src/pdf/fl150.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

let failed = 0
const check = (label, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${label}`)
  if (!cond) failed++
}

// 5 synthetic model outputs.
const IMAGES = {
  // 1) clean biweekly paystub
  biweekly: { readable: true, employer_name: 'Acme Corp', employer_address: '500 Industrial Rd, Los Angeles, CA 90020', pay_period_start: '2026-06-01', pay_period_end: '2026-06-14', pay_frequency: 'biweekly', gross_pay: 2400, net_pay: 1800, ytd_gross: 28800 },
  // 2) weekly, employer address not visible (null — must NOT be invented)
  weekly: { readable: true, employer_name: 'Bright Cafe', employer_address: null, pay_period_start: null, pay_period_end: '2026-06-13', pay_frequency: 'weekly', gross_pay: 900, net_pay: 720, ytd_gross: null },
  // 3) amount visible but frequency unreadable → no monthly guess
  no_freq: { readable: true, employer_name: 'Gig LLC', employer_address: null, pay_period_start: null, pay_period_end: null, pay_frequency: null, gross_pay: 1500, net_pay: 1200, ytd_gross: null },
  // 4) unreadable / not a paystub
  blurry: { readable: false, employer_name: null, employer_address: null, pay_period_start: null, pay_period_end: null, pay_frequency: null, gross_pay: null, net_pay: null, ytd_gross: null },
  // 5) fabrication attempt: garbage types that the validator must strip
  garbage: { readable: true, employer_name: 12345, employer_address: 'x', pay_period_start: 'June', pay_frequency: 'fortnightly', gross_pay: 'lots', net_pay: -50, ytd_gross: NaN },
}

// (1) no fabrication survives the validator
const g = validateExtraction(IMAGES.garbage)
check('garbage: employer_name(number) → null', g.value.employer_name === null)
check('garbage: bad frequency → null', g.value.pay_frequency === null)
check('garbage: non-numeric gross → null', g.value.gross_pay === null)
check('garbage: negative net → null', g.value.net_pay === null)
check('garbage: NaN ytd → null', g.value.ytd_gross === null)
check('garbage: validator reports errors', g.ok === false && g.errors.length > 0)

// (2) weekly: null employer address stays absent from the draft
const weeklyDraft = extractionToDraft(IMAGES.weekly)
check('weekly: no employer_address draft (was null)', !weeklyDraft.some((d) => d.key === 'employer_address'))
check('weekly: monthly salary = 900×52/12 = 3900', weeklyDraft.find((d) => d.key === 'monthly_salary')?.value === 3900)

// (3) no frequency → no monthly salary draft (never guessed)
check('no_freq: normalizeMonthly returns null', normalizeMonthly(1500, null) === null)
check('no_freq: no monthly_salary in draft', !extractionToDraft(IMAGES.no_freq).some((d) => d.key === 'monthly_salary'))

// (4) unreadable → empty draft (factual refusal path)
check('blurry: readable=false', validateExtraction(IMAGES.blurry).value.readable === false)
check('blurry: empty draft', extractionToDraft(IMAGES.blurry).length === 0)

// (5) client-confirmed biweekly values flow into FL-150 and read back
const draft = extractionToDraft(IMAGES.biweekly)
const expectedMonthly = normalizeMonthly(2400, 'biweekly') // 2400×26/12 = 5200
check('biweekly: monthly salary = 5200', draft.find((d) => d.key === 'monthly_salary')?.value === expectedMonthly)
const confirmed = draft.map((d) => d.key) // client ticks all
const { fl150_profile, petitioner_income } = applyConfirmed({}, draft, confirmed)
check('confirmed: employer written', fl150_profile.employment.employer === 'Acme Corp')
check('confirmed: salary written', fl150_profile.income.salary === 5200)
check('confirmed: petitioner_income set', petitioner_income === 5200)

const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'petitioner_income', value: String(petitioner_income) },
  { field_key: 'fl150_profile', value: JSON.stringify(fl150_profile) },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested' }, answers }
const doc = await PDFDocument.load(readFileSync('public/forms/FL-150.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const rep = setFieldValues(form, applyMapping(buildFL150Profile(state), FL150_MAPPING))
check('FL-150 read-back: 0 missing', rep.missing.length === 0)
const OUT = join(tmpdir(), 'FL-150-paystub-demo.pdf')
writeFileSync(OUT, await doc.save())
const f2 = (await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })).getForm()
const readTxt = (n) => { const nm = Array.isArray(n) ? n[0] : n; try { return f2.getField(nm).getText() ?? '' } catch { return '' } }
check('FL-150: employer filled from photo', readTxt(FL150_MAPPING.emp_employer) === 'Acme Corp')
check('FL-150: salary filled from photo', readTxt(FL150_MAPPING.inc_salary).includes('5200') || readTxt(FL150_MAPPING.inc_salary).includes('5,200'))

if (failed) {
  console.error(`\n✖ paystub self-test: ${failed} check(s) failed`)
  process.exit(1)
}
console.log('\n✓ paystub self-test: all checks passed')
