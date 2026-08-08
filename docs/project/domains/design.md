# Design — источник правды дизайн-системы AccessAtlas

Обновлено: 2026-08-08 (итерация CN-BRANDBOOK, D-072 — применён brand book
владельца). Направляющие документы — `docs/project/BRAND_BOOK.md` (извлечённая
спецификация макетов) и `docs/project/DESIGN_CONSTITUTION.md` (§3, §24–29,
§37–38, §57). Реализация токенов — `src/styles.css` (`@theme` + dark-блок), это
единственное место, где значения живут в коде; здесь — их назначение и правила.

История: палитра первой системы (slate + индиго, D-063, 2026-08-07) —
**superseded** этим документом; принципы D-063 (семантическая severity,
всегда видимый фокус, tabular-nums, контраст-гейт) действуют без изменений.

North star (§3): точность, сдержанность, иерархия, engineering feel.

## 1. Палитра

Система пар «цвет / on-цвет» (M3-подобная) в ДВУХ темах; dark — полноценная
(§28), переключение `prefers-color-scheme`, JS-переключателя нет. Значения
core-токенов обеих тем — из макетов владельца, таблицы в `BRAND_BOOK.md`
(здесь не дублируются). Правила:

- Компоненты стилизуются ТОЛЬКО токенами (`bg-surface-container-low`,
  `text-on-surface-variant`, `border-outline-variant`…). Прямые slate/gray/
  hex-классы запрещены. Ни один цвет не живёт только в dark-ветке: dark-блок
  лишь переопределяет токены, объявленные в `@theme`.
- Роли нейтральных: `background` — фон страницы; `surface` — поля ввода;
  `surface-container-low` — карточки/панели; `surface-container` — chips-фоны,
  hover; `on-surface` — основной текст; `on-surface-variant` — вторичный текст
  и плейсхолдеры; `outline` — границы полей; `outline-variant` — границы
  карточек/разделители.
- Один акцент — `primary` (интерактив, бренд, фокус, ссылки). Вторичный тон
  поверхности — `secondary-container` (CTA шапки, chip-accent, CTA-панели).
  Severity НЕ красится акцентом.
- Логотип: `brand-plate`/`brand-glyph` (light: primary + белый; dark:
  primary-container + почти белый) — глиф карты остаётся светлым в обеих темах.

### Severity — семантическая шкала сканера

1:1 со шкалой impact axe-core (`scanner.ts`) + success/info (§27). В макетах
шкалы нет (кроме error) — подобрана в тон обеим темам, критик — скрипт
(scratchpad `contrast-d072.mjs`): текст ≥ 4.5:1 на background, на surface/card
и на своей soft-подложке. Живой гейт — axe в `audit-own-a11y` в ОБЕИХ темах.

| Severity | Light text/soft/border | Dark text/soft/border |
|---|---|---|
| Critical | `#ba1a1a` / `#ffedea` / `#ffb4ab` | `#ffb4ab` / `#351a18` / `#7e2a24` |
| Serious | `#8f4c00` / `#ffeedd` / `#ffb875` | `#ffb875` / `#332217` / `#7c4a12` |
| Moderate | `#6d5e00` / `#fff3c4` / `#d1c26d` | `#e0c94d` / `#2e2a15` / `#6d5e00` |
| Minor | `#46464f` / `#f1edf0` / `#c7c5d0` | `#c6c5d5` / `#1f2021` / `#454652` |
| Success | `#1f6d42` / `#d9f4e1` / `#8fd6ab` | `#8fd6ab` / `#16291d` / `#2c6b45` |
| Info | `#4451c8` / `#e0e0ff` / `#a9b0f5` | `#bdc2ff` / `#252a51` / `#3d4285` |

Правила severity (без изменений с D-063):
- Цвет никогда не единственный носитель смысла (§27): рядом всегда текстовая
  метка (`impactLabel`).
- Critical и Serious — разные оттенки (красный/оранжевый), различимо при
  большинстве форм дальтонизма.
