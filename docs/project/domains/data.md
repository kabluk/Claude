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

## G-FOUNDED: год основания — 65/245, журнал отклонений (2026-08-06, D-047)

Метод тот же, что закрыл G-PRICE: сплошной обход всех 245 сайтов
(homepage → «About/Über uns/O nas/À propos» по ссылкам → те же страницы из
`sitemap.xml` → LinkedIn-профиль, если на него ссылается сам сайт), поиск
формулировок основания на 12 языках, затем ручная адъюдикация каждой находки.
Патч воспроизводим: `scripts/apply-founded.mjs`.

**Итог.** `founded` заполнен у **65 из 245** (было 31): проставлено 43,
исправлено 1, снято 9, добавлено 66 источников. По странам: US 15, DE 12,
FR 11, GB 10, PL 5, IE 3, CA 2, NL 2, AT/AU/CH/ES/FI по 1. Германия: **12 из 40**
(было 8).

### Почему LinkedIn не стал источником

Год есть в LinkedIn-профиле у **121** агентства — заманчиво было закрыть этим
половину каталога. Замер остановил: у **24** агентств год опубликован и на
сайте, и в LinkedIn, и они **расходятся в 6 случаях (25%)**. В пяти из шести
права оказалась страница агентства (шестое — ошибка нашего извлечения:
«Powstały w 1994 r. magazyn „Integracja“» — про журнал, а не про фонд).
Значение с известной долей ошибки 1 к 4 в каталоге, который продаёт
проверяемость, недопустимо. LinkedIn засчитан только как подтверждение
(правило D, 15 записей); **72 записи, где он остался единственным источником,
отклонены**.

### Журнал отклонений

| Категория | Сколько | Примеры и причина |
|---|---|---|
| Только LinkedIn, на сайте года нет | 72 | `tpgi` 2002, `allyant` 2022, `siteimprove` 2003, `torchbox` 2000, `system-concepts` 1981, `funka`, `axess-lab`, `swink`, `craftzing`, `altix`, `zeto-rzeszow`… — источник не перепроверяется по сайту, расхождение ~25% |
| Конфликт сайт ↔ LinkedIn, взят сайт | 4 | `level-access` (LI 1997 → сайт 1999), `dmk-ebusiness` (2005 → 2008), `metadrop` (2010 → 2011), `equal-entry` (2014 → 2012) |
| Конфликт внутри собственных публикаций → пусто | 5 | `avaava` (бренд 2009 vs юрлицо Avaava Digital Oy 2017), `twin-cubes` («Seit 2010» vs «Gegründet 2017»), `brain-appeal` («seit 1998» vs 2013), `skynet-technologies` (сайт 2002 — группа, LI 2019 — Skynet Technologies USA LLC), `alpanet` («Z Państwem od 2000 roku» vs отзыв «od 2012 roku») |
| Год относится к ДРУГОМУ юрлицу или объекту | 9 | `anatom5` 2014 — год основания IAAP, не агентства; `bsvh` 1925 — «Genossenschaft blinder Handwerker Hansa»; `new-editions-consulting` 1979 — журнал Inc. на странице наград; `numerik-ea` 2001 — агентство ecedi (партнёр); `fundacja-integracja` 1994 — журнал «Integracja», не фонд; `optimal-it` 1996/1994/1936 — годы КЛИЕНТОВ из портфолио; `nomensa` 2014 — Sionic Advisors (фирма CEO); `hcltech` 1976 — материнская HCL, а запись про HCLTech; `bikosax` 1894 — dzb lesen, другая организация |
| Год деятельности/специализации, не организации | 20+ | `anysurfer` «Sinds 2001 helpen we organisaties», `ilikecake` «proven track record … since 2006», `nexer-digital` «Since 2007, our team has built a reputation», `bitv-consult` «seit 2008 als selbstständiger Berater», `wienfluss` «mit Kompetenz seit 2005», `venti` «kampanie Google Ads … od 2005 roku», `akcess-net` «Od 2002 roku pomagamy firmom», `kolibri-online`/`damteq`/`atalan`/`ipedis` — тот же класс, но спасены правилом D |
| Год закона, сертификата, мероприятия | 8 | `ethic-first` «Depuis 2019, les entreprises privées…» (норма права), `net-15` «Depuis 2019 l’Audit RGAA…», `sito-web-accessibile` «in vigore dal 2025», `specinov` «Label NR niveau 2 depuis 2022», `liquid-impressions` «Seit 2020 weisen wir … Eignung nach», `fondazione-lia` «ogni anno dal 2011» (GAAD), `deutsche-telekom-mms` «Seit 2021 … Strom aus erneuerbaren Energien» |
| Опыт основателя, а не компании | 4 | `digitelle` «har bygget på WordPress siden 2005», `zekers-online-communicatie` «Online sinds 1997», `purin` «WordPress seit 2005», `usable-y-accesible` (сайт-CV фрилансера) |
| Год не опубликован вовсе | ~140 | `usablenet`, `web-usability`, `dig-inclusion` — в том числе три записи, у которых значение стояло раньше |

