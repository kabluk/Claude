# Домен: frontend

Обновлено: 2026-08-05 · Владелец: frontend-engineer (**+ UX/UI-дизайн, явно, D-011** —
в ролях `claude-project-orchestrator` нет отдельной UX-роли, это не значит «дизайн
не делает никто»)

- Стек: React 18 + Vite + `vite-react-ssg` + Tailwind v4. 385 страниц (14 шаблонов
  каталога + `/scan`), маршруты + `getStaticPaths` в `src/routes.tsx`.
- SEO-слой: `src/lib/seo.tsx` (**ORIGIN-заглушка `accessatlas.example` — менять при
  домене вместе со `scripts/gen-a11y-sitemap.mjs`**), JSON-LD 5 типов, порог ≥3.
- Иерархия заголовков проверена скриптом на всех страницах (h1→h3 баг закрыт).
  Собственная axe-чистота — `npm run audit-a11y`, 0 нарушений (перепроверено 2026-08-06
  после того как заявление от 2026-08-05 оказалось ложным — D-014, реальный баг
  контраста `text-slate-400` на трёх страницах, исправлен на `text-slate-500`).
- Клиентские фильтры: `FilterableList.tsx` поверх SSG — без JS список виден целиком.

## A1-REPORT — сделано (2026-08-06, review)

`/report/:id` (`src/pages/ReportPage.tsx`) + `src/lib/scanner.ts` (типы, fetch-хелперы,
`groupFindingsByRule`, `formatWcagTag` для axe-тегов — **не** таксономия каталога).
Клиентский маршрут (id непредсказуем, нет `getStaticPaths`, как `/404`). Все 5
UX-требований из VISION.md выполнены:
1. Асинхронный прогресс — не спиннер: «Scanned N pages so far», растёт по мере
   поллинга (`POLL_INTERVAL_MS = 2500`), `aria-live="polite"`.
2. Находки переведены на язык бизнеса частично — WCAG-теги/severity понятны
   технически подкованному пользователю; перевод в бизнес-язык — задача A1-EXPLAIN.
3. У каждого `errorCode` — свой текст (`scanErrorMessage`), не общий (D-013: добавлен
   `errorCode` в контракт `ScanReport`, `worker/lib/errors.js`).
4. Отчёты — `index={false}` (noindex), приватная ссылка.
5. Дисклеймер «не сертификация» — обязателен, не факультативен (D-006).

Верификация: 6 состояний (running/done-with-findings/done-clean/error/not-found/
scanner-unavailable) прогнаны через Playwright с подменёнными `page.route()` ответами
API против реального dev-сервера — 0 нарушений axe-core на каждом. Это и поймало
баг из D-014 (первый прогон показал нарушение на `done`, что и вскрыло проблему в
`audit-own-a11y.mjs`). `VITE_SCANNER_API` — новая build-переменная (`.env.example`,
`src/vite-env.d.ts`) — без неё страница рендерится с понятным «сканер не настроен»,
не падает сборка.

## A1-LANDING — сделано (2026-08-06, review)

`/scan` (`src/pages/ScanPage.tsx`) + `src/components/TurnstileWidget.tsx`. Обычная
статическая пререндерящаяся страница (не client-only — в отличие от `/report/:id`,
путь фиксирован, `getStaticPaths` не нужен), добавлена в `scripts/gen-a11y-
sitemap.mjs`. Ссылка «Scan your site» в `Layout.tsx` — выделенный `.btn` справа
от навигации, а не рядовой пункт меню (это точка входа в воронку, VISION.md).

- Форма: URL-инпут + клиентская валидация (`isValidScanUrl` — дублирует
  `worker/routes/scan.js::isHttpUrl` вручную, D-015) до сетевого запроса.
- `TurnstileWidget`: не рендерится без `VITE_TURNSTILE_SITE_KEY` (форма всё равно
  рабочая — сервер сам пропускает проверку без `TURNSTILE_SECRET_KEY`, degradation
  симметричен). Реальный внешний скрипт `challenges.cloudflare.com` не тестировался
  в этой песочнице (тот же сетевой барьер, что у Browser Rendering в D-010).
- Честный раздел «What this does — and doesn't — do»: explicitly без email-поля —
  `POST /api/scan` принимает `email`, но сервер с ним пока ничего не делает,
  обещать в UI было бы враньём (D-015).

Верификация: 4 сценария живьём через Playwright (`page.route()` подмена) против
dev-сервера — idle-рендер (axe-чисто), невалидный URL (0 сетевых вызовов, axe-чисто
на error-состоянии), успешный сабмит → реальная навигация на `/report/abc123/`,
серверная ошибка 429 → текст виден пользователю (axe-чисто).

## Предстоит (Фаза 1)

- Блок «подходящие агентства» под отчётом (A1-MATCH) + доверие в UI каталога: бейджи
  верификации и ссылки-доказательства на карточке (данные `sourceRefs`/`lastVerified`
  уже есть, UI ещё не спроектирован).
- Оценка стоимости (A1-COST) — эвристика × price bands, с дисклеймером.
- Перевод находок на язык бизнеса (A1-EXPLAIN, backend) — сейчас `/report/:id`
  показывает технические WCAG-теги, не объяснение «что случится, если не чинить».

## Отложено

- Мультиязычный интерфейс (en/de/fr/pl + hreflang) — сейчас EN-only.
- Design-система как явные решения (цвета/типографика/motion/dark mode) — TBD,
  сейчас имплицитно через Tailwind-дефолты, не задокументирована.
