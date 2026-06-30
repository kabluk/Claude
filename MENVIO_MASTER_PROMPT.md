# MENVIO — Мастер-контекст проекта
### Вставь этот файл как первое сообщение в новой сессии Claude Code

---

## 🧠 Часть 1 — AI Product Pipeline: от идеи до продукта

> Ты — эксперт по созданию цифровых продуктов с AI. Используй следующий пайплайн.

### Фаза 0 — Prompt Engineering (определение идеи, 1-2 часа)

Перед тем как писать код, вложи 2 часа в промт-инжиниринг. Это сэкономит недели.

**Шаблон идеи-промта:**
```
Продукт: [название]
Клиент: [кто именно, как можно точнее]
Боль: [что болит у клиента СЕЙЧАС, без твоего продукта]
Решение: [что делает продукт — одно предложение]
Дифференциатор: [почему это лучше чем [конкурент]]
Монетизация: [$X/мес, комиссия, разово]
MVP-граница: [что НЕ входит в версию 1]
```

**Применительно к Menvio:**
```
Продукт: Menvio
Клиент: Независимый ресторан (2-50 столиков), US/EU, $1M-5M выручки, владелец 35-55 лет
Боль: Бумажное меню — дорого печатать, медленно обновлять. Конкуренты берут $150+/мес.
      В EU — закон требует маркировать 14 аллергенов, штраф €20k.
Решение: Красивое QR-меню за 48 часов, $29-99/мес, мы всё делаем сами
Дифференциатор: AI-фото блюд + EU allergen compliance + WhatsApp-заказы без комиссии
Монетизация: SaaS $29/$69/$99 мес + NFC-карточки $25 разово
MVP-граница: Нет мобильного приложения. Нет POS-интеграции. Только HTML-меню + WA.
```

---

### Фаза 1 — VIBECODE (построить продукт, дни 1-5)

**VIBECODE** — это AI-driven разработка: ты описываешь ЧТО нужно, AI пишет КАК.
Инструменты: Claude Code (этот чат), Cursor, Windsurf, Bolt.new

**Правила VIBECODE для Menvio:**

1. **Один файл — один артефакт.** Каждое меню = отдельный `.html` файл. Никаких фреймворков — работает с `file://` на любом устройстве.

2. **CSS-first, JS-минимум.** Tab switcher — только CSS (radio inputs + `~` combinator). JS только для корзины и WA-ссылки.

3. **Офлайн-фото через CSS градиенты.** Никаких внешних изображений — только `radial-gradient` стеки имитирующие студийную фотографию блюд.

4. **Промт-паттерн для новых фич:**
```
Добавь [фичу] в файл [файл].
Технически: [конкретное решение].
Стиль: тёмный, luxury, gold accent #c9a84c, red #c0272d.
Не ломай: [что нельзя трогать].
```

---

### Фаза 2 — FLOWSTATE (продающий сайт, дни 6-10)

**FLOWSTATE** — состояние потока при создании лендинга. Инструменты: Framer, Webflow, или чистый HTML.

**Структура лендинга Menvio (порядок блоков):**

```
1. HERO          — "Ваше меню в телефоне каждого гостя за 48 часов"
                   [Демо Dragon Garden прямо на экране]

2. БОЛЬ          — "Бумажное меню стоит $300 в печать. Поменял цену — переделывай всё."
                   [3 карточки боли с иконками]

3. РЕШЕНИЕ       — Как работает Menvio (3 шага: форма → мы делаем → QR готов)

4. ДЕМО          — Живой iframe с dragon-garden-menu.html или menvio-templates.html

5. ФИЧИ          — 6 ключевых преимуществ (allergen, WA-заказы, AI-фото, переводы...)

6. ТАРИФЫ        — Starter $29 / Pro $69 / Concierge $99

7. СОЦДОКАЗАТЕЛЬСТВО — Dragon Garden LA (первый кейс)

8. CTA           — "Хочу меню для своего ресторана" → форма (имя, ресторан, телефон)
```

---

### Фаза 3 — Связка (никогда не застрянешь)

