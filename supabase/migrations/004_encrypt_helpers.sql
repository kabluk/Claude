-- ============================================================
-- 004_encrypt_helpers.sql
-- Ensure pgcrypto extension is available as an encryption fallback.
-- Primary A-Number encryption is handled in Edge Functions using
-- AES-256-GCM with the ENCRYPTION_KEY secret. pgcrypto is available
-- as a database-layer fallback only.
-- ============================================================

create extension if not exists pgcrypto;
