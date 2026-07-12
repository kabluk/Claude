// Demo fill + read-back for FL-165 (Request to Enter Default).
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL165Profile, FL165_MAPPING } from '../src/pdf/fl165.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'
const OUT = process.env.FL165_OUT || join(tmpdir(), 'FL-165-demo.pdf')
const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'party_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'party_street', value: '123 Elm Street, Apt 4' },
  { field_key: 'party_city', value: 'Los Angeles' }, { field_key: 'party_state', value: 'CA' },
  { field_key: 'party_zip', value: '90013' }, { field_key: 'party_phone', value: '(213) 555-0199' },
  { field_key: 'party_email', value: 'maria@example.com' },
  { field_key: 'respondent_street', value: '77 Oak Avenue' }, { field_key: 'respondent_city', value: 'Los Angeles' },
  { field_key: 'respondent_state', value: 'CA' }, { field_key: 'respondent_zip', value: '90015' },
  { field_key: 'default_request_date', value: '2026-05-01' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }
const profile = buildFL165Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FL-165.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const rep = setFieldValues(form, applyMapping(profile, FL165_MAPPING))
console.log('FL-165 set:', rep.set.length, 'missing:', rep.missing.length, 'skipped:', rep.skipped.length)
if (rep.missing.length) console.log('MISSING:\n  ' + rep.missing.join('\n  '))
writeFileSync(OUT, await doc.save()); console.log('wrote', OUT)
const f2 = (await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })).getForm()
const read = (n) => { const nm = Array.isArray(n)?n[0]:n; try { const f=f2.getField(nm); return f.constructor.name==='PDFCheckBox'?(f.isChecked()?'[x]':'[ ]'):JSON.stringify(f.getText()??'') } catch { return '<none>' } }
const checks = { 'petitioner':FL165_MAPPING.petitioner_name,'respondent':FL165_MAPPING.respondent_name,
  'FL-150 attached':FL165_MAPPING.fl150_attached,'written agreement':FL165_MAPPING.decl_written_agreement,
  'request name':FL165_MAPPING.request_name,'request date':FL165_MAPPING.request_date,
  'mailing to clerk':FL165_MAPPING.mailing_to_clerk,'mailing address':FL165_MAPPING.mailing_address,
  'costs waived':FL165_MAPPING.costs_waived,'non-military':FL165_MAPPING.nonmilitary_communication }
console.log('---- read-back ----'); for (const [l,n] of Object.entries(checks)) console.log('  ', l.padEnd(20), read(n))
