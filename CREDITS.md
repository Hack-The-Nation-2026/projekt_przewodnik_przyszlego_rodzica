# Zasoby i licencje

Materiały, które wchodzą do serwisu z zewnątrz, razem z autorem i licencją. Zależności z
`package.json` opisują ich własne pliki `LICENSE`, więc nie powtarzamy ich tutaj, poza tymi,
które wnoszą grafikę.

## Zdjęcia i grafika

| Plik | Co przedstawia | Autor i źródło | Licencja |
| --- | --- | --- | --- |
| `front/public/formularz.jpg` | Para przegląda dokument przy kuchennym stole. Zdjęcie w sekcji startowej, przycięte do 2400 na 1200 pikseli. | Ron Lach, Pexels, https://www.pexels.com/photo/couple-working-together-at-home-9869384/ | Licencja Pexels. Pozwala używać i przycinać zdjęcie także komercyjnie, bez obowiązku podania autora. Autora podajemy i tak. |
| `front/public/favicon.svg` i znak w nagłówku | Para skrzydeł z trzech piór, narysowana w `front/src/components/brand/wing-mark.tsx`. | Znak własny serwisu. | Własność projektu, bez zewnętrznej licencji. |
| `front/public/orzel.png` | Orzeł Biały obok napisu na przycisku logowania przez mObywatela. | Nie mamy zapisanego źródła. Do uzupełnienia. | Do uzupełnienia. |
| `front/public/mobywatel.png` | Ikona aplikacji mObywatel na symulowanym ekranie logowania. | Nie mamy zapisanego źródła. Do uzupełnienia. | Znak urzędowy państwa. Wchodzi tylko jako ilustracja symulacji, której wymaga zadanie. |

## Krój pisma

IBM Plex Sans z Google Fonts, licencja SIL Open Font License 1.1. `front/index.html` wczytuje
cztery grubości: 400, 500, 600 i 700.

## Ikony i komponenty

Ikony w interfejsie pochodzą z `lucide-react` (ISC, część ikon wywodzi się z projektu Feather).
Menu konta stoi na `@radix-ui/react-dropdown-menu` i pakiecie `radix-ui` (MIT).
