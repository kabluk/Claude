// extract-paystub — Supabase Edge Function (Deno).
//
// Reads a paystub photo with Claude vision and returns a STRICT JSON object. The
// result is only ever a DRAFT: the client confirms every value before it touches
// a form (see src/vision/paystub.js + PaystubImport.jsx). MECHANICAL, client-directed.
//
// Guarantees enforced here:
//   - temperature 0 (deterministic).
//   - A forced tool/JSON schema — the model must return exactly these fields.
//   - "If a value is not clearly visible, return null. NEVER guess." (system prompt)
//   - "If the image is not a legible paystub, set readable=false." → factual refusal.
// The app-side validator (validateExtraction) then strips anything malformed, so
// a hallucinated value cannot reach a form even if the model misbehaves.
//
// Privacy: by default the image is processed in memory and NOT persisted
// (retention = none). Persisting to the private `paystubs` bucket is behind
// PAYSTUB_PERSIST=true and gated by the retention decision in research.md.
//
// Secrets: ANTHROPIC_API_KEY (required — no key ⇒ safe no-op refusal),
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (only if PAYSTUB_PERSIST=true).

const MODEL = 'claude-opus-4-8'

const SYSTEM = [
  'You extract fields from a photo of a US pay stub for a court income form.',
  'Return ONLY the tool call with the schema fields. Rules:',
  '1. If a value is not clearly legible, return null. NEVER guess or infer.',
  '2. Amounts are numbers (no currency symbols/commas), gross/net per pay period.',
  '3. Dates are YYYY-MM-DD. pay_frequency ∈ {weekly,biweekly,semimonthly,monthly}.',
  '4. If the image is not a legible pay stub, set readable=false and all else null.',
].join('\n')

const TOOL = {
  name: 'paystub',
  description: 'Structured pay stub fields. Unreadable values MUST be null.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      readable: { type: 'boolean' },
      employer_name: { type: ['string', 'null'] },
      employer_address: { type: ['string', 'null'] },
      pay_period_start: { type: ['string', 'null'] },
      pay_period_end: { type: ['string', 'null'] },
      pay_frequency: { type: ['string', 'null'], enum: ['weekly', 'biweekly', 'semimonthly', 'monthly', null] },
      gross_pay: { type: ['number', 'null'] },
      net_pay: { type: ['number', 'null'] },
      ytd_gross: { type: ['number', 'null'] },
    },
    required: ['readable'],
  },
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ ok: false, reason: 'not configured' }) // deploy-gated no-op

  let payload: { image_base64?: string; media_type?: string; case_id?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ ok: false, error: 'invalid JSON body' }, 400)
  }
  const { image_base64, media_type } = payload
  if (!image_base64 || !media_type) return json({ ok: false, error: 'image_base64 and media_type required' }, 400)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'paystub' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type, data: image_base64 } },
            { type: 'text', text: 'Extract the pay stub fields. Unreadable → null.' },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    return json({ ok: false, error: 'vision request failed', detail: detail.slice(0, 300) }, 502)
  }
  const data = await res.json()
  const toolUse = (data.content || []).find((c: { type: string }) => c.type === 'tool_use')
  if (!toolUse) return json({ ok: true, extraction: { readable: false } })

  // Optional, retention-gated persistence to a private bucket (RLS by case_id).
  if (Deno.env.get('PAYSTUB_PERSIST') === 'true' && payload.case_id) {
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      const bytes = Uint8Array.from(atob(image_base64), (ch) => ch.charCodeAt(0))
      const ext = media_type.split('/')[1] || 'jpg'
      await supabase.storage.from('paystubs').upload(`${payload.case_id}/${crypto.randomUUID()}.${ext}`, bytes, {
        contentType: media_type,
        upsert: false,
      })
    } catch {
      /* persistence is best-effort; extraction still returns */
    }
  }

  return json({ ok: true, extraction: toolUse.input })
})
