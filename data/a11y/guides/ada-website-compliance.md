---
{
  "slug": "ada-website-compliance",
  "locale": "en",
  "title": "ADA Website Compliance: What the Law Actually Requires in 2026",
  "description": "How the ADA applies to websites in 2026: the DOJ Title II rule and extended deadlines, Title III litigation trends, and a practical WCAG remediation path.",
  "standard": "ada",
  "countryCode": "US",
  "updated": "2026-08-04",
  "faq": [
    {
      "q": "Is there a specific law that says my website must be ADA compliant?",
      "a": "It depends who you are. State and local governments now have a formal DOJ regulation under ADA Title II requiring WCAG 2.1 Level AA for web content and mobile apps, with deadlines in 2027 and 2028 after a one-year extension. For private businesses under Title III there is still no technical web regulation, but courts and the DOJ have long applied the ADA's nondiscrimination mandate to websites, and thousands of lawsuits are filed on that basis every year."
    },
    {
      "q": "What are the current ADA Title II website deadlines?",
      "a": "In April 2026 the DOJ published an interim final rule extending both compliance dates by one year. Public entities with a population of 50,000 or more now must comply by April 26, 2027; entities under 50,000 and special district governments have until April 26, 2028. The required standard remains WCAG 2.1 Level AA."
    },
    {
      "q": "Does an accessibility overlay or widget make my site ADA compliant?",
      "a": "No. Overlay widgets do not fix the underlying code, and lawsuit data shows sites using them continue to be sued — some complaints even cite the widget itself as a barrier. Genuine compliance comes from remediating your site's code and content to WCAG and testing with assistive technology, not from a one-line script."
    },
    {
      "q": "What should I do if I receive an ADA demand letter about my website?",
      "a": "Take it seriously but don't panic-settle. Involve counsel experienced in digital-accessibility claims, preserve the letter and any deadlines, and commission a rapid expert assessment of your site so you know your actual exposure. A documented remediation plan started promptly both strengthens your negotiating position and reduces the likelihood of follow-on claims."
    }
  ],
  "cta": { "label": "Get an ADA website audit", "path": "/united-states/accessibility-audit/" },
  "relatedAgencies": ["level-access", "usablenet", "allyant", "tamman"]
}
---
"ADA website compliance" is one of the most searched — and most misunderstood — phrases in digital accessibility. As of 2026 the honest answer has two halves: state and local governments now face a concrete federal regulation with fixed deadlines and a named technical standard, while private businesses still operate without a formal web rule but under relentless litigation pressure. This guide separates what the law actually requires from what vendors claim it requires, and lays out a practical path to reducing risk.

## The ADA and Websites: Two Different Regimes

