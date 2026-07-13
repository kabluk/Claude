// notify-milestone — Supabase Edge Function (Deno).
//
// Invoked daily by pg_cron (see migrations/0001_case_milestones.sql). Selects the
// milestones due on/before today that are opted-in (consent=true) and not yet
// reminded, delivers a FACTUAL reminder via the chosen channel, and stamps
// reminded_at so each fires once.
//
// UPL-safe: the message states a date + form names only — never advice. The
// MESSAGES map below MIRRORS `t.milestones` in src/i18n/translations.js (kept in
// sync manually because Edge Functions can't import the app bundle). The app's
// copy is the source of truth and is what the UPL lint checks.
//
// Secrets (Supabase project → Settings → Edge Functions):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN,
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
// Live delivery is therefore deploy-gated — without these it no-ops safely.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Milestone = {
  id: string
  milestone_key: string
  due_date: string
  forms: string[]
  channel: string | null
  handle: string | null
  lang: string
}

// Mirror of t.milestones.items + reminder (en/es/ru). es mirrors en until the
// §6 translator pass, matching translations.js.
const MESSAGES: Record<string, { reminder: string; items: Record<string, { title: string; body: string }> }> = {
  en: {
    reminder: '{title} — {body}',
    items: {
      proof_of_service: { title: 'File proof of service', body: 'After serving your spouse, file the proof of service ({forms}).' },
      response_deadline: { title: 'Response deadline', body: 'The respondent has until {date} — 30 days after service — to file a response.' },
      disclosures_due: { title: 'Declarations of disclosure due', body: 'Preliminary declarations of disclosure ({forms}) are due by {date}, within 60 days of filing the petition.' },
      judgment_prep: { title: 'Prepare judgment forms', body: 'Around {date} the judgment forms ({forms}) can be prepared.' },
      waiting_period_end: { title: 'Six-month waiting period ends', body: 'The earliest the divorce can be final is {date} — 6 months and 1 day after service.' },
    },
  },
  ru: {
    reminder: '{title} — {body}',
    items: {
      proof_of_service: { title: 'Подать доказательство вручения', body: 'После вручения документов супругу подайте доказательство вручения ({forms}).' },
      response_deadline: { title: 'Срок ответа', body: 'У ответчика есть время до {date} — 30 дней после вручения — чтобы подать ответ.' },
      disclosures_due: { title: 'Срок деклараций о раскрытии', body: 'Предварительные декларации о раскрытии ({forms}) должны быть поданы до {date}, в течение 60 дней с подачи петиции.' },
      judgment_prep: { title: 'Подготовить формы решения', body: 'Около {date} можно подготовить формы решения ({forms}).' },
      waiting_period_end: { title: 'Окончание шестимесячного срока ожидания', body: 'Самое раннее, когда развод может стать окончательным, — {date}, через 6 месяцев и 1 день после вручения.' },
    },
  },
}
MESSAGES.es = MESSAGES.en

const fmt = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')

function renderLine(m: Milestone): string {
  const pack = MESSAGES[m.lang] ?? MESSAGES.en
  const item = pack.items[m.milestone_key]
  if (!item) return ''
  const body = fmt(item.body, { date: m.due_date, forms: (m.forms || []).join(', ') })
  return fmt(pack.reminder, { title: item.title, body })
}

async function sendTelegram(handle: string, text: string): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) return false
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: handle, text, disable_web_page_preview: true }),
  })
  return res.ok
}

async function sendWhatsApp(handle: string, text: string): Promise<boolean> {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const token = Deno.env.get('TWILIO_AUTH_TOKEN')
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM')
  if (!sid || !token || !from) return false
  const body = new URLSearchParams({
    From: `whatsapp:${from}`,
    To: `whatsapp:${handle}`,
    Body: text,
  })
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${sid}:${token}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  return res.ok
}

async function deliver(m: Milestone, text: string): Promise<boolean> {
  if (!m.handle) return false
  if (m.channel === 'telegram') return sendTelegram(m.handle, text)
  if (m.channel === 'whatsapp') return sendWhatsApp(m.handle, text)
  // email: wire a provider (e.g. Resend) here; no-op until configured.
  return false
}

Deno.serve(async () => {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    return new Response(JSON.stringify({ ok: false, reason: 'not configured' }), { status: 200 })
  }
  const supabase = createClient(url, key)
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('case_milestones')
    .select('id, milestone_key, due_date, forms, channel, handle, lang')
    .lte('due_date', today)
    .is('reminded_at', null)
    .eq('consent', true)
  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })

  let sent = 0
  for (const m of (data ?? []) as Milestone[]) {
    const text = renderLine(m)
    if (!text) continue
    if (await deliver(m, text)) {
      await supabase.from('case_milestones').update({ reminded_at: new Date().toISOString() }).eq('id', m.id)
      sent++
    }
  }
  return new Response(JSON.stringify({ ok: true, due: data?.length ?? 0, sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
