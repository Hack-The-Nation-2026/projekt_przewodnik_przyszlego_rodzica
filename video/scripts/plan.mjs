import { readFile, writeFile } from 'node:fs/promises'

/**
 * Montaż opisany raz, w jednym miejscu. Każda scena mówi, z którego nagrania
 * bierze obraz i gdzie się zaczyna:
 *
 *   { mark: 'slider', seconds: 6, rate: 1.2 } od znacznika, zadana długość na ekranie
 *   { mark: 'wynik', until: 'why', tail: 0.5 } od znacznika do znacznika
 *   { from: 12.4, to: 20.1, rate: 1.1 } konkretny wycinek nagrania
 *
 * `lead` przesuwa początek względem znacznika (może być ujemny), `tail` cofa
 * koniec przed następnym znacznikiem. `seconds` to czas na ekranie, więc wycinek
 * źródłowy to `seconds * rate`.
 *
 * Kamera: `t` w sekundach od początku sceny, `z` to powiększenie, `x`/`y` to punkt
 * kadru w nagraniu 1920×1080. Zbliżamy tylko tam, gdzie jest na co patrzeć.
 */

// prettier-ignore
const PLAN = [
  // Wejście, logowanie i dane
  { id: 'home', clip: '01-main', mark: 'start', until: 'wejscie', tail: 2.9, rate: 1.5,
    camera: [{ t: 0, z: 1, x: 960, y: 540 }, { t: 3, z: 1.05, x: 940, y: 500 }, { t: 6.6, z: 1.02, x: 950, y: 540 }] },
  { id: 'wejscie', clip: '01-main', mark: 'wejscie', lead: -2.5, until: 'mobywatel', tail: 3.6, rate: 1.5,
    camera: [{ t: 0, z: 1.02, x: 960, y: 540 }, { t: 3.4, z: 1.07, x: 930, y: 560 }] },
  { id: 'mobywatel', clip: '01-main', mark: 'mobywatel', lead: -0.3, until: 'dane', tail: 3.3, rate: 1.45,
    camera: [{ t: 0, z: 1.04, x: 960, y: 540 }, { t: 2.6, z: 1.12, x: 960, y: 520 }, { t: 5.2, z: 1.06, x: 960, y: 540 }] },
  { id: 'dane', clip: '01-main', mark: 'dane', until: 'wywiad', tail: 4.2, rate: 1.6,
    camera: [{ t: 0, z: 1.03, x: 960, y: 520 }, { t: 2.4, z: 1.3, x: 1350, y: 300 }, { t: 4.4, z: 1.3, x: 1350, y: 300 }, { t: 6.2, z: 1.04, x: 960, y: 560 }] },

  // Wywiad: trzy pytania z listą wyboru
  // Każde ujęcie startuje chwilę przed otwarciem listy, więc widać i pytanie,
  // i rozwijane opcje. Znaczniki stawia sam recorder, tuż przed kliknięciem.
  { id: 'wywiad-role', clip: '01-main', mark: 'wyb-rola', lead: -0.7, seconds: 3.4, rate: 1.25,
    camera: [{ t: 0, z: 1.04, x: 900, y: 520 }, { t: 0.7, z: 1.3, x: 740, y: 560 }, { t: 2.6, z: 1.3, x: 740, y: 560 }, { t: 3.4, z: 1.07, x: 900, y: 540 }] },
  { id: 'wywiad-praca', clip: '01-main', mark: 'wyb-praca', lead: -0.7, seconds: 3.4, rate: 1.25,
    camera: [{ t: 0, z: 1.04, x: 900, y: 470 }, { t: 0.7, z: 1.3, x: 760, y: 490 }, { t: 2.6, z: 1.3, x: 760, y: 490 }, { t: 3.4, z: 1.06, x: 900, y: 510 }] },
  { id: 'wywiad-rodzic', clip: '01-main', mark: 'wyb-rodzic', lead: -0.7, seconds: 3.4, rate: 1.25,
    camera: [{ t: 0, z: 1.04, x: 900, y: 470 }, { t: 0.7, z: 1.3, x: 760, y: 490 }, { t: 2.6, z: 1.3, x: 760, y: 490 }, { t: 3.4, z: 1.06, x: 900, y: 510 }] },

  // Wynik, uzasadnienie, podział urlopu
  { id: 'wynik', clip: '01-main', mark: 'wynik', until: 'why', tail: 0.6, rate: 1.4,
    camera: [{ t: 0, z: 1, x: 960, y: 540 }, { t: 2.4, z: 1.06, x: 960, y: 430 }, { t: 5.2, z: 1.04, x: 960, y: 450 }] },
  { id: 'dlaczego', clip: '01-main', mark: 'why', lead: 0.9, until: 'slider', tail: 2.6, rate: 1.5,
    camera: [{ t: 0, z: 1.02, x: 960, y: 540 }, { t: 2, z: 1.08, x: 960, y: 500 }, { t: 4.2, z: 1.03, x: 960, y: 520 }] },
  { id: 'podzial', clip: '01-main', mark: 'slider', lead: -0.5, until: 'dokumenty-dialog', tail: 1.6, rate: 1.25,
    camera: [{ t: 0, z: 1.03, x: 960, y: 470 }, { t: 2.4, z: 1.13, x: 960, y: 460 }, { t: 4.2, z: 1.15, x: 960, y: 470 }, { t: 6.2, z: 1.05, x: 960, y: 540 }] },

  // Dokumenty z karty, dostępność i karta uprawnień
  { id: 'dokumenty-karta', clip: '01-main', mark: 'dokumenty-dialog', lead: 1.4, until: 'a11y', tail: 4.2, rate: 1.5,
    camera: [{ t: 0, z: 1, x: 960, y: 540 }, { t: 1.8, z: 1.1, x: 960, y: 470 }, { t: 5, z: 1.08, x: 960, y: 510 }] },
  { id: 'dostepnosc', clip: '01-main', mark: 'a11y', lead: -0.6, until: 'czytanie', tail: 3.3, rate: 1.6,
    camera: [{ t: 0, z: 1.02, x: 960, y: 470 }, { t: 1.5, z: 1.3, x: 1320, y: 380 }, { t: 3.4, z: 1.3, x: 1320, y: 380 }, { t: 4.9, z: 1.06, x: 1080, y: 450 }] },
  { id: 'karta', clip: '01-main', mark: 'karta', lead: 2.2, until: '__koniec', tail: 2.6, rate: 1.6,
    camera: [{ t: 0, z: 1, x: 960, y: 540 }, { t: 2.2, z: 1.05, x: 900, y: 470 }, { t: 5, z: 1.03, x: 900, y: 500 }, { t: 7.6, z: 1, x: 960, y: 540 }] },

  // Kreator wniosku
  { id: 'wnioski-lista', clip: '02-wnioski', mark: 'body', lead: 2.2, seconds: 4.6, rate: 1.5,
    camera: [{ t: 0, z: 1.02, x: 960, y: 500 }, { t: 2.2, z: 1.06, x: 900, y: 520 }, { t: 4.6, z: 1.03, x: 900, y: 520 }] },
  { id: 'wnioski-pismo', clip: '02-wnioski', mark: 'body', lead: 9.6, seconds: 5, rate: 1.6,
    camera: [{ t: 0, z: 1.02, x: 960, y: 470 }, { t: 2.4, z: 1.08, x: 960, y: 450 }, { t: 5, z: 1.04, x: 960, y: 490 }] },

  // Kreator dokumentów: lista świadczeń i kroki
  { id: 'dokumenty-lista', clip: '03-dokumenty', mark: 'body', lead: 2.4, seconds: 4.8, rate: 1.5,
    camera: [{ t: 0, z: 1.03, x: 960, y: 470 }, { t: 1.3, z: 1.35, x: 960, y: 620 }, { t: 3.4, z: 1.35, x: 960, y: 620 }, { t: 4.8, z: 1.05, x: 960, y: 500 }] },
  { id: 'dokumenty-kroki', clip: '03-dokumenty', mark: 'body', lead: 10.6, seconds: 5.2, rate: 1.75,
    camera: [{ t: 0, z: 1.02, x: 960, y: 470 }, { t: 2.6, z: 1.08, x: 960, y: 450 }, { t: 5.2, z: 1.03, x: 960, y: 490 }] },

  // Sprawy: zestaw przykładowy ZUS i porównanie z decyzją
  { id: 'sprawy-skan', clip: '04-sprawy', mark: 'body', lead: 2.4, seconds: 6, rate: 1.6,
    camera: [{ t: 0, z: 1.02, x: 960, y: 460 }, { t: 2.2, z: 1.3, x: 1080, y: 650 }, { t: 4.8, z: 1.3, x: 1080, y: 650 }, { t: 6, z: 1.04, x: 960, y: 520 }] },
  { id: 'sprawy-porownanie', clip: '05-sprawy-porownanie', mark: 'body', lead: 2.6, seconds: 4.6, rate: 1.6,
    camera: [{ t: 0, z: 1.02, x: 960, y: 480 }, { t: 2.6, z: 1.08, x: 960, y: 460 }, { t: 4.6, z: 1.03, x: 960, y: 500 }] },

  // ZUS: odpis aktu urodzenia
  { id: 'zus-odpis', clip: '06-zus', mark: 'body', lead: 23, seconds: 4.4, rate: 1.55,
    camera: [{ t: 0, z: 1.03, x: 960, y: 500 }, { t: 1.2, z: 1.45, x: 1190, y: 530 }, { t: 3.2, z: 1.45, x: 1190, y: 530 }, { t: 4.4, z: 1.06, x: 960, y: 520 }] },

  // Planowanie ciąży: pytania i lista przygotowań
  { id: 'planowanie', clip: '07-planowanie', mark: 'body', lead: 2.2, seconds: 6, rate: 1.8,
    camera: [{ t: 0, z: 1.02, x: 960, y: 470 }, { t: 3.2, z: 1.09, x: 960, y: 450 }, { t: 5.2, z: 1.04, x: 960, y: 480 }, { t: 6, z: 1.03, x: 960, y: 500 }] },

  // Urlop w trakcie: formularz i postęp
  { id: 'urlop-formularz', clip: '08-urlop', mark: 'body', lead: 2.4, seconds: 4.6, rate: 1.7,
    camera: [{ t: 0, z: 1.02, x: 960, y: 470 }, { t: 2.4, z: 1.09, x: 960, y: 450 }, { t: 4.6, z: 1.03, x: 960, y: 490 }] },
  { id: 'urlop-postep', clip: '08-urlop', mark: 'body', lead: 15.8, seconds: 4.4, rate: 1.8,
    camera: [{ t: 0, z: 1.02, x: 960, y: 470 }, { t: 2.6, z: 1.08, x: 960, y: 450 }, { t: 4.4, z: 1.03, x: 960, y: 490 }] },

  // Odwołanie: decyzja i zarzuty
  { id: 'odwolanie-decyzja', clip: '09-odwolanie', mark: 'body', lead: 2.4, seconds: 4.8, rate: 1.7,
    camera: [{ t: 0, z: 1.02, x: 960, y: 470 }, { t: 2.4, z: 1.09, x: 960, y: 450 }, { t: 4.8, z: 1.03, x: 960, y: 490 }] },
  { id: 'odwolanie-zarzuty', clip: '09-odwolanie', mark: 'body', lead: 14.6, seconds: 5.2, rate: 1.8,
    camera: [{ t: 0, z: 1.02, x: 960, y: 480 }, { t: 2.6, z: 1.08, x: 960, y: 460 }, { t: 5.2, z: 1.03, x: 960, y: 500 }] },

  // Wsparcie: miejsca pomocy
  { id: 'wsparcie-karty', clip: '10-wsparcie', mark: 'body', lead: 0.5, seconds: 3.8, rate: 1.35,
    camera: [{ t: 0, z: 1.02, x: 960, y: 480 }, { t: 2, z: 1.08, x: 960, y: 460 }, { t: 3.8, z: 1.03, x: 960, y: 500 }] },
  { id: 'wsparcie-pomoc', clip: '10-wsparcie', mark: 'body', lead: 7.1, seconds: 4, rate: 1.5,
    camera: [{ t: 0, z: 1.02, x: 960, y: 470 }, { t: 2, z: 1.08, x: 960, y: 450 }, { t: 4, z: 1.03, x: 960, y: 490 }] },

  // Panel administracyjny
  { id: 'panel', clip: '11-panel', mark: 'body', lead: 2.6, seconds: 4.4, rate: 1.6,
    camera: [{ t: 0, z: 1.02, x: 960, y: 470 }, { t: 2.2, z: 1.09, x: 960, y: 450 }, { t: 4.4, z: 1.03, x: 960, y: 490 }] },

  // Asystent: pytanie i odpowiedź
  { id: 'asystent-pytanie', clip: '12-asystent', mark: 'body', lead: 3.6, seconds: 5, rate: 1.6,
    camera: [{ t: 0, z: 1.05, x: 1500, y: 720 }, { t: 2, z: 1.55, x: 1520, y: 740 }, { t: 5, z: 1.5, x: 1520, y: 740 }] },
  { id: 'asystent-odpowiedz', clip: '12-asystent', mark: 'body', lead: 14.4, seconds: 5.4, rate: 1.7,
    camera: [{ t: 0, z: 1.05, x: 1500, y: 710 }, { t: 2.6, z: 1.55, x: 1520, y: 720 }, { t: 5.4, z: 1.5, x: 1520, y: 710 }] },

  // Telefon: realne użycie
  { id: 'mobile-home', clip: '13-mobile-home', mark: 'body', lead: 1.4, seconds: 5, rate: 1.35, kind: 'mobile',
    title: 'Wejście i menu',
    caption: 'Nagłówek zwija się do jednego przycisku, a nawigacja otwiera się jako lista pod nim.' },
  { id: 'mobile-swiadczenia', clip: '14-mobile-swiadczenia', mark: 'body', lead: 1.4, seconds: 5, rate: 1.35, kind: 'mobile',
    title: 'Katalog świadczeń',
    caption: 'Filtry skracają listę, a każda karta świadczenia mieści się w jednej kolumnie.' },
  { id: 'mobile-dokumenty', clip: '17-mobile-dokumenty', mark: 'body', lead: 2.4, seconds: 5.6, rate: 1.45, kind: 'mobile',
    title: 'Kreator dokumentów',
    caption: 'Ta sama lista wyboru i te same kroki, tylko w jednej kolumnie.' },
  { id: 'mobile-karta', clip: '15-mobile-karta', mark: 'body', lead: 1.4, seconds: 5.6, rate: 1.4, kind: 'mobile',
    title: 'Karta uprawnień',
    caption: 'Strona z kwotami i terminami, gotowa do pokazania w kadrach albo w ZUS.' },
  { id: 'mobile-asystent', clip: '16-mobile-asystent', mark: 'body', lead: 0.8, seconds: 5, rate: 1.3, kind: 'mobile',
    title: 'Asystent w kieszeni',
    caption: 'Pytanie zadane kciukiem, a odpowiedź prowadzi wprost na właściwy ekran.' },
];

