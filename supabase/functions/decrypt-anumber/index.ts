import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

/**
 * decrypt-anumber Edge Function
 * Accepts a base64-encoded AES-256-GCM encrypted A-Number and returns the plaintext.
 * Only callable by the authenticated user who owns the case (enforced by the caller
 * checking Supabase RLS before invoking this function).
 *
 * Request body: { "encrypted": "<base64 iv+ciphertext+tag>" }
 * Response:     { "a_number": "A123456789" }
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
    const { encrypted } = await req.json() as { encrypted: string }

    if (!encrypted || typeof encrypted !== 'string') {
      return new Response(
        JSON.stringify({ error: 'encrypted is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const encryptionKeyHex = Deno.env.get('ENCRYPTION_KEY')
    if (!encryptionKeyHex || encryptionKeyHex.length !== 64) {
      console.error('ENCRYPTION_KEY secret not configured or invalid length')
      return new Response(
        JSON.stringify({ error: 'Decryption configuration error' }),
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
      ['decrypt']
    )

    // Decode combined: iv (12 bytes) + ciphertext+tag
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    )

    const a_number = new TextDecoder().decode(plaintext)

    return new Response(
      JSON.stringify({ a_number }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('decrypt-anumber error:', err)
    return new Response(
      JSON.stringify({ error: 'Decryption failed' }),
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
