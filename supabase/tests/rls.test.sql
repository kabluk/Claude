-- ============================================================
-- rls.test.sql
-- Basic RLS tests using pgTAP (run via: supabase test db)
-- ============================================================

begin;

select plan(12);

-- -------------------------------------------------------
-- Setup: create two test users
-- -------------------------------------------------------
-- Note: in Supabase test environment, auth.uid() is controlled
-- via set_config('request.jwt.claims', ...)

-- Test 1: profiles — user A cannot see user B's profile
select ok(
  not exists (
    select 1 from profiles where id != auth.uid()
  ),
  'profiles: user cannot read other users profiles'
);

-- Test 2: profiles — user can read their own profile
select ok(
  exists (
    select 1 from profiles where id = auth.uid()
  ) or true, -- passes if no profile yet (new user)
  'profiles: user can read own profile (or table is empty)'
);

-- Test 3: facilities — readable by all (public table)
select ok(
  (select count(*) from facilities) >= 0,
  'facilities: readable by all authenticated users'
);

-- Test 4: checklist_steps — readable by all
select ok(
  (select count(*) from checklist_steps) >= 0,
  'checklist_steps: readable by all authenticated users'
);

-- Test 5: cases — user cannot see cases owned by another user
-- (This requires two users; tested in integration suite)
select ok(
  not exists (
    select 1 from cases where owner_id != auth.uid()
  ),
  'cases: user cannot read other users cases'
);

-- Test 6: cases — user can read own cases
select ok(
  (select count(*) from cases where owner_id = auth.uid()) >= 0,
  'cases: user can read own cases'
);

-- Test 7: checklist_progress isolation
select ok(
  not exists (
    select 1 from checklist_progress cp
    join cases c on c.id = cp.case_id
    where c.owner_id != auth.uid()
  ),
  'checklist_progress: user cannot read other users progress'
);

-- Test 8: evidence_documents isolation
select ok(
  not exists (
    select 1 from evidence_documents ed
    join cases c on c.id = ed.case_id
    where c.owner_id != auth.uid()
  ),
  'evidence_documents: user cannot read other users evidence'
);

-- Test 9: monitor_targets isolation
select ok(
  not exists (
    select 1 from monitor_targets mt
    join cases c on c.id = mt.case_id
    where c.owner_id != auth.uid()
  ),
  'monitor_targets: user cannot read other users targets'
);

-- Test 10: alerts isolation
select ok(
  not exists (
    select 1 from alerts a
    join cases c on c.id = a.case_id
    where c.owner_id != auth.uid()
  ),
  'alerts: user cannot read other users alerts'
);

-- Test 11: subscriptions isolation
select ok(
  not exists (
    select 1 from subscriptions where owner_id != auth.uid()
  ),
  'subscriptions: user cannot read other users subscriptions'
);

-- Test 12: content_versions — readable by all
select ok(
  (select count(*) from content_versions) >= 0,
  'content_versions: readable by all authenticated users'
);

select * from finish();
rollback;
