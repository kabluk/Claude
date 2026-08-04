---
{
  "slug": "accessibility-audit-cost",
  "locale": "en",
  "title": "How much does an accessibility audit cost? Pricing factors and what you get",
  "description": "What an accessibility audit costs: verified public price examples, the factors that drive quotes, engagement models, and how to scope an RFP.",
  "updated": "2026-08-04",
  "faq": [
    {
      "q": "How much does a typical accessibility audit cost?",
      "a": "There is no single market rate, because almost every agency quotes per project based on scope. Among the few firms that publish prices, Accessible.org states most of its manual WCAG audits cost $1,250 to $2,750, while AbilityNet offers a fixed-price Digital Accessibility Review at £4,950 + VAT. Full audits of complex products by senior teams are quoted individually and cost substantially more than small-site audits."
    },
    {
      "q": "Why don't most agencies publish accessibility audit prices?",
      "a": "Because the effort depends on variables only visible after scoping: the number of unique templates and components, the complexity of interactive flows, how many assistive technologies and standards must be covered, and whether documents, retests or a VPAT are included. Two websites with the same page count can differ several-fold in audit effort, so most agencies price after a scoping call rather than from a rate card."
    },
    {
      "q": "Is an automated accessibility scan a cheap substitute for an audit?",
      "a": "No. Automated tools are inexpensive and useful for continuous monitoring, but they can only detect a minority of WCAG issues and cannot judge things like meaningful alt text, logical focus order or screen-reader usability. Legal frameworks such as the EAA and Section 508 are assessed against the full standard, which requires manual expert testing. Use automation to keep a fixed baseline between periodic manual audits."
    },
    {
      "q": "What should be included in an audit quote?",
      "a": "At minimum: the page/screen sample, the standard and conformance level tested (e.g. WCAG 2.2 AA or EN 301 549), the assistive-technology and browser matrix, the report format with severity ratings and remediation guidance, a findings walkthrough, and whether a retest after fixes is included. If you need a VPAT/ACR for procurement, confirm it is priced in — it is a common paid add-on."
    }
  ],
  "cta": { "label": "Compare accessibility audit providers", "path": "/services/accessibility-audit/" },
  "relatedAgencies": ["deque-systems", "tpgi", "abilitynet", "level-access"]
}
---
Ask five agencies what an accessibility audit costs and you will get five scoping questionnaires, not five numbers. That is not evasion: audit effort genuinely varies several-fold with the size and complexity of what is being tested, so most agencies quote per project. This guide explains honestly what drives the price, what the few published price points actually say, which engagement models exist, and how to write an RFP that produces quotes you can compare line by line.

## The honest answer: it depends, and quotes are project-based

A manual accessibility audit is skilled labour: experts test a sample of your pages or screens against every applicable success criterion of a standard such as [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/), using screen readers and other assistive technologies, then document and prioritise every failure. The cost is essentially expert hours multiplied by seniority — which is why a small brochure site and a multi-role SaaS platform, audited to the same standard, sit at opposite ends of the price spectrum. Very few agencies publish rate cards; treat any "flat fee for any website" offer with suspicion, since it usually signals an automated scan dressed up as an audit.

## What drives the price of an audit

