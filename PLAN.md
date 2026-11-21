# Plan realizacji

Zadanie ZUS na HackNation 2026, "Zasiłkowy Przewodnik Przyszłego Rodzica". Wymagania biorą się
z `OPIS/ZUS - Pełna treść zadania konkursowego.pdf`, a ten plik rozkłada je na kroki do
odhaczania. Po każdym skończonym kroku wracamy tutaj i zaznaczamy, co gotowe.

## Terminy

- sobota 21.11, 20:00: Draft Checkpoint w HackTribe. Projekt musi już istnieć, z nazwą drużyny
  i linkiem do repo. Po tej godzinie nie zmienimy zadania, w którym startujemy.
- niedziela 22.11, 11:00: ostateczne zgłoszenie projektu do oceny.
- niedziela 22.11, 14:45: ogłoszenie finalistów.

## Co już mamy

- `back/` to FastAPI z endpointami `health` i `benefits`, ze środowiskiem `.venv` w środku.
- `front/` to Vite, React 19, TypeScript, Tailwind v4 i komponenty w stylu shadcn, z routingiem,
  TanStack Query i zustand. Paleta ZUS siedzi w `src/index.css`.
- `OPIS/` zawiera brief, regulamin, wyciągi ustaw, Kodeks pracy, Poradnik dla rodziców ZUS 2026
  oraz załącznik z wymiarami i wysokościami zasiłków.
- `PRZYKLADY/` zawiera 87 spraw w PDF. To jest zestaw, na którym jury sprawdzi wyliczenia.

Materiały ZUS zostają lokalnie. `.gitignore` wycina `OPIS/` i `PRZYKLADY/`, bo regulamin nie
pozwala ich kopiować ani rozpowszechniać.

## Gdzie idą punkty

| Kryterium | Waga | Kroki |
| --- | --- | --- |
| Związek z wyzwaniem | 25% | 3, 5, 7, 9 |
| Pomysł | 20% | 2, 5 |
| Oryginalność | 15% | 5, 6, 14 |
| Kompletność projektu i UX | 25% | 4, 6, 10, 12 |
| Potencjał wdrożeniowy | 15% | 3, 8, 11, 13 |

## Postęp

- [ ] Krok 0. Reguły zasiłków na papierze
- [ ] Krok 1. Zestaw testowy z PRZYKLADY
- [ ] Krok 2. Model danych i API
- [ ] Krok 3. Silnik uprawnień i kalkulatory
- [ ] Krok 4. Wejście i logowanie
- [ ] Krok 5. Wywiad i ustalanie uprawnień
- [ ] Krok 6. Kalkulator na ekranie
- [ ] Krok 7. Dokumenty, terminy i miejsce złożenia
- [ ] Krok 8. Symulacje ZUS
- [ ] Krok 9. Ryzyka i ostrzeżenia
- [ ] Krok 10. Trudne sytuacje i wsparcie
- [ ] Krok 11. Panel administracyjny
- [ ] Krok 12. Wygląd i responsywność
- [ ] Krok 13. Testy na sprawach i upload wniosków
- [ ] Krok 14. Funkcje z AI
- [ ] Krok 15. Materiały do oddania
- [ ] Krok 16. Weryfikacja przed oddaniem

## Krok 0. Reguły zasiłków na papierze

Zamieniamy przepisy na listę reguł, które potem staną się kodem. Bez tego kroku kalkulator nie ma
z czego liczyć.

- Wymiar urlopu macierzyńskiego zależnie od liczby dzieci, od 20 do 37 tygodni.
- Sześć przypadków uzupełniającego urlopu macierzyńskiego z tabeli w załączniku, z progami tygodnia
  ciąży, masy urodzeniowej i czasu hospitalizacji.
- Urlop rodzicielski, 41 lub 43 tygodnie, z dziewięcioma tygodniami nieprzenoszalnymi dla każdego
  z rodziców i podziałem na maksymalnie pięć części.
- Urlop ojcowski, 14 dni, do 12. miesiąca życia dziecka.
- Wysokości zasiłku, 100% podstawy za macierzyński, uzupełniający i ojcowski, 70% za rodzicielski
  oraz 81,5% przy wniosku złożonym do 21 dni po porodzie.
- Okres zasiłkowy 270 dni oraz wynagrodzenie chorobowe, 33 dni albo 14 dni po 50. roku życia.
- Warunki podlegania ubezpieczeniu, 30 dni przy obowiązkowym i 90 dni przy dobrowolnym.

Gotowe, gdy istnieje tabela reguł z odesłaniem do przepisu albo strony materiału.

