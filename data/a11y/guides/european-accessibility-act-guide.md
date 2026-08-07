---
{
  "slug": "european-accessibility-act-guide",
  "locale": "en",
  "title": "European Accessibility Act: country-by-country guide for businesses",
  "description": "What the European Accessibility Act means for businesses now in force: scope, exemptions, EN 301 549, and how Germany, France and Ireland enforce it.",
  "standard": "eaa",
  "updated": "2026-08-07",
  "faq": [
    {
      "q": "Is the European Accessibility Act already in force?",
      "a": "Yes. Directive (EU) 2019/882 has applied since 28 June 2025, so covered products placed on the market and covered services provided to EU consumers must now meet its accessibility requirements. Transitional windows exist only for narrow cases such as pre-existing service contracts and self-service terminals already in use."
    },
    {
      "q": "Does the EAA apply to companies outside the EU?",
      "a": "Yes, if they sell covered products or provide covered services to consumers in the EU. A US or UK e-commerce site targeting EU customers falls within scope, regardless of where the company is established. Obligations attach to the activity in the EU market, not to the company's location."
    },
    {
      "q": "Are small businesses exempt from the EAA?",
      "a": "Only microenterprises providing services are exempt: fewer than 10 staff and annual turnover or balance sheet total not exceeding EUR 2 million. Microenterprises that manufacture, import or distribute products remain in scope, though they are spared some documentation duties. All larger SMEs must comply in full."
    },
    {
      "q": "How do I prove my website or app complies with the EAA?",
      "a": "There is no EU-wide certificate. The practical route is conformance with EN 301 549, the harmonised European standard for ICT accessibility, which creates a presumption of conformity with the legal requirements. Most organisations demonstrate this through an independent audit against EN 301 549 or WCAG plus an accessibility statement."
    }
  ],
  "cta": { "label": "Find an EAA compliance agency", "path": "/standards/eaa/" },
  "relatedAgencies": ["deque-systems", "abilitynet", "access42", "dias"]
}
---
The European Accessibility Act (EAA) is no longer a future deadline. [Directive (EU) 2019/882](https://eur-lex.europa.eu/eli/dir/2019/882/oj) has applied across the EU since **28 June 2025**, which means that as of 2026 market surveillance authorities in every Member State can inspect covered products and services, take complaints from consumers, and order non-compliant offerings to be fixed or withdrawn. If you sell to EU consumers — even from outside the EU — this guide explains what the law requires, who is exempt, how the transition windows work, and which national law implements the EAA in each major market.

## What the European Accessibility Act is

The EAA is an EU directive adopted on 17 April 2019. Unlike a regulation, a directive does not apply directly: each Member State had to transpose it into national law (the deadline was 28 June 2022), and it is those **national acts** — Germany's BFSG, Ireland's 2023 Regulations, Austria's BaFG and so on — that businesses are actually inspected and sanctioned under. The requirements themselves, however, are harmonised: the same functional accessibility requirements from [Annex I of the directive](https://eur-lex.europa.eu/eli/dir/2019/882/oj) apply in all 27 Member States, so one conformant product or service can circulate in the whole single market.

The EAA is a piece of internal-market law aimed at consumers. It complements, rather than replaces, the [Web Accessibility Directive (EU) 2016/2102](https://eur-lex.europa.eu/eli/dir/2016/2102/oj), which covers public-sector websites and apps. The EAA is the first EU-wide accessibility law that binds the **private sector**.

## Scope: which products and services are covered

The EAA covers a defined list, not the entire economy. Key categories (Article 2):

**Products** placed on the EU market from 28 June 2025:

- Consumer computer hardware and operating systems
- Self-service terminals: payment terminals, ATMs, ticketing machines, check-in machines, interactive information kiosks
- Consumer terminal equipment for telecoms and for audiovisual media (smartphones, TV equipment)
- E-readers

**Services** provided to consumers from 28 June 2025:

- **E-commerce** — the broadest category in practice: any website or app through which consumers can conclude a contract at a distance
- Consumer banking services (including websites, apps, contracts and information)
- Electronic communications services
- Services providing access to audiovisual media (streaming platforms and their apps/EPGs)
- Elements of air, bus, rail and waterborne passenger transport: websites, apps, e-ticketing, real-time travel information, interactive self-service terminals
- E-books and dedicated reading software

Emergency communications to the single European number 112 are also covered. National transpositions may go further — Member States were allowed to extend scope, for example to the built environment.

## Obligations: products vs services

The EAA borrows the EU's product-safety architecture, so obligations differ by role:

- **Manufacturers** of covered products must design to Annex I, run a conformity assessment, draw up an EU Declaration of Conformity, and affix **CE marking**. Importers and distributors must verify this has happened.
- **Service providers** must ensure the service itself conforms to Annex I, explain in their general terms and conditions how it does so, and keep that information available for as long as the service is offered. There is no CE marking for services — the accessibility information in the terms and public-facing documentation effectively plays that role.

Both routes allow a **"fundamental alteration" or "disproportionate burden"** defence (Article 14): an economic operator may skip a specific requirement only if meeting it would fundamentally alter the product/service or impose a disproportionate burden, must document that assessment against the criteria in Annex VI, and must inform the market surveillance authority. This is an exception to be argued case by case, not a blanket opt-out — and it must be re-assessed when the service changes or when authorities ask.

## The microenterprise exemption

- **Microenterprises providing services** — fewer than 10 persons and an annual turnover or annual balance sheet total not exceeding EUR 2 million — are **exempt** from the EAA's service requirements (Article 4(5)).
- **Microenterprises dealing with products** are *not* exempt, but are spared the duty to document their disproportionate-burden assessment; they must still provide the relevant facts to authorities on request.

Growing past either threshold ends the exemption, so scale-ups selling to EU consumers should plan for compliance before they cross it.

## Transition windows until 2030 (and beyond for terminals)

Article 32 of the directive contains transitional measures that are frequently misread, so it is worth being precise:

- **Pre-existing service contracts**: contracts concluded before 28 June 2025 may continue **unaltered until they expire, but no longer than 28 June 2030**.
- **Products used to provide services**: service providers may keep using products they were already lawfully using before 28 June 2025 **until 28 June 2030**, unless they replace them earlier.
- **Self-service terminals**: terminals lawfully in use before 28 June 2025 may keep operating **until the end of their economically useful life, but no longer than 20 years after entry into use**.

None of this delays the core obligation: services offered to consumers, and products newly placed on the market, have had to comply since 28 June 2025. A website launched or substantially reworked today cannot rely on any transition window. See the [official summary on EUR-Lex](https://eur-lex.europa.eu/EN/legal-content/summary/accessibility-of-products-and-services.html) and the [European Commission's EAA page](https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en).

## How to comply technically: EN 301 549

The EAA's Annex I requirements are functional ("perceivable, operable, understandable, robust"), not a test checklist. The bridge to something testable is the harmonised-standards mechanism: products and services that conform to harmonised standards cited in the Official Journal are **presumed to conform** with the corresponding legal requirements (Article 15).

For ICT, that standard is [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) — for web content it essentially incorporates WCAG at level AA. The published version is V3.2.1 (2021); a revised version 4 aligned with the EAA and WCAG 2.2 has been in final draft since late 2025, with publication and Official Journal citation expected in the course of 2026. In practice, auditing your digital channels against EN 301 549 / WCAG 2.1 AA today — and tracking WCAG 2.2 — is the defensible position. See our [EN 301 549 guide](/guides/en-301-549-explained/) for detail.

## National implementations: country-by-country

| Country | Implementing law | Notes |
|---|---|---|
| **Germany** | [Barrierefreiheitsstärkungsgesetz (BFSG)](https://www.gesetze-im-internet.de/bfsg/), 2021, plus the BFSGV regulation | Enforced nationwide by the [MLBF](https://mlbf-barrierefrei.de/); § 37 BFSG classifies violations as *Ordnungswidrigkeiten* (regulatory offences) — we don't quote a penalty figure here, see our [BFSG guide](/guides/bfsg-pflichten-guide/) for why |
| **France** | [Loi n° 2023-171 of 9 March 2023 (DDADUE)](https://www.legifrance.gouv.fr/dossierlegislatif/JORFDOLE000046590737/) with subsequent ordinance and decrees | Builds on the existing framework of Article 47 of the 2005 disability law and the RGAA testing methodology |
| **Ireland** | [S.I. No. 636/2023 — European Union (Accessibility Requirements of Products and Services) Regulations 2023](https://www.irishstatutebook.ie/eli/2023/si/636/made/en/print) | The [CCPC](https://www.ccpc.ie/business/enforcement/accessibility/european-accessibly-act-obligations-for-businesses/) is a lead enforcement body; breaches can be criminal offences — [full guide](/guides/eaa-ireland-guide/) |
| **Netherlands** | [Implementatiewet toegankelijkheidsvoorschriften producten en diensten](https://www.eerstekamer.nl/wetsvoorstel/36380_implementatiewet) (adopted 2024) | Implemented by amending existing laws, including the Warenwet, Telecommunicatiewet and the Civil Code |
| **Poland** | [Act of 26 April 2024 on ensuring accessibility requirements for certain products and services](https://www.funduszeunijne.gov.pl/strony/o-funduszach/fundusze-europejskie-bez-barier/dostepnosc/polski-akt-o-dostepnosci/czy-pad-dotyczy-twojej-firmy/) — the "Polski Akt o Dostępności" | Applies from 28 June 2025; coordinated by the Ministry of Funds and Regional Policy |
| **Spain** | [Ley 11/2023 of 8 May](https://www.boe.es/eli/es/l/2023/05/08/11) | Transposes the EAA together with several other EU directives |
| **Italy** | [Decreto Legislativo 27 May 2022, n. 82](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2022-05-27;82) | Extends the framework of the 2004 "Legge Stanca"; AgID plays a central role — [full guide](/guides/eaa-italy-guide/) |
| **Austria** | [Barrierefreiheitsgesetz (BaFG)](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20012316), BGBl. I Nr. 76/2023 | Applies from 28 June 2025; the Sozialministeriumservice handles complaints — [full guide](/guides/eaa-austria-guide/) (German) |
| **Belgium** | [Loi du 5 novembre 2023, n° 2023046827](https://www.ejustice.just.fgov.be/eli/loi/2023/11/05/2023046827/justel) | A partial transposition folded into the existing Code de droit économique — [full guide](/guides/eaa-belgium-guide/) |
| **Sweden** | [Lag (2023:254) om vissa produkters och tjänsters tillgänglighet](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-2023254-om-vissa-produkters-och-tjansters_sfs-2023-254/) | Distinct from Sweden's existing public-sector accessibility rules — [full guide](/guides/eaa-sweden-guide/) |
| **Denmark** | [Lov om tilgængelighedskrav for produkter og tjenester, LOV nr 801 af 07/06/2022](https://www.retsinformation.dk/eli/lta/2022/801) | Separate from Denmark's public-sector accessibility rules — [full guide](/guides/eaa-denmark-guide/) |
| **Finland** | [Laki 306/2019](https://www.finlex.fi/fi/laki/ajantasa/2019/20190306) extended by [asetus 179/2023](https://www.finlex.fi/fi/laki/alkup/2023/20230179) | The 2019 act alone covers only the public sector; the 2023 decree adds the private-sector EAA requirements — [full guide](/guides/eaa-finland-guide/) |
| **Norway** | [Forskrift 21.6.2013 nr. 732](https://lovdata.no/dokument/SF/forskrift/2013-06-21-732) | Not an EU member, not an EAA transposition — predates the directive; Norwegian businesses selling into the EU are bound by the EAA separately through that activity, not through this forskrift — [full guide](/guides/eaa-norway-guide/) |

**Enforcement and penalties vary by country.** Each Member State designated its own market surveillance authorities and set its own sanctions, ranging from administrative fines to, in some jurisdictions, criminal liability. The figures above are the ones we can verify against a source; check the national act and authority for your market rather than relying on generic "EAA fine" numbers circulating online.

## Practical compliance roadmap

1. **Determine scope.** Which of your products/services fall under the covered categories? Are you a service provider, manufacturer, importer or distributor for each? Do you qualify as a microenterprise?
2. **Audit against EN 301 549 / WCAG 2.1 AA.** Commission an independent audit of the in-scope digital channels — websites, apps, checkout flows, PDFs, kiosk software. See our [WCAG audit guide](/guides/wcag-audit-guide/) for what a credible audit looks like.
3. **Fix and prioritise.** Remediate blockers on the critical consumer journeys first (search, product pages, checkout, account, support).
4. **Produce the required documentation.** Accessibility information in your terms and conditions for services; technical documentation, EU Declaration of Conformity and CE marking for products; documented Article 14 assessments where you rely on an exception.
5. **Embed accessibility in your processes.** Design-system checks, developer training, release gates and periodic re-audits — the EAA is a continuous obligation, not a one-off certification.
6. **Watch the standard.** When EN 301 549 version 4 is cited in the Official Journal, align your audits and statements with it (it brings WCAG 2.2 into the presumption of conformity).

The businesses in the best position in 2026 are those treating the EAA like they treated GDPR: a permanent compliance function with clear ownership, documented decisions, and specialist partners for auditing and remediation.