| Cost driver | Why it moves the price |
|---|---|
| **Number of unique templates and components** | Auditors sample distinct page types and states, not every URL. 200 blog posts on one template cost little more than 20; ten bespoke interactive templates cost far more. |
| **Web app complexity** | Authenticated flows, multi-step transactions, data tables, drag-and-drop, charts and custom widgets need state-by-state testing and multiply effort versus static content. |
| **Assistive-technology coverage** | Each added AT/browser pairing (JAWS, NVDA, VoiceOver, TalkBack, magnification, voice control) adds a test pass. Mobile app testing is a separate workstream from web. |
| **Standard(s) targeted** | WCAG 2.2 AA is the common baseline. [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) adds clauses beyond web content; [Section 508](https://www.section508.gov/) adds US federal specifics. Multi-standard reporting adds mapping work. |
| **Documents and PDFs** | Document remediation-oriented review is usually priced per document or per page; a large PDF library can exceed the cost of the web audit itself. |
| **Retest included or not** | A verification round after your fixes is often quoted separately; excluding it makes a bid look cheaper than it is. |
| **VPAT/ACR add-on** | Producing an Accessibility Conformance Report for procurement is a distinct deliverable that many agencies price separately. |
| **Seniority and certification** | Teams with certified professionals (e.g. IAAP CPWA/WAS, DHS Trusted Testers) and testers with disabilities command higher rates — and typically produce more defensible reports. |

## Verified public price points

Most vendors quote privately, but a few publish real numbers you can check. These are useful as calibration, not as a universal market rate:

- **[Accessible.org](https://accessible.org/pricing/)** (US) publishes a full rate card, stated as updated in July 2026: most manual WCAG 2.1/2.2 AA audits cost **$1,250–$2,750**, priced at **$100–$250 per primary page or screen** and **$25–$100 per light page**. Add-ons include a WCAG-edition VPAT/ACR for **$350** with an audit, user-testing sessions with disabled testers at **$550 per session** ($450 with an audit), and technical support at **$195/hour**.
- **[AbilityNet](https://abilitynet.org.uk/accessibility-services/Digital-Accessibility-Review)** (UK charity) offers a fixed-price **Digital Accessibility Review at £4,950 + VAT** — a scoped expert review identifying critical WCAG 2.2 failures and risk areas, positioned as a step before a full audit programme.
- **[Accessible Web](https://accessibleweb.com/pricing/)** (US) publishes subscription pricing for its RAMP monitoring platform from **$49 to $599 per month** depending on sites and users — an example of the monitoring model rather than a manual audit; manual auditing is quoted separately.

Beyond these, expect quotes rather than price lists. As a qualitative guide consistent with the published examples above: a small site audited against WCAG AA sits in the low thousands (USD/EUR/GBP); mid-sized sites and apps with authenticated flows reach the mid four figures to low five figures; and enterprise platforms audited across web, mobile and documents by senior certified teams are five-figure engagements. We deliberately do not print an "average price" — unverifiable averages are how buyers get anchored to the wrong number.

## Engagement models and how they change the bill

- **Fixed-scope audit.** One-off assessment of an agreed sample against an agreed standard, with a report and walkthrough. Cheapest entry point; the risk is treating it as the finish line rather than the starting diagnosis.
- **Audit + remediation support.** The audit plus developer office hours, fix validation and a retest. Costs more upfront but usually reaches conformance faster and cheaper overall than an audit whose report nobody can implement.
- **Retainer / monitoring.** Ongoing arrangement combining automated monitoring, periodic manual spot-checks and on-call expertise. Spreads cost over the year and catches regressions each release — the model behind subscription pricing like Accessible Web's RAMP tiers above.

## How to scope an RFP that gets comparable quotes

Vague RFPs produce incomparable bids. Specify:

1. **Inventory** — URLs or app builds, an estimate of unique templates/screens, and test credentials for authenticated areas.
2. **Sample** — either propose the page/screen list yourself or ask each bidder to propose one and justify it; require key user journeys (registration, checkout, core transactions) end to end.
3. **Standard and level** — e.g. "WCAG 2.2 Level AA" or "EN 301 549 for EAA scope"; name any procurement need for a VPAT/ACR up front.
4. **AT/browser matrix** — which screen readers, browsers and platforms must be covered, including mobile.
5. **Deliverables** — report with severity ratings, WCAG references, remediation guidance per issue, findings walkthrough, and machine-readable issue export if you want tickets.
6. **Retest** — require a priced verification round after fixes in every bid, so no vendor can undercut by omitting it.
7. **Team** — ask who will actually test, their certifications, and whether people with disabilities take part in testing.
8. **Timeline and dependencies** — environment access, freeze windows, and turnaround expectations.

With those eight items fixed, price differences between bids reflect real differences in depth and seniority — which is exactly what you want to be choosing on.

## The cost of not auditing

The counterweight to the audit budget is legal and commercial exposure, which has grown sharply:

- **In the EU**, the [European Accessibility Act](https://eur-lex.europa.eu/eli/dir/2019/882/oj) has applied since 28 June 2025 to consumer-facing services such as e-commerce, banking, transport and telecoms. Member states enforce it through national market-surveillance authorities with fines and, ultimately, the power to restrict non-compliant services; several national regimes also let competitors and consumer bodies act on non-compliance.
- **In the US**, ADA-based digital accessibility lawsuits and demand letters continue at a high volume year after year, and Section 508 conformance (documented in an ACR) is a gating requirement for selling to federal buyers.
- **Commercially**, inaccessible checkouts and forms simply lose customers, and enterprise buyers increasingly require a current VPAT/ACR before signing.

Settlements, legal fees, emergency remediation under deadline and lost tenders each routinely exceed the price of the audit that would have surfaced the problems early. That asymmetry — modest, plannable audit cost versus open-ended enforcement and litigation exposure — is the real budget argument.

## Budget checklist

Before you approve an audit budget, confirm you have priced the whole journey, not just the report:

- [ ] Scoping call and sample definition
- [ ] Manual audit against your named standard and AT matrix
- [ ] Findings walkthrough with your developers
- [ ] Remediation time for your own team (often the largest hidden cost)
- [ ] Vendor support hours for fix validation
- [ ] Retest / verification round
- [ ] VPAT/ACR if you sell B2B or to government
- [ ] Ongoing monitoring between audits
- [ ] Training so the next release doesn't reintroduce the same issues

An audit whose findings get fixed, verified and defended by process is money well spent; an audit that becomes a PDF in a drawer is the only genuinely overpriced kind.
