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
  /** Plik nagrania bez rozszerzenia, z katalogu public/clips. */
  clip: string
  /** Początek i koniec wycinka w nagraniu, w sekundach. */
  from: number
  to: number
  /** Przyspieszenie nagrania. 1 = normalnie. */
  rate?: number
  /** Kadr z telefonu pokazujemy w ramce, obok krótkiego opisu. */
  kind?: 'screen' | 'mobile'
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
    from: 3,
    to: 10.3,
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
    from: 10.7,
    to: 16,
    rate: 1.5,
    // 3.53s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 540 },
      { t: 3.4, z: 1.07, x: 930, y: 560 },
    ],
  },
  {
    id: 'mobywatel',
    clip: '01-main',
    from: 19.3,
    to: 24.7,
    rate: 1.45,
    // 3.72s
    camera: [
      { t: 0, z: 1.04, x: 960, y: 540 },
      { t: 2.6, z: 1.12, x: 960, y: 520 },
      { t: 5.2, z: 1.06, x: 960, y: 540 },
    ],
  },
  {
    id: 'dane',
    clip: '01-main',
    from: 28,
    to: 35.3,
    rate: 1.6,
    // 4.56s
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
    from: 39.2,
    to: 43.45,
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
    from: 62.7,
    to: 66.95,
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
    from: 73.8,
    to: 78.05,
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
    from: 101.7,
    to: 108.4,
    rate: 1.4,
    // 4.79s
    camera: [
      { t: 0, z: 1, x: 960, y: 540 },
      { t: 2.4, z: 1.06, x: 960, y: 430 },
      { t: 5.2, z: 1.04, x: 960, y: 450 },
    ],
  },
  {
    id: 'dlaczego',
    clip: '01-main',
    from: 109.9,
    to: 115.2,
    rate: 1.5,
    // 3.53s
    camera: [
      { t: 0, z: 1.02, x: 960, y: 540 },
      { t: 2, z: 1.08, x: 960, y: 500 },
      { t: 4.2, z: 1.03, x: 960, y: 520 },
    ],
  },
  {
    id: 'podzial',
    clip: '01-main',
    from: 117.3,
    to: 124.2,
    rate: 1.25,
    // 5.52s
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
    from: 127.2,
    to: 135.7,
    rate: 1.5,
    // 5.67s
    camera: [
      { t: 0, z: 1, x: 960, y: 540 },
      { t: 1.8, z: 1.1, x: 960, y: 470 },
      { t: 5, z: 1.08, x: 960, y: 510 },
    ],
  },
  {
    id: 'dostepnosc',
    clip: '01-main',
    from: 139.3,
    to: 146,
    rate: 1.6,
    // 4.19s
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
    from: 158.9,
    to: 166.4,
    rate: 1.6,
    // 4.69s
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
    from: 37.6,
    to: 44.5,
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
    from: 45,
    to: 53,
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
    from: 6.2,
    to: 13.4,
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
    from: 14.4,
    to: 23.5,
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
    from: 7,
    to: 18.2,
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
    from: 8.2,
    to: 16.84,
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
    from: 27.2,
    to: 34.02,
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
    from: 6.7,
    to: 19.3,
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
    from: 6.6,
    to: 14.42,
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
    from: 20,
    to: 29,
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
    from: 7,
    to: 15.16,
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
    from: 19.2,
    to: 28.56,
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
    from: 4.5,
    to: 9.63,
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
    from: 11.1,
    to: 17.1,
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
    from: 6.6,
    to: 13.64,
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
    from: 9.3,
    to: 17.3,
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
    from: 20.1,
    to: 29.28,
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
    from: 4.6,
    to: 11.35,
    rate: 1.35,
    title: "Wejście i menu",
    caption: "Nagłówek zwija się do jednego przycisku, a nawigacja otwiera się jako lista pod nim.",
    // 5s
  },
  {
    id: 'mobile-swiadczenia',
    kind: 'mobile',
    clip: '14-mobile-swiadczenia',
    from: 4.5,
    to: 11.25,
    rate: 1.35,
    title: "Katalog świadczeń",
    caption: "Filtry skracają listę, a każda karta świadczenia mieści się w jednej kolumnie.",
    // 5s
  },
  {
    id: 'mobile-dokumenty',
    kind: 'mobile',
    clip: '17-mobile-dokumenty',
    from: 5.7,
    to: 13.82,
    rate: 1.45,
    title: "Kreator dokumentów",
    caption: "Ta sama lista wyboru i te same kroki, tylko w jednej kolumnie.",
    // 5.6s
  },
  {
    id: 'mobile-karta',
    kind: 'mobile',
    clip: '15-mobile-karta',
    from: 6.7,
    to: 14.54,
    rate: 1.4,
    title: "Karta uprawnień",
    caption: "Strona z kwotami i terminami, gotowa do pokazania w kadrach albo w ZUS.",
    // 5.6s
  },
  {
    id: 'mobile-asystent',
    kind: 'mobile',
    clip: '16-mobile-asystent',
    from: 3.9,
    to: 10.4,
    rate: 1.3,
    title: "Asystent w kieszeni",
    caption: "Pytanie zadane kciukiem, a odpowiedź prowadzi wprost na właściwy ekran.",
    // 5s
  },
]

export const sceneDuration = (scene: Scene, fps: number) =>
  Math.round(((scene.to - scene.from) / (scene.rate ?? 1)) * fps)
