# Reguły zasiłków

Ten plik to krok 0 z `PLAN.md`. Zamienia przepisy i materiały ZUS na listę reguł, z których
powstanie silnik uprawnień w `back/app/services/`. Każda reguła ma identyfikator, żeby dało się
wskazać ją w kodzie i w teście.

Wiersz jest gotowy do zakodowania, gdy da się go rozstrzygnąć na podstawie liczb i dat, bez
sięgania do treści, której tu nie ma.

## Jak czytać odesłania

- **Przepis** wskazuje artykuł, a gdzie trzeba także ustęp, paragraf albo punkt.
  - `ustawa` to wyciąg z ustawy o świadczeniach pieniężnych z ubezpieczeń społecznych w razie
    choroby i macierzyństwa, czyli ustawa zasiłkowa.
  - `KP` to wyciąg z Kodeksu pracy.
- **Materiał** wskazuje miejsce w materiałach ZUS: pozycję w załączniku z wymiarami
  i wysokościami, stronę Poradnika dla rodziców ZUS 2026 albo jedno i drugie.
- Myślnik w kolumnie Materiał znaczy, że reguła bierze się wprost z przepisu i nie ma jej
  w materiałach ZUS.
- Numer strony to numer strony pliku PDF, licząc od pierwszej. Wydrukowana stopka Poradnika idzie
  o jedną w tył, więc strona 25 pliku ma w stopce numer 24.

Oba wyciągi są skrócone. Jeśli reguła opiera się na artykule, którego w wyciągu nie ma, wiersz ma
to napisane.

## A. Wymagany okres ubezpieczenia

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| A1 | Prawo do zasiłku chorobowego powstaje po 30 dniach nieprzerwanego ubezpieczenia chorobowego przy ubezpieczeniu obowiązkowym, a po 90 dniach przy dobrowolnym. | ustawa art. 4 ust. 1 | - |
| A2 | Do tych okresów wlicza się poprzednie okresy ubezpieczenia, jeśli przerwa nie przekroczyła 30 dni albo była spowodowana urlopem wychowawczym, urlopem bezpłatnym lub służbą wojskową żołnierza niezawodowego. | ustawa art. 4 ust. 2 | - |
| A3 | Od pierwszego dnia ubezpieczenia prawo do zasiłku mają między innymi absolwenci, którzy przystąpili do ubezpieczenia w ciągu 90 dni od ukończenia nauki, i ubezpieczeni z co najmniej 10-letnim wcześniejszym okresem obowiązkowego ubezpieczenia. | ustawa art. 4 ust. 3 | - |

## B. Wynagrodzenie chorobowe wypłacane przez pracodawcę

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| B1 | Za czas niezdolności do pracy z powodu choroby pracownik zachowuje prawo do 80% wynagrodzenia przez łącznie 33 dni w roku kalendarzowym, a po ukończeniu 50. roku życia przez łącznie 14 dni. Limit 14 dni liczy się dla niezdolności przypadającej po roku kalendarzowym, w którym pracownik ukończył 50 lat. | KP art. 92 § 1 pkt 1 i § 5 | załącznik, wiersze "Wynagrodzenie chorobowe (pracownik <50 lat)" i "(pracownik ≥50 lat)", które dzielą wiek w sposób uproszczony; Poradnik s. 24 podaje tylko wymiar dni, stawki nie podaje |
| B2 | W tym samym okresie 33 albo 14 dni pracownik zachowuje prawo do 100% wynagrodzenia, gdy niezdolność jest skutkiem wypadku w drodze do pracy lub z pracy albo choroby przypadającej w czasie ciąży. | KP art. 92 § 1 pkt 2 | - |
| B3 | Wynagrodzenie chorobowe oblicza się według zasad ustalania podstawy wymiaru zasiłku chorobowego. | KP art. 92 § 2 | załącznik, sekcja "Podstawa wymiaru zasiłków" |
| B4 | Wynagrodzenie chorobowe wypłaca pracodawca, a zasiłek chorobowy za okres po tych dniach wypłaca ZUS albo płatnik składek zgłaszający powyżej 20 ubezpieczonych. | KP art. 92 § 1 oraz ustawa art. 61 ust. 1 | załącznik, kolumna "Kto finansuje?" |
| B5 | Za czas niezdolności do pracy wskutek poddania się niezbędnym badaniom lekarskim przewidzianym dla kandydatów na dawców komórek, tkanek i narządów oraz wskutek zabiegu ich pobrania pracownik zachowuje prawo do 100% wynagrodzenia przez łącznie 33 albo 14 dni z punktu B1. | KP art. 92 § 1 pkt 3 | - |

