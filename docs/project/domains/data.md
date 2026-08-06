# Домен: data

Обновлено: 2026-08-05 · Владелец: data-engineer

- Источник истины: `data/a11y/agencies.json` — **245 записей** (было 253), 20 стран с данными.
- Правила наполнения: `data/a11y/README.md` (≥1 источник, ничего не выдумывать,
  пустое поле лучше догадки). `excluded.json` защищает от воскрешения удалённых.
- **Описания: 245/245 (100%)**, после A0-ENRICH (commit `e0c9a85`) + A0-DESC-REST
  (commit `1985a15`, 5 параллельных субагентов). Города/цены/сертификации ещё не
  пересчитаны после enrichment — обновить при следующем аудите.
- `excluded.json` — 10 записей на 2026-08-05: the-pixel, annanpura (закрылась), + 8 из
  A0-DESC-REST (abledocs, bunnyfoot, snook, capita, online-ada, ron-zuidema, zigt-create,
  cimeos — мёртвые/заброшенные/поглощённые сайты или нет услуг доступности). Паттерн
  проверки закреплён: сайт компании — единственный источник истины, не сторонние списки.
- Конвейер: collect → merge → enrich (только пустые поля) → build (валидация/индексы).
- Уникальный актив: 99 агентств из гос-деклараций ЕС (`gov-declared-auditor` бейджи
  с evidenceUrl). NL добывался из 1569 PDF; PL — регуляркой по шаблону деклараций.
- Цель роста: 600 агентств (blueprint источников — deepdive §4); текущий фокус —
  глубина (описания), не ширина.

## Бейдж `gov-declared-auditor` утверждал больше, чем есть в данных (2026-08-06, D-041)

Подпись гласила «Named auditor in a **government** accessibility statement».
Проверка `evidenceUrl` показала, что часть деклараций опубликована не
госорганом: `mazda.de`, `nanu-nana.at`, `stiftung.adac.de`,
`pflege-und-zuhause.de`. Общий проверяемый знаменатель — «названы внешним
прюфером в ОПУБЛИКОВАННОЙ декларации о доступности»; подпись приведена к нему
(`certLabel` в `src/lib/data.ts`, фасет в `FilterableList`). Слаг оставлен
историческим, `data/a11y/types.ts` не менялся — схема без записи в DECISIONS не
трогается.

Знак от правки не слабеет: он подтверждён самим документом, и на
`/bfsg-check/` ссылка на документ стоит у каждой записи — читатель проверяет
сам, а не верит нам. Но развести «декларация госоргана» и «декларация частной
компании» отдельным признаком всё ещё стоит: заведён `G-CERT-EVIDENCE`
(BACKLOG) на перепроверку всех 90+ записей. Там же отдельная аномалия: у `ifdb`
заявлена `country:'DE'`, а декларация австрийская (`nanu-nana.at`).

Немецкий срез каталога (проверено командами, не по памяти): 40 агентств с HQ в
DE, 42 обслуживают DE; описания `de` — 40/40; `certs` — 35/40 (19
`bitv-pruefstelle`, 18 названы в декларациях); `priceBand` — 0/40, не
заполняется догадками; `founded` — 8/40.

## G-CERT-EVIDENCE: перепроверены все 96 доказательств бейджа (2026-08-06, D-042)

Метод: каждый `evidenceUrl` открыт вживую (curl/pdfjs для PDF, WebFetch там, где
нужен смысл страницы), в тексте найдено само упоминание агентства, определён
владелец сайта-декларанта. Ничего не переносилось «по аналогии» — 96 отдельных
проверок. Результат: **96/96 подтвердились**, ни один бейдж не снят,
`excluded.json` не пополнялся.

Схема: `kind: 'gov-declared-auditor'` → `'statement-named-auditor'`, добавлено
обязательное `declarant`. Итог по декларантам: **81 public-body · 13 private ·
2 unknown**.

**Частные декларанты (13)** — бейдж остаётся, но подпись теперь другая:
`medienkonzepte` (Mazda Motors Deutschland GmbH), `pluspol-interactive` (ADAC
Stiftung), `visionbites` (Ategris GmbH), `hellbusch-accessibility-consulting`
(wbv Media GmbH), `ifdb` (Nanu-Nana Internetshop GmbH & Co. KG),
`craftzing` (Proximus), `inter-vlaanderen` (Scouts en Gidsen Vlaanderen vzw),
`fondazione-lia` (Rizzoli Education S.p.A.), `k25-werbeagentur`
(Österreichischer Factoring-Verband), `mstage` (Kelly GmbH), `licorn-publishing`
(Orange Concessions), `perfekcyjnestrony` (Energa-Operator S.A.), `optimal-it`
(Fundacja Zdrowia Śląska Cieszyńskiego). Правило разбора: `public-body` — орган
власти, публично-правовое учреждение (в т.ч. вуз, больница, суд, касса
соцстраха, самоуправляемая институция культуры) или компания, полностью
принадлежащая такому органу и выполняющая его задачу (DigitalService GmbH des
Bundes, VMT GmbH, Odolanowski Zakład Komunalny, Kosakowo Sport). Частные
компании и частные фонды/объединения — `private`, даже когда декларация
опубликована по требованию закона (BFSG/EAA). При сомнении берётся **более
слабая** категория, а не более сильная.

