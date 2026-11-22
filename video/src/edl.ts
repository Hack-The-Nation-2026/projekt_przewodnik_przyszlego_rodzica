export type CameraKey = {
  /** Czas w sekundach od początku sceny. */
  t: number
  /** Powiększenie kadru. 1 = cały ekran. */
  z: number
  /** Punkt, na którym trzyma się kamera, we współrzędnych nagrania 1920×1080. */
  x: number
  y: number
}

export type Scene = {
  id: string
  clip: string
  /** Początek i koniec wycinka w nagraniu, w sekundach. */
  from: number
  to: number
  /** Przyspieszenie nagrania. 1 = normalnie. */
  rate?: number
  label?: string
  camera: CameraKey[]
  /** Kadr z telefonu pokazujemy w ramce, nie na pełnym ekranie. */
  kind?: 'screen' | 'mobile'
}

/** Montaż: kolejność rozdziałów, wycinki z nagrań i ruch kamery. */
export const scenes: Scene[] = [
  {
    id: 'home',
    clip: '01-home-login',
    from: 0.4,
    to: 4.9,
    label: 'Skrzydła Rodzica',
    camera: [
      { t: 0, z: 1.0, x: 960, y: 540 },
      { t: 4.5, z: 1.08, x: 820, y: 470 },
    ],
  },
  {
    id: 'wejscie',
    clip: '01-home-login',
    from: 5.4,
    to: 7.4,
    label: 'Wejście do serwisu',
    camera: [
      { t: 0, z: 1.02, x: 960, y: 540 },
      { t: 2, z: 1.05, x: 930, y: 520 },
    ],
  },
  {
    id: 'mobywatel',
    clip: '01-home-login',
    from: 8.5,
    to: 13.7,
    label: 'Logowanie przez mObywatel',
    camera: [
      { t: 0, z: 1.0, x: 960, y: 540 },
      { t: 5.2, z: 1.06, x: 960, y: 520 },
    ],
  },
  {
    id: 'dane',
    clip: '01-home-login',
    from: 14.4,
    to: 18.7,
    label: 'Dane z konta',
    camera: [
      { t: 0, z: 1.06, x: 960, y: 520 },
      { t: 4.3, z: 1.13, x: 950, y: 540 },
    ],
  },
  {
    id: 'wywiad',
    clip: '02-kalkulator',
    from: 2.4,
    to: 28.4,
    rate: 1.35,
    label: 'Wywiad o sytuacji',
    camera: [
      { t: 0, z: 1.05, x: 960, y: 460 },
      { t: 6, z: 1.14, x: 960, y: 430 },
      { t: 13, z: 1.18, x: 960, y: 450 },
    ],
  },
  {
    id: 'wynik',
    clip: '02-kalkulator',
    from: 28.8,
    to: 36.4,
    label: 'Wynik wywiadu',
    camera: [
      { t: 0, z: 1.0, x: 960, y: 540 },
      { t: 3.2, z: 1.14, x: 900, y: 600 },
      { t: 7.6, z: 1.08, x: 900, y: 600 },
    ],
  },
  {
    id: 'podzial',
    clip: '02-kalkulator',
    from: 37.4,
    to: 48.6,
    label: 'Podział urlopu rodzicielskiego',
    camera: [
      { t: 0, z: 1.06, x: 960, y: 430 },
      { t: 4, z: 1.2, x: 960, y: 400 },
      { t: 7.5, z: 1.28, x: 960, y: 500 },
      { t: 11.2, z: 1.16, x: 960, y: 520 },
    ],
  },
  {
    id: 'dokumenty-modal',
    clip: '02-kalkulator',
    from: 49.6,
    to: 58.9,
    label: 'Dokumenty i terminy',
    camera: [
      { t: 0, z: 1.0, x: 960, y: 540 },
      { t: 2.2, z: 1.16, x: 960, y: 480 },
      { t: 9, z: 1.2, x: 960, y: 490 },
    ],
  },
  {
    id: 'dokumenty',
    clip: '03-dokumenty',
    from: 3.4,
    to: 11.2,
    rate: 1.15,
    label: 'Kreator dokumentów',
    camera: [
      { t: 0, z: 1.04, x: 960, y: 500 },
      { t: 3.4, z: 1.09, x: 960, y: 480 },
      { t: 6.8, z: 1.05, x: 960, y: 500 },
    ],
  },
  {
    id: 'dokumenty-2',
    clip: '03-dokumenty',
    from: 21.2,
    to: 30.4,
    rate: 1.15,
    label: 'Co złożyć i gdzie',
    camera: [
      { t: 0, z: 1.02, x: 960, y: 480 },
      { t: 4, z: 1.1, x: 960, y: 500 },
      { t: 8, z: 1.06, x: 960, y: 560 },
    ],
  },
  {
    id: 'sprawy',
    clip: '04-sprawy',
    from: 2.8,
    to: 8.5,
    rate: 1.1,
    label: 'Sprawy testowe',
    camera: [
      { t: 0, z: 1.0, x: 960, y: 540 },
      { t: 3, z: 1.06, x: 880, y: 520 },
      { t: 5.2, z: 1.02, x: 880, y: 520 },
    ],
  },
  {
    id: 'sprawy-2',
    clip: '04-sprawy',
    from: 9.0,
    to: 17.5,
    rate: 1.15,
    label: 'Porównanie z decyzją',
    camera: [
      { t: 0, z: 1.04, x: 960, y: 500 },
      { t: 3.5, z: 1.24, x: 960, y: 470 },
      { t: 7.4, z: 1.1, x: 960, y: 490 },
    ],
  },
  {
    id: 'zus',
    clip: '05-zus',
    from: 4.4,
    to: 13.0,
    label: 'Symulacja ZUS',
    camera: [
      { t: 0, z: 1.05, x: 960, y: 470 },
      { t: 3.4, z: 1.2, x: 960, y: 450 },
      { t: 8.6, z: 1.12, x: 960, y: 460 },
    ],
  },
  {
    id: 'zus-2',
    clip: '05-zus',
    from: 13.8,
    to: 21.5,
    rate: 1.2,
    label: 'e-ZLA i PUE/eZUS',
    camera: [
      { t: 0, z: 1.02, x: 960, y: 500 },
      { t: 4, z: 1.08, x: 960, y: 470 },
      { t: 7.7, z: 1.04, x: 960, y: 500 },
    ],
  },
  {
    id: 'zus-3',
    clip: '05-zus',
    from: 24.4,
    to: 29.4,
    rate: 1.15,
    label: 'Odpis aktu urodzenia i przekierowania',
    camera: [
      { t: 0, z: 1.03, x: 960, y: 500 },
      { t: 5, z: 1.1, x: 960, y: 480 },
    ],
  },
  {
    id: 'wsparcie',
    clip: '06-wsparcie',
    from: 2.4,
    to: 7.3,
    label: 'Wsparcie w trudnych sytuacjach',
    camera: [
      { t: 0, z: 1.04, x: 960, y: 480 },
      { t: 4.9, z: 1.08, x: 960, y: 470 },
    ],
  },
  {
    id: 'wsparcie-2',
    clip: '06-wsparcie',
    from: 8.0,
    to: 15.6,
    rate: 1.15,
    label: 'Organizacje i zasady',
    camera: [
      { t: 0, z: 1.03, x: 960, y: 480 },
      { t: 6.6, z: 1.1, x: 960, y: 520 },
    ],
  },
  {
    id: 'panel',
    clip: '07-panel',
    from: 4.6,
    to: 10.0,
    label: 'Panel administracyjny',
    camera: [
      { t: 0, z: 1.05, x: 960, y: 470 },
      { t: 1.6, z: 1.2, x: 960, y: 450 },
      { t: 5.4, z: 1.16, x: 960, y: 450 },
    ],
  },
  {
    id: 'panel-2',
    clip: '07-panel',
    from: 15.6,
    to: 23.0,
    rate: 1.25,
    label: 'Funkcje bez wdrożenia',
    camera: [
      { t: 0, z: 1.03, x: 960, y: 500 },
      { t: 6.4, z: 1.08, x: 960, y: 520 },
    ],
  },
  {
    id: 'asystent',
    clip: '08-asystent',
    from: 8.6,
    to: 19.0,
    label: 'Asystent nawigacyjny',
    camera: [
      { t: 0, z: 1.0, x: 960, y: 540 },
      { t: 3, z: 1.12, x: 1080, y: 560 },
      { t: 6.5, z: 1.16, x: 1088, y: 580 },
      { t: 10.4, z: 1.16, x: 1088, y: 600 },
    ],
  },
  {
    id: 'asystent-2',
    clip: '08-asystent',
    from: 19.2,
    to: 27.0,
    rate: 1.15,
    label: 'Asystent prowadzi do strony',
    camera: [
      { t: 0, z: 1.12, x: 1040, y: 600 },
      { t: 4.5, z: 1.05, x: 1000, y: 560 },
      { t: 6.8, z: 1.0, x: 960, y: 540 },
    ],
  },
  {
    id: 'swiadczenia',
    clip: '09-swiadczenia',
    from: 3.9,
    to: 8.8,
    label: 'Katalog świadczeń',
    camera: [
      { t: 0, z: 1.04, x: 960, y: 520 },
      { t: 4.9, z: 1.08, x: 960, y: 500 },
    ],
  },
  {
    id: 'mobile',
    kind: 'mobile',
    clip: '10-mobile',
    from: 0.6,
    to: 7.6,
    label: 'Ten sam serwis na telefonie',
    camera: [],
  },
]

export const sceneDuration = (scene: Scene, fps: number) =>
  Math.round(((scene.to - scene.from) / (scene.rate ?? 1)) * fps)