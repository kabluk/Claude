// Menvio — Daily review reminder emails
// Deploy: supabase functions deploy send-review-emails
// Schedule: supabase functions schedule send-review-emails --cron "0 11 * * *"  (11am UTC daily)
//
// Required secrets (set with: supabase secrets set KEY=value):
//   RESEND_API_KEY      — from resend.com (free tier: 3000 emails/month)
//   SUPABASE_URL        — your project URL
//   SUPABASE_SERVICE_ROLE_KEY — from Supabase Settings → API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
const SB_URL = Deno.env.get('SUPABASE_URL')!
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async () => {
  const sb = createClient(SB_URL, SB_KEY)

  // Target: created yesterday (00:00–23:59 UTC), not yet sent
  const yesterday = new Date()
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const dayStart = new Date(yesterday); dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd   = new Date(yesterday); dayEnd.setUTCHours(23, 59, 59, 999)

  const { data: rows, error } = await sb
    .from('review_requests')
    .select('*')
    .eq('email_sent', false)
    .gte('created_at', dayStart.toISOString())
    .lte('created_at', dayEnd.toISOString())

  if (error) return new Response(error.message, { status: 500 })
  if (!rows?.length) return new Response('0 pending', { status: 200 })

  // Restaurant display names — extend as more restaurants are onboarded
  const NAMES: Record<string, string> = {
    'dragon-garden': 'Dragon Garden LA',
  }

  let sent = 0
  for (const row of rows) {
    const restaurantName = NAMES[row.restaurant_id] ?? row.restaurant_id
    const reviewUrl = row.review_url ?? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(restaurantName)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${restaurantName} <reviews@menvio.com>`,
        to: row.email,
        subject: `How was your dinner at ${restaurantName}? 🍜`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2efe9;font-family:sans-serif">
  <div style="max-width:480px;margin:32px auto;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:#0a0a0a;padding:36px 28px;text-align:center">
      <div style="color:#c9a84c;font-size:10px;letter-spacing:.25em;text-transform:uppercase;margin-bottom:10px">
        ${restaurantName}
      </div>
      <div style="color:#f0e6d0;font-size:22px;font-weight:300;line-height:1.3">
        We hope you enjoyed your visit 🙏
      </div>
    </div>
    <div style="background:#ffffff;padding:32px 28px">
      <p style="color:#3d3830;line-height:1.75;margin:0 0 14px">
        Thank you for dining with us! Your feedback means the world and helps other guests discover us.
      </p>
      <p style="color:#3d3830;line-height:1.75;margin:0 0 28px">
        It only takes 30 seconds — would you leave us a quick review?
      </p>
      <div style="text-align:center;margin-bottom:28px">
        <a href="${reviewUrl}"
           style="display:inline-block;background:#c0272d;color:#ffffff;
                  padding:15px 36px;border-radius:8px;text-decoration:none;
                  font-size:15px;font-weight:600;letter-spacing:.02em">
          Leave a Review →
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #f0ece6;margin:0 0 20px">
      <p style="font-size:11px;color:#aaa;text-align:center;margin:0;line-height:1.6">
        You opted in for this reminder when ordering at ${restaurantName}.<br>
        This is a one-time email — you won't hear from us again.
      </p>
    </div>
  </div>
</body>
</html>`,
      }),
    })

    if (res.ok) {
      await sb
        .from('review_requests')
        .update({ email_sent: true, sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    } else {
      console.error('Resend error', await res.text())
    }
  }

  return new Response(`Sent ${sent} / ${rows.length}`, { status: 200 })
})
