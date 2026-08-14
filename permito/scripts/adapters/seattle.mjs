// Permito adapter — Seattle, WA
// Source: Seattle Open Data (Socrata), Building Permits dataset 76t5-zqzr
// https://data.seattle.gov/resource/76t5-zqzr.json
//
// Field mapping (SDCI Building Permits):
//   permitnum             -> id
//   issueddate            -> issuedDate (floating timestamp, date part only)
//   permittypedesc        -> type (falls back to permittypemapped for rows
//                            like "Roof"/"Grading" that carry no desc)
//   permitclass           -> workClass ("Single Family/Duplex", "Commercial", ...)
//   description           -> description
//   originaladdress1      -> address (ALL-CAPS in source; title-cased)
//   originalzip           -> zip
//   estprojectcost        -> valuation (number, 0/absent -> null)
//   contractorcompanyname -> contractor
//   statuscurrent         -> status

const PORTAL = "https://data.seattle.gov";
const DATASET = "76t5-zqzr";
const RESOURCE_URL = `${PORTAL}/resource/${DATASET}.json`;

const DAYS_BACK = 90;
const PAGE_SIZE = 1000;
const MAX_RECORDS = 800; // schema target: 400–800 records per city

export const cityMeta = {
  city: "seattle",
  cityName: "Seattle",
  state: "WA",
  stateName: "Washington",
  source: {
    name: "Seattle Open Data — Building Permits (SDCI)",
    portal: PORTAL,
    dataset: DATASET,
    url: RESOURCE_URL,
  },
};

// Fixed Permito trade taxonomy: roofing, hvac, electrical, plumbing, solar,
// pool-spa, fence-deck, remodel, new-construction, demolition.
// This dataset only covers Building/Demolition/Roof/Grading permit types
// (Seattle keeps electrical & trade permits in separate datasets), so most
// trades are inferred from the free-text description.
const DESCRIPTION_TRADES = [
  [/\b(swimming pool|hot tub|spa\b|jacuzzi)/i, "pool-spa"],
  [/\bsolar|photovoltaic|\bpv system\b/i, "solar"],
  [/\bre-?roof|\broofing\b/i, "roofing"],
  [/\b(furnace|hvac|heat pump|air condition|rooftop unit|boiler|ductless|mechanical included)\b/i, "hvac"],
  [/\b(fence\b|deck\b|decks\b|railing)/i, "fence-deck"],
  [/\belectrical\b/i, "electrical"],
  [/\b(plumbing|water heater|sewer|side sewer)\b/i, "plumbing"],
];

function tradeFor(typeMapped, typeDesc, description) {
  const tm = (typeMapped || "").toLowerCase();
  const td = (typeDesc || "").toLowerCase();
  if (tm === "roof") return "roofing";
  if (tm === "demolition" || td === "demolition") return "demolition";
  const desc = description || "";
  for (const [re, slug] of DESCRIPTION_TRADES) {
    if (re.test(desc)) return slug;
  }
  if (td === "new") return "new-construction";
  if (td === "addition/alteration" || td === "tenant improvment" || td === "tenant improvement") {
    return "remodel";
  }
  return null;
}

// Words kept lowercase in title case (except at the start).
const TITLE_MINOR = new Set(["of", "and", "the", "at", "to"]);
// Tokens kept fully uppercase (directionals, common abbreviations).
const TITLE_UPPER = new Set([
  "N", "S", "E", "W", "NE", "NW", "SE", "SW",
  "US", "WA", "LLC", "II", "III", "IV",
]);

function clean(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") return null; // guard against {url:...} etc.
  const s = String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return s.length ? s : null;
}

function titleCaseWord(word, index) {
  const upper = word.toUpperCase();
  if (TITLE_UPPER.has(upper)) return upper;
  if (index > 0 && TITLE_MINOR.has(word.toLowerCase())) return word.toLowerCase();
  // Handle ordinals like 101ST, 45TH, 3RD, 2ND.
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

function normalize(record) {
  const id = clean(record.permitnum);
  if (id === null) return null;
  const issuedDate = parseIsoDate(record.issueddate);
  if (issuedDate === null) return null;

  const typeMapped = clean(record.permittypemapped);
  const typeDesc = clean(record.permittypedesc);
  const description = clean(record.description);

  return {
    id,
    issuedDate,
    type: typeDesc ?? typeMapped,
    workClass: clean(record.permitclass),
    trade: tradeFor(typeMapped, typeDesc, description),
    description,
    address: unshout(record.originaladdress1),
    zip: clean(record.originalzip),
    valuation: parseValuation(record.estprojectcost),
    contractor: clean(record.contractorcompanyname),
    status: clean(record.statuscurrent),
  };
}

async function fetchPage(sinceIso, offset) {
  const params = new URLSearchParams({
    $where: `issueddate >= '${sinceIso}'`,
    $order: "issueddate DESC, permitnum DESC",
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