The [Americans with Disabilities Act](https://www.ada.gov/) prohibits disability discrimination. Two titles matter for websites:

- **Title II** covers state and local government entities — cities, counties, public schools and universities, transit agencies, courts, special districts.
- **Title III** covers "places of public accommodation" — private businesses open to the public: retailers, restaurants, banks, hotels, healthcare providers, and, per most courts and the Department of Justice, their websites and apps.

The ADA's text (1990) predates the commercial web, so for decades the question "what exactly must my website do?" had no regulatory answer. For Title II, that changed in 2024.

## Title II: A Real Rule, With Real (Extended) Deadlines

On April 24, 2024, the DOJ published a final rule under Title II — ["Accessibility of Web Content and Mobile Apps Provided by State and Local Government Entities"](https://www.ada.gov/resources/2024-03-08-web-rule/) (28 C.F.R. Part 35) — adopting **WCAG 2.1 Level AA** as the enforceable technical standard for public entities' web content and mobile apps.

The original compliance dates were April 2026 and April 2027. Days before the first deadline hit, the DOJ published an [interim final rule (April 20, 2026)](https://www.federalregister.gov/documents/2026/04/20/2026-07663/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web) extending both dates by one year. As of today, the schedule is:

| Entity | Original deadline | Current deadline |
| --- | --- | --- |
| Public entities serving a population of 50,000 or more | April 24, 2026 | **April 26, 2027** |
| Public entities under 50,000, and all special district governments | April 26, 2027 | **April 26, 2028** |

The technical standard did not change — WCAG 2.1 AA, as published by the W3C ([w3.org/TR/WCAG21](https://www.w3.org/TR/WCAG21/)), still applies to web content and mobile apps a public entity provides or makes available, including through contractors and third-party platforms.

The rule contains limited exceptions — including archived web content, certain preexisting electronic documents, some third-party content the entity doesn't control, and individualized password-protected documents — each narrowly defined, with the details in the [DOJ's fact sheet and small-entity compliance guide on ADA.gov](https://www.ada.gov/resources/2024-03-08-web-rule/). Public entities should read the exceptions carefully before relying on them: content used to apply for or participate in current services generally does not qualify.

**If you're a public entity, the extension is runway, not a reprieve.** Large-entity deadlines are now under a year away, and typical government web estates — thousands of pages, decades of PDFs, procured third-party systems — routinely take that long to inventory, remediate, and re-procure.

## Title III: No Web Regulation, Plenty of Lawsuits

For private businesses there is still **no formal DOJ regulation** specifying a technical standard for websites. The DOJ withdrew earlier Title III web rulemaking efforts and has instead maintained, in [published guidance](https://www.ada.gov/resources/web-guidance/), that the ADA's general nondiscrimination requirements apply to the websites of businesses open to the public, with flexibility in how compliance is achieved.

Courts fill the vacuum. Most federal circuits have allowed website accessibility claims to proceed under Title III (with varying theories about the required nexus to a physical place), and settlements and consent decrees overwhelmingly reference **WCAG 2.0 or 2.1 Level AA** as the fix. In practice, WCAG AA functions as the de facto Title III standard even without a regulation.

## Lawsuit Trends: What the Data Shows

Digital accessibility litigation remains high-volume and increasingly systematic. According to [UsableNet's year-end analysis of 2025 filings](https://blog.usablenet.com/ada-web-lawsuit-trends-2026):

- **More than 5,000 digital accessibility lawsuits** were filed in 2025 across federal and state courts — over 3,100 federal filings, plus nearly 2,000 in New York and California state courts combined.
- **Repeat litigation is routine:** 1,427 of 2025's suits targeted companies that had already faced an ADA web claim; in federal court, 46% of cases involved repeat defendants.
- **Industry concentration is extreme:** e-commerce drew nearly 70% of suits, food service roughly 21%.
- **Company size raises exposure:** 36% of sued companies reported revenue over $25 million, and about 36% of the top 500 e-commerce retailers received at least one accessibility suit in 2025.
- **Accessibility widgets don't prevent suits:** filings increasingly name overlay widgets while alleging unresolved code-level barriers — and sometimes allege the widget itself interferes with screen readers.

Beyond filed lawsuits sits a much larger volume of **demand letters** — pre-suit letters alleging WCAG failures and offering settlement. They are cheaper for plaintiff firms than filing, arrive without public record, and by their nature aren't fully counted in any published statistics. Many businesses' first contact with the ADA is a demand letter citing a screen-reader test of their checkout flow.

## What "Compliance" Means Practically

Since neither title of the ADA (for private businesses) nor most demand letters give you anything more specific, practical compliance means **conformance with WCAG at Level AA**:

- **WCAG 2.1 AA** is the version named in the Title II rule and most settlements — the safe minimum target.
- **[WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/)** is the current W3C recommendation, adding criteria around focus visibility, dragging alternatives, and accessible authentication. New builds should target 2.2 AA; it includes 2.1's requirements, so you lose nothing.

Concretely, an AA-conformant site means (among ~50 success criteria): full keyboard operability with visible focus; correctly labeled forms and controls; meaningful alt text; sufficient color contrast; captions on video; a logical heading and landmark structure; error messages that assistive technology announces; and content that works at 200% zoom and in portrait or landscape.

Two things compliance does **not** mean:

- **A certificate.** No one can issue a legally recognized "ADA compliance certificate" for a website. Anyone selling one is selling paper.
- **An overlay.** As the litigation data above shows, one-line widget scripts do not remediate code and do not stop lawsuits.

## A Realistic Remediation Path

1. **Audit against WCAG 2.1/2.2 AA.** Combine automated scanning with expert manual and screen-reader testing of your critical user flows (search, product page, cart, checkout, account, contact). Automated tools alone find only a fraction of AA issues.
2. **Triage by user impact and legal exposure.** Blockers in revenue and service flows first — these are what complaints cite.
3. **Fix templates and components before pages.** Most defects are systemic; one corrected component clears them across the site.
4. **Remediate documents and media** — PDFs, videos without captions — or replace them with accessible HTML equivalents.
5. **Verify with assistive technology and, ideally, users with disabilities.** Passing a scanner is not passing a screen reader.
6. **Publish an accessibility statement** with a working feedback channel, and answer messages — demonstrated responsiveness matters in disputes.
7. **Institutionalize:** accessibility criteria in design reviews, automated checks in CI, training for content authors, and scheduled re-audits. Sites regress within months without this — which is exactly the pattern repeat-lawsuit data punishes.

## Choosing Help

Look for providers that:

- Test manually with assistive technology and employ **testers with disabilities**, not scan-and-report shops;
- Deliver findings mapped to specific WCAG success criteria with developer-ready fixes;
- Offer **litigation support experience** — audits and expert reporting that hold up when counsel is involved;
- Cover your full estate: web, mobile apps, PDFs, and third-party components;
- Include **verification retesting** and ongoing monitoring, not just a one-time report;
- Refuse to promise "guaranteed compliance" or sell overlays as a fix — both are marks of vendors optimizing for your fear rather than your risk.

The legal picture in 2026 is unambiguous in one respect: whether you're a city with an April 2027 deadline or a retailer watching plaintiff firms work through the e-commerce top 500, waiting is the most expensive strategy. A credible WCAG AA audit is the first step in either case.
