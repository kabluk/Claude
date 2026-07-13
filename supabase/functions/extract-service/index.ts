// extract-service — Supabase Edge Function (Deno). §8.4 step 2.
//
// Reads a photo of the completed proof-of-service note / server's declaration
// with Claude vision and returns STRICT JSON. Same guarantees as extract-paystub:
// temperature 0, forced JSON schema, "unreadable → null, NEVER guess", "not a
// proof of service → readable=false". The result is a DRAFT — the client confirms
// every value before it fills FL-115 (see src/vision/service.js).
//
// Privacy: image is processed in memory and NOT persisted (retention: none) —
// persistence is gated the same way as paystubs (see research.md, BLOCKING).
//
// Secrets: ANTHROPIC_API_KEY (required — no key ⇒ safe no-op refusal).

const MODEL = 'claude-opus-4-8'

const SYSTEM = [
  'You extract fields from a photo of a California proof-of-service note for a',
  'divorce case (who served the papers, when, and how). Return ONLY the tool call.',
  '1. If a value is not clearly legible, return null. NEVER guess or infer.',
  '2. service_date is YYYY-MM-DD. service_method ∈ {personal, mail}.',
  '3. If the image is not a legible proof of service, set readable=false and all else null.',
].join('\n')

const TOOL = {
  name: 'service',
  description: 'Structured proof-of-service fields. Unreadable values MUST be null.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      readable: { type: 'boolean' },
      service_date: { type: ['string', 'null'] },
      service_method: { type: ['string', 'null'], enum: ['personal', 'mail', null] },
      service_time: { type: ['string', 'null'] },
      address_served: { type: ['string', 'null'] },
      server_name: { type: ['string', 'null'] },
      server_address: { type: ['string', 'null'] },
    },
    required: ['readable'],
  },
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ ok: false, reason: 'not configured' }) // deploy-gated no-op

  let payload: { image_base64?: string; media_type?: string }
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
      tool_choice: { type: 'tool', name: 'service' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type, data: image_base64 } },
            { type: 'text', text: 'Extract the proof-of-service fields. Unreadable → null.' },
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
  return json({ ok: true, extraction: toolUse.input })
})
