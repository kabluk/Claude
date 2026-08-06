-- Слой 2 (Lead Marketplace) — claim-поток. См. docs/project/INTERFACES.md §4.
-- Владелец агентства подтверждает профиль по email на домене agency.website —
-- verified=0 до перехода по verify-токену (A2-CLAIM-API), patch_json — правки,
-- которые он предложил (применяются ежедневным ребилдом как D1-оверлей поверх
-- agencies.json, статический сайт в рантайме D1 не читает).
-- status: pending | verified | applied | rejected
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  agency_slug TEXT NOT NULL,
  email TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  patch_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_claims_agency_slug ON claims (agency_slug);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims (created_at);
