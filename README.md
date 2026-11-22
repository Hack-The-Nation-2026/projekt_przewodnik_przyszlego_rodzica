# Skrzydła Rodzica

Przewodnik po zasiłkach dla przyszłych rodziców. Projekt na HackNation 2026, wyzwanie **ZUS**.
Rodzic odpowiada na kilka pytań i widzi, co mu przysługuje, przez ile dni i w jakiej kwocie,
a potem dostaje dokumenty, terminy i miejsce złożenia wniosku.

## Co jest w środku

- **Kalkulator** (`/kalkulator`): zasiłek chorobowy w ciąży, macierzyński dla obojga rodziców,
  uzupełniający urlop przy wcześniaku, łączenie pracy z urlopem, adopcja i rodzina zastępcza.
  Kwoty liczy silnik reguł z `RULES.md`, nie model językowy.
- **Podział urlopu** na jednym ekranie: wspólna pula, po dziewięć nieprzenoszalnych tygodni dla
  każdego rodzica i osobny wynik dla obojga.
- **Dokumenty i wnioski** (`/dokumenty`): formularz, załączniki, termin i miejsce złożenia dla
  każdego świadczenia. Do tego szkic wniosku do pobrania i plik `.ics` z terminami do kalendarza.
- **Sprawy** (`/sprawy`): wgranie dokumentu z ZUS albo wybór z listy rozpoznanych dokumentów.
  Sprawę rozpoznajemy po odcisku pliku, więc PDF zostaje na urządzeniu, a strona pokazuje
  weryfikację ubezpieczenia, wyliczenie i porównanie z decyzją zapisaną w materiale.
- **System ZUS** (`/zus`): ubezpieczenie, zadłużenie, e-ZLA, PUE/eZUS i wniosek o odpis aktu
  urodzenia. Wszystko lokalnie, bez połączenia z systemami ZUS.
- **Wsparcie** (`/wsparcie`): organizacje i zasady dla sytuacji po stracie dziecka, przy wcześniaku,
  poronieniu i ciężkiej chorobie.
- **Panel administracyjny** (`/panel`): stopy, wymiary urlopów i przełączniki funkcji.
- **Asystent**: panel w prawym dolnym rogu. Model językowy wybiera tylko temat z katalogu,
  a treść, linki i podpowiedzi pochodzą z katalogu.

## Sztuczna inteligencja

Jedyna funkcja oparta na modelu językowym to asystent nawigacyjny. Dostaje pytanie i listę
tematów, zwraca wyłącznie identyfikator tematu. Odpowiedź, linki i następne pytania są zapisane
w katalogu w `back/app/services/assistant_service.py`, więc asystent nie może wymyślić kwoty,
terminu ani podstrony. Bez klucza `ASSISTANT_API_KEY` asystent działa na dopasowaniu słów i cała
aplikacja działa offline. Do modelu nie trafiają dane osobowe ani materiały ZUS.

## Dane demonstracyjne

Regulamin zadania nie pozwala publikować dokumentów ZUS, więc w repozytorium nie ma ani jednego
skanu z `PRZYKLADY/`. Dziesięć spraw w `back/app/data/demo-cases.json` to wymyślone scenariusze,
na których testy porównują kalkulator z oczekiwanym wynikiem. Poprawność samych reguł pilnuje
`back/tests/test_rules.py`.

## Zestaw przykładowy ZUS

`/sprawy` rozpoznaje wszystkie 87 zestawów z `PRZYKLADY/`. Przeglądarka liczy SHA-256 wybranego
pliku, wysyła sam odcisk, a backend szuka go w `back/app/data/zus-samples.json`. PDF nie opuszcza
urządzenia, więc skan z danymi o zdrowiu nie trafia do serwera ani do modelu językowego. Gdy plik
został zapisany ponownie i odcisk się zmienił, rozpoznanie schodzi na nazwę pliku i mówi o tym
wprost. Dla rozpoznanej sprawy strona pokazuje opis stanu faktycznego, wzory formularzy z zestawu
i wynik zapisany w materiale. Kwoty i daty, których skan nie podaje albo które są zamazane, wpisuje
się w krótkim formularzu i wtedy kalkulator liczy świadczenie główne.