**Самоаттестация: 9 записей (главная находка).** У `swink`, `accessy`,
`toegankelijk-online`, `accessibility-desk`, `janita-top`, `frameless`,
`media-duo`, `digital-natives` и `200-ok` доказательство лежало на домене
самого агентства (у `200-ok` — на его же портале `toegankelijkheidsonderzoek.nl`,
чего механическая проверка по домену сайта не ловила). Нидерландский контекст:
отчёт публикует аудитор, а обязательная декларация заказчика лежит в
государственном реестре. У всех девяти запись реестра найдена и открыта —
`toegankelijkheidsverklaring.nl/register/{24755, 23293, 26041, 26755, 24057,
25945, 26742, 21012, 24678}`; декларанты: Kadaster, Gemeente Amstelveen, Het
Waterschapshuis, Provincie Noord-Brabant, Provincie Fryslân, Gemeente Utrecht,
Gemeente Emmen, Nederlands Filmfonds, Dienst Gezondheid & Jeugd ZHZ. Запись
реестра стала `evidenceUrl`, отчёт аудитора — `sourceRefs`.

Нюанс, который важно не потерять: реестр NL часто не пишет имя аудитора
текстом, а даёт ссылку на его отчёт («Onderzoek uitgevoerd door: een
onafhankelijke derde partij» + URL). Именно ссылка и есть атрибуция публичного
органа. У `digital-natives` формулировка слабее — «uitgevoerd door: de
leverancier» (аудит сделал подрядчик, не независимая сторона); бейдж
«названы в декларации» это не нарушает, но для будущего фасета «независимый
аудит» запись помечена здесь.

Остальные NL-записи доказательство не меняли: у `abra`, `cipix-internetbureau`,
`zekers-online-communicatie`, `x-com`, `eagerly` отчёт лежит на домене
заказчика или на `digitoegankelijk.nl` и называет агентство внутри документа
(проверено извлечением текста PDF: «Onderzoeksbureau Cipix BV»,
«Onderzoeker: X-com» — при том что запись реестра у X-com говорит «uitgevoerd
door: de overheidsinstantie zelf», то есть первичный документ точнее реестра).
`chent` — отчёт на стороннем реестре `wcagregister.nl` (платформа
WCAGAudit.app, не домен Chent), «Uitgevoerd door: Chent — Vincent van Brakel».

**Аномалии из постановки задачи — закрыты.** `ifdb`/`nanu-nana.at`: декларацию
публикует немецкая Nanu-Nana Internetshop GmbH & Co. KG, ссылается на
Richtlinie (EU) 2019/882 и **BFSG** и на www.nanu-nana.de — `country:'DE'`
верна, `.at` — австрийская витрина того же магазина. `akademia-slonca`:
`res.cloudinary.com/teatr-wybrzeze/…` — CDN-аккаунт самого заказчика, документ
подтверждён («Raport z audytu… Wykonawca Akademia Słońca Krzysztof Frąszczak»,
заказчик — Teatr Wybrzeże), но ссылка хрупкая → `G-CERT-FRAGILE`.

**Что не удалось проверить автоматикой (и как это записано честно).**
`anact.fr/accessibilite` (ebizproduction) закрыт анти-бот защитой Anubis —
содержание подтверждено снимком Wayback от 2026-01-16: «L'audit de conformité
réalisé par la société Ebizproduction | bluedrop.fr». Живая ссылка оставлена
как каноническая, запись — в `G-CERT-FRAGILE`. Два декларанта
(`uxmen`, `databot-technologies`) не идентифицированы по самой странице →
`declarant: 'unknown'` и `G-CERT-UNKNOWN`, а не догадка.

Разбивка по странам (по `cert.country`): PL 26 · FR 25 · DE 18 · NL 15 · BE 5 ·
AT 4 · ES 2 · IT 1. Счётчики на страницах выводятся из данных и пересобрались
сами; `/bfsg-check/` по-прежнему показывает 18 немецких записей, но у каждой
ссылки теперь стоит «öffentliche Stelle» или «privates Unternehmen».
