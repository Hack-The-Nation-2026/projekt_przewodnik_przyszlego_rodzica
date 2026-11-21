# Frontend: Przewodnik Przyszłego Rodzica

Interfejs aplikacji: Vite, React, TypeScript, Tailwind v4 i komponenty w stylu shadcn/ui.

## Stack

| Warstwa | Wybór |
|---|---|
| Build | Vite 8 |
| UI | React 19, TypeScript 7 |
| Styl | Tailwind CSS v4, komponenty shadcn/ui |
| Dane z API | axios, TanStack Query |
| Formularze | react-hook-form z walidacją zod (yup też jest w projekcie) |
| Stan globalny | zustand |
| Routing | react-router-dom 7 |
| Ikony | lucide-react |

## Uruchomienie

```bash
cd front
npm install
cp .env.example .env
npm run dev
```

Aplikacja startuje na http://localhost:5173. Backend musi działać na adresie z `VITE_API_URL`.

## Skrypty

```bash
npm run dev      # serwer deweloperski
npm run build    # typecheck i build produkcyjny
npm run preview  # podgląd builda
npm run lint     # oxlint
```

## Struktura

```
front/src/
├── components/
│   ├── layout/     # nagłówek, stopka, kontener, układ strony
│   └── ui/         # komponenty bazowe w stylu shadcn
├── hooks/          # zapytania do API (TanStack Query)
├── lib/            # axios i pomocniki
├── pages/          # widoki podpięte w routerze
├── store/          # zustand
└── types/          # typy odpowiedzi API
```

## Kolory

Paleta nawiązuje do identyfikacji ZUS. Zielony `#007834` jest kolorem głównym i niesie pasek
nagłówka, na którym stoją nazwa serwisu z podpisem i białe linki menu. Bursztynowy
`#e8a33d` zostaje w zestawie jako drugie wezwanie do działania. Biel i czerwień `#d22630` należą
do przycisku logowania przez mObywatela: orzeł jest białym plikiem `public/orzel.png`, a czerwień
wchodzi jako tło elementu, dzięki czemu kafel trzyma ostry kształt. Wszystkie tokeny są
w `src/index.css`.

Nagłówki i tekst dzielą jeden krój, IBM Plex Sans.

## Znak

Logo to roślina: dwa liście na łodydze, czyli życie i wzrost. Lewy liść jest duży, prawy mniejszy,
tak jak we wzorcu, więc znak nie jest symetrycznym kleksem. Jeden biały kształt na zielonym kaflu,
bez drugiego koloru. Łodyga jest szeroka u płasko ściętej stopy i z lekko wklęsłymi bokami zwęża
się ku liściom, więc wygląda jak młody pęd wschodzący z ziemi. Ten sam rysunek stoi
w `public/favicon.svg` i w nagłówku, w `src/components/layout/site-header.tsx`.

## Układ i skala

Strona główna przewija się jako jeden dokument. Hero ze zdjęciem, potem Jak to działa, lista
świadczeń, blok wsparcia i wspólna stopka. Każda podstrona działa tak samo. Kontener ma
`max-w-7xl`, żeby treść wypełniała szeroki ekran.

Przewijanie idzie sekcjami. Jedno kółko dostawia sąsiednią sekcję pod nagłówek, a sekcja
wyższa od okna przewija się w środku normalnie, więc długa treść na telefonie nie utyka.
Pilnuje tego efekt w `src/pages/home-page.tsx`, a `scroll-padding-top: 5rem` w `index.css`
zostawia sekcjom i kotwicom miejsce pod przyklejonym nagłówkiem.

## Zdjęcie na stronie startowej

Hero otwiera zdjęcie `public/formularz.jpg`: rodzice wypełniają przy kuchennym stole wniosek.
Autor Ron Lach, pobrane z Pexels na licencji Pexels, która pozwala używać i przycinać zdjęcie
także komercyjnie, bez obowiązku podania autora. Plik jest przycięty do 2400 na 1200 pikseli.
Zdjęcie zajmuje całą szerokość sekcji, a na nim stoi kwadracik z nagłówkiem, opisem i przyciskami.
Od lewej przykrywa zdjęcie przyciemnienie, żeby kwadracik miał na nim kontrast. Ten sam układ
działa na telefonie, tylko kwadracik zwęża się do szerokości ekranu.

## Wejście i logowanie

Trasa `/wejscie` to pierwszy ekran dla kogoś, kto nie jest jeszcze zalogowany. Stoi tam wybór
metody: karta z mObywatelem i obok formularz ręcznego wpisania danych. Zadanie wymaga tylko
mObywatela, więc pod nimi widać listę pozostałych metod jako wyłączone pozycje.

Po wejściu którąkolwiek drogą ten sam ekran pokazuje kartę `Twoje dane`. Widać w niej źródło
danych, imię i nazwisko, zamaskowany PESEL, opis sprawy i status, a obok przycisk `Przejdź dalej`
prowadzący do kalkulatora. Wpisanie danych bez logowania idzie przez `POST /auth/manual`
i tworzy profil bez sprawy w ZUS, więc status mówi wprost, że danych z ZUS nie ma.

Ekran jest osiągalny z przycisku w hero, z nagłówka po zalogowaniu i z kolumny `Przewodnik`
w stopce.

## Logowanie przez mObywatel

Prawdziwego mObywatela nie da się uruchomić na hackathonie, bo wymaga zarejestrowanego klienta
i certyfikatów, więc przepływ jest symulowany. Przycisk w nagłówku prowadzi na trasę `/mobywatel`,
która wygląda jak osobny serwis rządowy i celowo nie ma naszego nagłówka ani stopki.

Po zalogowaniu wracamy na stronę, z której użytkownik wyszedł, bo ścieżka powrotu jedzie
w parametrze `returnTo`. Dane obywatela lądują w zustandzie i pokazują się w nagłówku oraz paskiem
na stronie startowej.

Konta demonstracyjne wystawia backend, a podpowiedź z ich listą rozwija się pod kartą logowania.
Każde konto to inna sprawa, więc po powrocie widać inne dane. Hasło do wszystkich kont to
`demo1234`.

Ekran mObywatela ma własną paletę, żeby wyglądał jak obcy serwis. Tokeny z przedrostkiem `mb-`
siedzą w `src/index.css` osobno od barw ZUS.

## Nowe komponenty shadcn

Plik `components.json` jest gotowy, więc kolejne komponenty dodasz jednym poleceniem:

```bash
npx shadcn@latest add dialog
```