## C. Zasiłek chorobowy

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| C1 | Miesięczny zasiłek chorobowy wynosi 80% podstawy wymiaru. | ustawa art. 11 ust. 1 | - |
| C2 | Miesięczny zasiłek chorobowy wynosi 100% podstawy wymiaru, gdy niezdolność do pracy przypada w okresie ciąży, powstała wskutek badań lub pobrania komórek, tkanek i narządów albo wskutek wypadku w drodze do pracy lub z pracy. | ustawa art. 11 ust. 2 | załącznik, wiersz "Zasiłek chorobowy - ciąża"; Poradnik s. 25 |
| C3 | Zasiłek chorobowy przysługuje nie dłużej niż przez 182 dni, a gdy niezdolność jest spowodowana gruźlicą lub występuje w trakcie ciąży, nie dłużej niż przez 270 dni. | ustawa art. 8 ust. 1 | załącznik, wiersze "Zasiłek chorobowy - ciąża" i "Zasiłek po ustaniu ubezpieczenia - ciąża"; Poradnik s. 25 |
| C4 | Za okres niezdolności przypadający po ustaniu tytułu ubezpieczenia chorobowego zasiłek przysługuje nie dłużej niż przez 91 dni, z wyjątkiem niezdolności z art. 11 ust. 2 pkt 2, czyli badań lub pobrania komórek, tkanek i narządów, niezdolności spowodowanej gruźlicą oraz niezdolności występującej w trakcie ciąży. | ustawa art. 8 ust. 2 | załącznik, wiersz "Zasiłek po ustaniu ubezpieczenia - ciąża" |
| C5 | Do okresu zasiłkowego wlicza się wszystkie okresy nieprzerwanej niezdolności do pracy oraz okresy poprzednich niezdolności, jeśli przerwa między nimi nie przekroczyła 60 dni. Nie wlicza się okresów sprzed przerwy, gdy nowa niezdolność powstaje w ciąży. | ustawa art. 9 ust. 1 i 2 | załącznik, akapit pod tabelą okresu zasiłkowego; Poradnik s. 25 |
| C6 | Zasiłek chorobowy przysługuje za każdy dzień niezdolności do pracy, łącznie z dniami wolnymi od pracy. | ustawa art. 11 ust. 4 | - |
| C7 | Gdy okres jest oznaczony w miesiącach, za miesiąc uważa się 30 dni. | ustawa art. 11 ust. 5 | - |

## D. Urlop i zasiłek macierzyński w wymiarze podstawowym

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| D1 | Urlop macierzyński wynosi 20 tygodni przy urodzeniu jednego dziecka, 31 tygodni przy dwojgu, 33 tygodnie przy trojgu, 35 tygodni przy czworgu i 37 tygodni przy pięciorgu i więcej dzieci z jednego porodu. | KP art. 180 § 1 | załącznik, tabela "Liczba dzieci / Tygodnie"; Poradnik s. 31 |
| D2 | Przed przewidywaną datą porodu pracownica może wykorzystać nie więcej niż 6 tygodni urlopu macierzyńskiego. | KP art. 180 § 2 | Poradnik s. 28 |
| D3 | Po porodzie przysługuje urlop macierzyński niewykorzystany przed porodem, aż do wyczerpania pełnego wymiaru. | KP art. 180 § 3 | - |
| D4 | Po wykorzystaniu co najmniej 14 tygodni urlopu macierzyńskiego po porodzie pracownica może zrezygnować z jego pozostałej części i wrócić do pracy, jeśli resztę wykorzysta ojciec dziecka albo sprawi nad nim osobistą opiekę, przerwawszy działalność zarobkową. | KP art. 180 § 4 i 5 | Poradnik s. 31 |
| D5 | Pracownica z orzeczeniem o niezdolności do samodzielnej egzystencji może zrezygnować z pozostałej części urlopu już po 8 tygodniach po porodzie, a resztę przejmuje ojciec dziecka albo inny członek najbliższej rodziny. | KP art. 180 § 6 i 7 | - |
| D6 | W razie urodzenia martwego dziecka albo zgonu dziecka przed upływem 8 tygodni życia urlop macierzyński wynosi 8 tygodni po porodzie, nie krócej niż 7 dni od dnia zgonu, a przy ciąży mnogiej wymiar zależy od liczby dzieci pozostałych przy życiu. | KP art. 180¹ § 1 | Poradnik s. 34 |
| D7 | W razie zgonu dziecka po upływie 8 tygodni życia pracownica zachowuje prawo do urlopu macierzyńskiego przez 7 dni od dnia zgonu. Przy ciąży mnogiej wymiar zależy od liczby dzieci pozostałych przy życiu, ale nie może być krótszy niż 7 dni od dnia zgonu. | KP art. 180¹ § 2 | Poradnik s. 34 |

