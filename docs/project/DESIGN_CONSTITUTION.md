<!-- Источник: файл владельца accessibility_intelligence_design_constitution.zip,
     передан 2026-08-07. Хранится в репозитории дословно как направляющий документ
     продукта/дизайна (D-062). Правки — только по решению владельца. -->

# The Accessibility Intelligence Platform — Design Constitution

## 0. Purpose

This document is the product design constitution for an Accessibility Intelligence Platform focused on EAA/WCAG compliance, accessibility monitoring, expert discovery, remediation, education, and marketplace workflows.

It is not a visual moodboard.
It is not a marketing brief.
It is not a list of isolated UI preferences.

It is the operating system for product, UX, UI, content, motion, SEO, marketplace design, dashboards, tools, and future product extensions.

Every new page, interaction, component, and feature must follow the principles below.

---

# 1. Product Positioning

Do not design or communicate the product as:

- an accessibility agency
- a directory
- a generic marketplace
- a compliance consultancy
- a blog
- a collection of WCAG articles

Design and position it as:

> **The Accessibility Intelligence Platform**

The product helps companies understand, improve, monitor, and operationalize digital accessibility.

The platform should become the place a company visits when it asks:

- Is our website accessible?
- Are we at risk under EAA/WCAG-related requirements?
- What exactly is broken?
- How severe is the problem?
- How do we fix it?
- Which fixes are easy?
- Which require an expert?
- Which expert should we hire?
- How much will it cost?
- How do we prove improvement over time?
- How do we prevent regressions?

The product category is:

> **Accessibility Intelligence + Remediation + Expert Marketplace**

---

# 2. Product Philosophy

## Core belief

Accessibility should feel empowering, not bureaucratic.

Compliance should feel like improving the product, not merely avoiding punishment.

The experience must never feel like:

- filling in a legal form
- buying insurance
- dealing with a consultancy
- reading government documentation
- being scared into purchasing

The experience should feel like:

- using Linear
- deploying with Vercel
- reading Stripe Docs
- inspecting a project in Raycast
- managing a workflow in Notion
- using a precise engineering tool

## Product promise

The user should move through this emotional sequence:

1. **Uncertainty** — “I don’t know if we have a problem.”
2. **Clarity** — “Now I understand what is wrong.”
3. **Confidence** — “I know what to fix first.”
4. **Progress** — “I can see improvement.”
5. **Control** — “Accessibility is now an operational process.”

---

# 3. Design North Star

The product should feel inspired by:

- Linear — precision, speed, restraint
- Stripe — trust, hierarchy, docs-quality clarity
- Vercel — progress states, engineering feel, system feedback
- Raycast — sharp interaction patterns, compact utility
- Apple — calm confidence, disciplined visual hierarchy
- Notion — information density without chaos

Do not copy visual styling directly.

Extract the principles:

- clarity over decoration
- product-first, not marketing-first
- strong hierarchy
- minimal cognitive friction
- generous but controlled whitespace
- meaningful motion
- instant feedback
- confidence through restraint
- data presented beautifully
- interaction that feels engineered

---

# 4. Brand Personality

If the product were a person, it would be:

- a senior engineer
- a product-minded accessibility expert
- calm
- precise
- helpful
- non-alarmist
- trustworthy
- direct
- deeply competent

It is not:

- a salesperson
- a lawyer
- a compliance fear-monger
- a loud startup founder
- a “growth hacker”
- a corporate consultant

The product never shouts.

The product explains.

---

# 5. Core UX Principles

## 5.1 Never show a problem without a next action

Every issue must answer:

- What is wrong?
- Why does it matter?
- Who is affected?
- How severe is it?
- How do I fix it?
- Can I fix it myself?
- Is there an expert who can help?

Bad:

> “Missing form label.”

Good:

> “This field has no accessible label, so screen-reader users may not understand what information is required.”

Then immediately show:

- example
- fix
- code
- effort estimate
- severity
- “Ask an expert”

## 5.2 Every screen should communicate progress

The product should always answer:

> “Where am I now, and what improves next?”

Examples:

- score change
- issues resolved
- unresolved critical issues
- latest scan
- compliance status
- upcoming retest
- expert response status
- remediation timeline

## 5.3 Search is a primary interface

Search is not a secondary utility.

Search should be central across:

- experts
- WCAG knowledge
- components
- issues
- reports
- website scans
- organizations

