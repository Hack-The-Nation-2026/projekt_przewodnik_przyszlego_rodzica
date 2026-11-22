// Komentarz do filmu: składa ścieżkę dźwiękową i napisy z nagrania lektora.
//   node scripts/narracja.mjs
//
// Nagranie to jeden plik, w którym lektor czyta kolejne zdania bez przerw na
// montaż. Skrypt robi z niego ścieżkę dopasowaną do filmu:
//
// 1. Pomija nieudane podejście i zdanie "To się wytni", które lektor nagrał
//    między dwiema próbami tego samego akapitu.
// 2. Kładzie każde zdanie na początku sceny, którą opisuje (pole `kiedy`).
//    Mowa zostaje w swoim tempie, zmieniają się tylko pauzy między zdaniami,
//    więc komentarz wchodzi razem z obrazem, a nie obok niego.
// 3. Dzieli długie zdania na krótsze napisy i zapisuje je do src/napisy.ts
//    oraz do out/napisy.srt.

import { execFile } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = process.env.NARRACJA ?? '/home/mati/Documents/narracja.wav'
const WORK = '/tmp/opencode/narracja'
const OUT_MP3 = path.join(ROOT, 'public/narracja.mp3')
const OUT_CUES = path.join(ROOT, 'src/napisy.ts')
const OUT_SRT = path.join(ROOT, 'out/napisy.srt')

/** Film trwa 178,59 s. Komentarz musi się w tym zmieścić. */
const FILM = 178.59
/** Najkrótsza pauza między zdaniami, żeby nie zlewały się w jedno. */
const GAP = 0.3

/**
 * Zdania z nagrania. `od` i `do` to sekundy w pliku źródłowym, `kiedy` to
 * moment filmu, w którym lektor ma zacząć mówić. Nieudane podejście do
 * akapitu o odwołaniu (122,90 do 129,98) jest pominięte razem ze zdaniem
 * "To się wytni", które lektor powiedział po nim.
 */
