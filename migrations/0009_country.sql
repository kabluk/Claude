-- A4-SITE-COUNTRY: which country the scanned site belongs to, detected by
-- worker/lib/siteCountry.js::resolveCountry (user-override > schema-org JSON-LD
-- > ccTLD > unknown) — drives which currency the repair-cost estimate on the
-- report shows (was always €, confusing for non-EU sites, e.g. ladwp.com/US).
-- country_code: ISO-3166 alpha-2, one of taxonomies.json's 19 countries, or
-- NULL when undetected. country_source: 'user-override'|'schema-org'|'tld'|
-- 'unknown', or NULL for rows from before this migration. Both nullable and
-- written ONLY by completeScan (worker/lib/db.js) — running/error scans never
-- had a homepage fully crawled to detect from, same rubric as progress_json
-- being NULL for a finished scan (migrations/0007_scan_progress.sql).
ALTER TABLE scans ADD COLUMN country_code TEXT;
ALTER TABLE scans ADD COLUMN country_source TEXT;
