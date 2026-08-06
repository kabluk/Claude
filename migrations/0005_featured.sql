-- Слой 2 (Lead Marketplace) — платное featured-размещение. См. docs/project/
-- INTERFACES.md §4. agency_slug — PK: одно активное featured-размещение на
-- агентство одновременно (продление — UPDATE until, не новая строка).
-- until — ISO-дата окончания (тот же формат, что Agency.featured.until в
-- data/a11y/types.ts — оверлей, а не отдельное поле смысла). stripe_ref —
-- id платежа/подписки Stripe, для сверки и возвратов, не для чтения в рантайме.
CREATE TABLE IF NOT EXISTS featured (
  agency_slug TEXT PRIMARY KEY,
  until TEXT NOT NULL,
  stripe_ref TEXT
);

CREATE INDEX IF NOT EXISTS idx_featured_until ON featured (until);
