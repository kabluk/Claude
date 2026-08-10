# INTERFACES — контракты между доменами

Обновлено: 2026-08-05. Менять только с записью в DECISIONS.md.

## 1. Данные каталога (действующий контракт)

- Схема: `data/a11y/types.ts` — Agency, Guide, Taxonomies, CertBadge, Declarant.
- **Бейдж `statement-named-auditor`** (D-042, бывш. `gov-declared-auditor`):
  `{ kind, country: ISO-2, evidenceUrl, declarant: 'public-body'|'private'|'unknown' }`.
  Инварианты (проверяет `build-a11y.mjs`, нарушение = ошибка сборки):
  `kind` из перечня в types.ts · `declarant` из перечня · `country` — ISO alpha-2 ·
  `evidenceUrl` — валидный URL и **не** на регистрируемом домене агентства
  (самоаттестация). Потребители: `certLabel(cert)` (принимает бейдж, не `kind`),
  `namedInStatements(country)`, `statementEvidence(a, country) → {url, declarant}[]`,
  фасет `Named in a statement` в `FilterableList`, `/bfsg-check/`.
- Источник истины: `data/a11y/agencies.json` (253 записи). Всё остальное производно.
- Конвейер: `collect/*.json` → `merge-a11y.mjs` (уважает `excluded.json`) →
  `enrich-a11y.mjs` (заполняет только пустые поля) → `build-a11y.mjs` (валидация,
  дедуп, индексы, route-манифест) → `vite-react-ssg build` → `gen-a11y-sitemap.mjs`.
- Порог индексации списочных страниц: ≥3 листинга. Профили без описания — риск
  thin-content (закрывается в Фазе 0).
- Клиентский индекс: `data/a11y/_generated/agencies.index.json` (не в git) — им же
  пользуется будущий матчинг сканера и RFQ.

## 2. Worker API

Единый Worker (`worker/index.js`), все ответы JSON, ошибки `{error, code}`.

| Endpoint | Вход | Выход | Фаза | Статус |
|---|---|---|---|---|
| `POST /api/scan` | `{url, email?, turnstileToken?, countryCode?}` | `{scanId}` (202) · 503 `queue_unavailable` (D-110) | 1 | ✅ реализован |
| `GET /api/scan/:id` | — | ScanReport | 1 | ✅ реализован |
| `GET /api/scan/:id/pdf` | — | `application/pdf` (план исправлений) | 2 | ✅ код готов, гейта доступа НЕТ |
| `POST /api/explain` | `{ruleId, locale?}` | `{explanation, fixExamples[]}` (KV-кэш) | 1 | ✅ реализован* |
| `POST /api/lead` | Lead без id/status | `{leadId, matched: slug[]}` | 2 |
| `POST /api/claim` | `{agencySlug, email}` → verify-link | `{claimId}` | 2 |
| `POST /api/stripe-hook` | Stripe event | 200 | 2 |
| `GET /api/account/…` | magic-link cookie | сайты, сканы, дельты | 3 |

\* `/api/explain`: код полный и протестирован (400 на невалидный ruleId, 429 на
rate-limit, 503 без ключа, 502 с ошибкой парсится корректно — проверено вживую
фиктивным ключом, реальный Anthropic API вернул настоящий 401). НЕ протестирован
только happy path — нужен настоящий `ANTHROPIC_API_KEY` (платный, решение владельца,
D-016). `sampleHtml` из черновика убран — конфликтовал с кэшем по ruleId×locale
(инстанс-специфичный html "засорял" бы генерик-кэш для всех).

## 3. Типы динамики

`countryCode` (ISO-3166 alpha-2, необязательный, D-032) перебивает определение
юрисдикции по TLD — нужен для `.com`/`.eu`-сайтов, обслуживающих конкретную
страну (по домену такие не определяются вовсе). Неизвестный код молча
игнорируется с откатом на TLD, скан не падает. Допустимые значения —
`worker/lib/jurisdiction.js::supportedJurisdictions()`; зеркало для UI —
`src/lib/jurisdictions.ts`, расхождение ловит `src/lib/jurisdictions.test.mjs`.

