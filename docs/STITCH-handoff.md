# DETNAV → Stitch: хендофф по всем экранам

Как пользоваться: 1) один раз даёте Stitch блок **SYSTEM**. 2) затем по одному
копируете любой промпт из **SCREENS** — каждый уже готов, ничего дописывать не надо.
Все промпты на английском (Stitch так стабильнее). Тексты в макетах — плейсхолдеры:
настоящий текст берётся из нашего `content/` на трёх языках (EN/ES/RU).

Красная нить: **Zero-Data** (нет аккаунтов, бэкенда, аналитики, живых данных),
строгий **CSP** (нет внешних шрифтов/иконок/картинок/карт), правило **«карта, а не
навигатор»** (не советуем, ничего не «сертифицируем» и не «гарантируем»).

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
- ICE links open a WARNING GATE screen first.
- "Onward" footer of a page: one big "Next step" link card, an expandable
  "Related" list, and a small "Sources" list of external ↗ links.
- Bottom of every content page: an "All pages" accordion index grouped into a
  few labeled groups; then a footer with an "updated on DATE" line + a short
  disclaimer ("we are not lawyers…").
- Optional bottom tab bar (Home / Tasks / Docs / Find) — line glyphs, current tab
  highlighted. Use only where I ask.

The CONTENT TEMPLATE (used by most screens) = header + "← Back" + "Listen to this
page" bar + H1 + lede + [the page's blocks] + Onward footer + "All pages" accordion
+ disclaimer footer. When a prompt says "content template", build exactly this shell
and drop the listed blocks into the body.

Deliver: self-contained HTML with inline CSS (NO CDN, NO external fonts/images),
one screen per file, mobile frame ~390–440px wide.
```

---

## SCREENS — каждый промпт готов к вставке

### Home — Intent Hub
```
Screen: HOME / intent hub. Big H1 "What do you need right now?" + a muted one-line
sub. THREE priority cards, each = colored square line-icon + mono eyebrow + bold
title + one muted line + small sub-action chips:
  1) red — "Someone was taken" — chips: Locate person · First call
  2) white/neutral — "Document package" — "Assemble one clean PDF for a lawyer"
  3) blue — "Prepare a personal plan" — chip: Guided questions (2 min)
Then a row of mono trust chips: "Free" · "No sign-up" · "EN · ES · RU". Then a short
"How it works" 3-step row. Then a calm ZERO-DATA band: bold "Nothing about you is
stored" + two muted lines. Then a "What we don't do" band: 3 small red-tinted cards
(no legal advice / no guarantees / no data). Bottom tab bar. NO account icon, NO
network/status widgets, NO fake counters.
```

### Wizard — Question
```
Screen: guided-questions WIZARD, one question at a time. Top: a segmented progress
bar (one segment per section; done = filled, current = highlighted) + a small
"step X / N" mono counter. Eyebrow = section name. Big H1 = the question. Optional
muted hint line. Then a vertical stack of large full-width tappable option buttons,
left-aligned; the selected one is filled/inverted; "I'm not sure" options are muted.
A reassuring muted line under options. Bottom: "Back" (ghost) and "Next" (solid,
disabled until picked). Nothing is sent anywhere.
```

### Wizard — Result (task list)
```
Screen: RESULT of the wizard. Eyebrow, H1 "N things to do", muted hint, a green info
callout. Tasks grouped under "Now / Soon / Later". Each task = a collapsible card:
bold title + one muted line; expanded reveals "Why it matters", "How" (numbered
steps), "Where to get it" (source links), "What to say" (a quotable line), "Watch
out" (yellow), and related page links. Some tasks show a small "evidence" badge.
Bottom: "Print" and "Start over" buttons + a footer note. Computed locally; nothing
stored.
```

### Page: How to find him  (content template)
```
Screen: CONTENT PAGE "How to find him", content template. Blocks in order:
1) H2 "What you need" + a short dash list;
2) an A-NUMBER checker tool: an input + a "format: A + 9 digits" hint + a copy action;
3) yellow CALLOUT "The name must match letter for letter";
4) a NAME-VARIANTS helper: an input plus a checkable list of spelling variants, with
   a note "stays on this device";
