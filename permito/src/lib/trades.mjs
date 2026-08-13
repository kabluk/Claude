// Trade taxonomy + permit-to-trade classifier for Permito.
//
// Rules were designed against live samples from:
//   - Chicago building permits (data.cityofchicago.org / ydr8-5enu)
//     work_type vocabulary: "Electrical Work", "Reroofing", "Plumbing Work",
//     "Mechanical Work", "Small-Scale Solar PV System",
//     "Porch,Deck,Balcony,or Fire Escape", "Fence or Trash Enclosure",
//     "Nonstructural Interior Work", permit_type "PERMIT - NEW CONSTRUCTION",
//     "PERMIT - RENOVATION/ALTERATION".
//   - Austin issued construction permits (data.austintexas.gov / 3syk-w9eu)
//     permit_type_desc: "Plumbing Permit", "Electrical Permit",
//     "Mechanical Permit"; work_class: "Irrigation", "New", "Remodel",
//     "Addition", "Demolition", "Change Out".
//
// classifyPermit() is multi-label by design: "electrical service for pool"
// legitimately produces ["electrical", "pool-spa"].

export const TRADES = [
  { slug: "roofing", name: "Roofing", pluralLabel: "roofing permits", leadLabel: "roofing leads" },
  { slug: "hvac", name: "HVAC", pluralLabel: "HVAC permits", leadLabel: "HVAC leads" },
  { slug: "electrical", name: "Electrical", pluralLabel: "electrical permits", leadLabel: "electrical leads" },
  { slug: "plumbing", name: "Plumbing", pluralLabel: "plumbing permits", leadLabel: "plumbing leads" },
  { slug: "solar", name: "Solar", pluralLabel: "solar permits", leadLabel: "solar leads" },
  { slug: "pool-spa", name: "Pool & Spa", pluralLabel: "pool & spa permits", leadLabel: "pool & spa leads" },
  { slug: "fence-deck", name: "Fence & Deck", pluralLabel: "fence & deck permits", leadLabel: "fence & deck leads" },
  { slug: "remodel", name: "Remodeling", pluralLabel: "remodeling permits", leadLabel: "remodeling leads" },
  { slug: "new-construction", name: "New Construction", pluralLabel: "new construction permits", leadLabel: "new construction leads" },
  { slug: "demolition", name: "Demolition", pluralLabel: "demolition permits", leadLabel: "demolition leads" },
];

