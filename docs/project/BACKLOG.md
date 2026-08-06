# BACKLOG

Обновлено: 2026-08-05. Атомарные задачи. Приоритет = фаза. Текущий срез графа —
`GRAPH.yaml` (узлы A0-*/A1-*). Статусы: todo / ready / blocked / done.

## Фаза 0 — дозапуск каталога

| ID | Задача | Владелец | Зависит от | Статус |
|---|---|---|---|---|
| A0-ENRICH | Применить enrich-патчи (119 записей, +170 описаний), починить slug `the-pixel`, валидация+сборка | data-engineer | — | **done** |
| A0-DESC-REST | Дописать описания оставшимся ~53 профилям (обход сайтов, только факты) | data-engineer | A0-ENRICH | **done** |
| A0-CI-FIX | Починить CI: недостающие `lint:upl`/`lint:minimize`/`check-links.mjs` (package-lock.json уже добавлен) | devops-engineer | — | **done** |
| A0-OWNER-LEGAL | Реквизиты Imprint (юрлицо/ФИО, адрес, HR/VAT для DE) + покупка домена | **владелец** | — | blocked (ввод владельца) |
| A0-ORIGIN | Заменить `accessatlas.example` в `src/lib/seo.tsx` + `scripts/gen-a11y-sitemap.mjs`, снять noindex с Imprint | frontend-engineer | A0-OWNER-LEGAL | blocked |
| A0-DEPLOY | Конфиг Cloudflare Pages + деплой из CI по push в `accessatlas` | devops-engineer | A0-OWNER-LEGAL | blocked (ждёт только владельца) |
| A0-GSC | Google Search Console: sitemap, мониторинг индексации первую неделю | growth-strategist | A0-DEPLOY | todo |

## Фаза 1 — Decision Engine

| ID | Задача | Владелец | Зависит от | Статус |
|---|---|---|---|---|
| A1-SCAN | Worker: `POST /api/scan` + Browser Rendering + axe-core → D1; rate-limit, Turnstile | backend-engineer | — (техн. независим) | **review** (код готов, живой прогон на реальном CF-аккаунте ждёт) |
| A1-REPORT | UI `/report/:id`: находки по WCAG, severity, score, шаринг + async-прогресс + error-состояния (VISION.md UX 2,4) | frontend-engineer | A1-SCAN | **review** (готов и верифицирован, ждёт A1-SCAN done) |
| A1-LANDING | Лендинг сканера `/scan`, форма URL, Turnstile, ссылка из шапки, честный прогноз времени | frontend-engineer | — (техн. независим) | **review** (готов, 4 сценария верифицированы; реальный Turnstile-виджет не тестировался — сетевой барьер песочницы) |
| A1-EXPLAIN | `POST /api/explain`: Claude Haiku + KV-кэш ruleId×locale, язык бизнеса, не сырой ruleId (VISION.md UX 3) | backend-engineer | A1-SCAN | todo |
| A1-COST | Оценка стоимости (эвристика × price bands) + дисклеймер | frontend-engineer | A1-REPORT | todo |
| A1-MATCH | Блок «подходящие агентства» под отчётом + CTA в каталог + бейджи верификации на карточке (VISION.md UX 5) | frontend-engineer | A1-REPORT | todo |
| A1-PRIVACY | Обновить Privacy (сканы, email, D1) | product-lead | A1-SCAN | todo |

## Фаза 2 — Lead Marketplace

| ID | Задача | Владелец |
|---|---|---|
| A2-LEAD | RFQ-форма + `POST /api/lead` + матчинг + Resend | backend + frontend |
| A2-CLAIM | Claim-поток с верификацией по домену почты, D1-оверлей + ежедневный ребилд | backend-engineer |
| A2-STRIPE | Payment Links (featured, пакеты лидов) + вебхук | backend-engineer |
| A2-OUTREACH | Письма 99 агентствам из деклараций «заберите профиль» | growth-strategist |

## Фаза 3 — Vertical SaaS

| ID | Задача |
|---|---|
| A3-AUTH | Magic-link аккаунты |
| A3-CRON | Re-scan по расписанию + дельта + дайджест |
| A3-DASH | Compliance Dashboard (чек-листы, история, R2-хранилище отчётов) |

## Growth (параллельно, не блокирует)

| ID | Задача |
|---|---|
| G-I18N | Интерфейс en/de/fr/pl + hreflang |
| G-GUIDES | Новые гайды под кластеры BFSG/EAA/VPAT |
| G-PRICE | Прайс-бенчмарк (сейчас цены у 4/253 — нужен для сужения вилок A1-COST) |
