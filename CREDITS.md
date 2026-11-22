# Zasoby i licencje

Materiały, które wchodzą do serwisu z zewnątrz, razem z autorem i licencją. Zależności z
`package.json` opisują ich własne pliki `LICENSE`, więc nie powtarzamy ich tutaj, poza tymi,
które wnoszą grafikę.

## Zdjęcia i grafika

| Plik | Co przedstawia | Autor i źródło | Licencja |
| --- | --- | --- | --- |
| `front/public/rodzice-kolyska.jpg` | Mama i tata z niemowlakiem na łóżku w jasnej sypialni. Zdjęcie w sekcji startowej, odbite lustrem, żeby rodzina trafiła na prawą stronę, przycięte do 1920 na 960 pikseli (2:1). | Yan Krukau, Pexels, https://www.pexels.com/photo/6209463/ | Licencja Pexels. Pozwala używać, zmieniać i przycinać zdjęcie także komercyjnie, bez obowiązku podania autora. Autora podajemy i tak. |
| `front/public/favicon.svg` i znak w nagłówku oraz w stopce | Para pierzastych skrzydeł, narysowana w `front/src/components/brand/wing-mark.tsx`. Z ikony zostały same skrzydła, bez stojącej między nimi postaci. | Ikona `angel-wings`, autor Lorc, https://game-icons.net. | CC BY 3.0. Użycie komercyjne dozwolone, wymaga podania autora, licencji i informacji o zmianach. Autora i licencję podajemy w stopce serwisu oraz tutaj. |
| `front/public/krok-1.webp`, `krok-2.webp`, `krok-3.webp` | Ilustracje trzech kroków w sekcji „Jak to działa”: kobieta w ciąży przy laptopie z pytaniami, dwoje rodziców nad arkuszem wyników, dłonie wkładające wnioski do teczki. | Wygenerowane wbudowanym narzędziem do obrazów (model `microsoft/mai-image-2.7` przez OpenRouter) na potrzeby projektu. | Materiały wygenerowane na potrzeby projektu. |
| `front/public/orzel.png` | Orzeł Biały obok napisu na przycisku logowania przez mObywatela. | Nie mamy zapisanego źródła. Do uzupełnienia. | Do uzupełnienia. |
| `front/public/mobywatel.png` | Ikona aplikacji mObywatel na symulowanym ekranie logowania. | Nie mamy zapisanego źródła. Do uzupełnienia. | Znak urzędowy państwa. Wchodzi tylko jako ilustracja symulacji, której wymaga zadanie. |

### Polecenie do wygenerowania ilustracji

Styl: dwukolorowy sitodruk w duchu polskiej szkoły plakatu — płaskie plamy, sylwetki, ziarno
papieru. Każde polecenie miało ten sam opis stylu i inną scenę.

> Two-colour screenprint illustration in the style of mid-century Polish poster art. [scena]. Composed entirely of solid flat shapes and simple silhouettes, no hairline outline strokes. Exactly two inks: deep forest green #007834 and warm amber #e8a33d printed on warm cream #F5EEDD uncoated paper, with visible coarse paper grain and slight ink misregistration. No gradients, no shading, no highlights, no decorative dots, arcs, sparkles, leaves or background pattern. Square 1:1, subject fills the frame. No text, no letters, no signature, no border.

- `krok-1.webp` — A pregnant woman sits in profile at a small desk typing on a laptop; two bold question-mark shapes float beside her head.
- `krok-2.webp` — Two people stand side by side looking down at a single sheet of paper held in their hands; the sheet carries a simple three-bar chart.
- `krok-3.webp` — Two hands slide a single sheet of paper into an open document folder.

Wcześniejszy zestaw — `cover.png` oraz `krok-wywiad.webp`, `krok-wyniki.webp` i `krok-dokumenty.webp` — został zastąpiony tymi plikami i usunięty z repozytorium.

## Krój pisma

IBM Plex Sans z Google Fonts, licencja SIL Open Font License 1.1. `front/index.html` wczytuje
cztery grubości: 400, 500, 600 i 700.

## Ikony i komponenty

Ikony w interfejsie pochodzą z `lucide-react` (ISC, część ikon wywodzi się z projektu Feather).
Menu konta stoi na `@radix-ui/react-dropdown-menu` i pakiecie `radix-ui` (MIT).
