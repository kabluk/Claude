-- Addendum v3 Schema
-- Module A: Attorney Engagement Manager

create table attorneys (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade not null,
  full_name text, firm_name text, phone text, email text, office_address text,
  bar_state text, bar_number text, admission_year int, license_status text,
  discipline_checked boolean default false, discipline_notes text,
  aila_member boolean,
  status text default 'considering',
  created_at timestamptz default now()
);
alter table attorneys enable row level security;
create policy "users own attorneys" on attorneys for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

create table attorney_answers (
  id uuid primary key default gen_random_uuid(),
  attorney_id uuid references attorneys(id) on delete cascade,
  question_key text,
  answer_text text,
  answered_at timestamptz default now()
);
alter table attorney_answers enable row level security;
create policy "users own attorney answers" on attorney_answers for all
  using (exists (
    select 1 from attorneys a join cases c on c.id = a.case_id
    where a.id = attorney_id and c.owner_id = auth.uid()
  ));

create table fee_phases (
  id uuid primary key default gen_random_uuid(),
  attorney_id uuid references attorneys(id) on delete cascade,
  label text,
  amount_cents int,
  currency text default 'USD',
  hour_allocation numeric,
  includes_notes text,
  excludes_notes text,
  status text default 'quoted'
);
alter table fee_phases enable row level security;
create policy "users own fee phases" on fee_phases for all
  using (exists (
    select 1 from attorneys a join cases c on c.id = a.case_id
    where a.id = attorney_id and c.owner_id = auth.uid()
  ));

create table payments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  attorney_id uuid references attorneys(id),
  fee_phase_id uuid references fee_phases(id),
  amount_cents int,
  paid_at timestamptz,
  method text,
  memo text,
  receipt_path text,
  logged_by uuid references profiles(id)
);
alter table payments enable row level security;
create policy "users own payments" on payments for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

create table contact_log (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  attorney_id uuid references attorneys(id),
  channel text,
  occurred_at timestamptz,
  minutes numeric,
  summary text,
  counts_against_allocation boolean default true,
  logged_by uuid references profiles(id)
);
alter table contact_log enable row level security;
create policy "users own contact log" on contact_log for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

create table agreement_docs (
  id uuid primary key default gen_random_uuid(),
  attorney_id uuid references attorneys(id) on delete cascade,
  storage_path text,
  signed_at date,
  version_note text
);
alter table agreement_docs enable row level security;
create policy "users own agreement docs" on agreement_docs for all
  using (exists (
    select 1 from attorneys a join cases c on c.id = a.case_id
    where a.id = attorney_id and c.owner_id = auth.uid()
  ));

-- Module B: Children & Care Planning

create table care_plan (
  case_id uuid primary key references cases(id) on delete cascade,
  current_caregiver_name text,
  current_caregiver_phone text,
  relationship text,
  school_name text,
  school_phone text,
  emergency_contacts_updated_at date,
  notes text
);
alter table care_plan enable row level security;
create policy "users own care plan" on care_plan for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

create table care_backups (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  name text, phone text, relationship text, priority int
);
alter table care_backups enable row level security;
create policy "users own care backups" on care_backups for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

create table child_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  doc_type text,
  storage_path text,
  original_filename text,
  note text,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz default now()
);
alter table child_documents enable row level security;
create policy "users own child documents" on child_documents for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

-- Module C: Release Readiness

create table release_plan (
  case_id uuid primary key references cases(id) on delete cascade,
  intended_payer_name text,
  payer_docs_ready boolean default false,
  release_address text,
  lease_doc_path text,
  bond_amount_cents int,
  bond_status text default 'planned',
  bond_receipt_path text,
  notes text
);
alter table release_plan enable row level security;
create policy "users own release plan" on release_plan for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

create table support_letters (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  writer_name text,
  relationship text,
  status text default 'asked',
  language text,
  needs_translation boolean,
  storage_path text,
  updated_at timestamptz default now()
);
alter table support_letters enable row level security;
create policy "users own support letters" on support_letters for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

-- Module D: Case Timeline

create table timeline_entries (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  occurred_at timestamptz not null,
  category text,
  title text,
  notes text,
  attachment_path text,
  source text default 'manual',
  logged_by uuid references profiles(id)
);
alter table timeline_entries enable row level security;
create policy "users own timeline entries" on timeline_entries for all
  using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()));

-- Add client_is / payer_is to cases
alter table cases add column if not exists client_is text default 'detainee';
alter table cases add column if not exists payer_is text;

-- Monitoring hardening
alter table monitor_targets add column if not exists no_result_streak int default 0;
alter table monitor_targets add column if not exists no_result_debounce_threshold int default 3;
alter table monitor_targets add column if not exists last_no_result_at timestamptz;

-- Facilities: deposit_systems as array + per-system notes
alter table facilities add column if not exists deposit_systems jsonb default '[]';
