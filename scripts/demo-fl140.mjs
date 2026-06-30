// Demo fill + read-back for FL-140 (Declaration of Disclosure).
// Uses the SAME demo profile as FL-150. Run: node scripts/demo-fl140.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL140Profile, FL140_MAPPING } from '../src/pdf/fl140.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

const OUT = process.env.FL140_OUT || join(tmpdir(), 'FL-140-demo.pdf')

// Same single-source answers as the FL-150 demo (consent + children + LA).
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
  { field_key: 'signature_date', value: '2026-06-30' },
  // fl140_profile omitted → defaults: Petitioner / Preliminary / FL-142 + FL-150
  // + tax returns + valuation + obligations + investment disclosure.
]

const profile = buildFL140Profile({ user: { county: 'Los Angeles' }, caseRec: {}, answers })

const doc = await PDFDocument.load(readFileSync('public/forms/FL-140.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const pdfValues = applyMapping(profile, FL140_MAPPING)
const report = setFieldValues(form, pdfValues)
console.log('set:', report.set.length, ' missing:', report.missing.length, ' skipped:', report.skipped.length)
if (report.missing.length) console.log('MISSING:\n  ' + report.missing.join('\n  '))
if (report.skipped.length) console.log('SKIPPED:\n  ' + report.skipped.join('\n  '))

writeFileSync(OUT, await doc.save())
console.log('wrote', OUT)

// ---- read-back ----
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
  'party block': FL140_MAPPING.party_block,
  'phone': FL140_MAPPING.party_phone,
  'attorney for': FL140_MAPPING.attorney_for,
  'court county': FL140_MAPPING.court_county,
  'petitioner': FL140_MAPPING.petitioner_name,
  'respondent': FL140_MAPPING.respondent_name,
  "Petitioner's box": FL140_MAPPING.party_petitioner,
  "Respondent's box": FL140_MAPPING.party_respondent,
  'Preliminary box': FL140_MAPPING.type_preliminary,
  'Final box': FL140_MAPPING.type_final,
  '1. FL-142': FL140_MAPPING.attach_fl142,
  '1. FL-160': FL140_MAPPING.attach_fl160,
  '2. FL-150': FL140_MAPPING.attach_fl150,
  '3. tax returns': FL140_MAPPING.attach_tax_returns,
  '4. valuation stmt': FL140_MAPPING.attach_valuation_stmt,
  '5. obligations stmt': FL140_MAPPING.attach_obligations_stmt,
  '6. investment discl': FL140_MAPPING.attach_investment_disclosure,
  'sig date': FL140_MAPPING.signature_date,
  'printed name': FL140_MAPPING.petitioner_printed_name,
}
console.log('\n---- read-back ----')
for (const [label, name] of Object.entries(checks)) {
  console.log(label.padEnd(20), read(name))
}
