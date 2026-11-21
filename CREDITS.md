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
| `front/public/krok-wywiad.webp`, `krok-wyniki.webp`, `krok-dokumenty.webp` | Ilustracje trzech kroków w sekcji „Jak to działa”. | Wygenerowane wbudowanym narzędziem imagegen OpenAI z `cover.png` jako wzorcem stylistycznym. | Materiały wygenerowane na potrzeby projektu. |
| `front/public/orzel.png` | Orzeł Biały obok napisu na przycisku logowania przez mObywatela. | Nie mamy zapisanego źródła. Do uzupełnienia. | Do uzupełnienia. |
| `front/public/mobywatel.png` | Ikona aplikacji mObywatel na symulowanym ekranie logowania. | Nie mamy zapisanego źródła. Do uzupełnienia. | Znak urzędowy państwa. Wchodzi tylko jako ilustracja symulacji, której wymaga zadanie. |

### Polecenia do wygenerowania ilustracji

Każde polecenie zaczynało się tym samym opisem.

> Use case: illustration-story. Create one new small spot illustration for a Polish parental-benefits guide. The attached cover.png is solely a visual style reference. Match its forest green, muted golden ochre, warm ivory and natural skin tones, simplified hand-drawn shapes, fine dark green outlines, subtle paper-print grain and Polish folk botanical ornament. Simple clear silhouette at a display width of 100–144 px. Center the vignette and keep its full outline within a 4:3 composition. True transparent background outside the artwork, no enclosing shape, no gradients or photorealism. No readable lettering, border or watermark. Draw this scene:

- `krok-wywiad.webp` — An expectant mother in an ochre dress at a small desk, answering questions on an open laptop with two abstract checkmarks, a short leafy sprig alongside.
- `krok-wyniki.webp` — Two parents, one in ochre and one in dark forest green, reviewing a small results sheet together with an abstract three-bar chart and a checkmark; a short leafy sprig alongside.
- `krok-dokumenty.webp` — A parent's hands placing two ivory application sheets into an ochre folder, with simple green checkmarks and a short leafy sprig alongside.

### Polecenia do usunięcia ornamentów

Wbudowany imagegen otrzymał każdą z trzech ilustracji jako obraz do edycji.

> Edit the attached small 4:3 spot illustration. Remove folk ornament and botanical decoration only. Keep the existing subject, approximate pose, composition, palette, delicate dark green outlines and lightly textured illustrated finish. Use truly transparent background outside the artwork. No new decorations, text, watermarks, or background.

- `krok-wywiad.webp` — Remove the leafy border at the bottom, the sprig by the laptop, and every decorative floral print from dress and cup. Fill the recovered spaces with plain ochre clothing and plain tabletop/cup where appropriate. Keep the seated woman, open laptop with checkmarks, and the two question bubbles.
- `krok-wyniki.webp` — Remove the garland at the bottom and sides, flowers, leaves, and printed motifs on the sleeves. Keep the same two parents, expressions, pointing gesture and report with three bars and a checkmark, using plain solid clothing.
- `krok-dokumenty.webp` — Remove the decorative floral emblem on the ochre folder, the external leafy sprig and all leaf details on both cuffs. Keep the same two hands, plain green cuffs, plain ochre folder and the two checked ivory pages.

## Krój pisma

IBM Plex Sans z Google Fonts, licencja SIL Open Font License 1.1. `front/index.html` wczytuje
cztery grubości: 400, 500, 600 i 700.

## Ikony i komponenty

Ikony w interfejsie pochodzą z `lucide-react` (ISC, część ikon wywodzi się z projektu Feather).
Menu konta stoi na `@radix-ui/react-dropdown-menu` i pakiecie `radix-ui` (MIT).
