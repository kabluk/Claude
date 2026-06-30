// Reusable engine for filling official fillable PDFs (AcroForm) via pdf-lib.
//
// Principle: we fill the PDF's *embedded* form fields by name — we never draw
// text by coordinates. Workflow:
//   1. load the official fillable PDF
//   2. read its field names with listFields() (getFields under the hood)
//   3. map case-profile field_keys → PDF field names (per-form dictionary)
//   4. set the values on the matching AcroForm fields
//   5. (preview) stamp a DRAFT watermark
//
// All totals (assets, debts, expenses, support) are computed in the app and
// passed in as plain values — never calculated inside the form.

import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
} from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

export async function loadPdf(bytes, opts = {}) {
  // Official court forms are commonly permission-encrypted (no open password);
  // ignoreEncryption lets us read & fill their AcroForm fields.
  return PDFDocument.load(bytes, { ignoreEncryption: true, ...opts })
}

// Enumerate the PDF's embedded form fields (name + type).
export function listFields(pdfDoc) {
  const form = pdfDoc.getForm()
  return form.getFields().map((f) => ({
    name: f.getName(),
    type: f.constructor.name.replace(/^PDF/, ''),
  }))
}

// For checkboxes: any non-empty value checks the box, except explicit negatives.
// (A descriptive value like "Irreconcilable differences" means "check".)
const isTruthy = (v) => {
  if (typeof v === 'boolean') return v
  if (v == null) return false
  const s = String(v).trim().toLowerCase()
  if (s === '') return false
  return !['false', 'no', '0', 'off', 'n'].includes(s)
}

// Resolve { field_key: value } against a { field_key: pdfFieldName } mapping
// into { pdfFieldName: value }, dropping empty values and unmapped keys. A
// mapping target may be a single PDF field name or an array of names (e.g. a
// caption value repeated on every page). `false` is kept (it unchecks a box).
export function applyMapping(values, mapping) {
  const out = {}
  for (const [key, target] of Object.entries(mapping)) {
    const v = values[key]
    if (v === undefined || v === null || v === '') continue
    const names = Array.isArray(target) ? target : [target]
    for (const name of names) out[name] = v
  }
  return out
}

// Set values keyed by PDF field name onto the AcroForm. Returns a report so
// callers can see what matched, what was missing, and what was skipped.
// fontSizes: optional { pdfFieldName: size } to shrink a text field so its value
// doesn't collide with preprinted labels.
export function setFieldValues(form, pdfValues, fontSizes = {}) {
  const report = { set: [], missing: [], skipped: [] }
  for (const [name, raw] of Object.entries(pdfValues)) {
    let field
    try {
      field = form.getField(name)
    } catch {
      report.missing.push(name)
      continue
    }
    try {
      if (field instanceof PDFTextField) {
        field.setText(String(raw))
        if (fontSizes[name] != null) {
          try {
            field.setFontSize(fontSizes[name])
          } catch {
            /* keep default size if override fails */
          }
        }
      } else if (field instanceof PDFCheckBox) isTruthy(raw) ? field.check() : field.uncheck()
      else if (field instanceof PDFDropdown) field.select(String(raw))
      else if (field instanceof PDFOptionList) field.select(String(raw))
      else if (field instanceof PDFRadioGroup) field.select(String(raw))
      else {
        report.skipped.push(name)
        continue
      }
      report.set.push(name)
    } catch {
      report.skipped.push(name)
    }
  }
  return report
}

// Nudge widget rectangles (e.g. lower a field's top edge so its text doesn't
// overlap a preprinted label). adjust: { dx, dy, dw, dh } added to {x,y,w,h}.
export function adjustRects(form, rectAdjust = {}) {
  for (const [name, adj] of Object.entries(rectAdjust)) {
    let field
    try {
      field = form.getField(name)
    } catch {
      continue
    }
    for (const w of field.acroField.getWidgets()) {
      const r = w.getRectangle()
      w.setRectangle({
        x: r.x + (adj.dx || 0),
        y: r.y + (adj.dy || 0),
        width: r.width + (adj.dw || 0),
        height: r.height + (adj.dh || 0),
      })
    }
  }
}

// Diagonal translucent DRAFT watermark across every page.
// fontBytes (a Unicode TTF) is required for non-Latin text (e.g. Cyrillic);
// without it we fall back to Helvetica-Bold (Latin only).
export async function addDraftWatermark(pdfDoc, text, fontBytes) {
  let font
  if (fontBytes) {
    pdfDoc.registerFontkit(fontkit)
    font = await pdfDoc.embedFont(fontBytes)
  } else {
    font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  }

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize()
    const size = Math.max(14, Math.min(width, height) * 0.045)
    const textWidth = font.widthOfTextAtSize(text, size)
    // Anchor so the rotated line crosses the page centre.
    const angle = Math.PI / 4
    const x = width / 2 - (textWidth / 2) * Math.cos(angle)
    const y = height / 2 - (textWidth / 2) * Math.sin(angle)
    page.drawText(text, {
      x,
      y,
      size,
      font,
      color: rgb(0.78, 0.12, 0.12),
      opacity: 0.16,
      rotate: degrees(45),
    })
  }
}

// One-shot orchestration: load → map → fill → (watermark) → (flatten) → save.
// Returns { bytes, fields, report }.
export async function fillPdf({
  bytes,
  values = {},
  mapping = {},
  watermark = null, // { text, fontBytes }
  flatten = false,
  fontSizes = {}, // { pdfFieldName: size }
  rectAdjust = {}, // { pdfFieldName: { dx,dy,dw,dh } }
}) {
  const pdfDoc = await loadPdf(bytes)
  const fields = listFields(pdfDoc)
  const form = pdfDoc.getForm()

  // Adjust geometry before writing values so appearances use the new rects.
  adjustRects(form, rectAdjust)
  const pdfValues = applyMapping(values, mapping)
  const report = setFieldValues(form, pdfValues, fontSizes)

  if (watermark) {
    await addDraftWatermark(pdfDoc, watermark.text, watermark.fontBytes)
  }
  if (flatten) form.flatten()

  const out = await pdfDoc.save()
  return { bytes: out, fields, report }
}
