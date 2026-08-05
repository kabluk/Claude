---
{
  "slug": "wcag-audit-guide",
  "locale": "en",
  "title": "WCAG accessibility audit: process, deliverables and how to choose a vendor",
  "description": "What a professional WCAG 2.2 audit includes: process, timeline, deliverables, what drives cost, RFP questions to ask vendors, and red flags to avoid.",
  "standard": "wcag-2-2",
  "updated": "2026-08-04",
  "faq": [
    {
      "q": "How long does a WCAG audit take?",
      "a": "For a typical marketing site or medium web app with a representative sample of pages, expect several weeks from kickoff to final report, depending on scope and vendor availability. Complex web applications, native apps or large PDF sets extend the timeline. A retest of fixes afterwards is usually much faster than the initial audit."
    },
    {
      "q": "Can an automated tool replace a manual accessibility audit?",
      "a": "No. Automated scanners only detect the subset of WCAG failures that can be verified programmatically, such as missing alt attributes or some contrast issues. Criteria involving keyboard operation, focus behaviour, screen reader semantics, error handling and meaningful alternatives require human judgment and assistive-technology testing. Credible vendors use automation as support, never as the audit itself."
    },
    {
      "q": "Should I audit against WCAG 2.1 or WCAG 2.2?",
      "a": "Audit against WCAG 2.2, the current W3C Recommendation. It is backward compatible, so a 2.2 AA audit covers everything in 2.1 AA plus the newer criteria like Target Size (Minimum) and Accessible Authentication. If your legal obligation currently references 2.1, a 2.2 audit still satisfies it while future-proofing your remediation work."
    },
    {
      "q": "What is the difference between an audit and a VPAT or ACR?",
      "a": "An audit is the evaluation itself: testing your product against WCAG and documenting failures. A VPAT is a template for an Accessibility Conformance Report (ACR), a formal document, often requested in procurement, that states per criterion whether the product supports it. Vendors usually offer an ACR as an optional deliverable produced from the audit findings."
    }
  ],
  "cta": { "label": "Compare accessibility audit providers", "path": "/services/accessibility-audit/" },
  "relatedAgencies": ["deque-systems", "tpgi", "level-access", "allyant"]
}
---
An accessibility audit is the standard first step for any organisation that needs to know — and prove — where its website or app stands against [WCAG](https://www.w3.org/TR/WCAG22/), whether the driver is the European Accessibility Act, the ADA, Section 508 or procurement requirements. The market ranges from rigorous expert evaluations to automated scans dressed up as audits, and the price difference does not always reveal which is which. This guide explains what a professional WCAG 2.2 audit actually includes, what you should receive, what drives effort, and how to select a vendor.

## What a professional WCAG audit includes

### Scoping and sampling

No one tests every page of a large site. A credible audit starts with a **representative sample**: key templates (home, navigation, search, listing, detail pages), critical user journeys (registration, checkout, contact, login), distinct component types (forms, tables, modals, media players, charts), plus documents (PDFs) and any authenticated states in scope. For web apps, sampling is by screen and workflow rather than URL. The sample and the exact scope — browsers, assistive technologies, viewports, conformance target — should be written down and agreed before testing starts. W3C's own [evaluation methodology (WCAG-EM)](https://www.w3.org/TR/WCAG-EM/) formalises this approach and is what mature vendors base their process on.

### Manual testing with assistive technology

The core of the audit is expert manual evaluation of every sampled page against each applicable success criterion:

- **Keyboard-only testing** — every function operable, visible focus, no traps, sensible order
- **Screen reader testing** — typically NVDA or JAWS with Chrome/Firefox on Windows and VoiceOver on macOS/iOS, checking names, roles, states, announcements and reading order
- **Zoom and reflow** — 200% zoom and 320px-equivalent reflow, text spacing overrides
- **Visual inspection** — contrast, use of colour, focus appearance, target sizes, motion
- **Cognitive and content checks** — labels, instructions, error messages, consistent help, redundant entry

### Automated scanning — as support only

Automated tools (axe, WAVE, Lighthouse and enterprise scanners) are genuinely useful for breadth: they catch programmatically detectable failures across thousands of pages and help monitor regressions. But most WCAG success criteria require human judgment — whether alt text is *meaningful*, whether the focus order makes *sense*, whether an error message actually *helps*. In a professional audit, automation supplements manual work; it never replaces it.

### Conformance levels: A, AA, AAA

WCAG defines three levels. **Level AA** (which includes all Level A criteria) is the conformance target in essentially every law and standard that cites WCAG — the EU's EN 301 549, the US Section 508, and typical ADA settlement terms. Level AAA contains valuable but stricter criteria (e.g. enhanced contrast) that most audits report on selectively, if at all. Unless you have a specific reason, commission a **WCAG 2.2 AA** audit.

## What WCAG 2.2 added over 2.1

WCAG 2.2 became a W3C Recommendation in October 2023 and is the current version. It adds **nine success criteria** ([full list at w3.org](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)):

| Criterion | Level | In short |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | Focused element not entirely hidden by sticky headers/overlays |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA | Focused element not hidden at all |
| 2.4.13 Focus Appearance | AAA | Minimum size and contrast for focus indicators |
| 2.5.7 Dragging Movements | AA | Drag actions have a single-pointer alternative |
| 2.5.8 Target Size (Minimum) | AA | Targets at least 24×24 CSS px, with exceptions |
| 3.2.6 Consistent Help | A | Help mechanisms in a consistent place across pages |
| 3.3.7 Redundant Entry | A | Don't force users to re-enter information in the same process |
| 3.3.8 Accessible Authentication (Minimum) | AA | No cognitive function test (e.g. transcription, puzzles) to log in, with exceptions |
| 3.3.9 Accessible Authentication (Enhanced) | AAA | Stricter version without most exceptions |

WCAG 2.2 also **removed 4.1.1 Parsing** as obsolete. Because 2.2 is backward compatible, auditing against it is the safe default even where a law formally references 2.1: the EN 301 549 revision expected to be cited under EU law incorporates WCAG 2.2 AA.

## Typical process and timeline

1. **Kickoff and scoping** — access, environments, sample agreement, conformance target
2. **Testing** — manual evaluation with assistive tech, supported by automated scans
3. **Reporting** — findings written up with evidence, severity and recommendations
4. **Walkthrough** — a session where auditors present findings to your product and engineering teams and answer questions
5. **Remediation window** — your team fixes issues, ideally with auditor support available
6. **Retest / verification** — auditors re-check fixed issues and update the report or issue a conformance statement

For a typical site with an agreed sample, steps 1–4 commonly take a few weeks; large applications, several platforms or document collections take longer. Ask each vendor to commit to a timeline against your specific scope rather than quoting a generic figure.

## Deliverables to expect

- **Audit report** — per-issue findings with the WCAG criterion, location, evidence (screenshots/recordings), user impact, severity (e.g. critical/serious/moderate/minor) and remediation guidance a developer can act on
- **Issue export** — findings as tickets (CSV, Jira, GitHub) so they enter your backlog directly
- **Executive summary** — conformance overview and risk picture for non-technical stakeholders
- **Retest** — verification of fixes, included or clearly priced
- **VPAT/ACR (optional)** — an Accessibility Conformance Report on the [VPAT template](https://www.itic.org/policy/accessibility/vpat) (WCAG, Section 508 and/or EN 301 549 editions) for procurement
- **Accessibility statement input** — the factual basis for the public statement laws like the EAA and the Web Accessibility Directive expect

## Audit vs monitoring

An audit is a point-in-time expert evaluation; monitoring is continuous automated scanning that flags regressions between audits. You need both, but they are not interchangeable: monitoring only sees machine-detectable issues, while an audit gives you a defensible conformance baseline. A sensible cadence for most organisations is a full audit, remediation and retest, then automated monitoring plus periodic (e.g. annual, or per major release) re-audits.

## What affects effort and price

- **Templates vs unique pages** — ten thousand pages on five templates audit like five pages; a hundred bespoke pages do not
- **Web apps** — stateful flows, drag-and-drop, data grids, charts and custom widgets take far longer than content pages
- **Authenticated and multi-step journeys** — checkout, onboarding, account management
- **Platforms** — each native mobile app is effectively a separate audit
- **Documents** — PDF remediation-oriented review is a specialism of its own; volume matters
- **Assistive-technology matrix** — how many screen reader/browser combinations you require
- **Conformance documentation** — whether you need a VPAT/ACR and a formal retest

This is why credible vendors quote after scoping, not from a rate card — and why suspiciously cheap fixed-price "audits" usually mean an automated scan.

## RFP questions to ask vendors

- Which WCAG version and level do you test, and do you follow WCAG-EM or an equivalent documented methodology?
- What share of the work is manual expert testing vs automated scanning? Which assistive technologies and browser combinations do you use?
- Do testers with disabilities participate in evaluations?
- What certifications do your auditors hold (e.g. IAAP CPWA/WAS) and can we see an anonymised sample report?
- How do you determine the page/screen sample, and will you share it for sign-off?
- How are findings delivered — report only, or issues in our tracker with severity and remediation guidance?
- Is a retest included? What does developer support during remediation cost?
- Can you produce a VPAT/ACR (WCAG / Section 508 / EN 301 549 editions) from the audit?
- Can you also audit non-web scope — native apps, PDFs — and test against EN 301 549 clauses if we need EU coverage?

## Red flags

- **Automated-only "audits"** — a scanner report, however long, is not an audit and will miss whole categories of barriers
- **Guaranteed compliance** — no vendor can guarantee "100% compliance" or immunity from complaints and lawsuits; conformance claims are always scoped and dated
- **Overlay widgets sold as remediation** — one-line JavaScript "fixes" do not make a site conformant and are widely criticised by the accessibility community
- **No sampling rationale** — if a vendor can't explain what they'll test and why, they can't defend the result
- **No named methodology, tools or AT matrix** in the proposal
- **Report-and-run** — no walkthrough, no retest option, no support channel for your developers

A good audit is the beginning of a working relationship, not a PDF. Choose a partner whose report your engineers can execute against — and who will still be there to verify the fixes.
