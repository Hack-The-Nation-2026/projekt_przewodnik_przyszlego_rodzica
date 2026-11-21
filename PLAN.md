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
- [ ] Krok 14. Funkcje z AI
- [ ] Krok 15. Materiały do oddania
- [ ] Krok 16. Weryfikacja przed oddaniem

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

- Upload albo wybór wniosku z zestawu na stronie.
- Weryfikacja, czy osoba z wniosku podlega ubezpieczeniu.
- Sprawdzenie kalkulatora na tej samej sprawie.
- Testy automatyczne w `back/tests/` dla reguł z kroku 0.

Gotowe, gdy wybrana sprawa z `PRZYKLADY/` przechodzi przez stronę i daje wynik z decyzji.

Brief, pkt 4 oraz pkt 6.

### Co jest

- `GET /api/cases` zwraca dziesięć spraw, `GET /api/cases/{id}` liczy wybraną, a
  `POST /api/cases/simulate` przyjmuje wniosek wgrany z pliku. `GET /api/cases/{id}/application`
  daje ten sam wniosek do pobrania, żeby można go było poprawić i wgrać z powrotem.
- Sprawy leżą w `back/app/data/demo-cases.json` i jadą z kodem. Regulamin nie pozwala
  rozpowszechniać skanów ZUS, więc dane są wymyślone, a strona mówi o tym wprost.
- Strona `/sprawy`: kafle spraw, wgrywanie pliku JSON, weryfikacja ubezpieczenia z podstawą
  prawną, wyliczenie i porównanie z zapisaną decyzją. Wgrany wniosek z błędną decyzją pokazuje
  różnicę na czerwono.
- `back/tests/test_rules.py` mapuje wszystkie 85 identyfikatorów z `RULES.md` na scenariusz
  albo na wpis „poza silnikiem” z powodem. Nowa reguła w `RULES.md` bez wpisu wywala test.
- `back/tests/test_cases.py` przechodzi każdą sprawę przez endpoint i sprawdza zgodność.
  Gdy kalkulator zwróci kilka części jednego świadczenia, porównanie sumuje je do wiersza
  decyzji. Pozycja policzona, ale nieobecna w decyzji, trafia do `unexpected` i psuje zgodność,
  zamiast zniknąć.

### Stan testu na sprawach

- Dziesięć spraw z zestawu: 10/10 zgodnych, kwoty i statusy co do grosza.
- 209 testów backendu przechodzi, 32 są pominięte (18 reguł poza silnikiem, 14 porównań z
  lokalnym zestawem ZUS).
- Pełny przebieg na `PRZYKLADY/` jest zablokowany, nie zaliczony. 87 PDF-ów to zdjęcia formularzy
  i decyzji: brak warstwy tekstowej, pismo odręczne, dane zaczernione. `pdftotext` nic nie daje,
  a próba OCR na wyrenderowanej stronie czyta tylko nagłówek wniosku, więc nie da się z tego
  zrobić wiarygodnego zestawu referencyjnego bez ręcznego przepisania każdej sprawy.
- Sprawy demonstracyjne mają oczekiwania wyliczone tym samym silnikiem, więc dowodzą spięcia
  strony z kalkulatorem i powtarzalności, a nie zgodności z decyzją ZUS. Poprawność reguł
  opiera się na `test_rules.py`.

### Luki, które ujawniła mapa reguł

- F8: szpital po przyjęciu starszego dziecka daje 0 dni, bo okno liczy się od urodzenia.
- C4: brak limitu 91 dni po ustaniu ubezpieczenia.
- C1: silnik zna tylko niezdolność w ciąży (100%), wariantu 80% nie ma.
- G6: termin urlopu rodzicielskiego to 1 stycznia roku, w którym dziecko kończy 7 lat, czyli
  o rok dłużej niż przepis.
- G9, G10: górne granice wydłużenia (82/86 i 130/134 tygodni) nie są pilnowane.
- G7, H3, F9: terminy składania wniosków (21 i 7 dni) nie są sprawdzane.
- F7: części urlopu przy przyjęciu dziecka liczą się wspólnym limitem pięciu, bez rozróżnienia.
- Sekcja L: podstawa wymiaru przychodzi z formularza, więc L1, L2, L4, L5, L7, L8, L9, L13 są
  poza silnikiem. Z sekcji L działa tylko przeliczenie stałego wynagrodzenia (13,71%) i limit
  po ustaniu ubezpieczenia.

Krok zostaje nieodhaczony, bo kryterium mówi o sprawie z `PRZYKLADY/`.

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
| Materiały graficzne | 15 |
| Stack React i Python, REST | 2, 4 |

## Ryzyka

- Czas. Do niedzieli 11:00 zostaje mało godzin, więc kroki 0 do 3 idą pierwsze, bo bez nich nie ma
  czego pokazywać.
- Zakres. Spraw jest 87, ale jury weźmie tylko niektóre. Nie ma sensu obrabiać wszystkich.
- Materiały ZUS. Nigdy nie wchodzą do gita. Przed każdym `git add -A` patrzymy na `git status`.
- Zgodność z przepisami. Błędna kwota w kalkulatorze kosztuje punkty za związek z wyzwaniem, więc
  wynik musi być sprawdzony na decyzjach z `PRZYKLADY/`.
