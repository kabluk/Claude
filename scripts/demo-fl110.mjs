// Demo fill + read-back for FL-110 (Summons). Verifies respondent/petitioner
// names, court block, and party block.
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL110Profile, FL110_MAPPING } from '../src/pdf/fl110.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'
const OUT = process.env.FL110_OUT || join(tmpdir(), 'FL-110-demo.pdf')
const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'party_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'party_street', value: '123 Elm Street, Apt 4' },
  { field_key: 'party_city', value: 'Los Angeles' }, { field_key: 'party_state', value: 'CA' },
  { field_key: 'party_zip', value: '90013' }, { field_key: 'party_phone', value: '(213) 555-0199' },
  { field_key: 'party_email', value: 'maria@example.com' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }
const profile = buildFL110Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FL-110.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const rep = setFieldValues(form, applyMapping(profile, FL110_MAPPING))
console.log('FL-110 set:', rep.set.length, 'missing:', rep.missing.length, 'skipped:', rep.skipped.length)
if (rep.missing.length) console.log('MISSING:\n  ' + rep.missing.join('\n  '))
writeFileSync(OUT, await doc.save()); console.log('wrote', OUT)
const f2 = (await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })).getForm()
const read = (n) => { const nm = Array.isArray(n)?n[0]:n; try { const f=f2.getField(nm); return JSON.stringify(f.getText()??'') } catch { return '<none>' } }
const checks = {
  'respondent (notice to)': FL110_MAPPING.respondent_name, 'petitioner name': FL110_MAPPING.petitioner_name,
  'court block': FL110_MAPPING.court_block, 'party block': FL110_MAPPING.party_block,
}
console.log('---- read-back ----'); for (const [l,n] of Object.entries(checks)) console.log('  ', l.padEnd(22), read(n))
