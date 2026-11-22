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
- **Sprawy** (`/sprawy`): zestaw przykładowy ZUS rozpoznawany po odcisku wgranego PDF-a, dziesięć
  scenariuszy demonstracyjnych i własny wniosek w formacie JSON. Strona pokazuje weryfikację
  ubezpieczenia, wyliczenie i porównanie z oczekiwanym wynikiem.
- **Symulacja ZUS** (`/zus`): ubezpieczenie, zadłużenie, e-ZLA, PUE/eZUS i wniosek o odpis aktu
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

Regulamin zadania nie pozwala publikować dokumentów ZUS, więc sprawy w `/sprawy` są odtworzone
na wymyślonych danych, a oczekiwany wynik każdej z nich jest zapisany w
`back/app/data/demo-cases.json`. To pokazuje spięcie strony z kalkulatorem, a nie odwzorowanie
prawdziwych decyzji. Poprawność reguł pilnuje `back/tests/test_rules.py`.

## Zestaw przykładowy ZUS

Obok spraw demonstracyjnych `/sprawy` rozpoznaje wszystkie 87 zestawów z `PRZYKLADY/`. Przeglądarka
liczy SHA-256 wybranego pliku, wysyła sam odcisk, a backend szuka go w `back/app/data/zus-samples.json`.
PDF nie opuszcza urządzenia, więc skan z danymi o zdrowiu nie trafia do serwera ani do modelu
językowego. Gdy plik został zapisany ponownie i odcisk się zmienił, rozpoznanie schodzi na nazwę
pliku i mówi o tym wprost. Dla rozpoznanej sprawy strona pokazuje opis stanu faktycznego, wzory
formularzy z zestawu i wynik zapisany w materiale. Kwoty i daty, których skan nie podaje albo
które są zamazane, wpisuje się w krótkim formularzu i wtedy kalkulator liczy świadczenie główne.

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
pip install -r requirements-dev.txt      # fastapi[standard] daje CLI do FastAPI Cloud
fastapi cloud login                      # otwiera przeglądarkę, plan Hobby jest darmowy
fastapi deploy                           # wejście app.main:app jest w pyproject.toml
fastapi cloud env set ENVIRONMENT prod     # zamyka endpoint z kontami demonstracyjnymi
fastapi cloud env set ADMIN_SETTINGS_FILE /tmp/admin-settings.json
# Asystent bez klucza działa na dopasowaniu słów, więc ta linia jest opcjonalna.
fastapi cloud env set --secret ASSISTANT_API_KEY "sk-or-..."

cd ../front
vercel login
vercel env add VITE_API_URL --environment production \
  --value "https://twoja-aplikacja.fastapicloud.dev/api"
vercel --prod

cd ../back
fastapi cloud env set CORS_ORIGINS "https://twoj-front.vercel.app"
```

Adres aplikacji wypisuje `fastapi deploy`, a adres frontu `vercel --prod`. Wstaw je w miejsce
przykładów powyżej. `fastapi cloud env set` wdraża API ponownie, więc `CORS_ORIGINS` działa
od razu.

Kilka rzeczy, które łatwo przeoczyć.

- `fastapi deploy` uruchamiamy z `back/`, więc do chmury jedzie samo `back/`. Katalogi `OPIS/`
  i `PRZYKLADY/` oraz `back/.env` zostają lokalnie, bo CLI respektuje `.gitignore`.
- Bez `ADMIN_SETTINGS_FILE` zapis z panelu administracyjnego kończy się błędem, bo katalog z kodem
  w chmurze może być tylko do odczytu. Plik w `/tmp` jest ulotny, więc po restarcie instancji
  wracają wartości domyślne z kodu.
- `front/vercel.json` przepisuje każdą trasę na `/index.html`, żeby odświeżenie na `/karta` albo
  `/urlop` nie kończyło się błędem 404.
- CORS obejmuje tylko produkcyjną domenę frontu. Podglądy z `vercel` bez `--prod` mają własne
  adresy i zostaną zablokowane, dopóki nie dopisze się ich do `CORS_ORIGINS`.

## Struktura

```
zadanie-rodzice/
├── back/        # FastAPI i silnik reguł
├── front/       # React, Vite, Tailwind
├── RULES.md     # reguły zasiłków z odesłaniem do przepisów
├── PLAN.md      # kroki realizacji i stan prac
└── OPIS/        # materiały ZUS (lokalnie, poza repozytorium)
```

`OPIS/` i `PRZYKLADY/` są w `.gitignore`. Materiały ZUS wolno wykorzystać tylko na potrzeby
wydarzenia, bez kopiowania i rozpowszechniania.