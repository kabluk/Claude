---
{
  "slug": "wcag-audit-vs-overlay",
  "locale": "en",
  "title": "Accessibility Overlays vs. Real WCAG Audits: What Actually Delivers Compliance",
  "description": "Overlay widgets promise instant accessibility compliance; audits deliver it. What overlays do, what the legal record shows, and what a real audit includes.",
  "standard": "wcag-2-2",
  "updated": "2026-08-04",
  "faq": [
    {
      "q": "Do accessibility overlays make a website WCAG compliant?",
      "a": "No. The Overlay Fact Sheet, endorsed by hundreds of accessibility practitioners, states that while an overlay may improve compliance with a handful of provisions, full WCAG conformance cannot be achieved with an overlay. WCAG conformance requires that no content violates the success criteria, and overlays cannot reliably repair issues like missing form labels, keyboard traps, or inaccurate alt text at the source."
    },
    {
      "q": "Can I still be sued if I use an accessibility overlay?",
      "a": "Yes. UsableNet's 2025 midyear report documents lawsuits filed against companies using accessibility widgets every month of the first half of 2025, including 132 in February alone, and concludes that widgets offer no legal protection. Complaints frequently cite the underlying code-level barriers that the widget failed to fix."
    },
    {
      "q": "What happened in the FTC case against accessiBe?",
      "a": "In January 2025 the US Federal Trade Commission ordered overlay vendor accessiBe to pay $1 million over deceptive claims that its accessWidget could make any website WCAG 2.1 AA compliant automatically; the FTC also alleged the company presented paid reviews as independent endorsements. The Commission finalized the order in April 2025. It is the clearest official finding to date that automated overlay compliance claims are not reliable."
    },
    {
      "q": "What does a real accessibility audit include?",
      "a": "A professional audit combines automated scanning with expert manual testing against WCAG 2.1/2.2 AA or EN 301 549: keyboard-only operation, screen reader testing, color and zoom checks, and review of forms, dynamic components, and documents. You receive a prioritized report with code-level findings, remediation guidance for your developers, and typically a retest to verify fixes — evidence you can actually stand behind."
    }
  ],
  "cta": { "label": "Get a real WCAG audit from a vetted agency", "path": "/services/accessibility-audit/" },
  "relatedAgencies": ["deque-systems", "tpgi", "level-access", "allyant"]
}
---
Accessibility overlays are one-line JavaScript widgets that promise to make a website accessible — sometimes "fully ADA and WCAG compliant" — automatically and overnight. Real WCAG audits are slower and involve humans. If the overlay pitch were true, no one would pay for the audit. But the documented record — from the practitioner-signed [Overlay Fact Sheet](https://overlayfactsheet.com/en/) to a [$1 million FTC enforcement order](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-order-requires-online-marketer-pay-1-million-deceptive-claims-its-ai-product-could-make-websites) and ongoing lawsuits against overlay-equipped sites — points one way: overlays do not deliver compliance, and organizations that rely on them keep the legal risk they were trying to eliminate. This guide lays out what overlays actually do, what the evidence shows, and what a genuine audit and remediation engagement looks like.

## What overlay vendors claim — and what the products do

Overlays, as defined by the [Overlay Fact Sheet](https://overlayfactsheet.com/en/), are technologies that apply third-party source code (typically JavaScript) to attempt front-end accessibility improvements after the fact. In practice they combine two things:

- **A visible widget** offering user controls — contrast toggles, text resizing, reading masks, "screen reader mode."
- **Automated repair scripts** that scan the rendered page and try to patch issues (for example, guessing image alt text or injecting ARIA attributes) as the page loads in the visitor's browser.

The marketing frequently extends to claims of automatic conformance with WCAG and laws that reference it. The technical reality is narrower:

- **Widget features are largely redundant.** As the Fact Sheet notes, users with disabilities already have magnification, contrast, and screen reader capabilities at the operating-system or assistive-technology level — features they need for every site, not just yours.
- **Automated repair is unreliable for exactly the issues that matter.** Machine-generated alt text, patched form labels, error handling, and keyboard access are all called out in the Fact Sheet as areas where automated repair cannot be trusted, and modern JavaScript frameworks can re-render content faster than an overlay can patch it.
- **Full conformance is out of reach by design.** WCAG conformance means [no content violates the success criteria](https://www.w3.org/WAI/WCAG22/Understanding/conformance). A tool that demonstrably cannot repair every issue cannot, by definition, make a site conformant — which is why the Fact Sheet concludes that "full compliance cannot be achieved with an overlay."
- **Privacy is a separate concern.** Some overlays detect assistive technology to auto-enable profiles, which exposes the fact that a visitor has a disability — a practice the Fact Sheet flags as a risk under GDPR, UK GDPR, and CCPA.

None of this means every overlay vendor acts in bad faith, or that a text-resizing widget harms anyone by itself. The problem is the compliance claim attached to the script.

## What the accessibility community and regulators say

The [Overlay Fact Sheet](https://overlayfactsheet.com/en/) — authored and signed by a long list of accessibility practitioners, including people with disabilities — commits its signatories to advocate for fixing issues at the source and explicitly "advocate[s] for the removal of web accessibility overlays."

Regulators and public testing bodies have followed:

- **US Federal Trade Commission (2025).** The FTC [ordered accessiBe to pay $1 million](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-order-requires-online-marketer-pay-1-million-deceptive-claims-its-ai-product-could-make-websites) over claims that its accessWidget could make any website WCAG 2.1 AA compliant automatically. The complaint alleged the product failed to make basic components such as navigation menus, form fields, and image descriptions accessible, and that the company presented paid reviews as independent. The [order was finalized in April 2025](https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-approves-final-order-requiring-accessibe-pay-1-million).
- **Germany's public accessibility monitoring bodies.** The federal and state monitoring bodies for IT accessibility issued a [joint assessment on overlay tools](https://www.bfit-bund.de/DE/Publikation/einschaetzung-overlaytools.html), warning that sites deploying overlays risk becoming *less* accessible for assistive technology users. Consequently, Germany's BIK testing network [will not issue conformance statements for websites running an overlay](https://bitvtest.de/test-methodik/web/beschreibung-des-pruefverfahrens) — an overlay can disqualify you from the very certification you bought it to obtain.

## The legal record: overlays do not stop lawsuits

The clearest empirical signal comes from litigation data. [UsableNet's 2025 midyear report](https://blog.usablenet.com/2025-midyear-accessibility-lawsuit-report-key-legal-trends) counted 2,019 US digital accessibility lawsuits in the first half of 2025 — and found that plaintiffs filed suits against companies using accessibility widgets **every month** of that period, including 132 in February alone. The report's conclusion is blunt: "accessibility widgets continue to offer no legal protection to the companies that use them." Complaints often cite the code-level barriers — unlabeled buttons, broken keyboard navigation, inaccessible checkout flows — that the widget did not and could not fix, and in some cases the widget itself introduces new barriers such as conflicting keyboard commands.

In the EU, the stakes now extend beyond litigation. The [European Accessibility Act (Directive (EU) 2019/882)](https://eur-lex.europa.eu/eli/dir/2019/882/oj) has applied since June 2025, with national market-surveillance authorities empowered to demand remediation and impose penalties. Conformance is assessed against [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) — the same source-level requirements an overlay cannot satisfy.

## What a real audit and remediation engagement includes

A professional WCAG audit is not a scan report. A credible engagement typically covers:

- **Scoping and representative sampling** — key templates, user journeys (registration, search, checkout), authenticated states, and documents, so findings generalize to the whole product.
- **Automated testing as a first pass** — useful for catching roughly the machine-detectable subset of issues, never treated as the result.
- **Expert manual testing** — full keyboard-only operation, screen reader testing (e.g. NVDA, JAWS, VoiceOver), zoom and reflow up to 400%, contrast verification, and review of dynamic components against WCAG 2.2 AA and, where relevant, EN 301 549.
- **A prioritized, code-level report** — each finding mapped to a success criterion, with severity, affected user groups, and concrete remediation guidance your developers can act on.
- **Remediation support and retest** — office hours or pairing during fixes, then a verification pass confirming the barriers are gone, producing evidence (such as an ACR/VPAT or a published test report) you can hand to procurement, regulators, or opposing counsel.
- **Durability measures** — design-system fixes, CI checks, and team training so accessibility survives the next release.

That is the substantive difference: an audit changes your codebase; an overlay changes what loads on top of it.

## Decision checklist

Before you sign anything — overlay subscription or audit contract — run through this list:

| Question | Overlay | Audit + remediation |
|---|---|---|
| Are barriers fixed in our own code? | No — patched at runtime, if at all | Yes — fixed at the source |
| Can it achieve full WCAG conformance? | No ([Overlay Fact Sheet](https://overlayfactsheet.com/en/)) | Yes, verified by retest |
| Does it hold up as legal evidence? | Weak — widget users [are sued monthly](https://blog.usablenet.com/2025-midyear-accessibility-lawsuit-report-key-legal-trends) | Strong — documented conformance testing |
| Accepted by certification/testing bodies? | German BIK test network [declines conformance statements](https://bitvtest.de/test-methodik/web/beschreibung-des-pruefverfahrens) for overlay sites | Standard basis for conformance claims |
| Regulator-tested marketing claims? | FTC found "automatic compliance" claims [deceptive](https://www.ftc.gov/legal-library/browse/cases-proceedings/2223156-accessibe-inc) | N/A — claims rest on your own test results |
| Ongoing cost | Recurring subscription, risk remains | Front-loaded effort, compounding payoff |

Practical guidance:

1. If a vendor promises automated compliance with WCAG, the ADA, or the EAA, treat that claim as disproven by the public record cited above.
2. If you already run an overlay, do not simply rip it out in a panic — commission an audit, remediate at the source, then remove the overlay once real fixes are verified.
3. Budget for people, not just tooling: the durable fixes live in your templates, components, and content workflows.
4. Ask any prospective audit partner how they test (manual methodology, assistive technologies used, sampling approach) and what evidence you receive at the end.

Overlays sell the feeling of compliance. Audits, remediation, and retesting produce the fact of it — for your users first, and for regulators and courts as a consequence.