5) an external ↗ link to the ICE online locator (opens the warning gate);
6) yellow CALLOUT "Empty does not mean he is not there";
7) H2 "What the result means" + list;
8) H2 "When the system will not show him" + list;
9) red CALLOUT "People are moved between states";
10) H2 "If the search finds nothing" + list;
11) phone rows (ICE help line + who/what note).
```

### Page: Where to find the A-Number  (content template)
```
Screen: CONTENT PAGE "Where to find the A-Number", content template. Blocks:
1) green CALLOUT "Format" (what an A-Number looks like: letter A + 9 digits);
2) H2 "Where to look at home" + list (letters, wristband, prior papers);
3) yellow CALLOUT "Found a letter? Photograph it now";
4) H2 "If there is nothing at home" + a short paragraph;
5) an inline → link to "How to find him".
```

### Page: What these papers mean  (content template)
```
Screen: CONTENT PAGE "What these papers mean", content template. Blocks:
1) a red MEMORY CARD: one sentence to show/say (right to remain silent, won't sign
   without a lawyer), repeated small in the other two languages;
2) red CALLOUT "Voluntary departure" (irreversible);
3) red CALLOUT "Stipulated removal" (irreversible);
4) yellow CALLOUT "'Sign and you will get out faster'" (a trap);
5) neutral CALLOUT "A detainer / 48-hour hold — if the person is still in a local jail";
6) three external ↗ links to advocacy organizations;
7) an inline → link to the form dictionary.
```

### Page: The first call  (content template)
```
Screen: CONTENT PAGE "The first call", content template. Blocks:
1) red CALLOUT "The call is recorded";
2) H2 "Before the call" + yellow CALLOUT "Turn off blocking of unknown numbers";
3) H2 "What to ask — you can read this aloud" + list + yellow CALLOUT "What this
   line should not touch";
4) H2 "The card to learn by heart and carry on paper" + a MEMORY CARD + a list;
5) a PRINT button;
6) H2 "Before you call" + a paragraph + an inline → link.
```

### Page: Check the attorney  (content template)
```
Screen: CONTENT PAGE "Check the attorney", content template. Blocks:
1) three neutral CALLOUTS as numbered registries: "1 · State bar association",
   "2 · DOJ accredited representatives", "3 · EOIR disciplinary list";
2) two external ↗ links to those registries (gov links open the warning gate);
3) H2 "Notario" + red CALLOUT "Notario público ≠ lawyer";
4) H2 "Red flags" + list + yellow CALLOUT "'Out today with a petition already prepared'".
```

### Page: Calls, money, letters  (content template)
```
Screen: CONTENT PAGE "Staying in touch: calls, money, letters", content template.
Blocks:
1) an opening rule CALLOUT/line "He can call you. You cannot call him.";
2) H2 "Where to start" + NUMBERED STEPS;
3) H2 "1 · Calls" + paragraph + NUMBERED STEPS "How to turn on calls" + an external
   ↗ provider link + green CALLOUT "9233# — free and not monitored" + inline → link;
4) H2 "2 · Messages (text)" + paragraph + NUMBERED STEPS "How to send" + paragraph;
5) H2 "3 · Video calls" + paragraphs + inline → link;
6) H2 "4 · Money for daily needs (inside)" + paragraph + NUMBERED STEPS "How to
   deposit" + neutral CALLOUT "If there is no one to help" + paragraph;
7) H2 "5 · Letters and postcards" + list + paragraph.
```

### Page: Visiting  (content template)
```
Screen: CONTENT PAGE "Visiting", content template. Blocks:
1) the FACILITY FINDER tool (search field → facility cards; described in its own
   prompt below);
2) H2 "Rules that hold almost everywhere" + list + yellow CALLOUT "Dress stricter
   than the rules say";