Brief, pkt 3 a, b, c, d, e, f, j oraz pkt 7.

## Krok 1. Zestaw testowy z PRZYKLADY

Budujemy zbiór spraw, na których rozwiniemy kalkulator i sprawdzimy go przed jurorami.

- Pogrupować 87 spraw po typie. W nazwach widać już chorobowy w ciąży, macierzyński,
  uzupełniający, ojcowski, dziewięć tygodni dla ojca, martwe urodzenie, adopcję i rodzinę
  zastępczą, odmowy z powodu braku ubezpieczenia, łączenie z pracą i podwyższenie kwoty.
- Wybrać kilkanaście reprezentatywnych spraw i dla każdej wypisać stan faktyczny, podstawę
  wymiaru, rozstrzygnięcie i kwotę.
- Zapisać to w formie, którą da się wczytać do aplikacji i użyć w testach.

Gotowe, gdy jedna sprawa z zestawu przechodzi przez kalkulator i daje wynik zgodny z decyzją
w PDF.

Brief, pkt 3 f oraz pkt 6.

## Krok 2. Model danych i API

Ustalamy, co aplikacja przyjmuje i co zwraca, żeby front i backend nie rozjechały się w połowie.

- Zaprojektować wejście, czyli sytuację użytkownika, i wyjście, czyli listę świadczeń z wymiarem,
  kwotą i uzasadnieniem.
- Rozpisać schematy w `back/app/schemas/` i wystawić endpointy w `back/app/api/routes/`.
- Przenieść reguły z kroku 0 do `back/app/services/`.

Gotowe, gdy `pytest` przechodzi, a `/docs` pokazuje komplet endpointów.

Brief, pkt 3 oraz pkt 5.

## Krok 3. Silnik uprawnień i kalkulatory

Serce projektu i największa część punktów za związek z wyzwaniem.

- Silnik ustalania prawa do świadczenia, z odpowiedzią jest albo nie ma i z powodem.
- Kalkulator wymiaru i wysokości dla obojga rodziców.
- Tryb łączenia pracy z urlopem rodzicielskim, z wydłużeniem urlopu i zasiłkiem za ten okres.
- Tryb korzystania przez oboje rodziców, z podziałem wspólnej puli.
- Wariant adopcji i rodziny zastępczej niezawodowej.
- Wariant indywidualnej podstawy wymiaru, liczony na konkretnej sprawie z zestawu.

Gotowe, gdy wynik zgadza się z zestawem testowym z kroku 1 dla każdej wybranej sprawy.

Brief, pkt 3 b, c, d, e, f, j.

## Krok 4. Wejście i logowanie

Pierwszy ekran decyduje o tym, czy ktoś w ogóle wejdzie w wywiad.

- Dwa wejścia, zalogowanie przez mObywatel oraz ręczne wpisanie danych.
- Symulacja logowania przez mObywatel. Brief wymaga tylko zasymulowania.
- Jedna lista metod logowania, w której mObywatel jest pierwszą pozycją, a obok stoją Profil
  Zaufany, bankowość i e-dowód. Każda metoda pokazuje tę samą symulację.

Gotowe, gdy po kliknięciu widać ekran z danymi z ZUS i przejście dalej.

Brief, pkt 3, lista symulacji.

## Krok 5. Wywiad i ustalanie uprawnień

Użytkownik odpowiada na kilka pytań i od razu widzi, co mu przysługuje, a czego nie.

- Pytania o rolę, rodzaj umowy, datę porodu, liczbę dzieci, zaświadczenie "Za życiem" i planowany
  powrót do pracy.
- Ekran z listą świadczeń, każde z wymiarem, kwotą i podstawą prawną.
- Osobny, wyraźny komunikat, gdy prawa nie ma, wraz z wyjaśnieniem przyczyny.

Gotowe, gdy da się przejść wywiad od początku do listy świadczeń bez zaglądania do kodu.

Brief, pkt 3 a, g.

## Krok 6. Kalkulator na ekranie

Jeden zintegrowany kalkulator z wyborem opcji, zgodnie z rekomendacją z briefu.

- Suwaki do podziału urlopu między rodzicami, z widocznymi dziewięcioma nieprzenoszalnymi
  tygodniami.
- Porównanie wariantu 81,5% i 70%.
- Tryb łączenia pracy z urlopem.
- Widoczny wynik liczony na żywo przy każdej zmianie.

Gotowe, gdy każdy wariant z kroku 3 da się ustawić z ekranu.

