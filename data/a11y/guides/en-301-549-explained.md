---
{
  "slug": "en-301-549-explained",
  "locale": "en",
  "title": "EN 301 549: the European accessibility standard explained",
  "description": "What EN 301 549 covers, how chapter 9 incorporates WCAG, where the standard is mandatory in the EU, and how an EN 301 549 audit differs from a pure WCAG audit.",
  "standard": "en-301-549",
  "updated": "2026-08-04",
  "faq": [
    {
      "q": "Is EN 301 549 the same as WCAG?",
      "a": "No. EN 301 549 incorporates WCAG level AA for web content in its chapter 9, but it is much broader: it also sets requirements for hardware, non-web software, documents, two-way communication, video capabilities and support services. A site can be WCAG-conformant and still fail EN 301 549 clauses outside chapter 9."
    },
    {
      "q": "What is the current version of EN 301 549?",
      "a": "The current published harmonised version is V3.2.1, from March 2021, which references WCAG 2.1. A revised version 4 is now a final draft (V4.1.0, June 2026) in ETSI's approval vote; it is designed to support the European Accessibility Act and to incorporate WCAG 2.2 AA, with publication and Official Journal citation expected during 2026."
    },
    {
      "q": "Who is legally required to follow EN 301 549?",
      "a": "EU public-sector bodies must meet it under the Web Accessibility Directive, where it is the cited harmonised standard. Private companies covered by the European Accessibility Act are not formally forced to use it, but conforming to a harmonised standard is the recognised way to gain a presumption of conformity with the law's requirements."
    },
    {
      "q": "Do US or UK companies ever need EN 301 549?",
      "a": "Yes, in two common cases: when they sell covered products or services to EU consumers under the European Accessibility Act, and when they bid for public-sector contracts in the EU, where procurement routinely references the standard. Many international vendors document EN 301 549 conformance in their accessibility conformance reports alongside WCAG and Section 508."
    }
  ],
  "cta": { "label": "Find an EN 301 549 audit provider", "path": "/standards/en-301-549/" },
  "relatedAgencies": ["axes4", "dias", "access42", "zoonou"]
}
---
EN 301 549 is the harmonised European standard that defines what "accessible" means for information and communication technology (ICT) in the EU. If a European law — the Web Accessibility Directive for the public sector, or the European Accessibility Act for the private sector — requires digital accessibility, EN 301 549 is the technical yardstick that turns the legal requirement into testable clauses. This guide explains what the standard actually contains, how it relates to WCAG, which version applies in 2026, and what an audit against it involves.

## What EN 301 549 is

EN 301 549, "Accessibility requirements for ICT products and services", is a European standard produced jointly by the three European standardisation organisations CEN, CENELEC and [ETSI](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf), originally on a mandate from the European Commission to create a common set of accessibility requirements for public ICT procurement. Unlike WCAG, which is a web-content guideline published by the W3C, EN 301 549 covers the full breadth of ICT: hardware, software, web, documents, telecoms and the support services around them.

Its special status comes from being a **harmonised standard**: when the European Commission cites a version in the Official Journal of the EU under a specific directive, conformance with that standard creates a legal **presumption of conformity** with the directive's requirements. That mechanism is why EN 301 549 appears in accessibility statements, tenders and conformance reports across Europe.

## Which version applies in 2026

