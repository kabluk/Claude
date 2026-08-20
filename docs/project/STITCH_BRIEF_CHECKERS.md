# STITCH BRIEF — интерфейс бесплатных чекеров

Назначение: бриф для Google Stitch, чтобы получить альтернативные варианты
интерфейса страницы чекера. Тот же путь, что с макетами главной (D-072 →
`BRAND_BOOK.md` → `CN-BRANDBOOK-V2`), только в обратную сторону: раньше Stitch
давал макет, из которого извлекали токены, — теперь мы отдаём Stitch уже
зафиксированные токены, чтобы его предложения были применимы без переизобретения
палитры.

⚠ **Значения ниже взяты из `src/styles.css` (то, что реально рендерится),
а НЕ из `BRAND_BOOK.md` §1.** Таблица брендбука описывает первый макет;
`CN-BRANDBOOK-V2` (2026-08-08) заменил часть значений — в частности `primary`
стал `#4450b7` вместо `#4f5bd5`, а у `primary-container` сменилась роль.
Копировать в Stitch нужно этот файл, не брендбук.

Состояние на момент написания (2026-08-20): 9 чекеров live, только что прошёл
узел `G-CHECKERS-ELEVATION` (шкала теней, `.panel`, `.result-hero`,
full-bleed на мобильном). Stitch предлагает варианты ПОВЕРХ этого, зная
ограничения ниже.

---

## Промпт для Stitch (копировать целиком)

```text
Design a free online accessibility checker tool page for Verscala — a web
accessibility audit platform. This is one of nine free browser-based tools;
they are the top of the funnel, so the page must feel trustworthy and
precise, like an instrument rather than a marketing page. The company sells
accessibility audits, so its own interface has to be exemplary: any design
that fails WCAG AA contradicts the product.

SCREEN: the colour contrast checker. Use this exact content, not
placeholder text.

Page heading: "Colour contrast checker"
Intro: "Enter two colours and see the WCAG 2.2 contrast ratio update live —
with a pass/fail for normal text, large text and UI components at Level AA
and AAA. Hex, RGB or HSL, an eyedropper where your browser supports it, and
a link you can share. Free, instant, no sign-up."

The tool itself contains:
- Two colour inputs, each a labelled group: "Foreground (text) colour" and
  "Background colour". Each has a colour swatch, a text field accepting hex,
  rgb or hsl, and a small eyedropper button. Below each field, the same
  colour in the other two notations, e.g. "rgb(26, 26, 46) · hsl(240, 28%,
  14%)". Sample values: #1a1a2e and #ffffff.
- Two secondary actions: "Swap colours" and "Copy link to result".
- THE RESULT, which is the single most important element on the screen:
  label "Contrast ratio", the number "17.06 : 1" set large, and a verdict
  line "Passes AA and AAA for normal text."
- A results table with columns "Text / element", "Level AA", "Level AAA"
  and rows: "Normal text" (sub-label "below 24px (or 18.66px bold)"),
  "Large text" ("≥24px, or ≥18.66px (14pt) bold"), "UI & graphics"
  ("icons, borders, chart parts (1.4.11)"). Cells read "✓ Pass", "✗ Fail"
  or "—". Never encode pass/fail with colour alone — always a word or mark
  as well.
- A live preview card headed "Preview" showing the chosen colours applied
  to: small body text, a large heading, bold body text, and a button. Note
  under it: "The preview uses your two colours exactly. Everything else on
  this page uses our own verified palette."

Below the tool, an explanatory section "What the thresholds mean" and a
block linking to the other free checkers.

BRAND — use these exact values, do not substitute your own palette:
  primary            #4450b7
  primary hover      #33409b
  on primary         #ffffff
  secondary container #e1e0f9
  on secondary container #181a2c
  page background    #fcf8fb
  elevated surface   #ffffff
  sunken surface     #f6f2f5
  text               #1c1b1d
  secondary text     #454652
  outline            #767684
  hairline           #c6c5d5
  error              #ba1a1a
  success            #1f6d42
  warning            #8f4c00

  Typeface: Geist for everything, JetBrains Mono for small uppercase
  labels, numbers and code-like values. Uppercase labels carry ~0.05em
  letter-spacing. Numbers use tabular figures.

  Radii: 0.5rem for buttons and inputs, 0.75rem for chips, 1rem for cards
  and panels.

HARD CONSTRAINTS:
- Light theme only. Do not produce a dark variant.
- Every text and UI pair must meet WCAG AA: 4.5:1 for body text, 3:1 for
  large text and for the boundaries of controls. This is checked
  automatically and a failing design cannot ship.
- Keyboard focus must be visibly indicated on every interactive element,
  and the indicator must not be removed on mouse focus.
- Colour is never the only carrier of meaning.
- On a 390 × 844 phone, the contrast ratio result must be readable without
  scrolling. This is a real constraint learned the hard way: a previous
  revision added panel padding, which pushed the button row into a second
  line and dropped the result 37px below the fold. Design the mobile layout
  around this, not as an afterthought.

WHERE YOU HAVE FREEDOM — this is what we want proposals on:
- How the tool separates itself from the surrounding article. Right now it
  is a white elevated panel with a soft shadow; propose alternatives.
- How the result earns its status as the answer. It is currently a large
  number in an elevated card; it could be far more expressive.
- The relationship between the two colour inputs — they are a pair and
  currently look like two independent fieldsets.
- How pass and fail read at a glance in the table.
- The mobile composition specifically: what belongs above the fold, what
  can wait.

Produce a desktop layout at 1280px and a phone layout at 390px.
```

---

## Как использовать результат

1. Stitch отдаёт `code.html` с `<script id="tailwind-config">` — оттуда берутся
   фактические значения, как в D-072/CN-BRANDBOOK-V2. Значения ЧИТАТЬ ИЗ ФАЙЛА,
   не переписывать на глаз с картинки.
2. Если Stitch отклонился от палитры — это не повод менять палитру. Палитра
   зафиксирована решением; отклонение означает, что бриф нужно ужесточить,
   либо что идею придётся перекладывать на наши токены вручную.
3. Любое предложение проверяется теми же гейтами, что и наш код: `audit-a11y`
   (контраст-гейт) и измерение сгиба на 390×844 — тем же способом, что поймал
   регрессию 2026-08-20 (Playwright, реальный вьюпорт, позиция результата).
4. Смена палитры/гарнитуры/радиусов = новое решение в `DECISIONS.md`, не
   молчаливая правка `styles.css`.