Копирайт в футере («© 2003–2026») не использовался ни разу: проверка требует
формулировку основания рядом с годом, а не просто год.

### Что было со старыми значениями

Повторение находки G-PRICE: **из 31 значения источник года был ни у одного**.
После проверки 21 подтверждено дословной цитатой, 1 исправлено, 9 снято.

- **Исправлено:** `knowbility` 1998 → 1999. Главная: «worldwide leader in
  accessible information technology since 1998» (опыт). Страница About:
  «It was founded in 1999 as the result of a two year community collaboration».
  Явная формулировка перевешивает маркетинговую.
- **Снято (9):** `anatom5`, `bitv-consult`, `anysurfer`, `ilikecake`,
  `nexer-digital`, `usable-y-accesible` — держались на формулировках о
  деятельности; `usablenet`, `web-usability`, `dig-inclusion` — года на сайте
  нет вообще.
- **Восстановлено с источником:** `insert-effect` 2002 (сайт «Seit 2002
  entwickeln wir Web und Apps» + LinkedIn «Gegründet 2002», правило D).

### Гейт

`founded` без sourceRef, цитирующего ИМЕННО этот год, — ошибка
`build-a11y.mjs`. ISO-даты из label вырезаются перед проверкой, иначе
вездесущее «checked 2026-08-06» доказывало бы `founded: 2026`. Негативная
проверка: четыре нарушения → 4 ошибки, exit 1; откат → зелёная сборка.
Дубль правила и регресс-тест на ISO-дату — `scripts/founded.test.mjs`.

## G-FOUNDED-LI: пробный пакет 20/180, полный журнал по каждой записи (2026-08-06, D-051)

**Почему это отдельная запись, а не продолжение прежней.** Полный список 72 записей
«только LinkedIn» из D-047 в репозитории не сохранился как данные — только число
72 и 11 slug'ов через многоточие в таблице выше. Это сам по себе экземпляр orphan-
проблемы (см. `LEARNING_LOG.md`), только про **список**, а не про поле. Полный
список из 180 записей без `founded` реконструирован заново; 20 из них проверены
пробным пакетом — с этой минуты выходные данные каждого пакета фиксируются
построчно, ниже, а не пересказываются числом.

Метод — глубже первого прохода D-047: тот проверял homepage → About → sitemap.
Здесь дополнительно — Impressum/Imprint/mentions légales/aviso legal (часто содержат
Handelsregister/SIRET/Registro Mercantil с датой), страницы «История»/«Team»/
«Career», футер (иногда там год основания, а не просто копирайт).

**Найдено и внесено (6):**

| slug | год | источник |
|---|---|---|
| `siteimprove` | 2003 | About Us: "He founded Siteimprove in 2003" |
| `swink` | 2007 | Our Story: "Swink was founded in 2007" |
| `altix` | 1989 | Historia firmy: "Spółkę Altix zawiązali w maju 1989 r." |
| `zeto-rzeszow` | 1966 | Historia: "1 lipca 1966 roku ... powołały do życia Zakład ... ZETO w Rzeszowie" |
| `sensus` | 1987 | Om Sensus: "Virksomheden blev etableret i 1987" |
| `boscop` | 1993 | Notre SCOP: "Créée à Paris fin 1993" |

**Проверено, год нигде не публикуется — остаётся пустым (13):** `tpgi`, `allyant`,
`torchbox`, `system-concepts`, `axess-lab`, `craftzing`, `waca`,
`vision-australia-digital-access`, `eleven-ways`, `grackledocs`,
`agentur-barrierefreie-website`, `be-accessible` — Impressum/реестр без даты или без
Impressum вовсе; `funka` — на сайте только «turned into a privately owned company in
2000» (смена организационно-правовой формы, не основание — категория из D-047,
«год деятельности/реорганизации, не организации»).

**Не принято, требует второго источника (1):** `inforges` — `aviso-legal` называет
дату первой инскрипции в Registro Mercantil de Murcia (02/07/2007), но это может
быть регистрация в конкретном реестре/провинции, а не дата основания компании как
таковой. Оставлено без `founded` до отдельной проверки (страница истории, если
появится, или прямой запрос).

