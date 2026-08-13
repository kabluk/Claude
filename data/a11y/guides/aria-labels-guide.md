---
{
  "slug": "aria-labels-guide",
  "locale": "en",
  "title": "ARIA Labels Explained: aria-label vs aria-labelledby vs aria-describedby",
  "description": "How aria-label, aria-labelledby and aria-describedby actually work, which one wins when several are present, and the first rule of ARIA: use native HTML first.",
  "standard": "wcag-2-2",
  "updated": "2026-08-13",
  "faq": [
    {
      "q": "What is the first rule of ARIA?",
      "a": "The W3C's ARIA specification states it directly: if a native HTML element or attribute already has the semantics and behavior you need, use it instead of repurposing a different element and adding an ARIA role, state or property to make it accessible. A real <button> is better than a <div role=\"button\">."
    },
    {
      "q": "Which wins if an element has both aria-label and aria-labelledby?",
      "a": "aria-labelledby. It has the highest precedence in the accessible name computation, overriding aria-label, native labelling elements like <label> or <caption>, and the element's own text content. Using both on the same element is redundant."
    },
    {
      "q": "What's the difference between aria-labelledby and aria-describedby?",
      "a": "aria-labelledby supplies the accessible name — the short, primary identifier for an element, comparable to a <label>. aria-describedby supplies the accessible description — longer, supplementary information such as a hint or an error message. A form field commonly has both: a label naming it and a description explaining a format requirement."
    },
    {
      "q": "Can I use aria-label on a <div> that isn't interactive?",
      "a": "It has no effect on elements without an ARIA role that supports naming, and MDN lists a set of structural/text-level roles — including generic, paragraph, and presentation/none — where aria-label is not supported at all. aria-label works on interactive elements, widgets, landmarks, images and iframes; putting it on a plain, role-less <div> or <span> does nothing for assistive technology."
    }
  ],
  "cta": { "label": "Get a free automated accessibility scan", "path": "/scan/" },
  "relatedAgencies": ["deque-systems", "tpgi", "level-access", "allyant"]
}
---
`aria-label`, `aria-labelledby` and `aria-describedby` are three of the most-used — and most-misused — attributes in accessible web development. All three exist to help assistive technology compute an element's **accessible name** or **accessible description**, but they work differently and solve different problems. This guide covers the first rule of ARIA use, what each attribute actually does, and where they go wrong, based on the [W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) and the [WAI-ARIA specification](https://www.w3.org/TR/using-aria/).

## The first rule of ARIA: use native HTML first

Before reaching for any `aria-*` attribute, apply the rule the ARIA specification itself leads with:

> If you can use a native HTML element or attribute with the semantics and behavior you require already built in, instead of repurposing an element and adding an ARIA role, state or property to make it accessible, then do so.

A `<button>` already has a keyboard-operable role, focus handling and an accessible name from its text content for free. A `<div role="button" tabindex="0">` gets none of that automatically — you'd have to reimplement keyboard activation, focus styling and state management yourself, and it is easy to miss something. The ARIA spec's related rules reinforce the same caution: don't change native semantics unless you really have to (don't put `role="tab"` directly on an `<h2>` — wrap it instead), every interactive ARIA control must be operable by keyboard, and never put `role="presentation"` or `aria-hidden="true"` on an element that can receive focus, or keyboard users land on nothing.

ARIA labelling attributes are for the cases native HTML doesn't cover on its own: icon-only buttons, custom widgets, landmarks that need distinguishing, and elements whose visible text doesn't match what should be announced.

## How the accessible name gets computed

Every interactive element and most other UI elements have an **accessible name** — the string assistive technology announces to identify it — computed by an algorithm that checks several sources in priority order. This is what [WCAG 2.2 SC 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) (Level A) requires be programmatically determinable: for every UI component, the name and role must be exposed, and any states, properties and values the user can set must also be exposed and updated as they change. Native HTML controls generally satisfy this automatically (a `<button>`'s name is its text; an `<input>`'s name is its associated `<label>`); custom widgets and icon-only controls typically need an explicit ARIA name.

## aria-label

