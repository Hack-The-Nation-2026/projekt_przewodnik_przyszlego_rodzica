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

Materiały ZUS zostają lokalnie. `.gitignore` wycina `OPIS/` i `PRZYKLADY/`, bo brief nie pozwala
ich kopiować ani rozpowszechniać.

## Gdzie idą punkty

| Kryterium | Waga | Kroki |
| --- | --- | --- |
| Związek z wyzwaniem | 25% | 3, 5, 7, 9 |
| Pomysł | 20% | 2, 5 |
| Oryginalność | 15% | 5, 6, 14 |
| Kompletność projektu i UX | 25% | 4, 6, 10, 12 |
| Potencjał wdrożeniowy | 15% | 3, 8, 11, 13 |

## Postęp

- [x] Krok 0. Reguły zasiłków na papierze
- [x] Krok 1. Zestaw testowy z PRZYKLADY
- [x] Krok 2. Model danych i API
- [x] Krok 3. Silnik uprawnień i kalkulatory
- [x] Krok 4. Wejście i logowanie
- [x] Krok 5. Wywiad i ustalanie uprawnień
- [x] Krok 6. Kalkulator na ekranie
- [x] Krok 7. Dokumenty, terminy i miejsce złożenia
- [x] Krok 8. Symulacje ZUS
- [x] Krok 9. Ryzyka i ostrzeżenia
- [x] Krok 10. Trudne sytuacje i wsparcie
- [x] Krok 11. Panel administracyjny
- [x] Krok 12. Wygląd i responsywność
- [ ] Krok 13. Testy na sprawach i upload wniosków
- [x] Krok 14. Asystent z AI
- [x] Krok 15. Materiały do oddania
- [x] Krok 17. Karta uprawnień, kreator wniosków i dostępność
- [x] Krok 18. Oś czasu, wyjaśnienia liczb i ścieżki po fakcie
- [x] Krok 16. Weryfikacja przed oddaniem

## Krok 0. Reguły zasiłków na papierze

Zamieniamy przepisy na listę reguł, które potem staną się kodem. Bez tego kroku kalkulator nie ma
z czego liczyć.

- Wymiar urlopu macierzyńskiego zależnie od liczby dzieci, od 20 do 37 tygodni.
- Sześć przypadków uzupełniającego urlopu macierzyńskiego z tabeli w załączniku, z progami tygodnia
  ciąży, masy urodzeniowej i czasu hospitalizacji.
- Urlop rodzicielski, 41 lub 43 tygodnie, a przy zaświadczeniu "Za życiem" 65 albo 67 tygodni, z
  dziewięcioma tygodniami nieprzenoszalnymi dla każdego z rodziców i podziałem na maksymalnie
  pięć części.
- Limit wydłużenia urlopu rodzicielskiego przy łączeniu z pracą, 82 albo 86 tygodni, a przy
  zaświadczeniu "Za życiem" 130 albo 134.
- Urlop ojcowski, 14 dni, do 12. miesiąca życia dziecka.
- Wysokości zasiłku, 100% podstawy za macierzyński, uzupełniający, ojcowski i za zasiłek
  chorobowy w ciąży, 70% za urlop rodzicielski, a 81,5% przy wniosku złożonym do 21 dni po
  porodzie. Wyjątkiem jest dziewięć tygodni nieprzenoszalnych drugiego rodzica, za które zawsze
  przysługuje 70%.
- Przy łączeniu urlopu rodzicielskiego z pracą zasiłek macierzyński zmniejsza się proporcjonalnie
  do wymiaru czasu pracy.
- Świadczenie rehabilitacyjne po wyczerpaniu zasiłku chorobowego, gdy leczenie rokuje odzyskanie
  zdolności do pracy, nie dłużej niż 12 miesięcy, w wysokości 90% podstawy za pierwsze trzy
  miesiące i 75% za pozostałe, a 100%, gdy niezdolność przypada w okresie ciąży.
- Zasiłek w wysokości zasiłku macierzyńskiego po ustaniu zatrudnienia, gdy umowa wygasła wskutek
  śmierci pracodawcy albo rozwiązano ją w ciąży z powodu upadłości lub likwidacji i nie zapewniono
  innego zatrudnienia. Wypłacany do dnia porodu.
- Okres zasiłkowy 182 dni, a 270 dni, gdy niezdolność przypada w ciąży albo jest spowodowana
  gruźlicą. Wynagrodzenie chorobowe przez 33 dni, a 14 dni po 50. roku życia.
- Wymagany okres ubezpieczenia do nabycia prawa, 30 dni przy obowiązkowym i 90 dni przy
  dobrowolnym.

Gotowe, gdy istnieje tabela reguł z odesłaniem do przepisu albo strony materiału.

Zrobione 21.11. Tabela stoi w `RULES.md`, w 12 sekcjach od A do L, 85 reguł z identyfikatorami.
Każdy wiersz ma odesłanie do artykułu ustawy zasiłkowej albo Kodeksu pracy, a obok miejsce
w załączniku lub strona Poradnika. Na końcu pliku jest lista czterech rzeczy, których materiały
nie podają, w tym wartości minimalnej podstawy wymiaru na 2026 rok, bo załącznik je zapowiada,
a potem ich nie wypisuje.

Brief, pkt 3 a, b, c, d, e, f, j oraz pkt 7.

## Krok 1. Zestaw testowy z PRZYKLADY

Budujemy zbiór spraw, na których rozwiniemy kalkulator i sprawdzimy go przed jurorami.

- Pogrupować 87 spraw po typie. W nazwach widać już chorobowy w ciąży, macierzyński,
  uzupełniający, ojcowski, dziewięć tygodni dla ojca, zasiłek w wysokości zasiłku macierzyńskiego,
  martwe urodzenie, adopcję i rodzinę zastępczą, odmowy z powodu braku ubezpieczenia, łączenie
  z pracą i podwyższenie kwoty.
- Wybrać kilkanaście reprezentatywnych spraw i dla każdej wypisać stan faktyczny, podstawę
  wymiaru, rozstrzygnięcie i kwotę.
- Zapisać to w formie, którą da się wczytać do aplikacji i użyć w testach.

Lokalny plik `PRZYKLADY/zestaw-testowy.json` zawiera katalog 87 PDF-ów i 14 wybranych spraw.
`back/tests/zus_cases.py` wczytuje i waliduje wersję 1 zestawu. Daty okresów są włączne, a kwoty
podane w groszach. Wartość `null` oznacza brak potwierdzonej wartości albo pole nieadekwatne
do sprawy. Kwota wyliczona pomocniczo jest oznaczona osobno od kwoty potwierdzonej w PDF.
Katalog i dane ze spraw są przeznaczone do użytku lokalnego pod ignorowaną ścieżką `PRZYKLADY/`.

Gotowe, gdy jedna sprawa z zestawu przechodzi przez kalkulator i daje wynik zgodny z decyzją
w PDF. Warunek sprawdzono w testach referencyjnych kroku 3.

