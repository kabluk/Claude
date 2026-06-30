// Form registry — add official forms ONE AT A TIME by registering a definition.
//
// A form definition:
//   {
//     id:      'FL-100',                       // unique id
//     title:   'Petition — Marriage',          // human label
//     url:     '/forms/fl100.pdf',             // path to the official fillable PDF
//     mapping: { petitioner_name: 'PetitionerName', ... }, // field_key → PDF field
//   }
//
// No concrete forms are registered yet — only the engine and the registry. To
// add one: drop the official PDF in public/forms/, inspect its field names with
// inspectFormFields(), then registerForm({ id, title, url, mapping }).

import { loadPdf, listFields, fillPdf } from './engine.js'

const REGISTRY = new Map()

export function registerForm(def) {
  if (!def || !def.id) throw new Error('Form definition requires an id')
  if (!def.url) throw new Error(`Form ${def.id} requires a url`)
  REGISTRY.set(def.id, { mapping: {}, ...def })
  return def.id
}

export function getForm(id) {
  return REGISTRY.get(id) || null
}

export function listForms() {
  return [...REGISTRY.values()].map(({ id, title }) => ({ id, title }))
}

async function fetchBytes(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load PDF: ${url} (${res.status})`)
  return new Uint8Array(await res.arrayBuffer())
}

// Inspect a registered form's embedded field names (helper when building a mapping).
export async function inspectFormFields(id) {
  const form = getForm(id)
  if (!form) throw new Error(`Unknown form: ${id}`)
  const pdfDoc = await loadPdf(await fetchBytes(form.url))
  return listFields(pdfDoc)
}

// Fill a registered form from the case profile. Pass watermark for previews.
// A form definition may carry `fontSizes` (per-field overrides); callers can
// also pass one to override.
export async function fillForm(
  id,
  profile,
  { watermark = null, flatten = false, fontSizes, rectAdjust } = {},
) {
  const form = getForm(id)
  if (!form) throw new Error(`Unknown form: ${id}`)
  const bytes = await fetchBytes(form.url)
  return fillPdf({
    bytes,
    values: profile,
    mapping: form.mapping,
    watermark,
    flatten,
    fontSizes: fontSizes || form.fontSizes || {},
    rectAdjust: rectAdjust || form.rectAdjust || {},
  })
}

// Load the bundled Unicode font used for the (Cyrillic-capable) watermark.
export async function loadWatermarkFont() {
  const res = await fetch('/fonts/DejaVuSans-Bold.ttf')
  if (!res.ok) throw new Error('Failed to load watermark font')
  return new Uint8Array(await res.arrayBuffer())
}

// Default preview watermark text.
export const DRAFT_WATERMARK = 'DRAFT — проверьте перед подачей'