- Ошибки форм — `--color-critical` + `role="alert"` + `font-medium`.
- Success — только заработанное состояние. Info — light-вариант чуть темнее
  primary (#4451c8), потому что сам primary не дотягивает 4.5:1 на своей soft
  `#e0e0ff` — посчитано, не на глаз.
- Amber-блоки правовой информации (legal-basis, D-035) — family `moderate`.

## 2. Типографика

- **Inter Variable** (self-hosted @fontsource) — гротеск. Brand book визуально
  называет «Geist», но код всех макетов — Inter; взят Inter (D-072).
- **JetBrains Mono Variable** (self-hosted @fontsource, D-072) — `--font-mono`:
  UI-лейблы label-md и код. Решение D-063/D-068 «кастомный моно не вводим»
  пересмотрено D-072 указанием владельца (brand book прямо требует пару).
- Type-scale — `BRAND_BOOK.md` §3: `.display` (hero) / `.h1` / `.h2` /
  body 16 / `text-sm` 14 / `.label` (12 mono 500 uppercase 0.05em).
  Иерархия — весом и отступом; новые кегли не заводить без записи здесь.
- **`tabular-nums` для всех чисел-метрик** (§25): класс `.num`.

## 3. Spacing и форма

- Ритм — сетка 4px; секции `mt-10`/`mt-12`; колонка `max-w-5xl`
  (`container-page`); текст `max-w-2xl`.
- Радиусы: шкала переопределена под brand book — sm .125 / md .25 / lg .375 /
  xl .5rem. Карточки/панели `rounded-xl` (8px), поля-textarea `rounded-xl`,
  КНОПКИ и ЧИПЫ — pill `rounded-full`. Других радиусов нет.
- Тени: только `hover:shadow-sm`. Глубина — границами (§24).
- Шапка — sticky + `bg-background/80` + `backdrop-blur-xl`.
- Карточки ≤ 3 колонок на десктопе (§26).

## 4. Фокус и интерактив

- Глобальное фокус-кольцо: `:focus-visible { outline: 2px solid
  var(--color-primary); outline-offset: 2px }` — на всём, в обеих темах
  (dark: #bdc2ff, 10.9:1 на фоне). `outline-none` запрещён.
- Поля — `.input` (pill) / `.input-area` (textarea); граница `outline` →
  `primary` при фокусе.
- Кнопки: `.btn` (primary pill, hover `--color-primary-hover`: в light темнее,
  в dark светлее — контраст в hover только растёт); `.btn-ghost` (outline
  pill). Подписи кнопок — label-md. Ссылки в тексте — underline.
- Один акцентный элемент на поверхность: primary CTA один на секцию; CTA шапки
  — secondary-container, не второй primary.

## 5. Severity-семантика в UI (карта применения)

- `ReportPage` findings: `chip chip-{impact}` — единственное место, где
  красный/оранжевый допустимы как фон-подложка.
- Legal-basis блок отчёта: family moderate — информация о праве, не severity;
  без сумм штрафов (D-035).
- Empty/success-состояния (§37) объясняют и ведут дальше; ошибки (§38)
  спокойные, конкретные, с путём вперёд (`scanErrorMessage`).

## 6. Чего НЕ делаем (§57 + D-035 + D-072, гейты)

- Градиенты, glassmorphism, неон, блобы, 3D, декоративный motion, автоплей.
- Fear-копия и суммы штрафов — нигде (гейт `no-fine-amounts.test.mjs`).
- Выдуманные счётчики и телеметрия — включая скопированные из макетов
  («SCANNING ENGINE ACTIVE», «99.8% Audit Accuracy», «142 agencies»): числа
  только из реальных данных сборки (D-035/D-045; отклонения — D-072).
- Второй акцент, перекраска severity брендом, иконки-декорации, второй
  икон-стиль. Иконочная система — одна: inline-SVG stroke (~1.5–1.75),
  `currentColor` (D-068); логотип-глиф — в ней же. Material Symbols и любые
  CDN-ресурсы (шрифты, скрипты) — НЕ подключаются (CSP, self-host, D-063).
- Тёмная тема НЕ через class-toggle: только `prefers-color-scheme`;
  JS-переключатель — отдельное будущее решение владельца.

## 7. Верификация дизайна

Контраст палитры — не обещание, а гейт: `npm run audit-a11y` (axe, WCAG 2.2 AA
c явным `target-size`) — 36 страниц × **2 темы** (light + dark, emulateMedia;
полный набор шаблонов в dark, сэмплирования нет — палитра токенная, любой
цвет-«одиночка» может жить на любой странице), 0 нарушений. При смене палитры
чинится палитра, не проверка. Dark-проход доказан провал-способным канарейкой
(тёмный `on-surface-variant` → 8 [dark]-маршрутов красные, light нетронут).
Скрипт-проверка пар токенов — scratchpad `contrast-d072.mjs` (одноразовая,
значения в таблицах выше). Скриншоты итерации: scratchpad
`design/brand-{light,dark}-*.png` (2026-08-08).
