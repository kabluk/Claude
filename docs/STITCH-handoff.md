# DETNAV → Stitch: хендофф по всем экранам

Как пользоваться: 1) сначала один раз даёте Stitch блок **SYSTEM** (правила,
токены, словарь компонентов). 2) потом по одному даёте промпт экрана из раздела
**SCREENS**. Все промпты на английском — Stitch так стабильнее. Тексты в макетах —
плейсхолдеры: настоящий текст берётся из нашего `content/` на трёх языках (EN/ES/RU),
поэтому копирайт не заказываем, только структуру и вид.

Красная нить: у нас **Zero-Data** (нет аккаунтов, бэкенда, аналитики, живых данных),
строгий **CSP** (нет внешних шрифтов/иконок/картинок/карт), и правило **«карта, а не
навигатор»** (не даём юридических советов, ничего не «сертифицируем» и не «гарантируем»).

---

## SYSTEM (вставить в Stitch первым, один раз)

```
You are designing DETNAV — a mobile-first, static, trilingual (EN/ES/RU)
crisis-info site for families of people detained by U.S. immigration (ICE).
Keep ONE consistent design system across every screen I ask for next.

PALETTE (dark; use these hex only):
  page-bg #0a0c0e · surface #14171a · panel #1c2126 · bezel #2a3138
  hairline #333b42 · red #e4382b · yellow #f2c230 · green #37a05a
  blue #5b8fb0 · text #edeff1 · muted #868f98
FONTS: "Archivo" for headings/body; "JetBrains Mono" for small labels. No others.
LAYOUT: single column, mobile-first, content max-width 440px, centered.

HARD RULES (never violate):
- Zero-Data product: NO accounts, login, profile/avatars, "network/nodes",
  "status: secure", social-proof counters, or anything implying a backend.
- NO maps, NO photos, NO external images, NO icon CDNs. Icons = simple inline
  line glyphs only, monochrome.
- NO live/dynamic data: no progress %, timers, "in X minutes", fake counts.
- NO overclaiming words: never "certified", "verified", "guaranteed",
  "monitoring", "official partner". Plain, honest labels.
- Text is short and label-like (it gets translated); no long paragraphs baked in.
- Calm, respectful tone for frightened families. Not a military/ops console.

SHARED COMPONENTS (reuse these exact elements everywhere):
- Header: left = wordmark "DETNAV" (small, letter-spaced, a thin red tick before
  it); right = language switch "EN ES RU" (mono, boxed, current one highlighted).
- Sub-pages: a "← Back" text line directly under the header.
- "Listen to this page" bar: full-width panel row with a speaker glyph (content
  pages only).
- Eyebrow: mono, UPPERCASE, tiny, muted — sits above a title or section.
- H1: large bold heading. Lede: one muted intro line under H1.
- Section label (H2): mono UPPERCASE tiny muted.
- Bullet list: short dash markers, not filled dots.
- Numbered steps: small outlined circles 1..N on the left, text right.
- Fillable fields block: a bordered card; each row = a short label + a blank
  underline to write on by hand (for printed forms).
- Callout box: colored LEFT border only — red = irreversible/danger,
  yellow = trap/caution, green = safe resource, neutral = plain note. Bold
  colored title + muted body.
- Memory card: a high-contrast bordered card holding one sentence to SHOW or SAY,
  with the same sentence repeated small in the other two languages.
- Phone row: big tappable number + who it is + one muted note line.
- Key/value rows: label left (muted), value right.
- Inline link: ghost style with a trailing "→". External link: trailing "↗".
- ICE links open a WARNING GATE screen first (see its own prompt).
- "Onward" footer of a page: one big "Next step" link card, an expandable
  "Related" list, and a small "Sources" list of external ↗ links.
- Bottom of every content page: an "All pages" accordion index grouped into a
  few labeled groups; then a footer with an "updated on DATE" line + a short
  disclaimer ("we are not lawyers…").
- Optional bottom tab bar (Home / Tasks / Docs / Find) — line glyphs, current tab
  highlighted. Use only where I ask.

Deliver: self-contained HTML with inline CSS (NO CDN, NO external fonts/images),
one screen per file, mobile frame ~390–440px wide.
```

---

## SCREENS

