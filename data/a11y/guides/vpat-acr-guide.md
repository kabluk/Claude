---
{
  "slug": "vpat-acr-guide",
  "locale": "en",
  "title": "VPAT and ACR Explained: How to Get One and Avoid Common Mistakes",
  "description": "What a VPAT is, how it differs from an ACR, the four VPAT 2.5 editions, what buyers expect, typical cost drivers, timelines, and red flags to avoid.",
  "standard": "section-508",
  "countryCode": "US",
  "updated": "2026-08-04",
  "faq": [
    {
      "q": "What is the difference between a VPAT and an ACR?",
      "a": "The VPAT is the blank template published by the Information Technology Industry Council (ITI). Once you test a product and fill the template in with conformance results, the completed document is an Accessibility Conformance Report (ACR). Buyers want the ACR; 'VPAT' survives as the colloquial name for both."
    },
    {
      "q": "Is a VPAT legally required?",
      "a": "No law says the words 'you must have a VPAT.' But federal solicitations routinely require accessibility documentation under Section 508, and an ACR based on the VPAT is the format contracting officers expect. Enterprise and higher-education buyers increasingly demand one too, so in practice it functions as a de facto requirement for B2B and government sales."
    },
    {
      "q": "Can I fill out a VPAT myself?",
      "a": "Yes — ITI publishes the template freely and self-completion is legitimate. The catch is credibility: an ACR is only as good as the testing behind it, and buyers discount reports with no described methodology or implausible blanket 'Supports' claims. Many vendors have a third party test the product and author the ACR precisely so procurement teams take it at face value."
    },
    {
      "q": "How often should an ACR be updated?",
      "a": "Update it whenever a major release changes the user interface or accessibility posture, and review it at least annually even without major releases. An ACR dated several years ago, or one describing a product version you no longer sell, is treated by experienced buyers as no ACR at all."
    }
  ],
  "cta": { "label": "Find VPAT and ACR service providers", "path": "/services/vpat/" },
  "relatedAgencies": ["tpgi", "level-access", "qualitylogic", "usablenet"]
}
---
If you sell software to the U.S. government, a university, or a large enterprise, sooner or later a procurement team will ask for "your VPAT." What they actually want is an Accessibility Conformance Report — a structured, standards-based account of how accessible your product really is. This guide explains what the VPAT is, how the current editions differ, who asks for one and why, what separates a credible ACR from a liability, and how the process typically works when you bring in a specialist.

## VPAT vs. ACR: Getting the Terms Straight

