// Demo fill + read-back for FL-342 (Child Support Information and Order
// Attachment) — a direct export of the §4055 calculator. Numbers come from the
// same finance_profile that feeds FL-150. Run: node scripts/demo-fl342.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL342Profile, FL342_MAPPING } from '../src/pdf/fl342.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

const OUT = process.env.FL342_OUT || join(tmpdir(), 'FL-342-demo.pdf')

// The finance_profile as persisted by the calculator screen (single source).
const finance_profile = {
  incomeA: 7200,
  incomeB: 9500,
  timeshareA: 65,
  children: 2,
  result: { total: 1326, perChild: 663, K: 0.2267, payer: 'B', children: 2 },
}
const fl150_profile = { children: { health_insurance: true, health_company: 'Kaiser Permanente', health_cost: 180 } }

const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'children', value: JSON.stringify([
    { name: 'Sofia Gonzalez', dob: '2016-05-01' },
    { name: 'Diego Gonzalez', dob: '2019-08-12' },
  ]) },
  { field_key: 'finance_profile', value: JSON.stringify(finance_profile) },
  { field_key: 'fl150_profile', value: JSON.stringify(fl150_profile) },
  { field_key: 'support_start_date', value: '2026-10-01' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }

const profile = buildFL342Profile(state)
console.log('payer(resp):', profile.payer_respondent, ' total:', profile.total_support, ' perChild:', profile.child1_amount)

const doc = await PDFDocument.load(readFileSync('public/forms/FL-342.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const report = setFieldValues(form, applyMapping(profile, FL342_MAPPING))
console.log('set:', report.set.length, ' missing:', report.missing.length, ' skipped:', report.skipped.length)
if (report.missing.length) console.log('MISSING:\n  ' + report.missing.join('\n  '))

writeFileSync(OUT, await doc.save())
console.log('wrote', OUT)

const doc2 = await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })
const form2 = doc2.getForm()
const read = (n) => {
  const name = Array.isArray(n) ? n[0] : n
  try {
    const f = form2.getField(name)
    if (f.constructor.name === 'PDFCheckBox') return f.isChecked() ? '[x]' : '[ ]'
    return JSON.stringify(f.getText() ?? '')
  } catch {
    return '<<NO FIELD>>'
  }
}
const checks = {
  'petitioner': FL342_MAPPING.petitioner_name,
  'respondent': FL342_MAPPING.respondent_name,
  'attaches FL-180': FL342_MAPPING.attaches_to_fl180,
  'petitioner net': FL342_MAPPING.petitioner_net,
  'respondent net': FL342_MAPPING.respondent_net,
  'children count': FL342_MAPPING.children_count,
  'timeshare pet %': FL342_MAPPING.timeshare_petitioner,
  'timeshare resp %': FL342_MAPPING.timeshare_respondent,
  'payer petitioner': FL342_MAPPING.payer_petitioner,
  'payer respondent': FL342_MAPPING.payer_respondent,
  'support on 1st': FL342_MAPPING.support_on_first,
  'start date': FL342_MAPPING.support_start_date,
  'child1 name': FL342_MAPPING.child1_name,
  'child1 amount': FL342_MAPPING.child1_amount,
  'child1 payable to': FL342_MAPPING.child1_payable_to,
  'child2 name': FL342_MAPPING.child2_name,
  'child2 amount': FL342_MAPPING.child2_amount,
  'TOTAL /month': FL342_MAPPING.total_support,
  '6b childcare pet%': FL342_MAPPING.addon_childcare_pet_pct,
  '6b childcare resp%': FL342_MAPPING.addon_childcare_resp_pct,
  '7a health petitioner': FL342_MAPPING.health_petitioner,
}
console.log('\n---- read-back ----')
for (const [label, name] of Object.entries(checks)) console.log(label.padEnd(22), read(name))

// consistency vs FL-150
console.log('\nconsistency: timeshare 65/35 matches FL-150 §16b:',
  read(FL342_MAPPING.timeshare_petitioner) === '"65"' && read(FL342_MAPPING.timeshare_respondent) === '"35"' ? 'OK' : 'MISMATCH')
