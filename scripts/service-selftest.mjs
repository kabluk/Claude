#!/usr/bin/env node
// Self-test for served-docs extraction → FL-115 (src/vision/service.js).
//   npm run check-service
//
// The live vision call (extract-service Edge Function) is deploy-gated, so this
// drives SYNTHETIC extraction objects and asserts: (1) no fabrication survives,
// (2) unreadable → factual refusal (empty draft), (3) client-confirmed values
// flow into FL-115 and pass the real read-back. Exit 0/1 for CI.

import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { validateServiceExtraction, serviceToDraft, applyConfirmedService } from '../src/vision/service.js'
import { buildFL115Profile, FL115_MAPPING } from '../src/pdf/fl115.js'
import { applyMapping, setFieldValues } from '../src/pdf/engine.js'

let failed = 0
const check = (label, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${label}`)
  if (!cond) failed++
}

const IMAGES = {
  personal: { readable: true, service_date: '2026-03-10', service_method: 'personal', service_time: '6:15 p.m.', address_served: '77 Oak Avenue, Los Angeles, CA 90015', server_name: 'James Wright', server_address: '500 Server Lane, Los Angeles, CA 90020' },
  mail_partial: { readable: true, service_date: '2026-03-12', service_method: 'mail', service_time: null, address_served: null, server_name: 'A. Clerk', server_address: null },
  blurry: { readable: false },
  garbage: { readable: true, service_date: 'March 10', service_method: 'carrier-pigeon', service_time: 42, server_name: '', address_served: null },
}

// (1) no fabrication survives
const g = validateServiceExtraction(IMAGES.garbage)
check('garbage: bad date → null', g.value.service_date === null)
check('garbage: bad method → null', g.value.service_method === null)
check('garbage: numeric time → null', g.value.service_time === null)
check('garbage: empty server_name → null', g.value.server_name === null)
check('garbage: validator reports errors', g.ok === false && g.errors.length > 0)

// (2) unreadable → empty draft (factual refusal)
check('blurry: readable=false', validateServiceExtraction(IMAGES.blurry).value.readable === false)
check('blurry: empty draft', serviceToDraft(IMAGES.blurry).length === 0)

// partial: only the present fields appear
const partial = serviceToDraft(IMAGES.mail_partial)
check('mail_partial: no service_time draft (was null)', !partial.some((d) => d.key === 'service_time'))
check('mail_partial: has service_date + method', partial.some((d) => d.key === 'service_date') && partial.some((d) => d.key === 'service_method'))

// (3) confirmed values → FL-115 read-back
const draft = serviceToDraft(IMAGES.personal)
const { answers: svc } = applyConfirmedService(draft, draft.map((d) => d.key))
check('confirmed: service_date mapped', svc.service_date === '2026-03-10')
check('confirmed: method mapped', svc.service_method === 'personal')
check('confirmed: server_name mapped', svc.service_server_name === 'James Wright')

const answers = [
  { field_key: 'petitioner_name', value: 'Maria Elena Gonzalez' },
  { field_key: 'respondent_name', value: 'Carlos Gonzalez' },
  { field_key: 'party_name', value: 'Maria Elena Gonzalez' },
  ...Object.entries(svc).map(([field_key, value]) => ({ field_key, value })),
]
const state = { user: { county: 'Los Angeles' }, caseRec: { type: 'uncontested', has_children: true }, answers }
const doc = await PDFDocument.load(readFileSync('public/forms/FL-115.pdf'), { ignoreEncryption: true })
const form = doc.getForm()
const rep = setFieldValues(form, applyMapping(buildFL115Profile(state), FL115_MAPPING))
check('FL-115 read-back: 0 missing', rep.missing.length === 0)
const OUT = join(tmpdir(), 'FL-115-service-demo.pdf')
writeFileSync(OUT, await doc.save())
const f2 = (await PDFDocument.load(readFileSync(OUT), { ignoreEncryption: true })).getForm()
const readTxt = (n) => { const nm = Array.isArray(n) ? n[0] : n; try { return f2.getField(nm).getText() ?? '' } catch { return '' } }
const isChecked = (n) => { const nm = Array.isArray(n) ? n[0] : n; try { return f2.getField(nm).isChecked() } catch { return false } }
check('FL-115: personal service checked from photo', isChecked(FL115_MAPPING.personal_service))
check('FL-115: server name filled from photo', readTxt(FL115_MAPPING.server_name) === 'James Wright')
check('FL-115: service date filled from photo', readTxt(FL115_MAPPING.personal_date).includes('03/10/2026'))

if (failed) {
  console.error(`\n✖ service self-test: ${failed} check(s) failed`)
  process.exit(1)
}
console.log('\n✓ service self-test: all checks passed')
