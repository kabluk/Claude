# Vichitka: немецкий текст страницы `/bfsg-check/`

**Что это.** Весь немецкоязычный текст страницы `/bfsg-check/`, вынутый из кода,
чтобы носитель языка правил формулировки, а не читал JSX. Источник —
`src/pages/BfsgCheckPage.tsx`. Правки вносите прямо в этот файл (или пометками
рядом) — я перенесу их в код.

**Что уже проверено мной, править не нужно (если только формулировка не хромает):**

- `Anlage 3 zu § 14 BFSG` — верно, это требования к содержанию Erklärung.
- `§ 3 Abs. 3 BFSG` — верно дословно: «Absatz 1 gilt nicht für Kleinstunternehmen,
  die Dienstleistungen anbieten oder erbringen.»
- `§ 4 BFSG` — верно, заголовок статьи: «Konformitätsvermutung auf der Grundlage
  harmonisierter Normen».
- Определение Kleinstunternehmen (§ 2 BFSG): «weniger als zehn Personen
  beschäftigt und das entweder einen Jahresumsatz von höchstens 2 Millionen Euro
  erzielt oder dessen Jahresbilanzsumme sich auf höchstens 2 Millionen Euro
  beläuft» — в тексте передано как «weniger als 10 Beschäftigte und höchstens
  2 Mio. € Jahresumsatz oder Bilanzsumme».

**На что смотреть в первую очередь:**

1. Естественность языка — текст писал не носитель. Особенно обращения к читателю
   и переходы между абзацами.
2. Тон: должен быть спокойным и деловым. Мы **сознательно не пугаем** — не
   называем сумм штрафов, не нагнетаем сроки. Если где-то звучит как продажа
   страха, это ошибка, скажите.
3. Термины: `Erklärung zur Barrierefreiheit`, `Prüfstelle`, `Prüfer`,
   `Marktüberwachung`, `Konformitätsvermutung` — верны ли и уместны ли.
4. `Prüfer` vs `Prüfstelle` — мы используем оба. Так правильно или надо
   унифицировать?

---

## 1. Заголовок страницы (H1 и `<title>`)

> BFSG-Check: Fehlt Ihrer Website die Erklärung zur Barrierefreiheit?

## 2. Meta-описание (в поиске, не на странице)

> Kostenloser Scan auf die Erklärung zur Barrierefreiheit nach Anlage 3 zu § 14
> BFSG — und {N} Prüfer, die in veröffentlichten deutschen Erklärungen namentlich
> genannt sind.

*(`{N}` подставляется из данных — сейчас 18.)*

## 3. Вводный абзац

> Seit dem 28. Juni 2025 gilt das Barrierefreiheitsstärkungsgesetz (BFSG) auch für
> private Anbieter. Der Teil, der sich von außen ohne Test überprüfen lässt, ist
> die **Erklärung zur Barrierefreiheit** — sie ist entweder da oder nicht. Unser
> kostenloser Scan prüft genau das zuerst und benennt anschließend die
> Rechtsgrundlage.

## 4. Кнопки под вводным абзацем

> Website kostenlos prüfen

> Direkt zu den {N} Agenturen für Deutschland →

---

## 5. Раздел «Warum zuerst die Erklärung zur Barrierefreiheit?»

**Заголовок:**
> Warum zuerst die Erklärung zur Barrierefreiheit?

**Пункт 1:**
> **Sie ist gesetzlich verlangt.** Die Anforderungen an die Erklärung stehen in
> **Anlage 3 zu § 14 BFSG** ([Gesetzestext]). Das ist die einzige Rechtsgrundlage
> in unserem Katalog, die wir gegen die Primärquelle geprüft haben — für alle
> anderen Länder weisen wir sie ausdrücklich als ungeprüft aus.

**Пункт 2:**
> **Sie ist binär prüfbar.** Ob eine Seite WCAG erfüllt, kann kein Scanner
> abschließend sagen. Ob eine Erklärung verlinkt ist und die geforderten Angaben
> enthält, schon — ohne Fehlalarme.

**Пункт 3:**
> **Sie ist der sichtbarste Teil.** Die Marktüberwachung der Länder ([MLBF,
> Magdeburg]) prüft bundesweit und wird auch stichprobenartig tätig. Eine fehlende
> Erklärung ist von außen ohne jeden Test erkennbar — für uns wie für alle anderen.

⚠ **Проверьте по существу:** формулировка про MLBF («prüft bundesweit und wird
auch stichprobenartig tätig»). Мы не хотим утверждать больше, чем знаем. Если это
звучит как «они уже массово проверяют всех» — надо смягчить.

**Врезка (серый блок):**
> **Was wir bewusst nicht tun:** Wir nennen keine Bußgeldhöhen. Sie hängen von
> Umständen ab, die aus einem Scan nicht erkennbar sind — und
> **Kleinstunternehmen** (weniger als 10 Beschäftigte und höchstens 2 Mio. €
> Jahresumsatz oder Bilanzsumme) sind nach § 3 Abs. 3 BFSG von den Pflichten für
> Dienstleistungen ausgenommen. Diese Seite ist Orientierung, keine Rechtsberatung.

