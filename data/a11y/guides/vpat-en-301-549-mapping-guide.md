---
{
  "slug": "vpat-en-301-549-mapping-guide",
  "locale": "en",
  "title": "VPAT/ACR vs. EN 301 549 and WCAG: how the sections actually map",
  "description": "Which EN 301 549 clauses an ACR reports on its own and which it answers by cross-referencing WCAG, when a VPAT is actually expected in US and EU procurement, and how it differs from a Barrierefreiheitserklärung or RGAA déclaration.",
  "standard": "section-508",
  "updated": "2026-08-07",
  "faq": [
    {
      "q": "Does the European Accessibility Act require a VPAT?",
      "a": "No. Directive (EU) 2019/882 never mentions the VPAT — it is an ITI template, not an EU legal instrument. What EU procurement and enterprise buyers actually ask for is evidence of EN 301 549 conformance, and a VPAT-based ACR (EU or INT edition) happens to be the most widely recognised format for supplying it, so it functions as a de facto expectation without being a named requirement."
    },
    {
      "q": "Can I use my VPAT/ACR instead of a Barrierefreiheitserklärung or a déclaration d'accessibilité?",
      "a": "No — they are different instruments answering different legal questions. The ACR is a voluntary, product-and-version-specific report you hand to a buyer during procurement; the Barrierefreiheitserklärung (Germany, Anlage 3 BFSG) and the déclaration d'accessibilité (France, RGAA) are mandatory, service-level statements a covered organisation must publish for consumers, with content fixed by law. Having a strong ACR does not exempt you from publishing the statutory declaration where one applies, and vice versa."
    },
    {
      "q": "If I sell software to both US federal agencies and EU public buyers, which VPAT edition do I need?",
      "a": "The INT edition, which bundles the Revised Section 508 standards, EN 301 549 and the WCAG-only tables into one document, is the practical choice — see our VPAT and ACR guide for the full breakdown of all four editions. Filling the 508 edition alone leaves EU procurement teams asking for a separate EN 301 549 report."
    },
    {
      "q": "Why does an EN 301 549-based ACR keep saying \"see WCAG 2.x section\" instead of listing its own results?",
      "a": "Because ITI's own EU-edition template is built that way: clause 9 (Web) is answered entirely by cross-reference to the WCAG success-criteria tables, and most of clauses 10 (Non-web Documents) and 11 (Software) work the same way. The template's instructions say explicitly that this information does not need to be duplicated — so a well-formed ACR is not sloppy for doing this, it is following the format."
    }
  ],
  "cta": { "label": "Find a VPAT / EN 301 549 conformance report provider", "path": "/services/vpat/" },
  "relatedAgencies": ["tpgi", "level-access", "qualitylogic", "usablenet"]
}
---
If your product is sold into both U.S. federal accounts and the EU market, two acronyms end up on the same procurement checklist: VPAT/ACR and EN 301 549. They are closely related — the EU edition of the VPAT is quite literally a EN 301 549 reporting template — but treating them as interchangeable, or assuming either one satisfies Europe's separate legal requirement to publish an accessibility statement, causes real gaps. This guide is the connective piece: it does not re-explain what a VPAT or ACR is (see our [VPAT and ACR guide](/guides/vpat-acr-guide/)) or what EN 301 549 covers (see our [EN 301 549 guide](/guides/en-301-549-explained/)) — it shows exactly how an EN 301 549-based ACR's sections correspond to EN 301 549 clauses and WCAG criteria, when a VPAT is actually expected on each side of the Atlantic, and how it differs from the statutory declarations Germany and France require.

## Inside an EU-edition ACR: how each clause is actually answered

