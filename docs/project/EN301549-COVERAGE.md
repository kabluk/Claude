# EN 301 549 — карта покрытия сканером

<!-- СГЕНЕРИРОВАНО scripts/en301549-coverage.mjs — не править руками.
     Пересобрать: npm run en301549:coverage -->

Глава 9 (Web) EN 301 549 V3.2.1 — **50** критериев (Void исключены).
Покрыто автоматически: **31 из 50 (62%)**.

Стандарт гармонизирован на весь ЕС (D-033), поэтому карта одна для всех
13 юрисдикций — национальные законы различаются санкциями и областью
применения, а не требованиями.

⚠ «Покрыто» = существует автоматическая проверка, а НЕ «соответствие
доказано». Автотест находит часть нарушений критерия, не подтверждает его
выполнение. Ни один процент здесь не является заявлением о соответствии.

## Обязанности из директивы (вне главы 9)

EN 301 549 описывает техническую доступность и ничего не говорит о
документах. Эти проверки происходят из самой EAA и в процент выше не входят:

| Проверка | Основание |
|---|---|
| `a11y-statement-missing` | Directive (EU) 2019/882 — accessibility statement |
| `a11y-statement-incomplete` | Directive (EU) 2019/882 — accessibility statement contents |
| `a11y-feedback-missing` | Directive (EU) 2019/882 — accessible feedback channel |
| `a11y-pdf-present` | EN 301 549 ch. 10 (non-web documents) — вне главы 9 |

## Критерии главы 9

| Пункт | WCAG | Критерий | Покрытие | Чем |
|---|---|---|---|---|
| 9.1.1.1 | 1.1.1 | Non-text content | ✅ axe-core | `aria-meter-name`, `aria-progressbar-name`, `image-alt`, `input-image-alt`, `object-alt`, `role-img-alt`, `svg-img-alt` |
| 9.1.2.1 | 1.2.1 | Audio-only and video-only (pre-recorded) | ✅ axe-core | `audio-caption` |
| 9.1.2.2 | 1.2.2 | Captions (pre-recorded) | ✅ axe + наша | `a11y-video-no-captions`, `video-caption` |
| 9.1.2.3 | 1.2.3 | Audio description or media alternative (pre-recorded) | — нет |  |
| 9.1.2.4 | 1.2.4 | Captions (live) | — нет |  |
| 9.1.2.5 | 1.2.5 | Audio description (pre-recorded) | — нет |  |
| 9.1.3.1 | 1.3.1 | Info and relationships | ✅ axe-core | `aria-hidden-body`, `aria-required-children`, `aria-required-parent`, `definition-list`, `dlitem`, `list`, `listitem`, `p-as-heading`, `table-fake-caption`, `td-has-header`, `td-headers-attr`, `th-has-data-cells` |
| 9.1.3.2 | 1.3.2 | Meaningful sequence | — нет |  |
| 9.1.3.3 | 1.3.3 | Sensory characteristics | — нет |  |
| 9.1.3.4 | 1.3.4 | Orientation | ✅ axe-core | `css-orientation-lock` |
| 9.1.3.5 | 1.3.5 | Identify input purpose | ✅ axe-core | `autocomplete-valid` |
| 9.1.4.1 | 1.4.1 | Use of colour | ✅ axe-core | `link-in-text-block` |
| 9.1.4.2 | 1.4.2 | Audio control | ✅ axe + наша | `a11y-autoplay-media`, `no-autoplay-audio` |
| 9.1.4.3 | 1.4.3 | Contrast (minimum) | ✅ axe-core | `color-contrast` |
| 9.1.4.4 | 1.4.4 | Resize text | ✅ axe + наша | `a11y-resize-200`, `meta-viewport` |
| 9.1.4.5 | 1.4.5 | Images of text | — нет |  |
| 9.1.4.10 | 1.4.10 | Reflow | ✅ наша | `a11y-reflow-320` |
| 9.1.4.11 | 1.4.11 | Non-text contrast | — нет |  |
| 9.1.4.12 | 1.4.12 | Text spacing | ✅ axe-core | `avoid-inline-spacing` |
| 9.1.4.13 | 1.4.13 | Content on hover or focus | — нет |  |
| 9.2.1.1 | 2.1.1 | Keyboard | ✅ axe-core | `frame-focusable-content`, `scrollable-region-focusable`, `server-side-image-map` |
| 9.2.1.2 | 2.1.2 | No keyboard trap | ✅ наша | `a11y-keyboard-trap` |
| 9.2.1.4 | 2.1.4 | Character key shortcuts | — нет |  |
| 9.2.2.1 | 2.2.1 | Timing adjustable | ✅ axe-core | `meta-refresh` |
| 9.2.2.2 | 2.2.2 | Pause, stop, hide | ✅ axe-core | `blink`, `marquee` |
| 9.2.3.1 | 2.3.1 | Three flashes or below threshold | — нет |  |
| 9.2.4.1 | 2.4.1 | Bypass blocks | ✅ axe-core | `bypass` |
| 9.2.4.2 | 2.4.2 | Page titled | ✅ axe-core | `document-title` |
| 9.2.4.3 | 2.4.3 | Focus Order | ✅ наша | `a11y-focus-order` |
| 9.2.4.4 | 2.4.4 | Link purpose (in context) | ✅ axe-core | `area-alt`, `link-name` |
| 9.2.4.5 | 2.4.5 | Multiple ways | ✅ наша | `a11y-multiple-ways` |
| 9.2.4.6 | 2.4.6 | Headings and labels | ✅ наша | `a11y-empty-heading` |
| 9.2.4.7 | 2.4.7 | Focus visible | ✅ наша | `a11y-focus-invisible` |
| 9.2.5.1 | 2.5.1 | Pointer gestures | — нет |  |
| 9.2.5.2 | 2.5.2 | Pointer cancellation | — нет |  |
| 9.2.5.3 | 2.5.3 | Label in name | ✅ axe-core | `label-content-name-mismatch` |
| 9.2.5.4 | 2.5.4 | Motion actuation | — нет |  |
| 9.3.1.1 | 3.1.1 | Language of page | ✅ axe-core | `html-has-lang`, `html-lang-valid`, `html-xml-lang-mismatch` |
| 9.3.1.2 | 3.1.2 | Language of parts | ✅ axe-core | `valid-lang` |
| 9.3.2.1 | 3.2.1 | On focus | — нет |  |
| 9.3.2.2 | 3.2.2 | On input | — нет |  |
| 9.3.2.3 | 3.2.3 | Consistent navigation | ✅ наша | `a11y-inconsistent-navigation` |
| 9.3.2.4 | 3.2.4 | Consistent identification | ✅ наша | `a11y-inconsistent-identification` |
| 9.3.3.1 | 3.3.1 | Error identification | — нет |  |
| 9.3.3.2 | 3.3.2 | Labels or instructions | ✅ axe-core | `form-field-multiple-labels` |
| 9.3.3.3 | 3.3.3 | Error suggestion | — нет |  |
| 9.3.3.4 | 3.3.4 | Error prevention (legal, financial, data) | — нет |  |
| 9.4.1.1 | 4.1.1 | Parsing | ✅ axe-core | `duplicate-id-active`, `duplicate-id` |
| 9.4.1.2 | 4.1.2 | Name, role, value | ✅ axe-core | `area-alt`, `aria-allowed-attr`, `aria-braille-equivalent`, `aria-command-name`, `aria-conditional-attr`, `aria-deprecated-role`, `aria-hidden-body`, `aria-hidden-focus`, `aria-input-field-name`, `aria-prohibited-attr`, `aria-required-attr`, `aria-roledescription`, `aria-roles`, `aria-tab-name`, `aria-toggle-field-name`, `aria-tooltip-name`, `aria-valid-attr-value`, `aria-valid-attr`, `button-name`, `duplicate-id-aria`, `frame-title-unique`, `frame-title`, `input-button-name`, `input-image-alt`, `label`, `link-name`, `nested-interactive`, `select-name`, `summary-name` |
| 9.4.1.3 | 4.1.3 | Status messages | — нет |  |