- **Published and cited today: V3.2.1 (March 2021).** This is the version cited in the Official Journal for the [Web Accessibility Directive](https://eur-lex.europa.eu/eli/dir/2016/2102/oj) via [Commission Implementing Decision (EU) 2021/1339](https://eur-lex.europa.eu/eli/dec_impl/2021/1339/oj). It references WCAG 2.1.
- **In the pipeline: version 4.** The current [final draft, V4.1.0 (June 2026)](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/04.01.00_30/en_301549v040100va.pdf), is now in ETSI's formal Vote phase, revised specifically to support the [European Accessibility Act](https://eur-lex.europa.eu/eli/dir/2019/882/oj) and to incorporate **WCAG 2.2** level AA, along with updated requirements in areas such as real-time text. It also adds a new Annex ZB and clause A.2 — tables built specifically to evaluate EAA conformance, alongside the existing Web Accessibility Directive mapping in Annex ZA. It carries no legal weight until the European Commission cites it in the Official Journal, expected in the course of 2026.

Practical consequence: audit against V3.2.1 (WCAG 2.1 AA) today, but include WCAG 2.2's new success criteria in your backlog now — they become part of the presumption of conformity as soon as version 4 is cited.

## Structure: chapters 5–13

The heart of the standard is a set of requirement chapters. Each clause applies only "where ICT has" the relevant characteristic, so you first profile the product, then test the applicable chapters:

| Chapter | Covers | Typical examples |
|---|---|---|
| 5 | Generic requirements | Closed functionality (no assistive tech attachable), biometrics, activation of accessibility features |
| 6 | ICT with two-way voice communication | Audio quality, real-time text (RTT), video calling, alternatives to voice |
| 7 | ICT with video capabilities | Captions playback, audio description, user controls |
| 8 | Hardware | Physical controls, reach and force, stationary ICT dimensions, tactile discernibility |
| 9 | Web | WCAG level AA success criteria applied to web pages |
| 10 | Non-web documents | The same WCAG-derived criteria applied to PDFs, Office documents, e-books |
| 11 | Software | WCAG-derived criteria for native/desktop/mobile apps, plus interoperability with assistive technology and authoring tools |
| 12 | Documentation and support services | Accessible product documentation; support channels (help desks) able to communicate accessibly |
| 13 | ICT providing relay or emergency access | Relay services, access to emergency services |

Chapters 1–4 set scope, references, definitions and functional performance statements (chapter 4 describes user needs such as "usage without vision", useful for judging cases the testable clauses don't reach).

Annex A is what auditors use for legal mapping: it contains tables listing exactly which clauses are relevant to the Web Accessibility Directive — and, in the version 4 draft, to the European Accessibility Act.

## Relationship to WCAG

Chapter 9 does not rewrite web accessibility — it **incorporates [WCAG](https://www.w3.org/TR/WCAG21/) level A and AA success criteria by reference** (WCAG 2.1 in V3.2.1; WCAG 2.2 in the version 4 draft). If your website conforms to WCAG 2.1 AA, you satisfy chapter 9.

Two nuances matter:

- **Chapters 10 and 11 reuse WCAG beyond the web.** The same success criteria, lightly adapted, are applied to non-web documents (chapter 10) and software (chapter 11). This is how the EU makes WCAG's principles apply to a PDF invoice or a native mobile app.
- **The standard adds requirements WCAG never had.** WCAG says nothing about hardware buttons on a payment terminal, the accessibility of your support hotline, RTT in a calling app, or documentation formats. EN 301 549 does.

So "EN 301 549 conformant" is a strictly stronger claim than "WCAG AA conformant" for anything that is more than a website.

## Where EN 301 549 is mandatory

- **EU public sector.** The [Web Accessibility Directive (EU) 2016/2102](https://eur-lex.europa.eu/eli/dir/2016/2102/oj) requires public-sector websites and mobile apps to be accessible; EN 301 549 is the harmonised standard cited for it, and national monitoring bodies test against it. Public bodies must also publish accessibility statements.
- **EU private sector via the EAA.** The [European Accessibility Act](https://eur-lex.europa.eu/eli/dir/2019/882/oj), in application since 28 June 2025, sets functional requirements for e-commerce, banking, telecoms, transport ticketing, e-books, self-service terminals and more. Using the harmonised standard is the recognised route to a presumption of conformity — see our [EAA country guide](/guides/european-accessibility-act-guide/).
- **Public procurement.** The standard was born as a procurement tool, and EU tenders for ICT routinely require EN 301 549 conformance, which is why vendors document it in an Accessibility Conformance Report — the EU edition of the [VPAT template](/guides/vpat-acr-guide/) is built directly around EN 301 549's clauses, and [our mapping guide](/guides/vpat-en-301-549-mapping-guide/) shows exactly how each clause is answered.
- **Beyond the EU.** Several non-EU countries reference EN 301 549 in their own rules and procurement practice, making it the de facto international standard for non-US markets (the US uses Section 508, which is likewise WCAG-based).

## EN 301 549 audit vs a pure WCAG audit

A WCAG audit evaluates web content against the success criteria. An EN 301 549 audit starts earlier and ends later:

1. **ICT profiling.** The auditor determines which chapters apply: does the product have two-way voice? Video? Hardware? Closed functionality?
2. **Chapter 9/10/11 testing.** The WCAG-derived core — pages, documents and software screens tested with keyboard, screen readers and other assistive technology, as in a classic WCAG audit.
3. **Beyond-WCAG clauses.** Hardware interaction (reach, operable parts), RTT and caller functionality, accessibility documentation, and whether **support channels** (chapter 12) can serve customers with disabilities and provide information on the product's accessibility features.
4. **Legal mapping.** Findings are reported per clause, using Annex A tables, so the result can back an accessibility statement (Web Accessibility Directive) or the technical documentation and terms-and-conditions disclosures the EAA requires.

If your product is a plain website, the difference in test effort is modest — chapter 9 dominates and a good WCAG 2.1/2.2 AA audit covers most of it. If you ship apps, kiosks, banking terminals, documents at scale, or a support organisation, the delta is substantial and you should explicitly commission the EN 301 549 scope.

## Who needs it

- **Public-sector bodies in the EU** and their web/software suppliers — mandatory under national WAD transpositions.
- **Private businesses in EAA scope** — e-commerce, banking, telecom, transport, media streaming, e-book publishing, and manufacturers of terminals and consumer ICT hardware.
- **Vendors selling into either group** — agencies, SaaS providers and hardware makers asked for conformance evidence in procurement.
- **Organisations outside the EU with EU customers** — the EAA applies to services and products offered to EU consumers regardless of the provider's location.

When choosing an audit partner, ask specifically whether they test the non-web chapters (8, 10, 11, 12) and report per EN 301 549 clause with Annex A mapping — many "EN 301 549 audits" on the market are WCAG audits with a renamed cover page.