`jurisdictionCountry` (ISO-3166 alpha-2, D-041) добавлен рядом с
`jurisdictionNote` и ставится ровно там же — на юридически решающих находках
(`a11y-statement-*`) в юрисдикции, требующей заявление. Нужен, чтобы UI мог
ветвиться по стране, НЕ разбирая текст заметки регуляркой: заметка — копирайт,
она будет меняться, и связка «текст → логика» ломается молча. Поля нет вовсе на
находках, к которым правовая пометка не относится.

```ts
type ScanFinding = { ruleId: string; wcag: string[]; impact: 'minor'|'moderate'|'serious'|'critical';
  selector: string; page: string; html?: string; jurisdictionNote?: string;
  jurisdictionCountry?: string };
// ruleId: либо реальный axe-core ruleId (напр. "color-contrast"), либо один из
// собственных проверок вне axe (D-030, 2026-08-06), namespace "a11y-*"/"scan-meta-*":
//   a11y-statement-missing / a11y-statement-incomplete — A3-STATEMENT (Anlage 3)
//   a11y-feedback-missing — A3-FEEDBACK
//   a11y-pdf-present — A3-PDF (агрегат на страницу, не по PDF)
//   a11y-reflow-320 — A3-REFLOW (WCAG 1.4.10)
//   a11y-keyboard-trap / a11y-focus-invisible — A3-KEYBOARD (эвристика, может false-positive)
//   a11y-autoplay-media / a11y-video-no-captions — A3-MEDIA
//   a11y-resize-200 — A3-RESIZE (приближение через CSS zoom, не идентично браузерному Ctrl+)
//   scan-meta-cookie-banner-dismissed — A3-COOKIEBANNER: не находка против сайта,
//     прозрачность что DOM скорректирован перед проверкой (impact всегда minor)
//   scan-meta-page-skipped — SCAN-RESILIENCE (D-113): страница пропущена после
//     неудачи навигации/инжекта axe, скан продолжен без неё; причина — в html.
//     Только для ПОДстраниц: отказ главной по-прежнему валит скан целиком.
// Инвариант scan-meta-* (D-113): мета-находки НЕ влияют на score
// (worker/lib/score.js::isMetaFinding) и на смету (src/lib/costEstimate.ts) —
// прозрачность качества скана не должна штрафовать сайт за отказ сканера.
// jurisdictionNote: заполняется applyJurisdictionWeight() (worker/lib/jurisdiction.js)
// ТОЛЬКО на a11y-statement-missing/incomplete, когда juridiction.statementRequired —
// бампит impact до critical; сумма штрафа включается в текст только если
// jurisdiction.verified (сейчас — только DE, §37 BFSG, D-030).
// Отображается пользователю блоком "Legal basis" в ReportPage (с D-032; до
// него поле возвращалось API, но фронтенд про него не знал и молча ронял).
type ScanProgress = { phase: 'discovering'|'statement'|'axe'|'dom-checks'|'aggregating';
  pagesDone: number; pagesTotal: number|null; updatedAt: string };
// CN-SCAN-PHASES (D-067): промежуточный прогресс скана. Фазы — ровно те, что
// scanSite() реально проходит (worker/lib/progress.js — канонический список):
// discovering (главная + выбор ≤6 страниц) → statement (заявление + feedback) →
// затем ПО КАЖДОЙ странице axe → dom-checks (фазы чередуются, pagesDone/pagesTotal
// говорят где обход) → aggregating (site-checks + юрисдикция + score).
// Пишется updateScanProgress() по ходу скана ТОЛЬКО при status='running'
// (гейт в SQL); completeScan/failScan финально перезаписывают progress_json в
// NULL — завершённый скан прогресса не имеет. Ошибка записи прогресса
// проглатывается (best-effort телеметрия, скан важнее).
// ОБРАТНАЯ СОВМЕСТИМОСТЬ (обязательство UI, D-064): поле может отсутствовать —
// старые строки D1, БД без миграции 0007, и ЗАДЕПЛОЕННЫЙ воркер до следующего
// worker:deploy (решение владельца, D-022) его не отдают. Клиентский парсер
// (src/lib/scanner.ts::parseScanProgress) превращает отсутствие/неизвестную
// фазу/мусорные счётчики в null — UI падает на трёхшаговый поток D-064,
// не рисует мусор. Неизвестная фаза от более нового воркера — тоже null.

type ScanReport = { id: string; url: string; status: 'running'|'done'|'error'; pages: string[];
  findings: ScanFinding[]; score: number|null; error: string|null;
  errorCode: 'unreachable'|'refused'|'tls'|'timeout'|'blocked'|'busy'|'internal'|null;
  createdAt: string; completedAt: string|null; progress: ScanProgress|null;
  planUnlocked: boolean };
// planUnlocked (A2-REPORT-PAYWALL): NOT a payment status — true iff a lead was
// left for this scan_id (worker/lib/db.js::hasLeadForScan), which is what
// unlocks GET /api/scan/:id/pdf; computed only when status='done'.
// score: 0–100, дедуп по ruleId (худшая severity среди инстансов) — см. D-010,
// worker/lib/score.js. Эвристика для сортировки/сравнения, НЕ сертификация (D-006).
// errorCode: маленький enum для UI (worker/lib/errors.js, D-013) — error остаётся
// сырым текстом для отладки, errorCode превращается фронтендом в понятную фразу
// без парсинга стектрейсов (VISION.md UX-требование 4).
// GET /api/scan/:id/pdf (A2-PDF-PLAN, D-114) — план исправлений PDF, печатается
// Browser Rendering'ом из HTML, собранного в воркере (worker/lib/pdfPlan.js —
// данные, pdfPlanHtml.js — разметка, routes/scanPdf.js — D1 + печать).
// ⚠️ ГЕЙТА ДОСТУПА НЕТ: сейчас эндпоинт открыт любому, кто знает id скана.
// Пейволл — отдельный узел (A2-REPORT-PAYWALL): гейт встаёт ПЕРЕД генерацией.
// Маршрут обязан матчиться РАНЬШЕ `/api/scan/:id`, иначе тот съест путь как
// id="<uuid>/pdf" и молча вернёт 404 (см. worker/index.js).
// Решение владельца по показу (D-114): находки на /report/:id остаются
// ОТКРЫТЫМИ, закрывается только план; закрытая часть НЕ отдаётся клиенту —
// CSS-блюр поверх реального текста запрещён (обходится view-source и даёт
// скринридеру то, что скрыто от глаз — недопустимо для нашей ниши).
// errorCode='busy' (A1-SCAN-BUSY-RETRY): лимит Browser Rendering (429 на
// создании браузера), а НЕ поломка у нас и не проблема сайта — пишется только
// после исчерпания busy-ретраев консьюмера (20с, затем 40с; всего 3 доставки).
// ГАРАНТИЯ ЗАВЕРШЕНИЯ (D-108 + D-109 + D-110): status='running' конечен, ТРИ рубежа.
// 1) scanSite() накрыт сторожевым таймаутом 120с (env.SCAN_TIMEOUT_MS
//    переопределяет) на ВЕСЬ прогон; по срабатыванию — failScan с
//    errorCode='timeout' (сообщение содержит слово "timeout" — этого требует
//    classifyError). Новый код ошибки НЕ вводится.
// 2) Сторож живёт в изоляте со сканом и умирает вместе с ним (случалось на
//    проде) — поэтому GET /api/scan/:id сам закрывает running старше
//    SCAN_TIMEOUT_MS + 60с (reapStaleScan, SQL-гейт AND status='running'
//    против гонки: done живого скана никогда не затирается).
// 3) D-110: скан больше НЕ выполняется в ctx.waitUntil — у waitUntil жёсткий
//    потолок 30с после отправки ответа, и рубеж (1) вместе со сканом просто
//    отменялся платформой. POST /api/scan теперь только кладёт джоб в очередь
//    `accessatlas-scan-queue` (producer-биндинг SCAN_QUEUE) и отвечает 202;
//    сканирует consumer (worker/lib/scanJob.js), у которого инвокация живёт до
//    15 минут — там сторож (1) впервые может реально доработать.
//    Контракт сообщения (только примитивы, переживает деплой):
//      { v: 1, id: string, url: string, countryCode: string|null }
//    Юрисдикция НЕ передаётся — пересчитывается в consumer'е resolveJurisdiction.
//    Consumer идемпотентен (очередь даёт at-least-once): перед сканом читает
//    строку и сканирует ТОЛЬКО при status='running'; любой другой статус —
//    исход уже записан (прошлой доставкой или реапом (2)), ack без скана.
//    ack и на успехе, и на ошибке скана; retry() — только когда исход НЕ
//    записан в D1 (D1 недоступен), max_retries=2 в wrangler.jsonc.
//    Новый ответ POST /api/scan: 503 {code:'queue_unavailable'} — биндинга
//    очереди нет либо send() отверг сообщение. Тихого отката на waitUntil нет
//    намеренно: он вернул бы ровно ту молчаливую поломку, ради которой сделан
//    переезд. Клиент обязан обрабатывать 503 как «скан не запущен».
type Lead = { id: string; scanId?: string; country: string; standard: StandardSlug;
  service: ServiceSlug; budget: PriceBand; deadline?: string; contact: {email: string; company?: string};
  matched: string[]; status: 'sent'|'responded'|'booked'|'closed'; createdAt: string };
```

