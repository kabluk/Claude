-- Слой 2 (Decision Engine) — таблица сканов. См. docs/project/INTERFACES.md §4.
-- status: running | done | error
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  pages_json TEXT,
  findings_json TEXT,
  score INTEGER,
  error TEXT,
  email TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans (created_at);
