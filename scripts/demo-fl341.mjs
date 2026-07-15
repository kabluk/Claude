// Demo fill + read-back for FL-341 (Child Custody and Visitation Order
// Attachment). Same children as FL-105/FL-180. Run: node scripts/demo-fl341.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL341Profile, FL341_MAPPING } from '../src/pdf/fl341.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

const OUT = process.env.FL341_OUT || join(tmpdir(), 'FL-341-demo.pdf')

const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'children', value: JSON.stringify([
    { name: 'Sofia Gonzalez', dob: '2016-05-01' },
    { name: 'Diego Gonzalez', dob: '2019-08-12' },
  ]) },
  { field_key: 'legal_custody_to', value: 'joint' },
  { field_key: 'physical_custody_to', value: 'joint' },
  { field_key: 'visitation_type', value: 'reasonable' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }

const profile = buildFL341Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FL-341.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const report = setFieldValues(form, applyMapping(profile, FL341_MAPPING))
console.log('set:', report.set.length, ' missing:', report.missing.length, ' skipped:', report.skipped.length)
if (report.missing.length) console.log('MISSING:\n  ' + report.missing.join('\n  '))
if (report.skipped.length) console.log('SKIPPED:\n  ' + report.skipped.join('\n  '))

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
  'petitioner (p1)': FL341_MAPPING.petitioner_name,
  'respondent (p1)': FL341_MAPPING.respondent_name,
  'attaches to FL-180': FL341_MAPPING.attaches_to_fl180,
  'custody parent': FL341_MAPPING.custody_parent,
  'child1 name': FL341_MAPPING.child1_name,
  'child1 dob': FL341_MAPPING.child1_dob,
  'child1 legal': FL341_MAPPING.child1_legal,
  'child1 physical': FL341_MAPPING.child1_physical,
  'child2 name': FL341_MAPPING.child2_name,
  'child2 dob': FL341_MAPPING.child2_dob,
  'child2 legal': FL341_MAPPING.child2_legal,
  'child2 physical': FL341_MAPPING.child2_physical,
  'visitation parent': FL341_MAPPING.vis_parent,
  'visitation reasonable': FL341_MAPPING.vis_reasonable,
  'visitation none': FL341_MAPPING.vis_none,
}
console.log('\n---- read-back ----')
for (const [label, name] of Object.entries(checks)) console.log(label.padEnd(22), read(name))
