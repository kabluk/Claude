// Demo fill + read-back for FL-150 — proves the substantive sections (not just
// the caption) are populated. Run: node scripts/demo-fl150.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL150Profile, FL150_MAPPING } from '../src/pdf/fl150.js'
import { applyMapping, setFieldValues, adjustRects } from '../src/pdf/engine.js'

const OUT = process.env.FL150_OUT || join(tmpdir(), 'FL-150-demo.pdf')

// ---- plausible single-source data for "consent + children + Los Angeles" ----
const fl150_profile = {
  employment: {
    employer: 'Sunrise Health Inc.',
    address: '500 Market St, Los Angeles, CA 90013',
    phone: '(213) 555-0182',
    occupation: 'Registered Nurse',
    date_started: '2019-03-04',
    hours_per_week: '40',
    age: '38',
  },
  education: { high_school: true, college_years: '4' },
  tax: { year: '2025', status: 'head_of_household', state: 'CA', exemptions: '3' },
  income: {
    salary: 7200,
    overtime: 350,
    commissions: '',
    pension: 0,
    dividends: 120,
    rental: 0,
    self_employment: 0,
    business_name: '',
  },
  deductions: { union_dues: 40, retirement: 300, health_premiums: 210, job_expenses: 75 },
  assets: { cash: 5400, stocks: 12000 },
  expenses: {
    home: 2400,
    home_type: 'rent',
    property_tax: 0,
    home_insurance: 35,
    healthcare: 150,
    childcare: 900,
    groceries: 800,
    eating_out: 220,
    utilities: 260,
    phone: 120,
    laundry: 60,
    clothes: 150,
    education: 80,
    entertainment: 140,
    auto: 380,
    insurance: 90,
    savings: 200,
    charity: 50,
    installments: 0,
    other: 0,
  },
  children: { health_insurance: true, health_company: 'Kaiser Permanente', health_cost: 180, timeshare_me: 65 },
}

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
  { field_key: 'petitioner_income', value: '7200' },
  { field_key: 'respondent_income', value: '9500' },
  { field_key: 'children', value: JSON.stringify([{ name: 'A', dob: '2016-05-01' }, { name: 'B', dob: '2019-08-12' }]) },
  { field_key: 'assets', value: JSON.stringify([{ desc: 'Family home', value: 450000 }]) },
  { field_key: 'finance_profile', value: JSON.stringify({ timeshareA: 65 }) },
  { field_key: 'fl150_profile', value: JSON.stringify(fl150_profile) },
  { field_key: 'signature_date', value: '2026-06-30' },
]

const profile = buildFL150Profile({ user: { county: 'Los Angeles' }, caseRec: {}, answers })
console.log('expenses total (computed in app):', profile.exp_total)

const bytes = readFileSync('public/forms/FL-150.pdf')
const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
const form = doc.getForm()
adjustRects(form, {})
const pdfValues = applyMapping(profile, FL150_MAPPING)
const report = setFieldValues(form, pdfValues)

console.log('\nset:', report.set.length, ' missing:', report.missing.length, ' skipped:', report.skipped.length)
if (report.missing.length) console.log('MISSING:\n  ' + report.missing.join('\n  '))
if (report.skipped.length) console.log('SKIPPED:\n  ' + report.skipped.join('\n  '))

writeFileSync(OUT, await doc.save())
console.log('wrote', OUT)

// ---- read-back: re-open and print key items on pages 2,3,4 ----
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
  'p2 §5a salary': FL150_MAPPING.inc_salary,
  'p2 §5b overtime': FL150_MAPPING.inc_overtime,
  'p2 §6 dividends': FL150_MAPPING.inv_dividends,
  'p2 §10b retirement': FL150_MAPPING.ded_retirement,
  'p2 §10c health': FL150_MAPPING.ded_health,
  'p2 §10g job exp': FL150_MAPPING.ded_job,
  'p2 §11 cash': FL150_MAPPING.asset_cash,
  'p2 §11 stocks': FL150_MAPPING.asset_stocks,
  'p3 §13a home (rent)': FL150_MAPPING.exp_home,
  'p3 §13a rent box': FL150_MAPPING.exp_is_rent,
  'p3 §13c childcare': FL150_MAPPING.exp_childcare,
  'p3 §13l auto': FL150_MAPPING.exp_auto,
  'p3 §13 TOTAL': FL150_MAPPING.exp_total,
  'p4 §16 #children': FL150_MAPPING.num_children,
  'p4 §16 % me': FL150_MAPPING.ts_me,
  'p4 §16 % other': FL150_MAPPING.ts_other,
  'p4 §17 has insurance': FL150_MAPPING.hc_have,
  'p4 §17 company': FL150_MAPPING.hc_company,
  'p4 §17 cost': FL150_MAPPING.hc_cost,
}
console.log('\n---- read-back (pages 2/3/4) ----')
for (const [label, name] of Object.entries(checks)) {
  console.log(label.padEnd(22), read(name))
}
