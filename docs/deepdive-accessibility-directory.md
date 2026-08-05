# /deepdive — Каталог агентств аудита цифровой доступности (EAA / WCAG / ADA)

**Дата:** 2026-08-04 · **Данные:** DataForSEO Google Ads + live SERP (файлы `research/dd-a11y-*.json`, `research/dd-serp-*.json`, `research/bo-b-eureg-*.json`) · **Стек фаундера:** React + Vite-SSG + Tailwind + Cloudflare (репозиторий detnav)

**Концепция:** мультиязычный фильтруемый каталог агентств и консультантов по аудиту цифровой доступности: страна × стандарт (WCAG 2.2 / EN 301 549 / Section 508 / EAA / BITV / RGAA) × услуга (аудит, ремедиация, VPAT, обучение, мониторинг) × отрасль × язык × ценовой диапазон.

---

## 1. Keyword research (измерено, Google Ads, 2026-08-04)

### 1.1 США (локация US, en)

| Ключ | Объём/мес | CPC | Конкуренция |
|---|---:|---:|---|
| section 508 compliance | **8 100** | $9.86 | LOW |
| vpat | **5 400** | $29.92 | MEDIUM |
| accessibility audit | 720 | $33.74 | — |
| european accessibility act | 480 | $12.63 | LOW |
| accessibility agency | 480 | $4.37 | — |
| website accessibility audit | 390 | $33.32 | — |
| accessibility consultant | 320 | $33.94 | — |
| ada compliance services | 260 | $14.44 | — |
| web accessibility consultant | 210 | **$86.51** | LOW |
| 508 compliance testing | 210 | $12.76 | MEDIUM |
| wcag audit | 170 | $36.43 | — |
| accessibility audit services | 170 | $8.40 | LOW |
| accessibility testing services | 110 | $7.23 | LOW |
| eaa compliance | 90 | $13.31 | MEDIUM |
| ada website compliance service | 90 | $64.68 | LOW |
| vpat certification | 90 | $34.52 | MEDIUM |
| accessibility remediation | 70 | **$76.77** | MEDIUM |

Коммерческое ядро US ≈ **2 900/мес**, плюс кластеры Section 508 (~8 500) и VPAT (~5 500) — итого адресуемо ≈ **17 000/мес** только в US. CPC $30–86 — один из самых дорогих B2B-кластеров, что подтверждает LTV клиентов агентств.

### 1.2 Великобритания (UK, en; замер 2026-08-04, прежний)

accessibility audit — 480 @ $26.28; accessibility audit services — 40 @ $65.36; кластер ≈ **1 100/мес**.

### 1.3 Германия (DE, de) — ключевая новая находка

| Ключ | Объём/мес | CPC | Конкуренция |
|---|---:|---:|---|
| barrierefreiheitsstärkungsgesetz | **5 400** | $3.68 | MEDIUM |
| bfsg | **3 600** | $4.22 | LOW |
| wcag | 2 900 | $4.46 | LOW |
| barrierefreiheit internet | 2 400 | $8.60 | MEDIUM |
| barrierefreie website | 1 600 | $7.53 | MEDIUM |
| bitv | 1 300 | $5.68 | LOW |
| bitv 2.0 | 1 000 | $5.64 | LOW |
| barrierefreiheitsgesetz | 880 | $4.50 | MEDIUM |
| digitale barrierefreiheit | 720 | $5.68 | MEDIUM |
| european accessibility act | 720 | $6.15 | LOW |
| wcag 2.1 | 720 | $5.71 | MEDIUM |
| barrierefreiheit testen | 390 | $7.82 | HIGH |
| barrierefreies webdesign | 320 | $6.05 | LOW |
| bitv test | 260 | $6.72 | MEDIUM |
| barrierefreie website agentur | 90 | $7.33 | LOW |
| barrierefreiheit website prüfen | 70 | $10.51 | MEDIUM |
| accessibility audit | 70 | $17.32 | MEDIUM |
| wcag audit | 30 | $18.19 | HIGH |

Немецкий «законодательный» кластер (BFSG/BITV/WCAG) ≈ **23 000/мес** информационно-навигационного спроса + ~1 200/мес чисто коммерческого. Это крупнейший рынок Европы для этой ниши: спрос порождён вступлением BFSG (немецкая имплементация EAA) в силу 28.06.2025.

