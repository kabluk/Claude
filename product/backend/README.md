# Backend & family sync — integration plan

The current MVP (`landing/app.html`) stores everything in `localStorage` on one
device. That is the right default for privacy and for a v1, but it means the
"one shared plan the whole family can see" promise is not yet real — each phone
is independent. This directory is the plan to make it real, plus a ready-to-run
Postgres schema (`schema.sql`).

**Status:** design + schema only. Nothing here is live. It needs a Supabase
project and a security review before it touches real families' data.

## Why Supabase

The product package already lists `@supabase/supabase-js`. Supabase gives us the
three things this needs with the least surface area: **phone OTP auth** (matches
the app's SMS sign-in), **Postgres + row-level security** (so a household only
sees its own rows), and **Realtime** (so a change on one phone appears on
another). No custom server to run.

## Data model

See `schema.sql`. Six tables: `households`, `members`, `cases`, `task_state`,
`doc_state`, `invites`. One case per household in the free tier. RLS is enforced
on every table via an `is_member(household_id)` check, so authorization is in the
database, not the client. Family members join with a short single-use `invite`
code redeemed through a `SECURITY DEFINER` function.

## How the app would use it

1. **Config, off by default.** Read `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`. If absent, the app stays exactly as it is today —
   fully local. Sync is strictly additive.
2. **Sign in** with phone OTP only when the user chooses to "let family join".
   Until then, no account, nothing leaves the device.
3. **Sync layer.** Replace the direct `localStorage` reads/writes with a thin
   store that (a) writes locally first (offline-first, unchanged UX), then
   (b) upserts to `cases` / `task_state` / `doc_state`. Conflict rule:
   last-write-wins by `updated_at` — adequate for checkboxes and a document
   grid; it is not a document-merge problem.
4. **Realtime.** Subscribe to the household's rows so a second family member sees
   task and document changes live — this is the actual "shared timeline" feature.

## Privacy — must change the copy when sync is on

Today the app says, truthfully, "saved only on this phone, no account." The
moment cloud sync is enabled that sentence is no longer true and **must** change
in all three languages. Specifics to decide before launch:

- **A-Number is sensitive.** Options: store it only on-device even when other
  fields sync, or client-side encrypt it with a household key so the server holds
  ciphertext. Do not log it anywhere.
- The footer promise ("encrypted, no ads, no data selling, delete everything
  anytime") becomes a real obligation: enable TLS + at-rest encryption, add a
  hard "delete household" path (cascades are already in the schema), and keep the
  no-analytics stance.
- The panic/preparedness data in the fuller product spec is more sensitive still
  and should be treated separately from this general sync.

## Steps to make it live (owner)

1. Create a Supabase project; enable Phone auth (an SMS provider is required).
2. Run `schema.sql` (`supabase db push` or the SQL editor).
3. Put `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in the app environment.
4. Build the sync store described above (est. a few hundred lines) behind the
   config flag; keep the local-only path as the default.
5. Security review of the RLS policies and the A-Number handling before any real
   data.
