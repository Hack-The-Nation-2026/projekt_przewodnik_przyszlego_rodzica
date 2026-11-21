# Zasoby i licencje

Materiały, które wchodzą do serwisu z zewnątrz, razem z autorem i licencją. Zależności z
`package.json` opisują ich własne pliki `LICENSE`, więc nie powtarzamy ich tutaj, poza tymi,
które wnoszą grafikę.

## Zdjęcia i grafika

| Plik | Co przedstawia | Autor i źródło | Licencja |
| --- | --- | --- | --- |
| `front/public/rodzice-kolyska.jpg` | Mama i tata z niemowlakiem na łóżku w jasnej sypialni. Zdjęcie w sekcji startowej, odbite lustrem, żeby rodzina trafiła na prawą stronę, przycięte do 1920 na 960 pikseli (2:1). | Yan Krukau, Pexels, https://www.pexels.com/photo/6209463/ | Licencja Pexels. Pozwala używać, zmieniać i przycinać zdjęcie także komercyjnie, bez obowiązku podania autora. Autora podajemy i tak. |
| `front/public/favicon.svg` i znak w nagłówku oraz w stopce | Para pierzastych skrzydeł, narysowana w `front/src/components/brand/wing-mark.tsx`. Z ikony zostały same skrzydła, bez stojącej między nimi postaci. | Ikona `angel-wings`, autor Lorc, https://game-icons.net. | CC BY 3.0. Użycie komercyjne dozwolone, wymaga podania autora, licencji i informacji o zmianach. Autora i licencję podajemy w stopce serwisu oraz tutaj. |
| `front/public/cover.png` | Bocian z rozłożonymi skrzydłami nad rodziną w gnieździe, w sekcji „Jak to działa”. Tło wycięte, plik ma przezroczystość. | Nie mamy zapisanego źródła. Do uzupełnienia. | Do uzupełnienia. |
| `front/public/orzel.png` | Orzeł Biały obok napisu na przycisku logowania przez mObywatela. | Nie mamy zapisanego źródła. Do uzupełnienia. | Do uzupełnienia. |
| `front/public/mobywatel.png` | Ikona aplikacji mObywatel na symulowanym ekranie logowania. | Nie mamy zapisanego źródła. Do uzupełnienia. | Znak urzędowy państwa. Wchodzi tylko jako ilustracja symulacji, której wymaga zadanie. |

## Krój pisma

IBM Plex Sans z Google Fonts, licencja SIL Open Font License 1.1. `front/index.html` wczytuje
cztery grubości: 400, 500, 600 i 700.

## Ikony i komponenty

Ikony w interfejsie pochodzą z `lucide-react` (ISC, część ikon wywodzi się z projektu Feather).
Menu konta stoi na `@radix-ui/react-dropdown-menu` i pakiecie `radix-ui` (MIT).
