// Single source of county data — used BOTH by the PDF engine (court caption:
// courtName/street/mailing/cityZip/branch) and by the SEO county landing pages
// (filing fee, branches, local forms, particularities, FAQ, …).
//
// Bilingual fields use { en, es }. Proper nouns (court/branch names, addresses,
// form codes) stay as-is. Only Los Angeles is fully populated; the other four
// counties are stubs (stub: true) to be filled in later.

const STATEWIDE_FILING_FEE = 435 // CA first-appearance dissolution filing fee
const FEE_WAIVER_FORM = 'FW-001'

export const COUNTY_INFO = {
  'Los Angeles': {
    slug: 'los-angeles',
    name: 'Los Angeles',
    // --- used by the PDF caption (do not rename) ---
    courtName: 'Superior Court of California, County of Los Angeles',
    street: '111 N. Hill Street',
    mailing: '111 N. Hill Street',
    cityZip: 'Los Angeles, CA 90012',
    branch: 'Stanley Mosk Courthouse',
    // --- landing / SEO ---
    filing_fee: STATEWIDE_FILING_FEE,
    fee_waiver_form: FEE_WAIVER_FORM,
    efiling_required: false, // self-represented filers may file in person/by mail
    copies_needed: 2,
    court_branches: [
      { name: 'Stanley Mosk Courthouse (Central District)', address: '111 N. Hill Street, Los Angeles, CA 90012' },
      { name: 'Michael Antonovich Antelope Valley Courthouse', address: '42011 4th Street West, Lancaster, CA 93534' },
      { name: 'Chatsworth Courthouse', address: '9425 Penfield Ave, Chatsworth, CA 91311' },
      { name: 'Pomona Courthouse South', address: '400 Civic Center Plaza, Pomona, CA 91766' },
    ],
    local_forms: [
      { code: 'FW-001', name: 'Request to Waive Court Fees' },
      { code: 'FL-LASC', name: 'Los Angeles family-law cover/scheduling forms (verify current local set with the court)' },
    ],
    particularities: [
      {
        en: 'Los Angeles County runs California’s largest family court. Central-district dissolutions are filed at the Stanley Mosk Courthouse; other areas file at the regional courthouse assigned by ZIP code.',
        es: 'El condado de Los Ángeles tiene el tribunal de familia más grande de California. Las disoluciones del distrito central se presentan en el Stanley Mosk Courthouse; las demás zonas presentan en el tribunal regional según el código postal.',
      },
      {
        en: 'Electronic filing is available (and required for attorneys). Self-represented filers may file in person or by mail.',
        es: 'La presentación electrónica está disponible (y es obligatoria para los abogados). Quienes se representan a sí mismos pueden presentar en persona o por correo.',
      },
      {
        en: 'After filing, the Petition and Summons must be personally served on your spouse — you cannot serve the papers yourself.',
        es: 'Tras presentar, la Petición y la Citación deben entregarse personalmente a su cónyuge; usted no puede hacer la entrega.',
      },
    ],
    faq: [
      {
        q: { en: 'How long does a divorce take in Los Angeles County?', es: '¿Cuánto tarda un divorcio en el condado de Los Ángeles?' },
        a: {
          en: 'California requires a minimum of six months from the date the respondent is served before a divorce can be final — even when both spouses agree.',
          es: 'California exige un mínimo de seis meses desde que se notifica al demandado antes de que el divorcio sea definitivo, incluso cuando ambos cónyuges están de acuerdo.',
        },
      },
      {
        q: { en: 'How much does it cost to file for divorce in LA County?', es: '¿Cuánto cuesta presentar el divorcio en el condado de LA?' },
        a: {
          en: 'The first-appearance filing fee is $435. If you can’t afford it, request a fee waiver with form FW-001.',
          es: 'La tasa de presentación inicial es de $435. Si no puede pagarla, solicite una exención con el formulario FW-001.',
        },
      },
      {
        q: { en: 'Where do I file my divorce in Los Angeles County?', es: '¿Dónde presento mi divorcio en el condado de Los Ángeles?' },
        a: {
          en: 'Central-district cases are filed at the Stanley Mosk Courthouse (111 N. Hill St). Other areas file at the regional courthouse for their ZIP code.',
          es: 'Los casos del distrito central se presentan en el Stanley Mosk Courthouse (111 N. Hill St). Las demás zonas presentan en el tribunal regional de su código postal.',
        },
      },
      {
        q: { en: 'Do I need a lawyer to file in LA County?', es: '¿Necesito un abogado para presentar en el condado de LA?' },
        a: {
          en: 'No. You can represent yourself (in pro per). Califormis helps you prepare the required Judicial Council forms.',
          es: 'No. Puede representarse a sí mismo (in pro per). Califormis le ayuda a preparar los formularios obligatorios del Consejo Judicial.',
        },
      },
    ],
  },

  // ---- stubs (TODO: fill court_branches / local_forms / particularities / faq) ----
  'San Diego': {
    slug: 'san-diego',
    name: 'San Diego',
    courtName: 'Superior Court of California, County of San Diego',
    street: '1100 Union Street',
    mailing: '1100 Union Street',
    cityZip: 'San Diego, CA 92101',
    branch: 'Central Division — Family Law',
    filing_fee: STATEWIDE_FILING_FEE,
    fee_waiver_form: FEE_WAIVER_FORM,
    efiling_required: false,
    copies_needed: 2,
    court_branches: [], // TODO
    local_forms: [], // TODO
    particularities: [], // TODO
    faq: [], // TODO
    stub: true,
  },
  Orange: {
    slug: 'orange',
    name: 'Orange',
    courtName: 'Superior Court of California, County of Orange',
    street: '341 The City Drive South',
    mailing: 'P.O. Box 14171',
    cityZip: 'Orange, CA 92868',
    branch: 'Lamoreaux Justice Center',
    filing_fee: STATEWIDE_FILING_FEE,
    fee_waiver_form: FEE_WAIVER_FORM,
    efiling_required: false,
    copies_needed: 2,
    court_branches: [], // TODO
    local_forms: [], // TODO
    particularities: [], // TODO
    faq: [], // TODO
    stub: true,
  },
  Riverside: {
    slug: 'riverside',
    name: 'Riverside',
    courtName: 'Superior Court of California, County of Riverside',
    street: '4175 Main Street',
    mailing: '4175 Main Street',
    cityZip: 'Riverside, CA 92501',
    branch: 'Family Law Division',
    filing_fee: STATEWIDE_FILING_FEE,
    fee_waiver_form: FEE_WAIVER_FORM,
    efiling_required: false,
    copies_needed: 2,
    court_branches: [], // TODO
    local_forms: [], // TODO
    particularities: [], // TODO
    faq: [], // TODO
    stub: true,
  },
  'San Bernardino': {
    slug: 'san-bernardino',
    name: 'San Bernardino',
    courtName: 'Superior Court of California, County of San Bernardino',
    street: '351 N. Arrowhead Avenue',
    mailing: '351 N. Arrowhead Avenue',
    cityZip: 'San Bernardino, CA 92415',
    branch: 'Family Law Division',
    filing_fee: STATEWIDE_FILING_FEE,
    fee_waiver_form: FEE_WAIVER_FORM,
    efiling_required: false,
    copies_needed: 2,
    court_branches: [], // TODO
    local_forms: [], // TODO
    particularities: [], // TODO
    faq: [], // TODO
    stub: true,
  },
}

export const countyInfo = (county) => COUNTY_INFO[county] || null
export const countyBySlug = (slug) =>
  Object.values(COUNTY_INFO).find((c) => c.slug === slug) || null
export const ALL_COUNTIES = Object.values(COUNTY_INFO)
