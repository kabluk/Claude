# STATUS — фактическое состояние

Обновлено: 2026-08-06 (см. также подробный legacy-статус: `research/STATE.md`)

## Кратко

Слой 1 (Directory) построен и **готов к деплою** — все агентские блокеры Фазы 0
закрыты, ждёт только ввода от владельца (реквизиты Imprint + домен). Слой 2
(сканер) **реально задеплоен и работает** на аккаунте владельца
(`https://accessatlas-worker.zincroom.workers.dev`, D-021) — не демо, настоящие
D1/KV, настоящий скан example.com нашёл настоящие находки. Слои 3–4 не начаты.
Ветка проекта — `accessatlas`; рабочая ветка этой итерации —
`claude/accessatlas-architecture-sk6tcj`.

## Проверено сегодня (командами, не по памяти)

- **A0-ENRICH** (commit `e0c9a85`): 119 записей обогащены, +170 описаний. `the-pixel` —
  не баг, корректно исключённая запись; устаревший дубль-патч удалён.
- **A0-CI-FIX** (commit `969bdf5`): `ci.yml` был скопирован целиком с `main` (detnav) при
  заведении ветки. `lint:upl`/`lint:minimize` — юр-линтеры детнавского контента
  (unauthorized-practice-of-law формулировки в `content/**`), у AccessAtlas такого контента
  нет — шаги убраны (D-009), не переписаны заглушками. `check-links.mjs` написан заново под
  структуру этого сайта: 413→405 внутренних ссылок, 0 битых. `package-lock.json` добавлен.
  CI зелёный локально: `npm ci` → `typecheck` → `build` → `check-links`.
- **A0-DESC-REST** (commit `1985a15`): 5 параллельных субагентов исследовали 53 сайта.
  45 получили фактическое описание, 8 исключены (мёртвые/заброшенные/поглощённые сайты
  или нет услуг доступности вообще) и удалены из `agencies.json` → `excluded.json`.
- `node scripts/build-a11y.mjs` — ✅ **245 агентств** (было 253, −8 исключений),
  120 списочных страниц (81 индексируемых). `npm run typecheck` — чисто.
  `npm run build` — 384 страницы, sitemap 347 URL.
- **Описания: 245/245 (100%)**, было 81 в начале дня. Порог ≥90% для снятия
  noindex закрыт с запасом.

## Блокеры запуска (Фаза 0)

| Блокер | Статус |
|---|---|
| Enrich, описания, CI | ✅ все три узла done |
| Реквизиты Imprint (юрлицо/адрес) | ⏳ **ждёт владельца проекта** |
| Домен (замена `accessatlas.example` в `src/lib/seo.tsx`, `scripts/gen-a11y-sitemap.mjs`) | ⏳ **ждёт владельца проекта** |
| Деплой-конфиг Cloudflare Pages | ⏳ ждёт домена/реквизитов, затем — агенты |

## Фаза 1 (Decision Engine)

**Фактически закрыта по коду.** `A1-SCAN`, `A1-REPORT`, `A1-EXPLAIN`, `A1-COST`,
`A1-MATCH`, `A1-PRIVACY` — **done**. Только `A1-LANDING` и `A1-RETENTION`
остаются в review, и оба не требуют новой работы — только времени/наблюдения:

- `A1-SCAN`: реально задеплоен 2026-08-06 (D-021) на аккаунт владельца — D1
  `accessatlas-scans`, KV `RATE_LIMIT_KV`/`EXPLAIN_CACHE`, `wrangler.jsonc`
  содержит настоящие id. Живой скан `https://example.com` через Browser
  Rendering нашёл 2 подлинные axe-core находки, score 94, подтверждено прямым
  SELECT из D1. Закрывает главный пробел D-010 (MITM-прокси песочницы блокировал
  только *локальный* Chromium Browser Rendering — реальный деплой этого не
  требует).
- `A1-REPORT`/`A1-COST`/`A1-MATCH`: зависели только от A1-SCAN/A1-REPORT по
  цепочке, их собственная верификация (Playwright, реальные `agencies.json`)
  была завершена раньше — теперь done.
- `A1-EXPLAIN`: закрыт 2026-08-06 (D-020, D-021) — реальный `ANTHROPIC_API_KEY`
  нашёл и исправил настоящий баг (markdown-фенс вокруг JSON), затем загружен
  как реальный Worker secret на живой деплой и подтверждён запросом.
- `A1-LANDING`: review — внешний скрипт Turnstile (`challenges.cloudflare.com`)
  не проверен реальным браузером; подтверждено отдельно, что браузер этой
  песочницы вообще не может достучаться до внешнего HTTPS (не специфично для
  Turnstile).
- `A1-RETENTION`: review — Cron Trigger подтверждён зарегистрированным на
  реальном деплое (`schedule: 0 3 * * *`), но первое фактическое срабатывание
  (03:00 UTC) ещё не пронаблюдано.

Детали — `docs/project/domains/frontend.md`, `backend.md`, `DECISIONS.md`
(D-013…D-021).

## Монетизация