Brief, pkt 3 f oraz pkt 6.

## Krok 2. Model danych i API

Ustalamy, co aplikacja przyjmuje i co zwraca, żeby front i backend nie rozjechały się w połowie.

- Zaprojektować wejście, czyli sytuację użytkownika, i wyjście, czyli listę świadczeń z wymiarem,
  kwotą i uzasadnieniem.
- Rozpisać schematy w `back/app/schemas/` i wystawić endpointy w `back/app/api/routes/`.
- Przenieść reguły z kroku 0 do `back/app/services/`.

Gotowe, gdy `pytest` przechodzi, a `/docs` pokazuje komplet endpointów.

Zrobione 21.11. Schematy siedzą w `back/app/schemas/`, endpointy w `back/app/api/routes/`, a reguły
w `back/app/services/`. Pod `/api` stoją `health`, `benefits`, `auth` i `zus`, więc `/docs` pokazuje
cały kontrakt, na którym pracuje frontend.

Brief, pkt 3 oraz pkt 5.

## Krok 3. Silnik uprawnień i kalkulatory

Serce projektu i największa część punktów za związek z wyzwaniem.

- Silnik ustalania prawa do świadczenia, z odpowiedzią jest albo nie ma i z powodem.
- Kalkulator wymiaru i wysokości dla obojga rodziców.
- Tryb łączenia pracy z urlopem rodzicielskim, z wydłużeniem urlopu i zasiłkiem za ten okres.
- Tryb korzystania przez oboje rodziców, z podziałem wspólnej puli.
- Wariant adopcji i rodziny zastępczej niezawodowej.
- Wariant indywidualnej podstawy wymiaru, liczony na konkretnej sprawie z zestawu.
- Ustalenie prawa do świadczenia rehabilitacyjnego oraz do zasiłku w wysokości zasiłku
  macierzyńskiego po ustaniu zatrudnienia.
- Wariant z zaświadczeniem "Za życiem", z wydłużonym urlopem rodzicielskim.

Gotowe, gdy wynik zgadza się z zestawem testowym z kroku 1 dla każdej wybranej sprawy.

Zrobione 21.11. Silnik i `POST /api/benefits/simulate` działają. Testy porównują 14 scenariuszy zapisanych
lokalnie w `PRZYKLADY/krok-3-symulacje.json`. Pełną zgodność części scenariuszy nadal trzeba
potwierdzić z ZUS. W materiałach brakuje m.in. dat przyjęcia dzieci do pieczy, pełnych rozliczeń
oraz miesięcznych kwot po PIT potrzebnych do weryfikacji podwyższenia. Jeden skan zawiera różne
daty we wniosku i w adnotacji o wypłacie. Test wykazuje różnicę zamiast dostosowywać regułę do skanu.

Brief, pkt 3 a, b, c, d, e, f, j.

## Krok 4. Wejście i logowanie

Pierwszy ekran decyduje o tym, czy ktoś w ogóle wejdzie w wywiad.

- Dwa wejścia, zalogowanie przez mObywatel oraz ręczne wpisanie danych.
- Symulacja logowania przez mObywatel. Brief wymaga tylko zasymulowania.
- Opcjonalnie jedna lista metod logowania, w której mObywatel jest pierwszą pozycją, a obok stoją
  Profil Zaufany, bankowość i e-dowód. Brief wymaga tylko mObywatela, więc reszta idzie na koniec,
  jeśli zostanie czas.

Gotowe, gdy po kliknięciu widać ekran z danymi z ZUS i przejście dalej.

Zrobione 21.11. Trasa `/wejscie` w `front/src/pages/wejscie-page.tsx` daje dwa wejścia: kartę
z mObywatelem i obok formularz ręcznego wpisania danych. Pod nimi stoi lista pozostałych metod
jako wyłączone pozycje, bo zadanie wymaga tylko mObywatela. Po wejściu którąkolwiek drogą ten sam
ekran pokazuje kartę `Twoje dane`: źródło danych, imię i nazwisko, zamaskowany PESEL, opis sprawy
i status, a obok przycisk `Przejdź dalej` prowadzący do kalkulatora. Ręczne wpisanie idzie przez
`POST /api/auth/manual`, który oddaje ten sam kształt `Citizen` co logowanie i dokłada pole
`source`, więc frontend odróżnia dane z konta od wpisanych z ręki.

Brief, pkt 3, lista symulacji.

## Krok 5. Wywiad i ustalanie uprawnień

Użytkownik odpowiada na kilka pytań i od razu widzi, co mu przysługuje, a czego nie.

- Pytania o rolę, rodzaj umowy, datę porodu, datę ustania stosunku pracy, liczbę dzieci,
  zaświadczenie "Za życiem", planowany powrót do pracy oraz wymiar czasu pracy przy łączeniu
  urlopu z pracą, maksymalnie pół etatu.
- Lista świadczeń obejmująca zasiłek chorobowy w ciąży, świadczenie rehabilitacyjne, zasiłek
  w wysokości zasiłku macierzyńskiego, macierzyński, uzupełniający, rodzicielski i ojcowski,
  każde z wymiarem, kwotą i podstawą prawną.
- Osobny, wyraźny komunikat, gdy prawa nie ma, wraz z wyjaśnieniem przyczyny.

Gotowe, gdy da się przejść wywiad od początku do listy świadczeń bez zaglądania do kodu.

Brief, pkt 3 a, g.

## Krok 6. Kalkulator na ekranie

Jeden zintegrowany kalkulator z wyborem opcji, zgodnie z rekomendacją z briefu.

- Suwaki do podziału urlopu między rodzicami, z widocznymi dziewięcioma nieprzenoszalnymi
  tygodniami.
- Porównanie wariantu 81,5% i 70%, z zaznaczeniem, że dziewięć tygodni nieprzenoszalnych drugiego
  rodzica zawsze liczy się po 70%.
- Tryb łączenia pracy z urlopem, z wydłużeniem do 82 albo 86 tygodni.
- Opcja zaświadczenia "Za życiem" z urlopem rodzicielskim 65 albo 67 tygodni.
- Widoczny wynik liczony na żywo przy każdej zmianie.

Gotowe, gdy każdy wariant z kroku 3 da się ustawić z ekranu.

Brief, pkt 3 b, c, d, e oraz rekomendacja zintegrowanego kalkulatora.

