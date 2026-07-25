# Detention Navigator — Design System

This is the complete visual specification for the product. The goal of this
handoff: **keep your working app logic, replace its look with this system.**
The canonical, pixel-accurate reference implementation is
[`../landing/app.html`](../landing/app.html) (and the landing pages
`../landing/index.html`, `find-them.html`, `three-rules.html`). When any wording
here is ambiguous, open those files and match them.

Tokens live in [`tokens.css`](tokens.css) and [`tailwind.theme.cjs`](tailwind.theme.cjs).

---

## 1. Principles & hard rules

The audience is a frightened family member — often older, on a cheap phone, in
daylight, with limited English — in the first hours after a relative is
detained. The design must **lower the heart rate, not raise it**, and read as a
serious public resource, never as a service selling hope.

**Non-negotiable rules (do not break any of these):**

- **No red, ever.** Alarm colours raise panic. Warnings use burnt amber
  (`caution #8A4B12`).
- **No dark mode as default.** Light `paper` background. Navy is used for
  structure blocks (header accents, footer, one trust card, doors), not as a
  full-screen theme.
- **Body text ≥ 17px.** 18px default. Labels/eyebrows/tags may be smaller;
  reading sentences may not.
- **Never icon-only.** Every icon has a word beside it.
- **No outcome promises, no urgency, no countdowns.** Plain verbs, sentence
  case. Never the word "easy."
- **Mono carries the "paperwork" texture** — A-Numbers, phone numbers, form
  labels, the folder tab. This is where the honesty of the design lives.
- **Accent is rare.** Brass is for wayfinding (chevrons, the folder tab, focus,
  links), not for filling large areas.

**Replace the old palette.** Earlier prototypes (`product/design-proto`) used
cream + terracotta + blue + sage. **Drop that.** Terracotta reads as alarm-red-
adjacent and is banned. Use only the tokens in this package.

---

## 2. Colour

| Token | Hex | Use |
|---|---|---|
| `navy` | `#17264A` | Headings, body text, primary buttons, doors, footer, folder lines |
| `navy-700` | `#22345F` | Hover on navy |
| `brass` | `#B0842F` | The accent: chevrons, folder tab, focus ring, links on light |
| `brass-600` | `#946C22` | Accent **text** on paper (contrast-safe for labels) |
| `gold-on-navy` | `#E7C77A` | Brass lightened for text/links on navy |
| `paper` | `#F3EFE6` | Page background (warm, but NOT cream `#F4F1EA`, NOT white) |
| `card` | `#FCFAF4` | Cards, folder front |
| `caution` | `#8A4B12` | Scam flags, warnings (burnt amber — never red) |
| `sage` | `#3F6B4E` | Progress bars and "done" states only |
| `slate` | `#5E5A4E` | Secondary/label text. **Never** body copy (avoids grey-on-grey) |
| `line` / `line-strong` | `#DED6C6` / `#CABDA6` | Hairlines, borders, input outlines |

Body text is `navy` on `paper` (~11:1). Brass as text is only for labels/links,
never long copy.

---

## 3. Typography

Three families, all carrying **Latin + Cyrillic** (EN/ES/RU all render):

| Family | Role | Weights |
|---|---|---|
| **Spectral** (serif) | Display & headings — used with restraint | 400, 600 |
| **Commissioner** (humanist sans) | Body, UI, component titles | 400, 500, 600, 700 |
| **IBM Plex Mono** | Labels, eyebrows, numbers, A-Number, folder tab | 400, 500 |

**Self-host them.** Use [`../landing/fonts.css`](../landing/fonts.css) — the
Latin+Cyrillic subsets are already base64-embedded there (one file, offline, no
external requests). Copy it in and `@import`/link it, or point `@font-face` at
your own copies. `font-display: swap` with the fallback stacks in `tokens.css`.

**Scale** (px; body never < 17):

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Hero H1 | serif | 25–34 | 600 | responsive; folder-front headline |
| Section H2 | serif | 20–29 | 600 | |
| Card / task title | **sans** | 17.5–19 | 600 | titles inside components are sans, not serif |
| Body | sans | 18 (17.5 <400px) | 400 | line-height 1.55 |
| Hint / secondary | sans | 15–16.5 | 400 | `slate` |
| Kicker / eyebrow | mono | 12.5–13 | 500 | UPPERCASE, letter-spacing .13–.14em, `brass-600` |
| Tag / badge | mono | 11.5 | 500 | UPPERCASE, letter-spacing .10em |
| Numbers (A-Number, phone) | mono | 15–17 | 400–500 | in a `#fff` pill with `line` border |

