# CLAUDE.md — working rules for this repo (Califormis)

Guidance for Claude Code working in this repository. Read alongside `README.md`
(subsystems), `PLAN.md` (phased order of work), `docs/DECISIONS.md` (strategy
decisions), and `research.md` (verified facts + the sourcing rule).

## Hard rules

- **Never use n8n anywhere in this project.** Scheduling / automation =
  **Supabase pg_cron + Edge Functions** (e.g. CaseMilestone → daily pg_cron job
  → Edge Function → Telegram Bot API / Twilio WhatsApp) **or GitHub Actions**.
  No n8n in code, docs, infra, or diagrams.

- **PDF forms:** fill official fillable AcroForm PDFs by **field name only** —
  never draw text by coordinates. Every form has `src/pdf/flXXX.js`
  (profile-builder + MAPPING + `registerForm`) and a `scripts/demo-flXXX.mjs`
  fill + read-back (must be 0 missing). Revisions are SHA-tracked by
  `npm run check-forms`.

- **Single source of data:** one case profile feeds every form; never re-enter
  the same datum per form (e.g. §4055 calculator → FL-150/FL-342; assets →
  FL-142/FL-345; spousal type → FL-180/FL-343 via `src/pdf/spousal.js`).

- **UPL / copy neutrality:** UI copy stays neutral (facts + navigation, never
  advice — B&P §6400(g)). `npm run check-upl` (CI on every PR) blocks
  advice-giving phrases. Model is Reviewing Attorney, not LDA (see DECISIONS.md).

- **Reviewed tier:** two ALWAYS-separate transactions (our Stripe $99 + the
  attorney's own direct payment) — never merge sums (Rule 5.4). Gated by
  `REVIEWED_TIER_ENABLED`, off in prod until legal sign-off.

- **Facts before code:** code depending on an external fact isn't written until
  that fact is `VERIFIED` in `research.md`.

## Branch

Work on `claude/califormis-divorce-app-214jj2`.