Zrobione 21.11. Ekran `/kalkulator` jest jednym kalkulatorem: wywiad, karta podziału urlopu
i lista świadczeń. Karta pokazuje cały wymiar (41 albo 43 tygodnie, z „Za życiem” 65 albo 67),
pasek z dziewięcioma nieprzenoszalnymi tygodniami każdego rodzica i suwak, który dzieli tylko
wspólną pulę. Po każdej zmianie wynik idzie do `POST /benefits/simulate`, więc kwoty obojga
rodziców, porównanie 81,5% i 70% oraz różnica między wariantami liczą się na backendzie, a front
nie powtarza reguł. Do podziału potrzebne są dane drugiego rodzica, więc formularz ma dla niego
osobną kartę; bez niej suwak zostaje wyłączony, a karta mówi, czego brakuje. Przy łączeniu pracy
z urlopem karta pokazuje wydłużenie i limit 82 albo 86 tygodni, a przy „Za życiem” 130 albo 134.
Limitu backend nie wymusza: przy 50% pracy na całym wymiarze wydłużenie samo dochodzi do 82
tygodni, więc karta podaje go jako ograniczenie ustawowe, a nie jako wyliczoną wartość.

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

### Co jest

- Dla każdego świadczenia okno prowadzi od wyboru świadczenia przez sytuację do dokumentów,
  terminu i adresata. Płatnika wybiera się po liczbie ubezpieczonych.
- Daty terminów liczy `getCalendarEvents` z okresów symulacji. Ten sam zestaw zasila przycisk
  „Dodaj terminy do mojego kalendarza”: plik `.ics` ma nazwę czynności, datę całodniową, link
  do formularza i przypomnienie dzień wcześniej.

## Krok 8. Symulacje ZUS

Wszystko to jest udawane i brief mówi o tym wprost, ale musi być widoczne.

- Dane o ubezpieczeniu albo o jego braku, plus ręczne wprowadzenie danych.
- Stan zadłużenia ze składek na dzień powstania prawa do świadczenia.
- Podgląd zaświadczeń e-ZLA.
- Połączenie z PUE/eZUS, z zapytaniem i wglądem w dane na koncie.
- Wniosek o odpis zupełny albo skrócony aktu urodzenia.
- Przekierowania do ZUS, MRPiPS i PIP.

Gotowe, gdy każdy punkt z listy ma swój ekran albo przycisk, który coś pokazuje.

Zrobione 21.11. Ekran `/zus` zbiera wszystkie symulacje: stan ubezpieczenia z przełącznikiem na brak
ubezpieczenia i ręcznie wpisaną podstawą, zadłużenie ze składek na wybrany dzień, podgląd
zaświadczeń e-ZLA, sesję wglądu w PUE/eZUS z okresami ubezpieczenia, wniosek o odpis aktu urodzenia
oraz przekierowania do ZUS, MRPiPS i PIP. Dane liczy `back/app/services/zus_service.py` i wystawia
je `back/app/api/routes/zus.py`. Testy w `back/tests/test_zus_simulations.py` pilnują kwot, dat i
pustych wariantów.

Brief, pkt 3, lista symulacji.

## Krok 9. Ryzyka i ostrzeżenia

Punkt h jest wart tyle samo co reszta treści, a łatwo go pominąć.

- Ostrzeżenie o pozorności umowy zawartej tylko po to, żeby wejść do ubezpieczenia chorobowego.
- Ostrzeżenie o podwyższeniu podstawy wymiaru w ciąży, które ZUS może zakwestionować.
- Ostrzeżenie o utracie ubezpieczenia przed porodem, na przykład po rozwiązaniu umowy.
- Przy każdym ostrzeżeniu krótka informacja, co to zmieni w kwocie użytkownika.

Gotowe, gdy ostrzeżenia pojawiają się dopasowane do wpisanej sytuacji, a nie wszystkie naraz.

Zrobione 21.11. W kroku „Zatrudnienie i ubezpieczenie” kalkulator zbiera opcjonalne informacje o
nowej umowie o pracę i podwyżce w ciąży. Sekcja „Co może zmienić wypłatę” w wynikach pokazuje tylko
ostrzeżenia wynikające z odpowiedzi i uwzględnia ochronę prawa do zasiłku po ustaniu zatrudnienia.

Brief, pkt 3 h.

## Krok 10. Trudne sytuacje i wsparcie

Ścieżka dla śmierci dziecka, wcześniaka, poronienia i ciężkiej choroby. Ma być spokojna
i oddzielona od kalkulatora.

- Uzupełniający urlop macierzyński z sześcioma przypadkami z kroku 0.
- Osiem tygodni zasiłku po martwym urodzeniu, z zastrzeżeniem siedmiu dni od zgonu.
- Lista fundacji i stowarzyszeń udzielających wsparcia w tych sytuacjach.

Gotowe, gdy ścieżka istnieje i prowadzi do konkretnych organizacji.

Zrobione 21.11. Podstrona `/wsparcie` prowadzi do osobnych poradników po poronieniu lub martwym
urodzeniu, po śmierci dziecka, przy wcześniactwie lub hospitalizacji oraz przy ciężkiej chorobie.
Poradniki linkują do organizacji, dokumentów ZUS i zasad gov.pl, pokazują regułę 8 tygodni i 7 dni
oraz sześć przypadków uzupełniającego urlopu macierzyńskiego.

Brief, pkt 3 i oraz pkt 3 a.

## Krok 11. Panel administracyjny

Zmiana parametru nie może wymagać wdrożenia, bo brief wprost tego oczekuje.

- Stopa procentowa zasiłku macierzyńskiego.
- Maksymalne wymiary urlopów.
- Dodawanie i wyłączanie funkcji.

Gotowe, gdy zmiana parametru w panelu zmienia wynik kalkulatora bez ruszania kodu.

Zrobione 21.11. Ekran `/panel` zmienia stopy procentowe (macierzyński, wniosek w 21 dni,
rodzicielski) i wymiary urlopów w tygodniach: macierzyński dla 1 do 5 dzieci, rodzicielski przy
jednym i przy większej liczbie dzieci, dodatek „Za życiem” i tygodnie nieprzenoszalne. Pod nimi
stoi lista funkcji z przełącznikami, dodawaniem nowej pozycji i usuwaniem. Zapis idzie przez
`PUT /api/admin/settings` do `back/data/admin-settings.json`, a `POST /api/admin/settings/reset`
przywraca wartości domyślne. Każde przeliczenie czyta ten plik, więc zmiana stopy rodzicielskiego
z 70 na 50% obniża kwotę w kalkulatorze bez wdrożenia; panel pokazuje podgląd wyniku po zapisie.
`GET /api/settings` wystawia ten sam zestaw frontowi: karta podziału urlopu bierze z niego stopy
i tygodnie do opisów, a wyłączona funkcja chowa link do symulacji ZUS, kartę podziału urlopu albo
sekcję ostrzeżeń. Testy w `back/tests/test_admin_settings.py` pilnują walidacji, zapisu, resetu,
uszkodzonego pliku i wpływu parametrów na wynik.

Wejście na `/panel` prowadzi przez logowanie: bez sesji zamiast formularza stoi wezwanie do
mObywatela, a po zalogowaniu wraca na panel. W produkcji doszłaby jeszcze rola administratora.

Brief, pkt 3, ostatni akapit.