## E. Uzupełniający urlop macierzyński

Reguła E1 obejmuje trzy przypadki z załącznika, bo Kodeks pracy łączy je w jednym punkcie.

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| E1 | Przy urodzeniu dziecka przed ukończeniem 28. tygodnia ciąży albo z masą urodzeniową nie większą niż 1000 g przysługuje tydzień uzupełniającego urlopu macierzyńskiego za każdy tydzień pobytu dziecka w szpitalu, do upływu 15. tygodnia po porodzie. | KP art. 180² § 1 pkt 1 | załącznik, przypadki 1, 2 i 3 |
| E2 | Przy urodzeniu po ukończeniu 28. tygodnia i przed ukończeniem 37. tygodnia ciąży z masą urodzeniową większą niż 1000 g przysługuje tydzień za każdy tydzień pobytu w szpitalu, do upływu 8. tygodnia po porodzie. | KP art. 180² § 1 pkt 2 | załącznik, przypadek 4; Poradnik s. 32 |
| E3 | Przy urodzeniu po ukończeniu 37. tygodnia ciąży, gdy pobyt w szpitalu trwał co najmniej 2 kolejne dni i pierwszy z nich przypadł między 5. a 28. dniem po porodzie, przysługuje tydzień za każdy tydzień pobytu w szpitalu od 5. dnia do upływu 8. tygodnia po porodzie. | KP art. 180² § 1 pkt 3 | załącznik, przypadek 5; Poradnik s. 32 |
| E4 | Przy urodzeniu więcej niż jednego dziecka wymiar ustala się według najniższej masy urodzeniowej i najdłuższego pobytu w szpitalu. | KP art. 180² § 2 | załącznik, przypadek 6 |
| E5 | Okresy pobytu dziecka w szpitalu sumuje się, a niepełny tydzień zaokrągla w górę do pełnego tygodnia. | KP art. 180² § 3 | załącznik, akapit pod tabelą; Poradnik s. 32 |
| E6 | Urlopu udziela się bezpośrednio po urlopie macierzyńskim, jednorazowo, na wniosek złożony nie później niż 21 dni przed zakończeniem urlopu macierzyńskiego, z zaświadczeniem szpitala o okresie pobytu dziecka oraz o tygodniu ciąży, w którym nastąpiło urodzenie, albo o masie urodzeniowej. | KP art. 180² § 4 i 5 | Poradnik s. 32 |
| E7 | Górna granica wymiaru to 15 tygodni i wynika z trzech przypadków z punktu E1, bo pozostałe kończą się na 8. tygodniu po porodzie. | KP art. 180² § 1 | załącznik, wiersz "Uzupełniający urlop macierzyński" w tabeli wysokości |