```
Prompt Engineering  →  VIBECODE          →  FLOWSTATE
        │                   │                    │
  Определяешь        Строишь продукт      Продаёшь продукт
  что строить        (Claude Code)        (Framer/HTML)
        │                   │                    │
  OUTPUT:            OUTPUT:              OUTPUT:
  Чёткий бриф        .html файлы          Лендинг с CTA
  Тарифы             Демо клиентам        Форма заявок
  Дифференциатор     QR-коды              Email-воронка
```

**Правило перехода между фазами:**
- 0→1: Промт готов когда ты можешь объяснить продукт за 30 секунд НЕЗНАКОМОМУ человеку
- 1→2: Продукт готов когда есть хотя бы ОДИН живой клиентский демо (у нас — Dragon Garden LA)
- 2→Продажи: Лендинг готов когда есть форма заявок и ты готов ответить в течение 4 часов

---

---

## 🏗 Часть 2 — Текущее состояние проекта Menvio

### Что такое Menvio

QR-меню SaaS для независимых ресторанов в US и EU.
- Цены: $29 / $69 / $99 в месяц
- Целевой клиент: ресторан 2-50 столиков, владелец без IT-навыков
- Ключевое УТП: красивый дизайн + AI-фото + EU allergen compliance + WhatsApp-заказы БЕЗ комиссии
- Git: репо `kabluk/Claude`, ветка `claude/qr-code-service-model-Gxykr`

---

### Файлы проекта

#### `menvio-templates.html` (~2181 строк)
6 демо-шаблонов меню на одной странице:
- **T1** — Dark Luxury (Noir Steakhouse NYC) · тёмный, золото, стейки
- **T2** — Warm Bistro (La Piazza Italian) · тёплый, оливки, паста
- **T3** — Fresh & Bold (Burger Lab) · красный, дерзкий, бургеры
- **T4** — Minimal Tokyo (Sakura Japanese) · белый, каллиграфия, суши
- **T5** — Warm Story (Oak Table Farm) · бежевый, фермерский, локальный
- **T6** — Dark Botanical (Masala House Indian) · тёмно-зелёный, специи, индийская кухня

#### `dragon-garden-menu.html` (~1107 строк)
Первый реальный клиентский демо — Dragon Garden LA (Glendale, CA).
- Китайско-японский ресторан, Hot Pot специализация
- Телефон: (818) 971-9922 → `18189719922` для WA
- 5 вкладок: Hot Pot / À la Carte / Sushi & Raw / Drinks / Info
- WhatsApp-заказы подключены

#### `plan.md`
Полный продуктовый роадмап (см. Часть 3 ниже).

---

### Ключевые технические паттерны

#### 1. CSS-only tab switcher (ОБЯЗАТЕЛЬНО сохранять этот паттерн)
```html
<!-- Radio inputs ВНЕ #wrap -->
<input type="radio" id="r1" name="tab" checked>
<input type="radio" id="r2" name="tab">

<!-- Nav labels -->
<nav>
  <label for="r1">Вкладка 1</label>
  <label for="r2">Вкладка 2</label>
</nav>

<!-- Content wrapper -->
<div id="wrap">
  <section id="t1">...</section>
  <section id="t2">...</section>
</div>
```
```css
/* CSS switcher — НЕ ТРОГАТЬ */
#r1,#r2{display:none}
#r1:checked ~ #wrap #t1,
#r2:checked ~ #wrap #t2{display:block}
#wrap > section{display:none}

/* Активная вкладка */
#r1:checked ~ nav label[for=r1]{color:#c9a84c;border-bottom:2px solid #c9a84c}
```

#### 2. CSS Food Art (офлайн-фото без внешних ресурсов)
Все фото блюд — это CSS `radial-gradient` стеки. Работают из `file://`, офлайн, на iOS.