## Krok 12. Wygląd i responsywność

Pełne RWD jest wymagane, a kompletność i UX to 25% oceny.

- Ustawić wygląd pod ZUS, spokojny i czytelny, z dużą czcionką.
- Sprawdzić układ na telefonie, tablecie i komputerze.
- Upewnić się, że pierwszy ekran da się obsłużyć kciukiem.

Gotowe, gdy żaden ekran nie rozpada się na wąskim widoku.

Zrobione 21.11. Przeszedłem wszystkie trasy, także panel, wsparcie i ekran 404, na szerokościach
320, 360, 390, 768, 1024, 1280, 1440 i 1920 pikseli. Żaden ekran nie przewija się w poziomie,
tekst nie schodzi poniżej 12 px, a podstawowy tekst ma 16–18 px. Przyciski pierwszego ekranu mają
44 px wysokości, pozycje rozwiniętego menu 43 px. Z tego przejścia zostały poprawki dotyku: ikony
„i” mają 24 px zamiast 20, przełączniki w symulacji ZUS 40 px na telefonie, logo w nagłówku i linki
w stopce dostały wyższy obszar dotyku, a podwójny przycisk logowania zniknął z rozwiniętego menu
na szerokich ekranach. Dialog „Dokumenty i terminy” mieści się na 390 px bez wewnętrznego
przewijania, a karta podziału urlopu i karty świadczeń układają się w jedną kolumnę od 1024 px
w dół.

Brief, pkt 4 i pkt 5.

## Krok 13. Testy na sprawach i upload wniosków

Jury weźmie niektóre wnioski i sprawdzi wyliczenia, więc strona musi umieć je przyjąć.

- Upload dokumentu z ZUS na stronie.
- Weryfikacja, czy osoba z wniosku podlega ubezpieczeniu.
- Sprawdzenie kalkulatora na tej samej sprawie.
- Testy automatyczne w `back/tests/` dla reguł z kroku 0.

Gotowe, gdy wybrana sprawa z `PRZYKLADY/` przechodzi przez stronę i daje wynik z decyzji.

Brief, pkt 4 oraz pkt 6.

### Co jest

- `GET /api/cases` zwraca dziesięć spraw, `GET /api/cases/{id}` liczy wybraną, a
  `POST /api/cases/simulate` przyjmuje wniosek wgrany z pliku. `GET /api/cases/{id}/application`
  daje ten sam wniosek do pobrania, żeby można go było poprawić i wgrać z powrotem.
- `GET /api/samples` daje 87 zestawów z `PRZYKLADY/`, `POST /api/samples/recognize` dopasowuje
  SHA-256 wgranego pliku, a `GET /api/samples/{id}` zwraca rozpoznaną sprawę. Odcisk liczy
  przeglądarka (`front/src/lib/sha256.ts`), więc PDF zostaje na urządzeniu, a do API idzie
  wyłącznie skrót.
- Dane rozpoznawcze leżą w `back/app/data/zus-samples.json` i powstają skryptem
  `back/scripts/build_zus_samples.py`: odcisk pliku, wzory formularzy, rodzaj świadczeń, wynik
  z okładki zestawu i opis stanu faktycznego. Treści skanów nie kopiujemy. Opis nie dopisuje
  zdania o wyniku, gdy decyzji w dokumencie nie ma, bo wystarczy plakietka przy tytule.
- Sprawy leżą w `back/app/data/demo-cases.json` i jadą z kodem. Regulamin nie pozwala
  rozpowszechniać skanów ZUS, więc dane są wymyślone.
- Strona `/sprawy` ma jedno wgranie dokumentu, PDF z ZUS albo z PUE. Rozpoznanie idzie po
  odcisku pliku i nic o sobie nie melduje, a po trafieniu na wierzchu widać tytuł pisma, nazwę
  pliku, plakietkę z wynikiem i wzory formularzy. Obok wgrania stoi lista rozpoznanych dokumentów,
  bo brief w pkt 6 mówi „uploadu/wyboru wybranych wniosków”: wybór z listy daje ten sam ekran i tę
  samą drogę liczenia, a nie wymaga pliku pod ręką. Niżej, pod kreską, krótki formularz przyjmuje
  datę i podstawę wymiaru, których skan nie podaje, i wtedy kalkulator liczy świadczenie główne
  oraz porównuje status z rozpoznaną sprawą. Wynik to jedna sekcja cięta kreskami, nie stos kart:
  weryfikacja ubezpieczenia, porównanie z decyzją, wyliczenie. Gdy w dokumencie nie ma decyzji,
  nie ma też porównania ani ostrzeżenia o nadmiarowych pozycjach, bo nie ma z czym porównywać.
- Lista spraw demonstracyjnych, wgrywanie pliku JSON i sekcja „Zestaw przykładowy ZUS” zniknęły
  z ekranu, żeby strona czytała się jak zwykły produkt, w którym wgrywa się jeden dokument.
  `GET /api/cases` i `POST /api/cases/simulate` zostają dla testów, ale UI ich nie pokazuje.
- Nieznany plik dostaje komunikat, że go nie rozpoznaliśmy, i wskaźnik na formularz kalkulatora.
  Rozpoznanie nie udaje odczytu treści: 87 dokumentów to skany bez warstwy tekstowej, z zamazanymi
  danymi osobowymi i pismem odręcznym.
- `back/tests/test_rules.py` mapuje wszystkie 85 identyfikatorów z `RULES.md` na scenariusz
  albo na wpis „poza silnikiem” z powodem. Nowa reguła w `RULES.md` bez wpisu wywala test.
- `back/tests/test_cases.py` przechodzi każdą sprawę przez endpoint i sprawdza zgodność.
  Gdy kalkulator zwróci kilka części jednego świadczenia, porównanie sumuje je do wiersza
  decyzji. Pozycja policzona, ale nieobecna w decyzji, trafia do `unexpected` i psuje zgodność,
  zamiast zniknąć.
- `back/tests/test_zus_samples.py` sprawdza, że lista ma 87 spraw, każdy odcisk jest poprawny,
  rozpoznanie trafia we właściwą sprawę, obcy plik dostaje komunikat, a powtórka zestawu jest
  oznaczona jako `duplicate_of`.

### Stan testu na sprawach

- Dziesięć spraw z zestawu: 10/10 zgodnych, kwoty i statusy co do grosza.
- 371 testów backendu przechodzi, 30 jest pominiętych (16 reguł poza silnikiem, 14 porównań z
  lokalnym zestawem ZUS).
- Rozpoznanie zestawu przykładowego: 87/87 spraw, 71 ma wynik odczytany z materiału (56
  przyznanych, 15 odmów), 16 nie ma zapisanego wyniku na żadnej czytelnej stronie. Wzory
  formularzy rozpoznane w 86 zestawach, cytat z decyzji w 10.
