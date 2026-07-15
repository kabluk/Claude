// Demo fill + read-back for FW-003 (Order on Court Fee Waiver — caption only).
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFW003Profile, FW003_MAPPING } from '../src/pdf/fw003.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'
const OUT = process.env.FW003_OUT || join(tmpdir(), 'FW-003-demo.pdf')
const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'party_street', value: '123 Elm Street, Apt 4' },
  { field_key: 'party_city', value: 'Los Angeles' }, { field_key: 'party_state', value: 'CA' },
  { field_key: 'party_zip', value: '90013' },
  { field_key: 'fee_waiver_sig_date', value: '2026-07-13' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested' }, answers }
const profile = buildFW003Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FW-003.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const rep = setFieldValues(form, applyMapping(profile, FW003_MAPPING))
console.log('FW-003 set:', rep.set.length, 'missing:', rep.missing.length, 'skipped:', rep.skipped.length)
if (rep.missing.length) console.log('MISSING:\n  ' + rep.missing.join('\n  '))
writeFileSync(OUT, await doc.save()); console.log('wrote', OUT)
const f2 = (await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })).getForm()
const read = (n) => { const nm = Array.isArray(n) ? n[0] : n; try { const f = f2.getField(nm); return f.constructor.name === 'PDFCheckBox' ? (f.isChecked() ? '[x]' : '[ ]') : JSON.stringify(f.getText() ?? '') } catch { return '<none>' } }
const checks = {
  'person name': FW003_MAPPING.person_name, 'street': FW003_MAPPING.person_street,
  'city': FW003_MAPPING.person_city, 'court county': FW003_MAPPING.court_county,
  'case name': FW003_MAPPING.case_name, 'request filed': FW003_MAPPING.request_filed_date,
}
console.log('---- read-back ----'); for (const [l, n] of Object.entries(checks)) console.log('  ', l.padEnd(20), read(n))
