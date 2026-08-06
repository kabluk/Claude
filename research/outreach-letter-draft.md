# A2-OUTREACH: claim-your-profile letter — DRAFT, not sent

Single email per agency, sent once. Subject line and body use plain
placeholders filled from `research/outreach-99.json` at send time
(A2-OUTREACH-SEND, not this node). That file now also carries
`declarant`, which selects one of two phrasings — see Segmentation below.

## Subject

`{{agencyName}} is listed on AccessAtlas — please check your profile`

## Body

```
Hi {{agencyName}} team,

I'm reaching out because you're listed on AccessAtlas
(https://{{domain}}/agencies/{{slug}}/), a directory of digital
accessibility audit agencies for WCAG/EAA/ADA/BFSG/RGAA compliance work.

You're listed because {{agencyName}} is named as the accessibility
auditor in {{declarationPhrase}} we found:
{{evidenceUrl}}

Your listing is free and already live. I'd like to ask two things:

1. Please check the profile and let me know if anything is wrong or
   missing — services offered, standards you work to, headquarters,
   pricing band. We only publish what we can verify from public
   sources, so corrections from you are the most reliable fix.

2. If you'd like to claim the listing (control what's shown, add a
   longer description, get priority placement), just reply to this
   email — no cost to claim or correct your basic listing.

No obligation either way — if you'd rather not be listed at all, reply
and I'll remove it.

Best,
{{senderName}}
{{senderTitle}}, AccessAtlas
{{contactEmail}}
```

## Segmentation (D-043)

`{{declarationPhrase}}` is the ONLY text that differs between the two
segments. It is filled from `declarant` in `research/outreach-99.json`,
which is derived from `agencies.json` — not hand-maintained here, so it
cannot drift from the badge.

| `declarant` | count | `{{declarationPhrase}}` |
|---|---|---|
| `public-body` | 83 | `the accessibility declaration of a public authority` |
| `private` | 13 | `a company's published accessibility declaration` |

Why segment at all — the two groups are in different situations, and the
old single wording ("a public accessibility declaration") was ambiguous
for both. It reads either as "publicly available" (true of both) or "made
by a public body" (true of only 83), so the 13 private-sector records were
being described slightly wrong.

- **Public-body auditors (83).** Their visible track record is public-sector
  work — procurement frameworks, BITV-Test, government portals. The EAA
  moved the demand to *private* companies (e-commerce, banking, transport
  booking), which is a market most of them are not yet found in. For them
  AccessAtlas is reach into a segment they can already serve.
- **Private-sector auditors (13).** Already working with commercial clients,
  so the offer is not a new market but visibility next to comparable peers,
  with the same evidence-based verification standard applied to everyone.

Deliberately NOT segmented: the ask, the opt-out, the absence of any paid
pitch. Splitting those would turn one honest letter into two sales tracks,
which is exactly the posture the design notes below reject.

Not implemented as sending logic anywhere — `A2-OUTREACH-SEND` stays
blocked on domain + Imprint + Resend approval (see BACKLOG). This node
only makes the data and copy ready.

## Design notes (why it's written this way)

- Leads with the *evidence* (their own declaration), not a generic pitch —
  this is the one differentiator: we didn't scrape a random list, we found
  them where they publicly said they did this work.
- Correction ask comes before the claim/upsell ask — matches the project's
  "editorial verification first" posture (sourceRefs/lastVerified on every
  profile), not a sales-first framing.
- Featured/paid placement is NOT mentioned in the first email — deepdive.md
  §5 outreach model leads with claim, monetizes as a later, separate step
  once the relationship exists. Pitching €59/mo featured in the cold-open
  email would undercut the "we're not just another lead-gen scraper" trust
  signal this whole email depends on.
- Explicit, easy opt-out (remove listing) in the first email, not buried —
  matches R2's Abmahnung-risk posture: commercial email to EU businesses
  needs a clean, unambiguous unsubscribe/objection path, not just legally
  required but also the honest thing to do given most of this list is B2B
  professionals who didn't ask to be contacted.
