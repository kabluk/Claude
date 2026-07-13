# notify-milestone (Edge Function)

Daily case-timeline reminders for California dissolution milestones. Scheduling is
**Supabase pg_cron + this Edge Function** — never n8n (see `CLAUDE.md`).

## How it runs

1. `migrations/0001_case_milestones.sql` creates `public.case_milestones` and a
   `pg_cron` job (`notify-milestone-daily`, 15:00 UTC) that `net.http_post`s this
   function.
2. The function selects milestones that are **due**, **not yet reminded**, and
   **opted-in with consent**, renders a FACTUAL line (date + form names only),
   delivers it, and stamps `reminded_at` so each fires once.

## Secrets (deploy-gated)

Live delivery needs these in the Supabase project (Settings → Edge Functions).
Without them the function no-ops safely (returns `{ ok:false, reason:'not configured' }`).

| Secret | Used for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | read/update `case_milestones` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API delivery |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | WhatsApp delivery |

And two DB settings so pg_cron can reach the function (set once at deploy):

```sql
alter database postgres set app.settings.notify_url  = 'https://<ref>.functions.supabase.co/notify-milestone';
alter database postgres set app.settings.service_key = '<SUPABASE_SERVICE_ROLE_KEY>';
```

## Deploy

```bash
supabase db push                         # applies the migration + cron job
supabase functions deploy notify-milestone
supabase secrets set TELEGRAM_BOT_TOKEN=... TWILIO_ACCOUNT_SID=... ...
```

## Local proof without secrets

`npm run milestone-dryrun` renders the ru/es reminder lines the function would
send (templating proven end-to-end). Date arithmetic is unit-tested by
`npm run check-milestones`.

## Copy source of truth

The `MESSAGES` map in `index.ts` **mirrors** `t.milestones` in
`src/i18n/translations.js`. The app copy is authoritative and is what the UPL
lint (`npm run check-upl`) checks; keep the two in sync when editing.
