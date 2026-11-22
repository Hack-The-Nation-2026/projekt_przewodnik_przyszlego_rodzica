export type CameraKey = {
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
  /** Plik nagrania bez rozszerzenia, z katalogu public/clips. Nie ma go karta końcowa. */
  clip?: string
  /** Początek i koniec wycinka w nagraniu, w sekundach. */
  from: number
  to: number
  /** Przyspieszenie nagrania. 1 = normalnie. */
  rate?: number
  /** Kadr z telefonu pokazujemy w ramce, a karta końcowa nie ma nagrania. */
  kind?: 'screen' | 'mobile' | 'outro'
  /** Tylko dla scen mobilnych: nagłówek i zdanie opisu. */
  title?: string
  caption?: string
  camera?: CameraKey[]
}

/** Montaż: kolejność rozdziałów, wycinki z nagrań i ruch kamery. */
export const scenes: Scene[] = [
  {
    id: 'home',
    clip: '01-main',
    from: 3.7,
    to: 11,
    rate: 1.5,
    // 4.87s
    camera: [
      { t: 0, z: 1, x: 960, y: 540 },
      { t: 3, z: 1.05, x: 940, y: 500 },
      { t: 6.6, z: 1.02, x: 950, y: 540 },
    ],
  },
  {
    id: 'wejscie',
    clip: '01-main',
    from: 11.4,
    to: 17.1,
    rate: 1.5,
    // 3.8s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 540 },
      { t: 3.4, z: 1.07, x: 930, y: 560 },
    ],
  },
  {
    id: 'mobywatel',
    clip: '01-main',
    from: 20.4,
    to: 26.6,
    rate: 1.45,
    // 4.28s
    camera: [
      { t: 0, z: 1.04, x: 960, y: 540 },
      { t: 2.6, z: 1.12, x: 960, y: 520 },
      { t: 5.2, z: 1.06, x: 960, y: 540 },
    ],
  },
  {
    id: 'dane',
    clip: '01-main',
    from: 29.9,
    to: 38.9,
    rate: 1.6,
    // 5.63s
    camera: [
      { t: 0, z: 1.03, x: 960, y: 520 },
      { t: 2.4, z: 1.3, x: 1350, y: 300 },
      { t: 4.4, z: 1.3, x: 1350, y: 300 },
      { t: 6.2, z: 1.04, x: 960, y: 560 },
    ],
  },
  {
    id: 'wywiad-role',
    clip: '01-main',
    from: 42.8,
    to: 47.05,
    rate: 1.25,
    // 3.4s
    camera: [
      { t: 0, z: 1.04, x: 900, y: 520 },
      { t: 0.7, z: 1.3, x: 740, y: 560 },
      { t: 2.6, z: 1.3, x: 740, y: 560 },
      { t: 3.4, z: 1.07, x: 900, y: 540 },
    ],
  },
  {
    id: 'wywiad-praca',
    clip: '01-main',
    from: 69.9,
    to: 74.15,
    rate: 1.25,
    // 3.4s
    camera: [
      { t: 0, z: 1.04, x: 900, y: 470 },
      { t: 0.7, z: 1.3, x: 760, y: 490 },
      { t: 2.6, z: 1.3, x: 760, y: 490 },
      { t: 3.4, z: 1.06, x: 900, y: 510 },
    ],
  },
  {
    id: 'wywiad-rodzic',
    clip: '01-main',
    from: 82.8,
    to: 87.05,
    rate: 1.25,
    // 3.4s
    camera: [
      { t: 0, z: 1.04, x: 900, y: 470 },
      { t: 0.7, z: 1.3, x: 760, y: 490 },
      { t: 2.6, z: 1.3, x: 760, y: 490 },
      { t: 3.4, z: 1.06, x: 900, y: 510 },
    ],
  },
  {
    id: 'wynik',
    clip: '01-main',
    from: 114.4,
    to: 121.8,
    rate: 1.4,
    // 5.29s
    camera: [
      { t: 0, z: 1, x: 960, y: 540 },
      { t: 2.4, z: 1.06, x: 960, y: 430 },
      { t: 5.2, z: 1.04, x: 960, y: 450 },
    ],
  },
  {
    id: 'dlaczego',
    clip: '01-main',
    from: 123.3,
    to: 129.7,
    rate: 1.5,
    // 4.27s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 540 },
      { t: 2, z: 1.08, x: 960, y: 500 },
      { t: 4.2, z: 1.03, x: 960, y: 520 },
    ],
  },
  {
    id: 'podzial',
    clip: '01-main',
    from: 131.8,
    to: 140.2,
    rate: 1.25,
    // 6.72s
    camera: [
      { t: 0, z: 1.03, x: 960, y: 470 },
      { t: 2.4, z: 1.13, x: 960, y: 460 },
      { t: 4.2, z: 1.15, x: 960, y: 470 },
      { t: 6.2, z: 1.05, x: 960, y: 540 },
    ],
  },
  {
    id: 'dokumenty-karta',
    clip: '01-main',
    from: 143.2,
    to: 152.9,
    rate: 1.5,
    // 6.47s
    camera: [
      { t: 0, z: 1, x: 960, y: 540 },
      { t: 1.8, z: 1.1, x: 960, y: 470 },
      { t: 5, z: 1.08, x: 960, y: 510 },
    ],
  },
  {
    id: 'dostepnosc',
    clip: '01-main',
    from: 156.5,
    to: 164.3,
    rate: 1.6,
    // 4.88s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 470 },
      { t: 1.5, z: 1.3, x: 1320, y: 380 },
      { t: 3.4, z: 1.3, x: 1320, y: 380 },
      { t: 4.9, z: 1.06, x: 1080, y: 450 },
    ],
  },
  {
    id: 'karta',
    clip: '01-main',
    from: 177.3,
    to: 185,
    rate: 1.6,
    // 4.81s
    camera: [
      { t: 0, z: 1, x: 960, y: 540 },
      { t: 2.2, z: 1.05, x: 900, y: 470 },
      { t: 5, z: 1.03, x: 900, y: 500 },
      { t: 7.6, z: 1, x: 960, y: 540 },
    ],
  },
  {
    id: 'wnioski-lista',
    clip: '02-wnioski',
    from: 44.6,
    to: 51.5,
    rate: 1.5,
    // 4.6s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 500 },
      { t: 2.2, z: 1.06, x: 900, y: 520 },
      { t: 4.6, z: 1.03, x: 900, y: 520 },
    ],
  },
  {
    id: 'wnioski-pismo',
    clip: '02-wnioski',
    from: 52,
    to: 60,
    rate: 1.6,
    // 5s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 470 },
      { t: 2.4, z: 1.08, x: 960, y: 450 },
      { t: 5, z: 1.04, x: 960, y: 490 },
    ],
  },
  {
    id: 'dokumenty-lista',
    clip: '03-dokumenty',
    from: 6.5,
    to: 13.7,
    rate: 1.5,
    // 4.8s
    camera: [
      { t: 0, z: 1.03, x: 960, y: 470 },
      { t: 1.3, z: 1.35, x: 960, y: 620 },
      { t: 3.4, z: 1.35, x: 960, y: 620 },
      { t: 4.8, z: 1.05, x: 960, y: 500 },
    ],
  },
  {
    id: 'dokumenty-kroki',
    clip: '03-dokumenty',
    from: 14.7,
    to: 23.8,
    rate: 1.75,
    // 5.2s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 470 },
      { t: 2.6, z: 1.08, x: 960, y: 450 },
      { t: 5.2, z: 1.03, x: 960, y: 490 },
    ],
  },
  {
    id: 'sprawy-skan',
    clip: '04-sprawy',
    from: 7.9,
    to: 19.1,
    rate: 1.6,
    // 7s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 460 },
      { t: 2.2, z: 1.3, x: 1080, y: 650 },
      { t: 4.8, z: 1.3, x: 1080, y: 650 },
      { t: 7, z: 1.04, x: 960, y: 520 },
    ],
  },
  {
    id: 'sprawy-porownanie',
    clip: '05-sprawy-porownanie',
    from: 8.7,
    to: 17.34,
    rate: 1.6,
    // 5.4s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 480 },
      { t: 2.6, z: 1.08, x: 960, y: 460 },
      { t: 5.4, z: 1.03, x: 960, y: 500 },
    ],
  },
  {
    id: 'zus-odpis',
    clip: '06-zus',
    from: 27.3,
    to: 34.12,
    rate: 1.55,
    // 4.4s
    camera: [
      { t: 0, z: 1.03, x: 960, y: 500 },
      { t: 1.2, z: 1.45, x: 1190, y: 530 },
      { t: 3.2, z: 1.45, x: 1190, y: 530 },
      { t: 4.4, z: 1.06, x: 960, y: 520 },
    ],
  },
  {
    id: 'planowanie',
    clip: '07-planowanie',
    from: 7.6,
    to: 20.2,
    rate: 1.8,
    // 7s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 470 },
      { t: 3.2, z: 1.09, x: 960, y: 450 },
      { t: 5.2, z: 1.04, x: 960, y: 480 },
      { t: 7, z: 1.03, x: 960, y: 500 },
    ],
  },
  {
    id: 'urlop-formularz',
    clip: '08-urlop',
    from: 7.4,
    to: 15.22,
    rate: 1.7,
    // 4.6s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 470 },
      { t: 2.4, z: 1.09, x: 960, y: 450 },
      { t: 4.6, z: 1.03, x: 960, y: 490 },
    ],
  },
  {
    id: 'urlop-postep',
    clip: '08-urlop',
    from: 20.8,
    to: 29.8,
    rate: 1.8,
    // 5s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 470 },
      { t: 2.6, z: 1.08, x: 960, y: 450 },
      { t: 5, z: 1.03, x: 960, y: 490 },
    ],
  },
  {
    id: 'odwolanie-decyzja',
    clip: '09-odwolanie',
    from: 7.5,
    to: 15.66,
    rate: 1.7,
    // 4.8s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 470 },
      { t: 2.4, z: 1.09, x: 960, y: 450 },
      { t: 4.8, z: 1.03, x: 960, y: 490 },
    ],
  },
  {
    id: 'odwolanie-zarzuty',
    clip: '09-odwolanie',
    from: 19.7,
    to: 29.06,
    rate: 1.8,
    // 5.2s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 480 },
      { t: 2.6, z: 1.08, x: 960, y: 460 },
      { t: 5.2, z: 1.03, x: 960, y: 500 },
    ],
  },
  {
    id: 'wsparcie-karty',
    clip: '10-wsparcie',
    from: 5.3,
    to: 10.43,
    rate: 1.35,
    // 3.8s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 480 },
      { t: 2, z: 1.08, x: 960, y: 460 },
      { t: 3.8, z: 1.03, x: 960, y: 500 },
    ],
  },
  {
    id: 'wsparcie-pomoc',
    clip: '10-wsparcie',
    from: 11.9,
    to: 17.9,
    rate: 1.5,
    // 4s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 470 },
      { t: 2, z: 1.08, x: 960, y: 450 },
      { t: 4, z: 1.03, x: 960, y: 490 },
    ],
  },
  {
    id: 'panel',
    clip: '11-panel',
    from: 7.5,
    to: 14.54,
    rate: 1.6,
    // 4.4s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 470 },
      { t: 2.2, z: 1.09, x: 960, y: 450 },
      { t: 4.4, z: 1.03, x: 960, y: 490 },
    ],
  },
  {
    id: 'asystent-pytanie',
    clip: '12-asystent',
    from: 9.9,
    to: 17.9,
    rate: 1.6,
    // 5s
    camera: [
      { t: 0, z: 1.05, x: 1500, y: 720 },
      { t: 2, z: 1.55, x: 1520, y: 740 },
      { t: 5, z: 1.5, x: 1520, y: 740 },
    ],
  },
  {
    id: 'asystent-odpowiedz',
    clip: '12-asystent',
    from: 20.7,
    to: 29.88,
    rate: 1.7,
    // 5.4s
    camera: [
      { t: 0, z: 1.05, x: 1500, y: 710 },
      { t: 2.6, z: 1.55, x: 1520, y: 720 },
      { t: 5.4, z: 1.5, x: 1520, y: 710 },
    ],
  },
  {
    id: 'mobile-home',
    kind: 'mobile',
    clip: '13-mobile-home',
    from: 5.4,
    to: 12.15,
    rate: 1.35,
    title: "Wejście i menu",
    caption: "Nagłówek zwija się do jednego przycisku, a nawigacja otwiera się jako lista pod nim.",
    // 5s
  },
  {
    id: 'mobile-swiadczenia',
    kind: 'mobile',
    clip: '14-mobile-swiadczenia',
    from: 5.1,
    to: 11.85,
    rate: 1.35,
    title: "Katalog świadczeń",
    caption: "Filtry skracają listę, a każda karta świadczenia mieści się w jednej kolumnie.",
    // 5s
  },
  {
    id: 'mobile-dokumenty',
    kind: 'mobile',
    clip: '17-mobile-dokumenty',
    from: 5.8,
    to: 13.92,
    rate: 1.45,
    title: "Kreator dokumentów",
    caption: "Ta sama lista wyboru i te same kroki, tylko w jednej kolumnie.",
    // 5.6s
  },
  {
    id: 'mobile-karta',
    kind: 'mobile',
    clip: '15-mobile-karta',
    from: 7.3,
    to: 15.14,
    rate: 1.4,
    title: "Karta uprawnień",
    caption: "Strona z kwotami i terminami, gotowa do pokazania w kadrach albo w ZUS.",
    // 5.6s
  },
  {
    id: 'mobile-asystent',
    kind: 'mobile',
    clip: '16-mobile-asystent',
    from: 4.3,
    to: 10.8,
    rate: 1.3,
    title: "Asystent w kieszeni",
    caption: "Pytanie zadane kciukiem, a odpowiedź prowadzi wprost na właściwy ekran.",
    // 5s
  },
  {
    id: 'outro',
    kind: 'outro',
    from: 0,
    to: 5,
    // 5s
  },
]

export const sceneDuration = (scene: Scene, fps: number) =>
  Math.round(((scene.to - scene.from) / (scene.rate ?? 1)) * fps)