## F. Urlop na warunkach urlopu macierzyńskiego

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| F1 | Pracownik, który przyjął dziecko na wychowanie jako rodzina zastępcza, z wyjątkiem rodziny zastępczej zawodowej, ma prawo do urlopu na warunkach urlopu macierzyńskiego w wymiarze 20, 31, 33, 35 albo 37 tygodni, zależnie od liczby dzieci przyjętych jednocześnie. Ten sam wymiar przysługuje pracownikowi, który wystąpił do sądu o wszczęcie postępowania w sprawie przysposobienia dziecka. | KP art. 183 § 1 i 1¹ | załącznik, tabela "Liczba dzieci przyjętych na wychowanie" |
| F2 | Pracownik, który przyjął dziecko w wieku do 7 lat, a przy odroczeniu obowiązku szkolnego do 10 lat, albo przysposabia dziecko w wieku do 14 lat, ma prawo do 9 tygodni urlopu na warunkach urlopu macierzyńskiego. Załącznik ujmuje to jako regułę, że urlop nie może trwać krócej niż 9 tygodni. | KP art. 183 § 3 | załącznik, pozycja "Minimalny okres" |
| F3 | Urlop na warunkach urlopu macierzyńskiego trwa nie dłużej niż do ukończenia przez dziecko 7 lat, przy odroczeniu obowiązku szkolnego 10 lat, a przy przysposobieniu 14 lat. | KP art. 183 § 1 i 1¹ | - |
| F4 | Rodzina zastępcza ma prawo do urlopu rodzicielskiego w wymiarze 41 tygodni przy jednym dziecku, 43 tygodni przy więcej niż jednym, a 38 tygodni, gdy przyjęła dziecko w wieku, o którym mowa w punkcie F2. | KP art. 183 § 4 | - |
| F5 | Pracownik, który wystąpił do sądu o przysposobienie dziecka, ma prawo do urlopu rodzicielskiego w wymiarze 41 tygodni przy jednym dziecku i 43 tygodni przy więcej niż jednym, nie dłużej niż do ukończenia przez dziecko 14. roku życia. | KP art. 183 § 4¹ | - |
| F6 | Przy dziecku z zaświadczeniem "Za życiem" urlop rodzicielski rodziny zastępczej i osoby przysposabiającej wynosi 65 tygodni przy jednym dziecku i 67 tygodni przy więcej niż jednym, a 62 tygodnie w przypadku z punktu F4. | KP art. 183 § 4³, 4⁴ i 4⁵ | - |
| F7 | Urlop rodzicielski w wymiarze z punktów F4 i F5 udziela się jednorazowo albo w nie więcej niż 5 częściach. | KP art. 183 § 4⁶ | - |
| F8 | Uzupełniający urlop macierzyński przysługuje również przy przyjęciu dziecka na wychowanie, jeśli pobyt w szpitalu miał miejsce po przyjęciu. | KP art. 183 § 3¹ | - |
| F9 | Urlop na warunkach urlopu macierzyńskiego udziela się na wniosek złożony w ciągu 7 dni od przyjęcia dziecka, a urlop zaczyna się nie później niż 21 dni od przyjęcia. | KP art. 183 § 6 | - |

## G. Urlop rodzicielski

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| G1 | Urlop rodzicielski wynosi 41 tygodni przy jednym dziecku i 43 tygodnie przy więcej niż jednym. | KP art. 182¹a § 1 | załącznik, tabela "Sytuacja / Tygodnie"; Poradnik s. 32 |
| G2 | Przy dziecku z zaświadczeniem "Za życiem" urlop rodzicielski wynosi 65 tygodni przy jednym dziecku i 67 tygodni przy więcej niż jednym. | KP art. 182¹a § 2 | załącznik, tabela "Sytuacja / Tygodnie"; Poradnik s. 33 |
| G3 | Wymiar z punktów G1 i G2 przysługuje łącznie obojgu rodzicom. | KP art. 182¹a § 3 | załącznik, gwiazdka pod tabelą; Poradnik s. 33 |
| G4 | Każdemu z rodziców przysługuje wyłączne prawo do 9 tygodni urlopu rodzicielskiego z tego wymiaru i nie można przenieść tego prawa na drugiego rodzica. | KP art. 182¹a § 4 | załącznik, gwiazdka pod tabelą; Poradnik s. 33 i 35 |
| G5 | Wykorzystanie co najmniej 9 tygodni urlopu rodzicielskiego oznacza wykorzystanie części wyłącznej. | KP art. 182¹a § 5 | - |
| G6 | Urlop rodzicielski udziela się jednorazowo albo w nie więcej niż 5 częściach, nie później niż do końca roku kalendarzowego, w którym dziecko kończy 6 lat. | KP art. 182¹c | Poradnik s. 33 |
| G7 | Urlopu udziela się na wniosek złożony nie później niż 21 dni przed rozpoczęciem korzystania z urlopu. Liczbę części ustala się według liczby złożonych wniosków, a do wykorzystanych części liczy się także wnioski o zasiłek macierzyński za okres rodzicielski złożone przez ubezpieczoną matkę albo ubezpieczonego ojca dziecka. | KP art. 182¹d § 1 i 2 | - |
| G8 | Pracownik może łączyć korzystanie z urlopu rodzicielskiego z pracą u tego samego pracodawcy w wymiarze nie większym niż połowa pełnego wymiaru czasu pracy, a urlopu udziela się na pozostałą część wymiaru. Podjęcie pracy wymaga wniosku złożonego nie później niż 21 dni przed jej rozpoczęciem. | KP art. 182¹e § 1 i 2 | Poradnik s. 20 podaje tylko limit pół etatu, termin wniosku jest wyłącznie w przepisie |
| G9 | Przy łączeniu urlopu z pracą wymiar urlopu wydłuża się proporcjonalnie do wymiaru czasu pracy, nie dłużej niż do 82 tygodni przy jednym dziecku i 86 tygodni przy więcej niż jednym. | KP art. 182¹f § 1 | - |
| G10 | Przy dziecku z zaświadczeniem "Za życiem" wydłużenie sięga nie dłużej niż 130 tygodni przy jednym dziecku i 134 tygodni przy więcej niż jednym. | KP art. 182¹f § 1¹ | Poradnik s. 33 |
| G11 | Wydłużenie stanowi iloczyn liczby tygodni łączenia urlopu z pracą i wymiaru czasu pracy. Gdy powstała część nie odpowiada wielokrotności tygodnia, udziela się jej w dniach, a niepełny dzień pomija. | KP art. 182¹f § 2 i 4 | - |