`aria-label` supplies the accessible name directly as a string, for elements that have no visible text — or whose visible text isn't the label you want announced:

```html
<button aria-label="Close">
  <svg aria-hidden="true" focusable="false">…</svg>
</button>
```

Key things to know:

- It is **invisible** — only assistive technology hears it, so never put information there that sighted users also need; use visible text for that.
- It is **not automatically translated** by the browser; if your site supports multiple languages, `aria-label` strings need to be localized like any other UI text.
- It only works on elements whose role supports naming — interactive elements, widgets, landmarks, images and iframes. It has no effect on structural/text-level roles such as `generic`, `paragraph`, or `presentation`/`none`.
- Prefer `aria-labelledby` over `aria-label` whenever a visible label already exists in the DOM — referencing it avoids maintaining the same text in two places.

## aria-labelledby

`aria-labelledby` points to the `id` of one or more other elements whose text content becomes the accessible name:

```html
<span id="tac">I agree to the Terms and Conditions.</span>
<span role="checkbox" aria-checked="false" tabindex="0" aria-labelledby="tac"></span>
```

It can reference multiple IDs (space-separated), in which case the text is concatenated in the order listed — useful for building a compound name out of a heading plus a "read more" link, for instance. It **takes precedence over everything else** in the accessible name computation: over `aria-label`, over native labels like `<label>`, `<legend>` or `<caption>`, and over the element's own text content. If both `aria-label` and `aria-labelledby` are present on the same element, `aria-labelledby` wins and the `aria-label` is ignored — so don't set both expecting a fallback.

## aria-describedby

`aria-describedby` also references other elements by `id`, but it supplies the accessible **description** — supplementary information, not the primary name:

```html
<input type="password" aria-describedby="pwd-hint" />
<p id="pwd-hint">Must be at least 8 characters, including a number.</p>
```

It's the right tool for format hints, help text, and error messages associated with a form field, and it works with any HTML element and any ARIA role, unlike `aria-label`/`aria-labelledby`. The referenced content doesn't need to be visible — descriptions can live in a hidden element and still be exposed to assistive technology — but the description and the field it describes must be in the same document.

## Labelling common patterns

- **Icon-only buttons**: `aria-label="Search"` (describe the action, mirroring how you'd write [alt text for a functional image](/guides/how-to-write-alt-text/)).
- **Landmarks**: when a page has more than one of the same landmark role (e.g. two `<nav>` elements), give each an `aria-label` so assistive technology users can tell them apart: `<nav aria-label="Primary">`, `<nav aria-label="Footer">`.
- **Form fields**: prefer a real `<label for="…">` first; if the visible text isn't in a `<label>` element for layout reasons, `aria-labelledby` pointing at that visible text is the next best option. Reserve `aria-label` for when there is no visible text at all.
- **Custom widgets built with `role`** (tabs, comboboxes, dialogs): each needs an accessible name via `aria-label` or `aria-labelledby`, per the applicable [ARIA APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/).

## Common mistakes

- **Redundant labelling** — setting both `aria-label` and `aria-labelledby` on the same element; only one is used.
- **Labelling the wrong element** — putting `aria-label` on a wrapping `<div>` instead of the actual interactive control inside it, where it has no effect.
- **`aria-label` on non-interactive, role-less elements** — has no effect; assistive technology never sees it.
- **Overriding a good visible label with a worse `aria-label`** — `aria-label` takes precedence over an `<img>`'s `alt`, an `<input>`'s `<label>`, and an `<iframe>`'s `title`, so an inaccurate `aria-label` silently defeats a correct native label.
- **Using ARIA to fix something native HTML would have solved automatically** — see the first rule above.
- **Untranslated `aria-label` strings on a localized site** — screen reader users on the Spanish version of a page hearing English button names.

## Checking your work

Automated scanners can catch missing accessible names on interactive elements and some role misuse, but whether the *wording* is accurate still needs human review — ideally listening to the page with a real screen reader. Run a [free automated scan](/scan/) to catch the mechanical cases, and see our [WCAG audit guide](/guides/wcag-audit-guide/) for how manual testing fits into a complete evaluation against SC 4.1.2 and the rest of WCAG 2.2 AA.