const TAKES = ['01-main', '02-wnioski', '03-dokumenty', '04-sprawy', '05-sprawy-porownanie',
  '06-zus', '07-planowanie', '08-urlop', '09-odwolanie', '10-wsparcie', '11-panel', '12-asystent',
  '13-mobile-home', '14-mobile-swiadczenia', '15-mobile-karta', '16-mobile-asystent', '17-mobile-dokumenty']

const marks = {}
for (const name of TAKES) {
  try {
    marks[name] = JSON.parse(await readFile(`out/marks-${name}.json`, 'utf8'))
  } catch {
    /* brak nagrania, więc scena wypadnie z montażu */
  }
}

const round = (value) => Number(value.toFixed(2))
const problems = []
const scenes = []

for (const scene of PLAN) {
  const table = marks[scene.clip]
  if (!table) {
    problems.push(`${scene.id}: brak nagrania ${scene.clip}`)
    continue
  }
  const end = table.__koniec
  let from
  let to
  if (scene.from != null && scene.to != null) {
    from = scene.from
    to = scene.to
  } else {
    if (table[scene.mark] == null) {
      problems.push(`${scene.id}: brak znacznika ${scene.mark} w ${scene.clip}`)
      continue
    }
    from = table[scene.mark] + (scene.lead ?? 0)
    if (scene.until != null) {
      if (table[scene.until] == null) {
        problems.push(`${scene.id}: brak znacznika ${scene.until} w ${scene.clip}`)
        continue
      }
      to = table[scene.until] - (scene.tail ?? 0.5)
    } else {
      to = from + scene.seconds * (scene.rate ?? 1)
    }
  }
  from = Math.max(0, round(from))
  to = round(to)
  if (to <= from) {
    problems.push(`${scene.id}: wycinek pusty (${from} → ${to})`)
    continue
  }
  if (end != null && to > end + 0.05) problems.push(`${scene.id}: wycinek do ${to}s, a nagranie ma ${end}s`)
  scenes.push({ ...scene, from, to, seconds: round((to - from) / (scene.rate ?? 1)) })
}

