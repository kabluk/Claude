# BRAND BOOK — извлечённая спецификация визуальной системы AccessAtlas

Provenance: upload владельца 2026-08-08 — brand book + 31 Stitch-макет
(`stitch_premium_web_studio_design/*`: accessatlas_home[_light/_mobile/_v2],
agencies_directory*, accessibility_report*, scanning...*, scan_error_mobile_v2,
brand_book; сами макеты 8.7MB в репозиторий сознательно НЕ включены — жили в
scratchpad сессии). Прямое указание владельца: «Примени brand book и дизайн из
этих примеров». Уточняет §24–29 конституции; палитру D-063 заменяет, принципы
D-063 (семантическая severity, всегда видимый фокус, tabular-nums,
контраст-гейт) сохраняет. Решение — `DECISIONS.md` D-072; применение — узел
`CN-BRANDBOOK` в `GRAPH.yaml`; реализация токенов — `src/styles.css`.

Значения ниже — извлечены из `code.html` макетов, НЕ выдуманы. Severity-шкалы
в макетах нет (кроме error) — она подобрана нами в тон обеим темам и посчитана
скриптом (см. `domains/design.md` §1).

## 1. Палитра — LIGHT (по умолчанию)

| Токен | Hex |
|---|---|
| primary | `#4f5bd5` |
| on-primary | `#ffffff` |
| primary-container | `#e0e0ff` |
| on-primary-container | `#00006e` |
| secondary-container | `#e1e0f9` |
| on-secondary-container | `#181a2c` |
| background | `#ffffff` |
| surface | `#fcf8fb` |
| surface-container-low | `#f6f2f5` |
| surface-container | `#f1edf0` |
| on-surface | `#1c1b1f` |
| on-surface-variant | `#46464f` |
| outline | `#777680` |
| outline-variant | `#c7c5d0` |
| error | `#ba1a1a` |
| on-error | `#ffffff` |
| error-container | `#ffdad6` |

## 2. Палитра — DARK (`prefers-color-scheme: dark`)

| Токен | Hex |
|---|---|
| primary | `#bdc2ff` |
| on-primary | `#121f8b` |
| primary-container | `#5e6ad2` |
| on-primary-container | `#fdfaff` |
| secondary-container | `#3d4285` |
| on-secondary-container | `#adb2fd` |
| background | `#121315` |
| surface | `#121315` |
| surface-container-low | `#1b1c1d` |
| surface-container | `#1f2021` |
| on-surface | `#e3e2e3` |
| on-surface-variant | `#c6c5d5` |
| outline | `#908f9e` |
| outline-variant | `#454652` |
| error | `#ffb4ab` |
| on-error | `#690005` |
| error-container | `#93000a` |

Правило тем: токены объявляются один раз в `@theme` (light) и переопределяются
в dark-блоке; компоненты стилизуются ТОЛЬКО токенами. Ни один цвет не живёт
только в dark-ветке.

## 3. Типографика

- **Гротеск: Inter** (variable, self-hosted `@fontsource-variable/inter`).
  ⚠ Расхождение источника: brand book визуально подписывает гарнитуру «Geist»,
  но код ВСЕХ 31 макетов использует Inter — взят Inter (D-072).
- **Моно: JetBrains Mono** (variable woff2, self-hosted
  `@fontsource-variable/jetbrains-mono`, в UI используется weight 500 для
  лейблов; CDN Google Fonts из макетов НЕ переносится — CSP/self-host, D-063).
- Type-scale:

| Стиль | Размер/интерлиньяж | Tracking | Вес | Применение |
|---|---|---|---|---|
| display-lg | 48/52 | −0.04em | 700 | hero (`.display`) |
| headline-lg | 32/40 | −0.02em | 600 | h1 страниц (`.h1`) |
| headline-md | 24/32 | −0.02em | 600 | h2 секций (`.h2`) |
| body-lg | 16/24 | 0 | 400 | основной текст |
| body-md | 14/20 | 0 | 400 | вторичный текст (`text-sm`) |
| label-md | 12 | 0.05em | 500, mono, uppercase | кнопки, чипы-метки, mono-подписи (`.label`) |

## 4. Форма и компоненты

- **Кнопки — pill** (`rounded-full`), подпись — label-md (JetBrains Mono,
  uppercase). Primary CTA — `primary`/`on-primary`; вторичная в шапке —
  `secondary-container`/`on-secondary-container` (макет home).
- **Карточки/панели — компактные радиусы** 0.125–0.5rem (переопределённая
  шкала `--radius-*`: sm .125 / md .25 / lg .375 / xl .5rem); подложка
  `surface-container-low`, глубина границей `outline-variant`, не тенью.
- **Поля ввода** — pill (`.input`), многострочные — `rounded-xl`
  (`.input-area`); граница `outline`, фокус — глобальное кольцо + `primary`.
- **Шапка** — sticky, `bg-background/80` + лёгкий `backdrop-blur`, нижняя
  граница `outline-variant`.
- **Логотип** — скруглённая плашка `primary` (32px) с БЕЛЫМ stroke-SVG глифом
  карты (свой inline-SVG в иконочной системе проекта: stroke, currentColor,
  1.75). В dark плашка `primary-container`, глиф остаётся светлым (токены
  `brand-plate`/`brand-glyph`). Material Symbols из макетов НЕ подключается
  (иконочный шрифт с CDN; §29 — один икон-стиль).
- **Mono-чипы** (`.chip`) — метки/фасеты/статусы: label-md в pill с границей.

## 5. Что из макетов сознательно НЕ перенесено

Полный список отклонений с причинами — D-072 (раздел «Отклонения»). Кратко:
CDN-шрифты и Material Symbols (self-host/CSP/§29), тёмная тема классом
`darkMode: class` (у нас `prefers-color-scheme`, §28 — без JS-переключателя),
выдуманная телеметрия («SCANNING ENGINE ACTIVE», «99.8% Audit Accuracy»,
«ACCESSATLAS CORE V2.4.0») — против D-035/D-045, счётчиков без источника не
показываем; фиктивные числа макетов (142 агентства, 36 стран) — у нас реальные
из сборки. `pitch_deck_*` (10 макетов) — ОТДЕЛЬНЫЙ артефакт для инвесторов,
не сайт: зафиксирован строкой в `BACKLOG.md`, в D-072 не применялся.
