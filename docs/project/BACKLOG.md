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

Владелец явно одобрил Resend 2026-08-06 для трёх узлов разом (`A2-LEAD-EMAIL`,
`A2-CLAIM-EMAIL`, `A2-OUTREACH-SEND` — по AskUserQuestion, не общее «ОК»,
зафиксировано D-024). `A2-CLAIM-EMAIL` — **done**: `worker/lib/resend.js` +
verify-ссылка (`claims.token`, не `claimId`, D-023) + новый эндпоинт `GET
/api/claim/verify` (иначе ссылка вела бы в никуда — тот же принцип, что
D-015). Живьём реальным ключом: письмо реально дошло на email владельца,
переход по verify-ссылке реально перевёл `claims.verified` 0→1 в D1. `A2-LEAD-
EMAIL` — **done** (D-025): владелец выбрал слать только claimed+verified
среди совпавших агентств (не добавлять email в agencies.json, не морозить
узел) — `findClaimedEmails()` ищет по `claims.email`+`verified=1`,
незаявленные агентства ничего не получают. Живьём: реальный claim+verify
агентства, затем совпавший с ним лид реально вызвал уведомление без ошибок;
лид без claimed-совпадений прошёл без единого письма, без сбоя. `A2-OUTREACH-
SEND` — по-прежнему заблокирован (не Resend, а отсутствующий домен). Общая
находка (D-024): sandbox-домен Resend
(`onboarding@resend.dev`) может слать только на email владельца аккаунта
Resend, реальным третьим лицам — только после верификации собственного
домена (A0-ORIGIN). Секрет НЕ загружен в прод — с этим ограничением это была
бы частично рабочая, вводящая в заблуждение функция.

Владелец также одобрил `A2-CLAIM-REBUILD` и `A2-STRIPE-LIVE` «в проде»
2026-08-06. `A2-CLAIM-REBUILD` — **review**: `scripts/apply-d1-overlay.mjs`
написан и живьём проверен против реальной локальной D1 (claimed/featured,
снятие истёкшего featured, идемпотентность — всё подтверждено, не только по
коду). Не done: реальный CI-cron не подключён — `A0-DEPLOY` (цель деплоя)
сам ещё заблокирован `A0-OWNER-LEGAL`, подключать расписание сейчас значило
бы либо падать без секрета, либо собирать в пустоту. Approval сохраняется на
будущее (D-026). Попутно: `worker:test`/`scripts:test` добавлены в `ci.yml`
— не запускались в CI вообще до этого прохода, реальный пробел.
`A2-STRIPE-LIVE` — **in progress** (2026-08-06, D-027): владелец выбрал
создавать Payment Link вручную в Stripe Dashboard (не через API,
`STRIPE_SECRET_KEY` не нужен вовсе) и сузил scope до одного продукта —
featured €590/год, разовый платёж (месячная подписка и lead-пакет явно
отложены). Это меняет извлечение agency_slug из webhook: Dashboard-ссылка не
несёт динамическую metadata, поэтому slug собирается через Stripe custom
field (`session.custom_fields`, не `session.metadata`), валидируется против
реального каталога, `until` считается на сервере (today+365), не берётся из
данных клиента. `worker/routes/stripeHook.js`/`.test.mjs` переписаны и живьём
проверены на реальной локальной D1 (валидный slug создал featured-строку,
повторный платёж продлил её же, опечатка — 0 записей + залогирована).
`worker:test` 122/122, typecheck и `wrangler deploy --dry-run` чистые.
**Обновление (D-028)**: владелец уже настроил Payment Link и сделал реальный
тестовый платёж ($10, Apple Pay) — прислал настоящий JSON события. Реальный
`key` custom field оказался НЕ `agency_slug`, а `yourslugaccessatlas` (Stripe
генерирует key из label только при первом сохранении поля, не пересчитывает
при переименовании текста) — `CUSTOM_FIELD_KEY` в коде исправлен под
подтверждённое реальное значение, Dashboard трогать не пришлось. Добавлен
регрессионный тест на путаницу label/key. `worker:test` 123/123. Остаётся
ровно одно: владелец должен настроить webhook endpoint в Dashboard и передать
реальный `STRIPE_WEBHOOK_SECRET` для `wrangler secret put`.