**Проверка агентов на слово, не на отчёт.** Пакет B первым ответом вернул «файл
обновлён» без единой находки — переспрошен явно. У того же пакета находка по
`funka` была под подозрением («turned into a privately owned company» — это не
формулировка про основание) и при переспросе агент сам её снял, подтвердив
NOT FOUND. Ни одна находка не принята по слову агента — под каждую из 6
принятых есть дословная цитата, которую можно перепроверить по URL.

**Остаток очереди — 160 записей** (180 − 20 пробного пакета), включая полный список
из 72 «только LinkedIn» за вычетом 9 уже проверенных здесь (`tpgi`, `allyant`,
`siteimprove`, `torchbox`, `funka`, `axess-lab`, `craftzing`, `waca` и часть batch D/E)
и оставшиеся из 180, где неизвестно даже это. Список остатка не восстановлен
построчно — при следующей итерации G-FOUNDED-LI брать оставшиеся `founded == null`
записи из `data/a11y/agencies.json` напрямую, не из прозы.

## G-FOUNDED-LI: повторный проход, пакеты 3/6/7/8/9 из 10 (2026-08-07)

Очередь `founded == null` реконструирована заново из `agencies.json` (160 записей,
как и предсказывал прошлый журнал), разбита на 10 пакетов по 16 и роздана
параллельным субагентам (метод глубже первого прохода D-047: About/История/Team →
Impressum/торговые реестры/aviso legal → footer, не только homepage+About+sitemap).

**Пять пакетов из десяти упали на лимите сессии** (`API error: session limit`,
не ошибка метода) — пакеты 1, 2, 4, 5, 10 (80 записей) не выполнены, остаются в
очереди на следующую итерацию наравне с непроверенными. Ниже — результат ТОЛЬКО
пяти успешных пакетов (3, 6, 7, 8, 9 — 80 записей).

**Каждая находка перепроверена детерминированным скриптом** (`verify-quotes.mjs`,
не хранится в репозитории — одноразовый инструмент сессии), не по слову агента:
скрипт скачивает страницу-источник и ищет дословную цитату в тексте. 18/21 совпали
автоматически; 3 (`x-com`, `ebizproduction`, `net-15`) потребовали ручной проверки
из-за JS-рендера / HTML-сущностей / нестандартного дефиса — все три подтверждены
вручную (см. коммит). Затем инвариант сборки доказан негативно: у `lorweb` снята
цитата года → `build-a11y.mjs` упал с точным указанием записи, `founded.test.mjs`
дал 4/5 вместо 5/5 → откат → снова зелёно.

**Принято (21), год + первоисточник + дословная цитата у каждой:**

| slug | год | источник |
|---|---|---|
| `sernicola-labs` | 2015 | schema.org JSON-LD homepage: `foundingDate:"2015"` + "fondata nel 2015" |
| `gmg-net` | 2000 | Chi siamo: "2000 - Nasce Gmg Net da un'idea di Luca e Giuseppe" |
| `myability` | 2014 | Über myAbility: "2014 gründeten sie ... myAbility" |
| `anysurfer` | 2001 | Geschiedenis: "Op 18 april 2001 werden het project ... voorgesteld aan de pers" (oprichting als BlindSurfer, in 2006 alleen hernoemd) |
| `etu` | 1995 | Om ETU: "Vi startade ETU 1995" |
| `accessability-officer` | 2021 | About: "founding AccessAbility Officer in 2021" |
| `x-com` | 2000 | Geschiedenis-tijdlijn (JS uit timeline.json): "In 2000 richten partners Bas Peters en Wim van der Wouw gezamenlijk X-com op" |
| `chent` | 2018 | Over Chent: "Chent is in 2018 opgericht" |
| `frameless` | 2013 | Homepage: "Sinds de oprichting van Frameless in 2013" |
| `inter-vlaanderen` | 2014 | "Inter werd opgericht via het Vlaamse machtigingsdecreet van 28 maart 2014" |
| `fondazione-lia` | 2014 | "Nel 2014 ... AIE ha quindi costituito Fondazione LIA" |
| `pluspol-interactive` | 2002 | Agentur: "2002 als Start-up von Jörg Brückner, Stefan Dittmar und Thomas Lange ... gegründet" |
| `brain-appeal` | 1998 | Firmengeschichte, Eintrag "1998" = "Das Gründerjahr!" |
| `bikosax` | 1894 | dzb lesen (bikosax.de leitet dorthin) Geschichte: "Am 12. November 1894 gegründet" |
| `interface-consult` | 1994 | Über uns: "Interface Consult wurde 1994 als Universitäts Spin-Off ... gegründet" |
| `mstage` | 2012 | Unsere Geschichte: "2012 wurde mStage ... gegründet" |
| `alsacreations` | 2006 | Timeline "2006 : Le lancement": "Création officielle de l'agence" |
| `ebizproduction` | 1998 | bluedrop.fr, tuile "1998" / "Année de création" |
| `eclydre` | 1993 | Agence: "Eclydre est une agence web indépendante fondée en 1993" |
| `lorweb` | 1997 | Histoire: "Fondé en 1997 par Jean-Philippe Brechon" |
| `net-15` | 1997 | Frise historique: "1997 – La création de Net15" |

