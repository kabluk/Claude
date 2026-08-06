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
| A1-SCAN | Worker: `POST /api/scan` + Browser Rendering + axe-core → D1; rate-limit, Turnstile | backend-engineer | — (техн. независим) | **done** (реально задеплоен на аккаунт владельца 2026-08-06, живой скан example.com нашёл настоящие находки, D-021) |
| A1-REPORT | UI `/report/:id`: находки по WCAG, severity, score, шаринг + async-прогресс + error-состояния (VISION.md UX 2,4) | frontend-engineer | A1-SCAN | **done** (готов, верифицирован; A1-SCAN done, реальный ScanReport совпал с контрактом) |
| A1-LANDING | Лендинг сканера `/scan`, форма URL, Turnstile, ссылка из шапки, честный прогноз времени | frontend-engineer | — (техн. независим) | **review** (готов, 4 сценария верифицированы; реальный Turnstile-виджет не тестировался — сетевой барьер песочницы) |
| A1-EXPLAIN | `POST /api/explain`: Claude Haiku + KV-кэш ruleId×locale, язык бизнеса, не сырой ruleId (VISION.md UX 3) | backend-engineer | A1-SCAN | **done** (владелец одобрил ключ, live-прогон нашёл и исправил настоящий баг парсинга — markdown-фенс, D-020; секрет теперь и в проде, D-021) |
| A1-COST | Оценка стоимости (эвристика × price bands) + дисклеймер | frontend-engineer | A1-REPORT | **done** (готов, 5 сценариев верифицированы живьём против ручного расчёта; A1-REPORT done) |
| A1-MATCH | Блок «подходящие агентства» под отчётом + CTA в каталог + бейджи верификации на карточке (VISION.md UX 5) | frontend-engineer | A1-REPORT | **done** (готов, 5 сценариев верифицированы живьём против реальных данных; A1-REPORT done) |
| A1-PRIVACY | Обновить Privacy (сканы, email, D1) | product-lead | A1-SCAN | **done** (текст сверен с реальным кодом worker/, не с предположением) |
| A1-RETENTION | Cron Trigger: удалять сканы старше 90 дней (RISKS.md R6) | backend-engineer | — | **review** (задеплоено 2026-08-06, Cron Trigger подтверждён зарегистрированным на реальном аккаунте; первое срабатывание 03:00 UTC ещё не пронаблюдано, D-019/D-021) |

## Фаза 2 — Lead Marketplace

Разбита на 13 узлов в `GRAPH.yaml` 2026-08-06 (D-022) — см. там owner/depends_on/
verify/approval_required для каждого. Сводка (детали в GRAPH.yaml):

| ID (backlog) | Sub-узлы GRAPH.yaml | Владелец | Approval |
|---|---|---|---|
| A2-LEAD | `A2-LEAD-SCHEMA` → `A2-LEAD-API` → `A2-LEAD-EMAIL`; `A2-LEAD-FORM` (независим) | backend + frontend | EMAIL требует Resend (approval) |
| A2-CLAIM | `A2-CLAIM-SCHEMA` → `A2-CLAIM-API` → {`A2-CLAIM-EMAIL`, `A2-CLAIM-REBUILD`} | backend + devops | EMAIL (Resend) и REBUILD (прод-деплой) требуют approval |
| A2-STRIPE | `A2-STRIPE-SCHEMA` → `A2-STRIPE-WEBHOOK-CODE` → `A2-STRIPE-LIVE` | backend + devops | LIVE требует Stripe (approval) |
| A2-OUTREACH | `A2-OUTREACH-PREP` → `A2-OUTREACH-SEND` | growth-strategist | SEND требует Resend + рассылка (approval) |