---

## 6. Раздел «In drei Schritten»

**Заголовок:**
> In drei Schritten

**Шаг 1:**
> **1. Scannen**
> Bis zu sechs Seiten, automatisch geprüft. Wählen Sie „Germany“ als Rechtsordnung
> — über den Button oben ist sie bereits vorbelegt, sonst rät der Scanner anhand
> der Domain und liegt bei `.com`-Adressen zwangsläufig daneben. [Zum Scan].

⚠ В интерфейсе сканера страна называется по-английски **„Germany“** — интерфейс
пока не локализован. Так и оставить, или написать «Deutschland (im Formular:
Germany)»?

**Шаг 2:**
> **2. Befund einordnen**
> Fehlt die Erklärung, weist der Bericht die Rechtsgrundlage direkt am Befund aus.
> Was der Scan abdeckt und was nicht, steht offen auf [unserer Methodenseite].

**Шаг 3:**
> **3. Prüfstelle beauftragen**
> Für den belastbaren Nachweis braucht es einen Menschen. Unten stehen {N} Prüfer,
> die in veröffentlichten deutschen Erklärungen zur Barrierefreiheit namentlich
> als externe Prüfstelle genannt werden — jeweils mit Link auf das Dokument.

---

## 7. Раздел «Was ein automatischer Scan nicht leisten kann»

**Заголовок:**
> Was ein automatischer Scan nicht leisten kann

**Текст:**
> Von den {всего} Web-Anforderungen der EN 301 549 — der Norm, auf die die
> Konformitätsvermutung des § 4 BFSG hinausläuft — prüfen wir {покрыто}
> automatisch. Die übrigen {остаток} hängen an Sinn und Urteilsvermögen:
> Reihenfolge, Verständlichkeit, Fehlermeldungen. Kein Scanner schließt diese
> Lücke, unserer auch nicht. [Vollständige Abdeckungskarte].

*(Числа подставляются из данных: сейчас 50 / 31 / 19.)*

⚠ **Проверьте по существу:** «der Norm, auf die die Konformitätsvermutung des
§ 4 BFSG hinausläuft». § 4 говорит о презумпции соответствия на основе
гармонизированных норм, но саму EN 301 549 поимённо не называет — она
объявляется отдельно. Формулировка «hinausläuft» выбрана как осторожная. Звучит
ли она естественно и не утверждает ли лишнего?

---

## 8. Раздел со списком агентств

**Заголовок:**
> In deutschen Erklärungen zur Barrierefreiheit genannte Prüfer ({N})

**Подзаголовок:**
> Diese Agenturen haben wir nicht selbst ausgewählt: Sie werden in veröffentlichten
> Erklärungen zur Barrierefreiheit als externe Prüfstelle benannt. Die Quelle steht
> bei jedem Eintrag — prüfen Sie sie nach.

**В карточке каждого агентства:**
> ✓ BIK BITV-Test Prüfstelle

> Genannt in: {домен} (öffentliche Stelle)
> Genannt in: {домен} (privates Unternehmen)

**Ссылки под списком:**
> Alle {N} Agenturen für Deutschland →
> Nur Audit-Anbieter →
> Nach BITV-Bezug filtern →

---

## 9. Раздел «Was kostet eine Prüfung?»

**Заголовок:**
> Was kostet eine Prüfung?

**Текст:**
> Wir zeigen keine Preise je Agentur: die meisten veröffentlichen keine, und
> geraten wird bei uns nichts. Eine belastbare Größenordnung veröffentlicht der
> BIK-Prüfverbund selbst — [indikative Seitenpreise nach Komplexitätsstufe]. Wie
> sich der Aufwand zusammensetzt, steht im Leitfaden zum BITV-Test unten.
> Verbindlich ist immer das individuelle Angebot.

⚠ «geraten wird bei uns nichts» — понятно ли, что имеется в виду «мы не
угадываем/не выдумываем»? Если звучит коряво, предложите замену.

---

## 10. Последний раздел

**Заголовок:**
> Zum Weiterlesen

*(Дальше идут заголовки и описания двух немецких гайдов — они лежат в
`data/a11y/guides/bfsg-pflichten-guide.md` и `bitv-test-kosten-ablauf.md`.
Если нужно вычитать и их — скажите, вынесу отдельным файлом.)*

---

## Примечание про язык интерфейса

Шапка, футер, навигация и форма сканера — **пока на английском**. Полная
локализация интерфейса это отдельная задача (`G-I18N-DE`), сознательно не
сделанная. То есть немецкий посетитель видит немецкий контент в английской
оболочке. Если это выглядит неприемлемо для запуска — скажите, это меняет
приоритет задачи.
