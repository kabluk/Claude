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

---

# DIRECTIVES — раздел 9: ценообразование $299 / $499

> Дописать в конец docs/DIRECTIVES-2026-07.md.
> Это изменение бизнес-модели, а не рефакторинг. Внести в docs/DECISIONS.md.

---

## 9.0 Решение

**Цены меняются с $99/$149 на $299/$499.**

Причина: продукт, под который писался $99, больше не существует. Реально в коде:
16 форм (было 10), Court-Readiness Check, Fee Waiver (FW-001/003, экономит
клиенту ~$435), таймлайн-сопровождение 6 месяцев, paystub photo → FL-150,
attorney review сверху. Это сопровождение, а не «PDF за $99».

Якорь позиционирования — **не** DivorceWriter ($137), а адвокатский ретейнер
($5,000) и Hello Divorce ($400 DIY / $2,000 Pro). $299 подрезает Hello Divorce,
оставаясь премиумом относительно commodity-форм.

Ключевой аргумент оффера: **fee waiver окупает цену**. «$299 — и мы, скорее
всего, сэкономим вам $435 судебной пошлины» работает при $299 и теряется при $99.

### Новые тиры

| Тир | Цена | Кому |
|---|---|---|
| Essentials — без детей | **$299** | uncontested/default, без несовершеннолетних детей |
| Family — с детьми/алиментами | **$499** | + FL-105, FL-341/342, расчёт поддержки |
| Attorney review (add-on) | **$75–125** | платится АДВОКАТУ напрямую, не нам |

Судебная пошлина (~$435) — всегда отдельной строкой, «платёж суду, не нам».

---

## 9.1 Что поменять в коде

1. Прайсинг-конфиг (единый источник цен; если его нет — создать
   `src/config/pricing.js`, чтобы цена не была разбросана по компонентам):
   - essentials: 299, family: 499, attorneyReview: {min: 75, max: 125}
   - courtFee: 435 (пометить как government pass-through, НЕ наша выручка)
2. i18n: обновить все строки с ценами во ВСЕХ локалях (en, es, ru, vi, zh).
   Прогнать check-upl-copy после — формулировки цен не должны стать
   советующими («лучший выбор» и т.п.).
3. Stripe: обновить price IDs / суммы. Attorney review НЕ проводить через
   наш Stripe (см. раздел 0 — две раздельные транзакции).
4. Лендинг/pricing-страница: метки «ПЛАТИТЕ НАМ» / «ПЛАТИТЕ АДВОКАТУ» /
   «ПЛАТИТЕ СУДУ» у каждой суммы — прозрачность денежных потоков как элемент
   интерфейса, не как сноска.

**Готово когда:** grep по репо не находит "99" / "149" как цену тиров;
цены берутся из одного конфига; UPL-линт чист.

---

## 9.2 Синхронизация документов

1. `docs/gtm-unit-economics.md` — полностью пересчитать под $299/$499:
   - выручка с кейса: $299 − Stripe (2.9% + $0.30) − COGS (Claude API vision +
     хостинг + Supabase) = чистая маржа
   - **CAC-модель**: добавить таблицу «при каком CPC и конверсии проект жив».
     Формула CAC = CPC / conversion_rate. Показать пороги:
     CPC $6 / conv 2% → CAC $300 → на грани
     CPC $10 / conv 2% → CAC $500 → убыточно на платном трафике
     CPC $10 / conv 4% → CAC $250 → работает
     Вывод в документ: **при высоком CPC платный канал не используется,
     GTM = SEO + сарафан.**
2. `docs/roadmap.md` — обновить цены в Tier 1 и далее.
3. `docs/DECISIONS.md` — запись: «2026-07: цены $99/$149 → $299/$499.
   Причина: объём продукта вырос (16 форм, readiness, fee waiver, timeline,
   vision); якорь — ретейнер $5k, не DivorceWriter $137; fee waiver
   окупает чек».

**Готово когда:** ни один документ не содержит $99/$149 как актуальную цену.

---

## 9.3 CPC — blocking fact, НЕ спрашивать у агента

⚠️ **Прямой запрет:** ни Claude Code, ни любой другой агент не имеет доступа
к Google Keyword Planner / Ahrefs / Semrush. Любая CPC-цифра от агента —
галлюцинация. НЕ вставлять такие числа в gtm-unit-economics.md.

В `research.md` держать как UNVERIFIED до ручной проверки:

```
FACT: CPC "divorce California" и стоимость привлечения
claim:                    [заполнить после Keyword Planner]
why_it_matters:           Определяет, жизнеспособен ли платный канал вообще.
                          При CPC $15 и конв. 2% CAC = $750 > чек $299 →
                          платный трафик убыточен, GTM только SEO + сарафан.
source:                   Google Keyword Planner (ads.google.com), локация California
verified_against_primary: no
verification_method:      [ручная проверка Евгением]
blocks:                   финализацию gtm-unit-economics.md и любые решения
                          о платной рекламе
```

Аналогично — UNVERIFIED до проверки: объёмы поиска по русским и испанским
запросам (проверяет центральную гипотезу языкового wedge).

**Готово когда:** research.md содержит оба факта со статусом no и явной
пометкой, что gtm-unit-economics.md не финализируется до их проверки.

---

# DIRECTIVES — раздел 10: обязательное attorney review (Фаза 2) + фильтр спора

> Дописать в конец docs/DIRECTIVES-2026-07.md. Выполнять ПОСЛЕ раздела 9
> (pricing) — раздел 10 меняет структуру тиров, заданную в 9.
> Оба решения внести в docs/DECISIONS.md.

---

## 10.0 Решение №1: attorney review — обязательное, не опциональное (Фаза 2)