**Пересматривает прежний вывод (1): `anysurfer`.** D-047 видел только формулировку
деятельности на главной («Sinds 2001 helpen we organisaties») и не заполнил поле.
Глубокая проверка нашла страницу истории с явным основанием под первоначальным
именем BlindSurfer (переименован в AnySurfer только в 2006, миссия не менялась) —
принято по правилу A, не по вкусу.

**Отклонено — все 59 записей построчно (не пересказ числом, D-051), сгенерировано
из сырых результатов пакетов, не по памяти:**

| slug | вердикт | причина |
|---|---|---|
| `200-ok` | NOT_FOUND | CV назад до 1997, номер KVK, года основания 200 OK нет |
| `ablr` | NOT_FOUND | История происхождения без года; /about 404 |
| `abra` | AMBIGUOUS | Activity-start wording; единственное «opgericht» на странице — про Stichting Appt (2020, другая организация) |
| `access-armada` | NOT_FOUND | Только опыт («nearly 15 years») |
| `access-first` | UNREACHABLE | 403 «forbidden by administrative rules» на все запросы (geo/IP-блок прокси) |
| `accessibility-desk` | NOT_FOUND | Our-story называет основателей, года нет; © 2022 — копирайт |
| `accessible-ie` | NOT_FOUND | «initiative of xwerx.com … almost 25 years» — опыт; рег. номер 328994 без даты |
| `accessy` | NOT_FOUND | «initiatief van Marco Hout», года нет |
| `akse` | NOT_FOUND | «+50 clients accompagnés depuis 2020» — деятельность; SIRET без даты; LinkedIn-ссылки нет |
| `applause` | NOT_FOUND | Только «pioneered crowdtesting in 2007» (старт практики); LinkedIn заблокирован (999/503) |
| `axenum` | NOT_FOUND | Одностраничник + mentions légales без даты; на сайте только даты законов |
| `centrum-bezpieczenstwa-informatycznego` | NOT_FOUND | KRS без даты; «dawniej jednoosobowa działalność» — смена формы без года; награда 2018 не основание |
| `cipix-internetbureau` | NOT_FOUND | Только опыт; Cipix Internet B.V. названа без года |
| `content-design-ireland` | UNREACHABLE | SiteGround anti-bot captcha на все запросы, контент не получен |
| `creasit` | NOT_FOUND | «Plus de 26 ans d'expérience» — опыт |
| `databot-technologies` | NOT_FOUND | webaccesible.io без about/legal; databot.es за JS anti-bot |
| `digital-natives` | NOT_FOUND | «mede-oprichter» + «20 jaar ervaring» без года; KVK без даты |
| `eagerly` | NOT_FOUND | «Al 26+ jaar lang» — длительность без года |
| `egg-design` | AMBIGUOUS | Founder + since-wording; LinkedIn-ссылки на сайте нет |
| `equalize-digital` | NOT_FOUND | Только деятельность; LinkedIn заблокирован |
| `ethic-first` | NOT_FOUND | Года нет нигде; только даты законов |
| `hellbusch-accessibility-consulting` | NOT_FOUND | «Seit 2005 … freiberuflicher Consultant» — старт самозанятости |
| `humix` | NOT_FOUND | About без дат; Cronos Group — материнская, не считается |
| `ia-labs` | NOT_FOUND | Сайт-заглушка «now Vially»; рег. номер без даты |
| `ideance` | NOT_FOUND | RCS Rouen — номер без даты |
| `ifdb` | NOT_FOUND | Формулировка основания БЕЗ года («gegründet» без цифры) |
| `ilikecake` | NOT_FOUND | Since-wording, внутренне противоречивая (2005 vs 2006); подтверждает CLEAR из D-047 |
| `ilunion-accesibilidad` | NOT_FOUND | Только «años de experiencia»; история — на материнской ilunion.com |
| `inovagora` | NOT_FOUND | «Expert CMS WordPress depuis 20 ans» — специализация |
| `integrity-xd` | NOT_FOUND | Нет About/Story; года нет нигде |
| `janita-top` | NOT_FOUND | Старт самозанятости (отклоняемая категория) |
| `joconcept-webservice` | NOT_FOUND | Ueber-mich — CV владельца, карьерный шаг, не основание |
| `k25-werbeagentur` | NOT_FOUND | About/team/Impressum без года |
| `kbv-kompetenzzentrum-barrierefreiheit-volmarstein` | AMBIGUOUS | 2020 — ребрендинг существующей институции, 2025 — смена формы на gGmbH |
| `lcp` | NOT_FOUND | Over-ons без года; proclaimer без даты регистрации |
| `liquid-impressions` | NOT_FOUND | HRA без даты; «Inbetriebnahme der Webseite 2022» — запуск сайта; «seit 2020» — преквалификация закупок |
| `marc-haunschild-accessibility-consulting` | NOT_FOUND | Личный сайт фрилансера; «seit 2019» — спикерство |
| `media-duo` | NOT_FOUND | Одностраничник WP; только копирайт |
| `medienkonzepte` | NOT_FOUND | Вехи деятельности без даты основания; «seit über 20 Jahren spezialisiert» |
| `perfekcyjnestrony` | NOT_FOUND | JS-счётчик «lat na rynku» (опыт); about-страницы нет |
| `purin` | NOT_FOUND | «eigenes Unternehmen seit 2019» — seit-wording |
| `reddog-systems` | NOT_FOUND | «Od ponad 10 lat» — опыт |
| `rockit` | NOT_FOUND | Firmenbuch-номер без даты; года нигде нет |
| `schalk-and-friends` | NOT_FOUND | «seit 1999» только в meta/JSON-LD; LinkedIn за authwall |
| `silaos` | NOT_FOUND | «Depuis 2016» — деятельность; LinkedIn-ссылки нет |
| `siti-accessibili` | NOT_FOUND | Основатель назван без года; «anni di esperienza» |
| `sito-web-accessibile` | NOT_FOUND | Одностраничник, проект SyncLab Studio; только даты нормативки EAA |
| `specinov` | NOT_FOUND | RCS Angers без даты; таймлайн 2017 — только RSE-путь; «depuis près de 20 ans» — отзыв клиента |
| `stratis` | AMBIGUOUS | Depuis-wording + «depuis 27 ans»; LinkedIn недоступен через прокси |
| `sxo-beratung-martin-mutter` | AMBIGUOUS | Старт самозанятости (отклоняемая категория) |
| `tanaguru` | NOT_FOUND | SAS без даты; «© 2009-2026» — копирайт, 2009 про open-source софт |
| `team23` | NOT_FOUND | Все about-страницы и Impressum без года |
| `toegankelijk-online` | NOT_FOUND | Нет about-страницы; «25+ jaar ervaring» |
| `tothomweb` | NOT_FOUND | «+15 anys treballant» — опыт; Registre Mercantil без даты |
| `usable-y-accesible` | NOT_FOUND | CV-таймлайн, карьерное wording; подтверждает CLEAR из D-047 |
| `uxmen` | NOT_FOUND | Только копирайт и «deel van The Digitals» |
| `visionbites` | NOT_FOUND | «seit 20 Jahren»/«Seit über 15 Jahren» без года; HRB без даты |
| `wienfluss` | NOT_FOUND | «Mit Engagement … seit 2005» — деятельность; FN без даты; LinkedIn-ссылки нет |
| `zekers-online-communicatie` | AMBIGUOUS | Started-as-freelancer wording; «Online sinds 1997» — личная карьера |

