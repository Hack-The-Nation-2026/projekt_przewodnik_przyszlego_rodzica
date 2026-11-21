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
  każdego świadczenia. Do tego szkic wniosku do pobrania.
- **Sprawy** (`/sprawy`): dziesięć scenariuszy demonstracyjnych i własny wniosek w formacie JSON.
  Strona pokazuje weryfikację ubezpieczenia, wyliczenie i porównanie z oczekiwanym wynikiem.
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