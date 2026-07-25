# Lightweight polish pack — for Kimi3

The current build is already on our design system and deployed — good. This pack
makes it look more finished **without adding weight**. Everything here is inline
SVG or plain CSS: no images, no extra fonts, no libraries. Keep the app fast on
cheap Android phones and Slow 3G.

Apply on top of the existing tokens (navy `#17264A`, brass `#B0842F`, paper
`#F3EFE6`, card `#FCFAF4`, sage `#3F6B4E`, caution/amber `#8A4B12`).

---

## 0. Performance rules (keep these true)

- Fonts: **self-hosted subset woff2 (Latin + Cyrillic only)** with
  `font-display: swap`, OR a system stack. Never load full font families.
- Visuals: **CSS gradients, not images.** SVG icons only. No photos of people.
- JS: no heavy libraries; first screen payload ≤ ~200–300 KB.
- Test at **375 px** width and DevTools **Slow 3G**. Body text ≥ 17 px.

## 1. Remove the dev harness (do this first)

The top row of chips — «С чего начать / Онбординг / Вход по SMS / Задачи дня /
Уведомления / День слушания / Опрос / Тревога / Документы» — is a screen switcher
for review. **It must not ship in production.** Keep only the language switch
(EN/ES/RU). Navigation between real screens is the bottom tab bar + in-flow
buttons.

## 2. Icons on option cards (biggest visual win, ~0 KB)

Give each onboarding option and each feature a small stroke icon. They inherit
`currentColor`, so set the icon color to brass on light cards, white on navy.

```css
.opt{display:flex;align-items:center;gap:14px}
.opt .ic{flex:0 0 auto;width:26px;height:26px;color:var(--brass)}
.opt .ic svg{width:100%;height:100%;display:block}
.opt .txt{display:flex;flex-direction:column;gap:2px}
.opt .txt b{font-weight:600;font-size:17.5px;color:var(--navy)}
.opt .txt span{font-size:15px;color:var(--slate)}   /* optional one-line subtitle */
```

Icon set (24×24, `stroke-width:1.75`, rounded). Paste as-is:

```html
<!-- crisis / first hours (clock) -->
<svg class="dn-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>

<!-- prepare in advance (shield-check) -->
<svg class="dn-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>

<!-- documents / have attorney (folder) -->
<svg class="dn-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>

<!-- locate (pin) -->
<svg class="dn-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>

<!-- phone & money (phone) -->
<svg class="dn-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>

<!-- attorney (scales) -->
<svg class="dn-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M6 7h12"/><path d="M6 7l-3 6a3 3 0 0 0 6 0z"/><path d="M18 7l3 6a3 3 0 0 1-6 0z"/><path d="M8 21h8"/></svg>

<!-- children (child) -->
<svg class="dn-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="2.5"/><path d="M12 8.5V15"/><path d="M8 11h8"/><path d="M9 20l3-5 3 5"/></svg>

<!-- alert / preparedness (bell — calm, never red) -->
<svg class="dn-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>

<!-- hearing day (calendar) -->
<svg class="dn-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>
```

Example option card:

```html
<button class="opt">
  <span class="ic"><!-- clock svg --></span>
  <span class="txt"><b>Близкого задержали</b><span>Срочные шаги: найти человека и что делать в первые часы</span></span>
</button>
```

## 3. Onboarding: progress + selected state

- Add a thin top **progress bar** (sage fill on `#EAE2D4` track), e.g. `width: 33%`
  per step. This already exists in our `app.html` — reuse it.
- Selected card: `1.5px solid var(--brass)` + white background. Keep a visible
  focus outline (`3px var(--brass)`).

## 4. Task rows (Today): checkbox + strikethrough (pure CSS)

Reference: Numo. Already in `app.html` — carry it over exactly.

```css
.task[aria-pressed="true"] .cb{background:var(--sage);border-color:var(--sage)}
.task[aria-pressed="true"] .t-title{color:var(--slate);text-decoration:line-through;text-decoration-color:var(--line-strong)}
```

## 5. Status pills (Documents, cases, hearing) — reads state at a glance

Reference: the tier pills in Life360. Semantic colour, separate from the brass accent.

```css
.pill{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);
  font-size:12px;letter-spacing:.04em;text-transform:uppercase;
  padding:3px 9px;border-radius:999px;border:1px solid transparent}
.pill.ok{color:#2C5540;background:rgba(63,107,78,.12);border-color:rgba(63,107,78,.25)}
.pill.wait{color:#7A4E12;background:rgba(180,116,26,.14);border-color:rgba(180,116,26,.3)}
.pill.todo{color:var(--slate);background:#fff;border-color:var(--line)}
```

```html
<span class="pill ok">Есть</span>
<span class="pill wait">Ждём</span>
<span class="pill todo">Нет</span>
```

## 6. Small finish touches (all free)

- Card shadow soft & low: `box-shadow:0 14px 30px -22px rgba(23,38,74,.5)`.
- Rounded corners consistent: cards 14px, buttons/inputs 12px, pills 999px.
- Brass circular chevron on primary buttons (26–30px), like our doors.
- Section eyebrows in mono uppercase brass, letter-spacing .13em.
- `prefers-reduced-motion`: disable transitions; never hide content behind JS
  reveal without a failsafe.

## 7. Keep the guardrails

No red anywhere (alert/panic uses navy + amber, never red). Light background,
no dark default. No outcome promises, no urgency/countdowns. Body ≥ 17 px.
Full EN/ES/RU, no fallback strings.

---

**Reference implementation for exact values:** our `landing/app.html` — when in
doubt about a size/colour, copy it from there.
