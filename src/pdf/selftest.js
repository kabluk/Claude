// Self-test for the PDF engine — no real court form needed yet.
// It generates a sample fillable AcroForm PDF (standing in for an official
// form), then runs the real engine over it: load → listFields → map → fill →
// watermark → save. Used to verify the pipeline end-to-end.

import { PDFDocument, StandardFonts } from 'pdf-lib'
import { fillPdf } from './engine.js'
import { buildCaseProfile } from './profile.js'

// Build a fillable PDF with a few embedded fields (text + checkbox).
export async function createSampleFillablePdf() {
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792]) // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const form = doc.getForm()

  page.drawText('Sample Fillable Court Form (TEST)', { x: 50, y: 740, size: 16, font })

  const textField = (label, name, y) => {
    page.drawText(label, { x: 50, y: y + 22, size: 10, font })
    const tf = form.createTextField(name)
    tf.addToPage(page, { x: 50, y, width: 320, height: 18 })
  }

  textField('Petitioner name', 'PetitionerName', 690)
  textField('Respondent name', 'RespondentName', 640)
  textField('County', 'County', 590)
  textField('Child support total ($/mo)', 'SupportTotal', 540)
  textField('Total assets ($)', 'AssetsTotal', 490)

  page.drawText('Respondent agrees (waiver)', { x: 74, y: 444, size: 10, font })
  const cb = form.createCheckBox('AgreeBox')
  cb.addToPage(page, { x: 50, y: 440, width: 16, height: 16 })

  return doc.save()
}

// Mapping for the sample form: profile field_key → sample PDF field name.
export const SAMPLE_MAPPING = {
  petitioner_name: 'PetitionerName',
  respondent_name: 'RespondentName',
  county: 'County',
  child_support_total: 'SupportTotal',
  assets_total: 'AssetsTotal',
  respondent_consent: 'AgreeBox',
}

// Sample answers that exercise the profile builder + app-side totals.
const SAMPLE_ANSWERS = [
  { field_key: 'petitioner_name', value: 'Maria A. Garcia' },
  { field_key: 'respondent_name', value: 'David R. Garcia' },
  { field_key: 'respondent_consent', value: 'yes' },
  {
    field_key: 'assets',
    value: JSON.stringify([
      { category: 'real_estate', description: 'Condo', value: '450000' },
      { category: 'vehicle', description: 'Car', value: '18000' },
    ]),
  },
  {
    field_key: 'debts',
    value: JSON.stringify([{ creditor: 'Chase', type: 'Card', balance: '8200' }]),
  },
  {
    field_key: 'finance_profile',
    value: JSON.stringify({ result: { total: 1335, perChild: 667, payer: 'A' } }),
  },
]

// Run the full pipeline; returns { fields, report, bytes, profile }.
export async function runSelfTest({ fontBytes, watermarkText } = {}) {
  const sampleBytes = await createSampleFillablePdf()

  const profile = buildCaseProfile({
    user: { county: 'Los Angeles' },
    caseRec: { type: 'uncontested', has_children: true },
    answers: SAMPLE_ANSWERS,
  })

  const { bytes, fields, report } = await fillPdf({
    bytes: sampleBytes,
    values: profile,
    mapping: SAMPLE_MAPPING,
    watermark: fontBytes
      ? { text: watermarkText || 'DRAFT — проверьте перед подачей', fontBytes }
      : null,
  })

  return { fields, report, bytes, profile }
}
