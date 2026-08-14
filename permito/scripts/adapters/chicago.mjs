// Permito adapter — Chicago, IL
// Source: Chicago Data Portal (Socrata), Building Permits dataset ydr8-5enu
// https://data.cityofchicago.org/resource/ydr8-5enu.json

const PORTAL = "https://data.cityofchicago.org";
const DATASET = "ydr8-5enu";
const RESOURCE_URL = `${PORTAL}/resource/${DATASET}.json`;

const DAYS_BACK = 90;
const PAGE_SIZE = 1000;
const MAX_RECORDS = 800; // schema target: 400–800 records per city

export const cityMeta = {
  city: "chicago",
  cityName: "Chicago",
  state: "IL",
  stateName: "Illinois",
  source: {
    name: "Chicago Data Portal — Building Permits",
    portal: PORTAL,
    dataset: DATASET,
    url: RESOURCE_URL,
  },
};

// Fixed Permito trade taxonomy: roofing, hvac, electrical, plumbing, solar,
// pool-spa, fence-deck, remodel, new-construction, demolition.
const WORK_TYPE_TRADES = {
  "electrical work": "electrical",
  "fire alarm system": "electrical",
  "low voltage electrical work": "electrical",
  "communication equipment": "electrical",
  "small-scale solar pv system": "solar",
  "solar pv system": "solar",
  reroofing: "roofing",
  "mechanical work": "hvac",
  "plumbing work": "plumbing",
  "storm water management plan": "plumbing",
  "fence or trash enclosure": "fence-deck",
  "porch,deck,balcony,or fire escape": "fence-deck",
  "nonstructural interior work": "remodel",
  "exterior windows/doors replacement": "remodel",
  "masonry work": "remodel",
  "detached frame garage": "new-construction",
};

const PERMIT_TYPE_TRADES = [
  ["wrecking", "demolition"],
  ["demolition", "demolition"],
  ["new construction", "new-construction"],
  ["renovation/alteration", "remodel"],
];

const DESCRIPTION_TRADES = [
  [/\b(swimming pool|hot tub|spa\b|jacuzzi)/i, "pool-spa"],
  [/\bsolar\b/i, "solar"],
  [/\b(furnace|hvac|air condition|rooftop unit|boiler)\b/i, "hvac"],
];

// Words kept lowercase in title case (except at the start).
const TITLE_MINOR = new Set(["of", "and", "the", "at", "to"]);
// Tokens kept fully uppercase.
const TITLE_UPPER = new Set([
  "N", "S", "E", "W", "NE", "NW", "SE", "SW",
  "US", "IL", "LLC", "II", "III", "IV",
]);

function clean(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return s.length ? s : null;
}

function titleCaseWord(word, index) {
  const upper = word.toUpperCase();
  if (TITLE_UPPER.has(upper) ) return upper;
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

function buildAddress(record) {
  const parts = [
    clean(record.street_number),
    clean(record.street_direction),
    unshout(record.street_name),
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

// Best-effort contractor business name from the numbered contact fields.
// Prefer GENERAL CONTRACTOR, then any *CONTRACTOR* role.
function findContractor(record) {
  let general = null;
  let anyContractor = null;
  for (let i = 1; i <= 15; i++) {
    const type = clean(record[`contact_${i}_type`]);
    const name = clean(record[`contact_${i}_name`]);
    if (!type || !name) continue;
    const t = type.toUpperCase();
    if (t.includes("GENERAL CONTRACTOR") && general === null) general = name;
    else if (t.includes("CONTRACTOR") && anyContractor === null) anyContractor = name;
  }
  return general ?? anyContractor;
}

// Human-readable permit class from permit_type, e.g.
// "PERMIT – EXPRESS PERMIT PROGRAM" -> "Express Permit Program".
function workClassFrom(permitType) {
  const s = clean(permitType);
  if (s === null) return null;
  const stripped = s.replace(/^PERMIT\s*[-–—]\s*/i, "");
  return unshout(stripped);
}

function tradeFor(workType, permitType, description) {
  const wt = (workType || "").toLowerCase().trim();
  if (wt && WORK_TYPE_TRADES[wt]) return WORK_TYPE_TRADES[wt];
  const pt = (permitType || "").toLowerCase();
  for (const [needle, slug] of PERMIT_TYPE_TRADES) {
    if (pt.includes(needle)) return slug;
  }
  const desc = description || "";
  for (const [re, slug] of DESCRIPTION_TRADES) {
    if (re.test(desc)) return slug;
  }
  return null;
}

function normalize(record) {
  const id = clean(record.permit_) ?? clean(record.id);
  if (id === null) return null;
  const issuedDate = parseIsoDate(record.issue_date);
  if (issuedDate === null) return null;

  const workType = clean(record.work_type);
  const permitType = clean(record.permit_type);
  const description = unshoutDescriptionSafe(record.work_description);

  return {
    id,
    issuedDate,
    type: workType ?? workClassFrom(permitType),
    workClass: workClassFrom(permitType),
    trade: tradeFor(workType, permitType, description),
    description,
    address: buildAddress(record),
    zip: null, // dataset has no site-address ZIP field (contact ZIPs are mailing addresses)
    valuation: parseValuation(record.reported_cost),
    contractor: findContractor(record),
    status: clean(record.permit_status),
  };
}

// Descriptions are ALL-CAPS in the source; keep them as-is (they are data,
// not addresses) but strip markup/whitespace.
function unshoutDescriptionSafe(raw) {
  return clean(raw);
}

async function fetchPage(sinceIso, offset) {
  const params = new URLSearchParams({
    $where: `issue_date >= '${sinceIso}'`,
    $order: "issue_date DESC, permit_ DESC",
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

  const byId = new Map();
  let offset = 0;
  while (byId.size < MAX_RECORDS) {
    const page = await fetchPage(sinceIso, offset);
    for (const record of page) {
      const permit = normalize(record);
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