## Сканер: разрыв с тем, что реально проверяют регуляторы (research 2026-08-06, **закрыто 2026-08-06**)

Ресёрч по запросу владельца. Все 9 узлов ниже — **done**, реализованы
последовательно по прямому приоритету владельца ("Начинай все по порядку"),
детали в `GRAPH.yaml` (узлы `A3-STATEMENT`…`A3-JURISDICTION`), `DECISIONS.md` D-030,
`domains/backend.md`. Вывод, с которого начался этот раздел: наш сканер измерял
не то, с чего начинают надзорные органы — теперь измеряет и то, и другое.

`A3-JURISDICTION` **расширен тем же днём (D-031)**: с 5 до 13 юрисдикций
(+IT/IE/AT/BE/SE/DK/FI/NO — отобраны по реальному покрытию каталога, каждая
с законом транспозиции EAA, подтверждённым по официальному правовому порталу
страны, не по агрегатору). GB/US/CA/AU/CH/IN сознательно не включены —
другая правовая база, задокументировано явно в коде, не пробел.

`A3-JURISDICTION-OVERRIDE` **done тем же днём (D-032)**: явный выбор страны на
`/scan` перебивает TLD (нужен для `.com`-сайтов, которые по домену не
определяются вовсе). **Попутно найдено и исправлено**: `jurisdictionNote`
считался с D-030, но фронтенд про него не знал — вся фича была невидима
пользователю две итерации подряд при зелёных worker-тестах. Плюс закрыт тот же
CI-пробел, что был у `worker/`/`scripts/`: тесты в `src/**` не запускались
вообще (`npm run src:test` добавлен).

**Что проверяют первым.** Немецкий орган надзора (MLBF, Магдебург; работает с
октября 2025, первые дела о штрафах идут) действует двумя путями — реактивно по
жалобам (приоритет) и рисковой выборкой, частично автоматизированной. Первое,
что смотрят — **заявление о доступности** (`Barrierefreiheitserklärung`): по
Anlage 3 к §14 BFSG обязано быть на видном месте и содержать 4 пункта (описание
услуги в доступном формате; пояснения к оказанию; описание *как именно*
выполняются требования; указание надзорного органа). Штрафы — потолки, не
тарифы: §37 BFSG до €100 000 (составы Abs. 1 Nr. 1/7/8/9/10), до €10 000 для
остальных; Франция €7 500 (€15 000 повтор) + отдельно €25 000/год за
отсутствующее заявление; Испания ступенчато €301–€1 000 000. EAA в силе с
28.06.2025, единой ставки по ЕС нет.

⚠ Источники по страновым суммам — во многом блоги вендоров a11y-инструментов, у
которых интерес пугать. §37 BFSG и Anlage 3 — законодательные. **Перед выводом
любых сумм в клиентский отчёт сверить с первоисточниками**, иначе мы сами
становимся тем fear-marketing, от которого отстраиваемся (R1/позиционирование).

⚠⚠ **Итог этой проверки — D-035: суммы не выводятся НИГДЕ и никогда.** Цифры
выше остаются здесь как след исследования (почему решение именно такое), а не
как материал для страниц. При D-041 нашлась копия, которую D-035 пропустил:
суммы всё ещё стояли в немецком гайде `bfsg-pflichten-guide.md`, включая
FAQPage-разметку — решение применили к коду и забыли про контент. Убрано.

**Дыра, найденная при этом (тот же класс, что D-014).** Сайт без заявления о
доступности, но с чистым axe, получает от нас **100/100** (`score.js:10` —
`if (!findings.length) return 100`; axe-core наличие заявления не проверяет в
принципе). То есть максимальную оценку получает ровно тот сайт, который первым
попадёт под проверку. Ложноотрицательный результат на самом дорогом пункте.
Плюс axe ловит ≈57% WCAG-проблем (бенчмарк Deque, отраслевая база 30–40%), а
не-WCAG части EN 301 549 не автоматизируются вообще.