The **Voluntary Product Accessibility Template (VPAT®)** is a free template published and trademarked by the [Information Technology Industry Council (ITI)](https://www.itic.org/policy/accessibility/vpat). It translates accessibility standards — Section 508, EN 301 549, WCAG — into a table of testable criteria.

When you test a product against each criterion and record the results in the template, the completed document is an **Accessibility Conformance Report (ACR)**. As ITI puts it, the completed VPAT with documented testing results *is* the ACR. [Section508.gov](https://www.section508.gov/sell/acr/) uses the same distinction and recommends vendors publish an ACR for any ICT marketed to the federal government.

In everyday sales conversations, "VPAT" is used for both. That's fine — just know that handing a buyer a blank template is not what anyone means.

## The Current Version and the Four Editions

The current template generation is **VPAT 2.5Rev (April 2025)**, published in four editions on [ITI's VPAT page](https://www.itic.org/policy/accessibility/vpat). Each edition targets the standards relevant to a specific market:

| Edition | Standard covered | WCAG version included | Typical audience |
| --- | --- | --- | --- |
| VPAT 2.5 **508** | Revised Section 508 Standards (U.S. federal) | WCAG 2.0 | U.S. federal agencies and their vendors |
| VPAT 2.5 **EU** | EN 301 549 (EU public procurement) | WCAG 2.1 | European public-sector buyers |
| VPAT 2.5 **WCAG** | WCAG only | WCAG 2.0, 2.1, and 2.2 | Commercial buyers, web products |
| VPAT 2.5 **INT** | All three combined | WCAG 2.0, 2.1, and 2.2 | Global vendors covering every market in one report |

The WCAG versions differ per edition because each underlying standard incorporates a different WCAG release — WCAG 2.0 is baked into the Revised 508 Standards, WCAG 2.1 into EN 301 549, while the WCAG and INT editions carry criteria through [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

**Which edition should you pick?** If your pipeline is exclusively U.S. federal, the 508 edition is sufficient. If you sell internationally or expect European Accessibility Act–driven requests, the INT edition covers everything at the cost of a longer document. Many vendors default to INT so one report answers every RFP.

Selling into the EU specifically? The EU and INT editions don't just cite EN 301 549 — clause by clause, our [VPAT/ACR vs. EN 301 549 and WCAG guide](/guides/vpat-en-301-549-mapping-guide/) shows exactly which EN 301 549 sections the template answers with their own criteria and which ones it answers purely by cross-referencing the WCAG tables above.

For each criterion, the report declares one of four conformance levels defined by ITI: **Supports**, **Partially Supports**, **Does Not Support**, or **Not Applicable** — each with a remarks column explaining the result. ("Partially Supports" replaced the older "Supports with Exceptions" wording at the request of U.S. Access Board representatives.)

## Who Asks for an ACR, and Why

- **Federal contracting officers.** Section 508 obligates agencies to buy accessible ICT, and the FAR requires accessibility to be addressed in solicitations. ACRs are how agencies [assess vendor claims](https://www.section508.gov/buy/request-accessibility-information/) during market research and evaluation. No ACR often means no shortlist.
- **State and local governments.** Many states mirror federal 508 requirements, and the Department of Justice's ADA Title II web rule has pushed public entities to scrutinize the accessibility of everything they license.
- **Higher education.** Universities face both federal funding obligations and active enforcement history; procurement offices routinely gate software purchases on an ACR review.
- **Enterprise buyers.** Large companies increasingly treat accessibility as vendor risk management — an inaccessible embedded product can create ADA exposure and internal-policy violations for *them*.

An ACR rarely wins a deal by itself. Its job is to prevent the deal from dying in procurement review, and to demonstrate that your organization understands and manages accessibility.

## Self-Filled vs. Third-Party ACRs

Anyone may complete the template — ITI does not restrict who fills it in (though it does offer VPAT training, and the template's instructions set essential drafting requirements). The real question is whether the buyer will believe the result.

**Self-completed ACRs** make sense when you have genuine in-house accessibility expertise, an established testing practice, and the discipline to report defects honestly. They cost less and can be refreshed with every release.

**Third-party ACRs** — where an accessibility firm tests the product and authors the report — carry more weight with skeptical reviewers, and many firms put their name in the Evaluation Methods section. Experienced federal reviewers are explicitly trained to probe [vendor claims in ACRs](https://www.section508.gov/buy/understanding-vendor-accessibility-claims/); a report from a recognized firm with a described methodology tends to survive that probing.

A pragmatic middle path: have a third party run the assessment and produce the initial ACR, then maintain interim updates in-house between periodic external re-assessments.

## What a Good ACR Contains

- **Accurate product identification:** name, exact version, and date — an ACR is a snapshot of one version, not a brand-level promise.
- **A real "Evaluation Methods Used" section:** which tools, which assistive technologies (e.g., JAWS, NVDA, VoiceOver), which browsers/platforms, manual vs. automated coverage, and who did the testing.
- **Honest conformance levels with specific remarks.** "Partially Supports — date-picker component is not keyboard operable; workaround: manual date entry field" is credible. An empty remarks column next to "Partially Supports" is not.
- **Every applicable criterion answered**, including the functional performance criteria and support-documentation chapters in the 508 and INT editions — skipping chapters signals an unserious report.
- **Consistent scope.** If the report covers the web app but not the mobile app, say so explicitly.

## Typical Process and Timeline with a Vendor

Engagements vary with product size, but a common shape:

1. **Scoping (week 0):** define product version, key user flows, page/screen sample, platforms, and which VPAT edition to use.
2. **Assessment (roughly 2–4 weeks for a typical web application):** automated scans plus manual and assistive-technology testing against every criterion in the chosen edition.
3. **Findings review:** you receive the defect log — often your first realistic picture of the product's accessibility.
4. **Decision point — remediate first or report now?** Many vendors fix quick wins (labels, contrast, focus order) before the ACR is finalized so the report reads better *honestly*.
5. **ACR authoring and QA (about a week):** the firm drafts the report, you review factual accuracy, the firm finalizes.
6. **Publication:** post it where buyers can find it — Section508.gov specifically recommends linking the ACR from your product pages.

End to end, four to eight weeks is a reasonable expectation for a single mid-sized product; complex suites take longer. Pricing varies widely with product complexity and vendor, so get scoped quotes rather than relying on rules of thumb.

## Red Flags in Low-Quality VPATs

Whether you're reviewing your own draft or a subcontractor's, these patterns get reports rejected:

- **"Supports" on every row.** Reviewers know virtually no real product fully conforms; blanket claims read as untested or dishonest.
- **No evaluation methodology**, or "automated scan" as the only method — automated tools cannot evaluate most criteria.
- **Blank or boilerplate remarks** that repeat the criterion text instead of describing product behavior.
- **Wrong or ancient template versions**, or a mangled layout — the VPAT is a registered ITI mark and the template's structure shouldn't be improvised.
- **No product version or date**, or a date several years old.
- **Deleted rows or missing chapters** (functional performance criteria and documentation/support sections are frequent casualties).
- **Marketing language** ("we are committed to accessibility for all users") in place of conformance data.

## Keeping It Current

Treat the ACR as a living artifact tied to your release process:

- **Refresh on any release that materially changes the UI** or remediates reported defects — improvements you don't report can't help you in procurement.
- **Review at least annually** even in slow release cycles; buyers commonly discount reports older than 12–24 months.
- **Track template updates from ITI.** When a new VPAT revision lands (as 2.5Rev did in April 2025), migrate at your next refresh.
- **Keep an internal defect-to-criterion map** so each refresh is an update, not a from-scratch project.

Done well, the ACR stops being paperwork and becomes an asset: proof that you test, a roadmap of what to fix, and one less reason for procurement to pick your competitor.
