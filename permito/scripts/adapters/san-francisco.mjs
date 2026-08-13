// Permito adapter — San Francisco, CA
// Source: DataSF (Socrata) "Building Permits" dataset p4e4-a5a7
// https://data.sfgov.org/resource/p4e4-a5a7.json
// Note: this dataset has no contractor/permittee name field -> contractor is always null.

const DATASET_ID = 'p4e4-a5a7';
const PORTAL = 'https://data.sfgov.org';
const RESOURCE_URL = `${PORTAL}/resource/${DATASET_ID}.json`;
const PAGE_SIZE = 1000;
const MAX_RECORDS = 1000;
const DAYS_BACK = 90;

export const cityMeta = {
  city: 'san-francisco',
  cityName: 'San Francisco',
  state: 'CA',
  stateName: 'California',
  source: {
    name: 'DataSF — Building Permits',
    portal: PORTAL,
    dataset: DATASET_ID,
    url: RESOURCE_URL,
  },
};

// --- helpers -----------------------------------------------------------

function cleanString(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/\s+/g, ' ').trim();
  return s.length ? s : null;
}

// Title-case a string only when the source shouts in ALL CAPS.
// Keeps ordinals like "33RD" -> "33rd" and handles "/"-joined tokens.
function titleCaseIfShouting(value) {
  const s = cleanString(value);
  if (s === null) return null;
  const letters = s.replace(/[^a-zA-Z]/g, '');
  if (!letters || letters !== letters.toUpperCase()) return s; // not shouting
  return s
    .toLowerCase()
    .replace(/[a-z]+/g, (word, offset, whole) => {
      const prev = whole.charAt(offset - 1);
      // token attached to a digit (e.g. "33rd") stays lowercase
      if (prev >= '0' && prev <= '9') return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
}

function toIsoDay(value) {
  const s = cleanString(value);
  if (s === null) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function parseValuation(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/[$,]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function buildAddress(row) {
  const parts = [
    cleanString(row.street_number),
    cleanString(row.street_number_suffix),
    titleCaseIfShouting(row.street_name),
    titleCaseIfShouting(row.street_suffix),
  ].filter(Boolean);
  const unit = cleanString(row.unit);
  if (unit) parts.push(`#${unit}`);
  if (!parts.length) return null;
  return parts.join(' ');
}

function normalizeRecord(row) {
  const id = cleanString(row.permit_number);
  const issuedDate = toIsoDay(row.issued_date);
  if (!id || !issuedDate) return null;
  return {
    id,
    issuedDate,
    type: cleanString(row.permit_type_definition),
    // The SF dataset has no separate work-class field; permit_type_definition
    // is the only categorical descriptor, so workClass stays null.
    workClass: null,
    description: cleanString(row.description),
    address: buildAddress(row),
    zip: cleanString(row.zipcode),
    valuation: parseValuation(
      row.revised_cost !== undefined && row.revised_cost !== null && row.revised_cost !== ''
        ? row.revised_cost
        : row.estimated_cost
    ),
    contractor: null, // not present in this dataset
    status: cleanString(row.status),
  };
}

async function fetchPage(whereClause, offset) {
  const params = new URLSearchParams({
    $where: whereClause,
    $order: 'issued_date DESC, permit_number ASC',
    $limit: String(PAGE_SIZE),
    $offset: String(offset),
  });
  const res = await fetch(`${RESOURCE_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Socrata request failed: HTTP ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('Unexpected Socrata response shape (expected array)');
  }
  return data;
}

// --- main --------------------------------------------------------------

export async function fetchCity() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - DAYS_BACK * 24 * 60 * 60 * 1000);
  const cutoffIso = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD
  // Floating timestamp comparison; also guard against future-dated rows.
  const nowIso = now.toISOString().slice(0, 19);
  const where = `issued_date >= '${cutoffIso}T00:00:00' AND issued_date <= '${nowIso}'`;

  const byId = new Map();
  let offset = 0;
  while (byId.size < MAX_RECORDS) {
    const rows = await fetchPage(where, offset);
    for (const row of rows) {
      const rec = normalizeRecord(row);
      if (!rec) continue;
      if (!byId.has(rec.id)) byId.set(rec.id, rec); // dedupe by permit id, keep first (newest)
      if (byId.size >= MAX_RECORDS) break;
    }
    if (rows.length < PAGE_SIZE) break; // last page
    offset += PAGE_SIZE;
  }

  const permits = [...byId.values()].sort((a, b) =>
    a.issuedDate < b.issuedDate ? 1 : a.issuedDate > b.issuedDate ? -1 : 0
  );

  return {
    ...cityMeta,
    fetchedAt: now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    permits,
  };
}
