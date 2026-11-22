# Prezentacja Skrzydła Rodzica

Film na wyzwanie ZUS: 2 min 43 s, 1920×1080, 30 klatek na sekundę, bez dźwięku —
komentarz dogrywamy osobno.

Gotowy plik: `out/prezentacja.mp4`.

## Jak to powstaje

Film to prawdziwe nagrania z działającej aplikacji, nie makiety. Trzy kroki:

1. `scripts/record*.mjs` uruchamia Chrome przez Playwrighta, wstrzykuje kursor
   i przewija serwis, zapisując każdy rozdział jako osobny plik w `public/clips/`.
2. `src/edl.ts` opisuje montaż: które fragmenty nagrania wchodzą do filmu,
   jak szybko i gdzie w tym czasie patrzy kamera.
3. `src/` to projekt Remotiona, który składa nagrania w jedną całość
   i dokłada etykiety rozdziałów, planszę mobilną i napisy końcowe.

## Uruchomienie

```bash
npm install
node scripts/record.mjs all        # nagrania desktopowe (wymaga serwera na :5173)
node scripts/record-mobile.mjs     # nagranie widoku telefonu
npx remotion render src/index.ts SkrzydlaRodzica out/prezentacja.mp4 --codec h264 --crf 20
```

Nagrania i klatki kontrolne nie trafiają do repozytorium — odtwarzają się
skryptami z `scripts/`.

## Podgląd

```bash
npx remotion studio src/index.ts
```