| ID | Задача | Приоритет | Статус |
|---|---|---|---|
| A3-STATEMENT | Детект заявления о доступности: шаблоны ссылок/страниц (de/en/fr/nl/pl), достижимость с главной, наличие 4 пунктов Anlage 3, указание надзорного органа. Бинарно, без ложных срабатываний | **высокий** — юридически решающее, полностью автоматизируемое, отсутствует | **done** |
| A3-FEEDBACK | Доступный канал обратной связи (EAA требует минимум один) | высокий | **done** |
| A3-PDF | Детект ссылок на PDF (в scope EAA, почти всегда недоступны) | средний, тривиален | **done** |
| A3-REFLOW | Reflow на 320px (WCAG 1.4.10) — viewport + проверка горизонтального скролла. axe не умеет, а Puppeteer у нас уже есть | высокий | **done** |
| A3-KEYBOARD | Клавиатурная навигация: прогон Tab, `document.activeElement`, focus trap, невидимый фокус | высокий | **done** |
| A3-MEDIA | Автовоспроизведение (1.4.2), `<video>` без `<track kind="captions">` | средний | **done** |
| A3-RESIZE | Увеличение текста 200% (1.4.4) — обрезка/наложение | средний | **done** |
| A3-PAGESELECT | Выбор страниц: сейчас первые 5 ссылок с главной (`axe.js:43`). Жалобы и надзор бьют по транзакционным флоу (корзина, вход, форма) — EAA прямо про e-commerce. Приоритизировать страницы с формами | высокий | **done** |
| A3-COOKIEBANNER | Cookie-баннер перекрывает страницу → axe видит не тот DOM. Классический ложноотрицательный, ровно как file:// в D-014 | высокий | **done** |
| A3-JURISDICTION | Взвешивать severity по юрисдикции, не только по axe impact (страны в каталоге уже есть). «Нет заявления → §37 BFSG, до €100k» ≠ «color-contrast: serious» | средний | **done** |

Реализация 2026-08-06 (все 9 узлов, детали `GRAPH.yaml`/`DECISIONS.md` D-030/
`domains/backend.md`): `worker/lib/statement.js`, `feedback.js`, `pdf.js`,
`domChecks.js` (reflow/keyboard/media/resize/cookie-banner — общий модуль, общая
живая проверка реальным Chromium через Playwright), `links.js::pickPriorityLinks`,
`jurisdiction.js`; всё подключено в `worker/lib/axe.js`/`worker/routes/scan.js`.
168/168 `worker:test` (было 123), typecheck/build чистые. Побочно исправлены 2
реальных бага, найденных живой проверкой не по буквальному scope задач: (1)
`sameOriginLinks()` матчила `href` любого тега, не только `<a>` — ловила
`<link rel=preload>` (шрифты) как "страницы"; (2) A3-KEYBOARD's невидимый-фокус
проверка читала `activeElement` уже после того, как фокус мог уйти на `<body>`,
ложно флагая страницы с реальным видимым outline.

Замечание: мы добываем 99 агентств *из государственных деклараций доступности*
как уникальный дата-актив (`domains/data.md`) — то есть знаем, как эти документы
выглядят, но в собственном продукте их наличие не проверяем.

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
| G-PRICE | Прайс-бенчмарк — **done** (2026-08-06, D-045): 245/245 проверены, `priceBand` 17/245, у каждой записи URL прайса + цитата суммы; 31 публикует цену не за аудит, 197 не публикует вовсе. Остаток: `akse`/`access-first` — цена опубликована, но не определяет один бэнд (см. D-045) |

## Немецкий рынок (2026-08-06, D-040/D-041)