Dane do rozpoznania powstają skryptem `back/scripts/build_zus_samples.py`, który czyta skany
z `PRZYKLADY/` i zapisuje tylko metadane: odcisk pliku, wzory formularzy, rodzaj świadczeń i wynik
sprawy. Treści dokumentów nie kopiujemy, bo regulamin tego zabrania.

## Stack

- Backend: Python, FastAPI, pydantic, uvicorn.
- Frontend: Vite, React 19, TypeScript, Tailwind v4, komponenty w stylu shadcn/ui,
  TanStack Query, react-hook-form i zod, zustand, react-router-dom.
- Integracja: REST API pod `/api`.

## Szybki start

Backend:

```bash
cd back
source .venv/bin/activate
cp .env.example .env
uvicorn app.main:app --reload
```

Frontend:

```bash
cd front
npm install
cp .env.example .env
npm run dev
```

Frontend działa na http://localhost:5173, API na http://localhost:8000 (dokumentacja pod `/docs`).

## Testy

```bash
cd back && ./.venv/bin/python -m pytest -q
cd front && npm run build && npm run lint
```

## Wdrożenie

Front stoi na Vercel, API na FastAPI Cloud. Adres API trafia do frontu w czasie budowania
(`VITE_API_URL`), więc po każdej zmianie adresu backendu front trzeba przebudować.

Kolejność jest wymuszona. Adres API jest potrzebny, żeby zbudować front, a adres frontu, żeby
wpuścić go przez CORS. Dlatego API idzie pierwsze, a `CORS_ORIGINS` ustawia się na końcu.

```bash
cd back
source .venv/bin/activate
pip install -r requirements-dev.txt        # fastapi[standard] daje CLI do FastAPI Cloud
fastapi cloud login                        # otwiera przeglądarkę, plan Hobby jest darmowy
# Bez --team-id CLI wypytuje o zespół i przerywa, gdy nie ma terminala.
# Identyfikator wypisze `fastapi cloud teams list`.
fastapi cloud apps create --name skrzydla-rodzica-api \
  --team-id <id-zespolu> --link --path .
fastapi deploy                             # wejście app.main:app jest w pyproject.toml
fastapi cloud env set ENVIRONMENT prod --no-redeploy    # zamyka endpoint z kontami demo
fastapi cloud env set ADMIN_SETTINGS_FILE /tmp/admin-settings.json --no-redeploy
# Asystent bez klucza działa na dopasowaniu słów, więc ta linia jest opcjonalna.
fastapi cloud env set --secret ASSISTANT_API_KEY "sk-or-..."

cd ../front
vercel login
vercel project create skrzydla-rodzica
vercel env add VITE_API_URL --environment production \
  --value "https://skrzydla-rodzica-api.fastapicloud.dev/api" -p skrzydla-rodzica
vercel deploy --prod --yes --project skrzydla-rodzica

cd ../back
# To samo wdraża API ponownie, już z adresem frontu na liście CORS. Gwiazdka obejmuje
# adresy podglądu, które zmieniają się przy każdym wdrożeniu.
fastapi cloud env set CORS_ORIGINS \
  "https://skrzydla-rodzica.vercel.app,https://skrzydla-rodzica*.vercel.app"
```

`fastapi cloud apps create` i `vercel project create` uruchamia się raz. Kolejne wdrożenia robią się
same z pusha na `main`.

`back/` wdraża `.github/workflows/deploy.yml`, który robi to samo, co `fastapi deploy`. Identyfikator
aplikacji i token wdrożeniowy siedzą w sekretach repozytorium jako `FASTAPI_CLOUD_APP_ID`
i `FASTAPI_CLOUD_TOKEN`, a ustawia je `fastapi cloud setup-ci`.

