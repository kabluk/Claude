// Demo fill + read-back for FW-001 (Request to Waive Court Fees).
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFW001Profile, FW001_MAPPING } from '../src/pdf/fw001.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'
const OUT = process.env.FW001_OUT || join(tmpdir(), 'FW-001-demo.pdf')
const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'party_street', value: '123 Elm Street, Apt 4' },
  { field_key: 'party_city', value: 'Los Angeles' }, { field_key: 'party_state', value: 'CA' },
  { field_key: 'party_zip', value: '90013' }, { field_key: 'party_phone', value: '(213) 555-0199' },
  // income-basis path (item 5b): household of 3, income under the $4,553.33 limit
  { field_key: 'fee_waiver_requested', value: 'yes' },
  { field_key: 'fee_waiver_household', value: '3' },
  { field_key: 'fee_waiver_income', value: '3200' },
  { field_key: 'fee_waiver_benefits', value: JSON.stringify([]) },
  { field_key: 'fee_waiver_sig_date', value: '2026-07-13' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested' }, answers }
const profile = buildFW001Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FW-001.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const rep = setFieldValues(form, applyMapping(profile, FW001_MAPPING))
console.log('FW-001 set:', rep.set.length, 'missing:', rep.missing.length, 'skipped:', rep.skipped.length)
if (rep.missing.length) console.log('MISSING:\n  ' + rep.missing.join('\n  '))
writeFileSync(OUT, await doc.save()); console.log('wrote', OUT)
const f2 = (await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })).getForm()
const read = (n) => { const nm = Array.isArray(n) ? n[0] : n; try { const f = f2.getField(nm); return f.constructor.name === 'PDFCheckBox' ? (f.isChecked() ? '[x]' : '[ ]') : JSON.stringify(f.getText() ?? '') } catch { return '<none>' } }
const checks = {
  'court county': FW001_MAPPING.court_county, 'case name': FW001_MAPPING.case_name,
  'filer name': FW001_MAPPING.party_name, 'filer city': FW001_MAPPING.party_city,
  'waive superior': FW001_MAPPING.waive_superior, 'benefits (5a)': FW001_MAPPING.benefit_received,
  'income below (5b)': FW001_MAPPING.income_below, 'total income': FW001_MAPPING.total_income,
  'sig name': FW001_MAPPING.sig_name, 'sig date': FW001_MAPPING.sig_date,
}
console.log('---- read-back ----'); for (const [l, n] of Object.entries(checks)) console.log('  ', l.padEnd(20), read(n))
