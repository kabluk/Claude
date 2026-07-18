-- ============================================================
-- 001_initial_schema.sql
-- Initial schema for Detention Navigator
-- ============================================================

-- profiles
create table profiles (
  id uuid primary key references auth.users,
  full_name text,
  preferred_language text default 'ru',
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "users own profile" on profiles for all using (auth.uid() = id);

-- facilities
create table facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  mail_format_notes text,
  deposit_system text,
  deposit_url text,
  vav_available boolean default false,
  vav_notes text,
  updated_at timestamptz default now()
);
alter table facilities enable row level security;
create policy "facilities readable by all" on facilities for select using (true);

-- cases
create table cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  detainee_first_name text not null,
  detainee_last_name text not null,
  a_number_encrypted bytea,
  country_of_birth text,
  current_facility text,
  facility_id uuid references facilities(id),
  custody_status text default 'unknown',
  eoir_case_note text,
  entry_year int,
  created_at timestamptz default now()
);
alter table cases enable row level security;
create policy "users own cases" on cases for all using (auth.uid() = owner_id);

-- checklist_steps
create table checklist_steps (
  key text primary key,
  phase int not null,
  sort int not null
);
alter table checklist_steps enable row level security;
create policy "checklist steps readable by all" on checklist_steps for select using (true);

-- checklist_progress
create table checklist_progress (
  case_id uuid references cases(id) on delete cascade,
  step_key text references checklist_steps(key),
  status text default 'todo',
  completed_at timestamptz,
  primary key (case_id, step_key)
);
alter table checklist_progress enable row level security;
create policy "users own progress" on checklist_progress for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

-- evidence_documents
create table evidence_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade not null,
  year int not null,
  category text not null,
  storage_path text not null,
  original_filename text,
  note text,
  uploaded_at timestamptz default now()
);
alter table evidence_documents enable row level security;
create policy "users own evidence" on evidence_documents for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

-- monitor_targets
create table monitor_targets (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  source text not null,
  enabled boolean default true,
  last_checked_at timestamptz,
  last_result_hash text,
  last_result_snapshot jsonb
);
alter table monitor_targets enable row level security;
create policy "users own monitor targets" on monitor_targets for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

-- alerts
create table alerts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  type text not null,
  message_key text not null,
  payload jsonb,
  created_at timestamptz default now(),
  seen_at timestamptz
);
alter table alerts enable row level security;
create policy "users own alerts" on alerts for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

-- subscriptions
create table subscriptions (
  owner_id uuid primary key references profiles(id),
  stripe_customer_id text,
  plan text,
  status text,
  current_period_end timestamptz
);
alter table subscriptions enable row level security;
create policy "users own subscriptions" on subscriptions for all using (auth.uid() = owner_id);

-- content_versions
create table content_versions (
  id uuid primary key default gen_random_uuid(),
  content_key text not null,
  locale text not null,
  version int not null,
  published_at timestamptz default now()
);
alter table content_versions enable row level security;
create policy "content versions readable by all" on content_versions for select using (true);
