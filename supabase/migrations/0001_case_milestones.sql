-- Case timeline reminders — schema + daily scheduler.
--
-- Scheduling is Supabase pg_cron + an Edge Function (per the CLAUDE.md rule).
-- A daily pg_cron job pings the `notify-milestone` Edge Function, which selects
-- the milestones due today (opt-in + consent only) and delivers a FACTUAL
-- reminder via Telegram / Twilio / email, then stamps reminded_at.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.case_milestones (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null,
  milestone_key text not null,            -- proof_of_service | response_deadline | …
  due_date      date not null,
  forms         text[] not null default '{}',
  -- opt-in delivery (all three required before anything is sent)
  channel       text,                     -- telegram | whatsapp | email
  handle        text,                     -- destination (address/username/phone)
  consent       boolean not null default false,
  lang          text not null default 'en',
  reminded_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (case_id, milestone_key)
);

-- The notifier's hot query: due, not yet reminded, and opted-in with consent.
create index if not exists idx_case_milestones_due
  on public.case_milestones (due_date)
  where reminded_at is null and consent = true;

-- RLS on. The Edge Function connects with the service-role key (bypasses RLS);
-- if/when end-user auth lands, add an owner policy keyed to the case's user.
alter table public.case_milestones enable row level security;

-- Daily scheduler (15:00 UTC). The URL + service key come from DB settings, set
-- once at deploy time from Supabase secrets — no credentials live in this file.
--   alter database postgres set app.settings.notify_url  = 'https://<ref>.functions.supabase.co/notify-milestone';
--   alter database postgres set app.settings.service_key = '<SUPABASE_SERVICE_ROLE_KEY>';
select cron.schedule(
  'notify-milestone-daily',
  '0 15 * * *',
  $$
  select net.http_post(
    url     := current_setting('app.settings.notify_url', true),
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || current_setting('app.settings.service_key', true)
               ),
    body    := '{}'::jsonb
  );
  $$
);