const ZDANIA = [
  { od: 0.86, do: 4.54, kiedy: 0.9, tekst: 'Planujesz dziecko, ale obawiasz się, że ilość formalności Cię przytłoczy?' },
  { od: 5.12, do: 7.14, kiedy: 4.3, tekst: 'Skrzydła Rodzica to rozwiązanie dla Ciebie.' },
  { od: 7.34, do: 11.84, kiedy: 9.0, tekst: 'Aby uzyskać pełny dostęp do platformy, wystarczy zalogować się przez mObywatel.' },
  { od: 13.24, do: 21.84, kiedy: 15.0, tekst: 'Po zalogowaniu możesz skorzystać z kalkulatora świadczeń, który umożliwia szybkie i proste wprowadzenie wszystkich niezbędnych danych.' },
  { od: 24.38, do: 33.68, kiedy: 23.0, tekst: 'Na ich podstawie narzędzie oblicza i przedstawia przysługujące Ci świadczenia oraz wskazuje, jakie warunki należy jeszcze spełnić, aby otrzymać pozostałe.' },
  { od: 35.38, do: 41.44, kiedy: 33.5, tekst: 'Kalkulator prezentuje także podział urlopu rodzicielskiego z możliwością dostosowania liczby wspólnych tygodni.' },
  { od: 41.84, do: 49.86, kiedy: 42.5, tekst: 'Wybierając konkretne świadczenia dowiesz się, jak je uzyskać, jakie dokumenty przygotować oraz gdzie i kiedy należy je dostarczyć.' },
  { od: 57.68, do: 64.7, kiedy: 55.7, tekst: 'Platforma oferuje także rozbudowaną opcję dostępności, którą można dostosować do indywidualnych potrzeb użytkownika.' },
  { od: 66.04, do: 72.64, kiedy: 60.6, tekst: 'Dodatkowo możesz wygenerować gotową do wydruku kartę uprawnień, zawierającą najważniejsze informacje w jednym miejscu.' },
  { od: 73.02, do: 76.06, kiedy: 65.3, tekst: 'Taki dokument możesz na przykład przekazać swojemu pracodawcy.' },
  { od: 80.5, do: 87.28, kiedy: 70.0, tekst: 'Do Twojej dyspozycji jest również kreator wniosku urlopowego, dzięki któremu przygotujesz gotowy wniosek o urlop macierzyński.' },
  { od: 88.12, do: 97.26, kiedy: 80.0, tekst: 'Aplikacja zawiera także obszerną bazę spraw, umożliwiającą weryfikację ich zgodności z aktualnymi przepisami prawa oraz wynikami obliczeń kalkulatora.' },
  { od: 98.44, do: 102.36, kiedy: 96.0, tekst: 'Jeśli posiadasz konto PUE eZUS, możesz połączyć je z naszą platformą.' },
  { od: 106.88, do: 115.76, kiedy: 100.0, tekst: 'Nawet jeśli dopiero rozważasz rodzicielstwo, Skrzydła Rodzica pomogą Ci wcześniej zapoznać się z dostępnymi możliwościami i podjąć świadomą decyzję.' },
  { od: 116.98, do: 120.48, kiedy: 110.4, tekst: 'Możesz także sprawdzić, ile dni urlopu pozostało Ci do wykorzystania.' },
  { od: 129.98, do: 137.14, kiedy: 115.0, tekst: 'W przypadku otrzymania decyzji odmownej dotyczącej przyznania świadczenia aplikacja pomoże Ci również przygotować odwołanie.' },
  { od: 137.92, do: 145.78, kiedy: 124.8, tekst: 'Jeżeli w trakcie ciąży pojawi się komplikacja, znajdziesz tutaj szczegółowe informacje o dostępnych formach wsparcia w tej trudnej sytuacji.' },
  { od: 146.88, do: 154.58, kiedy: 132.8, tekst: 'Od strony technicznej przewidziano panel administratora, umożliwiający aktualizację platformy zgodnie z najnowszymi przepisami prawa.' },
  { od: 155.5, do: 161.92, kiedy: 137.0, tekst: 'Otrzymujesz również dostęp do interaktywnego asystenta AI, któremu możesz zadawać pytania dotyczące świadczeń.' },
  { od: 162.68, do: 166.42, kiedy: 142.0, tekst: 'Asystent pomoże Ci odnaleźć potrzebne informacje i wskaże, gdzie ich szukać.' },
  { od: 167.96, do: 176.96, kiedy: 156.6, tekst: 'Skrzydła Rodzica są dostępne także jako aplikacja mobilna, dzięki czemu możesz korzystać ze wszystkich funkcji w dowolnym miejscu i czasie, tak samo jak w wersji komputerowej.' },
  { od: 177.6, do: 182.14, kiedy: 173.9, tekst: 'Skrzydła Rodzica, Twój osobisty asystent do spraw świadczeń macierzyńskich.' },
]

const round = (value) => Math.round(value * 1000) / 1000

/**
 * Rozkłada zdania po kolei. Zdanie nie zaczyna się wcześniej niż w scenie,
 * którą opisuje, ani wcześniej niż chwilę po poprzednim, więc mowa nie
 * nachodzi na siebie i nie przeskakuje.
 */
function rozklad() {
  const wynik = []
  let koniec = 0
  for (const zdanie of ZDANIA) {
    const dlugosc = zdanie.do - zdanie.od
    const start = Math.max(zdanie.kiedy, koniec + (wynik.length ? GAP : 0))
    wynik.push({ ...zdanie, dlugosc, start, stop: start + dlugosc })
    koniec = start + dlugosc
  }
  return wynik
}

