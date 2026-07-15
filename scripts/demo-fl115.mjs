// Demo fill + read-back for FL-115 (Proof of Service of Summons).
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL115Profile, FL115_MAPPING } from '../src/pdf/fl115.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'
const OUT = process.env.FL115_OUT || join(tmpdir(), 'FL-115-demo.pdf')
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
  { field_key: 'service_method', value: 'personal' }, { field_key: 'service_date', value: '2026-03-10' },
  { field_key: 'service_time', value: '6:15 p.m.' },
  { field_key: 'service_server_name', value: 'James Wright' },
  { field_key: 'service_server_address', value: '500 Server Lane, Los Angeles, CA 90020' },
  { field_key: 'service_server_phone', value: '(213) 555-0300' },
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }
const profile = buildFL115Profile(state)
const doc = await PDFDocument.load(readFileSync('public/forms/FL-115.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const rep = setFieldValues(form, applyMapping(profile, FL115_MAPPING))
console.log('FL-115 set:', rep.set.length, 'missing:', rep.missing.length, 'skipped:', rep.skipped.length)
if (rep.missing.length) console.log('MISSING:\n  ' + rep.missing.join('\n  '))
writeFileSync(OUT, await doc.save()); console.log('wrote', OUT)
const f2 = (await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })).getForm()
const read = (n) => { const nm = Array.isArray(n)?n[0]:n; try { const f=f2.getField(nm); return f.constructor.name==='PDFCheckBox'?(f.isChecked()?'[x]':'[ ]'):JSON.stringify(f.getText()??'') } catch { return '<none>' } }
const checks = { 'party name':FL115_MAPPING.party_name,'petitioner':FL115_MAPPING.petitioner_name,'respondent':FL115_MAPPING.respondent_name,
  'docs FL100/110/120':FL115_MAPPING.docs_family_law,'docs FL-105':FL115_MAPPING.docs_fl105,'address served':FL115_MAPPING.address_served,
  'personal service':FL115_MAPPING.personal_service,'personal date':FL115_MAPPING.personal_date,'server name':FL115_MAPPING.server_name,
  'not registered':FL115_MAPPING.server_not_registered,'declaration':FL115_MAPPING.declaration,'sig name':FL115_MAPPING.sig_name }
console.log('---- read-back ----'); for (const [l,n] of Object.entries(checks)) console.log('  ', l.padEnd(20), read(n))