### 1. Home — Intent Hub  ("What do you need right now?")
```
Screen: HOME / intent hub. Big H1 "What do you need right now?" with a muted
one-line sub. Then THREE priority cards, each = colored square line-icon +
mono eyebrow + bold title + one muted line + small chips of sub-actions:
  1) red — "Someone was taken" — chips: Locate person · First call
  2) neutral/white — "Document package" — "Assemble one clean PDF for a lawyer"
  3) blue — "Prepare a personal plan" — chip: Guided questions (2 min)
Below: a row of trust chips (mono): "Free" · "No sign-up" · "EN · ES · RU".
Then a short "How it works" 3-step row. Then a calm "Zero-Data" band: bold
"Nothing about you is stored", two muted lines. Then a "What we don't do" band:
3 small red-tinted cards (no legal advice / no guarantees / no data). Bottom tab
bar. NO account icon, NO network/status widgets, NO fake counters.
```

### 2. Intake Wizard — Question
```
Screen: guided-questions WIZARD, one question at a time. Top: a segmented
progress bar (one segment per section; done = filled, current = highlighted) and
a small "step X / N" mono counter. Eyebrow = section name. Big H1 = the question.
Optional muted hint line. Then a vertical stack of large tappable option buttons
(full width, left-aligned); a selected option is filled/inverted; "I'm not sure"
options are muted. A reassuring muted line under options. Bottom: "Back" (ghost)
and "Next" (solid, disabled until an option is picked). No data is sent anywhere.
```

### 3. Intake Wizard — Result (task list)
```
Screen: RESULT of the wizard. Eyebrow, H1 "N things to do", muted hint, then a
green info callout. Tasks are grouped under labels "Now / Soon / Later". Each task
= a collapsible card: bold title + one muted line; expanded it reveals sections
"Why it matters", "How (numbered steps)", "Where to get it (source links)",
"What to say" (a quotable line), "Watch out" (yellow), and related page links.
Some tasks carry a small "evidence" badge. Bottom: "Print" and "Start over"
buttons, then a footer note. Everything computed locally; nothing is stored.
```

### 4. Content Page — TEMPLATE
```
Screen: standard CONTENT PAGE template. Header + "← Back" + "Listen to this page"
bar. Then H1 + lede. Body is a vertical flow of the shared components (H2 labels,
paragraphs, dash lists, numbered steps, callouts r/y/g, memory cards, phone rows,
key/value rows, inline/external links). End with the "Onward" footer (Next step +
Related accordion + Sources) then the "All pages" accordion index + disclaimer
footer. Use THIS exact skeleton for every content page below; only the blocks
inside change.
```

Каждую из этих страниц заказывайте по шаблону #4, добавляя её блоки:

- **where — "How to find him"**: intro; a note callout; an A-Number checker tool
  (input + format hint); a name-variants helper (list of spellings, all on-device);
  phone rows (ICE locator help line); an ICE-gate external link.
- **anum — "Where to find the A-Number"**: yellow callout "it's the key"; list of
  where it appears; short how-to; a "copy A-Number" field.
- **documents — "What these papers mean"**: a red memory card (silence/no-sign line
  in 3 languages); red/yellow callouts (voluntary departure = irreversible);
  a neutral "detainer / 48h hold" callout; external org links.
- **firstcall — "The first call"**: steps; a memory card (what to say); a print
  button.
- **verify — "Check the attorney"**: three green "registry" cards (state bar
  lookups) as external ↗; a short caution callout; a list.
