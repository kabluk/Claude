import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

/**
 * encrypt-anumber Edge Function
 * Accepts a plaintext A-Number and returns AES-256-GCM encrypted bytes (base64).
 * The ENCRYPTION_KEY secret must be a 32-byte hex string (64 hex chars).
 *
 * Request body: { "a_number": "A123456789" }
 * Response:     { "encrypted": "<base64-encoded ciphertext+iv+tag>" }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { a_number } = await req.json() as { a_number: string }

    if (!a_number || typeof a_number !== 'string') {
      return new Response(
        JSON.stringify({ error: 'a_number is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate basic A-Number format (A + 8 or 9 digits)
    if (!/^A\d{8,9}$/i.test(a_number.trim())) {
      return new Response(
        JSON.stringify({ error: 'Invalid A-Number format. Expected A followed by 8 or 9 digits.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const encryptionKeyHex = Deno.env.get('ENCRYPTION_KEY')
    if (!encryptionKeyHex || encryptionKeyHex.length !== 64) {
      console.error('ENCRYPTION_KEY secret not configured or invalid length')
      return new Response(
        JSON.stringify({ error: 'Encryption configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Import key
    const keyBytes = hexToBytes(encryptionKeyHex)
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    )

    // Generate random 12-byte IV
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt
    const encoded = new TextEncoder().encode(a_number.trim().toUpperCase())
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encoded
    )

    // Combine: iv (12 bytes) + ciphertext+tag
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), iv.length)

    const encrypted = btoa(String.fromCharCode(...combined))

    return new Response(
      JSON.stringify({ encrypted }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('encrypt-anumber error:', err)
    return new Response(
      JSON.stringify({ error: 'Encryption failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}
