// Demo fill + read-back for FL-144 (Stipulation and Waiver of Final Declaration
// of Disclosure). Confirms BOTH signature blocks are filled. Same Gonzalez
// profile. Run: node scripts/demo-fl144.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL144Profile, FL144_MAPPING } from '../src/pdf/fl144.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

const OUT = process.env.FL144_OUT || join(tmpdir(), 'FL-144-demo.pdf')

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
  // both parties' signature data (respondent_* added just for this form)
  { field_key: 'petitioner_printed_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'petitioner_signature_date', value: '2026-06-30' },
  { field_key: 'respondent_printed_name', value: 'Carlos Gonzalez' },
  { field_key: 'respondent_signature_date', value: '2026-06-30' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }

const profile = buildFL144Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FL-144.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const report = setFieldValues(form, applyMapping(profile, FL144_MAPPING))
console.log('set:', report.set.length, ' missing:', report.missing.length, ' skipped:', report.skipped.length)
if (report.missing.length) console.log('MISSING:\n  ' + report.missing.join('\n  '))
if (report.skipped.length) console.log('SKIPPED:\n  ' + report.skipped.join('\n  '))

writeFileSync(OUT, await doc.save())
console.log('wrote', OUT)

const doc2 = await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })
const form2 = doc2.getForm()
const read = (name) => {
  try {
    return JSON.stringify(form2.getField(name).getText() ?? '')
  } catch {
    return '<<NO FIELD>>'
  }
}
const checks = {
  'party block': FL144_MAPPING.party_block,
  'court county': FL144_MAPPING.court_county,
  'petitioner': FL144_MAPPING.petitioner_name,
  'respondent': FL144_MAPPING.respondent_name,
  'sig date (shared)': FL144_MAPPING.signature_date,
  'PETITIONER printed': FL144_MAPPING.petitioner_printed_name,
  'RESPONDENT printed': FL144_MAPPING.respondent_printed_name,
}
console.log('\n---- read-back ----')
for (const [label, name] of Object.entries(checks)) console.log(label.padEnd(20), read(name))

const p = read(FL144_MAPPING.petitioner_printed_name)
const r = read(FL144_MAPPING.respondent_printed_name)
console.log('\nBOTH signature blocks filled:', p !== '""' && r !== '""' ? 'YES ✓' : 'NO ✗')