### 1.4 Франция (FR, fr)

audit rgaa — **390** @ $11.13; audit accessibilité — 210 @ $8.90; formation accessibilité numérique — 170 @ $4.00; déclaration d'accessibilité — 170; audit accessibilité site web — 70; audit accessibilité numérique — 70 @ $15; rgaa 4 — 70. Кластер ≈ **1 150/мес**, коммерческое ядро ~740.

### 1.5 Италия / Нидерланды / Польша / Испания

| Рынок | Топ-ключи | Кластер |
|---|---|---:|
| IT | accessibilità siti web 720 @ $7.39; dichiarazione di accessibilità 590; agid accessibilità 260 | ≈1 600 |
| NL | digitale toegankelijkheid 590; toegankelijkheidsverklaring 260; **wcag audit 90 @ $26.90**; toegankelijkheid website testen 40 | ≈1 000 |
| PL | deklaracja dostępności 590; dostępność cyfrowa 480; audyt wcag 260 @ $5.42; audyt dostępności 140 | ≈1 500 |
| ES | en 301 549 170; test accesibilidad web 50; auditoria de accesibilidad 20; остальное <10 | ≈300 (слабый) |

**Суммарно измеренный адресуемый спрос по 8 рынкам ≈ 45 000+/мес** (коммерческое ядро ≈ 7–8 тыс./мес, остальное — информационный «хало»-спрос вокруг законов, конвертируемый через гайды → каталог). Замечание: часть узких ключей вернула null (Google Ads группирует варианты) — реальный long-tail больше измеренного.

---

## 2. SERP-аудит

### 2.1 US/UK (5 запросов, 2026-08-04, прежний замер)

«accessibility audit», «wcag audit», «website accessibility audit», «accessibility consultant», «accessibility agency» (US+UK): топ-10 = соло-вендоры (deque.com, levelaccess.com, userway.org, audioeye.com, boia.org), инструменты и страницы W3C/gov. **Ни одного каталога в топ-10 ни по одному запросу.** accessibility.com/vendor-directory и AskJAN существуют, но не ранжируются, US-only, без фильтров.

### 2.2 Локальные споты (live, 2026-08-04)

**DE «barrierefreie website agentur»** — топ-10: lau.do, bitvtest.de, agentur-barrierefreie-website.de, visuellverstehen.de, svaerm.com, gehirngerecht.digital, ucentric-media.de, dmk-ebusiness.de, suxeedo.de. Все — сами агентства (низкий DR), включая exact-match домен. Каталогов нет; bitvtest.de ранжируется со списком своих прюфстелле — слабый квазикаталог.