The [ITI VPAT 2.5Rev EU edition template](https://www.itic.org/policy/accessibility/vpat) (April 2025) is not a generic accessibility questionnaire — it is structured directly around [EN 301 549](/guides/en-301-549-explained/)'s clauses 4 through 13, plus separate WCAG success-criteria tables (Level A, AA and AAA). Reading the template itself shows that these two parts are not independent: for the web-related clauses, the EN 301 549 section explicitly defers to the WCAG tables rather than repeating the answers.

| EN 301 549 clause (ACR section) | What it covers | How the EU-edition ACR answers it |
| --- | --- | --- |
| 4 — Functional Performance Statements | User-need statements (e.g. usage without vision, without hearing) | Answered with its own criteria — no WCAG equivalent |
| 5 — Generic Requirements | Closed functionality, biometrics, activation of accessibility features | Own criteria |
| 6 — ICT with Two-Way Voice Communication | Audio quality, real-time text, video calling | Own criteria |
| 7 — ICT with Video Capabilities | Caption playback, audio description controls | Own criteria |
| 8 — Hardware | Physical controls, reach, force, tactile discernibility | Own criteria |
| 9 — Web | Web content | Answered entirely by cross-reference — the template literally reads "Clause 9: Web (see WCAG 2.x section)," with no separate criteria rows |
| 10 — Non-web Documents | PDFs, Office documents, e-books | Criteria 10.1.1.1 through 10.4.1.3 read "See WCAG 2.x section"; only a handful of document-specific items (caption positioning, audio description timing) are answered on their own |
| 11 — Software | Native, desktop and mobile applications | Criteria 11.1.1.1 through 11.4.1.3 read "See WCAG 2.x section"; interoperability with assistive technology and authoring-tool requirements are answered on their own |
| 12 — Documentation and Support Services | Product documentation, help-desk channels | The two "accessible documentation" rows (12.1.2, 12.2.4) cross-reference WCAG; the rest — features information, effective communication with support staff — is answered on its own |
| 13 — ICT Providing Relay or Emergency Service Access | Relay services, emergency access | Own criteria — no WCAG relevance at all |

Two things follow directly from this structure:

- **A WCAG 2.1 AA audit does most of the work for clause 9, and a large share of clauses 10 and 11** — because the ACR is instructed to reuse those exact results rather than re-test the same success criteria under a different name.
- **Clauses 4–8, 12 and 13 need testing that a WCAG audit alone never produces.** Hardware reach and force, real-time text, closed-functionality behaviour, and whether your support desk can actually serve a caller who cannot see a screen — none of that is a WCAG success criterion, so a vendor who only commissions "a WCAG audit" and pastes the results into an EN 301 549-shaped ACR will have blank or unsupported rows across roughly half the template.

The U.S. **508 edition** works the same way, just against different section numbers: its own template answers §501.1 ("Scope – Incorporation of WCAG 2.0 AA") and equivalent software/document/support-documentation rows with "See WCAG 2.x section," referencing WCAG 2.0 instead of 2.1. The mechanism is identical across editions — only the incorporated WCAG version and the section numbering change. The **INT edition** simply runs both numbering systems (plus the WCAG-only tables) against the same underlying WCAG results, which is why it is the practical choice for a vendor answering both U.S. and EU buyers with one document (see the four-edition breakdown in our main [VPAT and ACR guide](/guides/vpat-acr-guide/)).

One EU-side development worth tracking: the final draft of EN 301 549 V4.1.0 (June 2026), now in ETSI's approval vote, adds a new Annex ZB and clause A.2 — five tables built specifically to evaluate a product's or service's conformance with the European Accessibility Act's own essential requirements, alongside the existing Web Accessibility Directive mapping in Annex ZA. It is not yet cited in the Official Journal, so it carries no legal weight today, but once it is, ACR authors will have an EAA-specific table to map against rather than reusing the Web Accessibility Directive's Annex A as a proxy.

## When a VPAT/ACR is actually expected

**United States.** Section 508 does not force any single company to produce a VPAT — but [Section508.gov recommends](https://www.section508.gov/sell/acr/) an ACR for any ICT marketed to the federal government, and contracting officers use it during market research and proposal evaluation. In practice, no ACR often means no shortlist. See our [Section 508 compliance guide](/guides/section-508-compliance-guide/) for who else this reaches (contractors, subcontractors, commercial SaaS vendors) and how the underlying testing works.

**European Union.** The EAA itself never names the VPAT — it requires products and services to meet Annex I's functional accessibility requirements and, for services, to disclose how they do so (the requirement that becomes Germany's Barrierefreiheitserklärung and France's déclaration, below). But EU public-sector ICT procurement has used EN 301 549-based conformance reporting since long before the EAA, and enterprise buyers evaluating a vendor increasingly ask for the same kind of document buyers in the U.S. already expect. A VPAT built on the EU or INT edition is the recognised way to hand over that evidence — it just is not, by itself, the thing the law requires a service provider to publish to its own customers.

**Selling into both markets.** A single INT-edition ACR, kept current with your release cycle, answers a U.S. federal RFP and a European procurement request from the same document — which is the main practical reason vendors converge on it once they sell on both sides of the Atlantic.

## What a VPAT/ACR is not: telling it apart from a statutory accessibility statement

This is the distinction that causes the most confusion for companies operating in both the U.S. and EU/Germany/France, because the documents look superficially similar — both describe a product's or service's accessibility conformance — but they are legally and practically different instruments.

| Aspect | VPAT / ACR | Barrierefreiheitserklärung (Germany) | Déclaration d'accessibilité (France) |
| --- | --- | --- | --- |
| Legal status | Voluntary — no law requires this specific document | Mandatory under [Anlage 3 BFSG](/guides/barrierefreiheitserklaerung-bfsg-anlage3/) for covered services | Mandatory under the [RGAA framework](/guides/audit-rgaa-guide/) |
| Who publishes it, to whom | Vendor to a specific buyer/procurement team — often not public at all | Service provider, published where any consumer can find it | Site/app owner, linked from every page |
| What it covers | One product and version | The provider's service as consumers actually experience it | The site/app as tested, with a conformance rate |
| Content template | ITI's own template — Supports / Partially Supports / Does Not Support / Not Applicable per clause | Law's fixed list of five required items (Anlage 3) | Law's fixed list (methodology, compliance rate, non-conformities, contact route) |
| Standard(s) referenced | Section 508, EN 301 549, WCAG, or all three (INT) | EN 301 549 / WCAG, referenced but not the object being filed | RGAA (which itself operationalises WCAG 2.1 AA) |

Having a thorough ACR does not exempt a company from publishing the statutory declaration where the [BFSG](/guides/bfsg-pflichten-guide/) or RGAA applies — and a compliant statutory declaration does not give a U.S. federal contracting officer the document format they are trained to evaluate. A company selling a SaaS product to EU consumers *and* bidding for EU public contracts typically needs both: the product-level ACR for procurement, and the service-level statement for the consumer-facing site itself. Neither substitutes for the [European Accessibility Act](/guides/european-accessibility-act-guide/) compliance work underneath both documents — testing, remediation and keeping the evidence current.

## Keeping both documents honest

The same discipline applies to either kind of document: date and version it, describe the actual test methodology, and update it when the product or service changes materially. An ACR with blank remarks next to "Partially Supports" is exactly as weak as a Barrierefreiheitserklärung that asserts conformity without naming a testing method — both read as unverified to anyone who checks. Our [VPAT and ACR guide](/guides/vpat-acr-guide/) covers the red flags in detail; the same scepticism buyers apply to a self-filled ACR is what market surveillance authorities apply to a self-declared accessibility statement.