`front/` wdraża `.github/workflows/deploy-front.yml`, który rusza, gdy push dotknie `front/`.
Potrzebuje sekretów `VERCEL_TOKEN`, `VERCEL_ORG_ID` i `VERCEL_PROJECT_ID`. Vercel nie obsługuje tu
swojej integracji z GitHubem, bo prywatne repozytorium w organizacji wymaga płatnego planu, a konto
jest na Hobby. Token ma zakres zespołu `kvbc's projects` i nie wygasa. Po jego unieważnieniu trzeba
podmienić sekret `VERCEL_TOKEN`, inaczej front przestanie się wdrażać.

Ręcznie, gdy zajdzie potrzeba, robią to samo `fastapi deploy` w `back/`
i `vercel deploy --prod --project skrzydla-rodzica` w `front/`.

Adres aplikacji wypisuje `fastapi deploy`, a adres frontu `vercel deploy`. Wstaw je w miejsce
przykładów powyżej, jeśli wyjdą inne. Stan konta sprawdzisz przez `fastapi cloud whoami`,
a logi z chmury przez `fastapi cloud logs`.

Kilka rzeczy, które łatwo przeoczyć.

- `fastapi deploy` uruchamiamy z `back/`, więc do chmury jedzie samo `back/`. Katalogi `OPIS/`
  i `PRZYKLADY/` oraz `back/.env` zostają lokalnie, bo CLI respektuje `.gitignore`.
- Bez `ADMIN_SETTINGS_FILE` zapis z panelu administracyjnego kończy się błędem, bo katalog z kodem
  w chmurze może być tylko do odczytu. Plik w `/tmp` jest ulotny, więc po restarcie instancji
  wracają wartości domyślne z kodu.
- `front/vercel.json` przepisuje każdą trasę na `/index.html`, żeby odświeżenie na `/karta` albo
  `/urlop` nie kończyło się błędem 404.
- CORS obejmuje produkcyjną domenę frontu oraz wpisy z gwiazdką, na przykład
  `https://skrzydla-rodzica*.vercel.app`. Bez gwiazdki każdy podgląd ma inny adres i zostałby
  zablokowany.

## Materiały do oddania

- `prezentacja/index.html` to prezentacja na maksymalnie 10 slajdów. Otwiera się w przeglądarce,
  strzałki zmieniają planszę, a `Ctrl+P` zapisuje PDF w proporcji 16:9. Każda plansza niesie zrzut
  ekranu w ramce przeglądarki albo telefonu, bo jury może czytać sam plik, bez pokazu na żywo.
  Kod QR do demo jest na okładce i na ostatniej planszy.
- `prezentacja/Skrzydla-Rodzica-prezentacja.pdf` to ta sama prezentacja jako gotowy plik, dziesięć
  stron 16:9. Powstaje komendą `node do-pdf.mjs` z katalogu `prezentacja/`, więc nie trzeba jej
  drukować ręcznie.
- `video/out/prezentacja.mp4` to film do 3 minut, nagrany z działającej aplikacji. Szczegóły
  i sposób odtworzenia opisuje `video/README.md`.
- `zrzuty/` zbiera zrzuty ekranu najważniejszych stron.

## Struktura

```
zadanie-rodzice/
├── back/        # FastAPI i silnik reguł
├── front/       # React, Vite, Tailwind
├── video/       # film z nagrań aplikacji (Remotion)
├── prezentacja/ # prezentacja na 10 slajdów
├── zrzuty/      # zrzuty ekranu stron
├── RULES.md     # reguły zasiłków z odesłaniem do przepisów
├── PLAN.md      # kroki realizacji i stan prac
└── OPIS/        # materiały ZUS (lokalnie, poza repozytorium)
```

`OPIS/` i `PRZYKLADY/` są w `.gitignore`. Materiały ZUS wolno wykorzystać tylko na potrzeby
wydarzenia, bez kopiowania i rozpowszechniania.