// One combined case-insensitive pattern per trade, applied over
// `type | workClass | description`.
const RULES = [
  {
    slug: "roofing",
    // "Reroofing" (Chicago work_type), "ROOF REPLACEMENT", "ROLL ROOFING",
    // shingle/tear-off jobs. Deliberately does NOT fire on the bare word
    // "roof" ("solar panels on roof", "roof deck", antennas "on the roof top")
    // — a roofing-specific verb/noun must be present.
    pattern:
      /\bre-?roof|\broofing\b|\broof\s+(?:replace\w*|repair\w*|recover\w*|tear[\s-]?off|covering)|\b(?:replace|repair|install\w*|new)\s+(?:the\s+)?(?:flat\s+|existing\s+)?roof\b|\bshingl|\btear[\s-]?off\b|\btpo\b|\bepdm\b|\bflashing\b/i,
  },
  {
    slug: "hvac",
    // "Mechanical Work"/"Mechanical Permit" is the HVAC bucket in both cities.
    pattern:
      /\bhvac\b|\bmechanical\b|\bfurnace|\bboiler|\bheat\s*pump|\bair\s+condition|\ba\/c\b|\bac\s+(?:unit|system|replace|install)|\bduct\s*work\b|\bductless\b|\bmini[\s-]?split|\bcondens(?:er|ing\s+unit)|\brtu\b|\brooftop\s+unit|\bventilation\b|\bexhaust\s+(?:fan|hood|system)|\brefrigerat|\bchiller|\bheating\s+(?:and|&)\s+cooling|\bcooling\s+system|\bthermostat/i,
  },
  {
    slug: "electrical",
    // "Electrical Work", "Electrical Permit", Austin's abbreviated "Elec Conn",
    // service/panel upgrades ("NEW 200 AMP SERVICE"), wiring, circuits.
    pattern:
      /\belec(?:tric(?:al)?)?\b|\bwiring\b|\bre-?wir(?:e|ing)|\bpanel\s+(?:upgrade|change|replace)|\b\d+\s*amp\b|\bcircuit|\breceptacle|\blow\s+voltage\b|\bline\s+voltage\b|\bservice\s+upgrade\b|\bgenerator\b|\bev\s+charg|\bcar\s+charg/i,
  },
  {
    slug: "plumbing",
    // "Plumbing Permit"/"Plumbing Work", Austin "Irrigation" work_class,
    // water heaters, sewer, gas lines. "sprinkler" counts only when it is not
    // a FIRE sprinkler (fire protection is a different trade).
    pattern:
      /\bplumb|\bwater\s+heater|\bhot\s+water\s+heater|\bsewer\b|\bgas\s+(?:line|pip\w*|meter|test)\b|\birrigation\b|(?<!fire[\s-])sprinkler|\bbackflow\b|\bwater\s+(?:line|service|main)\b|\bdrain(?:age)?\s+(?:line|pipe)|\bsump\s+pump|\brepip(?:e|ing)|\bwater\s+softener|\bgrease\s+trap/i,
  },
  {
    slug: "solar",
    // "Small-Scale Solar PV System", "SOLAR INSTALL", "INSTALL SOLAR PANELS".
    // Address strings are not part of the classified text, so street names
    // like "Solar Dr" cannot leak in.
    pattern: /\bsolar\b|\bphotovoltaic|\bpv\s+(?:system|panel|array|module)|\b(?:kw|kilowatt)\s+pv\b|\bpv\b/i,
  },
  {
    slug: "pool-spa",
    // \b keeps "whirlpool"/"carpool"/"spacious" from matching.
    pattern: /\bpools?\b|\bspas?\b|\bhot\s+tub|\bswimming\b|\bjacuzzi\b|\bplunge\s+pool/i,
  },
  {
    slug: "fence-deck",
    // Chicago "Porch,Deck,Balcony,or Fire Escape", "Fence or Trash Enclosure",
    // Austin "Cvd Deck". "deck" alone is intended — rooftop decks are deck work.
    pattern: /\bfence\b|\bfencing\b|\bdecks?\b|\bpergola|\bgazebo|\btrellis|\bprivacy\s+wall\b|\bretaining\s+wall\b|\brailing/i,
  },
  {
    slug: "remodel",
    // Chicago "PERMIT - RENOVATION/ALTERATION", "Nonstructural Interior Work",
    // "INTERIOR BUILDOUT"; Austin work_class "Remodel"/"Addition",
    // "Finish Out For Retail". Uses "alteration" (not bare "alter") so that
    // boilerplate like "REPAIR OR ALTER DEVICES ON EXISTING CIRCUITS" in
    // Chicago express electrical permits does not tag every one as a remodel.
    pattern:
      /\bremodel|\brenovat|\balteration|\badu\b|\baccessory\s+dwelling|\baddition\b|\binterior\b|\bbuild[\s-]?out\b|\bfinish[\s-]?out\b|\btenant\s+improvement|\bconvert(?:ing|sion)?\b.{0,40}\b(?:garage|basement|attic|bedroom|office)|\bkitchen\s+and\s+bath/i,
  },
  {
    slug: "new-construction",
    // Requires "new" + a building noun ("NEW CONSTRUCTION", "One Story
    // Residence", "new single family") so that "new irrigation system" or
    // "NEW 200 AMP SERVICE" never lands here. Austin's bare work_class "New"
    // is handled separately in WORKCLASS_MAP below.
    pattern:
      /\bnew\s+(?:single[\s-]?family|construction|building|residence|home|house|dwelling|duplex|townho\w*|garage|structure|sfr\b)|\bnew\s+\d+[\s-]?(?:story|stry|sty)\b|\b(?:one|two|three|1|2|3)[\s-]?(?:story|stry)\s+(?:residence|res\b|home|house|building)|\berect\s+(?:a\s+)?(?:new\s+)?\d*[\s-]?(?:story|stry)|\bground[\s-]?up\s+construction/i,
  },
  {
    slug: "demolition",
    // "demo" is common shorthand ("INTERIOR DEMO OF NON-LOAD BEARING WALLS").
    pattern: /\bdemolition\b|\bdemolish|\bdemo\b|\bwreck(?:ing)?\b|\braze\b|\btear[\s-]?down\b|\bdeconstruct/i,
  },
];