- Pełny przebieg na `PRZYKLADY/` jest częściowy. 87 PDF-ów to zdjęcia formularzy i decyzji: brak
  warstwy tekstowej, pismo odręczne, dane zaczernione. `pdftotext` nic nie daje, a OCR czyta
  nagłówki i okładkę zestawu, nie kwoty. Dlatego rozpoznajemy komplet 87 spraw, ale kwot
  i okresów nie odczytujemy ze skanu — wpisuje je użytkownik, a kalkulator liczy od nich.
- Sprawy demonstracyjne mają oczekiwania wyliczone tym samym silnikiem, więc dowodzą spięcia
  strony z kalkulatorem i powtarzalności, a nie zgodności z decyzją ZUS. Poprawność reguł
  opiera się na `test_rules.py`.

### Luki, które ujawniła mapa reguł

- C4: brak limitu 91 dni po ustaniu ubezpieczenia.
- C1: silnik zna tylko niezdolność w ciąży (100%), wariantu 80% nie ma.
- G9, G10: górne granice wydłużenia (82/86 i 130/134 tygodni) nie są pilnowane.
- G7, H3, F9: terminy składania wniosków (21 i 7 dni) nie są sprawdzane.
- F7: części urlopu przy przyjęciu dziecka liczą się wspólnym limitem pięciu, bez rozróżnienia.
- Sekcja L: podstawa wymiaru przychodzi z formularza, więc L1, L2, L4, L5, L7, L8, L11 i L13 są
  poza silnikiem. Z sekcji L działa przeliczenie stałego wynagrodzenia (13,71%), limit po ustaniu
  ubezpieczenia, a L9 pilnuje progu minimalnego wynagrodzenia.

Dwie luki z tej listy zamknęły się w trakcie prac. F8 liczy szpital po przyjęciu starszego dziecka,
a G6 ma test na granicy terminu: dziecko z 2019 dostaje urlop jeszcze na 31 grudnia 2025, a nie na
1 stycznia 2026. Wpis o terminie „o rok dłużej niż przepis” był błędny, bo 1 stycznia roku, w którym
dziecko kończy 7 lat, jest wyłącznym krańcem, czyli dniem po 31 grudnia roku, w którym kończy 6 lat.

Krok zostaje nieodhaczony, bo kryterium mówi o sprawie z `PRZYKLADY/`.

## Krok 14. Asystent z AI

Zakres jest wąski i taki ma zostać. Model tylko kieruje, nic nie liczy i nie dotyka danych.
Szerszy pomysł, czyli odczyt wniosków i wywiad prowadzony rozmową, odpadł, bo wymagałby
wysyłania materiałów ZUS na zewnątrz, a brief tego zabrania.

- Asystent nawigacyjny. Po pytaniu użytkownika wskazuje właściwą podstronę serwisu albo odsyła
  do ZUS, MRPiPS lub PIP.
- Nie podaje kwot, tygodni ani terminów. Mówi, gdzie to sprawdzić, i daje link.
- Nie przetwarza danych osobowych i nie czyta materiałów ZUS. Rozmowa dotyczy tylko tego, czego
  użytkownik szuka.
- Działa bez klucza API. Tryb demo z gotowymi odpowiedziami na najczęstsze pytania, żeby juror
  mógł kliknąć i zobaczyć działanie.
- Zwykła nawigacja zostaje. Asystent to skrót dla kogoś, kto nie wie, od czego zacząć, a nie
  jedyna droga.
- Asystent załatwia też przekierowania do zus.pl, gov.pl/web/rodzina i pip.gov.pl, których brief
  wymaga osobno.
- W opisie projektu napisać, że to nawigacja, a nie doradca prawny. Kwoty liczy silnik reguł.

Gotowe, gdy asystent działa bez klucza, prowadzi do właściwej podstrony i żadna jego odpowiedź
nie zawiera wyliczonej kwoty.

Brief, pkt 4, pkt 9 oraz lista symulacji w pkt 3.

Zrobione 21.11. Asystent stoi na `GET /api/assistant/topics` i `POST /api/assistant/ask`, a na stronie
działa jako panel w prawym dolnym rogu.

### Co jest

- Katalog dwudziestu dziewięciu tematów w `back/app/services/assistant_service.py`. Każdy ma
  gotowe pytanie, odpowiedź nawigacyjną i linki, czyli podstronę serwisu albo stronę ZUS,
  ministerstwa rodziny i PIP. Osobne tematy mają "czym jest ZUS?", "ile płacę składek", wymiar
  urlopu, podstawa wymiaru, wcześniak, zasiłek chorobowy w ciąży, ochrona pracy w ciąży, bliźnięta,
  świadczenia spoza ZUS i zasiłek opiekuńczy. Bez nich te pytania kończyły się ogólnikiem,
  listą instytucji albo odpowiedzią o czymś innym.
- Dopasowanie jest deterministyczne i działa bez klucza API. Pytanie jest normalizowane (małe
  litery, bez ogonków), a temat wygrywa na frazach i rdzeniach słów, więc "łączyć pracę" i
  "laczyc prace" trafiają w to samo. Pytanie spoza katalogu dostaje wprost powiedziane, że nie
  jest zgadywane, plus cztery adresy: naszą listę świadczeń i trzy oficjalne źródła, czyli ZUS,
  ministerstwo rodziny i inspekcję pracy.
- Rozmowa ma kontekst. Przeglądarka dołącza do każdego pytania cztery poprzednie razem z tematami,
  które asystent wtedy wskazał, więc "a co z dokumentami?" odpowiada o dokumentach, a nie od nowa
  o wniosku. Kontekst rozstrzyga tylko wtedy, gdy samo pytanie ma jeden słaby trop, i nigdy nie
  przenosi na temat, na który pytanie nie wskazuje. Serwer historii nie zapisuje, wszystko jest
  w pamięci karty.
- Pod każdą odpowiedzią stoją trzy następne pytania do kliknięcia. Najpierw te bliskie pytaniu,
  potem te, które prowadzą do tej samej strony co wybrany temat, więc pod "czym jest ZUS?" są
  sprawa w ZUS, zaległości i zwolnienie lekarskie.
- Asystent siedzi w prawym dolnym rogu jako przycisk, nie jako osobna podstrona. Po chwili
  pokazuje się raz na sesję zaproszenie ("Masz pytanie? Napisz..."), a kliknięcie otwiera panel
  z rozmową, podpowiedziami i kartami linków. Escape i krzyżyk zamykają panel.
- Panel jest zamontowany w `RootLayout`, więc działa na każdej podstronie serwisu. Na ekranie
  logowania mObywatela go nie ma, bo ten ekran ma własny układ. Nagłówek i stopka zostają bez
  zmian, więc zwykła nawigacja jest nietknięta.
- Asystent nie podaje kwot, tygodni ani terminów. `back/tests/test_assistant.py` sprawdza, że
  w żadnej odpowiedzi, pytaniu ani etykiecie linku nie ma cyfry, oraz że każda podstrona, do której
  odsyła, ma trasę w `front/src/App.tsx`.