Brief, pkt 3 b, c, d, e oraz rekomendacja zintegrowanego kalkulatora.

## Krok 7. Dokumenty, terminy i miejsce złożenia

Użytkownik ma wyjść z informacją, co dokładnie zrobić i gdzie.

- Lista dokumentów potrzebnych do każdego świadczenia.
- Rozróżnienie, czy sprawę prowadzi pracodawca, czy ZUS, zależnie od liczby ubezpieczonych
  u płatnika.
- Terminy, w tym 21 dni na wniosek o 81,5% i 14 dni na przejęcie urlopu przez ojca.
- Symulacja wypełnienia wniosku o urlop, bo tych wzorów nie ma na stronie ZUS, oraz wniosek
  o świadczenie z wzorów ze strony ZUS.

Gotowe, gdy dla każdego świadczenia widać komplet dokumentów, termin i adresata.

Brief, pkt 3 g oraz lista symulacji.

## Krok 8. Symulacje ZUS

Wszystko to jest udawane i brief mówi o tym wprost, ale musi być widoczne.

- Dane o ubezpieczeniu albo o jego braku, plus ręczne wprowadzenie danych.
- Stan zadłużenia ze składek na dzień powstania prawa do świadczenia.
- Podgląd zaświadczeń e-ZLA.
- Połączenie z PUE/eZUS, z zapytaniem i wglądem w dane na koncie.
- Wniosek o odpis zupełny albo skrócony aktu urodzenia.
- Przekierowania do ZUS, MRPiPS i PIP.

Gotowe, gdy każdy punkt z listy ma swój ekran albo przycisk, który coś pokazuje.

Brief, pkt 3, lista symulacji.

## Krok 9. Ryzyka i ostrzeżenia

Punkt h jest wart tyle samo co reszta treści, a łatwo go pominąć.

- Ostrzeżenie o pozorności umowy zawartej tylko po to, żeby wejść do ubezpieczenia chorobowego.
- Ostrzeżenie o podwyższeniu podstawy wymiaru w ciąży, które ZUS może zakwestionować.
- Ostrzeżenie o utracie ubezpieczenia przed porodem, na przykład po rozwiązaniu umowy.
- Przy każdym ostrzeżeniu krótka informacja, co to zmieni w kwocie użytkownika.

Gotowe, gdy ostrzeżenia pojawiają się dopasowane do wpisanej sytuacji, a nie wszystkie naraz.

Brief, pkt 3 h.

## Krok 10. Trudne sytuacje i wsparcie

Ścieżka dla śmierci dziecka, wcześniaka, poronienia i ciężkiej choroby. Ma być spokojna
i oddzielona od kalkulatora.

- Uzupełniający urlop macierzyński z sześcioma przypadkami z kroku 0.
- Osiem tygodni zasiłku po martwym urodzeniu, z zastrzeżeniem siedmiu dni od zgonu.
- Lista fundacji i stowarzyszeń udzielających wsparcia w tych sytuacjach.

Gotowe, gdy ścieżka istnieje i prowadzi do konkretnych organizacji.

Brief, pkt 3 i oraz pkt 3 a.

## Krok 11. Panel administracyjny

Zmiana parametru nie może wymagać wdrożenia, bo brief wprost tego oczekuje.

- Stopa procentowa zasiłku macierzyńskiego.
- Maksymalne wymiary urlopów.
- Dodawanie i wyłączanie funkcji.

Gotowe, gdy zmiana parametru w panelu zmienia wynik kalkulatora bez ruszania kodu.

Brief, pkt 3, ostatni akapit.

## Krok 12. Wygląd i responsywność

Pełne RWD jest wymagane, a kompletność i UX to 25% oceny.

- Ustawić wygląd pod ZUS, spokojny i czytelny, z dużą czcionką.
- Sprawdzić układ na telefonie, tablecie i komputerze.
- Upewnić się, że pierwszy ekran da się obsłużyć kciukiem.

Gotowe, gdy żaden ekran nie rozpada się na wąskim widoku.

Brief, pkt 4 i pkt 5.

## Krok 13. Testy na sprawach i upload wniosków

Jury weźmie niektóre wnioski i sprawdzi wyliczenia, więc strona musi umieć je przyjąć.

- Upload albo wybór wniosku z zestawu na stronie.
- Weryfikacja, czy osoba z wniosku podlega ubezpieczeniu.
- Sprawdzenie kalkulatora na tej samej sprawie.
- Testy automatyczne w `back/tests/` dla reguł z kroku 0.

Gotowe, gdy wybrana sprawa z `PRZYKLADY/` przechodzi przez stronę i daje wynik z decyzji.