/** Krótsze napisy: długie zdanie dzielimy po przecinkach, czas idzie z długości tekstu. */
function naNapisy(zdania) {
  const napisy = []
  for (const zdanie of zdania) {
    const czesci = []
    let biezaca = ''
    for (const slowo of zdanie.tekst.split(' ')) {
      const kandydat = biezaca ? `${biezaca} ${slowo}` : slowo
      // Dwie linijki po około 46 znaków to tyle, ile da się przeczytać w locie.
      if (kandydat.length > 72 && biezaca) {
        czesci.push(biezaca)
        biezaca = slowo
      } else {
        biezaca = kandydat
      }
    }
    if (biezaca) czesci.push(biezaca)
    // Sierota na końcu, czyli jedno słowo na cały napis, wraca do poprzedniej linii.
    if (czesci.length > 1 && czesci.at(-1).length < 20) {
      czesci[czesci.length - 2] = `${czesci[czesci.length - 2]} ${czesci.at(-1)}`
      czesci.pop()
    }
    const razem = czesci.reduce((suma, czesc) => suma + czesc.length, 0)
    let czas = zdanie.start
    for (const czesc of czesci) {
      const udzial = zdanie.dlugosc * (czesc.length / razem)
      napisy.push({ od: round(czas), do: round(czas + udzial), tekst: czesc })
      czas += udzial
    }
  }
  return napisy
}

/** Sekundy na "00:00:04,540", jak wymaga SRT. */
function znacznik(sekundy) {
  const ms = Math.round(sekundy * 1000)
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0')
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0')
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
  const mss = String(ms % 1000).padStart(3, '0')
  return `${h}:${m}:${s},${mss}`
}

const zdania = rozklad()
const ostatnie = zdania.at(-1)
if (ostatnie.stop > FILM) {
  throw new Error(`Komentarz wychodzi za film o ${(ostatnie.stop - FILM).toFixed(2)} s`)
}

// Pauzy są ciszą, mowę przepisujemy bez zmian, więc tempo i barwa zostają.
await rm(WORK, { recursive: true, force: true })
await mkdir(WORK, { recursive: true })
await mkdir(path.dirname(OUT_MP3), { recursive: true })
await mkdir(path.dirname(OUT_SRT), { recursive: true })

const pliki = []
let kursor = 0
for (const [index, zdanie] of zdania.entries()) {
  const pauza = zdanie.start - kursor
  if (pauza > 0.01) {
    const plik = path.join(WORK, `pauza-${String(index).padStart(2, '0')}.wav`)
    await run('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-t', pauza.toFixed(3), '-c:a', 'pcm_s16le', plik, '-y'])
    pliki.push(plik)
  }
  const plik = path.join(WORK, `zdanie-${String(index).padStart(2, '0')}.wav`)
  await run('ffmpeg', ['-v', 'error', '-ss', zdanie.od.toFixed(3), '-to', zdanie.do.toFixed(3), '-i', SRC, '-c:a', 'pcm_s16le', '-ar', '44100', '-ac', '2', plik, '-y'])
  pliki.push(plik)
  kursor = zdanie.start + zdanie.dlugosc
}

const lista = path.join(WORK, 'lista.txt')
await writeFile(lista, pliki.map((plik) => `file '${plik}'`).join('\n'))
await run('ffmpeg', ['-v', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-c:a', 'libmp3lame', '-b:a', '160k', '-ar', '44100', OUT_MP3, '-y'])

const napisy = naNapisy(zdania)
await writeFile(
  OUT_CUES,
  `// Napisy do filmu. Plik generuje scripts/narracja.mjs z nagrania lektora.\n//\n// Czasy są w sekundach od początku filmu, a tekst dzieli się na tyle krótkich\n// odcinków, ile da się przeczytać w locie.\n\nexport type Napis = {\n  od: number\n  do: number\n  tekst: string\n}\n\nexport const napisy: Napis[] = ${JSON.stringify(napisy, null, 2)}\n`,
)
await writeFile(
  OUT_SRT,
  napisy
    .map((napis, index) => `${index + 1}\n${znacznik(napis.od)} --> ${znacznik(napis.do)}\n${napis.tekst}\n`)
    .join('\n'),
)

console.log(`ścieżka: ${path.relative(ROOT, OUT_MP3)}`)
console.log(`napisy: ${napisy.length} odcinków, ${path.relative(ROOT, OUT_SRT)}`)
for (const zdanie of zdania) {
  console.log(`  ${zdanie.start.toFixed(2).padStart(7)}  ${zdanie.stop.toFixed(2).padStart(7)}  ${zdanie.tekst.slice(0, 58)}`)
}
console.log(`koniec mowy ${ostatnie.stop.toFixed(2)} z ${FILM}`)