51 NOT_FOUND, 6 AMBIGUOUS, 2 UNREACHABLE = 59, плюс 21 принятая = 80 (сходится с
числом переданных в пакеты). `content-design-ireland` и `access-first` —
UNREACHABLE, не NOT_FOUND: остаются в очереди для повторной попытки другим
методом/сетью, не считаются проверенными.

**Побочная находка: у `bikosax` домен-редирект.** `bikosax.de` перенаправляет на
`www.dzblesen.de` — BIKOSAX является сервисом самой организации dzb lesen (не
материнской компании, тот же признак, что и `funka` в прошлый раз, но здесь верно
обратное: это не смена формы, а тот же субъект под сервисным брендом). Источник —
основной домен организации, а не поддомен-редирект.

**Остаток `founded == null` после этого патча — 153 записи** (174 − 21 принятых;
174 — было после пробного пакета D-051, 245−71). Разбивается на: 14 уже
проверены и отклонены пробным пакетом D-051 (`tpgi`, `allyant`, `torchbox`,
`system-concepts`, `axess-lab`, `craftzing`, `waca`, `vision-australia-digital-
access`, `eleven-ways`, `grackledocs`, `agentur-barrierefreie-website`,
`be-accessible`, `funka`, `inforges`) + 59 УЖЕ проверены и отклонены в ЭТОМ
проходе (таблица выше) = **73 не браться за них повторно без нового источника/
метода**; остальные **80** (пакеты 1, 2, 4, 5, 10) НЕ проверены вообще —
сорвались на лимите сессии, не «отклонены» (73 + 80 = 153, сходится). Исправляет
арифметическую ошибку в первой версии этой записи (там стояло «160 − 21 = 139» —
160 было размером РАБОЧЕЙ очереди, из которой уже была вычтена первая 14, а не
полным числом `founded == null`; смешивать размер очереди с полным null-счётом —
тот же класс ошибки, что и «список сохранился только числом», D-051, только
про арифметику, а не про потерю списка). Следующей итерации: 80 непроверенных
не восстановлены построчно здесь — взять `founded == null` из `agencies.json`
напрямую и вычесть все 73 slug'а (14+59 выше), не пересказывать числом из прозы.

