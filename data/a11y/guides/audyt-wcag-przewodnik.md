---
{
  "slug": "audyt-wcag-przewodnik",
  "locale": "pl",
  "title": "Audyt WCAG i deklaracja dostępności: przewodnik",
  "description": "Podstawy prawne audytu WCAG w Polsce: ustawa o dostępności cyfrowej, deklaracja dostępności i termin 31 marca, kary, Polski Akt o Dostępności, przebieg audytu.",
  "standard": "en-301-549",
  "countryCode": "PL",
  "updated": "2026-08-04",
  "faq": [
    {
      "q": "Czy polskie prawo wymaga WCAG 2.1 czy WCAG 2.2?",
      "a": "Załącznik do ustawy o dostępności cyfrowej z 4 kwietnia 2019 r. zawiera 49 kryteriów sukcesu WCAG 2.1 na poziomie A i AA i to on wyznacza obowiązek prawny podmiotów publicznych. WCAG 2.2 jest nowszą rekomendacją W3C, ale nie została dotąd wpisana do ustawy. Warto jednak testować także nowe kryteria 2.2, bo są zgodne wstecznie i przygotowują serwis na przyszłe zmiany przepisów i norm."
    },
    {
      "q": "Do kiedy trzeba zaktualizować deklarację dostępności?",
      "a": "Zgodnie z art. 11 ustawy o dostępności cyfrowej podmiot publiczny dokonuje przeglądu i aktualizacji deklaracji dostępności do 31 marca każdego roku, a także niezwłocznie po każdej zmianie strony lub aplikacji, która może wpływać na jej dostępność cyfrową. Datę ostatniego przeglądu należy podać w samej deklaracji."
    },
    {
      "q": "Jakie kary grożą za brak dostępności cyfrowej?",
      "a": "Ustawa przewiduje kary pieniężne do 10 000 zł za nieuzasadnione i uporczywe niezapewnianie dostępności cyfrowej strony lub aplikacji oraz do 5000 zł za brak deklaracji dostępności (lub jej wymaganych elementów) albo za niedostępność strony BIP i kluczowych elementów serwisu. Kary nakładane są po stwierdzeniu naruszeń w kolejnych monitoringach prowadzonych przez ministra właściwego do spraw informatyzacji."
    },
    {
      "q": "Czy firmy prywatne też muszą przechodzić audyty dostępności?",
      "a": "Tak, coraz częściej. Od 28 czerwca 2025 r. obowiązuje ustawa z 26 kwietnia 2024 r. wdrażająca Europejski Akt o Dostępności (tzw. Polski Akt o Dostępności), która nakłada wymagania dostępności m.in. na e-handel, bankowość detaliczną, telekomunikację i transport pasażerski. Audyt oparty na WCAG i normie EN 301 549 to podstawowy sposób zweryfikowania, czy usługa spełnia te wymagania."
    }
  ],
  "cta": { "label": "Znajdź firmę audytującą dostępność w Polsce", "path": "/poland/accessibility-audit/" },
  "relatedAgencies": ["wcag-audyt-pl", "lepszyweb", "audyt-dostepnosci-pl"]
}
---
Audyt WCAG to w Polsce nie tylko dobra praktyka, ale narzędzie wykonania konkretnych obowiązków prawnych: podmioty publiczne muszą zapewnić dostępność cyfrową swoich stron i aplikacji oraz publikować i co roku aktualizować deklarację dostępności, a od 28 czerwca 2025 r. wymagania dostępności objęły także dużą część sektora prywatnego. Ten przewodnik porządkuje stan prawny na 2026 r., wyjaśnia, co musi zawierać deklaracja dostępności, jakie kary przewidziano oraz jak w praktyce przebiega profesjonalny audyt.

## Podstawa prawna: ustawa o dostępności cyfrowej

