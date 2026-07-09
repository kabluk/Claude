// Demo fill + read-back for FL-345 (Property Order Attachment). Assets/debts from
// the same source as FL-142; only the assignment is added. Run: node scripts/demo-fl345.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL345Profile, FL345_MAPPING } from '../src/pdf/fl345.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

const OUT = process.env.FL345_OUT || join(tmpdir(), 'FL-345-demo.pdf')

// Same items as the FL-142 demo (single source).
const fl142_profile = {
  assets: {
    real_estate: [{ description: 'Family residence — 123 Elm Street, Apt 4, Los Angeles', value: 450000, owed: 0 }],
    savings: [{ description: 'Bank of America savings ****1234', value: 2000 }],
    checking: [{ description: 'Chase checking ****5678', value: 3400 }],
    stocks: [{ description: 'Vanguard brokerage ****9012', value: 12000 }],
  },
  debts: {
    credit_cards: [{ description: 'Visa ****4321 (Chase)', amount: 3200 }],
    student_loans: [{ description: 'Federal Direct Loan', amount: 8500 }],
  },
}
// Assignment (user-controlled): petitioner keeps the home + her student loan;
// respondent takes the accounts + the Visa.
const fl345_profile = {
  assets: { real_estate: 'petitioner', savings: 'respondent', checking: 'respondent', stocks: 'respondent' },
  debts: { student_loans: 'petitioner', credit_cards: 'respondent' },
}

const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'fl142_profile', value: JSON.stringify(fl142_profile) },
  { field_key: 'fl345_profile', value: JSON.stringify(fl345_profile) },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }

const profile = buildFL345Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FL-345.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const rep = setFieldValues(form, applyMapping(profile, FL345_MAPPING))
console.log('set:', rep.set.length, ' missing:', rep.missing.length, ' skipped:', rep.skipped.length)
if (rep.missing.length) console.log('MISSING:\n  ' + rep.missing.join('\n  '))
writeFileSync(OUT, await doc.save())
console.log('wrote', OUT)

const doc2 = await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })
const f2 = doc2.getForm()
const read = (n) => {
  const name = Array.isArray(n) ? n[0] : n
  try {
    const f = f2.getField(name)
    if (f.constructor.name === 'PDFCheckBox') return f.isChecked() ? '[x]' : '[ ]'
    return JSON.stringify(f.getText() ?? '')
  } catch { return '<none>' }
}
const checks = {
  'petitioner': FL345_MAPPING.petitioner_name,
  'respondent': FL345_MAPPING.respondent_name,
  'pet receives assets': FL345_MAPPING.pet_receives_assets,
  'pet assets': FL345_MAPPING.pet_assets_text,
  'resp receives assets': FL345_MAPPING.resp_receives_assets,
  'resp assets': FL345_MAPPING.resp_assets_text,
  'assets as separate': FL345_MAPPING.assets_as_separate,
  'pet takes debts': FL345_MAPPING.pet_takes_debts,
  'pet debts': FL345_MAPPING.pet_debts_text,
  'resp takes debts': FL345_MAPPING.resp_takes_debts,
  'resp debts': FL345_MAPPING.resp_debts_text,
  'equalize': FL345_MAPPING.equalize,
  'equalize payer pet': FL345_MAPPING.equalize_payer_pet,
  'equalize amount': FL345_MAPPING.equalize_amount,
}
console.log('\n---- read-back ----')
for (const [l, nm] of Object.entries(checks)) console.log('  ', l.padEnd(22), read(nm))
