// Demo fill + read-back for FL-343 (Spousal Support Order Attachment).
// Two tests: (a) reserve (matches FL-180); (b) order $1,500/mo respondent→petitioner.
// Run: node scripts/demo-fl343.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildFL343Profile, FL343_MAPPING } from '../src/pdf/fl343.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

const base = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'date_of_marriage', value: '2010-06-15' },
  { field_key: 'date_of_separation', value: '2024-02-01' },
]
const scenarios = {
  reserve: [...base], // no spousal_support_type → defaults to reserved (like FL-180)
  order: [
    ...base,
    { field_key: 'spousal_support_type', value: 'order' },
    { field_key: 'spousal_payer', value: 'respondent' },
    { field_key: 'spousal_payee', value: 'petitioner' },
    { field_key: 'spousal_amount', value: '1500' },
    { field_key: 'spousal_start_date', value: '2026-10-01' },
  ],
}

const read = (form, n) => {
  const name = Array.isArray(n) ? n[0] : n
  try {
    const f = form.getField(name)
    if (f.constructor.name === 'PDFCheckBox') return f.isChecked() ? '[x]' : '[ ]'
    return JSON.stringify(f.getText() ?? '')
  } catch { return '<none>' }
}

for (const [name, answers] of Object.entries(scenarios)) {
  const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }
  const profile = buildFL343Profile(state)
  const doc = await PDFDocument.load(readFileSync('public/forms/FL-343.pdf'), { ignoreEncryption: true })
  const form = doc.getForm()
  const rep = setFieldValues(form, applyMapping(profile, FL343_MAPPING))
  const out = join(tmpdir(), `FL-343-${name}.pdf`)
  writeFileSync(out, await doc.save())
  console.log(`\n===== ${name.toUpperCase()} =====  set:${rep.set.length} missing:${rep.missing.length}`, rep.missing.length ? rep.missing.join(',') : '')
  const doc2 = await PDFDocument.load(readFileSync(out), { ignoreEncryption: true })
  const f2 = doc2.getForm()
  const checks = {
    'attaches FL-180': FL343_MAPPING.attaches_to_fl180,
    '3a reserve': FL343_MAPPING.reserve_support,
    '3a reserve pet': FL343_MAPPING.reserve_petitioner,
    '3a reserve resp': FL343_MAPPING.reserve_respondent,
    '3b terminate': FL343_MAPPING.terminate_support,
    '4 payer pet': FL343_MAPPING.order_payer_petitioner,
    '4 payer resp': FL343_MAPPING.order_payer_respondent,
    '4 payee pet': FL343_MAPPING.order_payee_petitioner,
    '4 permanent': FL343_MAPPING.order_permanent,
    '4 spousal': FL343_MAPPING.order_spousal,
    '4 amount': FL343_MAPPING.order_amount,
    '4 begin': FL343_MAPPING.order_begin_date,
    '5 EWO': FL343_MAPPING.ewo_issue,
    '9 Gavron': FL343_MAPPING.gavron,
  }
  for (const [l, nm] of Object.entries(checks)) console.log('  ', l.padEnd(18), read(f2, nm))
  console.log('   wrote', out)
}
