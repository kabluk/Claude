---
{
  "slug": "accessibility-statement-guide",
  "locale": "en",
  "title": "How to Write an Accessibility Statement (with a Free Template)",
  "description": "What an accessibility statement must cover, who needs one under EU rules, and a fillable template you can adapt — based on W3C WAI's guidance.",
  "standard": "eaa",
  "updated": "2026-08-13",
  "faq": [
    {
      "q": "What is an accessibility statement?",
      "a": "A published page that communicates an organisation's commitment to digital accessibility and gives visitors concrete information about the accessibility of the site or app: the standard it targets, its current conformance status, any known limitations, and how to report a problem. W3C WAI's guidance and generator describe the standard structure most statements follow."
    },
    {
      "q": "Is an accessibility statement legally required?",
      "a": "It depends on the jurisdiction and sector. It is not universally mandatory, but W3C WAI notes it is required in specific contexts — for example for public-sector bodies in countries that have implemented the EU Web Accessibility Directive. Several EU member states also require one under their national transposition of the European Accessibility Act. Check the rules that apply to your sector and country rather than assuming either way."
    },
    {
      "q": "What standard should the statement say I'm targeting?",
      "a": "Name the current standard you're actually testing against — typically WCAG 2.2 at Level AA, or EN 301 549 if you're in EU scope (EN 301 549 incorporates WCAG by reference for web content; see our EN 301 549 guide). Naming a specific, current standard is more useful to readers and regulators than a vague claim like \"we are accessible.\""
    },
    {
      "q": "Can I publish a statement if my site isn't fully compliant yet?",
      "a": "Yes — that's the normal case, not an exception. A credible statement describes the actual, current status honestly, including known limitations, rather than promising perfection. An outdated or overstated statement is a bigger credibility problem than an honest one that lists open issues and a plan to fix them."
    }
  ],
  "cta": { "label": "Get a free automated accessibility scan", "path": "/scan/" },
  "relatedAgencies": ["deque-systems", "tpgi", "level-access", "allyant"]
}
---
An accessibility statement is a short, published page that tells visitors what standard your site targets, how well it currently meets that standard, and how to reach you if something doesn't work. It's one of the few accessibility deliverables regulators and users can both see directly, which is why it's required outright in some jurisdictions and expected as good practice everywhere else. This guide follows W3C WAI's [Developing an Accessibility Statement](https://www.w3.org/WAI/planning/statements/) guidance and gives you a fillable template.

## What an accessibility statement is — and who needs one

W3C WAI describes an accessibility statement as a page that communicates your organisation's commitment to accessibility and gives users information about how accessible your site or app currently is. It is not universally mandatory, but WAI is explicit that it is a requirement in some contexts — notably for **public bodies in countries that have implemented the EU Web Accessibility Directive**. Several EU member states additionally require a statement under their national law transposing the **European Accessibility Act (EAA)**, extending the obligation to private-sector organisations in EAA scope; see our [European Accessibility Act guide](/guides/european-accessibility-act-guide/) for which sectors that covers, and [EN 301 549 explained](/guides/en-301-549-explained/) for the technical standard the statement typically references. This guide covers the statement in general, English-language terms — if your obligation is specifically German BFSG/BITV, see our dedicated guides to the [five mandatory Anlage-3 elements](/guides/barrierefreiheitserklaerung-bfsg-anlage3/) and a [ready-to-adapt German template and publishing checklist](/guides/barrierefreiheitserklaerung-muster-checkliste/).

Beyond the legal cases, publishing a statement is good practice for any organisation that takes accessibility seriously: it signals commitment, gives users a documented feedback channel instead of a dead end, and gives you a place to record known issues so they don't have to be discovered by users hitting them.

## What to include

Based on W3C WAI's guidance, a statement should cover:

**Required elements:**

- **A commitment to accessibility** — a short statement that your organisation is working to make its digital content accessible to people with disabilities.
- **The standard applied** — name it specifically, e.g. WCAG 2.2 Level AA, or EN 301 549 where that applies. A vague claim with no named standard is not useful to a reader trying to verify anything.
- **Contact information** for users who encounter an accessibility problem — a real feedback mechanism they can actually use, not just a generic contact form buried elsewhere.

**Recommended additional content:**

- **Conformance status** — how fully the site currently meets the named standard, and the basis for that assessment (self-evaluation, or an external audit with a date).
- **Known limitations** — plain-language description of what doesn't yet work, e.g. "some older PDF documents are not yet accessible," rather than silence.
- **Measures taken** — what you've done to support accessibility (processes, training, testing practices).
- **Technical environment** — browsers, assistive technologies and versions you've tested against, if relevant to readers.
- **References to applicable law or policy**, where relevant to your sector or country.
- **Preparation date and last-review date** — so readers know how current the information is.

WAI's guidance is explicit on tone: write in **plain language**, not jargon. Say "videos on this site do not currently have captions" rather than citing a WCAG success criterion number with no explanation — the statement is for your users first, not only for auditors.

## Where to put it

Make the statement easy to find: link it from the site footer (on every page, not just the homepage), and consider also linking it from a help menu, sitemap, or about page. A statement nobody can locate does not serve its purpose regardless of how well it's written.

## A fillable template

Copy the structure below and replace every bracketed placeholder with your organisation's actual facts. Do not publish placeholder text unchanged.

```
Accessibility Statement for [Organisation / Site Name]

[Organisation Name] is committed to ensuring digital accessibility for
people with disabilities. We are continually improving the user experience
for everyone and applying the relevant accessibility standards.

Conformance status
This website has been evaluated against [WCAG 2.2 Level AA / EN 301 549]
as of [date]. Based on [a self-assessment completed on (date) / an audit
conducted by (auditor name) on (date)], [site/app name] is [fully
conformant / partially conformant] with this standard.

Known limitations
The following known issues have not yet been fixed:
- [Area/page]: [description of the issue and, if known, the affected
  success criterion].
- [Area/page]: [description].
We are working to resolve these and will update this statement as they
are fixed.

Feedback
We welcome your feedback on the accessibility of [site/app name]. Please
let us know if you encounter accessibility barriers:
- Email: [address]
- Phone: [number, if offered]
- [Other channel, if any]
We try to respond to feedback within [X business days].

Technical specifications
Accessibility of [site/app name] relies on the following technologies to
work with the particular combination of web browser and any assistive
technologies or plugins installed on your computer: [HTML, CSS,
JavaScript, etc.]. This statement was tested using [browser/AT
combinations], as of [date].

Preparation of this statement
This statement was prepared on [date] and last reviewed on [date]. It was
prepared using [self-assessment / a third-party audit].
```

## Keeping it current

A statement is a living document, not a one-time form. Update the conformance status, known limitations, and review date whenever you complete an audit, ship a major redesign, or fix (or discover) a barrier. An outdated statement that still lists a long-fixed issue — or omits a new one — undermines the credibility the statement exists to build, independent of what date is printed in the footer.

## Verifying it

Once published, run a [free automated scan](/scan/) against the statement page itself and the rest of your site — a statement claiming AA conformance next to a page that fails basic checks is worse than no statement at all. For the deeper evaluation behind the "conformance status" line, see our [WCAG audit guide](/guides/wcag-audit-guide/) for what a proper audit involves and what deliverables to expect from a vendor.
