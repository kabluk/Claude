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

## 8.2 Fee Waiver (FW-001 / FW-003)

Привязать FW-001, FW-003 тем же конвейером (+ demo + check-forms). Шаг визарда
«Судебная пошлина»: benefit-чеклист + доходные пороги (источник+дата в
research.md). Результат фактический: «При получении X суд обычно освобождает от
пошлины — FW-001 добавлена». Лендинг-hook в trust-блок.

**Готово когда:** оба demo read-back; чеклист добавляет/не добавляет FW; пороги
имеют источник в research.md; UPL чист.

## 8.3 Таймлайн-сопровождение (pg_cron + Edge Functions, БЕЗ n8n)

Таблица `case_milestones`; генерация вех из service_date (арифметика дат с
юнит-тестом); daily pg_cron → Edge Function `notify-milestone` → Telegram/Twilio;
opt-in канал + consent в Cabinet; шаблоны в i18n (+ UPL-линт на них); секреты в
Supabase. FACTUAL: только дедлайны + ссылки, без императива совета.

**Готово когда:** юнит-тест арифметики вех; ручной вызов доставляет в тестовый
Telegram на ru/es; pg_cron job миграцией; шаблоны UPL-чисты.
(Живая доставка — deploy-gated: нужны секреты и проект Supabase.)

## 8.4 Фото → форма (paystub → FL-150)

Edge Function `extract-paystub` (Claude vision, строгий JSON, null-не-угадывать,
temp 0, ключ в secrets). Шаг в доходах FL-150: фото → черновик с подсветкой →
клиент ПОДТВЕРЖДАЕТ каждое значение (client-directed) + равноправный ручной
ввод. Хранение в приватном бакете Supabase, RLS по case_id, retention (blocking
fact в research.md). Второй шаг (отдельный коммит): фото врученных документов →
FL-115 + service_date. MECHANICAL. COGS vision в research.md.

**Готово когда:** 5 тестовых изображений → JSON без выдумок; подтверждённые
значения проходят demo FL-150; RLS-тест; нечитаемое → фактический отказ.
