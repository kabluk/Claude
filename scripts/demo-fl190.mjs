// Demo fill + read-back for FL-190 (Notice of Entry of Judgment). Same Gonzalez
// profile as FL-180. Run: node scripts/demo-fl190.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL190Profile, FL190_MAPPING } from '../src/pdf/fl190.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

const OUT = process.env.FL190_OUT || join(tmpdir(), 'FL-190-demo.pdf')

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
  { field_key: 'respondent_street', value: '77 Oak Avenue' },
  { field_key: 'respondent_city', value: 'Los Angeles' },
  { field_key: 'respondent_state', value: 'CA' },
  { field_key: 'respondent_zip', value: '90015' },
  { field_key: 'marital_status_end_date', value: '2026-09-30' },
  { field_key: 'signature_date', value: '2026-06-30' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }

const profile = buildFL190Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FL-190.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const report = setFieldValues(form, applyMapping(profile, FL190_MAPPING))
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
    return JSON.stringify(f.getText() ?? '')
  } catch {
    return '<<NO FIELD>>'
  }
}
const checks = {
  'party name': FL190_MAPPING.party_name,
  'party street': FL190_MAPPING.party_street,
  'court county': FL190_MAPPING.court_county,
  'petitioner (P1)': FL190_MAPPING.petitioner_name,
  'respondent (P3)': FL190_MAPPING.respondent_name,
  'JT dissolution': FL190_MAPPING.jt_dissolution,
  'effective term date': FL190_MAPPING.marital_status_end_date,
  'petitioner mailing': FL190_MAPPING.petitioner_mailing,
  'respondent mailing': FL190_MAPPING.respondent_mailing,
  // court-filled fields must stay EMPTY
  'ENTRY date (empty)': 'FL-190[0].Page1[0].List1[0].Date_Judgment_Entered_cb[0]',
  'clerk by (empty)': 'FL-190[0].Page1[0].Clerk_by_ft[0]',
  'clerk date (empty)': 'FL-190[0].Page1[0].Date_dt[0]',
  'cert place (empty)': 'FL-190[0].Page1[0].ClerkCertificate[0].place_ft[0]',
}
console.log('\n---- read-back ----')
for (const [label, name] of Object.entries(checks)) console.log(label.padEnd(22), read(name))