## H. Urlop ojcowski

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| H1 | Urlop ojcowski wynosi 2 tygodnie i przysługuje nie dłużej niż do ukończenia przez dziecko 12. miesiąca życia, a przy przysposobieniu do upływu 12 miesięcy od uprawomocnienia się postanowienia, nie dłużej niż do ukończenia przez dziecko 14. roku życia. | KP art. 182³ § 1 | załącznik, tabela urlopu ojcowskiego; Poradnik s. 33-34 |
| H2 | Urlop ojcowski można wykorzystać jednorazowo albo w 2 częściach, z których żadna nie może być krótsza niż tydzień. | KP art. 182³ § 1¹ | załącznik, tabela urlopu ojcowskiego |
| H3 | Wniosek o urlop ojcowski składa się nie później niż 7 dni przed rozpoczęciem korzystania z urlopu. | KP art. 182³ § 2 | - |

## I. Wysokość zasiłku macierzyńskiego

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| I1 | Zasiłek macierzyński za okres urlopu macierzyńskiego, urlopu na warunkach urlopu macierzyńskiego, uzupełniającego urlopu macierzyńskiego i urlopu ojcowskiego wynosi 100% podstawy wymiaru. | ustawa art. 31 ust. 1 | załącznik, tabela "Wysokość zasiłku macierzyńskiego"; Poradnik s. 35 |
| I2 | Zasiłek macierzyński za okres urlopu rodzicielskiego wynosi 70% podstawy wymiaru. | ustawa art. 31 ust. 2 | załącznik, tabela "Wysokość zasiłku macierzyńskiego"; Poradnik s. 35 |
| I3 | Gdy matka złoży wniosek nie później niż 21 dni po porodzie, zasiłek macierzyński za cały okres odpowiadający urlopowi macierzyńskiemu, urlopowi na warunkach urlopu macierzyńskiego i urlopowi rodzicielskiemu wynosi 81,5% podstawy wymiaru, z wyłączeniem okresu przysługującego ojcu dziecka z punktu G4. | ustawa art. 31 ust. 3 oraz art. 30a ust. 1 | załącznik, wiersz "Urlop macierzyński + rodzicielski (wniosek w 21 dni)"; Poradnik s. 35 |
| I4 | W wariancie 81,5% zasiłek za część urlopu rodzicielskiego przysługującą drugiemu rodzicowi, czyli za 9 tygodni z punktu G4, wynosi 70% podstawy wymiaru. | ustawa art. 31 ust. 3f | załącznik, wiersze o 9 tygodniach dla drugiego rodzica; Poradnik s. 35 |
| I5 | Gdy wniosek z punktu I3 został złożony, ale w pierwszym roku życia dziecka nie wykorzystano ani jednego dnia zasiłku za okres urlopu rodzicielskiego, zasiłek za ten okres wynosi 70% podstawy wymiaru. | ustawa art. 31 ust. 3g | - |
| I6 | Gdy miesięczna kwota zasiłku macierzyńskiego jest niższa od kwoty świadczenia rodzicielskiego, podwyższa się ją do wysokości świadczenia rodzicielskiego, a za część miesiąca proporcjonalnie. | ustawa art. 31 ust. 3a i 3c | - |
| I7 | W wariancie 81,5% kwota 81,5% obowiązuje za cały okres łącznie, czyli obejmuje też okres urlopu macierzyńskiego, który poza tym wnioskiem byłby płatny w 100%. | ustawa art. 31 ust. 3 | załącznik, wiersz "Urlop macierzyński + rodzicielski (wniosek w 21 dni)"; Poradnik s. 35 |
| I8 | Zasiłek macierzyński odpowiadający okresowi urlopu rodzicielskiego, pobierany przez ojca dziecka, gdy matka nie jest objęta ubezpieczeniem społecznym w razie choroby i macierzyństwa, podlega finansowaniu z budżetu państwa w ramach dotacji do Funduszu Ubezpieczeń Społecznych. | ustawa art. 31 ust. 3h | - |
| I9 | Gdy w pierwszym roku życia dziecka nie wykorzystano ani jednego dnia zasiłku za okres urlopu rodzicielskiego w wysokości 81,5% z punktu I3, na wniosek ubezpieczonego przysługuje jednorazowe wyrównanie pobranego zasiłku za okres urlopu macierzyńskiego do 100% podstawy wymiaru. | ustawa art. 31 ust. 4 | - |
| I10 | Wysokość zasiłku macierzyńskiego zmniejsza się proporcjonalnie do wymiaru czasu pracy, w którym pracownik łączy korzystanie z urlopu rodzicielskiego z pracą u pracodawcy udzielającego tego urlopu. | ustawa art. 31 ust. 4a | - |
| I11 | Do zasiłku macierzyńskiego stosuje się odpowiednio przepis o przysługiwaniu za każdy dzień oraz wyłączenia zasiłku chorobowego za okresy, w których ubezpieczony zachowuje prawo do wynagrodzenia, za czas urlopu bezpłatnego i za czas tymczasowego aresztowania lub odbywania kary pozbawienia wolności. | ustawa art. 31 ust. 5 w związku z art. 11 ust. 4 i art. 12 ust. 1 oraz ust. 2 pkt 1 i 3 | - |