Search should support:

- autocomplete
- typo tolerance
- recent searches
- suggested queries
- saved searches
- contextual filtering
- filter persistence

## 5.4 Progressive disclosure

Show only what is needed now.

Reveal complexity gradually.

Do not show 25 filters by default.
Do not show full WCAG legal language unless requested.
Do not show expert analytics before trust is established.

Primary layers:

1. summary
2. action
3. details
4. technical evidence
5. legal / standards context

## 5.5 Trust before persuasion

Never rely on decorative claims like:

- “best-in-class”
- “industry-leading”
- “trusted by everyone”
- “world-class”

Show trust through evidence:

- verified expert
- response rate
- project history
- scan methodology
- last updated
- source
- measurable outcomes
- independent references
- visible scoring logic

---

# 6. Information Architecture

Primary navigation:

- Scanner
- Issues
- Experts
- Knowledge
- Components
- Reports
- Pricing

Secondary user areas:

- Projects
- History
- Compliance
- Saved
- Settings

Avoid generic navigation labels such as:

- Solutions
- Resources
- Company
- Services
- About
- Learn

Only use these if a real information need exists.

---

# 7. Homepage Philosophy

The homepage should not feel like a landing page.

It should feel like entering a live product.

The primary hero should be functional.

## Hero concept

Large central URL input:

> **Check your website accessibility**

Input:
`https://example.com`

CTA:
`Scan website`

Supporting microcopy:

> Free instant scan. No signup required.

Optional secondary indicators:

- sites scanned today
- latest public benchmark
- recent accessibility score movement

Do not lead with a 3-line corporate mission statement.

The product should explain itself through interaction.

---

# 8. Homepage Structure

Recommended order:

1. Functional scanner hero
2. Live product proof
3. Accessibility Score concept
4. Recent public benchmark examples
5. Common issue categories
6. How the platform works
7. Expert marketplace entry point
8. Accessible components
9. Reports / research
10. Trust + methodology
11. Final scanner CTA

Avoid long testimonial carousels.

Avoid fake logos.

Avoid excessive marketing sections.

---

# 9. Accessibility Score

Accessibility Score should be a core product primitive.

The score must not be positioned as a legal certification.

It should be an operational indicator.

The score may include:

- critical issue count
- serious issue count
- moderate issue count
- automated checks
- manual verification status
- page coverage
- historical trend
- confidence level

Always explain score limitations.

Example:

> Accessibility Score: 82/100  
> Based on automated checks across 32 pages. Manual validation not yet included.

The score should be visually memorable and easy to compare.

---

# 10. Scanner UX

The scanner should be the most polished experience in the product.

## Start state

Minimal:

- URL input
- scan button
- optional advanced settings

Advanced settings remain collapsed.

## Scan in progress

Do not use a generic spinner.

Use a deploy-like activity stream.

Example:

- Connecting to site
- Discovering pages
- Checking semantic structure
- Testing forms
- Testing keyboard navigation
- Evaluating contrast
- Inspecting ARIA usage
- Aggregating results

Show:

- progress
- elapsed time
- page count
- current phase

The experience should feel like a real system working.

## Scan results

Primary view:

- overall score
- critical issues
- trend
- affected pages
- estimated remediation effort

Then group issues by:

- severity
- category
- page
- component
- WCAG criterion

Each issue has:

- human-readable explanation
- technical detail
- affected users
- code example
- fix suggestion
- evidence
- estimated effort
- “resolve”
- “ask expert”

---

# 11. Issue Design

Issues are not rows in a boring table.

Each issue is a work item.

Structure:

- title
- severity
- status
- impacted users
- impacted pages
- WCAG reference
- screenshot or DOM evidence
- code
- fix recommendation
- owner
- due date
- comment thread
- resolution status

Statuses:

- Open
- In progress
- Needs review
- Resolved
- Accepted risk
- False positive

Optional kanban view:

- Critical
- High
- Medium
- Low

---

# 12. Dashboard UX

The dashboard should feel closer to Linear than to a generic analytics SaaS.

Primary sections:

- Overview
- Issues
- Projects
- Reports
- Experts
- History
- Compliance

Overview should answer:

- current score
- change since last scan
- open critical issues
- unresolved regressions
- most affected area
- next recommended action

Do not overload the overview with vanity metrics.

---