- **connect — "Calls, money, letters"**: opening rule callout ("he can call you;
  you can't call him"); numbered steps for Calls / Messages / Video / Money /
  Letters; external links to the phone/commissary providers.
- **visit — "Visiting"**: intro; the FACILITY FINDER tool (see #5); ID-rules list;
  onward footer.
- **attorney — "Attorney"**: "three lawful paths" framing; callouts (consulate,
  parental directive); a verify-attorney link; onward.
- **habeas — "Habeas corpus"**: explainer paragraphs + callouts + list; a dated
  "as of" note; onward sources.
- **deadlines — "Don't miss a hearing"**: strong yellow callout (missing a hearing
  is often irreversible); list; change-of-address emphasis.
- **complaints — "If something is wrong"**: a red urgent callout; numbered steps;
  a green "9233# from inside" callout; phone rows (DHS OIG); an external CRCL link;
  an honest "as of 2026" note.
- **forms — "Form dictionary"**: a yellow "an ICE warrant is administrative, not
  judicial" callout; the DOCUMENT-MAP tool (see #6); a stack of neutral callouts,
  one per form (I-862 NTA, I-200, I-205, I-286, I-220A, EOIR-33); onward sources.
- **prepare — "A plan in case of detention"**: a green "why on paper" callout;
  a print button; several FILLABLE FIELDS blocks (who to call / children / home /
  health / memorize); a "give it to a trusted person today" section with numbered
  steps; a rights memory card; a yellow "don't carry the plan" caution.
- **orgs — "For parishes, orgs, employers"**: paragraphs + list + callout; calm,
  addressed to helpers, not victims.
- **journey — "The road"**: a numbered map of ~12 steps of the process (a vertical
  timeline), each = title + one muted line + optional link; plus a couple of
  "tracks" cards; a closing note "this is a map, not your plan".
- **legal (about / data / disclaimer)**: plainest version of the template — H1 +
  lede + a few paragraphs, one list, one callout. No tools.
```
Screen: CONTENT PAGE "<name>" using the template. Blocks in order: <list above>.
```

### 5. Facility Finder (inside the "Visiting" page)
```
Component/screen: FACILITY FINDER. A labeled search input ("City, name, or state").
Before typing: a muted hint. On results: up to a few facility CARDS, each =
facility name (H3), address line, a muted meta line ("County · responsible ICE
office"), a "federal circuit: Ninth" meta line, an optional yellow caution box for
mandatory-detention circuits, and a STAT card titled "How long people are usually
held here" showing "median N days; half of people p25–p75; based on N cases,
2024–2026" plus a muted "a fact from past data, not a prediction — source
Deportation Data Project". Then a muted "visiting hours change" note and a
"Find this facility's schedule ↗" link. Below the cards: an ICE-gate link and a
provenance line. If nothing matches: a fallback card with "one call answers
everything — ask these questions" list + the ICE line. NO map, NO photo.
```

### 6. Document-Map tool (inside the "Form dictionary" page)
```
Component: DOCUMENT MAP — a schematic (NOT a real document) of a Notice to Appear
(I-862). Draw a stylized paper with labeled zones highlighted: the A-Number box
(red outline), the hearing date/time (yellow highlight, "may be blank"), the court
name/address, the charges block, and a callout "signed by an ICE officer — not a
judge". Add a muted caption "this is a schematic, not your document — check your
own paper". Line-art only, our palette.
```

### 7. Facility Page (e.g. Adelanto)
```
Screen: single FACILITY page. H1 = short facility name; lede = full name · state.
Key/value rows (address, phone (tappable), tablet provider, state, federal circuit;
visiting hours if known). A yellow note callout (address caveat). The STAT card
"How long people are usually held here" (median / range / N / honest caveat). A
"Mail & letters" section (list of rules). A link to the state page. Footer.
No map, no photo.
```

### 8. State Page (e.g. California)
```
Screen: STATE page. H1 = state name; lede; a "federal circuit: Ninth" line. Then
sections: "Immigration courts" (name + address rows), "Detention facilities in
this state" (tappable list linking to facility pages), "Free / low-cost help"
(external ↗ links), a note on whether the state funds representation, and a
"verify before you trust an address" caution. Footer.
```

### 9. Tool Page — Document Package (DocPack)
```
Screen: DOCUMENT PACKAGE builder. Intro + a green "nothing leaves this phone"
callout. A set of labeled SECTIONS (Home, Years, Family, Work, Court dates, Court
papers, Medical, Other); each section has a "+ Photo" button and thumbnails with
an editable label + remove. An optional A-Number field (for the filename only).
A big "Build PDF packet" button. After building: a "packet ready" card with
Share / Download / Print and a "delete all photos from this phone" button, plus a
muted note that we never see the files. All on-device; no upload.
```

### 10. ICE Warning Gate (interstitial)
```
Screen: small centered WARNING GATE shown before opening any ICE.gov link. A
short bold title "You are leaving to an ICE site", two muted lines (it logs each
visitor's IP; we send them nothing about you), then two buttons: "Open" (solid)
and "Ask someone else to do it" (ghost) with a hint to forward the address.
Calm, not alarming.
```

### 11. Optional — Bottom Tab Bar (global)
```
Component: bottom TAB BAR, 4 items with line glyphs + labels: Home, Tasks
(the wizard/list), Docs (document package + forms), Find (facility finder).
Current tab highlighted. Fixed at the bottom, our surface color, hairline top border.
```