## J. Świadczenie rehabilitacyjne

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| J1 | Świadczenie rehabilitacyjne przysługuje ubezpieczonemu, który po wyczerpaniu zasiłku chorobowego jest nadal niezdolny do pracy, a dalsze leczenie lub rehabilitacja rokują odzyskanie zdolności do pracy. O tych okolicznościach orzeka lekarz orzecznik ZUS. | ustawa art. 18 ust. 1 i 3 | - |
| J2 | Świadczenie przysługuje przez okres niezbędny do przywrócenia zdolności do pracy, nie dłużej niż przez 12 miesięcy. | ustawa art. 18 ust. 2 | - |
| J3 | Świadczenie wynosi 90% podstawy wymiaru zasiłku chorobowego za pierwsze trzy miesiące, 75% za pozostały okres, a 100%, gdy niezdolność do pracy przypada w okresie ciąży. | ustawa art. 19 ust. 1 | - |
| J4 | Świadczenie nie przysługuje osobie uprawnionej do emerytury lub renty z tytułu niezdolności do pracy, zasiłku dla bezrobotnych, zasiłku przedemerytalnego, świadczenia przedemerytalnego i rodzicielskiego świadczenia uzupełniającego. | ustawa art. 18 ust. 7 | - |
| J5 | Podstawa wymiaru zasiłku chorobowego przyjęta do obliczenia świadczenia podlega waloryzacji kwartalnej według wskaźnika ogłaszanego przez Prezesa ZUS. | ustawa art. 19 ust. 2 i 3 | - |

