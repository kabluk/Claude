---
{
  "slug": "section-508-compliance-guide",
  "locale": "en",
  "title": "Section 508 Compliance: Who Must Comply and How to Get There",
  "description": "What Section 508 requires, who it covers, how the Revised 508 Standards map to WCAG, the role of VPATs in procurement, and a practical path to compliance.",
  "standard": "section-508",
  "countryCode": "US",
  "updated": "2026-08-04",
  "faq": [
    {
      "q": "Does Section 508 apply to private companies?",
      "a": "Not directly. Section 508 binds federal agencies, but it reaches private companies through procurement: any vendor selling ICT to the federal government must show its products meet the Revised 508 Standards. In practice, contractors, SaaS providers, and hardware makers that want federal business treat 508 conformance as a market requirement."
    },
    {
      "q": "Is Section 508 the same as WCAG?",
      "a": "No, but they overlap heavily. The Revised 508 Standards incorporate WCAG 2.0 Level A and AA by reference for web content, and apply those criteria to electronic documents and software as well. Section 508 also adds requirements WCAG does not cover, such as hardware, functional performance criteria, and support documentation."
    },
    {
      "q": "What is the difference between Section 508 and the ADA?",
      "a": "Section 508 is part of the Rehabilitation Act and governs information and communication technology that federal agencies develop, procure, maintain, or use. The ADA is a broader civil rights law covering state and local governments (Title II) and places of public accommodation (Title III). A company can be exposed to ADA claims without ever touching Section 508, and vice versa."
    },
    {
      "q": "How long does a Section 508 audit take?",
      "a": "It depends on scope. A focused audit of a single web application against the Revised 508 Standards typically takes a few weeks from kickoff to report, covering a representative sample of pages and user flows. Large platforms, native apps, or document-heavy portals take longer, and remediation plus verification testing adds additional cycles."
    }
  ],
  "cta": { "label": "Explore Section 508 audit providers", "path": "/standards/section-508/" },
  "relatedAgencies": ["deque-systems", "level-access", "microassist", "sierra7"]
}
---
Section 508 compliance is the price of admission for doing digital business with the U.S. federal government. The law itself applies to federal agencies, but its practical reach extends to every contractor, software vendor, and service provider whose technology ends up in a federal environment. This guide explains what Section 508 actually requires, who has to comply, how conformance is documented and tested, and how to build a realistic path from "we think we have issues" to a defensible compliance posture.

## What Section 508 Is

