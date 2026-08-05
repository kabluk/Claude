# Архитектура — AccessAtlas

Обновлено: 2026-08-05 · Владелец: software-architect
Целевая архитектура платформы по модели «Directory → Decision Engine → Lead Marketplace → Vertical SaaS» (VISION.md).

## Обзор: один стек на все 4 слоя

Принцип **static-first + edge**: всё, что можно посчитать на билде — статично;
вся динамика — Cloudflare Workers + D1 + KV. Никаких серверов и БД для чтения каталога.

```
                        ┌─────────────────────────────────────────────┐
                        │  Cloudflare Pages (static, vite-react-ssg)  │
   Google/AI Overviews →│  383+ страниц: профили, страны, комбо,      │
                        │  услуги, стандарты, гайды  (слой 1 ✅)      │
                        │  + /scan UI, /report/:id UI  (слой 2)       │
                        │  + /rfq UI                    (слой 3)      │
                        │  + /dashboard UI              (слой 4)      │
                        └───────────────┬─────────────────────────────┘
                                        │ fetch
                        ┌───────────────▼─────────────────────────────┐
                        │  Cloudflare Worker (единый API)             │
                        │  POST /api/scan        → очередь скана      │
                        │  GET  /api/scan/:id    → отчёт (JSON)       │
                        │  POST /api/explain     → AI-пояснение       │
                        │  POST /api/lead        → RFQ →匹 агентства  │
                        │  POST /api/claim       → claim профиля      │
                        │  POST /api/stripe-hook → featured/подписка  │
                        └──┬──────────┬──────────┬───────────┬────────┘
                           │          │          │           │
                 Browser Rendering  D1 (scans, KV (cache,  Claude API
                 + axe-core         leads,      rate-limit) (Haiku:
                 (страница→находки) claims,                 пояснения)
                                    accounts)   Resend (email агентствам)
```

Данные каталога (`data/a11y/agencies.json` + `taxonomies.json`) остаются источником
истины и на билде запекаются в статические страницы и `agencies.index.json` для
клиентских фильтров и матчинга.

## Слой 1 — Directory (построен)

- React + Vite + `vite-react-ssg` + Tailwind v4; 383 страницы, JSON-LD, sitemap, порог
  индексации ≥3 листингов; конвейер данных collect → merge → enrich → validate → build.
- Осталось до запуска: применить enrich-патчи описаний, реквизиты Imprint, домен,
  деплой-конфиг (см. GRAPH.yaml, узлы A0-*).
- ORIGIN задаётся в двух местах: `src/lib/seo.tsx` и `scripts/gen-a11y-sitemap.mjs`.

## Слой 2 — Decision Engine (следующий большой шаг)

Воронка: **Scan → Report → AI-пояснения → Оценка стоимости → Сравнение агентств**.

1. **Сканер** (`POST /api/scan {url}`): Worker вызывает Cloudflare Browser Rendering,
   инжектит axe-core, прогоняет главную (+ до 5 внутренних страниц по sitemap),
   сохраняет результат в D1 (`scans`), id → клиенту. Rate-limit в KV (IP+домен),
   Turnstile от абьюза. Один скан ≈ секунды; тяжёлое — через Queues при росте.
2. **Отчёт** (`/report/:id`): статическая страница-шаблон, данные из `GET /api/scan/:id`.
   Группировка находок по WCAG-критериям, severity, счёт «impact score». JSON-LD нет
   (noindex — отчёты приватны по ссылке).
3. **AI-пояснения** (`POST /api/explain {ruleId, html}`): Claude Haiku объясняет проблему
   человеческим языком (на языке интерфейса) + примеры починки. Кэш пояснений по
   `ruleId × locale` в KV — 95% запросов бесплатны, ключ API не светится на клиенте.
4. **Оценка стоимости**: эвристика на клиенте — кол-во и тяжесть находок × размеры сайта
   × ценовые диапазоны из `taxonomies.json` → вилка «€X–Y за аудит + ремедиацию».
   Обязательный дисклеймер «оценка, не оферта».
5. **Сравнение агентств**: под отчётом — подбор из каталога по стране пользователя,
   стандарту (страна → закон из taxonomies), услуге (audit/remediation), бюджету.
   Это тот же `agencies.index.json`, что у фильтров. CTA → профили → RFQ (слой 3).

Сканер — лид-магнит: бесплатный, без регистрации, шарится ссылкой. Email просим только
для «прислать отчёт PDF / отслеживать прогресс» (вход в слои 3–4).

## Слой 3 — Lead Marketplace

- **RFQ-форма** (`POST /api/lead`): страна, стандарт, услуга, бюджет, сроки, URL
  (+ scanId, если пришёл из отчёта — агентство сразу видит объём работ).
- **Матчинг**: фильтр каталога по стране×услуге×бюджету → топ-3–5 агентств; письмо через
  Resend каждому; лид в D1 (`leads`) со статусами sent → responded → booked.
- **Claim-поток** (`POST /api/claim`): агентство забирает профиль (верификация по домену
  почты), правки через D1-оверлей, подхватываемый ежедневным ребилдом (cron GitHub Actions).
- **Платежи**: Stripe Payment Links (featured €59/мес, пакеты лидов) — без бэкенда;
  вебхук в Worker помечает featured в D1-оверлее.
- Outreach-актив: 99 агентств из гос-деклараций — повод для письма «вас назвали аудитором,
  заберите профиль».

## Слой 4 — Vertical SaaS

- **Аккаунты**: почтовый magic-link (без паролей), таблица `accounts` в D1.
- **Мониторинг**: Worker Cron re-scan сайтов клиента (нед/мес), дельта находок,
  email-дайджест «стало лучше/хуже».
- **Compliance Dashboard**: история сканов, чек-лист соответствия (EAA/BFSG/RGAA-статьи ↔
  автопроверяемые критерии + ручные пункты), хранение отчётов аудиторов (R2),
  напоминания о повторных проверках и сменах законов.
- Это подписка (€29–99/мес) и главный источник удержания: доступность — процесс, не кампания.

## Схемы данных

Каталог: `data/a11y/types.ts` (Agency, Taxonomies, CertBadge — не менять без DECISIONS).
Динамика (D1), черновик DDL — детали в INTERFACES.md:

```
scans(id, url, pages_json, findings_json, score, created_at, email?)
leads(id, scan_id?, country, standard, service, budget, deadline, contact, matched_json, status, created_at)
claims(id, agency_slug, email, verified, patch_json, status, created_at)
accounts(id, email, sites_json, plan, created_at)
featured(agency_slug, until, stripe_ref)
```

## Порядок строительства (почему такой)

1. **Фаза 0 — дозапуск каталога**: без домена и описаний ничего из слоёв 2–4 не имеет
   смысла (некуда вести трафик, нечего рекомендовать).
2. **Фаза 1 — сканер+отчёт+AI+оценка**: single-player value, не требует ни одного
   платящего агентства; создаёт петлю «скан → каталог».
3. **Фаза 2 — RFQ+claim+Stripe**: монетизация на готовом трафике и готовой базе агентств.
4. **Фаза 3 — SaaS**: аккаунты и re-scan поверх уже работающего сканера.

Инварианты: репозиторий = истина; каждый слой деплоится независимо; каталог никогда
не зависит от D1 (деградация: сканер упал — каталог жив).