# 13. Reports

Reports should be living documents.

Avoid defaulting to static PDF.

Primary report view should feel like:

- Notion
- Stripe Docs
- a well-designed audit artifact

Sections can include:

- executive summary
- issue severity
- affected flows
- WCAG mapping
- evidence
- remediation roadmap
- expert notes
- progress history

Support:

- share link
- permissions
- export
- comments
- version history

---

# 14. Marketplace Philosophy

The user should not start with:

> “Browse agencies”

The user should start with:

> “What problem do I have?”

Then:

1. identify issue
2. estimate effort
3. show self-fix path
4. show expert path
5. recommend relevant experts

Marketplace is contextual, not separate.

---

# 15. Expert Profiles

Expert pages should resemble professional product profiles, not agency brochures.

Show:

- verified status
- specialist categories
- location
- languages
- stack
- standards experience
- industries
- project count
- average response time
- typical budget
- customer satisfaction
- case studies
- availability
- certifications
- recent work
- platform activity

Primary emphasis:

> Probability of successful outcome

Not:

> Company marketing copy

---

# 16. Expert Search

Search UX should include filters such as:

- Country
- Language
- WCAG level
- EAA experience
- Platform
- Industry
- Budget
- Availability
- Project type
- Audit / remediation / monitoring
- Certifications
- Response time

Keep filters aligned with user mental models.

Persist filters when navigating back.

Provide:

- recommended experts
- comparison
- saved shortlist
- RFQ flow

---

# 17. Expert Comparison

Side-by-side comparison should include:

- expertise
- industries
- project count
- budget
- response rate
- average turnaround
- verification status
- language
- case study quality
- rating

Do not force users to open 10 tabs.

---

# 18. RFQ Flow

The request-for-quote flow must be short.

Recommended flow:

1. Site / project
2. Problem type
3. Scope
4. Deadline
5. Budget range
6. Optional details
7. Submit

Keep optional fields optional.

Pre-fill data from scans when possible.

Example:

> We detected 23 serious issues across 11 pages. Include this scan in your request?

One click should attach it.

---

# 19. Seller / Expert Onboarding

Expert onboarding must be optimized separately.

Principles:

- progressive profile completion
- save and continue later
- visible completion progress
- immediate preview
- import from website / LinkedIn / Clutch where allowed
- explain why each field matters
- avoid legal-document feel

Seller dashboard:

- leads
- response rate
- active proposals
- won projects
- reviews
- profile completeness
- visibility
- analytics

---

# 20. Knowledge Base

Do not build a traditional blog as the core content product.

Build a structured knowledge system.

Page types:

- WCAG criteria
- accessibility patterns
- platform-specific guides
- component guides
- country regulations
- industry guides
- issue explanations
- implementation examples

Each page should include:

- summary
- affected users
- why it matters
- bad example
- good example
- code
- testing method
- common mistakes
- related criteria
- related tools
- related experts

---

# 21. Blog Strategy

A blog is optional and secondary.

Only publish when there is something timely or research-driven.

Good blog topics:

- enforcement updates
- product research
- original benchmark studies
- expert interviews
- accessibility ecosystem changes
- major browser / standards changes

Avoid:

- generic “What is WCAG?” articles
- thin SEO posts
- AI-generated listicles
- filler news

Evergreen knowledge belongs in structured pages.

---

# 22. Components Library

Build a public accessible component library.

Examples:

- Modal
- Accordion
- Tabs
- Select
- Tooltip
- Dialog
- Table
- Form field
- Navigation
- Breadcrumbs
- Pagination
- Toast
- Combobox

Each component page includes:

- live example
- keyboard behavior
- screen reader behavior
- ARIA notes
- code
- accessibility pitfalls
- copy button

This can become a major return-traffic and backlink engine.

---

# 23. Reports and Research

Create original recurring data products.

Examples:

- Accessibility Index
- Top 100 Ecommerce Accessibility
- Banking Accessibility Report
- Healthcare Accessibility Report
- SaaS Accessibility Benchmark
- Country Accessibility Benchmark

These reports should be:

- visually polished
- citation-friendly
- embeddable
- downloadable
- updated regularly

They should generate authority, media mentions, backlinks, and expert interest.

---

# 24. Design System

The design system should feel quiet and precise.

## Core principles

