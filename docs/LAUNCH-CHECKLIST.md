# Чеклист запуска detnav.com

Обновлено: август 2026. Хостинг — **Cloudflare Workers Static Assets**
(не Netlify). Превью живёт на `detnav.zincroom.workers.dev` в режиме
**noindex** до запуска.

---

## A. Технически готово (проверено)

- [x] Launch-флаг живёт в `launch.config.json` (`indexLangs`) — по языкам,
      в репозитории. Открытые языки: индексируются и попадают в sitemap;
      закрытые: `noindex` + `Disallow`. Пустой список — весь сайт превью.
      Все три режима проверены на сборке.
- [x] `hreflang` (en/es/ru + x-default), `canonical`, `<html lang>` по каталогу.
- [x] Соцпревью: OG/Twitter-теги на всех страницах + `og.png` (1200×630).
- [x] CSP `default-src 'self'`, шрифты свои (`font-src 'self'`), без Google Fonts;
      `Referrer-Policy: no-referrer` (переход на ICE не выдаёт источник).
- [x] Линтеры UPL и минимизации зелёные; `check-links` без битых; сборка 81 URL.
- [x] Работает без JavaScript; ничего не уходит на сервер (Zero-Data).

## B. Человеческие ворота (нужны люди/решения — НЕ код)

- [~] **Вычитка ES носителем.** Главная (`es/home.ts`) вычитана 16.08.2026
      (US Spanish, мексиканский/центральноамериканский) — 16 правок внесены:
      регистр tú→usted в «Tres pasos», кальки с английского, стилистика.
      Остальные ES-страницы из раздела D ещё НЕ вычитаны.
- [ ] **Юрлицо** — решение владельца (на чьё имя сайт).
- [ ] **Кто отвечает на официальный запрос** (subpoena/ведомство) — заранее.
- [ ] **UPL-конструкция** («карта, а не навигатор», зоны А/Б, Zero-Data) —
      подтвердить у юриста отдельным вопросом (проверка 28.07 касалась фактов).

## C. Порядок запуска (Cloudflare)

1. **Домен в Cloudflare:** добавить зону `detnav.com` (Add site). Cloudflare
   покажет свои неймсерверы.
2. **GoDaddy:** Nameservers → сменить на неймсерверы Cloudflare. Пропагация до 24 ч.
3. **Custom domain на Worker:** Workers & Pages → проект `detnav` → Settings →
   Domains & Routes → Add custom domain → `detnav.com` (и `www` при желании).
   SSL Cloudflare выпустит сам.
4. **Включить индексацию:** в `launch.config.json` вписать открываемые языки в
   `indexLangs` (например `["en","ru"]`), закоммитить и запушить в `main` —
   дашборд Cloudflare не нужен. Закрытые языки получают `X-Robots-Tag: noindex`
   на `/<lang>/*`, `Disallow: /<lang>/` в robots.txt и не попадают в sitemap.
   Пустой список = весь сайт в превью. Язык открываем только после вычитки
   его контента носителем (раздел B).
5. **Проверка после запуска:**
   - `https://detnav.com/ru/` открывается, языковой редирект с `/` работает;
   - `curl -I https://detnav.com/robots.txt` → `Allow: /` + `Sitemap`;
   - в заголовках ответа НЕТ `X-Robots-Tag: noindex`;
   - сертификат валиден; OG-превью видно (проверить ссылкой в WhatsApp).
6. **Sitemap в поиск:** Google Search Console → добавить `detnav.com`,
   отправить `sitemap.xml`.

## D. Новый ES-контент на вычитку носителем (после 28.07)

Проверка носителя 28.07 покрывала прежний объём. С тех пор добавлено/переписано
(показать носителю **только эти фрагменты**, весь сайт заново не нужно):

- **`content/es/connect.ts`** — страница «Mantener contacto» переписана целиком
  (звонки/сообщения/видео/деньги/письма, пошагово).
- **`content/es/complaints.ts`** — новая страница «Si algo anda mal».
- **`content/es/forms.ts`** — новая страница «Formularios» + подписи схемы
  документа (`docMap` в `ui.ts`).
- **`content/es/prepare.ts`** — новая страница «Un plan por si hay una detención»
  + блок «Entregue el plan a una persona de confianza» + секция
  «Dinero y propiedad» (poder financiero, banco, renta, carro, 401(k)/IRA).
- **`content/es/where.ts`** — секция «Oficina de ICE: a dónde acudir…».
- **`content/es/home.ts`** — карточки хаба (`hub`): «Se llevaron a alguien» и др.
- **`content/es/ui.ts`** — новые строки: `national` (estadísticas), `officeFinder`,
  `visitFinder` (stayTitle/stayLine/stayNote, provenance и пр.), `browserOnly`,
  `tabs`.
- **`content/es/attorney.ts`, `documents.ts`, `visit.ts`** — добавленные врезки
  (consulado, directiva parental, detainer 48h, правила ID на свидании).
- **`data/states.json`** — заметки ES для NY и FL.

## E. После запуска

- Мониторинг активации (дошёл до списка задач) — без аналитики на сайте, руками
  через разговоры (правило №1). Soft-launch: 10–20 приглашений через приход/НКО.
- Держать даты «состояние на …» свежими; правила ICE меняются.
