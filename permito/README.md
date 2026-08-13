# Permito — building permit lead catalog (MVP)

Static pSEO catalog of US building permits for contractor lead generation.
Astro 5, no backend; data comes from official city open-data portals (Socrata)
and is committed as snapshots so builds are reproducible offline.

## Commands

```bash
npm install
npm run fetch-data   # refresh data/cities/*.json from Socrata (last 90 days)
npm run build        # static build to dist/
npm run dev          # local dev server
```

## Structure

- `scripts/adapters/<city>.mjs` — one Socrata adapter per city, normalizes to `data/SCHEMA.md`
- `data/cities/<city>.json` — committed permit snapshots (90 days, newest first)
- `src/lib/trades.mjs` — trade taxonomy + keyword classifier (multi-label)
- `src/lib/data.mjs` — data loading, stats, template helpers
- `content/copy.json` — all marketing/SEO copy (single source of truth)
- Pages: `/` (landing + pricing fake door), `/permits/[city]/`, `/leads/[trade]/`,
  `/leads/[trade]/[city]/` (built only for pairs with ≥3 permits), `/sitemap.xml`

## MVP notes

- Waitlist forms are a fake door for the smoke test: submissions are stored in
  `localStorage` (`permito-waitlist`). Wire to Formspree/Tally/backend before launch.
- Set `SITE_URL` env var at build time for correct canonical/sitemap URLs.