## G-FOUNDED-LI: пакеты 11-15, вся оставшаяся очередь (2026-08-07, D-053)

Оставшиеся 80 записей (пакеты 1, 2, 4, 5, 10 из предыдущей попытки) розданы
заново пятью параллельными пакетами по 16. **Обе первые попытки сорвались, не
дав ни одной строки результата**: первая — на лимите API-сессии (та же причина,
что у первого раунда), вторая — на interrupt пользовательского tool-use
посреди работы (переключение `/model`, не связано с содержанием задачи). Обе
уже собранные, но незавершённые транскрипты проверены на предмет частичных
находок — их не было, оба запуска прерваны до генерации структурированного
вывода. Третий запуск дошёл до конца всеми пятью пакетами.

**Каждая находка перепроверена детерминированным скриптом** (`verify-quotes.mjs`)
перед применением: 13/17 совпали автоматически, 4 (`barrierbreak`,
`braille-institute-access-solutions`, `skynet-technologies`, `web-usability`)
потребовали ручной проверки — три из-за anti-bot защиты живого сайта (обойдено
через живой `curl` с другим UA или архивную копию Wayback того же URL), один
(`vobacom`) прошёл сразу. Все 4 подтверждены вручную построчным сравнением с
живым/архивным содержимым страницы. Инвариант сборки доказан негативно: у
`vobacom` снята цитата года → `build-a11y.mjs` упал с точным указанием записи
(`agencies[225] vobacom: founded 1999 set, but no sourceRef label quotes that
year`) → откат → снова зелёно.

**Принято (17), год + первоисточник + дословная цитата у каждой:**

| slug | год | источник |
|---|---|---|
| `deutsche-telekom-mms` | 1995 | Corporate blog: "am 9. Januar 1995 ... offiziell gegründet" (предшественник Multimedia Software GmbH Dresden) |
| `anatom5` | 2003 | /agentur/grundsatz: "Als wir 2003 anatom5 gegründet haben" — пересматривает CLEAR из D-047 |
| `hcltech` | 1976 | "Our Journey" timeline: "HCL is founded ... 1976" |
| `barrierbreak` | 2004 | "...founded in the year 2004 with a strong belief..." (anti-bot, подтверждено через Wayback https) |
| `braille-institute-access-solutions` | 1919 | History: "founded the Universal Braille Press in 1919" (anti-bot, подтверждено через Wayback https) |
| `proper-access` | 2019 | "Opgericht in 2019, 900+ audits uitgevoerd" |
| `cardan` | 2002 | "Wij zijn in 2002 ontstaan" (специализация на доступности с 2016, та же организация) |
| `digitelle` | 2016 | "...startet han Digitelle i 2016..." + footer "Etablert i 2016" |
| `avaava` | 2017 | "Vuonna 2017 perustettiin Avaava Digital Oy" (бренд возник 2009 внутри Karanttia Oy, взят год юрлица) |
| `vision-australia` | 2004 | History: "In 2004 Vision Australia ... formed following the merger of..." |
| `skynet-technologies` | 2002 | Stat-плитка About Us: "2002" / "Founded in" |
| `sierra7` | 2009 | Leadership bio: "...since its founding in 2009" |
| `jim-byrne-associates` | 2003 | "In 2003, I started my own business..." (от первого лица) |
| `web-usability` | 2001 | "...established in 2001" — anti-bot на живом сайте, подтверждено через Wayback; пересматривает CLEAR из D-047 |
| `tetralogical` | 2019 | "We formed TetraLogical in 2019..." |
| `alpanet` | 2000 | Timeline "Powstanie firmy ALPANET": "2000 Powstanie firmy ALPANET" |
| `vobacom` | 1999 | Historia: "1999 Początkowo firma działa jako spółka cywilna BMPG" (в 2006 переименована в VOBACOM — смена формы, взят более ранний старт) |