Фаза 2 начата 2026-08-06: `A2-LEAD-SCHEMA` — **done** (`migrations/0003_leads.sql`,
таблица `leads` 1:1 с черновиком INTERFACES.md §4; `db:migrate:local` и
`worker:test` 39/39 зелёные локально; remote `accessatlas-scans` не тронут).
Разблокировало `A2-LEAD-API`. `A2-LEAD-FORM` — **done**: `/request-quote/`
(RequestQuotePage + LeadForm + leadForm.ts) — клиентская валидация по типу Lead
(INTERFACES.md §3), client-only превью подходящих агентств (переиспользует
`matchAgencies()`, без сети), явный дисклеймер «not sent yet», 0 сетевых вызовов
при submit. Найден и исправлен реальный баг heading-order (h1→h3) в блоке
превью, страница добавлена в постоянный CI a11y-гейт и в sitemap (были не
покрыты изначально), плюс закрыт orphan-page пробел — CTA «Request a quote»
теперь ведёт на страницу с `/report/:id`. `build`/`typecheck`/`worker:test`/
`check-links`/`audit-a11y` зелёные (386 страниц, sitemap 349 URL). `A2-LEAD-API`
— **done**: `POST /api/lead` пишет в D1, тот же матчинг, что `matchAgencies.ts`.
`A2-CLAIM-SCHEMA`/`A2-STRIPE-SCHEMA` — **done** (миграции `claims`/`featured`).
`A2-STRIPE-WEBHOOK-CODE` — **done** (2026-08-06): `POST /api/stripe-hook`
проверяет подпись Stripe по настоящему алгоритму (HMAC-SHA256, `Stripe-
Signature: t=…,v1=…`, константное сравнение, tolerance против replay,
`worker/lib/stripeSig.js`) и апсертит `featured` по `checkout.session.completed`
(`ON CONFLICT(agency_slug) DO UPDATE`). 24 новых теста на синтетическом
секрете, 89/89 `worker:test`; живьём через `wrangler dev --local` + `wrangler
d1 execute --local` на настоящей D1 — поддельная подпись отклонена, валидное
событие обновило `featured.until`, продление обновило ту же строку (не
создало вторую). Разблокировало `A2-STRIPE-LIVE` (approval_required, реальный
Stripe-аккаунт — отдельное решение владельца). `A2-CLAIM-API` — **done**
(2026-08-06, D-023): `POST /api/claim` (`worker/routes/claim.js`) валидирует
`agencySlug` против реального каталога, пишет `pending`-заявку в D1 с
отдельным secret `token` (`migrations/0006_claim_token.sql` — добавлен
столбец сверх исходной схемы, т.к. verify-токен не может совпадать с
`claimId`, который API и так возвращает вызывающему, иначе email-верификация
тривиально обходится), возвращает `{claimId}`. Email не отправляется. 103/103
`worker:test`, живой прогон через `wrangler dev --local` + прямой `SELECT` из
D1 подтвердил структуру заявки. Владелец явно одобрил Resend 2026-08-06 для
трёх узлов (`A2-LEAD-EMAIL`, `A2-CLAIM-EMAIL`, `A2-OUTREACH-SEND`, D-024).
`A2-CLAIM-EMAIL` — **done**: `worker/lib/resend.js` + новый эндпоинт `GET
/api/claim/verify?token=...`, живьём реальным ключом — письмо реально дошло
на email владельца, verify-ссылка реально перевела `claims.verified` 0→1 в
D1. Найдено: sandbox-домен Resend не доставляет реальным сторонним
получателям (только владельцу аккаунта Resend) до верификации собственного
домена — тот же корневой блокер, что у `A2-OUTREACH-SEND`, подтверждён живым
API-ответом. `A2-LEAD-EMAIL` — **done** (D-025): владелец выбрал уведомлять
только claimed+verified среди совпавших агентств — незаявленные ничего не
получают, охват растёт по мере роста числа claimed-профилей. Живьём:
реальный claim+verify → совпавший лид → уведомление ушло без ошибок.
`A2-STRIPE-LIVE` — **in progress** (D-027/D-028): владелец выбрал Payment
Link вручную в Dashboard (не API) и scope featured €590/год, разовый платёж;
`stripeHook.js` переписан под Stripe custom field (`session.custom_fields`,
не `session.metadata` — Dashboard-ссылка не несёт динамическую metadata),
`until` считается на сервере (today+365). Владелец уже настроил Payment Link
и сделал реальный тестовый платёж — прислал настоящий JSON события; выяснилось,
что фактический `key` custom field не `agency_slug`, а `yourslugaccessatlas`
(Stripe фиксирует key из label только при первом сохранении, не пересчитывает
при переименовании) — код исправлен под подтверждённое реальное значение,
добавлен регрессионный тест на путаницу label/key. 123/123 `worker:test`,
живьём на реальной локальной D1 с точной формой реального события подтверждено.
Остаётся ровно одно: webhook endpoint в Stripe Dashboard + реальный
`STRIPE_WEBHOOK_SECRET`. `A2-CLAIM-REBUILD` —
одобрен 2026-08-06, готов к прод-cron, ждёт `A0-DEPLOY` (D-026). По плану —
Фаза 2 (ROADMAP.md).

## Инфраструктура

- DataForSEO: логин zincroom@gmail.com, баланс ~$525, ключи в env, не в репо.
  Открыт вопрос возврата $475 + сброс пароля API (засветился в чате).
- Firecrawl: ключ выдаётся в чате при необходимости.
- CI: `.github/workflows/ci.yml` на ветке, зелёный (см. выше).
