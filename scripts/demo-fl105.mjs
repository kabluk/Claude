// Demo fill + read-back for FL-105 (UCCJEA). Verifies children table + residence
// history + §4/§6 default No + signature.
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL105Profile, FL105_MAPPING } from '../src/pdf/fl105.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'
const OUT = process.env.FL105_OUT || join(tmpdir(), 'FL-105-demo.pdf')
const residences = [{ period: '2016-05-01 – present', city_state: 'Los Angeles, CA', lived_with: 'Maria & Carlos Gonzalez', relationship: 'Parents' }]
const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'party_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'party_street', value: '123 Elm Street, Apt 4' },
  { field_key: 'party_city', value: 'Los Angeles' }, { field_key: 'party_state', value: 'CA' },
  { field_key: 'party_zip', value: '90013' },
  { field_key: 'children', value: JSON.stringify([
    { name: 'Sofia Gonzalez', dob: '2016-05-01', birthplace: 'Los Angeles, CA', residences },
    { name: 'Diego Gonzalez', dob: '2019-08-12', birthplace: 'Los Angeles, CA', residences },
  ]) },
  { field_key: 'signature_date', value: '2026-06-30' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }
const profile = buildFL105Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FL-105.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const rep = setFieldValues(form, applyMapping(profile, FL105_MAPPING))
console.log('FL-105 set:', rep.set.length, 'missing:', rep.missing.length, 'skipped:', rep.skipped.length)
if (rep.missing.length) console.log('MISSING:\n  ' + rep.missing.join('\n  '))
writeFileSync(OUT, await doc.save()); console.log('wrote', OUT)
const f2 = (await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })).getForm()
const read = (n) => { const nm = Array.isArray(n)?n[0]:n; try { const f=f2.getField(nm); return f.constructor.name==='PDFCheckBox'?(f.isChecked()?'[x]':'[ ]'):JSON.stringify(f.getText()??'') } catch { return '<none>' } }
const checks = {
  'petitioner': FL105_MAPPING.petitioner_name, 'declarant is party': FL105_MAPPING.declarant_is_party,
  'children count': FL105_MAPPING.children_count, 'child1 name': FL105_MAPPING.child_1_name,
  'res1 from': FL105_MAPPING.res_1_from, 'res1 residence': FL105_MAPPING.res_1_residence,
  'res1 relationship': FL105_MAPPING.res_1_relationship,
  '§4 other case No': FL105_MAPPING.other_case_no, '§6 other person No': FL105_MAPPING.other_person_no,
  'sig printed name': FL105_MAPPING.petitioner_printed_name,
}
console.log('---- read-back ----'); for (const [l,n] of Object.entries(checks)) console.log('  ', l.padEnd(20), read(n))
