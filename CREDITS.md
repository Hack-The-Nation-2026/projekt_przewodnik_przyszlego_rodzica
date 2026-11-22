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

Trzy kroki powstawały z jednym opisem stylu, z inną sceną na końcu.

> Flat vector editorial illustration, square 1:1, for a Polish family-benefits website. [scena]. Limited flat palette only: deep forest green #007834, warm amber gold #e8a33d, dark ink navy #1d2b3a for even outlines, soft cream #FBF3E4 background. Simple geometric shapes, thick consistent outlines, no gradients, no shading, no texture, no text or letters, centered composition with generous margins, clean and friendly public-service style.

- `krok-1.webp` — A pregnant woman sits at a small desk in front of an open laptop, one hand on her chin thinking, two rounded speech bubbles with question marks floating above her.
- `krok-2.webp` — A young couple stands close together reading a printed sheet that shows a simple bar chart and a large check mark; the woman points at the chart while the man holds the page.
- `krok-3.webp` — Two hands slide completed paper forms with check boxes into an open amber document folder; one arm wears a dark green sleeve with a white cuff.

Wcześniejszy zestaw — `cover.png` oraz `krok-wywiad.webp`, `krok-wyniki.webp` i `krok-dokumenty.webp` — został zastąpiony tymi plikami i usunięty z repozytorium.

## Krój pisma

IBM Plex Sans z Google Fonts, licencja SIL Open Font License 1.1. `front/index.html` wczytuje
cztery grubości: 400, 500, 600 i 700.

## Ikony i komponenty

Ikony w interfejsie pochodzą z `lucide-react` (ISC, część ikon wywodzi się z projektu Feather).
Menu konta stoi na `@radix-ui/react-dropdown-menu` i pakiecie `radix-ui` (MIT).