// Austin-style workClass values that are meaningful on their own but too
// generic to match as free text ("New" must not regex-match everywhere).
const WORKCLASS_MAP = {
  new: "new-construction",
  remodel: "remodel",
  addition: "remodel",
  demolition: "demolition",
  irrigation: "plumbing",
};

// Strip negated trade mentions so "NO ELECTRICAL WORK WITH THIS PERMIT" or
// "no plumbing work" cannot trigger a match on the negated trade.
const NEGATION_RE =
  /\b(?:no|without(?:\s+any)?|excludes?|excluding|not?\s+includ\w+)\s+(?:new\s+)?(?:electrical|electric|elec|plumbing|mechanical|hvac|roofing|structural)(?:\s+(?:work|permit|scope)s?)?\b/gi;

/**
 * Classify a normalized permit (see data/SCHEMA.md) into trade slugs.
 * @param {{type?: string, workClass?: string, description?: string}} permit
 * @returns {string[]} matching trade slugs in taxonomy order (possibly empty)
 */
export function classifyPermit(permit) {
  if (!permit || typeof permit !== "object") return [];

  const type = typeof permit.type === "string" ? permit.type : "";
  const workClass = typeof permit.workClass === "string" ? permit.workClass : "";
  const description = typeof permit.description === "string" ? permit.description : "";

  const text = `${type} | ${workClass} | ${description}`.replace(NEGATION_RE, " ");

  const matched = new Set();

  const wcSlug = WORKCLASS_MAP[workClass.trim().toLowerCase()];
  if (wcSlug) matched.add(wcSlug);

  for (const rule of RULES) {
    if (rule.pattern.test(text)) matched.add(rule.slug);
  }

  return TRADES.map((t) => t.slug).filter((slug) => matched.has(slug));
}

