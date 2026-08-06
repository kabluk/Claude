-- Слой 2 (Lead Marketplace) — таблица RFQ-лидов. См. docs/project/INTERFACES.md §3-4.
-- Поля соответствуют черновику Lead/leads из INTERFACES.md, не придуманы заново.
-- status: sent | responded | booked | closed
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  scan_id TEXT,
  country TEXT NOT NULL,
  standard TEXT NOT NULL,
  service TEXT NOT NULL,
  budget TEXT NOT NULL,
  deadline TEXT,
  contact_json TEXT NOT NULL,
  matched_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_scan_id ON leads (scan_id);
