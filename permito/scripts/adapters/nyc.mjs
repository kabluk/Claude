// Permito adapter — New York, NY
// Source: NYC Open Data (Socrata), DOB NOW Build — Approved Permits, dataset rbx6-tga4
// https://data.cityofnewyork.us/resource/rbx6-tga4.json
//
// Notes on the source:
// - Rows where `work_permit` is "Permit is not yet issued" are approved-but-not-issued
//   filings; they carry no `issued_date` and are excluded by the $where filter and a
//   normalize() guard.
// - The real permit number is `work_permit` (e.g. "M01248246-I1-EW-SP"); a
//   `job_filing_number` can spawn several permits across work types, so `work_permit`
//   is the dedupe key.
// - Electrical permits live in a separate DOB NOW Electrical dataset, so the
//   "electrical" trade only appears here via description matching (rarely).

const PORTAL = "https://data.cityofnewyork.us";
const DATASET = "rbx6-tga4";
const RESOURCE_URL = `${PORTAL}/resource/${DATASET}.json`;

const DAYS_BACK = 90;
const PAGE_SIZE = 1000;
const MAX_RECORDS = 800; // schema target: 400–800 records per city

export const cityMeta = {
  city: "nyc",
  cityName: "New York",
  state: "NY",
  stateName: "New York",
  source: {
    name: "NYC Open Data — DOB NOW: Build Approved Permits",
    portal: PORTAL,
    dataset: DATASET,
    url: RESOURCE_URL,
  },
};

// Fixed Permito trade taxonomy: roofing, hvac, electrical, plumbing, solar,
// pool-spa, fence-deck, remodel, new-construction, demolition.
// Keyed by lowercased DOB NOW `work_type`.
const WORK_TYPE_TRADES = {
  plumbing: "plumbing",
  sprinklers: "plumbing",
  standpipe: "plumbing",
  "mechanical systems": "hvac",
  "boiler equipment": "hvac",
  solar: "solar",
  "green roof": "roofing",
  "full demolition": "demolition",
  foundation: "new-construction",
};

// Fallback: match on the job description when the work type is generic
// (General Construction, Structural, Earth Work, ...). First match wins.
const DESCRIPTION_TRADES = [
  [/\b(swimming pool|hot tub|spa\b|jacuzzi)/i, "pool-spa"],
  [/\bsolar\b/i, "solar"],
  [/\bdemoli(sh|tion)\b/i, "demolition"],
  [/\bnew\s+(\d+[- ]stor(y|ies)\s+)?building\b/i, "new-construction"],
  [/\b(re-?roof|roof(ing)?\s+(replacement|repair|installation)|replace\s+roof)\b/i, "roofing"],
  [/\b(hvac|air condition|condenser|furnace|boiler|ductwork|rooftop unit)\b/i, "hvac"],
  [/\b(electrical|wiring|panel upgrade)\b/i, "electrical"],
  [/\b(fence|deck\b|railing)\b/i, "fence-deck"],
  [/\b(renovat|alteration|remodel|interior demolition|apartment combination|combine apartments)\b/i, "remodel"],
];

// "General Construction" is DOB's catch-all for alteration work; when the
// description gives no better signal, treat it as remodel.
const GENERIC_REMODEL_WORK_TYPES = new Set(["general construction"]);

// Words kept lowercase in title case (except at the start).
const TITLE_MINOR = new Set(["of", "and", "the", "at", "to"]);
// Tokens kept fully uppercase.
const TITLE_UPPER = new Set([
  "N", "S", "E", "W", "NE", "NW", "SE", "SW",
  "US", "NY", "NYC", "LLC", "LP", "II", "III", "IV",
  "FDR", "JFK", "LIC",
]);

function clean(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return s.length ? s : null;
}

