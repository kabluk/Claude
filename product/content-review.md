# Content review packet

For an **immigration attorney (or DOJ-accredited representative)** and a
**native-speaker reviewer for Spanish and Russian**. Every user-facing claim
that is factual or legally adjacent is listed below with where it appears, what
it is based on, and a specific question. Please mark each **OK / FIX / REMOVE**
and add notes.

All guidance copy in the product is currently marked *DRAFT — pending human
content review*. Nothing should reach a real family until this packet is signed
off.

---

## A. Legal / factual claims

| # | Claim (as shown) | Where | Basis | Question for reviewer |
|---|---|---|---|---|
| A1 | The A-Number is a **nine-digit** number that looks like `A## ### ###` | landing hero, find-them step 1, app Locate | Common A-Numbers today are 9 digits | **Inconsistency to resolve:** the app onboarding says **"7–9 digits"**, the landing/find-them say **"nine-digit"**. Which is correct to state to families? Recommend one wording everywhere. |
| A2 | Search the official locator by **A-Number + country of birth**, or by **name + country of birth + date of birth** | find-them step 3, app | ICE Online Detainee Locator fields | Confirm the current search fields and any minimum age (locator excludes under-18). |
| A3 | Someone just detained **may not appear for 24–48 hours**; people **under 18** or held by another agency / local jail may not be listed | find-them step 6, app tasks | Known locator limitations | Confirm the timeframe and the exclusions as currently true. |
| A4 | **Do not sign anything** until a trusted lawyer has read it — signing "can give up important rights" | three-rules rule 1, app | General know-your-rights guidance | Confirm phrasing is safe and not overbroad; any exception families should know? |
| A5 | **The call may be recorded**; do not discuss the case on the phone | three-rules rule 2, app | Standard detention-facility practice | Confirm as generally true across facilities. |
| A6 | Check a lawyer's license on **your state bar's free public search**; a **federal list** names disciplined immigration practitioners; immigration court generally accepts attorneys licensed in **any** state | landing module 5, app navigator | State bar directories; EOIR discipline list | Confirm the "any state" point and name the exact federal list + URL. |
| A7 | Verify a rep on the **official DOJ list of recognized organizations & accredited representatives** (link: justice.gov/eoir/recognition-accreditation-roster-reports) | landing scam section, find-them, three-rules, app | EOIR Recognition & Accreditation program | **Confirm this is the current canonical URL** (could not auto-verify — gov sites block bots). |
| A8 | Facilities use outside vendors for phone accounts; there are **two account types** (the detained person's balance vs. a specific family number) and families confuse them | landing module 2, app task | Product spec / navigator.json | Confirm this is accurate and useful as stated. |
| A9 | Scam signs: **guaranteed result/release, "same-day release", prepaid document packages, a "notario" who is not a licensed attorney/accredited rep** | landing scam section, app | Common predatory patterns | Confirm the list is complete and correctly worded. |
| A10 | Documents attorneys commonly ask for, **organized by year**: taxes, housing, school, finance, IDs, medical | landing module 4, app Documents | navigator.json | Confirm categories are the right first ask; anything critical missing? |

## A-2. "Prepare in advance" module — financial/property claims (NEW; needs an attorney AND a tax professional)

Source: community guidance circulating among affected families; rewritten in calm,
hedged form. Every claim below must be verified before release.

| # | Claim (as shown, hedged) | Question for reviewer |
|---|---|---|
| A11 | Logging into a US bank app from abroad can trigger security blocks (AML/OFAC screening); moving 2FA from SMS to email, or keeping the US number via eSIM, can help keep access | Accurate and safe to state? Any bank-specific caveats worth adding? |
| A12 | Many banks ask a financial POA to be registered in person, in advance; a registered POA can let a trusted person handle the account | Confirm banks may refuse/limit POAs and that our "can" hedging is sufficient |
| A13 | 401(k)/IRA funds generally remain the account holder's property regardless of immigration status; Form W-8BEN can confirm nonresident status and reduce withholding; withdrawal before 59½ usually carries a 10% IRS penalty | Tax professional: confirm each part, esp. W-8BEN applicability and penalty exceptions |
| A14 | A financed/leased car left behind can be repossessed and auctioned; a remaining deficiency may be billed and can be reported as income (Form 1099-C); options: durable POA authorizing sale to a dealer, or lender-approved loan/lease transfer | Confirm 1099-C framing and that POA/transfer options are stated correctly |
| A15 | An abandoned rental can mean landlord fees, collections, and belongings moved to storage; a notarized durable financial POA naming a person with status can let them end the lease and collect belongings | State-by-state POA variation — is a blanket statement acceptable with "can"? |
| A16 | Keeping encrypted scans of SSN/ITIN, IDs, car documents and contracts in cloud storage the family can reach | Any risks we should warn about (e.g. sharing SSN scans)? |

## B. Framing / disclaimers (should stay, verify wording)

- "This is **not a law firm**, does not give legal advice, does not promise any
  outcome, does not replace an attorney." (all pages/app)
- "'Coverage' is not an assessment of the case. Only an attorney can assess it."
  (app Documents)
- Three-rules and locator guidance are labelled **general information, not legal
  advice**. — Confirm this framing is sufficient for your jurisdiction(s).

## C. Native-speaker review — Spanish & Russian

The Spanish and Russian strings were authored for this build and need a native
pass. Specific things to check:

1. **Gender assumption.** RU and ES currently default to a **male** detained
   person (RU "задержали… где **он**", "**его** номер"; ES "**detenido**",
   "llamar**le**", "**su** familiar"). Many detainees are women. Please suggest
   **gender-neutral** phrasing, or confirm the masculine default is acceptable.
2. **Register/tone.** Should stay calm, plain, non-clinical, and address a
   frightened family member respectfully (ES *usted*, which is what we used).
3. **Key terms:** ES "número A", "notario", "expediente", "representante
   acreditado"; RU "номер A", «нотариус», «дело», «аккредитованный
   представитель». Confirm these are the terms families actually use.
4. **No English fallback strings** appear in the ES/RU views (verified in build),
   but please confirm nothing reads as machine-translated.

## D. Surfaces covered

`landing/index.html`, `landing/find-them.html`, `landing/three-rules.html`,
`landing/app.html` (Today / Locate / Documents / First-call), plus the product
package `product/app/src/i18n/*` (en/es/ru). EN is complete across all; ES/RU
complete on the landing + app; the package's own `navigator.json`/`onboarding`
still carry DRAFT bodies for some modules.