// Plansze z adresem demo i kodem QR stoją na obu końcach filmu i nie pochodzą
// z nagrania, więc mają własne tempo. Cztery sekundy na wejściu, pięć na końcu,
// gdzie kod zostaje na ekranie najdłużej.
const INTRO_SECONDS = 4
const OUTRO_SECONDS = 5
scenes.unshift({ id: 'intro', kind: 'intro', from: 0, to: INTRO_SECONDS, seconds: INTRO_SECONDS })
scenes.push({ id: 'outro', kind: 'outro', from: 0, to: OUTRO_SECONDS, seconds: OUTRO_SECONDS })

const render = (scene) => {
  const camera = scene.camera ?? [{ t: 0, z: 1, x: 960, y: 540 }]
  const framed = scene.kind != null && scene.kind !== 'screen'
  return [
    '  {',
    `    id: '${scene.id}',`,
    scene.kind === 'mobile' ? "    kind: 'mobile'," : null,
    scene.kind === 'intro' ? "    kind: 'intro'," : null,
    scene.kind === 'outro' ? "    kind: 'outro'," : null,
    scene.clip ? `    clip: '${scene.clip}',` : null,
    `    from: ${scene.from},`,
    `    to: ${scene.to},`,
    scene.rate && scene.rate !== 1 ? `    rate: ${scene.rate},` : null,
    scene.title ? `    title: ${JSON.stringify(scene.title)},` : null,
    scene.caption ? `    caption: ${JSON.stringify(scene.caption)},` : null,
    `    // ${scene.seconds}s`,
    framed
      ? null
      : `    camera: [\n${camera.map((key) => `      { t: ${key.t}, z: ${key.z}, x: ${key.x}, y: ${key.y} },`).join('\n')}\n    ],`,
    '  },',
  ]
    .filter(Boolean)
    .join('\n')
}