**Было (raздел 9):** review — add-on за $75–125 по желанию клиента.
**Становится:** двухфазная модель.

**Фаза 1 (сейчас, адвокат не законтрактован):**
- Единственный тир: Self-Help ($299 / $499 с детьми), без ревью.
- Обязательная честная пометка в UI и на лендинге: attorney review
  появится; текущий тир — чистое self-help ПО.
- REVIEWED_TIER_ENABLED=false (как сейчас).

**Фаза 2 (reviewing attorney законтрактован):**
- **Ревью входит в основной оффер по умолчанию.** Главный тир =
  подготовка ($299/$499 нам) + ревью ($75–125 адвокату напрямую,
  вторая транзакция). Слово «опционально» из флоу исчезает.
- Self-Help без ревью: остаётся нижней ступенью ТОЛЬКО с явным
  осознанным отказом клиента (checkbox «Я понимаю, что мой пакет не
  будет проверен адвокатом») — либо убирается целиком, по итогам
  разговора с адвокатом. Конфиг-флаг SOFT_TIER_AVAILABLE.

**Причины (в DECISIONS.md):**
1. Оффер «вас не развернут» без ревью содержит скрытую звёздочку;
   с обязательным ревью он честен.
2. Первые развороты клерком убивают сарафан — главный канал.
   Ревью на старте защищает репутацию, не только клиента.
3. UPL-профиль чище: основной поток живёт под §6401(b).
4. Для целевого покупателя разница $299→$399 меньше, чем разница
   «наверное» → «проверено адвокатом Калифорнии».
5. Аргумент в переговорах с адвокатом: гарантированный поток
   (каждый кейс), а не опциональный.

**Задачи:**
1. src/config/pricing.js: добавить PHASE (1|2) и SOFT_TIER_AVAILABLE.
   Состав тиров derive из фазы, не хардкодить в компонентах.
2. Checkout Фазы 2: шаг ревью — не «добавить в корзину», а часть
   основного пути; отказ — явное действие с confirm-checkbox.
   Формулировка отказа ФАКТИЧЕСКАЯ (не пугающая, не советующая) —
   прогнать через check-upl-copy.
3. Лендинг/pricing-страница: в Фазе 2 главная карточка = «с проверкой
   адвокатом», метки «ПЛАТИТЕ НАМ / ПЛАТИТЕ АДВОКАТУ» сохраняются.
4. i18n все локали; UPL-линт чист.

**Готово когда:** переключение PHASE=1→2 в конфиге меняет состав тиров
и checkout без правки компонентов; линт чист.

---

## 10.1 Решение №2: ранний фильтр спора (contested gate)

**Проблема:** тип согласия сейчас выясняется в Q29 — почти в конце
интейка. Человек с contested-кейсом (супруг активно спорит) тратит час
и упирается в тупик. Это плохо для клиента и опасно для нас: продукт
uncontested/default only, contested — вне рамок (см. §6401.6-логика:
обязанность сказать, что нужен адвокат).

**Задача: добавить вопрос-фильтр сразу после Q08 (тип relief).**

Формулировка (нейтральная, ФАКТИЧЕСКАЯ зона — это вопрос о состоянии
дел, не о выборе):

- EN: "Which best describes your situation right now?"
  1. We both agree on all terms (property, support, children)
  2. My spouse has not responded / will not participate
  3. We disagree on one or more terms
  4. I'm not sure yet
- RU: «Что лучше всего описывает вашу ситуацию сейчас?»
  1. Мы согласны по всем вопросам (имущество, поддержка, дети)
  2. Супруг(а) не отвечает / не будет участвовать
  3. Мы не согласны по одному или нескольким вопросам
  4. Пока не знаю
- ES: аналогично, нейтрально.

**Поведение:**
- Ответы 1, 2 → продолжаем (agreement / default пути).
- Ответ 3 → СТОП-экран: фактическое объяснение, что сервис готовит
  документы для дел по согласию или default; для спорного дела нужна
  помощь, которую мы не оказываем; рекомендация обратиться к адвокату
  (в Фазе 2 — ссылка на нашего reviewing attorney как unbundled-опцию,
  ЕСЛИ адвокат на это согласится — уточнить у него, это его лид).
  Данные интейка сохраняются: если ситуация изменится, можно вернуться.
- Ответ 4 → фактическое пояснение разницы agreement/default/contested
  (из attorney-approved vault, после утверждения) + повтор вопроса.
  НЕ подсказывать, «что выбрать».

**Критично:** стоп-экран — не «отказ в обслуживании» тоном, а честная
граница. Формулировки через check-upl-copy; тексты пометить в
research.md как требующие attorney approval (это новый контент).

**Q29 остаётся** — как подтверждение пути ближе к концу (ситуация могла
измениться за время заполнения). Несовпадение раннего фильтра и Q29 →
Court-Readiness Check помечает ⚠️ и просит подтвердить.

**Готово когда:** тестовый проход с ответом 3 останавливается на
стоп-экране с сохранением данных; с ответом 1/2 — проходит; тексты
в i18n всех локалей; линт чист; в research.md добавлена строка
«contested stop-screen copy — UNVERIFIED, clears by attorney approval».

---

## 10.2 DECISIONS.md — две записи

```
2026-07: Attorney review обязателен в Фазе 2 (основной оффер), 
софт-тир только с явным отказом или убирается. Причины: честность 
оффера «вас не развернут», защита сарафана, чистота UPL-профиля, 
переговорная позиция с адвокатом.

2026-07: Ранний contested-фильтр после Q08. Contested-кейсы — вне 
продукта, стоп-экран с сохранением данных. Q29 остаётся подтверждением.
```

**Готово когда:** обе записи в DECISIONS.md с датой.