3) red CALLOUT "If you have no status yourself";
4) H2 "If you cannot make the trip" + list + an inline → link + a paragraph;
5) the Onward footer.
```

### Page: Attorney  (content template)
```
Screen: CONTENT PAGE "Attorney", content template. Blocks:
1) red CALLOUT "There is no court-appointed attorney";
2) H2 "Path 1 · Free" + list + two external ↗ links + paragraph;
3) H2 "Path 2 · Accredited representative" + green CALLOUT "Not an attorney, but
   represents legally";
4) H2 "Path 3 · Paid" + list + inline → link (check the attorney) + neutral CALLOUT
   "If the detained person has children";
5) H2 "You can search by language" + green CALLOUT "The practice is federal";
6) the Onward footer.
```

### Page: Habeas corpus  (content template)
```
Screen: CONTENT PAGE "Habeas corpus · federal court", content template. Blocks:
1) neutral CALLOUT "What it is";
2) H2 "Why everyone is talking about it now" + paragraphs;
3) H2 "How it works" + list;
4) H2 "Your part — preparation" + list + two inline → links;
5) H2 "Questions for the attorney" + list;
6) red CALLOUT "What we do not do" (no legal advice);
7) the Onward footer.
```

### Page: Don't miss a hearing  (content template)
```
Screen: CONTENT PAGE "Do not miss a hearing", content template. Blocks:
1) red CALLOUT "Absent — the case is decided without him";
2) H2 "What to do" + list + two external ↗ links;
3) yellow CALLOUT "The court's change of address is separate from everything else".
```

### Page: If something is wrong  (content template)
```
Screen: CONTENT PAGE "If something is wrong in detention", content template. Blocks:
1) red urgent CALLOUT "A threat to life or urgent medical need";
2) H2 "What to do, step by step" + NUMBERED STEPS + green CALLOUT "9233# — a free
   line from inside";
3) H2 "Official channels" + phone rows (DHS OIG) + external ↗ link (civil-rights
   complaint) + yellow CALLOUT "Honestly about oversight in 2026";
4) two inline → links.
```

### Page: Form dictionary  (content template)
```
Screen: CONTENT PAGE "Forms and notices: what they are", content template. Blocks:
1) yellow CALLOUT "An ICE warrant is usually administrative, not judicial";
2) the DOCUMENT-MAP tool (schematic of a Notice to Appear; its own prompt below);
3) H2 "Common papers" + SIX neutral CALLOUTS, one per form: "I-862 · Notice to
   Appear (NTA)", "I-200 · Warrant for Arrest", "I-205 · Warrant of Removal",
   "I-286 · Notice of Custody Determination", "I-220A · Order of Release on
   Recognizance", "EOIR-33 · Change of Address";
4) the Onward footer (sources = official court forms) + two inline → links.
```

### Page: A plan in case of detention  (content template)
```
Screen: CONTENT PAGE "A plan in case of detention", content template. Blocks:
1) green CALLOUT "Why on paper, not in an app";
2) a PRINT button;
3) FIVE FILLABLE FIELDS blocks (each = label + blank underline): "Who to call
   first", "Children", "Home and daily life", "Health", "What to know by heart";
4) H2 "Give the plan to a trusted person — today" + two short paragraphs +
   NUMBERED STEPS "What the trusted person does if you go silent";
5) H2 "What to carry with you" + a paragraph + a carry-along rights MEMORY CARD;
6) yellow CALLOUT "Do not carry the plan with names and phones on you";
7) three inline → links (document package, papers, the wizard).
```

### Page: For parishes, orgs, employers  (content template)
```
Screen: CONTENT PAGE "For parishes, organizations, employers", content template.
Calm, addressed to helpers (not victims). Blocks:
1) H2 "What your people get — free" + list;
2) H2 "What we offer organizations" + list + green CALLOUT "Why this is set up
   honestly";
