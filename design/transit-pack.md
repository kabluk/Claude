# Transit direction — implementation pack for Kimi

Apply this look to the **existing working app** (keep all logic/functions).
Reference implementation with exact values: [`../landing/transit.html`](../landing/transit.html).
Tokens: [`transit.tokens.css`](transit.tokens.css) / [`transit.theme.cjs`](transit.theme.cjs).
Fonts: reuse [`../landing/fonts.css`](../landing/fonts.css) — same font files, no new ones.

Stays lightweight: CSS/SVG only, no images, subset fonts. Test at 375px + Slow 3G.

---

## The idea

"Detention Navigator" = navigation. The first days are a **route**; the app is
the map. The signature is a **wayfinding line with numbered stations** that
threads the journey. In the app it is functional: the teal line = progress, lit
dots = completed steps.

## The one big change vs the current build: flip the type roles

- **Display / headings / big titles → Commissioner (grotesque), heavy, tight**
  (`--sign`). This is the signage voice.
- **Reading / body / descriptions → Spectral (serif)** (`--read`).
- **Labels, numbers, station kickers, eyebrows → IBM Plex Mono** (`--mono`).

Everything else is the token swap (ink/paper/brass/**teal**/sage). The teal is
new and belongs to the route + progress only.

## Screen-by-screen

- **Onboarding**: keep the 3–8 question flow. Headline in `--sign` (grotesque),
  question options as cards, thin top progress bar in **teal**. Eyebrow in mono.
- **Today / journey**: this is where the **route** lives. Render the phases
  (24h / 72h / weeks) or the 8 modules as **stations** on the vertical line.
  A task done → its station dot lights (teal) and the line fills to that point.
  So the progress meter *is* the route. (Component below.)
- **Locate / Documents / Attorney / Children / Hearing / Alert**: same tokens,
  same components — grotesque titles, serif body, mono data, teal for the active
  line / progress, sage for done, amber only for warnings. **No red anywhere**
  (the Alert/panic screen uses ink + amber, never red).
- **Trust ("What this is not")**: ink band, gold-on-ink accents (see reference).

## Signature component — the route (paste-ready)

```html
<div class="route" id="routeEl">
  <div class="track"></div><div class="prog" id="prog"></div>
  <div class="station"><span class="dot"></span>
    <span class="k"><span class="no">01</span> Locate</span>
    <h3>Find the person</h3><p>Which facility holds them, and how to confirm it.</p>
  </div>
  <!-- …one .station per step… -->
</div>
```

```css
.route{position:relative;padding-left:46px}
.route .track{position:absolute;left:17px;top:6px;bottom:14px;width:2px;background:var(--line-2);border-radius:2px}
.route .prog{position:absolute;left:17px;top:6px;width:2px;background:var(--teal);border-radius:2px;height:100%} /* set height = done/total in-app */
.station{position:relative;padding:0 0 26px}
.station:last-child{padding-bottom:0}
.station .dot{position:absolute;left:-38px;top:2px;width:18px;height:18px;border-radius:50%;background:var(--teal);border:2px solid var(--teal);box-shadow:0 0 0 4px rgba(33,92,99,.12)}
.station.todo .dot{background:var(--paper);border-color:var(--line-2);box-shadow:none}   /* not done yet */
.station.now  .dot{background:var(--paper);border-color:var(--teal);box-shadow:0 0 0 4px rgba(33,92,99,.18)} /* current step */
.station .k{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--brass-600);display:flex;gap:10px}
.station .k .no{color:var(--teal)}
.station h3{font-family:var(--sign);font-weight:600;font-size:21px;letter-spacing:-.01em;margin:5px 0 3px;color:var(--ink)}
.station p{font-family:var(--read);color:#43505c;font-size:16.5px;max-width:52ch}
```

**Simplified mechanic — no scroll JS.** The route is static CSS; state drives it
in two lines. Set the fill height once, and give each station one class:

```js
prog.style.height = (doneCount/total*100) + "%";   // teal line fill
// per station: class "done" (default filled dot) | "now" (current) | "todo" (empty)
```

No IntersectionObserver, no scroll math, nothing to animate — lighter and
identical on every phone. (Earlier draft used a scroll-draw; dropped it.)

## Buttons & doors (from the reference)

- Primary: `ink` fill, `paper` text, `2px ink` border, radius 14, brass circular
  chevron. Ghost: transparent, ink text/border.
- Headline uses `clamp(40px,10vw,84px)` grotesque with `text-wrap:balance`.

## Must-do cleanups

1. **Remove the dev harness** (top row «С чего начать / Онбординг / … / Документы»)
   — it must not ship. Keep only EN/ES/RU.
2. Keep full EN/ES/RU, no fallback strings; verify Cyrillic (Commissioner &
   Spectral both carry it).
3. Body ≥ 17px, visible focus (`3px brass`), reduced-motion respected.
4. No red, no dark default, no outcome promises / urgency / countdowns.

---

## Paste this to Kimi

> Re-skin the app to the "Transit" direction. Keep all logic/functions. Wire
> `design/transit.theme.cjs` into tailwind.config.js; reuse `landing/fonts.css`.
> Flip type roles: **Commissioner (grotesque) for all display/headings**,
> **Spectral (serif) for body**, IBM Plex Mono for labels/numbers. Apply the
> ink/paper/brass/teal/sage tokens. Build the **route** component
> (`design/transit-pack.md`) and use it on the Today/journey screen as the real
> progress — static CSS + state classes (done/now/todo), no scroll animation:
> teal line fills with completed tasks, station dots light up. Match
> `landing/transit.html` for exact values. Remove the dev screen-switcher row.
> Keep EN/ES/RU with no fallbacks, body ≥17px, visible focus, reduced-motion,
> no red, no dark default. Then redeploy to Netlify.
