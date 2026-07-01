// Demo fill + read-back for FL-180 (Judgment). Same Gonzalez profile as FL-100.
// Run: node scripts/demo-fl180.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL180Profile, FL180_MAPPING } from '../src/pdf/fl180.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

const OUT = process.env.FL180_OUT || join(tmpdir(), 'FL-180-demo.pdf')

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
  { field_key: 'date_of_marriage', value: '2010-06-15' }, // FL-100 source (no FL-180 field)
  { field_key: 'date_of_separation', value: '2024-02-01' },
  { field_key: 'marital_status_end_date', value: '2026-09-30' },
  { field_key: 'restore_former_name', value: 'true' },
  { field_key: 'former_name', value: 'Maria Elena Ramirez' },
  { field_key: 'assets', value: JSON.stringify([{ description: 'Family residence', value: 450000 }]) },
  { field_key: 'signature_date', value: '2026-06-30' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }

const profile = buildFL180Profile(state)
console.log('attachments:', ['fl341','fl342','fl343','fl345'].filter((k) => profile['attach_' + k]).join(', '), '| pages:', profile.pages_attached)

const doc = await PDFDocument.load(readFileSync('public/forms/FL-180.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const report = setFieldValues(form, applyMapping(profile, FL180_MAPPING))
console.log('set:', report.set.length, ' missing:', report.missing.length, ' skipped:', report.skipped.length)
if (report.missing.length) console.log('MISSING:\n  ' + report.missing.join('\n  '))
if (report.skipped.length) console.log('SKIPPED:\n  ' + report.skipped.join('\n  '))

writeFileSync(OUT, await doc.save())
console.log('wrote', OUT)

// ---- read-back ----
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
  'party block': FL180_MAPPING.party_block,
  'court county': FL180_MAPPING.court_county,
  'petitioner': FL180_MAPPING.petitioner_name,
  'respondent': FL180_MAPPING.respondent_name,
  'case name (p2)': FL180_MAPPING.case_name,
  'JT dissolution': FL180_MAPPING.jt_dissolution,
  'status-ends date': FL180_MAPPING.marital_status_end_date,
  'basis default': FL180_MAPPING.basis_default,
  'basis declaration': FL180_MAPPING.basis_declaration,
  'diss entered': FL180_MAPPING.diss_entered,
  'diss on date box': FL180_MAPPING.diss_on_date,
  'restore former (P)': FL180_MAPPING.restore_former_petitioner,
  'former name': FL180_MAPPING.former_name,
  'support notice': FL180_MAPPING.support_notice,
  'children are': FL180_MAPPING.children_are,
  'attach FL-341 (ord)': FL180_MAPPING.attach_fl341[0],
  'attach FL-341 (box)': FL180_MAPPING.attach_fl341[1],
  'attach FL-342 (ord)': FL180_MAPPING.attach_fl342[0],
  'attach FL-342 (box)': FL180_MAPPING.attach_fl342[1],
  'attach FL-343': FL180_MAPPING.attach_fl343[0],
  'attach FL-345 (ord)': FL180_MAPPING.attach_fl345[0],
  'attach FL-345 (box)': FL180_MAPPING.attach_fl345[1],
  'pages attached': FL180_MAPPING.pages_attached,
  'sig date': FL180_MAPPING.signature_date,
}
console.log('\n---- read-back ----')
for (const [label, name] of Object.entries(checks)) console.log(label.padEnd(22), read(name))
