# Zasoby i licencje

Materiały, które wchodzą do serwisu z zewnątrz, razem z autorem i licencją. Zależności z
`package.json` opisują ich własne pliki `LICENSE`, więc nie powtarzamy ich tutaj, poza tymi,
które wnoszą grafikę.

## Zdjęcia i grafika

| Plik | Co przedstawia | Autor i źródło | Licencja |
| --- | --- | --- | --- |
| `front/public/rodzice-kolyska.jpg`, ta sama fotografia w `prezentacja/assets/hero.jpg` i w `prezentacja/assets/okladka-foto.jpg` | Mama i tata z niemowlakiem na łóżku w jasnej sypialni. Zdjęcie w sekcji startowej i na okładce prezentacji, odbite lustrem, żeby rodzina trafiła na prawą stronę, przycięte do 1920 na 960 pikseli (2:1). Wersja `okladka-foto.jpg` to to samo ujęcie przycięte do proporcji 4:3 i powiększone do 1600 na 1200 pikseli, na okładkę zgłoszenia. | Yan Krukau, Pexels, https://www.pexels.com/photo/6209463/ | Licencja Pexels. Pozwala używać, zmieniać i przycinać zdjęcie także komercyjnie, bez obowiązku podania autora. Autora podajemy i tak. |
| `front/public/favicon.svg` i znak w nagłówku oraz w stopce | Para pierzastych skrzydeł, narysowana w `front/src/components/brand/wing-mark.tsx`. Z ikony zostały same skrzydła, bez stojącej między nimi postaci. | Ikona `angel-wings`, autor Lorc, https://game-icons.net. | CC BY 3.0. Użycie komercyjne dozwolone, wymaga podania autora, licencji i informacji o zmianach. Autora i licencję podajemy w stopce serwisu oraz tutaj. |
| `front/public/krok-1.webp`, `krok-2.webp`, `krok-3.webp` | Zdjęcia trzech kroków w sekcji „Jak to działa”: kobieta w ciąży z laptopem, para nad dokumentami z kalkulatorem, ręka wypełniająca formularz. Każde przycięte do kwadratu 800 na 800 pikseli. | Matilda Wormwood, Ketut Subiyanto i RDNE Stock project, Pexels. Linki niżej. | Licencja Pexels. Pozwala używać, zmieniać i przycinać zdjęcia także komercyjnie, bez obowiązku podania autora. Autorów podajemy i tak. |
| `front/public/orzel.png` | Orzeł Biały obok napisu na przycisku logowania przez mObywatela. | Nie mamy zapisanego źródła. Do uzupełnienia. | Do uzupełnienia. |
| `front/public/mobywatel.png` | Ikona aplikacji mObywatel na symulowanym ekranie logowania. | Nie mamy zapisanego źródła. Do uzupełnienia. | Znak urzędowy państwa. Wchodzi tylko jako ilustracja symulacji, której wymaga zadanie. |

### Skąd są zdjęcia w sekcji „Jak to działa”

Trzy fotografie z Pexels, przycięte do kwadratu 800 na 800 pikseli:

- `krok-1.webp` — Matilda Wormwood, https://www.pexels.com/photo/a-pregnant-woman-looking-at-a-laptop-7485261
- `krok-2.webp` — Ketut Subiyanto, https://www.pexels.com/photo/happy-couple-looking-at-paperwork-4308013
- `krok-3.webp` — RDNE Stock project, https://www.pexels.com/photo/close-up-shot-of-a-person-filling-out-a-form-7821682

Zdjęcia zastąpiły wcześniejszy zestaw: `cover.png` oraz wygenerowane dwukolorowe sitodruki
`krok-1`–`krok-3`. Tamte pliki zostały usunięte z repozytorium.

## Krój pisma

IBM Plex Sans z Google Fonts, licencja SIL Open Font License 1.1. `front/index.html` wczytuje
cztery grubości: 400, 500, 600 i 700.

## Ikony i komponenty

Ikony w interfejsie pochodzą z `lucide-react` (ISC, część ikon wywodzi się z projektu Feather).
Menu konta stoi na `@radix-ui/react-dropdown-menu` i pakiecie `radix-ui` (MIT).
