// Adapter: Austin, TX — Socrata dataset 3syk-w9eu (Issued Construction Permits)
// Normalizes to the contract in data/SCHEMA.md.

const DATASET_ID = '3syk-w9eu';
const PORTAL = 'https://data.austintexas.gov';
const RESOURCE_URL = `${PORTAL}/resource/${DATASET_ID}.json`;
const PAGE_SIZE = 1000;
const MAX_RECORDS = 800; // SCHEMA.md targets 400-800 records per city
const DAYS_BACK = 90;

export const cityMeta = {
  city: 'austin',
  cityName: 'Austin',
  state: 'TX',
  stateName: 'Texas',
  source: {
    name: 'City of Austin Open Data Portal — Issued Construction Permits',
    portal: PORTAL,
    dataset: DATASET_ID,
    url: RESOURCE_URL,
  },
};

// --- helpers -------------------------------------------------------------

function cleanString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length ? trimmed : null;
}

// Title-case a string only when the source shouts in ALL CAPS.
function titleCaseIfShouting(value) {
  const s = cleanString(value);
  if (!s) return null;
  const letters = s.replace(/[^A-Za-z]/g, '');
  if (!letters || letters !== letters.toUpperCase()) return s; // already mixed case
  return s
    .toLowerCase()
    .replace(/[a-z]+/g, (word, offset, whole) => {
      // Keep common directionals/highway markers upper-cased: "1200 N IH 35 SVRD"
      const upperKeep = new Set(['ih', 'sh', 'fm', 'rr', 'ne', 'nw', 'se', 'sw']);
      if (upperKeep.has(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
}

function parseValuation(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/[$,]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

// Best-effort valuation: prefer total_job_valuation, otherwise sum the
// per-trade valuation columns Austin sometimes fills in instead.
const COMPONENT_VALUATION_FIELDS = [
  'building_valuation', 'building_valuation_remodel',
  'electrical_valuation', 'electrical_valuation_remodel',
  'mechanical_valuation', 'mechanical_valuation_remodel',
  'plumbing_valuation', 'plumbing_valuation_remodel',
  'medgas_valuation', 'medgas_valuation_remodel',
];

function extractValuation(row) {
  const total = parseValuation(row.total_job_valuation);
  if (total !== null) return total;
  let sum = 0;
  for (const field of COMPONENT_VALUATION_FIELDS) {
    const v = parseValuation(row[field]);
    if (v !== null) sum += v;
  }
  return sum > 0 ? sum : null;
}

function parseDate(value) {
  const s = cleanString(value);
  if (!s) return null;
  const iso = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

// Classify into the fixed Permito trade taxonomy (or null when unclear):
// roofing, hvac, electrical, plumbing, solar, pool-spa, fence-deck,
// remodel, new-construction, demolition.
function classifyTrade(row) {
  const haystack = [row.description, row.permit_class, row.work_class]
    .map((v) => cleanString(v) || '')
    .join(' ')
    .toLowerCase();
  const type = (cleanString(row.permit_type_desc) || '').toLowerCase();
  const workClass = (cleanString(row.work_class) || '').toLowerCase();

  if (/\b(solar|photovoltaic|\bpv\b)/.test(haystack)) return 'solar';
  if (/\b(pool|spa|hot tub)\b/.test(haystack)) return 'pool-spa';
  if (/\b(fence|deck|pergola)\b/.test(haystack)) return 'fence-deck';
  if (/\b(demolition|demolish|\bdemo\b)\b/.test(haystack) || workClass === 'demolition') return 'demolition';
  if (/\b(re-?roof|roof(ing)? repair|roof replacement|shingle)\b/.test(haystack)) return 'roofing';
  if (type.includes('mechanical')) return 'hvac';
  if (type.includes('electrical')) return 'electrical';
  if (type.includes('plumbing')) return 'plumbing';
  if (workClass === 'new' || /\bnew construction\b/.test(haystack)) return 'new-construction';
  if (/\b(remodel|renovation|addition|repair)\b/.test(haystack) || ['remodel', 'repair', 'addition and remodel', 'addition'].includes(workClass)) return 'remodel';
  return null;
}

function normalizeRecord(row) {
  const id = cleanString(row.permit_number);
  if (!id) return null;
  const issuedDate = parseDate(row.issue_date);
  if (!issuedDate) return null;
  return {
    id,
    issuedDate,
    type: cleanString(row.permit_type_desc),
    workClass: cleanString(row.work_class),
    description: cleanString(row.description),
    address: titleCaseIfShouting(row.permit_location || row.original_address1),
    zip: cleanString(row.original_zip),
    valuation: extractValuation(row),
    contractor: cleanString(row.contractor_company_name),
    status: cleanString(row.status_current),
    trade: classifyTrade(row),
  };
}

// --- fetch ---------------------------------------------------------------

async function fetchPage(sinceDate, offset) {
  const params = new URLSearchParams({
    $where: `issue_date >= '${sinceDate}T00:00:00'`,
    $order: 'issue_date DESC, permit_number DESC',
    $limit: String(PAGE_SIZE),
    $offset: String(offset),
  });
  const res = await fetch(`${RESOURCE_URL}?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Socrata request failed: HTTP ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  if (!Array.isArray(body)) {
    throw new Error('Unexpected Socrata response shape (expected array)');
  }
  return body;
}

export async function fetchCity() {
  const sinceDate = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const byId = new Map();
  let offset = 0;
  while (byId.size < MAX_RECORDS) {
    const rows = await fetchPage(sinceDate, offset);
    for (const row of rows) {
      const permit = normalizeRecord(row);
      if (!permit) continue;
      if (permit.issuedDate < sinceDate) continue; // belt and braces on the 90-day window
      if (!byId.has(permit.id)) byId.set(permit.id, permit);
      if (byId.size >= MAX_RECORDS) break;
    }
    if (rows.length < PAGE_SIZE) break; // no more pages
    offset += PAGE_SIZE;
  }

  const permits = [...byId.values()].sort((a, b) =>
    a.issuedDate < b.issuedDate ? 1 : a.issuedDate > b.issuedDate ? -1 : a.id.localeCompare(b.id)
  );

  return {
    ...cityMeta,
    fetchedAt: new Date().toISOString(),
    permits,
  };
}