```css
/* Паттерн: 6-12 слоёв радиальных градиентов */
.food-hotpot{
  background:
    radial-gradient(ellipse 40% 15% at 50% 45%, rgba(255,255,255,.12) 0%, transparent 100%),
    radial-gradient(ellipse 20% 20% at 30% 38%, rgba(255,80,30,.6) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 50% 50%, #8b1a1a 0%, #5a0e0e 60%, #1a0505 100%),
    #0d0505
}
/* Существующие классы: food-steak, food-carbonara, food-sushi, food-curry,
   food-samosa, food-roganjosh, food-biryani, food-truffle, food-pappardelle,
   food-farmtable, food-kebab, food-bhaji, food-hotpot, food-sushi-roll,
   food-dimsum, food-ramen, food-wagyu, food-edamame, food-cocktail,
   food-peking, food-matcha */
```

#### 3. WhatsApp Cart System
```javascript
const RESTAURANT = {name:'Dragon Garden LA', phone:'18189719922'};
const cart = {};

function addItem(name, price) {
  if (!cart[name]) cart[name] = {price, qty: 0};
  cart[name].qty++;
  updateFloat();
}

function sendWA() {
  const items = Object.entries(cart).filter(([,v]) => v.qty > 0);
  const total = items.reduce((s,[,v]) => s + v.price * v.qty, 0);
  let msg = `Hello ${RESTAURANT.name}! I'd like to order:\n\n`;
  items.forEach(([name,{price,qty}]) => {
    msg += `• ${qty}x ${name} — $${(price*qty).toFixed(2)}\n`;
  });
  msg += `\nEstimated Total: $${total.toFixed(2)}\n\nThank you!`;
  window.open(`https://wa.me/${RESTAURANT.phone}?text=${encodeURIComponent(msg)}`,'_blank');
}
```

#### 4. Цветовые токены (дизайн-система)
```css
:root{
  /* Dragon Garden / Dark Luxury */
  --bg:#0a0a0a;       /* Фон страницы */
  --bg2:#111010;      /* Фон секций */
  --red:#c0272d;      /* Акцент красный */
  --gold:#c9a84c;     /* Акцент золото */
  --cream:#e8dcc8;    /* Текст основной */
  --muted:#8a7e6e;    /* Текст вторичный */
  --border:rgba(201,168,76,.18); /* Границы */
}
```

#### 5. SVG-декорации по кухне (позиция absolute, opacity 0.05-0.07)
- **Noir Steakhouse**: розмарин + базилик + золотой дым
- **La Piazza Italian**: оливковые ветки с оливками
- **Burger Lab**: красные halftone точки + диагональные линии
- **Sakura Japanese**: кандзи 桜花春和美道 + лепестки сакуры
- **Oak Table Farm**: листья клёна
- **Masala House Indian**: бадьян (8-конечный), лотос, кардамом
- **Dragon Garden**: чешуя дракона + фонари + бамбук + китайский узел

---

### Стек технологий

| Слой | Технология | Почему |
|---|---|---|
| Меню (фронт) | Pure HTML/CSS/JS | Работает file://, без сервера, любой хостинг |
| Фото | CSS radial-gradient | Офлайн, без CDN блокировки |
| Заказы | WhatsApp wa.me | Нет бэкенда, нет комиссии |
| AI-фото | kie.ai API (key: `f4fee9f2115094928f817db65a164f5d`) | Фото блюд по промту |
| Хостинг меню | GitHub Pages / Netlify Drop | Бесплатно, мгновенно |
| Аналитика (план) | Cloudflare Workers + Supabase | Serverless, дёшево |
| Платежи (план) | Stripe Connect | Ресторан получает напрямую |
| Шрифты | Google Fonts (Noto Serif JP, Cormorant Garamond, DM Sans) | Бесплатно |

---

## 📋 Часть 3 — Роадмап (приоритеты)

### Этап 1 — Сейчас (Июль 2025)

**#3 EU Allergen Compliance** ← СЛЕДУЮЩАЯ ЗАДАЧА
- 14 аллергенов EU (Reg. 1169/2011): глютен, ракообразные, яйца, рыба, арахис, соя, молоко, орехи, сельдерей, горчица, кунжут, диоксид серы, люпин, моллюски
- Badge-иконки под каждым блюдом
- Фильтр "скрыть блюда с [аллерген]"
- Добавить в Dragon Garden LA + все 6 шаблонов

**#5 Sold Out Toggle**
- URL-параметр `?admin=PASSWORD` показывает кнопки "Sold Out" на каждом блюде
- Блюдо зачёркивается у всех в реальном времени (localStorage синхронизация)
- Авто-сброс в полночь

### Этап 2 — Август 2025

**#6 Авто-перевод**
- `navigator.language` → авто-переключение при открытии
- Флаги EN/ES/DE/FR/RU вверху
- Перевод делается один раз через Claude API при создании меню

**#8 Аналитика сканирований**
- Cloudflare Worker endpoint: `POST /track` → Supabase
- Клик по блюду, добавление в корзину, отправка WA — все события
- Dashboard: простая HTML-страница с Chart.js

**#4 Done-for-You онбординг**
- Tally.so форма: название ресторана, кухня, меню (файл или текст), телефон WA
- Стандарт: меню готово за 48 часов

### Этап 3 — Сентябрь 2025

**#13 Stripe платежи**
- Stripe Connect: ресторан подключает свой аккаунт
- Payment Link встроен рядом с WA-кнопкой (выбор клиента)
- Menvio НЕ берёт комиссию — это УТП

**#10 50 предпостроенных демо**
- Скрипт: Google Maps → рестораны без QR-меню → парсинг Yelp → HTML за 2 часа
- Скрипт продаж: "Ваше меню уже готово — посмотрите: [ссылка]. $49/мес чтобы активировать."

### Этап 4 — Октябрь 2025

**#15 Мониторинг цен конкурентов**
- Ресторан указывает 2-3 конкурента
- Playwright scraper → Claude API для парсинга меню
- Еженедельный email-алерт об изменениях цен

---

## 💰 Бизнес-модель

### Тарифы
| План | Цена/мес | Что включено |
|---|---|---|
| **Starter** | $29 | Шаблон на выбор, самонастройка, WA-заказы |
| **Pro** | $69 | Мы строим меню за 48ч, AI-фото, 2 языка, аналитика |
| **Concierge** | $99 | Pro + ежемесячные обновления, EU allergen, 5 языков, мониторинг |

### Unit economics
- Цель 3 мес: 25 клиентов × avg $69 = **$1,725 MRR**
- Цель 6 мес: 100 клиентов × avg $79 = **$7,900 MRR**
- Churn цель: <5%/мес

### GTM стратегия
1. Dragon Garden LA как кейс-стади (у нас уже есть демо)
2. Google Maps prospecting → предпостроенные демо → холодный WA/email
3. EU рынок через allergen compliance angle (юридическая необходимость)
4. Instagram и Yelp аккаунты ресторанов → DM с демо-ссылкой

---

## 🚀 Первые действия в новой сессии

Если ты читаешь это в новой сессии — вот что делать дальше:

```
1. git checkout claude/qr-code-service-model-Gxykr
2. Открой dragon-garden-menu.html — это наш главный демо
3. Следующая задача: добавить EU Allergen badges (#3)
   - Создай 14 SVG-иконок аллергенов
   - Добавь их в dish-card под .dish-desc
   - Добавь фильтр-чекбоксы вверху секций
4. После аллергенов: Sold Out toggle (#5)
```

---

## 📎 Полезные ссылки и данные

- **kie.ai API key**: `f4fee9f2115094928f817db65a164f5d`
- **kie.ai endpoint**: `api.kie.ai` (нужно добавить в Network whitelist среды)
- **Dragon Garden LA phone**: (818) 971-9922 → WA: `18189719922`
- **Git repo**: `kabluk/Claude`
- **Git branch**: `claude/qr-code-service-model-Gxykr`
- **EU Allergen law**: Regulation (EU) No 1169/2011, Article 21 — 14 major allergens
- **Конкуренты для мониторинга**: Toast ($110+), Popmenu ($149+), Flipdish (€79+), BentoBox ($99+)

---

*Этот файл — полный контекст проекта Menvio. Вставь его в начало новой сессии Claude Code и разработка продолжится с того места где остановились.*