- neutral base
- restrained accent usage
- strong contrast
- clear focus states
- dense but readable data surfaces
- no unnecessary gradients
- no decorative glassmorphism
- no neon cyber aesthetic
- no oversized blobs
- no gratuitous 3D

---

# 25. Typography

Typography should feel engineered and editorial.

Recommended characteristics:

- clean grotesk / neo-grotesk
- excellent small-size legibility
- clear numeral differentiation
- strong mono companion for code

Suggested families:

- Inter
- Geist
- IBM Plex Sans
- Söhne-like equivalents
- system sans where appropriate

Code:

- Geist Mono
- IBM Plex Mono
- JetBrains Mono

Typography principles:

- fewer size levels
- more hierarchy through weight and spacing
- short line lengths for explanations
- tabular numerals in metrics

---

# 26. Spacing

Whitespace is a structural tool.

Use:

- generous section spacing
- tighter component internals
- consistent vertical rhythm
- predictable grid spacing

Avoid:

- card walls
- 4+ dense columns on desktop
- sections with 20+ competing elements
- large empty whitespace that feels decorative rather than useful

---

# 27. Color

Color should communicate state before branding.

Priority:

1. semantic meaning
2. accessibility
3. hierarchy
4. brand expression

Semantic colors:

- Critical
- High
- Medium
- Low
- Success
- Info
- Neutral

Never rely on color alone.

Always pair with:

- icon
- label
- text
- shape
- pattern when needed

---

# 28. Dark Mode

Dark mode is optional.

Do not implement it merely because it looks modern.

If implemented, it must preserve:

- contrast
- semantic clarity
- focus visibility
- chart readability
- code legibility

Accessibility quality matters more than aesthetic novelty.

---

# 29. Icons

Use one consistent icon system.

Preferred:

- Lucide
- Phosphor

Icon usage should be functional.

Do not use icons as decoration.

Do not mix styles.

---

# 30. Illustration

Illustration should be rare.

If used:

- abstract system diagrams
- technical diagrams
- accessibility flow visualizations
- benchmark visuals

Avoid:

- cartoon characters
- generic SaaS illustrations
- 3D floating objects
- stock diversity illustrations

---

# 31. Card Design

Cards should have a reason to exist.

Use cards for:

- expert profiles
- issue summaries
- benchmark snapshots
- component previews
- action modules

Do not put every piece of content in a card.

Prefer open layouts when content is structurally related.

---

# 32. Tables

Tables are a major interface type.

They must support:

- sticky headers
- sorting
- filtering
- keyboard navigation
- readable density
- row actions
- saved views
- responsive fallback

Use them for:

- issues
- experts
- scans
- projects
- benchmark data

---

# 33. Charts

Charts should answer questions.

Avoid decorative analytics.

Good chart use:

- score trend
- issue trend
- severity distribution
- page coverage
- remediation progress
- benchmark percentile

Every chart should include:

- title
- context
- accessible text summary
- meaningful axis labels
- non-color-only differentiation

---

# 34. Motion

Motion must explain system state.

Allowed:

- scan progress
- loading state transitions
- issue resolution transitions
- filter changes
- expandable details
- navigation transitions
- success confirmation

Avoid:

- floating background effects
- scroll-triggered decoration
- aggressive parallax
- spinning gradients
- gratuitous microinteractions

Motion should feel fast and intentional.

---

# 35. Motion Timing

Default guidance:

- micro feedback: 120–180ms
- state transition: 180–240ms
- panel open/close: 220–300ms
- major page transition: subtle or none

Prefer ease-out for entering content.
Prefer ease-in for exiting content.

Respect reduced-motion preferences.

---

# 36. Feedback

Every action must respond immediately.

Examples:

- saved
- scan started
- filter applied
- issue assigned
- report shared
- expert request sent

Avoid blocking modals when an inline state or undo can solve the problem.

---

# 37. Empty States

Never show dead UI.

Bad:

> No projects.

Good:

> Scan your first website to create a project.

Primary CTA:
`Scan website`

Empty states should:

- explain
- teach
- move forward

---

# 38. Errors

Errors should be calm and useful.

Bad:

> Something went wrong.

Good:

> We couldn’t scan this site because the homepage blocks automated access.

Then show:

- retry
- alternative
- help
- explanation

---

# 39. Tone of Voice

Tone:

- calm
- precise
- helpful
- technical when needed
- understandable by non-experts

