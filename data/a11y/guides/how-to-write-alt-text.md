---
{
  "slug": "how-to-write-alt-text",
  "locale": "en",
  "title": "How to Write Alt Text: A Practical Guide (WCAG 1.1.1)",
  "description": "What alt text is for, when to use empty alt=\"\", how to handle complex images, icons and text-in-images, and the mistakes that fail WCAG 1.1.1 Non-text Content.",
  "standard": "wcag-2-2",
  "updated": "2026-08-13",
  "faq": [
    {
      "q": "Should every image have alt text?",
      "a": "Every <img> needs an alt attribute, but not every image needs descriptive text in it. Purely decorative images should get an empty alt=\"\" so screen readers skip them; images that convey meaning need a text alternative that conveys the same meaning. Leaving the attribute off entirely is different from leaving it empty, and assistive technology may announce the filename or \"unlabeled image\" as a fallback — always include the attribute."
    },
    {
      "q": "What alt text should an icon button have?",
      "a": "Describe the action the button performs, not the icon's appearance. A magnifying-glass icon that submits a search should read alt=\"Search\" (or, if it is implemented with aria-label rather than an <img>, aria-label=\"Search\"), not alt=\"magnifying glass\"."
    },
    {
      "q": "How do I write alt text for a chart or graph?",
      "a": "Give the image a short alt attribute that names what it is (e.g. \"Bar chart: quarterly revenue by region\"), and put the actual data or takeaway in visible text near the image or in a linked long description. WCAG's Non-text Content criterion explicitly allows short and long text alternatives to be combined this way for complex images."
    },
    {
      "q": "Is 'image of a...' good alt text?",
      "a": "No. Screen readers already announce that the element is an image, so starting the alt text with \"image of\" or \"picture of\" is redundant and wastes the user's time. Describe the content and, for functional images, the action — not the fact that it is an image."
    }
  ],
  "cta": { "label": "Get a free automated accessibility scan", "path": "/scan/" },
  "relatedAgencies": ["deque-systems", "tpgi", "level-access", "allyant"]
}
---
Alt text is the single most searched accessibility topic for a reason: it is required on almost every page, it is easy to get technically present and substantively wrong, and automated scanners only catch the missing cases, not the bad ones. This guide walks through [WCAG 2.2 Success Criterion 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) (Level A) and W3C WAI's [alt Decision Tree](https://www.w3.org/WAI/tutorials/images/decision-tree/), and turns them into a practical process you can apply to any image.

## What alt text is and why it matters

The `alt` attribute on an `<img>` element is a **text alternative**: a stand-in for the image that assistive technology — a screen reader, a braille display, a text-only browser — presents when the image itself can't be perceived. It also displays in place of the image if the file fails to load. [SC 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) requires that all non-text content have a text alternative that serves the equivalent purpose, and it is Level A — the baseline every conformance target (WCAG AA, EN 301 549, Section 508, ADA settlements) includes.

