# Директория учреждений · data/directory.json · 2 августа 2026

Поиск по учреждениям в инструменте свиданий (VisitFinder) работает
на этом наборе.

## Источник

- **Deportation Data Project**, набор «Detention facility locations»,
  обновление 15 июня 2026. Это данные из собственных двухнедельных
  таблиц ICE, собранные и геокодированные проектом.
- Цитирование: «government data published by ICE, collated by the
  Deportation Data Project».
- Исходный файл: `facilitieslatest.parquet` (в репозиторий не кладём —
  зависимость сборки от parquet не нужна; JSON сгенерирован разово).

## Фильтр (844 → 196)

Оставлены реальные детеншн-центры, куда семьи ездят на свидания:
- убраны коды `*HOLD` (hold room'ы);
- убраны по стоп-словам в названии: hold room, staging, hospital,
  coord/removal operation, border patrol, port of entry, checkpoint,
  CBP, field office, sub-office, transportation;
- порог `max_daily_population_last_year >= 25` (убирает места, где за
  год держали единицы);
- обязателен адрес (`address_full`).

Проверено: среди отброшенных с max>=100 — только staging-лагеря,
hold room'ы и офисы ICE, реальных центров не потеряно.

## Поля (только официальные факты)

code, name, address, city, county, state, zip, circuit
(федеральный округ — из federal_court_circuit_of_confinement),
field_office. 196 учреждений, 45 штатов.

Часы, телефоны свиданий и правила НЕ входят — они волатильны.
На карточке: адрес + округ (+ предупреждение для 5-го и 8-го округов,
где власти настаивают на обязательном задержании) + ссылка на живую
страницу ICE + скрипт звонка. Дата данных показана пользователю.

## Обновление

Скачать свежий parquet с deportationdata.org, прогнать тот же фильтр,
перегенерировать data/directory.json, обновить дату. Аделанто —
проверенная вручную карточка (data/facilities.json, code ADLNTCA) —
показывается поверх директории с реальными правилами свиданий.