Avoid:

- legal fear
- hype
- “revolutionary”
- “game-changing”
- “world-class”
- “unlock”
- “supercharge”

Prefer action language.

Examples:

Use:
- Scan website
- Review issues
- Compare experts
- Resolve issue
- Share report
- Run again

Avoid:
- Get started
- Learn more
- Submit
- Explore
- Unlock

---

# 40. Accessibility of the Platform

The platform itself must be exemplary.

Requirements:

- WCAG 2.2 AA minimum
- visible focus states
- full keyboard support
- semantic HTML
- correct landmarks
- accessible forms
- error summaries
- screen reader labels
- reduced motion
- zoom support
- responsive reflow
- accessible charts
- skip links
- accessible modals
- accessible menus
- accessible tables

The platform should become a reference implementation.

---

# 41. Mobile UX

Mobile should not be a compressed desktop.

Priorities:

- scanner
- issue review
- report viewing
- expert search
- basic dashboard

Use:

- bottom sheets where appropriate
- sticky action areas
- simplified filters
- touch-friendly controls
- readable code examples with horizontal scroll

Do not force dense desktop tables into mobile.

---

# 42. Performance

Performance is part of trust.

Targets:

- fast initial load
- fast search
- instant filter response
- low layout shift
- optimized images
- code splitting
- caching
- progressive loading

Avoid animated skeletons everywhere.

Use skeletons only when they clarify structure.

---

# 43. SEO Architecture

SEO should be built around structured utility.

Primary indexable page families:

- `/wcag/[criterion]`
- `/issues/[issue]`
- `/components/[component]`
- `/platforms/[platform]/[issue]`
- `/industries/[industry]/accessibility`
- `/eaa/[country]`
- `/experts/[specialization]`
- `/experts/[country]/[specialization]`
- `/reports/[report]`

Do not mass-generate thin pages.

Every page must provide unique utility.

---

# 44. Programmatic SEO Rules

A pSEO page is allowed only if it contains meaningful unique data.

For example:

`/experts/germany/shopify-accessibility`

Must include:

- real experts
- real filters
- relevant expertise
- local context
- industry/platform context
- current availability if possible
- useful buying guidance

Do not generate template-only city pages.

---

# 45. Content Moat

The strongest content moat should be structured data, not articles.

Build datasets around:

- scans
- accessibility issues
- benchmarks
- expert performance
- component patterns
- remediation timelines
- industry comparisons

Unique data compounds over time.

---

# 46. AI Philosophy

AI is not the product.

AI is an assistant inside workflows.

Good AI uses:

- explain issue
- summarize scan
- draft remediation steps
- generate code example
- recommend expert
- classify issue
- estimate effort
- compare findings

Avoid:

- floating chatbot bubble
- AI everywhere
- vague “Ask AI” without context

AI should appear when it can reduce friction.

---

# 47. AI Interaction

When AI is used, it should always show:

- source context
- confidence
- editable output where relevant
- technical evidence
- user control

Never imply legal certainty.

Do not state:

> “Your site is legally compliant.”

Prefer:

> “This scan did not detect issues in the tested criteria. Manual review may still be required.”

---

# 48. Trust System

Trust is core to expert marketplace UX.

Potential trust layers:

- identity verification
- certification verification
- project verification
- review verification
- response rate
- completed work
- active status
- last seen
- expertise validation

Verification badges must have explicit meaning.

Do not use generic “verified” without explanation.

---

# 49. Reviews

Reviews should be structured.

Capture:

- quality
- communication
- turnaround
- technical depth
- accuracy
- budget adherence

Avoid only 5-star averages.

Show:

- number of reviews
- distribution
- recent reviews
- verified project indicator

---

# 50. Search Result Cards

Expert cards should be scannable in 2–3 seconds.

Include:

- name
- specialization
- verified status
- rating
- project count
- budget
- response time
- relevant platform/industry tags
- availability

Do not overload cards with full descriptions.

---

# 51. Comparison UX

Users should compare experts without memory load.

Support:

- up to 3 or 4 experts
- sticky comparison
- normalized metrics
- clear differences
- highlight strongest fit

Avoid visual winner badges unless based on explicit criteria.

---

# 52. Marketplace Revenue UX

Monetization must not compromise trust.

Paid placement must be labeled.

Do not rank experts purely by payment.

