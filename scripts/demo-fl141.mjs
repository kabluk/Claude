// Demo fill + read-back for FL-141 (Declaration Regarding Service of Disclosure).
// Same Gonzalez profile; consent scenario (prelim served, final waived 2105d).
// Run: node scripts/demo-fl141.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL141Profile, FL141_MAPPING } from '../src/pdf/fl141.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

const OUT = process.env.FL141_OUT || join(tmpdir(), 'FL-141-demo.pdf')

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
  // flat data model (the fields a future wizard section would collect)
  { field_key: 'petition_date', value: '2026-02-20' }, // service dates clamp to ≥ this
  { field_key: 'disclosure_party', value: 'petitioner' },
  { field_key: 'prelim_disclosure_served', value: 'true' },
  { field_key: 'prelim_served_date', value: '2026-03-15' },
  { field_key: 'final_disclosure_served', value: 'false' },
  { field_key: 'final_disclosure_waived', value: 'true' }, // FC 2105(d) → FL-144
  { field_key: 'petitioner_printed_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'signature_date', value: '2026-06-30' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }

const profile = buildFL141Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FL-141.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const report = setFieldValues(form, applyMapping(profile, FL141_MAPPING))
console.log('set:', report.set.length, ' missing:', report.missing.length, ' skipped:', report.skipped.length)
if (report.missing.length) console.log('MISSING:\n  ' + report.missing.join('\n  '))
if (report.skipped.length) console.log('SKIPPED:\n  ' + report.skipped.join('\n  '))

writeFileSync(OUT, await doc.save())
console.log('wrote', OUT)

const doc2 = await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })
const form2 = doc2.getForm()
const read = (name) => {
  try {
    const f = form2.getField(name)
    if (f.constructor.name === 'PDFCheckBox') return f.isChecked() ? '[x]' : '[ ]'
    if (f.constructor.name === 'PDFRadioGroup') return 'radio=' + JSON.stringify(f.getSelected() ?? '')
    return JSON.stringify(f.getText() ?? '')
  } catch {
    return '<<NO FIELD>>'
  }
}
const checks = {
  'party block': FL141_MAPPING.party_block,
  'court county': FL141_MAPPING.court_county,
  'petitioner': FL141_MAPPING.petitioner_name,
  'respondent': FL141_MAPPING.respondent_name,
  'title party (radio)': FL141_MAPPING.title_party,
  'title preliminary': FL141_MAPPING.title_preliminary,
  'title final': FL141_MAPPING.title_final,
  '1 I am petitioner': FL141_MAPPING.i_am_petitioner,
  '1 I am attorney': FL141_MAPPING.i_am_attorney,
  '2 prelim petitioner': FL141_MAPPING.prelim_petitioner,
  '2 prelim other party': FL141_MAPPING.prelim_on_other_party,
  '2 prelim by mail': FL141_MAPPING.prelim_by_mail,
  '2 prelim date': FL141_MAPPING.prelim_date,
  '3 final petitioner': FL141_MAPPING.final_petitioner,
  '4 service of': FL141_MAPPING.waive_service_of,
  '4 waive petitioner': FL141_MAPPING.waive_petitioner,
  '4 waive respondent': FL141_MAPPING.waive_respondent,
  '4 waive final': FL141_MAPPING.waive_final,
  '4a 2105d': FL141_MAPPING.waive_2105d,
  '4a FL-144 concurrent': FL141_MAPPING.waive_fl144_concurrent,
  '4c 2110': FL141_MAPPING.waive_2110,
  'sig name': FL141_MAPPING.signature_name,
  'sig date': FL141_MAPPING.signature_date,
}
console.log('\n---- read-back ----')
for (const [label, name] of Object.entries(checks)) console.log(label.padEnd(22), read(name))