- Z kluczem `ASSISTANT_API_KEY` model językowy (`deepseek/deepseek-v4.1-flash` przez OpenRouter)
  wybiera tylko temat z katalogu i nic więcej nie pisze. Zdanie, linki i następne pytania zawsze
  pochodzą z katalogu. Wcześniej model układał własne zdanie i wymyślał nieistniejące sekcje
  ("sekcja Uprawnienia"), a po zaostrzeniu filtrów odpisywał ogólnikiem. Skoro treść bierze się
  z katalogu, nie ma czego halucynować, a odpowiedź i tak jest konkretna. Wybór modelu jest
  sprawdzany z dopasowaniem: jeśli pytanie nie daje wskazanemu tematowi żadnego oparcia, a inny
  temat pasuje mocno, asystent wraca do katalogu. Bez tego pytanie o zwolnienie z pracy w ciąży
  dostawało odpowiedź o stracie dziecka. Gdy model wskaże temat, którego nie ma, nie odpowie
  w dwanaście sekund albo dostawca padnie, też odpowiada dopasowanie deterministyczne.
- Do modelu idzie wyłącznie treść pytania, poprzednie pytania z rozmowy i lista tematów.
  Nie wysyłamy danych osobowych ani materiałów ZUS. Bez klucza nic nie wychodzi poza serwer
  i cała aplikacja działa offline. Panel mówi wprost, że wskazuje stronę, a nie podaje kwot
  ani terminów, bo te liczy kalkulator.

## Krok 15. Materiały do oddania

To jest to, co juror faktycznie zobaczy.

- Szczegółowy opis i tytuł projektu.
- Prezentacja, maksymalnie 10 slajdów.
- Film do 3 minut w otwartym repozytorium, pokazujący projekt w użyciu.
- Repozytorium kodu, zrzuty ekranu i link do działającej demonstracji.
- Materiały graficzne.

Gotowe, gdy wszystkie pięć pozycji istnieje i linki działają.

Brief, pkt 4.

Zrobione 22.11. Prezentacja leży w `prezentacja/index.html`: dziesięć plansz w proporcji 16:9, jedna
rodzina pisma i paleta serwisu, strzałki zmieniają planszę, a `Ctrl+P` zapisuje PDF. Każda plansza
niesie jeden zrzut ekranu, w ramce przeglądarki albo w ramce telefonu, więc prezentacja broni się
także wtedy, gdy juror czyta sam plik. Kod QR do `https://skrzydla-rodzica.vercel.app` jest na
okładce i na ostatniej planszy, a film pokazuje ten sam kod dwa razy, na pierwszej i na ostatniej
planszy. Obok HTML-a leży gotowy `prezentacja/Skrzydla-Rodzica-prezentacja.pdf`, dziesięć stron
16:9, składany skryptem `prezentacja/do-pdf.mjs`.

Film leży w `video/out/prezentacja.mp4`, poniżej trzech minut, 1920×1080, z komentarzem lektora
i napisami. Powstaje ze skryptów w `video/scripts/`, montaż opisuje `video/src/edl.ts`, a szczegóły
są w `video/README.md`. Ujęcia to nagrania działającej aplikacji: wejście i logowanie, wywiad,
wynik, karta uprawnień, kreator wniosków i dokumentów, planowanie, urlop w trakcie, odwołanie,
wsparcie, panel, asystent i widok telefonu. Listy wyboru otwierają się na ekranie, więc widać
opcje, a nie tylko wybraną wartość. `video/scripts/narracja.mjs` kładzie każde zdanie lektora na
początku sceny, którą opisuje, i zapisuje ten sam zestaw do `out/napisy.srt`. Plansza z adresem
demo i kodem QR otwiera film i go zamyka.

Zrzuty ekranu leżą w `zrzuty/`. Powstają skryptem `video/scripts/shots.mjs` z tej samej działającej
aplikacji, tylko bez kursora i nagrywania, więc odtwarzają się jedną komendą. Pięć kadrów z tych
zrzutów, przyciętych do jednego elementu, wchodzi do plansz prezentacji.

Opis i tytuł projektu to `README.md`, a rozwiązania zewnętrzne zbiera `CREDITS.md` i dziewiąta
plansza prezentacji.

## Krok 16. Weryfikacja przed oddaniem

Ostatnie przejście po wymaganiach, żeby nic nie wypadło.

- Przejść listę a do j z pkt 3 i odhaczyć każdą literę.
- Przejść listę symulacji z pkt 3 i odhaczyć każdą pozycję.
- Sprawdzić `pytest` w `back/` oraz `npm run build` i `npm run lint` w `front/`.
- Sprawdzić, że `git status` nie łapie niczego z `OPIS/` ani `PRZYKLADY/`.
- Otworzyć demo na telefonie i przejść ścieżkę od wejścia do wyniku.

Gotowe, gdy cała lista jest odhaczona bez wyjątków.

Brief, pkt 3, 4, 5, 6.

Zrobione 22.11. Litery a do j z pkt 3 mają swoje kroki w tabeli „Mapa wymagań na kroki" niżej,
a każda pozycja z listy symulacji ma ekran: logowanie przez mObywatela, dane o ubezpieczeniu
i wpisanie własnych, zadłużenie ze składek, podgląd e-ZLA, konto PUE/eZUS, wniosek o odpis aktu
urodzenia, kreator wniosków urlopowych, wsparcie i przekierowania do ZUS, MRPiPS i PIP.

`back/`: 371 testów przechodzi, 30 pominiętych z wypisanym powodem. `front/`: `npm run build`
i `npm run lint` czyste. `git status` nie łapie niczego z `OPIS/` ani `PRZYKLADY/`, a żaden plik
z tych katalogów nie trafił nigdy do historii repozytorium. Demo na telefonie przechodzi ścieżkę
od wejścia do wyniku; dowodem jest ujęcie `15-mobile-karta` w filmie i zrzut `15-mobile-start`.

Film i prezentacja niosą ten sam kod QR do `https://skrzydla-rodzica.vercel.app`, a kod odczytuje
się z gotowego pliku MP4. W filmie występuje na obu końcach, w prezentacji na okładce i na ostatniej
planszy.

## Krok 17. Karta uprawnień, kreator wniosków i dostępność

Trzy rzeczy, które zamieniają wynik na ekranie w dokument, który da się zabrać ze sobą, oraz
ustawienia, bez których część ludzi w ogóle nie skorzysta z serwisu.

- Karta uprawnień: jedna strona na A4 i na telefon, z sytuacją w pięciu liniach, świadczeniami,
  terminami i adresatem każdego wniosku.
- Kreator wniosku urlopowego: lista wniosków wynikających z sytuacji, pismo gotowe do podpisu,
  sprawdzenie przed wysłaniem i karta jako druga strona tego samego wydruku.