| ID | Задача | Владелец | Статус |
|---|---|---|---|
| DE-JURIS-NOTE-FIX | Правовая пометка не доходила до находки «заявления нет вообще» | backend-engineer | **done** (D-040) |
| DE-ENTRY | `/bfsg-check/` — связный вход: скан → §14 BFSG → названные в декларациях прюферы | frontend-engineer | **done** (D-041) |
| DE-PAGE-GATE | Тест: новая страница не выпадает из sitemap/a11y-аудита молча | qa-engineer | **done** (D-041) |
| DE-COPY-REVIEW | Немецкий текст `/bfsg-check/` вычитан носителем, 7 правок внесены; отклонены 3 усиливающих формулировки, исправлено фактическое утверждение про `.com` | frontend-engineer | **done** (D-049) |
| G-CERT-EVIDENCE | Перепроверить `evidenceUrl` всех 96 записей и развести декларантов. Сделано: 96/96 открыты вживую, `kind` → `statement-named-auditor` + `declarant` (81 public-body / 13 private / 2 unknown), 9 самоаттестаций заменены записями госреестра NL, инвариант «не свой домен» стал ошибкой сборки | data-engineer | **done** (D-042) |
| G-CERT-UNKNOWN | Два декларанта не идентифицированы по самой странице: `uxmen` → toekomstparochiekerken.be («Platform Toekomst Parochiekerken», юр. владелец не назван; аудит в тексте относится к vvsg.be), `databot-technologies` → visitles3viles.cat («Visita Les 3 viles», в aviso legal владелец не указан). Пока `declarant: 'unknown'`. Закрывается только внешним подтверждением владельца сайта — не догадкой | data-engineer | todo (low) |
| G-CERT-FRAGILE | Две записи с хрупким доказательством: `akademia-slonca` — PDF на `res.cloudinary.com` (CDN-аккаунт заказчика `/teatr-wybrzeze/`, документ подтверждён, но ссылка живёт вне сайта декларанта); `ebizproduction` — `anact.fr/accessibilite` за анти-бот защитой (Anubis), содержание подтверждено снимком Wayback 2026-01-16, живая ссылка не открывается автоматикой. Обе проверяемы человеком, но не нашей автоматикой — кандидаты на замену первоисточником, если он появится | data-engineer | todo (low) |
| G-I18N-DE | Оболочка сайта (шапка/футер/навигация) на `/bfsg-check/` и немецких гайдах пока английская — `<html lang="de">` при английском chrome. Осознанный компромисс до G-I18N, не недосмотр | frontend-engineer | todo (внутри G-I18N) |

**G-PRICE и немецкий рынок (актуализировано 2026-08-06, D-045).** Сплошная
проверка подтвердила: 0 из 40 немецких агентств публикует цену аудита (у `ifdb`
опубликован SaaS за страницу, у `telekom-mms` — прайс на Business GPT — ни то,
ни другое не аудит). Текст ниже остаётся в силе как есть.

**G-PRICE и немецкий рынок.** `priceBand` пуст у 40/40 немецких агентств.
Заполнять его догадками нельзя (D-006/R1), поэтому на `/bfsg-check/` пробел
назван вслух и заменён единственным реально опубликованным ориентиром —
индикативными постраничными ценами BIK-Прюфвербунда со ссылкой на источник.
Закрытие G-PRICE по существу требует опубликованных прайсов агентств, которых
у большинства нет; это ограничение рынка, а не наша недоработка.

## Данные каталога — закрыто и открыто (2026-08-06)

| ID | Задача | Владелец | Зависит от | Статус |
|---|---|---|---|---|
| G-FOUNDED | `founded` по опубликованным годам основания + гейт в сборке + вывод в профиле | data-engineer | G-PRICE | **done** (D-047; 65/245, LinkedIn отклонён как самостоятельный источник) |
| G-FOUNDED-LI | Перепроверить 72 записи, где год есть только в LinkedIn: найти подтверждение на сайте агентства (Impressum, торговый реестр, страница истории) — либо оставить пустыми навсегда | data-engineer | G-FOUNDED | todo |
| G-HEADCOUNT | `headcountBand` — то же поле-сирота, что и `founded` до D-047: не заполнено и не показывается; решить, нужно ли оно продукту, прежде чем собирать | product-lead | — | todo |