3) H2 "Talk to us" + two paragraphs.
```

### Page: The road (journey)
```
Screen: CONTENT PAGE "The road", content template, but the body is a VERTICAL
TIMELINE of ~12 numbered steps of the process after the person is found; each step =
small number node on a left rail + bold title + one muted line + optional inline →
link. Below the timeline: two "tracks" cards, and a closing muted note "This is a
map of the process, not your plan." Then the Onward footer.
```

### Pages: About / Your data / Disclaimer (repeat for each)
```
Screen: CONTENT PAGE "<About | Your data | Disclaimer>", content template, plainest
form: H1 + lede + a few short paragraphs + one dash list + one neutral CALLOUT. No
tools. Build one screen per title.
```

### Tool: Facility Finder (used inside "Visiting")
```
Component/screen: FACILITY FINDER. A labeled search input ("City, name, or state").
Before typing: a muted hint. On results: a few facility CARDS, each = facility name
(H3) + address line + a muted meta line ("County · responsible ICE office") + a
"federal circuit: Ninth" meta line + an optional yellow caution box for
mandatory-detention circuits + a STAT card titled "How long people are usually held
here" showing "median N days; half of people p25–p75; based on N cases, 2024–2026"
and a muted caveat "a fact from past data, not a prediction — source Deportation
Data Project". Then a muted "visiting hours change" note + a "Find this facility's
schedule ↗" link. Below cards: an ICE-gate link + a provenance line. If nothing
matches: a fallback card "one call answers everything — ask these questions" list +
the ICE line. NO map, NO photo.
```

### Tool: Document Map (used inside "Form dictionary")
```
Component: DOCUMENT MAP — a schematic (NOT a real document) of a Notice to Appear
(I-862). A stylized paper with labeled highlighted zones: the A-Number box (red
outline), the hearing date/time (yellow highlight, "may be blank"), the court
name/address, the charges block, and a callout "signed by an ICE officer — not a
judge". Muted caption "this is a schematic, not your document — check your own
paper". Line-art only, our palette.
```

### Page: Facility (e.g. Adelanto)
```
Screen: single FACILITY page (content template shell, no Listen bar needed). H1 =
short facility name; lede = full name · state. Key/value rows (address, phone
(tappable), tablet provider, state, federal circuit; visiting hours if known). A
yellow note CALLOUT (address caveat). The STAT card "How long people are usually
held here" (median / range / N / honest caveat). H2 "Mail & letters" + a rules list.
A "← this state" link. Footer. No map, no photo.
```

### Page: State (e.g. California)
```
Screen: STATE page (content template shell). H1 = state name; lede; a "federal
circuit: Ninth" line. Sections: H2 "Immigration courts" (name + address rows), H2
"Detention facilities in this state" (tappable list linking to facility pages), H2
"Free / low-cost help" (external ↗ links), a note on whether the state funds
representation, and a yellow "verify before you trust an address" caution. Footer.
```

### Tool page: Document Package (DocPack)
```
Screen: DOCUMENT PACKAGE builder (content template shell). Intro + green CALLOUT
"nothing leaves this phone". Labeled SECTIONS (Home, Years, Family, Work, Court
dates, Court papers, Medical, Other); each section has a "+ Photo" button and
thumbnails with an editable label + remove. An optional A-Number field (for the
filename only). A big "Build PDF packet" button. After building: a "packet ready"
card with Share / Download / Print + a "delete all photos from this phone" button +
a muted note that we never see the files. All on-device; no upload.
```

### ICE Warning Gate (interstitial)
```
Screen: small centered WARNING GATE shown before opening any ICE.gov link. Bold
title "You are leaving to an ICE site", two muted lines (it logs each visitor's IP;
we send them nothing about you), two buttons: "Open" (solid) and "Ask someone else
to do it" (ghost) with a hint to forward the address. Calm, not alarming.
```

### Bottom Tab Bar (global component)
```
Component: bottom TAB BAR, 4 items with line glyphs + labels: Home, Tasks (the
wizard/list), Docs (document package + forms), Find (facility finder). Current tab
highlighted. Fixed at the bottom, surface color, hairline top border.
```