---

## 4. Space, radius, shadow, motion

- **Spacing**: 4px base. Component padding 14–20px. Section vertical rhythm
  26–56px. Reading column max-width **620px (app) / 760px (landing)**, centred.
- **Radius**: cards `14`, buttons/inputs `12`, pills `999`. The folder front has
  a **signature cut corner**: `2px` top-left, `14px` the other three.
- **Shadow**: card `0 14px 30px -22px rgba(23,38,74,.5)`; navy trust card
  `0 20px 40px -30px rgba(23,38,74,.9)`. Keep shadows soft and low — no hard drop
  shadows.
- **Motion**: `.15s` on hovers/state. Entrance = opacity 0→1 + translateY(6–14px)
  over .5–.6s, **gated behind a `.js` class and disabled under
  `prefers-reduced-motion`**, with a failsafe that reveals all content after
  ~1.6s so nothing can stay hidden if JS is slow. No parallax, no auto-playing
  anything.

---

## 5. Signature element — "The Folder"

The one motif that carries the brand: a **manila case folder** drawn in pure CSS
(no images). The crisis genuinely *is* a folder of paperwork you didn't ask for.

- A small **tab** protrudes at top-left: `navy` fill, `mono` uppercase label
  (e.g. `CASE FILE`, `DELO`, `EXPEDIENTE`), a `brass` dot, a 3px `brass`
  bottom border, radius `12px 12px 0 0`, nudged `left:8px`.
- The **front** sits under it: `card` background, `1px line` border, a `2px navy`
  top border, the cut-corner radius, and the soft card shadow. Optional very
  faint horizontal "form ruling" via a repeating-linear-gradient at ~3.5% navy,
  masked to fade out.
- Used for the hero on the landing and as the framing device on tool pages.

See `.folder` / `.folder-tab` / `.folder-front` in `app.html`/`index.html`.

---

## 6. Components

Exact CSS is in the reference files; this is the spec to reproduce them.

**Header** — `paper` bg, `1px line` bottom border, sticky on the app. Left: brand
`Detention Navigator` (serif 600; "Navigator" in `brass`). Right: language switch.

**Language switch** — three equal pills `EN / ES / RU` (English default, but all
equal weight — Spanish is the largest audience, never an afterthought). Mono 14px,
`1.5px line-strong` border, radius 9px, min 42×42px. Active = `navy` fill, white.

**Bottom tab nav (app)** — fixed, `card` bg, `1px line` top border, 66px tall,
`env(safe-area-inset-bottom)` padding. 4 tabs, each an icon + word, `slate`
default, `navy` when `aria-current`. Everything thumb-reachable one-handed.

**Buttons**
- *Primary* — `navy` fill, white text, `2px navy` border, radius 12, min-height
  56–66px, a `brass` circular chevron (26–30px) on the left. Hover → `navy-700`.
- *Ghost/secondary* — transparent, `navy` text + border, brass chevron. Hover →
  navy @ 5% tint.
- *Doors* (landing hero) — two large primary/ghost buttons stacked on mobile,
  side-by-side ≥600px, each with title (sans 600, 18px) + sub (14px). They are
  the five-second "door, not a pitch."

**Card** — `card` bg, `1px line`, radius 14, padding 18–20. Title sans/serif 600;
body `slate` ≥16.5px.

**Task row (checklist)** — full-width button, `card` bg, `1px line`, radius 12.
Left: 30px checkbox, `2px line-strong`, radius 9; when done → `sage` fill + white
✓. Then a column: title (sans 600, 17.5px) over hint (`slate` 15px). Done state:
title goes `slate` + strikethrough (strike colour `line-strong`). Toggling is one
tap; state persists.

**Progress bar** — track `#EAE2D4`, fill `sage`, height 9, radius pill, width
animates `.35s`. Paired with a mono label + `n / total` value.

**Document grid** — a `<table>` in an `overflow-x:auto` wrapper. Sticky first
column (category names, sans 600 on `#F7F1E6`). Header row = years (mono). Each
cell is a button cycling 3 states on tap: `0` missing (`□`, `line-strong`),
`1` partial (`◐`, `brass`), `2` have (`■`, `sage` on a 12% sage tint). A
**coverage meter** above sums have=1/partial=0.5 over total.