## Не покрытые критерии

Требуют ручного аудита либо принципиально не автоматизируются
(смысл, последовательность, контекст). Это честная граница продукта —
именно здесь начинается работа агентства из каталога.

- **9.1.2.3** (WCAG 1.2.3) — Audio description or media alternative (pre-recorded)
- **9.1.2.4** (WCAG 1.2.4) — Captions (live)
- **9.1.2.5** (WCAG 1.2.5) — Audio description (pre-recorded)
- **9.1.3.2** (WCAG 1.3.2) — Meaningful sequence
- **9.1.3.3** (WCAG 1.3.3) — Sensory characteristics
- **9.1.4.5** (WCAG 1.4.5) — Images of text
- **9.1.4.11** (WCAG 1.4.11) — Non-text contrast
- **9.1.4.13** (WCAG 1.4.13) — Content on hover or focus
- **9.2.1.4** (WCAG 2.1.4) — Character key shortcuts
- **9.2.3.1** (WCAG 2.3.1) — Three flashes or below threshold
- **9.2.5.1** (WCAG 2.5.1) — Pointer gestures
- **9.2.5.2** (WCAG 2.5.2) — Pointer cancellation
- **9.2.5.4** (WCAG 2.5.4) — Motion actuation
- **9.3.2.1** (WCAG 3.2.1) — On focus
- **9.3.2.2** (WCAG 3.2.2) — On input
- **9.3.3.1** (WCAG 3.3.1) — Error identification
- **9.3.3.3** (WCAG 3.3.3) — Error suggestion
- **9.3.3.4** (WCAG 3.3.4) — Error prevention (legal, financial, data)
- **9.4.1.3** (WCAG 4.1.3) — Status messages