Brief, pkt 4 oraz pkt 6.

## Krok 14. Funkcje z AI

Brief dopuszcza AI w aplikacji i w procesie twórczym, ale każe wskazać zakres użycia.

- Wywiad prowadzony rozmową, zamiast formularza.
- Odczyt danych z wgranego wniosku.
- Wyjaśnienie wyniku, dlaczego wyszło 70% a nie 81,5%.
- Wyszukiwarka po Poradniku i przepisach.
- Spisać w opisie, które funkcje korzystają z AI. Jeśli żadna, napisać to wprost.

Gotowe, gdy każda funkcja z AI jest wypisana w opisie projektu.

Brief, pkt 4 oraz pkt 9.

## Krok 15. Materiały do oddania

To jest to, co juror faktycznie zobaczy.

- Szczegółowy opis i tytuł projektu.
- Prezentacja, maksymalnie 10 slajdów.
- Film do 3 minut w otwartym repozytorium, pokazujący projekt w użyciu.
- Repozytorium kodu, zrzuty ekranu i link do działającej demonstracji.
- Materiały graficzne.

Gotowe, gdy wszystkie pięć pozycji istnieje i linki działają.

Brief, pkt 4.

## Krok 16. Weryfikacja przed oddaniem

Ostatnie przejście po wymaganiach, żeby nic nie wypadło.

- Przejść listę a do j z pkt 3 i odhaczyć każdą literę.
- Przejść listę symulacji z pkt 3 i odhaczyć każdą pozycję.
- Sprawdzić `pytest` w `back/` oraz `npm run build` i `npm run lint` w `front/`.
- Sprawdzić, że `git status` nie łapie niczego z `OPIS/` ani `PRZYKLADY/`.
- Otworzyć demo na telefonie i przejść ścieżkę od wejścia do wyniku.

Gotowe, gdy cała lista jest odhaczona bez wyjątków.

Brief, pkt 3, 4, 5, 6.

## Mapa wymagań na kroki

| Wymaganie | Krok |
| --- | --- |
| a. Świadczenia w ciąży, także brak uprawnień | 3, 5 |
| b. Kalkulator macierzyńskiego dla obojga rodziców | 3, 6 |
| c. Łączenie pracy z urlopem rodzicielskim | 3, 6 |
| d. Symulacja, gdy korzystają oboje rodzice | 3, 6 |
| e. Rodzice adopcyjni i rodzina zastępcza | 3, 6 |
| f. Indywidualna podstawa wymiaru na sprawie | 1, 3, 13 |
| g. Dokumenty, terminy, pracodawca albo ZUS | 5, 7 |
| h. Ryzyka i ostrzeżenia | 9 |
| i. Podmioty wsparcia w trudnych sytuacjach | 10 |
| j. Kalkulator dla adopcji, powtórzony w briefie | 3, 6 |
| Logowanie przez mObywatel | 4 |
| Dane z ZUS i wpisanie własnych | 4, 8 |
| Zadłużenie ze składek | 8 |
| Podgląd e-ZLA | 8 |
| Połączenie z PUE/eZUS | 8 |
| Wypełnienie wniosków o urlopy i świadczenia | 7 |
| Wniosek o odpis aktu urodzenia | 8 |
| Informacje o podmiotach wsparcia | 10 |
| Przekierowania do ZUS, MRPiPS, PIP | 8 |
| Panel administracyjny | 11 |
| Zintegrowany kalkulator, rekomendacja | 6 |
| Opis i tytuł projektu | 15 |
| Prezentacja do 10 slajdów | 15 |
| Film do 3 minut | 15 |
| Repozytorium, zrzuty, demo | 15 |
| Interfejs responsywny | 12 |
| Wskazanie funkcji z AI | 14 |
| Upload przykładowych wniosków | 13 |
| Stack React i Python, REST | 2, 12 |

## Ryzyka

- Czas. Do niedzieli 11:00 zostaje mało godzin, więc kroki 0 do 3 idą pierwsze, bo bez nich nie ma
  czego pokazywać.
- Zakres. Spraw jest 87, ale jury weźmie tylko niektóre. Nie ma sensu obrabiać wszystkich.
- Materiały ZUS. Nigdy nie wchodzą do gita. Przed każdym `git add -A` patrzymy na `git status`.
- Zgodność z przepisami. Błędna kwota w kalkulatorze kosztuje punkty za związek z wyzwaniem, więc
  wynik musi być sprawdzony na decyzjach z `PRZYKLADY/`.
