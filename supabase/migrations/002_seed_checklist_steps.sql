-- ============================================================
-- 002_seed_checklist_steps.sql
-- Seed the eight checklist steps for Phase 1-3
-- ============================================================

insert into checklist_steps (key, phase, sort) values
  ('locate',          1, 1),
  ('three_rules',     1, 2),
  ('money_calls',     1, 3),
  ('mail_format',     2, 4),
  ('attorney',        2, 5),
  ('evidence_kickoff',2, 6),
  ('support_letters', 3, 7),
  ('children_care',   3, 8);