**FR «audit rgaa»** — топ-10: accessibilite.numerique.gouv.fr (гос. kit d'audit), info.gouv.fr, rgaa-checker.com, institut-tourisme.bzh, urbilog.com, formations.access42.net, boscop.fr. Гос-страницы + соло-вендоры. Каталогов нет.

**PL «audyt wcag»** — топ-10: wcag-audyt.pl, gov.pl, audytwcag.pl, cyberforces.com, sdc.certes.pl, lepszyweb.pl, escsa.pl, drupalninja.pl, audyt-dostepnosci.pl. **Три exact-match домена низкого DR в топ-10** — классический маркер слабой конкуренции.

### 2.3 Вывод по конкуренции

Новый игрок реально может конкурировать: SERP заполнен коммерческими страницами вендоров, а intent «найти/сравнить исполнителя» никем не обслужен. Каталог с 20+ проверенными агентствами на страницу «{страна} × {услуга}» даёт лучший ответ на запрос, чем любой из текущих топ-10. Слабый DR конкурентов (кроме gov и deque) означает достижимость топ-10 за 3–6 месяцев на long-tail.

---

## 3. Анализ конкурентов

| Конкурент | DR (оценка) | Каталог? | Программ.? | Свежесть | Слабости | Возможность |
|---|---:|---|---|---|---|---|
| accessibility.com/vendor-directory | ~55 | Да | Нет | Устаревший | US-only, без фильтров, без цен, не ранжируется | Побить фильтрами + EU |
| AskJAN vendor list | ~70 | Список | Нет | Редкие апдейты | ADA-only, плоский список | То же |
| bitvtest.de (Prüfstellen) | ~50 | Квазисписок | Нет | Актуален | Только BIK-прюфстелле, только DE, только BITV | Расширить на всю EU |
| deque.com / levelaccess.com | 75–85 | Нет | Нет | Высокая | Вендор, не сравнение | Не конкурент по intent «сравнить» |
| Clutch «accessibility testing» | 90 | Категория | Да | Средняя | Общий каталог, pay-to-play, нет стандартов/языков как фильтров | Нишевая глубина |
| userway/audioeye/accessibe | 70–80 | Нет | Нет | Высокая | Оверлеи; репутационно уязвимы в a11y-сообществе | Позиция «настоящий аудит vs оверлей» |

Gap-детект: нигде нет фильтров «стандарт × страна × язык × цена», нет страниц городов, нет schema.org, нет мультиязычности, нет верификации сертификаций (IAAP/BITV/RGAA/Trusted Tester), нет прайс-бенчмарков.

---

## 4. Data sourcing blueprint — первые 500+ агентств

| # | Источник | Покрытие | Метод | Сложность | Стоимость | Обновление |
|---|---|---|---|---|---|---|
| 1 | IAAP organizational members (~200+ орг., 130 стран) | Глобально, ядро рынка | Ручной сбор со страниц IAAP + сайты участников | Низкая | $0 | Квартально |
| 2 | BIK BITV-Test Prüfstellen (bitvtest.de) | DE, ~20–30 сертиф. прюфстелле | Ручной | Тривиально | $0 | Квартально |
| 3 | **Декларации доступности гос-сайтов EU** («audit réalisé par…», «geprüft durch…», «audyt przeprowadził…») — обязательные страницы называют аудитора | FR/DE/PL/NL/IT/ES, сотни агентств | Google-дорки + скрейп деклараций (Apify / свой Worker) | Средняя | ~$20 Apify | Полугодично |
| 4 | UK G-Cloud / Digital Marketplace (поиск «accessibility audit») | UK, 30–60 вендоров | Публичный поиск, экспорт | Низкая | $0 | При обновлении фреймворка |
| 5 | CSUN / axe-con / M-Enabling — списки экспонентов и спонсоров | US + глобально, 100+ | Ручной | Низкая | $0 | Ежегодно |
| 6 | Clutch / UpCity категории accessibility testing | US/EU, 100+ | Apify-скрейпер | Средняя | ~$20 | Полугодично |
| 7 | accessibility.com + AskJAN списки | US, 50–80 | Ручной/скрейп | Низкая | $0 | Разово (сид) |
| 8 | Google Maps/Places по запросам на 8 языках («barrierefreiheit beratung», «audit accessibilité»…) | Города EU/US | Outscraper | Низкая | ~$30 | Полугодично |
| 9 | LinkedIn company search «accessibility consultancy» | Глобально | Ручной (выборочно) | Средняя | $0 | По мере |
| 10 | GSA/SAM.gov, Section508.gov ресурсы (US federal vendors) | US gov-рынок | Публичный поиск | Средняя | $0 | Ежегодно |

**План на 500+:** источники 1+2+4+5+7 дают ~350–400 уникальных за ~4–5 дней ручной работы; источник 3 (декларации) — ещё 150–300 европейских локальных агентств, недоступных ни в одном каталоге (уникальное преимущество данных). Дедупликация по домену. Для каждой записи: сайт, страна(ы), города, услуги, стандарты, языки, сертификации + `sourceRefs` (доказуемость) + `lastVerified`. Цель к запуску: **600 агентств, из них 250+ европейских не-англоязычных.**

---

## 5. Монетизация и воронка

**Модели (по скорости запуска):**
1. **Featured listing** — €59/мес или €590/год: топ категории, бейдж, расширенный профиль. Продажа cold-outreach по своей же базе (у каждого лида уже есть бесплатный профиль = тёплый заход «claim your listing»).
2. **Лидоген**: форма «получить 3 предложения» → Worker → email 3 подходящим агентствам. При CPC ниши $26–86 цена квалифицированного лида €40–80 (пакетами: 10 лидов/€400).
3. Sponsored-слоты на страницах гайдов (BFSG, EAA, VPAT) — €150–300/мес.
4. Партнёрки: инструменты аудита/мониторинга, Deque University, курсы IAAP-подготовки. (Оверлеи — не брать: репутация в a11y-сообществе дороже.)
5. Позже: job board, прайс-репорт (data product).

**Воронка (месяц 9, консервативно):** 7 000 визитов/мес → 2 100 на коммерческих страницах → 1.5% заявок = ~30 лидов/мес → продано 60% по €50 = **€900** + 15 featured × €59 = **€885** + 2 спонсора × €200 = €400 → **MRR ≈ €2 200.** Первая выручка: месяц 2–3 (featured-outreach не требует трафика — база сама является списком клиентов).

---

## 6. Риски

| Риск | Вероятность | Митигование |
|---|---|---|
| Спад хайпа EAA после 2027 | Средняя | ADA/508/VPAT — вечнозелёные (US 13.5k/мес); переориентация на мониторинг/ремедиацию |
| Thin-content фильтры Google | Средняя | Порог: индексировать только страницы с ≥3 листингами; уникальные данные (цены, сертификации) |
| Clutch/G2 запустят нишевые фильтры | Низкая | Скорость + глубина (стандарты, языки, декларации) |
| Агентства не платят | Средняя | Лидоген как альтернатива; низкая цена входа €59 |
| Скрейпинг-ограничения (IAAP, Clutch ToS) | Средняя | Ручная курация ядра, скрейп только публичных гос-деклараций |
| Слабый спрос ES/IT на «аудит» | Подтверждено | ES/IT — вторая волна; старт EN+DE+FR |

---

## 7. AI defensibility: **7/10**

ChatGPT назовёт Deque/Level Access, но не может: (а) поддерживать верифицированный список 600 агентств с сертификациями и датами проверки; (б) фильтровать страна×стандарт×язык×цена; (в) маршрутизировать лиды; (г) отслеживать смену законов (BFSG/EAA дедлайны). Транзакционный intent + локальность + частые обновления + собственные данные из деклараций = устойчивость. LLM-поисковики (AI Overviews) будут цитировать структурированный каталог как источник.

---

## 8. Экономика и programmatic-потолок

**Матрица URL:** 600 агентств + 30 стран + 6 услуг + 6 стандартов + ~120 валидных комбо страна×услуга + 60 городов + 40 гайдов ≈ **860 контентных URL × 4 локали (en/de/fr/pl) ≈ 3 400 URL**; индексируемая цель — 1 800–2 500. Потолок трафика при захвате 20–30% long-tail измеренного спроса: **10–18 тыс. визитов/мес** к месяцу 12–15.

| Метрика | Оценка |
|---|---|
| Затраты | ~€25/мес (Cloudflare free + домен + Outscraper разово) |
| Время до первой выручки | 2–3 мес |
| MRR м6 / м12 | €700 / €2 500–4 000 |
| CAC | ≈€0 (inbound + outreach по своей базе) |
| Payback | Немедленный |
| LTV featured-клиента | €590+/год, churn низкий (SEO-выгода листинга) |

**Weighted score:** Demand 8 ×15% + Commercial Intent 9 ×15% + SEO Competition 8 ×15% + Data 7 ×10% + Scalability 8 ×10% + AI Defens. 7 ×10% + Monetization Speed 7 ×10% + Tech Complexity 8 ×5% + Freshness 7 ×5% + Founder Advantage 9 ×5% = **7.9 / 10**.

Winning rules: 7 из 8 (500+ сущностей ✓, URL/сущность ✓, 5+ фильтров ✓, гео-страницы ✓, категории ✓, обновляемость ✓, LTV>$500 ✓; 1000+ сущностей — пока нет).

---

## 9. Продуктовая архитектура (стек фаундера: Vite-SSG + Cloudflare)

**Принцип: static-first.** 600–1000 сущностей — это малые данные; никакой БД для чтения не нужно.

```
data/a11y/
  agencies.json        # массив Agency (источник истины, редактируется руками/скриптами)
  taxonomies.json      # услуги, стандарты, отрасли, страны, ценовые диапазоны
  guides/*.md          # редакционный контент (frontmatter: locale, slug, related)
scripts/
  build-a11y.mjs       # валидация, дедуп, генерация индексов и route-манифеста
src/pages/a11y/…       # шаблоны: AgencyPage, CountryHub, ComboPage, GuidePage
worker.js              # POST /api/lead, /api/claim → D1 + Resend; rate-limit в KV
```

- **Поиск/фильтры:** клиентские — компактный индекс `agencies.index.json` (~150–250 КБ gzip) грузится на страницах списков; фильтрация в React. Algolia не нужна.
- **Динамика (Cloudflare Workers):** приём лид-форм и «claim listing» → D1 (таблицы `leads`, `claims`), нотификации через Resend/MailChannels, honeypot + Turnstile. KV — rate-limit.
- **Платежи:** Stripe Payment Links (featured/лид-пакеты) — без бэкенда; вебхук в Worker помечает `featured: true` через commit в репо (GitHub API) или D1-оверлей, подхватываемый при билде.
- **Билд:** `vite-react-ssg build` + существующий `gen-sitemap.mjs`; полный ребилд по cron (GitHub Actions, ежедневно) — подтягивает D1-оверлеи (новые claims/featured).

---

## 10. Схема данных (TS, `data/a11y/types.ts`)

```ts
export type ServiceSlug = 'audit' | 'remediation' | 'vpat' | 'training' | 'monitoring' | 'consulting';
export type StandardSlug = 'wcag-2-2' | 'en-301-549' | 'section-508' | 'eaa' | 'bitv' | 'rgaa' | 'ada';
export type PriceBand = 'budget' | 'mid' | 'premium' | 'enterprise'; // <€3k, €3–10k, €10–30k, >€30k за аудит
export type CertBadge =
  | { kind: 'iaap-org-member' }
  | { kind: 'bitv-pruefstelle' }          // BIK BITV-Test прюфстелле (DE)
  | { kind: 'dhs-trusted-tester' }        // US
  | { kind: 'iaap-certified-staff'; count: number } // CPACC/WAS/CPWA
  | { kind: 'gov-declared-auditor'; country: string; evidenceUrl: string }; // из деклараций

export interface Office { city: string; countryCode: string; lat?: number; lng?: number; }

export interface Agency {
  slug: string;                 // 'access42'
  name: string;
  website: string;              // дедуп-ключ (домен)
  founded?: number;
  headcountBand?: '1' | '2-10' | '11-50' | '51-200' | '200+';
  hq: Office;
  offices: Office[];
  countriesServed: string[];    // ISO-коды; 'remote-eu', 'remote-global'
  languages: string[];          // BCP-47: 'de','fr','en'…
  services: ServiceSlug[];
  standards: StandardSlug[];
  industries: string[];         // 'public-sector','ecommerce','banking','saas','healthcare'…
  priceBand?: PriceBand;
  certs: CertBadge[];
  description: Partial<Record<'en'|'de'|'fr'|'pl'|'es', string>>; // 40–80 слов, уникальные
  featured?: { until: string };
  claimed?: boolean;
  sourceRefs: { url: string; label: string }[];  // доказуемость записи
  lastVerified: string;         // ISO-дата
}

export interface Guide { slug: string; locale: string; title: string; standard?: StandardSlug;
  countryCode?: string; updated: string; body: string; relatedAgencies?: string[]; }
```

Скрипт `build-a11y.mjs` валидирует enum-ы, дедупит по домену, генерирует: `agencies.index.json` (усечённые поля для фильтров), счётчики для комбо-страниц (порог индексации), route-манифест для SSG.

---

## 11. Schema.org JSON-LD

- **Страница агентства:** `ProfessionalService` (name, url, address, areaServed, availableLanguage, knowsAbout: ["WCAG 2.2","EN 301 549"], memberOf → IAAP при наличии) + `BreadcrumbList`.
- **Списки (страна/услуга/комбо):** `ItemList` c `ListItem` → URL профилей (числовые позиции; для featured — без манипуляций рейтингом).
- **Гайды:** `Article` + `FAQPage` (2–4 реальных вопроса: «Сколько стоит BFSG-аудит?»).
- **Сайт:** `WebSite` + `Organization`; на хабах стран — `speakable` не нужен, зато `about` → Wikidata-сущности законов (Q-ID для EAA, ADA).
- Рейтинги (`AggregateRating`) — только после появления настоящих отзывов, иначе риск ручных санкций.

Вставка — компонентом `<JsonLd>` в head при SSG-рендере (данные уже в пропсах страницы).

---

## 12. URL-структура и hreflang

Локаль префиксом, английский без префикса (паттерн detnav, `content/slugs.json` уже существует):

```
/agencies/{slug}/                     профиль (один на языке-умолчании + локализованные)
/{country}/                           хаб: /germany/, /de/deutschland/
/{country}/{service}/                 комбо: /germany/wcag-audit/  |  /de/deutschland/wcag-audit/
/{country}/{city}/                    город: /germany/berlin/ (только топ-города с ≥3 агентствами)
/services/{service}/                  /services/vpat/  |  /de/leistungen/vpat/
/standards/{standard}/                /standards/en-301-549/  |  /fr/normes/rgaa/
/guides/{slug}/                       /de/ratgeber/bfsg-pflichten-2026/
```

- Локализованные сегменты через slugs.json (`wcag-audit` → de: `wcag-audit-agenturen`, fr: `audit-rgaa` где уместен локальный стандарт).
- `hreflang`: полный кластер взаимных ссылок + `x-default` → en; рендерится в head при SSG и дублируется в sitemap (`xhtml:link`).
- Профили агентств: канонический английский URL, локализованные версии только при переведённом описании (иначе — hreflang не ставить, не плодить дубли).

---

## 13. Внутренняя перелинковка

- **Хаб-спица:** страна-хаб → услуги×страна → профили; профиль → вверх на все свои комбо (страна, услуги, стандарты, город) через тег-чипы.
- **Хлебные крошки** везде (+ BreadcrumbList).
- «Похожие агентства» на профиле: 5 шт. по совпадению страна+услуга (детерминированно из индекса — стабильность ссылок между билдами).
- Гайды → 3–5 релевантных списочных страниц + «топ-5 агентств» блоком (`relatedAgencies`).
- Футер: блок «Популярное» — 10 главных комбо-страниц (ротация по локали).
- Глубина любого URL от главной ≤ 3 клика; sitemap-страница /countries/ как ярус.

---

## 14. План генерации контента

1. **Программные шаблоны** (списки): уникальные блоки данных — счётчик агентств, медианный прайс-бенд, доля сертифицированных, дедлайн закона страны; интро 80–120 слов на локали генерируется из данных по шаблонным вариациям (не одинаковый текст).
2. **Профили:** 40–80 слов уникального описания (черновик LLM по structured-фактам из sourceRefs → ручная вычитка; 20–30 профилей/день).
3. **Редакционные гайды (рычаг информационного спроса):** 1-я волна — 12 штук: BFSG-гайд (DE, кластер 9k!), «BFSG Checkliste», «Was kostet ein BITV-Test», EAA country-by-country, «VPAT: как получить» (US 5.4k), «Section 508 compliance guide» (US 8.1k), «audit RGAA: prix et déclaration» (FR), «audyt WCAG: cennik» (PL), «WCAG audit vs overlay». Каждый гайд заканчивается CTA в каталог.
4. Ежеквартальный **прайс-репорт** по данным листингов — линкбейт и уникальные данные.

---

## 15. Стратегия индексации

- Индексировать списочные страницы только при **≥3 листингах**; тонкие комбо — `noindex,follow` до наполнения (флаг из build-a11y.mjs).
- Sitemap: сегментированный (`sitemap-agencies.xml`, `sitemap-lists.xml`, `sitemap-guides.xml` × локали) через существующий `gen-sitemap.mjs`; `lastmod` = lastVerified/updated.
- GSC: один домен, отслеживание по каталогам локалей; сабмит sitemap с 1-го дня; IndexNow-пинг из Worker после каждого деплоя (Bing/Seznam).
- Порядок открытия: EN + DE (макс. спрос) → через 3–4 недели FR, PL → потом NL/IT/ES.
- Мониторинг «Crawled — not indexed»: если >30% списков вне индекса — поднять порог листингов и обогатить данные-блоки.

---

## 16. Roadmap запуска

| Фаза | Срок | Результат |
|---|---|---|
| 1. Данные | нед. 1–2 | 350+ агентств из источников 1,2,4,5,7; схема; build-скрипт |
| 2. MVP | нед. 3–4 | EN+DE, ~800 URL, фильтры, JSON-LD, sitemap, лид-форма (Worker+D1) |
| 3. Индексация+контент | нед. 5–8 | 12 гайдов, FR+PL, 500+ агентств (декларации), GSC-контроль |
| 4. Монетизация | нед. 6–10 | Outreach «claim listing» → featured; Stripe Links; первые €500 MRR |
| 5. Масштаб | мес. 3–6 | 600–800 агентств, города, прайс-репорт, NL/IT; MRR €1.5k+ |

KPI: м2 — 500 индекс. URL, 500 визитов; м4 — 1 500 URL, 2 500 визитов, 5 платящих; м6 — 5 000 визитов, MRR €700; м12 — 12 000 визитов, MRR €2.5–4k.

---

## 17. 30-дневный план (соло, блоками)

**Дни 1–2 — фундамент:** домен (EN-бренд, напр. a11yfinder/auditfinder-класс), клон каркаса detnav, `data/a11y/types.ts`, taxonomies.json, build-a11y.mjs (валидация+индексы+манифест).
**Дни 3–7 — данные, волна 1:** д3 — BIK Prüfstellen + accessibility.com + AskJAN (~120); д4 — IAAP org members (~100 релевантных); д5 — G-Cloud UK + CSUN/axe-con экспоненты (~100); д6 — Outscraper по Maps DE/FR/PL; д7 — дедуп, нормализация, lastVerified. Цель: **350 агентств**.
**Дни 8–12 — MVP-страницы:** д8 — профиль агентства + JsonLd; д9 — страна-хаб + комбо-шаблон с порогом; д10 — клиентские фильтры по индексу; д11 — services/standards-страницы, breadcrumbs, related; д12 — slugs.json DE-локаль, hreflang.
**Дни 13–15 — динамика:** Worker: POST /api/lead + /api/claim, D1-схема, Turnstile, Resend-нотификации; Stripe Payment Links (featured €59/мес, €590/год).
**Дни 16–18 — запуск:** прогон lint/check-links, gen-sitemap, деплой Cloudflare Pages, GSC + sitemap, IndexNow; аналитика (Cloudflare Web Analytics).
**Дни 19–24 — контент, волна 1:** по гайду в день: BFSG-гайд (de), BFSG-Checkliste (de), Section 508 guide (en), VPAT guide (en), EAA overview (en), audit RGAA prix (fr). Каждый — FAQPage + CTA.
**Дни 25–27 — данные, волна 2:** скрейп деклараций доступности (дорки FR/DE/PL) → +100–150 локальных агентств; открыть FR-локаль.
**Дни 28–30 — монетизация:** outreach-письма «ваш профиль в каталоге — подтвердите» первым 150 агентствам DE/UK/US (батчами 50/день), лендинг «Для агентств», первые featured-сделки; ретро по GSC.

---

## 18. Вердикт

# 🔥 BUILD NOW

- **Спрос измерен и больше, чем считалось:** новые замеры добавили DE-кластер BFSG/BITV ≈23 000/мес и US-кластеры Section 508 (8 100) + VPAT (5 400 @ $29.92); суммарно 45k+/мес по 8 рынкам при CPC до $86.
- **Голубой океан подтверждён на 8 SERP (US, UK, DE, FR, PL):** ни одного каталога в топ-10; в PL три exact-match домена низкого DR — прямой маркер слабой конкуренции.
- **Regulatory-ветер:** EAA/BFSG enforcement 2025–2027 в 27 странах EU + вечнозелёные ADA/508/VPAT в US — спрос не хайповый, а юридически обязательный.
- **Идеальный founder-fit:** мультиязычный SSG-каталожный стек уже готов; 600 сущностей = static-first, инфраструктура ~€25/мес, Algolia/Supabase не нужны; данные собираются из публичных сертификационных списков и обязательных деклараций доступности (уникальный, защищаемый датасет).
- **Экономика:** первая выручка через 2–3 мес (outreach по собственной базе), LTV featured €590+/год, потолок 10–18k визитов/мес и MRR €2.5–4k к 12-му месяцу при CAC ≈ 0.
