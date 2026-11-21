# Przewodnik Przyszłego Rodzica

Projekt na hackathon **HackNation 2026**, wyzwanie **ZUS**. Celem jest narzędzie, które w prosty
sposób pokazuje rodzicom, jakie świadczenia i urlopy im przysługują, ile wyniosą i jak je uzyskać.

To na razie szkielet: struktura repo, działający frontend ze stroną startową i
nagłówkiem oraz backend z pierwszymi endpointami. Reguły liczenia zasiłków są spisane w
`RULES.md`, a kod, który je policzy, dojdzie w kolejnych krokach z `PLAN.md`.

## Struktura

```
zadanie-rodzice/
├── back/     # FastAPI, REST API
├── front/    # Vite, React, Tailwind i shadcn/ui
├── RULES.md  # reguły zasiłków z odesłaniami do przepisów
├── PLAN.md   # kroki realizacji
└── OPIS/     # materiały ZUS (lokalnie, nie trafiają do repozytorium)
```

Folder `OPIS/` jest w `.gitignore`. Materiały ZUS wolno wykorzystać tylko na potrzeby wydarzenia,
bez kopiowania i rozpowszechniania.

## Szybki start

Backend (środowisko `.venv` jest już gotowe z zależnościami):

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

## Co już działa

- Logowanie przez symulowanego mObywatela. Przycisk w nagłówku wychodzi na stronę `/mobywatel`,
  a po zalogowaniu wracamy tam, gdzie przerwaliśmy, i widzimy dane zależne od konta.
- Nagłówek z nawigacją, nazwą zalogowanej osoby i wylogowaniem (stan trzyma zustand).
- Strona startowa: sekcja powitalna, kroki, lista świadczeń pobrana z API i skróty.
- Backend: `/api/health` i `/api/benefits`, CORS pod adres frontendu.
- Formularz w kalkulatorze z walidacją zod jako wzorzec dla kolejnych ekranów.

## Stack

- Backend: Python, FastAPI, uvicorn, pydantic i pydantic-settings.
- Frontend: Vite, React 19, TypeScript, Tailwind v4, komponenty shadcn/ui, TanStack Query,
  axios, zod i yup, react-hook-form, zustand, react-router-dom.

Szczegóły w `back/README.md` i `front/README.md`.