Section 508 is a provision of the [Rehabilitation Act of 1973](https://www.section508.gov/manage/laws-and-policies/), added in its modern form by the Workforce Investment Act of 1998 and codified at 29 U.S.C. § 794d. It requires federal agencies to ensure that the information and communication technology (ICT) they **develop, procure, maintain, or use** is accessible to people with disabilities — both federal employees and members of the public — unless doing so would impose an undue burden.

"ICT" is deliberately broad. It covers:

- Websites, web applications, and intranets
- Software and mobile applications
- Electronic documents (PDF, Word, Excel, PowerPoint)
- Hardware such as kiosks, copiers, and telecommunications equipment
- Multimedia, and the support documentation and services that ship with all of the above

Enforcement works differently from most accessibility laws. Federal employees and members of the public can file administrative complaints with the agency involved, and agencies must report on their 508 program maturity. There is no private lawsuit machine comparable to ADA Title III litigation — the pressure comes from procurement, oversight, and agency accountability instead.

## The Revised 508 Standards (the 2017 "Refresh")

For years, Section 508 ran on an aging set of technical provisions from 2000. On **January 18, 2017**, the [U.S. Access Board issued a final rule](https://www.access-board.gov/ict/) — the Revised 508 Standards — and compliance with the revised standards became mandatory on **January 18, 2018**, per the [official transition guidance on Section508.gov](https://www.section508.gov/blog/Revised-508-Standards-Safe-Harbor-and-FAR-Update/).

The refresh made three structural changes that still define compliance work today:

1. **WCAG 2.0 incorporated by reference.** The Revised Standards adopt [WCAG 2.0](https://www.w3.org/TR/WCAG20/) Level A and Level AA success criteria as the benchmark for web content — and extend those same criteria to non-web electronic documents and software. If you know WCAG, you know the core of modern 508.
2. **Focus on functionality, not product categories.** Instead of regulating "video equipment" or "web pages" as silos, the standards apply requirements based on what a product does, which handles converged devices far better.
3. **Harmonization.** The refresh aligned U.S. requirements with international standards, including the European EN 301 549 framework, reducing duplicate testing for global vendors.

A **safe harbor** provision covers legacy ICT: existing, unaltered technology that complied with the original standards as of January 18, 2018 doesn't need to be retrofitted — until it is altered. Any update to a legacy system pulls the altered portion into the revised standards.

The Federal Acquisition Regulation (FAR) has also been [updated to reference the Revised 508 Standards](https://www.section508.gov/blog/far-update-adds-revised-508-standards/), which is what turns the Access Board's technical rule into contract language vendors actually see in solicitations.

## Who Must Comply in Practice

| Who | Obligation | Where it bites |
| --- | --- | --- |
| Federal agencies | Direct legal duty under 29 U.S.C. § 794d | All ICT developed, procured, maintained, or used |
| Federal contractors | Contractual duty via FAR clauses | Deliverables — websites, software, documents — must conform |
| ICT vendors (software, SaaS, hardware) | Market requirement | Solicitations require accessibility documentation; non-conformant products lose bids |
| Federally funded programs & many states | Indirect | Section 504 obligations and state "mini-508" laws often mirror the federal standards |

Two groups routinely underestimate their exposure:

- **Subcontractors.** Prime contractors flow 508 requirements down. If your component ships inside someone else's federal deliverable, its accessibility defects become the prime's problem — and then yours.
- **Commercial SaaS vendors.** Agencies buy commercial products constantly. Procurement teams ask for accessibility documentation during market research, and products with no answer are quietly filtered out before you ever see a rejection.

## Where the VPAT and ACR Fit

Federal buyers assess accessibility claims through an **Accessibility Conformance Report (ACR)** — typically built on the [VPAT® template from the Information Technology Industry Council](https://www.itic.org/policy/accessibility/vpat). The VPAT is the blank template; the completed, product-specific document is the ACR. [Section508.gov recommends](https://www.section508.gov/sell/acr/) that vendors produce an ACR for any ICT marketed to the federal government, and contracting officers use ACRs during market research and proposal evaluation.

An honest ACR does not need to claim perfection. Buyers expect "Partially Supports" entries with clear explanations. What kills credibility is a report that claims full support everywhere, cites no testing methodology, or is years out of date. (See our dedicated [VPAT and ACR guide](/guides/vpat-acr-guide/) for the details.)

Selling to EU buyers as well as U.S. federal ones? The same ACR template has an EU edition built around EN 301 549 instead of the Revised 508 Standards — see [how the two map to each other and to WCAG](/guides/vpat-en-301-549-mapping-guide/).

## How Section 508 Testing Works

There is no single mandated test method, but two government-backed approaches dominate:

- **DHS Trusted Tester.** The Department of Homeland Security's [Trusted Tester program](https://www.section508.gov/test/trusted-tester/) is a standardized, code-inspection-based manual test process with a certification exam. It produces repeatable results that agencies accept across organizational lines. The current certification courses are on version 5 of the process.
- **ICT Testing Baseline.** The [ICT Testing Baseline for Web](https://ictbaseline.access-board.gov/), maintained under the Federal CIO Council's accessibility community, defines the minimum set of tests any methodology must cover to reliably evaluate conformance with the Revised 508 Standards. Trusted Tester is aligned to it; commercial methodologies can map to it too.

In practice, a competent 508 assessment combines:

1. **Automated scanning** to catch programmatically detectable issues at scale (roughly a quarter to a third of WCAG criteria can be checked automatically);
2. **Manual expert testing** against the full standard, including keyboard-only operation and code inspection;
3. **Assistive technology testing** with screen readers (JAWS, NVDA, VoiceOver) and magnification;
4. **Document testing** for PDFs and Office files, which have their own conformance techniques.

## Common Failure Areas

Audit findings across federal and vendor projects cluster around the same defects:

- **Missing or wrong accessible names** — unlabeled form fields, icon buttons, and links like "click here"
- **Keyboard traps and missing focus indicators** — custom widgets that work only with a mouse
- **Images without meaningful alternative text**, especially charts and infographics
- **Poor color contrast** in text, controls, and data visualizations
- **PDFs that were never tagged** — often the largest backlog item in document-heavy agencies
- **Videos without captions or audio description**
- **Dynamic content that never reaches assistive technology** — status messages, error validation, single-page-app route changes
- **Third-party components** (chat widgets, analytics overlays, embedded maps) that no one tested before integration

## A Step-by-Step Path to Section 508 Compliance

1. **Inventory your ICT.** List the websites, applications, document repositories, and hardware in scope. For vendors: list the products you sell into federal accounts, including versions.
2. **Prioritize by exposure.** Public-facing and high-transaction ICT first; then internal tools federal employees rely on; then archival content.
3. **Baseline audit.** Commission an assessment against the Revised 508 Standards using a Baseline-aligned methodology. Insist on findings mapped to specific standard provisions with screenshots, code references, and severity.
4. **Remediate by severity, then by pattern.** Fix blockers (keyboard traps, missing labels on critical flows) first, then knock out repeated template-level defects — one fixed component often clears hundreds of instances.
5. **Document conformance.** Produce or update your ACR from the audit evidence. State the test methodology and scope explicitly.
6. **Build it into the pipeline.** Add automated checks to CI, accessibility acceptance criteria to tickets, and manual testing to release gates. [Section508.gov's design and development guidance](https://www.section508.gov/develop/) is a useful free reference for teams.
7. **Re-test on a cadence.** Major releases and annual reviews. Legacy safe-harbor claims evaporate the moment you alter a system, so track changes.

## What to Look For in a 508 Audit Vendor

- **Trusted Tester–certified staff** or a documented methodology mapped to the ICT Testing Baseline — ask which, and how many testers hold current certification.
- **Federal past performance.** Reviewing a consumer marketing site and reviewing a FedRAMP-hosted case-management system are different jobs.
- **Full-scope coverage:** web, software, mobile, hardware if relevant, and electronic documents — many shops quietly exclude PDF remediation.
- **Actionable reporting.** Findings tied to specific 508/WCAG provisions, with remediation guidance developers can execute, not just a score.
- **ACR authorship experience.** If the audit will feed a VPAT-based ACR, the vendor should have written ones that survived contracting-officer scrutiny.
- **Verification retesting included** — a fixed-price audit that charges full freight to confirm your fixes is a red flag.
- **Humans with disabilities on the test team.** Not a legal requirement, but consistently correlated with findings that matter in real use.

Section 508 compliance is not a one-time certificate; it is an operational capability. Agencies with mature programs — and vendors who win federal deals repeatedly — treat accessibility like security: budgeted, tested continuously, and owned by named people. Start with the inventory, get a credible baseline audit, and let the evidence drive the plan.