**Form field** — label in mono uppercase `slate` 12.5px; input mono 17px, `#fff`,
`1.5px line-strong`, radius 10, padding 13–14; focus → `brass` border. Show a
tiny `sage` "saved" note that fades after ~1.4s.

**Kicker / eyebrow** — mono uppercase `brass-600`, letter-spacing .13em.

**Tag / badge** — mono uppercase 11.5px in a `#fff` pill with `line` border
(e.g. `STEP BY STEP`). "Free forever" badge = `navy` fill, white.

**Day chip** — mono uppercase in a `navy` pill with a `brass` dot (`DAY 1`).

**Rule box** — `#fff`, `3px brass` left border, mono text. For the three call
rules and "say this" lines.

**Trust / reminder boxes** — two variants:
- *Navy* (weighty, for "What this is not" and the not-legal-advice reminder):
  `navy` bg, cream text, `gold-on-navy` kicker, navy shadow.
- *Amber* (for scam/safety notes): `#fff`, `4px caution` left border.

**Onboarding option (radio)** — full-width, `card` bg, `1.5px line`, radius 14,
padding 17; a 22px ring dot that fills `brass` when selected; sans 17px.

---

## 7. Screen anatomy (the MVP app)

Bottom-nav app, one reading column, ≤620px centred. Five surfaces:

1. **Onboarding** (first run) — 3 quick questions with a top progress bar:
   *what happened* (crisis / prepare / have-attorney), *do you have their
   A-Number* (with a "what is that?" expander), *years in the U.S.* Then a
   primary "Start my plan". Footer line: "🔒 Saved only on this phone. No
   account needed."
2. **Today** — `DAY N` chip, H1 "What to do today", progress card, then the
   checklist grouped into three mono-labelled phases: **First 24 hours / Next 72
   hours / First weeks**. Tap to complete.
3. **Locate** — H1, save fields (A-Number / facility / phone) with the saved
   note, then a card: primary "Open the official locator" + a numbered
   step-by-step list.
4. **Documents** — H1, coverage meter, the year grid, a have/partial/missing
   legend, and the note "'Coverage' is not an assessment of the case."
5. **First call** — the three rules in rule-boxes, "check an attorney" card with
   the official DOJ list link, a scam warning card, the disclaimer, and a quiet
   "Reset everything on this phone".

(The landing site — `index.html` + `find-them.html` + `three-rules.html` — shares
all tokens/components; the folder hero, the 8-module index, the navy "what this
is not" card, the amber scam list, flat pricing, navy footer.)

---

## 8. Content, voice & i18n

- **Full EN / ES / RU**, English default, **no fallback strings** in any locale.
  All three render Cyrillic/accents correctly with the fonts above.
- Voice: plain verbs, sentence case, calm, no marketing. Always state what the
  tool is **not** (not a law firm, no legal advice, no promised outcome).
- **Open localisation issue to fix:** the ES/RU copy currently defaults to a
  **male** detained person ("его / detenido"). Many detainees are women — prefer
  gender-neutral phrasing (see `../product/content-review.md`).
- A-Number wording is inconsistent across sources ("7–9 digits" vs "nine
  digits") — pick one and confirm with an attorney (also in the review packet).

---

## 9. Accessibility & performance floor

- Visible keyboard focus everywhere: `3px brass` outline, 2–3px offset.
- `prefers-reduced-motion`: kill all animation/transition; reveal all content.
- Every tap target ≥ ~44px, reachable one-handed with a thumb.
- Text resizes without breaking layout; works in bright daylight (high contrast,
  no low-contrast grey-on-grey).
- Must survive a slow connection: self-hosted fonts, no heavy hero media, fast
  first paint (don't block paint on 500KB of inlined fonts — link the shared
  `fonts.css` so content paints immediately with the fallback stack).

---

## 10. How to apply this to the working app

1. Add `tokens.css` (or wire `tailwind.theme.cjs` into `tailwind.config.js`).
2. Copy `../landing/fonts.css` in and reference it; remove any Inter/Roboto/
   system-default and the old terracotta palette.
3. Rebuild each screen in §7 from the component specs in §6, matching
   `../landing/app.html` where in doubt.
4. Keep the on-device-first behaviour; if/when you add family sync, update the
   privacy copy (see `../product/backend/README.md`).
5. Check the reference screenshots in `reference/` for the target look.