**Пересматривает прежний вывод (2): `anatom5`, `web-usability`.** Оба были в
CLEAR-списке D-047 («год не опубликован» / «activity wording»). Глубокая
проверка нашла у `anatom5` явное «gegründet» на отдельной странице
`/agentur/grundsatz` (первый проход видел только «seit 2003» на главной); у
`web-usability` — живой сайт при первом проходе отдавал контент нормально, но
теперь оказался за anti-bot защитой во всех попытках (живых и архивных
напрямую), обойдено через Wayback-снапшот той же страницы, где текст
«established in 2001» сохранился с первого прохода индексации архива.

**Отклонено — все 63 записи (59 NOT_FOUND + 3 AMBIGUOUS + 1 UNREACHABLE),
построчно:**

| slug | вердикт | причина |
|---|---|---|
| `accessibility-innovations` | NOT_FOUND | Anti-bot на главной/контакте; /who-we-are/ загрузилась, года нет |
| `visuellverstehen` | NOT_FOUND | Impressum: HRB+USt-IdNr без даты |
| `gehirngerecht-digital` | NOT_FOUND | HRB 37996 без даты |
| `wcag-audyt-pl` | NOT_FOUND | «Już ponad 7 lat badamy» — опыт |
| `lepszyweb` | NOT_FOUND | Только копирайт «© 2019» |
| `audyt-dostepnosci-pl` | NOT_FOUND | Года нет нигде |
| `barrierefreiheit-umsetzen` | NOT_FOUND | «Über 10 Jahre Expertise» — опыт |
| `piksl-labor-bielefeld` | NOT_FOUND | HRB 41835 материнской Stiftung без даты |
| `adesso-mobile` | NOT_FOUND | «Seit über einem Jahrzehnt» — decade-wording; /unternehmen редиректит на adesso.de |
| `hdm-stuttgart-kompetenzzentrum` | NOT_FOUND | «besteht seit fast 4 Jahren» — длительность без года |
| `barrierekompass` | NOT_FOUND | Портал anatom5; текст про anatom5, не про сам Barrierekompass |
| `mindscreen` | NOT_FOUND | HRB 210534 без даты |
| `twin-cubes` | NOT_FOUND | «umfirmiert zum 1.1.2017» — переименование, не основание |
| `bitv-consult` | NOT_FOUND | «seit 2008 als selbstständiger Berater» — самозанятость; подтверждает CLEAR из D-047 |
| `marcus-herrmann` | NOT_FOUND | Личный сайт консультанта, About-страницы нет |
| `usablenet` | NOT_FOUND | «Since 2000» — деятельность; подтверждает CLEAR из D-047; LinkedIn за authwall |
| `eclusief` | NOT_FOUND | About-страницы нет; копирайт родительского бренда «normeris» |
| `audit-house` | NOT_FOUND | «al 6 jaar» — относительный стаж, не год |
| `bureau-toegankelijkheid` | NOT_FOUND | KVK без даты |
| `accessible-minds` | NOT_FOUND | Года нет нигде |
| `digitaal-toegankelijk` | NOT_FOUND | Копирайт «© 2019-2026» не считается |
| `level-level` | UNREACHABLE | Cloudflare challenge на все пути |
| `tu-web-accesible` | NOT_FOUND | About и aviso legal без года |
| `accesit-inclusivo` | NOT_FOUND | About-страницы нет в sitemap |
| `auditores-accesibilidad` | NOT_FOUND | «Desde 2008» — карьера сотрудника, не компании |
| `all-able` | NOT_FOUND | About/our-story + Wayback 2020: основатели названы, года нет |
| `dig-inclusion` | NOT_FOUND | Vue SPA, пустая оболочка; Wayback 2017 — только копирайт; подтверждает CLEAR из D-047 |
| `weco-digital-accessibility` | NOT_FOUND | Anti-bot; Wayback 2012 (About/Founder/Business Facts) — года нет |
| `perkins-access` | NOT_FOUND | Редирект на perkins.org; год есть только у материнской Perkins School for the Blind |
| `new-editions-consulting` | NOT_FOUND | About/Company Overview без года |
| `afixt` | NOT_FOUND | «founded by Karl Groves» БЕЗ года |
| `accessible-web` | AMBIGUOUS | Нарратив происхождения: год и «was born» в разных предложениях — вывод, не заявление |
| `prime-access-consulting` | NOT_FOUND | Года нет нигде |
| `chax-training-and-consulting` | AMBIGUOUS | 2024 — слияние двух существующих практик (Chelius + Castro/Tamman), не основание с нуля |
| `216digital` | NOT_FOUND | Плитка «25 Years in Business» без явного года |
| `accessibility-shield` | NOT_FOUND | About-страницы нет вообще (живьём и в Wayback) |
| `converge-accessibility` | NOT_FOUND | About доступна, только копирайт |
| `accessibility-works` | NOT_FOUND | «Propeller was founded in 1997» — родительская компания, не сам бренд |
| `accessible-org` | NOT_FOUND | «Founded by Kris Rivenburgh» БЕЗ года |
| `inklusio` | NOT_FOUND | DNS не резолвится; Wayback 2020-2024 — карьера сотрудника, не компании |
| `peytz-co` | NOT_FOUND | «Siden 2002 har vi skabt» — деятельность |
| `nettkonsult` | NOT_FOUND | Года нет; LinkedIn-ссылка без года на сайте |
| `nomensa` | NOT_FOUND | 2010 — год материнской Sideshow Group, не самой Nomensa/GAIN |
| `user-vision` | NOT_FOUND | About/история-страницы нет в sitemap |
| `hassell-inclusion` | NOT_FOUND | «founded by» БЕЗ года ни на одной версии 2012-2019 |
| `test-partners` | NOT_FOUND | «projects since 2002» — деятельность |
| `hex-productions` | NOT_FOUND | «10 years» юбилейный пост подразумевает ~2015, явного года нет |
| `nexer-digital` | NOT_FOUND | Точное совпадение с паттерном «reputation since YYYY»; подтверждает CLEAR из D-047 |
| `shaw-trust-accessibility-services` | NOT_FOUND | 1982 — год материнской благотворительной Shaw Trust |
| `idcom-group` | NOT_FOUND | «Od ponad 20 lat» — опыт; KRS без даты |
| `venti` | NOT_FOUND | «działa ... od 20 lat» — деятельность |
| `fundacja-widzialni` | NOT_FOUND | «od 2009 r. zajmuje się» — since-wording |
| `agileo-it` | NOT_FOUND | «od 2012 roku» — since-wording; LinkedIn за логином |
| `intracom-pl` | NOT_FOUND | «20 lat doświadczenia» — опыт; подстраницы SPA |
| `akcess-net` | NOT_FOUND | «Od 2002 roku pomagamy» — since-wording |
| `spoldzielnia-socjalna-fado` | NOT_FOUND | Устав цитирует только общие законы, даты регистрации FADO нет |
| `dranas-project` | NOT_FOUND | «Przez ostatnie 10 lat» — опыт |
| `kinaole` | NOT_FOUND | Года нет вовсе |
| `fundacja-integracja` | AMBIGUOUS | Год относится к основанию журнала «Integracja», не явно к самому фонду |
| `akademia-slonca` | NOT_FOUND | «Od niemal 10 lat» — опыт |
| `nautil` | NOT_FOUND | Года нет; KRS без даты |
| `optimal-it` | NOT_FOUND | Найденная дата 2003 — про клиентский портал OX.PL, не про компанию |
| `intermedia-spolka-jawna` | NOT_FOUND | «Od ponad dwudziestu lat» — опыт |

59 NOT_FOUND + 3 AMBIGUOUS + 1 UNREACHABLE = 63, плюс 17 принятых = 80
(сходится с числом переданных в пакеты). `level-level` — UNREACHABLE, не
NOT_FOUND: остаётся кандидатом на повтор другим методом/сетью.

**Очередь `founded == null` исчерпана полностью.** До этого прохода — 153
записи (73 уже отклонены + 80 не тронуты); после — все 153 проверены (136
отклонённых: 73 из предыдущих проходов + 63 из этого; 17 принято). Остаток —
**136 записей без `founded`**, все с пометкой «уже проверено», ни одна не
«не проверена вообще». `founded` теперь у **109/245** (было 92). Возврат к
этому полю имеет смысл только с НОВЫМ источником/методом (например, платный
реестр компаний по странам) — не повторным обходом тех же публичных страниц
тем же методом.
