# BACKLOG

## Волна A (параллельно, после bootstrap)
- A1 [data-engineer] Дельта-движок: scripts/delta.mjs, сравнение двух
  снапшотов Census+authority по контракту INTERFACES; тест на реальной
  паре 14→15.08. Выход: data/events/2026-08-15.ndjson + отчёт в
  domains/data.md. DoD: типы событий покрыты тестами, счётчики в сводке.
- A2 [software-architect] Ревью схемы D1 + миграции (migrations/0001).
  Выход: INTERFACES.md без TBD, wrangler.jsonc с D1-биндингом.
- A3 [backend-engineer] Лоадер Census→D1 батчами; локальный прогон на
  wrangler d1 --local. DoD: count(*) сходится с манифестом по активным.
- A4 [frontend-engineer] Макет entity-страницы: блоки (статус, authority,
  страховка, история событий, safety-факты, дисклеймер), состояние
  «неактивный перевозчик». Выход: domains/frontend.md + HTML-прототип.

## Волна B (после A)
- B1 Astro SSR каркас на CF-адаптере, роуты /carrier, /trucking-companies,
  /phone; B2 sitemap-шарды+robots+JSON-LD+llms.txt; B3 гео-хабы;
  B4 главная+методология+юрстраницы (ToS с запретом employment-скрининга).

## Отдельно
- C1 [владелец] Купить carrierradar.com.
- C2 [devops] Удалить старый крон из kabluk/Claude после зелёного здесь.
- C3 [growth] Заявки в партнёрки (факторинг/страховка/топливо) — после B.
