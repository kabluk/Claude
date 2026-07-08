-- Menvio: review_requests table
-- Run this in Supabase SQL Editor

create table if not exists review_requests (
  id            uuid         default gen_random_uuid() primary key,
  restaurant_id text         not null,
  email         text         not null,
  review_url    text,
  created_at    timestamptz  default now(),
  email_sent    boolean      default false,
  sent_at       timestamptz
);

create index if not exists idx_review_requests_pending
  on review_requests (restaurant_id, created_at, email_sent);

alter table review_requests enable row level security;

-- Guests can insert their own email from the menu (anon)
create policy "anon insert"
  on review_requests for insert to anon
  with check (true);

-- Edge Function uses service role key — full access
create policy "service role all"
  on review_requests for all to service_role
  using (true);