function titleCaseWord(word, index) {
  const upper = word.toUpperCase();
  if (TITLE_UPPER.has(upper)) return upper;
  if (index > 0 && TITLE_MINOR.has(word.toLowerCase())) return word.toLowerCase();
  // Handle ordinals like 101ST, 55TH, 3RD, 2ND.
  const ordinal = /^(\d+)(ST|ND|RD|TH)$/i.exec(word);
  if (ordinal) return ordinal[1] + ordinal[2].toLowerCase();
  if (/^\d+$/.test(word)) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Title-case a string only when the source shouts in ALL CAPS.
function unshout(value) {
  const s = clean(value);
  if (s === null) return null;
  if (s !== s.toUpperCase() || !/[A-Z]/.test(s)) return s; // not all-caps
  return s
    .split(" ")
    .map((w) =>
      w
        .split("-")
        .map((part, i) => titleCaseWord(part, i))
        .join("-")
    )
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function parseValuation(raw) {
  const s = clean(raw);
  if (s === null) return null;
  const n = Number(s.replace(/[$,]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseIsoDate(raw) {
  const s = clean(raw);
  if (s === null) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1] : null;
}

// "43-30" + "PARSONS BOULEVARD" + "QUEENS" -> "43-30 Parsons Boulevard, Queens".
// Borough is included because NYC street names repeat across boroughs.
function buildAddress(record) {
  const houseNo = clean(record.house_no); // Queens hyphenated numbers stay as-is
  const street = unshout(record.street_name);
  const streetPart = [houseNo, street].filter(Boolean).join(" ");
  if (!streetPart) return null;
  const borough = unshout(record.borough);
  return borough ? `${streetPart}, ${borough}` : streetPart;
}

// Best-effort permittee business name; fall back to the permittee's person name.
function findContractor(record) {
  const business = unshout(record.applicant_business_name);
  if (business !== null) return business;
  const person = [
    unshout(record.applicant_first_name),
    unshout(record.applicant_last_name),
  ]
    .filter(Boolean)
    .join(" ");
  return person.length ? person : null;
}

function tradeFor(workType, description) {
  const wt = (workType || "").toLowerCase().trim();
  if (wt && WORK_TYPE_TRADES[wt]) return WORK_TYPE_TRADES[wt];
  const desc = description || "";
  for (const [re, slug] of DESCRIPTION_TRADES) {
    if (re.test(desc)) return slug;
  }
  if (GENERIC_REMODEL_WORK_TYPES.has(wt)) return "remodel";
  return null;
}

function normalize(record, todayIso) {
  const id = clean(record.work_permit);
  // Approved-but-unissued rows carry the literal "Permit is not yet issued".
  if (id === null || /not yet issued/i.test(id)) return null;
  const issuedDate = parseIsoDate(record.issued_date);
  if (issuedDate === null || issuedDate > todayIso) return null;

  const workType = clean(record.work_type);
  const description = clean(record.job_description); // mixed case in source; keep as-is

  return {
    id,
    issuedDate,
    type: workType,
    workClass: clean(record.filing_reason), // Initial Permit / Renewal / ...
    trade: tradeFor(workType, description),
    description,
    address: buildAddress(record),
    zip: clean(record.zip_code),
    valuation: parseValuation(record.estimated_job_costs),
    contractor: findContractor(record),
    status: clean(record.permit_status),
  };
}

async function fetchPage(sinceIso, offset) {
  const params = new URLSearchParams({
    $where: `issued_date >= '${sinceIso}'`,
    $order: "issued_date DESC, work_permit DESC",
    $limit: String(PAGE_SIZE),
    $offset: String(offset),
  });
  const url = `${RESOURCE_URL}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Socrata request failed: HTTP ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Unexpected Socrata response shape");
  return data;
}

export async function fetchCity() {
  const since = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString().slice(0, 10) + "T00:00:00";
  const sinceDate = sinceIso.slice(0, 10);
  const todayIso = new Date().toISOString().slice(0, 10);

  const byId = new Map();
  let offset = 0;
  while (byId.size < MAX_RECORDS) {
    const page = await fetchPage(sinceIso, offset);
    for (const record of page) {
      const permit = normalize(record, todayIso);
      if (permit === null) continue;
      if (permit.issuedDate < sinceDate) continue;
      if (!byId.has(permit.id)) byId.set(permit.id, permit);
      if (byId.size >= MAX_RECORDS) break;
    }
    if (page.length < PAGE_SIZE) break; // no more data
    offset += PAGE_SIZE;
  }

  const permits = [...byId.values()].sort((a, b) =>
    a.issuedDate < b.issuedDate ? 1 : a.issuedDate > b.issuedDate ? -1 : 0
  );

  return {
    ...cityMeta,
    fetchedAt: new Date().toISOString(),
    permits,
  };
}
