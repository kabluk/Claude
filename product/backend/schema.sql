-- Detention Navigator — backend schema (Supabase / Postgres)
-- Purpose: make the "one shared plan the whole family can see" real, replacing
-- the current on-device-only storage. Auth is Supabase phone OTP (matches the
-- app's SMS sign-in). Every table is protected by row-level security so a person
-- can only ever read or write rows for a household they belong to.
--
-- Apply with: supabase db push   (or paste into the SQL editor)
-- NOTE: this is a starting schema, not a substitute for a security review.

-- ------------------------------------------------------------------ households
create table if not exists households (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------ members
-- One row per person (auth user) in a household. First member is the owner.
create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  display_name  text,
  role          text not null default 'member' check (role in ('owner','member')),
  created_at    timestamptz not null default now(),
  unique (household_id, user_id)
);
create index if not exists members_user_idx on members(user_id);

-- Helper: is the current user a member of this household?
create or replace function is_member(h uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from members m where m.household_id = h and m.user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------------ cases
-- One detained person / case per household in the MVP (free tier = one case).
create table if not exists cases (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households(id) on delete cascade,
  a_number       text,          -- sensitive: 9 digits, no prefix. Consider client-side encryption.
  facility_name  text,
  facility_phone text,
  start_date     date,          -- day 1 of the crisis, for the Day-N counter
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists cases_household_idx on cases(household_id);

-- ------------------------------------------------------------------ task state
create table if not exists task_state (
  case_id     uuid not null references cases(id) on delete cascade,
  task_key    text not null,           -- e.g. 'loc','anum','phone',...
  done        boolean not null default false,
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now(),
  primary key (case_id, task_key)
);

-- ------------------------------------------------------------------ document state
create table if not exists doc_state (
  case_id     uuid not null references cases(id) on delete cascade,
  cat         text not null,           -- 'taxes','housing','school','finance','ids','medical'
  year        int  not null,
  status      smallint not null default 0 check (status between 0 and 2), -- 0 missing,1 partial,2 have
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now(),
  primary key (case_id, cat, year)
);

-- ------------------------------------------------------------------ invites
-- A short code a family member enters to join the household.
create table if not exists invites (
  code          text primary key,      -- short, single-use, e.g. 8 chars
  household_id  uuid not null references households(id) on delete cascade,
  created_by    uuid references auth.users(id),
  expires_at    timestamptz not null,
  used_at       timestamptz
);

-- ================================================================= RLS
alter table households  enable row level security;
alter table members     enable row level security;
alter table cases       enable row level security;
alter table task_state  enable row level security;
alter table doc_state   enable row level security;
alter table invites     enable row level security;

-- households: visible to members
create policy hh_select on households for select using (is_member(id));

-- members: you can see the members of your households; you can insert yourself
create policy mem_select on members for select using (is_member(household_id));
create policy mem_insert_self on members for insert with check (user_id = auth.uid());

-- cases: full access to members of the owning household
create policy case_all on cases for all using (is_member(household_id)) with check (is_member(household_id));

-- task_state / doc_state: access if you are a member of the case's household
create policy task_all on task_state for all
  using (exists (select 1 from cases c where c.id = case_id and is_member(c.household_id)))
  with check (exists (select 1 from cases c where c.id = case_id and is_member(c.household_id)));

create policy doc_all on doc_state for all
  using (exists (select 1 from cases c where c.id = case_id and is_member(c.household_id)))
  with check (exists (select 1 from cases c where c.id = case_id and is_member(c.household_id)));

-- invites: members of the household can create/read; joining is done via a
-- SECURITY DEFINER function (below) so a new user can redeem a code they hold.
create policy inv_select on invites for select using (is_member(household_id));
create policy inv_insert on invites for insert with check (is_member(household_id));

-- Redeem an invite: adds the current user to the household as a member.
create or replace function redeem_invite(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare h uuid;
begin
  select household_id into h from invites
    where code = p_code and used_at is null and expires_at > now();
  if h is null then raise exception 'invalid or expired code'; end if;
  insert into members (household_id, user_id, role) values (h, auth.uid(), 'member')
    on conflict (household_id, user_id) do nothing;
  update invites set used_at = now() where code = p_code;
  return h;
end;
$$;
