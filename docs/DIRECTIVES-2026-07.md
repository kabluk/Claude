# DIRECTIVES — 2026-07

> Рабочий приказ для Claude Code. Выполнять сверху вниз. Критерий готовности у
> каждой задачи; не переходить к следующей, пока предыдущая не выполнена и не
> закоммичена. Стратегические решения — в `docs/DECISIONS.md`; факты — в
> `research.md`.

Разделы 0–7 (бизнес-модель, P0–P2) и хотфикс по внешнему ревью — **выполнены**
(история в git). Ниже — раздел 8 (Tier A features). Порядок: 8.0 → 8.1 → 8.2 →
8.3 → 8.4.

---

## 8.0 Хотфикс по внешнему ревью — ВЫПОЛНЕНО (commit 311a61b)

1. **n8n удалён** из docs/*, заменён на Supabase pg_cron + Edge Functions; в
   `CLAUDE.md` — жёсткий запрет. `grep n8n` пуст (кроме запрета).
2. **check-forms.mjs** — браузерные заголовки (обход 403), явное разделение
   «ревизия изменилась» vs «источник недоступен», CI падает с понятным
   сообщением. Локально: 0 изменений, exit 0.
3. **features.js** — `lsOn()` за `import.meta.env.DEV`; в prod-сборке ветка
   вырезается, флаг только через `VITE_REVIEWED_TIER_ENABLED`.

---

## 8.1 Court-Readiness Check («вас не развернут» как экран) — ВЫПОЛНЕНО

Модуль `src/readiness/` с MECHANICAL-проверками собранного пакета: полнота
обязательных полей, кросс-форменная согласованность (даты, имена, case_number,
has_children⇒FL-105, default⇒FL-165), county-требования из CountyInfo, места
подписей. Экран Readiness на `/review`: ✅/⚠️/❌ + якоря «исправить» → шаг
визарда. Тексты — только i18n, фактические, НЕ советующие. Не оценивает
содержание, только наличие и непротиворечивость.

**Готово когда:** кейс с пустым обяз. полем / разными датами separation / детьми
без FL-105 → три ❌ с якорями; чистый кейс — все ✅; UPL-линт чист.

**Сделано:**
- `src/readiness/checks.js` — pure-JS `runReadiness({user, caseRec, answers, packet?})`
  → `{items:[{group,key,severity,params,anchor}], counts}`. Проверки: полнота
  обязательных полей + county + дети (name/dob) + подпись согласия; согласованность
  (date_of_separation↔separation_date, marriage, имена и case_number по построенным
  профилям форм); покрытие форм (`requiredForms` через fl105/165/341/342/343Required);
  county-требования из `CountyInfo`; список мест подписей. Только наличие/непротиворечивость.
- `src/screens/Readiness.jsx` на `/review`; кнопка входа с `/preview`; CSS в styles.css.
- i18n-блок `readiness` во всех 5 языках (EN+RU полностью, es/zh/vi — зеркало EN до
  переводческого прохода §6). Якоря «Исправить» → шаг визарда через `wizard_step`.
- `scripts/readiness-selftest.mjs` (`npm run check-readiness`): чистый кейс → 0/0,
  все ✅; сломанный (пустое поле + разные separation + дети без FL-105) → ровно 3 ❌
  с рабочими якорями. UPL-линт чист, `npm run build` зелёный.

## 8.2 Fee Waiver (FW-001 / FW-003) — ВЫПОЛНЕНО

Привязать FW-001, FW-003 тем же конвейером (+ demo + check-forms). Шаг визарда
«Судебная пошлина»: benefit-чеклист + доходные пороги (источник+дата в
research.md). Результат фактический: «При получении X суд обычно освобождает от
пошлины — FW-001 добавлена». Лендинг-hook в trust-блок.

**Готово когда:** оба demo read-back; чеклист добавляет/не добавляет FW; пороги
имеют источник в research.md; UPL чист.

**Сделано:**
- FW-001, FW-003 скачаны с courts.ca.gov, нормализованы (pikepdf: XFA-,
  NeedAppearances+), в `public/forms/`. `src/pdf/fw001.js` (Request to Waive
  Court Fees: caption + item 1 + item 4 superior + 5a benefits + 5b income + 5c
  request + подпись + page-2 totals) и `src/pdf/fw003.js` (Order — заполняем
  только caption/parties/дата подачи, решение суда НЕ трогаем). Demo read-back:
  FW-001 30 set / 0 missing, FW-003 10 set / 0 missing. В FORMS у check-forms —
  обе ревизии актуальны.
- `src/data/feeWaiver.js` — единый источник: `FEE_WAIVER_INCOME` (пороги 125% FPL
  из FW-001 ред. 01.03.2026), `FEE_WAIVER_BENEFITS`, `evaluateFeeWaiver` (basis
  benefits|income|null) + `monthlyIncomeLimit`.
- Шаг визарда `fees` («Судебная пошлина»/«Court fees») между income и consent:
  запрос-чекбокс + размер домохозяйства + доход + benefit-чеклист + фактическая
  строка результата. `fw001Required`/`fw003Required` подключены в readiness-пакет
  (якорь «Fix» → шаг fees).
- i18n `wizard.sec.fees` + `wizard.fees` во всех 5 языках (EN+RU полностью,
  es/zh/vi зеркало EN); trust-hook о fee-waiver на county-лендинге (EN+ES).
- Пороги + пособия зафиксированы в `research.md` (VERIFIED, проверено 2026-07-13,
  источник FW-001 ред. 01.03.2026). `scripts/feewaiver-selftest.mjs`
  (`npm run check-feewaiver`) + `demo-fw001/003.mjs`. UPL чист, build зелёный.

## 8.3 Таймлайн-сопровождение (pg_cron + Edge Functions, БЕЗ n8n) — ВЫПОЛНЕНО

Таблица `case_milestones`; генерация вех из service_date (арифметика дат с
юнит-тестом); daily pg_cron → Edge Function `notify-milestone` → Telegram/Twilio;
opt-in канал + consent в Cabinet; шаблоны в i18n (+ UPL-линт на них); секреты в
Supabase. FACTUAL: только дедлайны + ссылки, без императива совета.

**Готово когда:** юнит-тест арифметики вех; ручной вызов доставляет в тестовый
Telegram на ru/es; pg_cron job миграцией; шаблоны UPL-чисты.
(Живая доставка — deploy-gated: нужны секреты и проект Supabase.)

**Сделано:**
- `src/timeline/milestones.js` — чистая арифметика вех от service_date
  (proof_of_service, response_deadline +30д, disclosures_due +60д от подачи,
  judgment_prep, waiting_period_end +6мес+1д). UTC-парсинг, clamp конца месяца,
  високосный год. `scripts/milestone-selftest.mjs` (`npm run check-milestones`) —
  все проверки зелёные.
- `supabase/migrations/0001_case_milestones.sql` — таблица + индекс + RLS +
  `pg_cron` job (15:00 UTC) через `net.http_post`. Секреты/URL — из настроек БД,
  не в файле.
- `supabase/functions/notify-milestone/index.ts` (Deno) — выборка due+consent,
  рендер фактической строки (MESSAGES зеркалит `t.milestones`), доставка
  Telegram / Twilio WhatsApp, штамп `reminded_at`. Без секретов — безопасный
  no-op. README с деплоем/секретами.
- i18n `milestones` во всех 5 языках (EN+RU полностью, es/zh/vi зеркало EN);
  UPL-линт покрывает. Карта Cabinet (`TimelineCard.jsx`): дата вручения +
  таймлайн + opt-in канал/handle + consent.
- `scripts/milestone-dryrun.mjs` (`npm run milestone-dryrun`) — рендерит ru/es
  строки напоминаний без секретов (живая доставка deploy-gated).
- Вехи + статьи (Fam. Code §2339(a)/§2104(f), CCP §412.20) — VERIFIED в
  `research.md`. Build зелёный, UPL чист, n8n нет.

## 8.4 Фото → форма (paystub → FL-150) — ВЫПОЛНЕНО (шаг 1)

Edge Function `extract-paystub` (Claude vision, строгий JSON, null-не-угадывать,
temp 0, ключ в secrets). Шаг в доходах FL-150: фото → черновик с подсветкой →
клиент ПОДТВЕРЖДАЕТ каждое значение (client-directed) + равноправный ручной
ввод. Хранение в приватном бакете Supabase, RLS по case_id, retention (blocking
fact в research.md). Второй шаг (отдельный коммит): фото врученных документов →
FL-115 + service_date. MECHANICAL. COGS vision в research.md.

**Готово когда:** 5 тестовых изображений → JSON без выдумок; подтверждённые
значения проходят demo FL-150; RLS-тест; нечитаемое → фактический отказ.

**Сделано (шаг 1 — paystub → FL-150):**
- `supabase/functions/extract-paystub/index.ts` (Deno) — Claude vision
  (claude-opus-4-8), **temperature 0**, forced tool/JSON schema, системный промпт
  «не видно → null, НЕ угадывать; не квитанция → readable=false». Без
  `ANTHROPIC_API_KEY` — безопасный no-op. Персистентность фото — за
  `PAYSTUB_PERSIST` (по умолчанию выкл., retention: none).
- `src/vision/paystub.js` — `validateExtraction` (строгая типизация: нечитаемое
  поле → null, мусор отбрасывается — фабрикация не доходит до формы),
  `normalizeMonthly` (недель/2недели/полмесяца/месяц; нет частоты → null, не
  угадываем), `extractionToDraft`, `applyConfirmed` (пишем ТОЛЬКО подтверждённое).
- UI `src/components/PaystubImport.jsx` в шаге income визарда: загрузка фото →
  черновик с чекбоксами подтверждения на каждое значение → запись в
  `fl150_profile`/`petitioner_income`. Ручной ввод — равноправный путь. Эндпойнт
  за `VITE_EXTRACT_PAYSTUB_URL` (нет → только ручной ввод). i18n `paystub` во всех
  5 языках (EN+RU полностью, es/zh/vi зеркало EN).
- `supabase/migrations/0002_paystub_storage.sql` — приватный бакет `paystubs` +
  RLS по `case_id` (первый сегмент пути) + заготовка retention-свипа.
- `scripts/paystub-selftest.mjs` (`npm run check-paystub`): 5 синтетических
  извлечений (biweekly/weekly/без частоты/нечитаемое/мусор) → без выдумок;
  нечитаемое → пустой черновик (фактический отказ); подтверждённые значения
  проходят read-back demo FL-150 (0 missing). COGS vision + retention (BLOCKING)
  зафиксированы в `research.md`. UPL чист, build зелёный.

**Сделано (шаг 2 — served-docs → FL-115 + service_date):**
- `supabase/functions/extract-service/index.ts` (Deno) — Claude vision, temp 0,
  forced JSON schema, «не видно → null; не proof-of-service → readable=false».
  Без ключа — no-op. Persistence — тот же retention-гейт (none по умолчанию).
- `src/vision/service.js` — `validateServiceExtraction` (строгая типизация,
  мусор → null), `serviceToDraft`, `applyConfirmedService` (пишет только
  подтверждённые flat-ответы `service_*`, которые читают FL-115 и таймлайн).
- `src/components/ServiceImport.jsx` в карте таймлайна Cabinet: фото → черновик
  с чекбоксами → запись `service_date`/`service_method`/`service_server_name` и
  т.д. → FL-115 заполняется, таймлайн пересчитывается. Эндпойнт за
  `VITE_EXTRACT_SERVICE_URL`. i18n `service` во всех 5 языках (EN+RU, es/zh/vi
  зеркало EN).
- `scripts/service-selftest.mjs` (`npm run check-service`): 4 синтетических
  извлечения → без выдумок; нечитаемое → пустой черновик; подтверждённые
  значения проходят read-back FL-115 (0 missing, personal-service отмечен, дата
  и вручитель заполнены). UPL чист, build зелёный. **§8.4 закрыт полностью.**
