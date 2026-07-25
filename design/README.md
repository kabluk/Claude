# Design handoff — Detention Navigator

This folder is a **complete design specification** to hand to another
implementer (e.g. Kimi3) so they can apply this look to the working app while
keeping their own logic.

## What's here

| File | What it is |
|---|---|
| `DESIGN_SYSTEM.md` | The full spec: principles, colour, type, components, per-screen anatomy, a11y, and how to apply it. **Start here.** |
| `tokens.css` | All design tokens as CSS custom properties. |
| `tailwind.theme.cjs` | The same tokens as a Tailwind `theme.extend` object. |
| `reference/` | Screenshots of the target look (app + landing). |
| `../landing/app.html` | **Canonical reference implementation** — pixel-accurate, self-contained. When the spec is ambiguous, match this file. |
| `../landing/fonts.css` | Self-hosted fonts (Spectral / Commissioner / IBM Plex Mono, Latin+Cyrillic, base64). Copy this in. |

## Reference screenshots

- `reference/app-1-onboarding.png` … `app-5-firstcall-ru.png` — the five MVP
  app screens (Today, Locate, Documents, First call), incl. Russian.
- `reference/landing-hero.png`, `landing-desktop.png` — the marketing landing.

---

## Brief to paste for Kimi3

> Apply this design system to our existing React/Vite/Tailwind app. **Keep all
> app logic and data flow; change only the presentation.**
>
> The complete spec is in `design/DESIGN_SYSTEM.md`, with tokens in
> `design/tokens.css` and `design/tailwind.theme.cjs`. The pixel-accurate
> reference is `landing/app.html`; screenshots of the target are in
> `design/reference/`. Self-hosted fonts are in `landing/fonts.css`.
>
> Requirements:
> 1. Wire `design/tailwind.theme.cjs` into `tailwind.config.js` and use those
>    token names — no raw hexes, no Inter/Roboto/system defaults.
> 2. **Remove the old cream + terracotta + blue palette** from `design-proto`.
>    Terracotta/red is banned. Use only navy / brass / paper / caution-amber /
>    sage as specified.
> 3. Rebuild each screen (onboarding, Today, Locate, Documents, First call) from
>    §6–§7 of the spec, matching `landing/app.html`.
> 4. Keep the hard rules in §1: no red, no dark-mode default, body text ≥17px,
>    mono for numbers/labels, calm and non-predatory voice, visible focus,
>    reduced-motion respected, thumb-reachable, fast on a slow connection.
> 5. Keep full EN/ES/RU with no fallback strings; verify Cyrillic renders.
> 6. Do not add outcome promises, urgency, countdowns, or alarm colours.
>
> Match the reference screenshots. When in doubt, open `landing/app.html` and
> copy its exact values.