## K. Prawo do świadczeń po ustaniu ubezpieczenia

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| K1 | Zasiłek macierzyński przysługuje również w razie urodzenia dziecka po ustaniu ubezpieczenia chorobowego, jeśli ubezpieczenie ustało w okresie ciąży wskutek śmierci, ogłoszenia upadłości lub likwidacji pracodawcy albo z naruszeniem przepisów prawa stwierdzonym prawomocnym orzeczeniem sądu. | ustawa art. 30 ust. 1 | - |
| K2 | Pracownicy, której umowa o pracę wygasła z powodu śmierci pracodawcy albo z którą rozwiązano stosunek pracy w okresie ciąży z powodu ogłoszenia upadłości lub likwidacji pracodawcy i której nie zapewniono innego zatrudnienia, przysługuje do dnia porodu zasiłek w wysokości zasiłku macierzyńskiego. | ustawa art. 30 ust. 3 | - |
| K3 | Pracownicy zatrudnionej na czas określony, której umowa została przedłużona do dnia porodu, przysługuje prawo do zasiłku macierzyńskiego po ustaniu ubezpieczenia. | ustawa art. 30 ust. 4 oraz KP art. 177 § 3 | - |
| K4 | Umowa o pracę na czas określony albo na okres próbny przekraczający jeden miesiąc, która uległaby rozwiązaniu po upływie trzeciego miesiąca ciąży, ulega przedłużeniu do dnia porodu. Nie dotyczy to umowy zawartej w celu zastępstwa pracownika w czasie usprawiedliwionej nieobecności. | KP art. 177 § 3 i 3¹ | - |

## L. Podstawa wymiaru

| Id | Reguła | Przepis | Materiał |
|---|---|---|---|
| L1 | Podstawę wymiaru zasiłku dla pracownika stanowi przeciętne miesięczne wynagrodzenie wypłacone za 12 miesięcy kalendarzowych poprzedzających miesiąc powstania niezdolności do pracy. | ustawa art. 36 ust. 1 | załącznik, sekcja "1. Okres uwzględniany w podstawie wymiaru zasiłku"; Poradnik s. 25 |
| L2 | Gdy niezdolność powstała przed upływem 12 miesięcy, podstawę stanowi przeciętne miesięczne wynagrodzenie za pełne miesiące kalendarzowe ubezpieczenia. | ustawa art. 36 ust. 2 | załącznik, pozycja "Zatrudnienie krótsze niż 12 miesięcy" |
| L3 | Podstawę za jeden dzień niezdolności stanowi jedna trzydziesta część podstawy miesięcznej. | ustawa art. 36 ust. 3 | - |
| L4 | Gdy niezdolność powstała przed upływem pełnego miesiąca kalendarzowego ubezpieczenia, podstawę stanowi wynagrodzenie, które pracownik osiągnąłby, gdyby pracował pełny miesiąc. Przy wynagrodzeniu stałym jest to kwota z umowy, przy zmiennych składnikach przeliczenie dni przepracowanych na dni obowiązane do przepracowania, a gdy pracownik nie osiągnął żadnego wynagrodzenia, przeciętna miesięczna kwota zmiennych składników wypłacona pracownikom na takim samym lub podobnym stanowisku. | ustawa art. 37 ust. 1 i 2 | załącznik, pozycje "Choroba w pierwszym miesiącu pracy" i "Choroba w drugim miesiącu pracy" |
| L5 | Gdy przerwa między okresami pobierania zasiłków jest krótsza niż miesiąc kalendarzowy, podstawy nie ustala się na nowo i obowiązuje podstawa z poprzedniego zasiłku. | ustawa art. 43 | załącznik, pozycja "Przerwa między zasiłkami poniżej 1 miesiąca" |
| L6 | Podstawę pomniejsza się o kwotę odpowiadającą 13,71% wynagrodzenia, czyli o składki na ubezpieczenia społeczne finansowane przez pracownika. Stopa 13,71% występuje w ustawie przy minimalnej podstawie. | ustawa art. 45 ust. 1 | załącznik, sekcja "Dla pracowników"; Poradnik s. 25 |
| L7 | Przeciętne miesięczne wynagrodzenie ustala się, dzieląc wynagrodzenie osiągnięte w przyjętym okresie przez liczbę miesięcy, w których pracownik je osiągnął. Gdy w tym okresie nie osiągnął wynagrodzenia z powodu nieobecności usprawiedliwionej, wyłącza się miesiące, w których przepracował mniej niż połowę obowiązującego czasu pracy, a wynagrodzenie z miesięcy z co najmniej połową czasu pracy przyjmuje się po uzupełnieniu według zasad z punktu L4. Gdy z przyczyn usprawiedliwionych w każdym miesiącu tego okresu przepracował mniej niż połowę czasu pracy, przyjmuje się wynagrodzenie za wszystkie miesiące po uzupełnieniu. | ustawa art. 38 ust. 1-3 | załącznik, sekcja "4. Uzupełnianie wynagrodzenia za niepełny miesiąc" |
| L8 | Składniki za okresy miesięczne wlicza się w kwocie wypłaconej za miesiące przyjęte do podstawy, premie i nagrody kwartalne w wysokości 1/12 kwot z czterech kwartałów poprzedzających, a składniki roczne w wysokości 1/12 kwoty z roku poprzedzającego. Składników, do których pracownik zachowuje prawo w okresie pobierania zasiłku, nie uwzględnia się. | ustawa art. 42 ust. 1-3 oraz art. 41 ust. 1 | załącznik, sekcja "3. Składniki wynagrodzenia w podstawie wymiaru zasiłku" |
| L9 | Podstawa wymiaru zasiłku chorobowego z tytułu pracy w pełnym wymiarze czasu pracy nie może być niższa od kwoty minimalnego wynagrodzenia za pracę po odliczeniu 13,71%. Przy minimalnym wynagrodzeniu 4806 zł daje to 4147,10 zł, co jest naszym wyliczeniem, bo załącznik tej kwoty nie podaje. | ustawa art. 45 ust. 1 | załącznik podaje tylko kwotę 4806 zł i stopę 13,71% |
| L10 | Dla ubezpieczonego niebędącego pracownikiem podstawę stanowi przeciętny miesięczny przychód za 12 miesięcy kalendarzowych poprzedzających miesiąc choroby. W 2026 roku maksymalna miesięczna podstawa wymiaru dobrowolnej składki chorobowej wynosi 23 550,00 zł, co po odjęciu 13,71% daje maksymalną podstawę zasiłku 20 321,30 zł. | ustawa art. 48 ust. 1 | załącznik, sekcja "Dla nie pracowników" |
| L11 | Przepisy o ustalaniu podstawy stosuje się odpowiednio do świadczenia rehabilitacyjnego, zasiłku macierzyńskiego, zasiłku w wysokości zasiłku macierzyńskiego i zasiłku opiekuńczego. | ustawa art. 47 | - |
| L12 | Podstawa wymiaru zasiłku przysługującego za okres po ustaniu tytułu ubezpieczenia nie może być wyższa niż 100% przeciętnego wynagrodzenia. | ustawa art. 46 | - |
| L13 | Gdy w miesiącach przyjętych do podstawy zmienił się wymiar czasu pracy, podstawę stanowi wynagrodzenie ustalone dla nowego wymiaru, jeżeli zmiana nastąpiła w miesiącu powstania niezdolności albo w miesiącach uwzględnianych w podstawie. | ustawa art. 40 | - |