`StandardSlug`, `ServiceSlug`, `PriceBand` — переиспользуются из `data/a11y/types.ts`.

## 4. D1

```
-- scans: реализовано, migrations/0001_init.sql + 0002_error_code.sql
--        + 0007_scan_progress.sql (D-067; на ПРОД-D1 миграция ещё не применена —
--        едет вместе со следующим worker:deploy, решение владельца)
scans(id TEXT PK, url TEXT, status TEXT DEFAULT 'running', pages_json TEXT,
      findings_json TEXT, score INT, error TEXT, error_code TEXT, email TEXT NULL,
      created_at TEXT, completed_at TEXT,
      progress_json TEXT)  -- JSON ScanProgress (§3), NULL когда скан завершён/старая запись

-- ниже — черновик, Фаза 2+, ещё не реализовано
leads(id TEXT PK, scan_id TEXT NULL, country TEXT, standard TEXT, service TEXT, budget TEXT,
      deadline TEXT NULL, contact_json TEXT, matched_json TEXT, status TEXT, created_at TEXT)
claims(id TEXT PK, agency_slug TEXT, email TEXT, verified INT, patch_json TEXT, status TEXT, created_at TEXT,
       token TEXT)  -- добавлен migrations/0006_claim_token.sql (D-023): id — публичный claimId,
                     -- token — отдельный secret verify-токен, НЕ возвращается в ответе API
featured(agency_slug TEXT PK, until TEXT, stripe_ref TEXT)
accounts(id TEXT PK, email TEXT UNIQUE, sites_json TEXT, plan TEXT, created_at TEXT)
```

