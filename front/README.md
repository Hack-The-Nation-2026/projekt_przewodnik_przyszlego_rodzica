# Frontend — Zasiłkowy Przewodnik Przyszłego Rodzica

Interfejs aplikacji: Vite, React, TypeScript, Tailwind v4 i komponenty w stylu shadcn/ui.

## Stack

| Warstwa | Wybór |
|---|---|
| Build | Vite 8 |
| UI | React 19, TypeScript 7 |
| Styl | Tailwind CSS v4, komponenty shadcn/ui |
| Dane z API | axios, TanStack Query |
| Formularze | react-hook-form z walidacją zod (yup też jest w projekcie) |
| Stan globalny | zustand |
| Routing | react-router-dom 7 |
| Ikony | lucide-react |

## Uruchomienie

```bash
cd front
npm install
cp .env.example .env
npm run dev
```

Aplikacja startuje na http://localhost:5173. Backend musi działać na adresie z `VITE_API_URL`.

## Skrypty

```bash
npm run dev      # serwer deweloperski
npm run build    # typecheck i build produkcyjny
npm run preview  # podgląd builda
npm run lint     # oxlint
```

## Struktura

```
front/src/
├── components/
│   ├── layout/     # nagłówek, stopka, kontener, układ strony
│   └── ui/         # komponenty bazowe w stylu shadcn
├── hooks/          # zapytania do API (TanStack Query)
├── lib/            # axios i pomocniki
├── pages/          # widoki podpięte w routerze
├── store/          # zustand
└── types/          # typy odpowiedzi API
```

## Kolory

Paleta nawiązuje do identyfikacji ZUS. Zielony `#007834` jest kolorem głównym, bursztynowy
`#e8a33d` rezerwujemy dla głównego wezwania do działania. Wszystkie tokeny są w `src/index.css`.

## Nowe komponenty shadcn

Plik `components.json` jest gotowy, więc kolejne komponenty dodasz jednym poleceniem:

```bash
npx shadcn@latest add dialog
```