const header = `export type CameraKey = {
  /** Czas w sekundach od początku sceny. */
  t: number
  /** Powiększenie kadru. 1 = całe nagranie. */
  z: number
  /** Punkt, na którym trzyma się kamera, we współrzędnych nagrania 1920×1080. */
  x: number
  y: number
}

export type Scene = {
  id: string
  /** Plik nagrania bez rozszerzenia, z katalogu public/clips. Karty z kodem QR nie mają nagrania. */
  clip?: string
  /** Początek i koniec wycinka w nagraniu, w sekundach. */
  from: number
  to: number
  /** Przyspieszenie nagrania. 1 = normalnie. */
  rate?: number
  /** Kadr z telefonu pokazujemy w ramce, a plansze z kodem QR nie mają nagrania. */
  kind?: 'screen' | 'mobile' | 'intro' | 'outro'
  /** Tylko dla scen mobilnych: nagłówek i zdanie opisu. */
  title?: string
  caption?: string
  camera?: CameraKey[]
}

/** Montaż: kolejność rozdziałów, wycinki z nagrań i ruch kamery. */
export const scenes: Scene[] = [
`

const footer = `]

export const sceneDuration = (scene: Scene, fps: number) =>
  Math.round(((scene.to - scene.from) / (scene.rate ?? 1)) * fps)
`

await writeFile('src/edl.ts', header + scenes.map(render).join('\n') + '\n' + footer)

const byClip = {}
for (const scene of scenes) {
  if (!scene.clip) continue
  byClip[scene.clip] = (byClip[scene.clip] ?? 0) + scene.seconds
}
const total = scenes.reduce((sum, scene) => sum + scene.seconds, 0)
console.log(`${scenes.length} scen, ${total.toFixed(1)}s`)
for (const [clip, seconds] of Object.entries(byClip)) console.log(`  ${clip.padEnd(22)} ${seconds.toFixed(1)}s`)
for (const problem of problems) console.log(`  ! ${problem}`)
