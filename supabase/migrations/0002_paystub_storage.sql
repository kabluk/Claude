-- Paystub photos — private storage bucket + RLS scoped by case_id.
--
-- Default posture is retention = NONE: the extract-paystub Edge Function
-- processes the image in memory and does not persist it (PAYSTUB_PERSIST unset).
-- This bucket + policies exist so persistence CAN be enabled later — but only
-- after the retention decision is VERIFIED in research.md (currently a blocker).
--
-- Objects are stored under `<case_id>/<uuid>.<ext>`. Access is keyed to the first
-- path segment (the case id), so a user can only reach their own case's files.

insert into storage.buckets (id, name, public)
values ('paystubs', 'paystubs', false)
on conflict (id) do nothing;

-- Read own case's paystubs (first path segment = case id the user owns).
create policy "paystubs: owner reads own case"
  on storage.objects for select
  using (
    bucket_id = 'paystubs'
    and (storage.foldername(name))[1] in (
      select c.id::text from public.cases c where c.user_id = auth.uid()
    )
  );

-- Insert into own case's folder only.
create policy "paystubs: owner writes own case"
  on storage.objects for insert
  with check (
    bucket_id = 'paystubs'
    and (storage.foldername(name))[1] in (
      select c.id::text from public.cases c where c.user_id = auth.uid()
    )
  );

-- Delete own case's paystubs (supports retention cleanup / user-initiated delete).
create policy "paystubs: owner deletes own case"
  on storage.objects for delete
  using (
    bucket_id = 'paystubs'
    and (storage.foldername(name))[1] in (
      select c.id::text from public.cases c where c.user_id = auth.uid()
    )
  );

-- RETENTION (blocking — see research.md): once persistence is enabled, schedule a
-- pg_cron sweep that deletes objects older than the agreed window, e.g.
--   select cron.schedule('paystub-retention-sweep','30 3 * * *', $$
--     ... delete from storage.objects where bucket_id='paystubs'
--         and created_at < now() - interval '30 days' $$);
-- Do NOT enable PAYSTUB_PERSIST in prod until the window is decided + recorded.