Статус на 2026-08-06: `A2-STRIPE-SCHEMA` и `A2-STRIPE-WEBHOOK-CODE` — **done**
(`migrations/0005_featured.sql` + `worker/routes/stripeHook.js` +
`worker/lib/stripeSig.js`: `POST /api/stripe-hook` реально проверяет подпись
Stripe (Stripe-Signature: t=…,v1=…, HMAC-SHA256 над `"{t}.{raw_body}"`,
константное сравнение, tolerance на replay) и по `checkout.session.completed`
апсертит `featured` через `ON CONFLICT(agency_slug) DO UPDATE`. 24 новых
юнит-теста на синтетическом секрете, 89/89 `worker:test` зелёные; живьём
через `wrangler dev --local` + `wrangler d1 execute --local` на реальной D1:
поддельная подпись отклонена, валидное событие обновило `featured.until`,
продление (второй event) обновило ту же строку — детали `domains/backend.md`.
Разблокировало `A2-STRIPE-LIVE`, approval всё ещё нужен на нём отдельно.
`A2-LEAD-SCHEMA` — **done** (`migrations/0003_leads.sql`,
поля 1:1 с INTERFACES.md §4, `db:migrate:local` + `worker:test` 39/39 зелёные;
разблокировало `A2-LEAD-API`). `A2-LEAD-FORM` — **done** (RequestQuotePage +
LeadForm + leadForm.ts; клиентская валидация, client-only превью совпадений через
уже готовый `matchAgencies()`, 0 сетевых вызовов при submit; `/request-quote/`
добавлена в постоянный CI a11y-гейт и sitemap, плюс закрыт orphan-page пробел —
CTA «Request a quote» добавлен в `MatchedAgencies.tsx` на `/report/:id`, страница
раньше была недостижима ни по одной ссылке в UI). `A2-LEAD-API` — **done**
(`worker/routes/lead.js` + `worker/lib/matchAgenciesServer.js`: POST /api/lead
реально пишет в D1 `leads` и возвращает `{leadId, matched: slug[]}` по тому же
алгоритму, что и `matchAgencies.ts`; rate-limit 5/ч на IP и Turnstile-паттерн
скана переиспользованы; email агентствам НЕ отправляется, только TODO —
реальная отправка это отдельный `A2-LEAD-EMAIL`, approval_required. 65/65
worker:test, живьём проверено через `wrangler dev --local` + прямой `SELECT`
из D1, детали в `domains/backend.md`). `A2-OUTREACH-PREP` — **done**
(`research/outreach-99.json`, 96 реальных агентств из деклараций; 5 параллельных
субагентов с WebFetch нашли 82/96 реальных публичных email, 14 честно `null` с
объяснением; черновик письма без отправки — детали в `domains/growth.md`).
Попутно найден дополнительный блокер для `A2-OUTREACH-SEND`, не только Resend:
письмо ссылается на реальный домен (которого пока нет) и упирается в то же
требование Imprint-идентичности, что RISKS.md R2, применительно к email, не
только к сайту. `A2-CLAIM-SCHEMA` — **done** (`migrations/0004_claims.sql`,
поля 1:1 с INTERFACES.md §4; применена локально, схема и реальный INSERT/SELECT
подтверждены живьём через `wrangler d1 execute`; разблокировало `A2-CLAIM-API`).
`A2-STRIPE-SCHEMA` — **done** (`migrations/0005_featured.sql`; `agency_slug` PK
подтверждён живьём — повторный INSERT с тем же slug реально упал на UNIQUE
constraint, не просто предположение по DDL; разблокировало
`A2-STRIPE-WEBHOOK-CODE`). `A2-CLAIM-API` — **done** (2026-08-06, D-023):
`worker/routes/claim.js` — `POST /api/claim` пишет `claims` в D1 и возвращает
`{claimId}`, тот же стиль, что `lead.js`/`stripeHook.js` (D1 прямо в routes/,
rate-limit 5/ч на IP, Turnstile-паттерн skip-без-секрета). `agencySlug`
валидируется против реального `agencies.json` — неизвестный slug → 400. Email
агентствам НЕ отправляется (`A2-CLAIM-EMAIL`, approval). Найдено и явно
зафиксировано архитектурное решение: контракт возвращает `claimId` вызывающему
немедленно, а verify-ссылка (будущий `A2-CLAIM-EMAIL`) должна нести отдельный
секрет — если бы это было одно и то же значение, вызывающий получал бы
«доказательство владения почтой» прямо из ответа API, не переходя по ссылке.
Добавлен отдельный `token`-столбец (`migrations/0006_claim_token.sql`, вне
буквального scope узла, раскрыто явно) вместо повторного использования
`patch_json`. 14 новых тестов, 103/103 `worker:test`; живьём через `wrangler
dev --local` + прямой `SELECT`/`DELETE` из реальной локальной D1 — детали
`domains/backend.md`. Разблокировало (технически) `A2-CLAIM-EMAIL`/
`A2-CLAIM-REBUILD`, approval на обоих остаётся отдельным гейтом.
Остальные `approval_required: false` узлы Фазы 2 — все закрыты.
Все `approval_required: true` узлы (`A2-LEAD-EMAIL`, `A2-CLAIM-EMAIL`,
`A2-CLAIM-REBUILD`, `A2-STRIPE-LIVE`, `A2-OUTREACH-SEND`) заблокированы до
явного разрешения владельца — Resend и Stripe одобряются раздельно, per-node.

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
