// Demo fill + read-back for FL-100 (Petition). Verifies relief checkboxes,
// marriage/separation dates, computeTimeMarried, and the children list.
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL100Profile, FL100_MAPPING } from '../src/pdf/fl100.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'
const OUT = process.env.FL100_OUT || join(tmpdir(), 'FL-100-demo.pdf')
const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'party_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'party_street', value: '123 Elm Street, Apt 4' },
  { field_key: 'party_city', value: 'Los Angeles' }, { field_key: 'party_state', value: 'CA' },
  { field_key: 'party_zip', value: '90013' }, { field_key: 'party_phone', value: '(213) 555-0199' },
  { field_key: 'party_email', value: 'maria@example.com' },
  { field_key: 'date_of_marriage', value: '2010-06-15' },
  { field_key: 'date_of_separation', value: '2024-02-01' },
  { field_key: 'residency_party', value: 'petitioner' },
  { field_key: 'children', value: JSON.stringify([
    { name: 'Sofia Gonzalez', dob: '2016-05-01', sex: 'F' },
    { name: 'Diego Gonzalez', dob: '2019-08-12', sex: 'M' },
  ]) },
  { field_key: 'assets', value: JSON.stringify([{ description: 'Family residence', value: 450000 }]) },
  { field_key: 'signature_date', value: '2026-06-30' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }
const profile = buildFL100Profile(state)
console.log('computeTimeMarried:', profile.time_married_years, 'yrs', profile.time_married_months, 'mo')
const doc = await PDFDocument.load(readFileSync('public/forms/FL-100.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const rep = setFieldValues(form, applyMapping(profile, FL100_MAPPING))
console.log('FL-100 set:', rep.set.length, 'missing:', rep.missing.length, 'skipped:', rep.skipped.length)
if (rep.missing.length) console.log('MISSING:\n  ' + rep.missing.join('\n  '))
writeFileSync(OUT, await doc.save()); console.log('wrote', OUT)
const f2 = (await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })).getForm()
const read = (n) => { const nm = Array.isArray(n)?n[0]:n; try { const f=f2.getField(nm); return f.constructor.name==='PDFCheckBox'?(f.isChecked()?'[x]':'[ ]'):JSON.stringify(f.getText()??'') } catch { return '<none>' } }
const checks = {
  'relief: Dissolution': FL100_MAPPING.pt_dissolution, 'relief: Marriage': FL100_MAPPING.rel_marriage,
  '§5 grounds Divorce': FL100_MAPPING.gd_divorce, '§1a married': FL100_MAPPING.rel_married,
  'date of marriage': FL100_MAPPING.date_of_marriage, 'date of separation': FL100_MAPPING.date_of_separation,
  'time married (yrs)': FL100_MAPPING.time_married_years, 'time married (mo)': FL100_MAPPING.time_married_months,
  '§4 has children': FL100_MAPPING.has_minor_children,
  'child1 name': FL100_MAPPING.child_1_name, 'child1 dob': FL100_MAPPING.child_1_dob, 'child1 age': FL100_MAPPING.child_1_age,
  'child2 name': FL100_MAPPING.child_2_name, 'child2 dob': FL100_MAPPING.child_2_dob, 'child2 age': FL100_MAPPING.child_2_age,
  '§8 community prop': FL100_MAPPING.community_property,
}
console.log('---- read-back (substantive) ----'); for (const [l,n] of Object.entries(checks)) console.log('  ', l.padEnd(20), read(n))
