// Demo fill + read-back for FL-142 (Schedule of Assets and Debts).
// Same Gonzalez profile as FL-150/FL-140; asset buckets reconcile with FL-150.
// Run: node scripts/demo-fl142.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL142Profile, FL142_MAPPING } from '../src/pdf/fl142.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

const OUT = process.env.FL142_OUT || join(tmpdir(), 'FL-142-demo.pdf')

// Full itemization. Deposit buckets sum to FL-150 §11a (5,400); stocks = §11b
// (12,000); real estate net = §11c (450,000). Debts are FL-142-only detail.
const fl142_profile = {
  assets: {
    real_estate: [{ description: 'Family residence — 123 Elm Street, Apt 4, Los Angeles', date: '2012-04-15', value: 450000, owed: 0 }],
    savings: [{ description: 'Bank of America savings ****1234', value: 2000 }],
    checking: [{ description: 'Chase checking ****5678', value: 3400 }],
    stocks: [{ description: 'Vanguard brokerage ****9012', value: 12000 }],
  },
  debts: {
    credit_cards: [{ description: 'Visa ****4321 (Chase)', amount: 3200, date: '2023-11-01' }],
    student_loans: [{ description: 'Federal Direct Loan', amount: 8500, date: '2008-09-01' }],
  },
}
const fl150_profile = { assets: { cash: 5400, stocks: 12000 } }

const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'party_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'party_street', value: '123 Elm Street, Apt 4' },
  { field_key: 'party_city', value: 'Los Angeles' },
  { field_key: 'party_state', value: 'CA' },
  { field_key: 'party_zip', value: '90013' },
  { field_key: 'party_phone', value: '(213) 555-0199' },
  { field_key: 'party_email', value: 'maria@example.com' },
  { field_key: 'signature_date', value: '2026-06-30' },
  { field_key: 'fl150_profile', value: JSON.stringify(fl150_profile) },
  { field_key: 'fl142_profile', value: JSON.stringify(fl142_profile) },
]

const profile = buildFL142Profile({ user: { county: 'Los Angeles' }, caseRec: {}, answers })
console.log('assets total (app):', profile.assets_value_total, ' debts total (app):', profile.debts_total)

const doc = await PDFDocument.load(readFileSync('public/forms/FL-142.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const report = setFieldValues(form, applyMapping(profile, FL142_MAPPING))
console.log('set:', report.set.length, ' missing:', report.missing.length, ' skipped:', report.skipped.length)
if (report.missing.length) console.log('MISSING:\n  ' + report.missing.join('\n  '))
if (report.skipped.length) console.log('SKIPPED:\n  ' + report.skipped.join('\n  '))

writeFileSync(OUT, await doc.save())
console.log('wrote', OUT)

// ---- read-back ----
const doc2 = await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })
const form2 = doc2.getForm()
const read = (name) => {
  try {
    const f = form2.getField(name)
    if (f.constructor.name === 'PDFCheckBox') return f.isChecked() ? '[x]' : '[ ]'
    return JSON.stringify(f.getText() ?? '')
  } catch {
    return '<<NO FIELD>>'
  }
}
const checks = {
  'party block': FL142_MAPPING.party_block,
  'court county': FL142_MAPPING.court_county,
  'petitioner': FL142_MAPPING.petitioner_name,
  "Petitioner's box": FL142_MAPPING.party_petitioner,
  '1 real estate desc': FL142_MAPPING.real_estate_desc,
  '1 real estate value': FL142_MAPPING.real_estate_value,
  '5 savings value': FL142_MAPPING.savings_value,
  '6 checking value': FL142_MAPPING.checking_value,
  '11 stocks value': FL142_MAPPING.stocks_value,
  '18 ASSETS TOTAL': FL142_MAPPING.assets_value_total,
  '18 owed total': FL142_MAPPING.assets_owed_total,
  '23 credit card desc': FL142_MAPPING.credit_cards_desc,
  '23 credit card owing': FL142_MAPPING.credit_cards_owing,
  '19 student loan owing': FL142_MAPPING.student_loans_owing,
  '26 DEBTS TOTAL': FL142_MAPPING.debts_total,
  'continuation flag': FL142_MAPPING.continuation_flag,
  'sig date': FL142_MAPPING.signature_date,
  'printed name': FL142_MAPPING.petitioner_printed_name,
}
console.log('\n---- read-back ----')
for (const [label, name] of Object.entries(checks)) console.log(label.padEnd(22), read(name))

// reconciliation with FL-150 summary
const depositSum = 2000 + 3400
console.log('\nreconcile vs FL-150 §11:',
  'deposits', depositSum === 5400 ? 'OK 5,400' : 'MISMATCH',
  '| stocks', profile.stocks_value === '12,000' ? 'OK 12,000' : 'MISMATCH',
  '| real estate', profile.real_estate_value === '450,000' ? 'OK 450,000' : 'MISMATCH')