Use separate sections such as:

- Recommended
- Sponsored
- Recently active

Make ranking logic understandable.

---

# 53. Pricing UX

Pricing should be simple.

Potential layers:

- Free scan
- Monitoring
- Team
- Enterprise

Marketplace revenue may be separate.

Avoid huge feature matrices if not necessary.

Show the decision clearly.

---

# 54. Product Metrics

Design around meaningful metrics.

Core metrics:

- scan completion
- issue resolution rate
- repeat scans
- score improvement
- expert contact rate
- RFQ completion
- expert response rate
- expert hire rate
- report sharing
- knowledge-to-action conversion

Do not optimize only for pageviews.

---

# 55. Experimental Design

Critical flows should support A/B testing.

Priority areas:

- scanner hero
- scan results CTA
- expert recommendation layout
- RFQ steps
- expert cards
- comparison flow
- onboarding

Experiments must preserve accessibility.

---

# 56. Design Review Questions

Before shipping any new screen, ask:

1. What is the user trying to accomplish?
2. Is the primary action obvious?
3. Is the information hierarchy clear?
4. Does the screen reduce anxiety?
5. Does it show progress?
6. Does it explain the next step?
7. Does it preserve trust?
8. Is it accessible?
9. Does it work on mobile?
10. Does it feel like part of one coherent product?

---

# 57. Anti-Patterns

Do not use:

- giant generic hero statements
- gradient overload
- glassmorphism
- neon accessibility-themed green
- cartoon illustrations
- agency portfolio aesthetics
- endless cards
- fake urgency
- fear-based compliance copy
- popups before value
- chat widgets that cover content
- inaccessible carousels
- autoplay animation
- decorative motion
- confusing mega menus

---

# 58. Brand Visual Direction

The visual system should communicate:

- precision
- calm
- engineering
- trust
- intelligence
- accessibility

Not:

- legal fear
- corporate bureaucracy
- charity
- medical accessibility symbolism
- old government UX

The platform should feel like a modern software product.

---

# 59. Homepage Copy Direction

Preferred message hierarchy:

Headline:
> Know where your website stands.

Subheadline:
> Scan accessibility issues, understand risk, fix faster, and connect with verified experts.

Primary CTA:
`Scan website`

Secondary:
`Browse experts`

Alternative brand direction:
> Accessibility, operationalized.

---

# 60. Long-Term Product Vision

The long-term product should evolve through these layers:

## Stage 1
Scanner + knowledge base

## Stage 2
Issue management + reports

## Stage 3
Expert marketplace

## Stage 4
Monitoring + regression detection

## Stage 5
Team workflows + compliance operations

## Stage 6
AI-assisted remediation

## Stage 7
Accessibility Intelligence Platform

The final product should become a system of record for accessibility work.

---

# 61. Final Product Rule

Never optimize the product around “having a directory.”

Optimize around:

> Helping users understand, improve, and maintain digital accessibility.

The directory is only one capability.

The platform wins if the user stops thinking:

> “Where can I find an agency?”

and starts thinking:

> “I manage accessibility here.”

---

# 62. Claude Code Implementation Directive

When implementing this product:

- preserve the existing project architecture unless a change is clearly justified
- create reusable design tokens
- build accessible primitives first
- use semantic HTML
- create one coherent component system
- keep interaction states explicit
- avoid decorative UI
- prefer product UI over marketing UI
- use real or structured placeholder data
- make all new components keyboard accessible
- preserve responsive behavior
- test reduced motion
- maintain consistent spacing and typography
- prioritize scanner, dashboard, issues, experts, and knowledge UX

Before implementing any screen, ask internally:

> Does this feel like a precise modern product, or like a generic SaaS template?

If it feels generic, simplify and improve the hierarchy.

---

# 63. Definition of Done

A screen is not done merely because it looks polished.

It is done when:

- the primary user goal is obvious
- the next action is clear
- the information hierarchy works
- loading states exist
- empty states exist
- error states exist
- mobile works
- keyboard navigation works
- screen-reader semantics are correct
- focus states are visible
- the interaction feels fast
- the page is useful without unnecessary decoration
- trust is reinforced
- the product feels consistent with this constitution

---

# 64. Closing Principle

The best accessibility product should itself feel like proof that accessibility and exceptional design are not opposites.

They are the same discipline:

> making complex systems easier for more people to use.