Kluczowym aktem jest [ustawa z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych](https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20190000848) ([Dz.U. 2019 poz. 848](https://www.dziennikustaw.gov.pl/du/2019/848)), wdrażająca unijną [dyrektywę (UE) 2016/2102](https://eur-lex.europa.eu/eli/dir/2016/2102/oj) w sprawie dostępności stron internetowych i mobilnych aplikacji organów sektora publicznego.

Ustawa obejmuje **podmioty publiczne**: jednostki sektora finansów publicznych, państwowe jednostki organizacyjne bez osobowości prawnej, osoby prawne utworzone w celu zaspokajania potrzeb o charakterze powszechnym (finansowane lub kontrolowane w większości przez podmioty publiczne), a także niektóre organizacje pozarządowe działające na rzecz osób z niepełnosprawnościami lub seniorów. Obowiązek dotyczy stron internetowych, stron BIP, aplikacji mobilnych oraz wskazanych w ustawie elementów, z katalogiem wyłączeń (m.in. multimedia nadawane na żywo, mapy z zastrzeżeniami, część materiałów archiwalnych).

### Jaki standard techniczny obowiązuje?

Wymagania techniczne określa **załącznik do ustawy** — tabela zawierająca **49 kryteriów sukcesu [WCAG 2.1](https://www.w3.org/TR/WCAG21/) na poziomach A i AA** (dostępne jest także [autoryzowane polskie tłumaczenie WCAG 2.1](https://www.w3.org/Translations/WCAG21-pl/)). Ustawa przewiduje przy tym w art. 5, że wymagania załącznika uznaje się za spełnione, gdy podmiot zapewnia dostępność z uwzględnieniem punktów 9, 10 i 11 europejskiej normy **EN 301 549** (rozdziały dotyczące stron internetowych, dokumentów i oprogramowania).

Stan na sierpień 2026: **ustawa nadal odwołuje się do WCAG 2.1** — Polska nie wpisała do niej WCAG 2.2, choć jest to aktualna rekomendacja W3C. Dobrą praktyką audytową jest więc badanie zgodności z załącznikiem do ustawy (obowiązek prawny) oraz dodatkowo z nowymi kryteriami WCAG 2.2 (przygotowanie na przyszłość, m.in. rewizję normy EN 301 549).

### Polski Akt o Dostępności: sektor prywatny od czerwca 2025 r.

Europejski Akt o Dostępności ([dyrektywa (UE) 2019/882](https://eur-lex.europa.eu/eli/dir/2019/882/oj)) został wdrożony [ustawą z dnia 26 kwietnia 2024 r. o zapewnianiu spełniania wymagań dostępności niektórych produktów i usług przez podmioty gospodarcze](https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20240000731) (Dz.U. 2024 poz. 731), nazywaną **Polskim Aktem o Dostępności (PAD)**. Obowiązuje ona **od 28 czerwca 2025 r.** i dotyczy m.in. usług **handlu elektronicznego**, bankowości detalicznej, telekomunikacji, transportu pasażerskiego, e-booków oraz wybranych produktów (terminale płatnicze, sprzęt komputerowy, czytniki). Ministerstwo Cyfryzacji prowadzi [serwis informacyjny o dostępności cyfrowej i wymaganiach PAD dla e-handlu](https://www.gov.pl/web/dostepnosc-cyfrowa), w tym wykaz norm zharmonizowanych. Mikroprzedsiębiorstwa świadczące usługi są z PAD wyłączone, ale dla pozostałych firm audyt oparty na WCAG/EN 301 549 stał się realną potrzebą biznesową i prawną.

## Deklaracja dostępności: co musi zawierać

Deklaracja dostępności to publiczne oświadczenie o stanie dostępności serwisu. Sporządza się ją **w sposób dostępny cyfrowo**, według wzoru z [decyzji wykonawczej Komisji (UE) 2018/1523](https://eur-lex.europa.eu/eli/dec_impl/2018/1523/oj), z elementami dodatkowymi wymaganymi przez art. 10 ustawy:

- **status zgodności** strony lub aplikacji z ustawą (zgodna, częściowo zgodna, niezgodna) wraz ze wskazaniem treści niedostępnych i powodów (np. nadmierne koszty — które trzeba uzasadnić);
- **data publikacji** strony/aplikacji i data ostatniej istotnej aktualizacji;
- **informacja o sposobie dokonania oceny** dostępności cyfrowej (samoocena lub audyt zewnętrzny, z linkiem do raportu, jeśli jest);
- **dane kontaktowe** podmiotu oraz osoby wyznaczonej do spraw dostępności cyfrowej;
- **skróty klawiaturowe** dostępne w serwisie;
- **informacja o dostępności architektonicznej** siedziby;
- **informacja o dostępności tłumacza języka migowego** przez środki komunikacji elektronicznej (albo o jej braku);
- **procedura żądań** — informacja o możliwości powiadomienia o braku dostępności i wystąpienia z żądaniem zapewnienia dostępności;
- **link do strony Rzecznika Praw Obywatelskich**;
- dla aplikacji mobilnych — adres, pod którym można pobrać aplikację, oraz link do deklaracji aplikacji.

Deklarację publikuje się na stronie, której dotyczy (dla aplikacji — na stronie podmiotu i w aplikacji), a link do niej musi być osiągalny podczas nawigacji po serwisie — w praktyce w stopce każdej podstrony.

### Termin: przegląd do 31 marca każdego roku

Zgodnie z **art. 11 ustawy** podmiot publiczny dokonuje **przeglądu i aktualizacji deklaracji do dnia 31 marca każdego roku** oraz niezwłocznie po każdej zmianie mogącej wpłynąć na dostępność cyfrową. Coroczny przegląd to naturalny moment na ponowny audyt lub przynajmniej badanie kontrolne — status „częściowo zgodna" wpisany raz na zawsze, bez aktualnych badań, jest łatwy do podważenia podczas monitoringu.

## Nadzór i kary pieniężne

Nadzór nad stosowaniem ustawy sprawuje **minister właściwy do spraw informatyzacji**, który raz w roku monitoruje dostępność stron i aplikacji podmiotów publicznych według metodyki z decyzji wykonawczej (UE) 2018/1524. Art. 19 ustawy przewiduje kary pieniężne:

| Naruszenie | Maksymalna kara |
|---|---|
| Nieuzasadnione i uporczywe niezapewnianie dostępności cyfrowej strony lub aplikacji (brak poprawy w trzech kolejnych monitoringach, rosnąca liczba uzasadnionych skarg) | **10 000 zł** |
| Brak deklaracji dostępności albo brak jej wymaganych elementów (stwierdzone w dwóch kolejnych monitoringach) | **5000 zł** |
| Niezapewnienie dostępności strony BIP oraz kluczowych elementów i funkcji strony lub aplikacji (stwierdzone w dwóch kolejnych monitoringach) | **5000 zł** |

Poza karami administracyjnymi każdy użytkownik może złożyć **żądanie zapewnienia dostępności**, a po wyczerpaniu procedury — skargę; rosnąca liczba uzasadnionych skarg jest jedną z przesłanek uznania naruszenia za uporczywe. Polski Akt o Dostępności przewiduje odrębny system nadzoru rynku i sankcji dla podmiotów gospodarczych.

## Jak w praktyce przebiega audyt WCAG

Rzetelny audyt dostępności to praca ekspercka, której nie zastąpi automatyczny skaner (narzędzia automatyczne wykrywają tylko część problemów — nie ocenią np. sensowności tekstów alternatywnych, logiki nagłówków ani obsługi czytnika ekranu). Typowy przebieg:

### 1. Określenie próbki badawczej

Audytor dobiera **reprezentatywną próbkę podstron**: stronę główną, wyniki wyszukiwania, formularze i procesy wieloetapowe (np. e-usługi, koszyk), stronę kontaktu, deklarację dostępności, dokumenty do pobrania (PDF, DOCX), a także szablony o odmiennej budowie (tabele, multimedia, mapy). Dla aplikacji mobilnych — kluczowe ekrany i przepływy.

### 2. Badanie eksperckie i testy z technologiami asystującymi

Każda strona z próbki jest sprawdzana pod kątem kryteriów z załącznika do ustawy: badanie kodu i semantyki, kontrastów, obsługi klawiaturą, powiększenia do 200%, a także **testy z czytnikami ekranu** (najczęściej NVDA z przeglądarką na Windows, VoiceOver/TalkBack dla aplikacji mobilnych). Najlepsze zespoły włączają do badań **osoby z niepełnosprawnościami** jako testerów.

### 3. Raport i priorytetyzacja

Wynikiem jest raport wskazujący naruszone kryteria, lokalizację błędów, ich wpływ na użytkowników i rekomendacje naprawy — uporządkowane od blokerów (uniemożliwiają korzystanie z usługi) po usterki kosmetyczne. Dobry raport zawiera też dane wprost do wpisania w deklarację dostępności: status zgodności i listę treści niedostępnych.

### 4. Wsparcie wdrożenia i reaudyt

Po poprawkach wykonywany jest **reaudyt** potwierdzający usunięcie błędów — dopiero wtedy warto aktualizować deklarację. Ustalcie już w umowie, czy reaudyt wchodzi w zakres zamówienia.

## Jak wybrać wykonawcę audytu

- **Doświadczenie z polskim stanem prawnym** — audytor powinien znać ustawę o dostępności cyfrowej, wymagane elementy deklaracji i metodykę monitoringu, nie tylko „ogólne WCAG".
- **Metodyka z testami manualnymi** — poproście o opis próbki, narzędzi i konfiguracji technologii asystujących; sama „walidacja automatyczna" to nie audyt.
- **Udział osób z niepełnosprawnościami** w testach — istotnie podnosi trafność wyników.
- **Referencje weryfikowalne** — deklaracje dostępności podmiotów publicznych często wskazują wykonawcę audytu; to łatwy sposób sprawdzenia realnych wdrożeń.
- **Kompletność oferty** — raport, warsztat dla zespołu, wsparcie przy deklaracji, reaudyt; dla firm objętych PAD — także mapowanie na EN 301 549.

Audyt to początek procesu, nie jego koniec: każda publikacja nowych treści może wprowadzić nowe bariery. Zaplanujcie coroczny przegląd przed 31 marca, szkolenia redaktorów i deweloperów oraz testy dostępności w odbiorach nowych funkcji — wtedy kolejne audyty będą już tylko potwierdzać zgodność, a nie odkrywać zaległości.