## Czego w materiałach nie ma

Cztery rzeczy, na które trzeba uważać przy kodowaniu, bo materiał albo ich nie podaje, albo podaje
nie wprost.

1. Załącznik zapowiada wartości minimalnej podstawy wymiaru zasiłku na 2026 rok, ale ich nie
   wypisuje. Jest tylko zdanie o kwocie 4806 zł i stopie 13,71%. Wartość w wierszu L9, 4147,10 zł,
   jest policzona tutaj jako 4806 razy 0,8629 i trzeba ją tak oznaczyć w kodzie, dopóki nie
   potwierdzi jej inny materiał.
2. Wysokość zasiłku chorobowego 80% jest w ustawie, w art. 11 ust. 1, a załącznik pokazuje tylko
   przypadek ciąży, gdzie obowiązuje 100%. Bez tego wiersza kalkulator pominąłby zwykłe zwolnienie.
3. Wydłużenie urlopu rodzicielskiego przy łączeniu z pracą, czyli 82 i 86 tygodni, jest w Kodeksie
   pracy, w art. 182¹f. Nie ma go ani w załączniku, ani w Poradniku. Pułapy 130 i 134 tygodni przy
   zaświadczeniu "Za życiem" pochodzą z tego samego artykułu i Poradnik podaje je na s. 33.
4. Kwoty świadczenia rodzicielskiego, do której podwyższa się zbyt niski zasiłek macierzyński, nie
   ma w żadnym z materiałów. Wiersz I6 mówi tylko o zasadzie podwyższenia.