// ---------------------------------------------------------------------------
// Self-test: `node src/lib/trades.mjs`
// ---------------------------------------------------------------------------
import { fileURLToPath } from "node:url";

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cases = [
    // [label, permit, expected slugs (order-insensitive)]
    ["Chicago reroof", { type: "PERMIT – EXPRESS PERMIT PROGRAM", workClass: "Reroofing", description: "SCOPE: ROOF REPLACEMENT. AREA: 1037 SQ. FT. ROOF COVERING: MINERAL - SURFACED ROLL ROOFING." }, ["roofing"]],
    ["Shingle job", { type: "Building Permit", workClass: "Repair", description: "Tear-off and re-shingle existing residence" }, ["roofing"]],
    ["Chicago electrical service", { type: "Electrical Work", workClass: "Express Permit", description: "NEW 200 AMP SERVICE." }, ["electrical"]],
    ["Austin mechanical changeout", { type: "Mechanical Permit", workClass: "Change Out", description: "Replace furnace and AC condenser, ductwork as needed" }, ["hvac"]],
    ["Heat pump install", { type: "Building Permit", workClass: null, description: "Install ductless mini-split heat pump system" }, ["hvac"]],
    ["Austin irrigation", { type: "Plumbing Permit", workClass: "Irrigation", description: "Install Sprinkler System" }, ["plumbing"]],
    ["Water heater swap", { type: "Plumbing Permit", workClass: "Change Out", description: "Replace 50 gal water heater and gas line" }, ["plumbing"]],
    ["Fire sprinkler is not plumbing", { type: "Fire Protection", workClass: "Alteration", description: "Modify fire sprinkler heads on 3rd floor" }, ["remodel"]],
    ["Chicago solar PV", { type: "Small-Scale Solar PV System", workClass: null, description: "INSTALL SOLAR PANELS ON ROOF OF PRINCIPAL BUILDING. INVERTER OUTPUT: 10 KW." }, ["solar"]],
    ["Electrical service for pool (multi-label)", { type: "Electrical Permit", workClass: "New", description: "Electrical service for pool and hot tub equipment" }, ["electrical", "pool-spa", "new-construction"]],
    ["Fence and deck", { type: "Building Permit", workClass: null, description: "Construct new wood fence and rear deck with pergola" }, ["fence-deck"]],
    ["Chicago porch/deck work_type", { type: "PERMIT - RENOVATION/ALTERATION", workClass: "Porch,Deck,Balcony,or Fire Escape", description: "REPLACE REAR PORCH SYSTEM PER PLANS" }, ["fence-deck", "remodel"]],
    ["Interior remodel with plumbing+electrical", { type: "PERMIT - RENOVATION/ALTERATION", workClass: null, description: "REMODEL EXISTING BASEMENT: FRAMING, PLUMBING AND ELECTRICAL." }, ["remodel", "plumbing", "electrical"]],
    ["Austin new residence", { type: "Building Permit", workClass: "New", description: "One Story Residence W/Att Garage" }, ["new-construction"]],
    ["New construction phrase", { type: "PERMIT - NEW CONSTRUCTION", workClass: null, description: "ERECT 3-STORY SINGLE FAMILY RESIDENCE WITH ROOF DECK" }, ["new-construction", "fence-deck"]],
    ["Demolition", { type: "PERMIT - WRECKING/DEMOLITION", workClass: "Demolition", description: "Demolish existing detached garage" }, ["demolition"]],
    ["Interior demo tags both", { type: "PERMIT - RENOVATION/ALTERATION", workClass: null, description: "INTERIOR DEMO OF NON-LOAD BEARING WALLS, FIXTURES AND FINISHES AS PER PLANS" }, ["remodel", "demolition"]],
    ["Negated electrical does not match", { type: "PERMIT - EASY PERMIT PROCESS", workClass: null, description: "NEW DECK OVER EXISTING GARAGE AT SINGLE FAMILY HOME. NO ELECTRICAL WORK WITH THIS PERMIT" }, ["fence-deck"]],
    ["Sign permit matches nothing", { type: "PERMIT - SIGNS", workClass: null, description: "INSTALLATION OF A WALL SIGN ON THE FRONT ELEVATION" }, []],
    ["ADU", { type: "Building Permit", workClass: "Addition", description: "Convert garage to ADU with kitchen" }, ["remodel"]],
  ];

  let pass = 0;
  let fail = 0;
  for (const [label, permit, expected] of cases) {
    const got = classifyPermit(permit);
    const ok =
      got.length === expected.length &&
      [...expected].sort().every((s, i) => [...got].sort()[i] === s);
    if (ok) {
      pass += 1;
      console.log(`PASS  ${label}  -> [${got.join(", ")}]`);
    } else {
      fail += 1;
      console.log(`FAIL  ${label}  expected [${[...expected].sort().join(", ")}] got [${[...got].sort().join(", ")}]`);
    }
  }
  console.log(`\n${fail === 0 ? "PASS" : "FAIL"}: ${pass}/${cases.length} assertions passed`);
  process.exitCode = fail === 0 ? 0 : 1;
}
