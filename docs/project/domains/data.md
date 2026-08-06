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

## G-PRICE: сплошная проверка опубликованных цен, 245/245 (2026-08-06, D-045)

**Метод.** Не поиск «сколько стоит аудит» вообще, а обход сайтов самих агентств:
для каждого домена — главная + все внутренние ссылки, чьи URL или текст похожи
на прайс/услугу (`preise|cennik|tarifs|prezzi|tarieven|pricing|audit|leistungen`…),
до ~38 страниц на сайт; в тексте искалась сумма рядом с валютой, каждое попадание
затем читалось руками. 23 сайта отдают пустой HTML (JS-рендер или анти-бот) —
они добраны отдельно: поиск по домену, чтение sitemap.xml и, где живая страница
закрыта, архивная копия. Итог покрытия: **245 из 245 проверены**, слепых зон,
о которых мы не знаем, не осталось.

**Результат (честный, а не красивый).**

| | сколько | что это значит |
|---|---|---|
| цена аудита опубликована и маппится в band | **17** (7%) | заполнено, у каждого URL прайса + цитата суммы |
| цена опубликована, но это НЕ цена аудита | **31** (13%) | обучение, SaaS/мониторинг, ставки за час/страницу, мини-скан, чужие услуги |
| цена не опубликована вовсе | **197** (80%) | пусто и останется пустым — «запросите предложение» |

Ожидание подтвердилось: **большинство рынка цен не публикует**, и это свойство
рынка, а не пробел в нашей работе.

**Заполнено 17** (band ← цитата, правило пересчёта — D-045):

| slug | band | опубликовано |
|---|---|---|
| `wcag-audyt-pl` | budget | «Audyt Dostępności 7399 PLN / 8499 PLN» netto |
| `audyt-dostepnosci-pl` | budget | «Audyt Podstawowy 2 500 zł / Rozszerzony 5 000 zł netto» |
| `reddog-systems` | budget | «Ile kosztuje audyt dostępności? 1 350 zł» (z VAT, ≤30 podstron) |
| `eclusief` (бренд Normeris) | budget | «WCAG-onderzoek … € 1.950,-» (Quickscan € 595,-) |
| `anysurfer` | budget | «Klein: 1250€ … Standaard: 2500€ … Complex: 4000€ voor eerste audit» |
| `auditores-accesibilidad` | budget | «Full Audit … desde 600€» (Quick Scan desde 300€) |
| `purin` | budget | «Barrierefreiheits-Audit ab 540 € · bis zu 3 Seiten» |
| `damteq` | budget | «a one-off Accessibility Audit will start from £1,650 +VAT» |
| `abilitynet` | mid | «entry-level Digital Accessibility Review is a fixed £4,950 +VAT» |
| `access42` | mid | «Audit de conformité web : entre 1 800 € et 5 600 € HT» |
| `boscop` | mid | audit RGAA «Initier»: «Prix indicatif : de 2000€ à 6000€ HT» |
| `accessprod` | mid | «L'audit RGAA détaillé … de 2 100€ HT à 4 900€ HT» |
| `jim-byrne-associates` | mid | «Costs start at £2500 … in the region of £2500 / £4000» |
| `rockit` | mid | «Vollaudits … zwischen 4.000 und 12.000 Euro» (Quickcheck ab ~1.500) |
| `nettkonsult` | mid | «WCAG-revisjon … fra 1 300–2 600 EUR … 4 500–13 000 EUR» |
| `skynet-technologies` | mid | тарифы аудита «5 Pages $500 … 100 Pages $12,500» |
| `level-level` | mid | «WCAG Audit … €2.450,-», «WCAG Audit + … Vanaf €4.500,-» |

Две записи (`rockit`, `level-level`) сняты с архивной/прямой HTTP-копии: живые
страницы отдают анти-бот заглушку нашей автоматике. Записано в `label`, как и в
прецеденте `G-CERT-FRAGILE`, — не выдаём непроверяемое за проверенное.

**Опубликовали цену, но поле оставлено пустым — 31, с причиной** (это и есть
журнал отклонений, чтобы при следующем аудите не искать заново):

- *Цена есть, но бэнд не определяется однозначно (D-045, правило ±10% от границы):*
  `akse` (1600–4500 €), `access-first` («audit simple ≥2250€ / avec rapport ≥3000€»).
- *Не аудит, а более узкая услуга, которую агентство само отличает от аудита:*
  `200-ok` (miniscan vanaf €480), `accessibility-shield` ($100 Test My Site Report,
  прямо назван preliminary), `all-able` (£100 за разбор формулировок в заявлении),
  `abra` (от €2.000 — тестирование с пользователями с инвалидностью, не WCAG-аудит).
- *Ставка за единицу, а не цена работы:* `urbilog` (200 € HT/страница; blind test
  299 €), `access-by-design` (£150 за 60-минутную сессию).
- *Подписка/SaaS/ретейнер:* `ifdb` (4,00 €/страница, 79–199 €/мес), `cardan`
  (€175–275/мес), `tu-web-accesible` (desde 290 €/год), `accessible-web` ($299/мес),
  `equalize-digital` (плагин $190–2 250/год + ремедиация $1 199–7 999/мес),
  `lepszyweb` (валидатор 600–1800 PLN/год).
- *Обучение:* `webaim`, `fundacja-widzialni`, `vision-australia-digital-access`,
  `eagerly`, `alsacreations`, `inter-vlaanderen`, `grackledocs`.
- *Цены на другие услуги:* `telekom-mms` (Business GPT), `creasit`, `virtualmedia`,
  `alpanet`, `perfekcyjnestrony` (сайты и шаблоны), `metadrop` (миграции на Drupal
  от 25 000 €), `testpros` (GSA/CUI кибербезопасность $15–40k), `nautil`
  (архитектурный аудит, кейс).
- *Рыночный ориентир в собственном блоге, а не прайс:* `converge-accessibility`
  («a competent audit costs $10,000–$25,000»), `accessibility.works`
  («$3,000 to $30,000»). Соблазн был реальным: это ровно тот случай D-044, когда
  «похожий» текст на правильном домене говорит не о том предмете.

**Германия: 0 из 40** — проверено сплошь, двумя независимыми способами (обход
HTML + чтение главных страниц моделью). Формулировка на `/bfsg-check/`
(«Wir zeigen keine Preise je Agentur… geraten wird bei uns nichts») остаётся
верной; менять её не потребовалось.

**Ограничения метода, которые стоит помнить.** Цена, нарисованная картинкой или
спрятанная за формой/логином, обходом не видна; цена, опубликованная только в PDF
прайс-листа, тоже. Курс валют зафиксирован на дату (D-045) — при сильном сдвиге
курса пограничные записи (`damteq`, `jim-byrne-associates`, `skynet-technologies`)
надо пересчитать, поэтому цитата суммы хранится дословно и пересчёт можно
повторить, не открывая сайт заново.
