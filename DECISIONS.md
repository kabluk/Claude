# Architectural Decision Record — Detention Navigator

## Stack Choices

**Frontend: React 18 + Vite + TypeScript**
React 18 chosen for concurrent rendering support and the breadth of the ecosystem. Vite for fast local dev and optimized production builds. TypeScript in strict mode across the board — this application handles sensitive personal data and type safety reduces entire classes of bugs.

**Styling: Tailwind CSS + Inter font**
Utility-first CSS with Inter for readability across Cyrillic and Latin scripts. Mobile-first breakpoints — the primary users are on phones.

**Backend: Supabase**
Supabase provides Postgres (with Row Level Security), Auth, Storage, Realtime, and Edge Functions in one managed platform. This avoids premature backend complexity while retaining full SQL control. RLS enforces multi-tenant data isolation at the database layer, not just the application layer.

**Routing: react-router-dom v6**
Standard SPA routing. All protected routes use the ProtectedRoute wrapper; the three-rules page is public (intentional — it is free educational content).

**Forms: react-hook-form + zod**
react-hook-form for performance (uncontrolled inputs, minimal re-renders). Zod for schema validation shared between form validation and API boundary checking.

---

## UPL (Unauthorized Practice of Law) Compliance

Legal information tools must not cross into legal advice. The application enforces this via two mechanisms:

1. **Banned phrase lint script** (`scripts/lint-upl.ts`): Runs against all `src/i18n/**/*.json` files and exits with code 1 if any banned phrase pattern is found. This runs as a pre-build step and in CI. Banned phrases include directives like "you should file", "you qualify for", "we recommend you", etc.

2. **Persistent Disclaimer**: The `Disclaimer` component renders on every page. It cannot be dismissed. It reads: "Informational tool only. Not a law firm, not a substitute for an attorney."

**Content convention**: All guidance copy uses distancing language — "families in this situation commonly...", "attorneys typically evaluate...", "this checklist helps you organize...". No imperative directives to the user about what to do with their legal case.

---

## A-Number Encryption

The detainee A-Number (Alien Registration Number) is a sensitive identifier. Storage approach:

- **Application-layer encryption preferred**: The Supabase Edge Function `encrypt-anumber` accepts a plaintext A-Number and returns AES-256-GCM ciphertext. Only the encrypted `bytea` value is stored in `cases.a_number_encrypted`.
- **Key management**: The `ENCRYPTION_KEY` is a Supabase secret (set via `supabase secrets set`), never stored in the database or source code.
- **pgcrypto** is available as a fallback but application-layer encryption via the Edge Function is the primary path, keeping the key out of database-accessible memory.
- The A-Number is only decrypted transiently in the Edge Function when needed for display or external lookup; it is never stored decrypted.

---

## Row Level Security Strategy

Every table with user data has RLS enabled. The patterns used:

- **User-owned tables** (profiles, subscriptions): `using (auth.uid() = id)` or `using (auth.uid() = owner_id)`
- **Case-owned child tables** (cases, checklist_progress, evidence_documents, monitor_targets, alerts): `using (exists (select 1 from cases where cases.id = case_id and cases.owner_id = auth.uid()))`
- **Public reference tables** (facilities, checklist_steps, content_versions): `for select using (true)` — readable by all, writable only via migrations/admin.

This means even if the application layer has a bug, the database will not return another user's data.

---

## i18n Approach

- **react-i18next** with two languages: Russian (`ru`) and English (`en`).
- Russian is the default (`preferred_language` default in profiles table), reflecting the primary user population.
- Namespaces: `common`, `navigator`, `landing` — kept separate to allow lazy loading in Phase 2.
- Language preference is persisted in `profiles.preferred_language` so it follows the user across devices.
- The `LanguageToggle` component updates both the i18n instance and the database profile simultaneously.

---

## Monitoring Degradation Strategy (Phase 3)

Status monitor targets (locator.ice.gov, EOIR) are checked via Supabase Edge Functions on a schedule. Degradation approach:

- **Hash-based change detection**: `monitor_targets.last_result_hash` stores a hash of the last fetched result. Only if the hash changes is an alert created.
- **Snapshot storage**: `last_result_snapshot` (jsonb) stores the previous state for diff display.
- **Graceful failures**: If the external source is unreachable, the check is skipped and `last_checked_at` is not updated. No false alerts are generated for network failures.
- **User alerts**: Changes create rows in the `alerts` table with a `message_key` referencing i18n strings — no raw scraped data is shown to users without sanitization.

---

## Phase Roadmap

- **Phase 1** (this branch): Project structure, DB schema, i18n content skeleton, UI shell.
- **Phase 2**: Evidence Builder — document upload to Supabase Storage with category/year organization.
- **Phase 3**: Status Monitor — scheduled Edge Function polling of ICE locator and EOIR.
- **Phase 4**: Stripe subscription gating — free tier (Three Rules page + 1 case), paid tier (all phases).