- Panel dostępności: wysoki kontrast, trzy rozmiary tekstu, czytanie na głos
  i ograniczenie animacji.

Gotowe, gdy kartę i wniosek da się wydrukować na jednej stronie A4, a ustawienia dostępności
działają i pamiętają się w przeglądarce.

Zrobione 22.11. Przycisk „Pobierz kartę uprawnień" pod listą świadczeń prowadzi na `/karta`. Karta
powstaje w `front/src/lib/entitlement-card.ts` z odpowiedzi, ocen i okresów symulacji, jedzie na
trasę przez `sessionStorage`, więc nic nie zostaje na serwerze, i mówi wprost, czy liczy się
z przewidywanej daty porodu, czy z danych po porodzie. Kwota miesięczna jest przeliczona z sumy
i liczby dni, z dopiskiem, że to przybliżenie, bo inaczej karta obiecywałaby precyzję, której nie ma.

Ekran `/wnioski` bierze ten sam stan sprawy i pokazuje tylko wnioski, które wynikają z odpowiedzi:
macierzyński, rodzicielski, ojcowski, uzupełniający, przejęcie urlopu przez ojca i łączenie urlopu
z pracą. Przy każdym jest jedno zdanie o tym, co załatwia, kiedy go złożyć i co się stanie po
terminie. Użytkownik uzupełnia tylko to, czego nie ma w formularzu: imię, adres i pracodawcę.
Sprawdzenie przed wysłaniem porównuje datę z okresem z symulacji, liczbę dni z policzonym wymiarem
i pilnuje, żeby nie zabrać drugiemu rodzicowi jego nieprzenoszalnych tygodni. Pismo wygląda jak
pismo: miejscowość i data, adresat, treść, załączniki i miejsce na podpis. Po pobraniu serwis
proponuje kartę uprawnień jako drugą stronę tego samego wydruku.

Panel dostępności siedzi w nagłówku obok logowania. Wysoki kontrast, nie tryb ciemny: mocniejsze
obramowania i ciemniejszy tekst pomocniczy naprawiają czytanie, a nie tylko zmieniają kolory na
zrzucie. Rozmiar tekstu podnosi bazowy rozmiar całej strony, bo układ stoi na rem. Czytanie na głos
korzysta z syntezatora przeglądarki i podświetla czytany fragment, a gdy urządzenie nie ma polskiego
lektora, mówi o tym wprost. Wybory zapisują się w `localStorage` i wchodzą na `<html>` przed
pierwszym malowaniem.

Link „Panel" doszedł do nawigacji głównej, a pełną nazwę nosi podpowiedź i stopka. Na wydruku
chowamy nagłówek, stopkę i dymek asystenta znacznikiem `data-print-hide`, a bazowy rozmiar strony
schodzi do 11,5 px, żeby karta zmieściła się na jednej kartce A4.

Brief, pkt 3 g oraz pkt 4.

## Krok 18. Oś czasu, wyjaśnienia liczb i ścieżki po fakcie

Cztery moduły, które odpowiadają na pytania zadawane w środku sprawy, a nie tylko przed nią.

- Oś czasu tygodni: macierzyński i rodzicielski na jednej taśmie, ze znacznikiem „dziś” i porodem,
  z nieprzenoszalnymi tygodniami wyróżnionymi i porównaniem wariantów podziału.
- Panel „dlaczego tak” przy każdej kwocie i każdym wymiarze: rozbicie na części, reguła wymiaru,
  kontrprzykłady i podstawa prawna; wariant dla braku uprawnień z drogą wyjścia.
- Tryb planowania dla ludzi, którzy dopiero myślą o dziecku, i tryb „jestem w trakcie urlopu”.
- Ścieżka po decyzji odmownej: diagnoza sporu, terminarz od doręczenia i projekt odwołania.
- Słownik pojęć w dymkach: jedno źródło tekstu dla całego serwisu.

Gotowe, gdy każdy z tych ekranów da się przejść bez zaglądania do aktów prawnych, a liczby mają
widoczne uzasadnienie.

Zrobione 22.11. Oś czasu liczy `front/src/lib/week-timeline.ts` z okresów symulacji i z puli urlopu:
pasma dla obojga rodziców, znaczniki „dziś”, porodu i terminów, a przy nieprzewidzianej dacie porodu
plakietka „szacunkowe”. W kalkulatorze jest jeden plan, ten ustawiony suwakiem; porównanie wariantów
zostało w trybie „jestem w trakcie urlopu”, gdzie pytanie „złożyć teraz czy poczekać” jest treścią
ekranu, a nie ozdobą wyniku. Taśmy i tak stoją na wspólnej podziałce, bo różne skale nie dałyby się
zestawić wzrokiem. Na telefonie taśma obraca się w pion: ten sam plan czytany jako lista tygodni
z datami i kwotami.

Panel „dlaczego tak” (`front/src/lib/why-panel.ts`) rozbija kwotę na podstawę wymiaru, stawkę,
wymiar i kwotę dzienną, podaje regułę wymiaru zdaniem, dokłada kontrprzykłady z tej samej sytuacji
i linkuje podstawę prawną. Przy braku uprawnień pokazuje, który warunek nie został spełniony i co go
spełni. Nie ocenia szans: procentów „szans na wygraną” nie ma tu nigdzie.

Tryb planowania pyta o teraźniejszość i składa listę przygotowań podzieloną na „teraz”, „przed
ciążą” i „w ciąży”. Nie liczy kwot ani tygodni, a pozycje, których nie potwierdzają materiały ZUS,
dostają znacznik „do potwierdzenia w ZUS” bez liczby. Tryb „jestem w trakcie urlopu” daje status
jednym zdaniem, najbliższe decyzje z datami i symulację „jeśli złożę teraz” obok „jeśli poczekam”.
Stan trybu urlopu zapisuje się w przeglądarce, więc kolejna wizyta pokazuje status bez ponownego
wypełniania formularza.
Gdy termin na 81,5% minął, oba warianty liczą się po realnych stawkach, a nie po tej, do której nie
ma już prawa.

Ekran `/odwolanie` prowadzi od czterech pytań o decyzję przez diagnozę sporu i listę dokumentów do
projektu pisma. Termin liczy się jako miesiąc od doręczenia, a nie trzydzieści dni, i po jego
minięciu ekran pokazuje drugą drogę: wniosek o zmianę decyzji przy nowych dowodach. Terminy sądowe
i opłaty mają znacznik „do potwierdzenia”, bo ich nie zgadujemy. Wejście jest dwa: link w nawigacji
i pytanie „masz już decyzję odmowną?” pod wynikiem bez uprawnień.

Słownik (`front/src/lib/glossary.ts`) trzyma czternaście pojęć w jednym miejscu. Kropkowane słowa
w tekstach otwierają definicję przez ten sam mechanizm dymków co reszta serwisu, a lista na
`/dokumenty` pokazuje pojęcie i definicję obok siebie, więc nie potrzebuje najechania ani dymka.
Definicja nie używa innych niezdefiniowanych pojęć i nie zawiera liczb.

