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
| `front/public/krok-wywiad.webp`, `krok-wyniki.webp`, `krok-dokumenty.webp` | Ilustracje trzech kroków w sekcji „Jak to działa”. | Wygenerowane wbudowanym narzędziem imagegen OpenAI na potrzeby projektu. | Własne materiały wygenerowane na potrzeby projektu. |
| `front/public/orzel.png` | Orzeł Biały obok napisu na przycisku logowania przez mObywatela. | Nie mamy zapisanego źródła. Do uzupełnienia. | Do uzupełnienia. |
| `front/public/mobywatel.png` | Ikona aplikacji mObywatel na symulowanym ekranie logowania. | Nie mamy zapisanego źródła. Do uzupełnienia. | Znak urzędowy państwa. Wchodzi tylko jako ilustracja symulacji, której wymaga zadanie. |

### Polecenia do wygenerowania zdjęć kroków

Każde polecenie zaczynało się tym samym opisem.

> Use case: photorealistic-natural. Create one wide 2:1 landscape lifestyle photograph for a Polish parental benefits website. Soft window daylight, warm cream, wood and subtle sage, realistic editorial photography, calm everyday atmosphere. Main subjects centered vertically so it crops well. No readable text, brand marks or watermarks.

- `krok-wywiad.webp` — Expectant mother seated at a light kitchen table filling in a short questionnaire on a laptop, seen from a candid three-quarter angle, a plain notebook beside her.
- `krok-wyniki.webp` — Two expectant parents on a sofa reviewing information together on a tablet, relaxed, quietly attentive, medium shot.
- `krok-dokumenty.webp` — Close-up of a parent's hands sorting a small stack of application papers and slipping them into a kraft folder on a light wood desk.

## Krój pisma

IBM Plex Sans z Google Fonts, licencja SIL Open Font License 1.1. `front/index.html` wczytuje
cztery grubości: 400, 500, 600 i 700.

## Ikony i komponenty

Ikony w interfejsie pochodzą z `lucide-react` (ISC, część ikon wywodzi się z projektu Feather).
Menu konta stoi na `@radix-ui/react-dropdown-menu` i pakiecie `radix-ui` (MIT).