As [MDN puts it](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#attr-alt), alt text "should provide a clear and concise text replacement for the image's content. It should not describe the presence of the image itself or the file name of the image." Two failure modes are equally common: no alt text at all, and alt text that technically exists but doesn't do the job.

## The four image categories

W3C WAI's decision tree groups images into categories, each with a different rule:

### 1. Decorative images

Purely visual images that add nothing to the content — background flourishes, spacer graphics, or images whose text is duplicated by real text already on the page — get an **empty alt attribute**: `alt=""`. This is not the same as omitting the attribute; `alt=""` actively tells assistive technology to skip the image, while a missing attribute can cause the filename to be announced instead. Purely decorative images implemented as CSS backgrounds don't need an `alt` at all, since they are outside the HTML content.

### 2. Informative images

Simple graphics, illustrations or photographs that contribute meaning need alt text that conveys that meaning concisely. The decision tree's own example:

```html
<!-- Bad -->
<img src="penguin.jpg" alt="image" />

<!-- Good -->
<img src="penguin.jpg" alt="A penguin on a beach." />
```

Keep it brief — a sentence or short phrase, not a paragraph — and describe what the image communicates in context, not every visual detail.

### 3. Functional images

When an image sits inside a link or a button, the alt text must describe **the destination or the action**, not the picture. MDN gives the example of a "next" arrow icon: use `alt="next page"`, not `alt="arrow right"`. The same rule applies to a logo that links to the homepage (`alt="Home"` or the company name, not "logo").

### 4. Images of text

If text is baked into an image and doesn't appear anywhere else on the page, the alt attribute must include that text verbatim, per the decision tree's guidance. This is a fallback rule, not a recommendation to keep using text-in-images: real HTML text is searchable, resizable and translatable in ways an image never is, so prefer live text wherever the design allows it.

## Complex images: charts, graphs, diagrams

Complex images are the one category where a short `alt` attribute cannot carry the whole load. The Non-text Content criterion explicitly supports **short and long text alternatives used together**: a brief `alt` that identifies what the graphic is, plus the actual informational content placed elsewhere — as visible text near the image, in a data table, or in a linked long description.

```html
<img
  src="quarterly-revenue.png"
  alt="Bar chart: quarterly revenue by region, 2025" />
<p>
  Revenue grew in every region except APAC, which declined 4% quarter over
  quarter. Full figures: <a href="revenue-2025.csv">download the data</a>.
</p>
```

Don't try to cram a chart's full data set into the `alt` attribute — screen readers read it as one unbroken string, and most assistive technology users will get more value from a well-structured table or a paragraph they can navigate normally.

## Icons and icon buttons

An icon used purely for decoration next to a text label needs `alt=""` (or, if it's an inline SVG, `aria-hidden="true"`) so it isn't announced twice. An icon that is the *only* content of an interactive control — a trash-can icon that deletes an item, a hamburger icon that opens a menu — needs a text alternative describing the action: `aria-label="Delete item"`, not `aria-label="trash icon"`. See our [ARIA labels guide](/guides/aria-labels-guide/) for how `aria-label` and `aria-labelledby` work on non-image controls.

## A short decision flow

1. **Is the image purely decorative or redundant with visible text?** → `alt=""`.
2. **Is it inside a link or button?** → alt text describes the destination/action.
3. **Does it contain text with no equivalent visible elsewhere?** → alt text includes that text.
4. **Is it a chart, graph or diagram?** → short `alt` naming the image, plus the data/takeaway in visible text or a linked long description.
5. **Otherwise** → a concise description of the meaning the image conveys.

## Common mistakes

- **"Image of a dog" / "Picture of..."** — redundant; assistive technology already announces the element as an image.
- **Filename as alt text** — `alt="IMG_4821.jpg"` conveys nothing.
- **Missing alt attribute entirely** — different from `alt=""`; some assistive technology falls back to reading the filename or URL.
- **Alt text on functional images that describes appearance, not action** — `alt="magnifying glass"` on a search button instead of `alt="Search"`.
- **Keyword-stuffed alt text** — writing for search engines instead of users produces alt text that doesn't read naturally and can itself become a barrier.
- **Alt text that repeats an adjacent caption word-for-word without adding anything** — not wrong by itself, but a missed chance to give screen reader users information sighted users get from the caption plus the image.

## Checking your work

Automated tools can confirm an `alt` attribute exists and flag empty alt on images that also function as links, but they can't judge whether the wording is accurate or useful — that still takes human review, ideally by testing with a screen reader. Run a [free automated scan](/scan/) to catch missing and empty-on-functional-image cases across your site, and see our [WCAG audit guide](/guides/wcag-audit-guide/) for how manual review fits into a full accessibility evaluation. If your images sit inside low-contrast overlays or captions, check the text against our [contrast checker](/checkers/contrast-checker/) too — text legibility and text alternatives are two different SC 1.1.1/1.4.3 requirements that often need fixing together.