Правило: D1-оверлеи (claims/featured) подхватываются ежедневным ребилдом; статический
сайт никогда не читает D1 в рантайме.

Очередь `accessatlas-scan-queue` (создана 2026-08-10, D-110): producer-биндинг
`SCAN_QUEUE` (POST /api/scan), consumer — тот же воркер (`queue` handler в
`worker/index.js` → `worker/lib/scanJob.js`). `max_batch_size: 1` (один скан =
один браузер Browser Rendering), `max_retries: 2`, `max_concurrency: 2`
(лимит одновременных сессий Browser Rendering). Dead-letter очереди нет:
исчерпавшее повторы сообщение отбрасывается, строку в `running` закрывает
рубеж (2) — реап D-109 при первом GET.

## 5. Матчинг «отчёт → агентства» (контракт Фазы 1)

Вход: страна пользователя (гео/выбор), стандарт (страна → закон из `taxonomies.json`),
услуга (audit; remediation при serious/critical находках), бюджет (из оценки стоимости).
Выход: топ-5 агентств из `agencies.index.json`, приоритет: featured → полнота профиля →
кол-во сертификаций. Тот же алгоритм переиспользует `POST /api/lead`.

## 6. Границы владения (для параллельных агентов)

| Каталог | Владелец |
|---|---|
| `data/a11y/**` | data-engineer |
| `src/**` (страницы, компоненты) | frontend-engineer |
| `worker/**`, `wrangler.jsonc`, D1/KV | backend-engineer |
| `scripts/**`, CI, деплой | devops-engineer |
| `docs/project/**` | оркестратор (агенты пишут в свой domains/*.md) |
