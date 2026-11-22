/**
 * Słownik pojęć, które w tekstach urzędowych znaczą coś innego niż w mowie.
 *
 * Dwie zasady trzymają go w kupie. Definicja nie używa innych niezdefiniowanych
 * pojęć, bo wtedy dymek nic nie tłumaczy. I nie ma w niej liczb: procenty
 * i tygodnie zmieniają się z przepisami, a liczba w dymku zestarzałaby się
 * po cichu. Gdy liczba jest potrzebna, dymek odsyła do wyniku.
 *
 * Jedno źródło tekstu dla całego serwisu, więc „podstawa wymiaru" nie ma
 * trzech wersji na trzech ekranach.
 */
export interface GlossaryEntry {
  /** Pełna nazwa pojęcia, tak jak w pismach. Lista na ekranie pokazuje ją, nie klucz. */
  term: string
  /** Pierwsze zdanie: co to jest, po ludzku. */
  what: string
  /** Drugie zdanie: gdzie to pojawia się w sprawie użytkownika. */
  where: string
}

export const glossary = {
  podstawa: {
    term: 'Podstawa wymiaru',
    what: 'Kwota, od której liczy się zasiłek. To nie to samo co pensja z umowy.',
    where: 'Znajdziesz ją na zaświadczeniu od pracodawcy i w naszym wyniku jako punkt wyjścia wyliczenia.',
  },
  okres_zasilkowy: {
    term: 'Okres zasiłkowy',
    what: 'Liczba dni, za które świadczenie może być wypłacone przy jednej chorobie.',
    where: 'Wynika z Twoich dat zwolnienia i pokazuje się przy świadczeniu chorobowym.',
  },
  platnik: {
    term: 'Płatnik składek',
    what: 'Firma albo instytucja, która opłaca za Ciebie składki i wypłaca świadczenie.',
    where: 'Przy Twoim świadczeniu piszemy wprost, czy sprawę prowadzi pracodawca, czy ZUS.',
  },
  ubezpieczony: {
    term: 'Ubezpieczony',
    what: 'Osoba objęta ubezpieczeniem chorobowym, która ma prawo do świadczeń z tego tytułu.',
    where: 'Sprawdzamy to pytaniem o zgłoszenie do ubezpieczenia i o zakończenie pracy.',
  },
  swiadczeniobiorca: {
    term: 'Świadczeniobiorca',
    what: 'Osoba, której wypłacane jest świadczenie. Zwykle ta sama, co ubezpieczony.',
    where: 'W pismach to słowo oznacza Ciebie.',
  },
  wynagrodzenie_chorobowe: {
    term: 'Wynagrodzenie chorobowe',
    what: 'Pieniądze, które za pierwsze dni zwolnienia płaci pracodawca ze swoich środków.',
    where: 'W wyniku stoi osobno od zasiłku, bo ma inną nazwę i innego płatnika.',
  },
  zasilek_chorobowy: {
    term: 'Zasiłek chorobowy',
    what: 'Pieniądze za dalsze dni zwolnienia lekarskiego.',
    where: 'Liczymy go z Twojego zwolnienia i okresu ubezpieczenia.',
  },
  zaswiadczenie_platnika: {
    term: 'Zaświadczenie płatnika',
    what: 'Dokument, w którym pracodawca potwierdza Twoje zarobki i opłacone składki.',
    where: 'Trzeba go dołączyć, gdy świadczenie wypłaca ZUS.',
  },
  ezla: {
    term: 'e-ZLA',
    what: 'Elektroniczne zwolnienie lekarskie wystawiane przez lekarza w systemie.',
    where: 'Osobny ekran pokazuje podgląd takich zwolnień.',
  },
  decyzja: {
    term: 'Decyzja',
    what: 'Pismo, którym ZUS rozstrzyga sprawę: przyznaje świadczenie albo odmawia.',
    where: 'Jeśli ją dostałeś, ścieżka po decyzji odmownej liczy termin na odwołanie.',
  },
  odwolanie: {
    term: 'Odwołanie',
    what: 'Pismo, w którym nie zgadzasz się z decyzją ZUS i prosisz o jej zmianę.',
    where: 'Termin liczy się od dnia doręczenia decyzji, a nie od daty jej wystawienia.',
  },
  urlop_a_zasilek: {
    term: 'Urlop a zasiłek',
    what: 'Urlop to czas wolny od pracy, a zasiłek to pieniądze za ten czas.',
    where: 'Dlatego wniosek urlopowy idzie do pracodawcy, a o zasiłek pyta kalkulator.',
  },
  laczenie_z_praca: {
    term: 'Łączenie z pracą',
    what: 'Wykonywanie pracy w obniżonym wymiarze w czasie urlopu rodzicielskiego.',
    where: 'Urlop wydłuża się wtedy proporcjonalnie, a przeliczenie widzisz przy wyniku.',
  },
  tygodnie_niezbywalne: {
    term: 'Dziewięć tygodni niezbywalnych',
    what: 'Tygodnie urlopu, których jeden rodzic nie może oddać drugiemu.',
    where: 'Pokazujemy je na taśmie czasu i na karcie podziału urlopu.',
  },
  swiadczenie_rehabilitacyjne: {
    term: 'Świadczenie rehabilitacyjne',
    what: 'Świadczenie po wyczerpaniu zasiłku chorobowego, gdy zdrowie nie pozwala wrócić do pracy.',
    where: 'Liczymy je tylko wtedy, gdy w formularzu wskażesz dalszą niezdolność do pracy.',
  },
} as const satisfies Record<string, GlossaryEntry>

export type GlossaryKey = keyof typeof glossary

/** Do listy na ekranie i do testów: klucze i teksty w jednym miejscu. */
export const glossaryEntries = Object.entries(glossary) as [GlossaryKey, GlossaryEntry][]
