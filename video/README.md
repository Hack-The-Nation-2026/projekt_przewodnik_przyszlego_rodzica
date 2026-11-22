# Prezentacja Skrzydła Rodzica

Film na wyzwanie ZUS, 2 min 59 s, 1920×1080, 30 klatek na sekundę, z komentarzem
lektora i napisami.

Gotowy plik leży w `out/prezentacja.mp4`, a napisy obok niego w `out/napisy.srt`.

## Jak to powstaje

Film składa się z prawdziwych nagrań działającej aplikacji. Całość powstaje
w trzech krokach.

1. `scripts/record.mjs` uruchamia Chrome przez Playwrighta, wstrzykuje kursor
   i przechodzi przez serwis, zapisując każdy rozdział jako osobny plik w
   `public/clips/`. Chrome nagrywa WebM, więc każdy plik od razu przechodzi
   przez ffmpeg na H.264, który render dekoduje lżej. Przy okazji powstaje
   tabela znaczników (`out/marks-*.json`) z czasami zdarzeń, takich jak
   otwarcie listy albo wynik.
2. `scripts/plan.mjs` czyta te znaczniki i opisuje montaż, czyli które fragmenty
   nagrań wchodzą do filmu, jak szybko i gdzie w tym czasie patrzy kamera.
   Wynik zapisuje do `src/edl.ts`.
3. `src/` to projekt Remotiona, który składa nagrania w jedną całość, dokłada
   ruch kamery, plansze telefonu z opisem i wyciemnienie na początku. Planszę
   z kodem QR rysuje `src/components/QrCard.tsx`, a dwie scenki wokół niej to
   `IntroScene.tsx` i `OutroScene.tsx`. Film otwiera się i zamyka adresem demo
   z kodem, więc nikt nie musi przepisywać go ze slajdu.

## Nagrania

`record.mjs` przyjmuje nazwę rozdziału albo `all`.

```bash
node scripts/record.mjs all       # wszystko po kolei
node scripts/record.mjs sprawy    # tylko rozdział ze sprawami
node scripts/record.mjs 12-asystent
```

Rozdziały to `01-main` (wejście, logowanie, wywiad, wynik i karta), `02-wnioski`,
`03-dokumenty`, `04-sprawy`, `05-sprawy-porownanie`, `06-zus`, `07-planowanie`,
`08-urlop`, `09-odwolanie`, `10-wsparcie`, `11-panel` i `12-asystent`. Na końcu
idzie pięć ujęć z telefonu, `13-mobile-home`, `14-mobile-swiadczenia`,
`15-mobile-karta`, `16-mobile-asystent` i `17-mobile-dokumenty`.

Nagrania desktopowe wymagają serwera deweloperskiego. Domyślnie nagrywamy
z `:5173`. Gdy w serwisie trwa praca nad kodem, lepiej nagrać z zamrożonej
kopii na porcie, który backend ma na liście CORS (na przykład `4173`), żeby
ujęcia nie zmieniały się w połowie:

```bash
DEMO_BASE=http://localhost:4173 node scripts/record.mjs all
```

## Pomiar i spis ekranów

`scripts/measure.mjs` otwiera listy i panele w prawdziwej aplikacji i wypisuje
ich współrzędne. Z tych liczb korzysta kamera w `plan.mjs`, żeby zbliżenie
objęło treść, a nie tło.

`scripts/inventory.mjs` przechodzi po wszystkich ekranach i zapisuje, co na nich
jest, czyli przyciski, pola i listy. Wynik ląduje w `out/check/inventory.json`
i pomaga pisać nagrania.

## Zrzuty ekranu

`scripts/shots.mjs` robi zrzuty najważniejszych stron do `zrzuty/` w katalogu
głównym repozytorium. Loguje się na każdym ekranie osobno, bo sesja żyje tylko
w pamięci, i prowadzi wywiad tam, gdzie zrzut ma pokazać wynik, a nie pusty
formularz.

```bash
node scripts/shots.mjs            # cała lista
node scripts/shots.mjs zus panel  # wybrane ekrany, po fragmencie nazwy
```

## Komentarz i napisy

`scripts/narracja.mjs` zamienia nagranie lektora w ścieżkę dopasowaną do montażu.

```bash
node scripts/narracja.mjs                      # nagranie z ~/Documents/narracja.wav
NARRACJA=/inna/sciezka.wav node scripts/narracja.mjs
```

Lektor czyta zdania jedno po drugim, bez przerw na montaż, więc skrypt kładzie
każde zdanie na początku sceny, którą opisuje. Mowa zostaje w swoim tempie,
a zmieniają się tylko pauzy między zdaniami. Nieudane podejście do akapitu
o odwołaniu i zdanie "To się wytni", które lektor powiedział po nim, są
pominięte w tabeli `ZDANIA`.

Wynik to `public/narracja.mp3`, który wchodzi do filmu, i `src/napisy.ts`,
z którego `src/components/Captions.tsx` rysuje napisy pod obrazem. Ten sam
zestaw ląduje w `out/napisy.srt`.

## Render

```bash
npm install
node scripts/record.mjs all
node scripts/plan.mjs
npx remotion render src/index.ts SkrzydlaRodzica out/prezentacja.mp4 --codec h264 --crf 20
```

Podgląd na żywo uruchamia `npx remotion studio src/index.ts`.

Krój pisma jest wpięty z `public/fonts/` (IBM Plex Sans, zakres łaciński
i rozszerzony), więc render nie sięga do sieci.

Kod QR (`public/qr-vercel.png`) prowadzi na `https://skrzydla-rodzica.vercel.app`.
Jest zapisany w repozytorium, żeby render nie zależał od żadnej usługi zewnętrznej,
i wchodzi na obie plansze z adresem, na powitanie i na pożegnanie.

Nagrania i klatki kontrolne nie trafiają do repozytorium. Odtwarzają się
skryptami z `scripts/`.