Moduły a) do j) z briefu zostają nietknięte; tryb planowania domyka zdanie o braku weryfikacji przed
porodem, a ścieżka po decyzji odmownej obsługuje literę h) w najostrzejszej wersji: nie „uważaj,
możesz stracić prawo”, a „straciłeś i da się to jeszcze naprawić”.

Brief, pkt 3 oraz pkt 4.

### Domknięcie luk po audycie (22.11)

Po przejściu modułów punkt po punkcie z opisem dopisaliśmy to, co zostało na potem. Lista dokumentów
na karcie ma teraz znaczniki ☑/☐: użytkownik odhacza to, co już ma, stan zostaje w przeglądarce,
a wydruk pokazuje te same znaczniki (`front/src/lib/card-documents.ts`). Oś czasu dosłała trzeci
wariant — łączenie urlopu z pracą w połowie wymiaru, liczony osobną symulacją — a przy przewidywanej
dacie porodu podpisy dat pokazują widełki. Kreator wniosku sprawdza trzeci warunek: czy wniosek nie
odbiera drugiemu rodzicowi jego nieprzenoszalnych tygodni. Panel „dlaczego tak” dostał dopisek
o podniesieniu kwoty do świadczenia rodzicielskiego, a karta pokazuje różnicę, gdy płatnik ją wypłaca.

Doszły dwa zdarzenia, których wcześniej nie było. Urodzenie martwe i zgon dziecka mają własne pytanie
w kroku „Dane dzieci” (krok pokazuje się teraz także matce i ojcu, nie tylko przy adopcji i pobycie
w szpitalu), a z daty zgonu liczą się dwa terminy: zgłoszenie do ZUS w ciągu siedmiu dni i osiem
tygodni zasiłku macierzyńskiego. Model danych przyjmuje `stillborn` i `death_date` bez zmiany backendu.

Prosty język zniknął z panelu dostępności. Trzymanie dwóch wersji każdego zdania nie broniło się
w praktyce: krótsza wersja i tak była pisana ręcznie, więc rozjeżdżała się z resztą treści. Zostały
kontrast, rozmiar tekstu, czytanie na głos i ograniczenie animacji.

Cel dotykowy podniesiony do czterdziestu czterech pikseli (listy wyboru i przełączniki), a lista
słownika pokazuje pełne nazwy pojęć z polskimi znakami, nie surowe klucze.

### Poprawki wyglądu, karty i wyniku (22.11)

Przejście po ekranach po audycie. Trzy kroki „Jak to działa” na stronie głównej dostały nowe zdjęcia
(`front/public/krok-1.webp`, `krok-2.webp`), w tej samej ciepłej tonacji co zdjęcie na pierwszym
ekranie. Licznik kroków formularza mówi czarną czcionką, a nad nim stoją osobne zielone klocki, po jednym
na pytanie. Sekcja świadczeń tłumaczy przy przycisku, co robi kalkulator. Karta uprawnień drukuje się
bez nagłówka i stopki przeglądarki (zerowy margines `@page`, odstęp dopiero na karcie) i bez dziur
w marginesach. Słownik na `/dokumenty` pokazuje definicję obok pojęcia, więc pojęcia nie są już
kropkowane ani najeżdżane.

Przycisk „Wróć do wyniku” wraca do wyniku, a nie do pierwszego pytania.
`front/src/lib/interview-session.ts` zapisuje ostatnie odpowiedzi na czas wizyty, a kalkulator
odtwarza z nich wynik, gdy przychodzi z karty.

Dane z wejścia są wreszcie użyte. Karta uprawnień podpisuje się imieniem i nazwiskiem z sesji
(`front/src/components/entitlement-card.tsx`), więc kto wszedł przez mObywatel albo wpisał dane
ręcznie, nie wpisuje ich drugi raz. Sesja zostaje w pamięci, więc podpis działa w obrębie wizyty,
a po odświeżeniu strony wraca pole do uzupełnienia.

### Druga tura poprawek języka i interfejsu (22.11)

Słowo „wywiad" zniknęło z całego serwisu, w interfejsie i w odpowiedziach asystenta: formularz to
formularz, a wynik to „Wynik sprawdzenia". Ton tekstów poszedł w stronę urzędową — bez „mamy i taty",
bez „zabierz ze sobą", bez zdań, które tłumaczą, jak ma wyglądać typowy plan. `front/src/pages/
swiadczenia-page.tsx` dostał pasek zakładek jako filtr sytuacji, a przycisk „Otwórz kalkulator" stanął
nad nim. Zakładki są własne (`front/src/components/ui/tabs.tsx`, role `tablist`/`tab`/`tabpanel`
i obsługa strzałek), bo `@radix-ui/react-tabs` nie ma w projekcie.

Panel dostępności przestał zamykać się przy kliknięciu w listę rozmiaru tekstu: opcje Radixa renderują
się w portalu poza panelem, więc zamknięcie na `pointerdown` ucinało wybór, zanim zdążył dojść.
Karta uprawnień i pozostałe wydruki stoją teraz na tych samych tokenach co reszta serwisu (`border-border`,
`bg-card`, `rounded-xl`), a lista dokumentów ma zwykły, zielony kwadrat zamiast znaku ☐ z klawiatury.

## Mapa wymagań na kroki

| Wymaganie | Krok |
| --- | --- |
| a. Świadczenia w ciąży, także brak uprawnień | 0, 3, 5 |
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
| Karta uprawnień i terminy w jednym dokumencie | 17 |
| Kreator wniosków urlopowych | 17 |
| Dostępność: kontrast, rozmiar tekstu, lektor | 17 |
| Oś czasu tygodni i porównanie wariantów | 18 |
| Wyjaśnienie każdej liczby: „dlaczego tak” | 18 |
| Tryb planowania przed ciążą | 18 |
| Tryb „jestem w trakcie urlopu” | 18 |
| Ścieżka po decyzji odmownej | 18 |
| Słownik pojęć w dymkach | 18 |
| Materiały graficzne | 15 |
| Stack React i Python, REST | 2, 4 |

## Ryzyka

- Czas. Do niedzieli 11:00 zostaje mało godzin, więc kroki 0 do 3 idą pierwsze, bo bez nich nie ma
  czego pokazywać.
- Zakres. Spraw jest 87, ale jury weźmie tylko niektóre. Nie ma sensu obrabiać wszystkich.
- Materiały ZUS. Nigdy nie wchodzą do gita. Przed każdym `git add -A` patrzymy na `git status`.
- Zgodność z przepisami. Błędna kwota w kalkulatorze kosztuje punkty za związek z wyzwaniem, więc
  wynik musi być sprawdzony na decyzjach z `PRZYKLADY/`.
