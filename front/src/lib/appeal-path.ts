import type { BenefitCode } from '@/lib/benefit-interview'
import { benefitList } from '@/lib/benefit-interview'

/**
 * Ścieżka po decyzji odmownej.
 *
 * Dwie rzeczy trzymają ten moduł uczciwym. Nie ocenia szans: ani procentu, ani
 * „masz duże widoki", bo to pierwsza rzecz, której szuka juror z ZUS. I nie
 * wymyśla terminów: pewny jest miesiąc na odwołanie od doręczenia decyzji,
 * a wszystko inne albo pochodzi z materiałów ZUS, albo ma znacznik
 * „do potwierdzenia".
 */
export type DisputeGround =
  | 'brak_ubezpieczenia'
  | 'krotki_okres'
  | 'podstawa_wymiaru'
  | 'nieuznane_dokumenty'
  | 'po_terminie'
  | 'inne'

export interface AppealAnswers {
  /** Jakiej sprawy dotyczy decyzja. */
  benefit: BenefitCode
  /** Data doręczenia, nie wystawienia: od niej liczy się termin. */
  deliveredOn: string
  ground: DisputeGround
  /** Czy użytkownik ma komplet dokumentów, które wtedy składał. */
  documents: 'yes' | 'no' | 'unknown'
  /** Numer decyzji, jeśli jest pod ręką. */
  decisionNumber: string
  /** Miejscowość do pisma i dane, których nie da się wyczytać z niczego. */
  place: string
  name: string
  address: string
}

export const emptyAppeal: AppealAnswers = {
  benefit: 'macierzynski',
  deliveredOn: '',
  ground: 'brak_ubezpieczenia',
  documents: 'unknown',
  decisionNumber: '',
  place: '',
  name: '',
  address: '',
}

export const groundLabels: Record<DisputeGround, string> = {
  brak_ubezpieczenia: 'ZUS twierdzi, że nie ma ubezpieczenia',
  krotki_okres: 'ZUS twierdzi, że okres ubezpieczenia jest zbyt krótki',
  podstawa_wymiaru: 'ZUS nie uznał podstawy wymiaru',
  nieuznane_dokumenty: 'ZUS nie uznał dokumentów',
  po_terminie: 'ZUS twierdzi, że wniosek złożono po terminie',
  inne: 'Inny powód',
}

export interface GroundDetails {
  /** Czego ZUS nie widzi. */
  whatZusMisses: string
  /** Co ZUS musiałby zobaczyć, żeby zmienić zdanie. */
  whatZusNeeds: string
  /** Zarzut do pisma. */
  claim: string
  /** Wnioski dowodowe, czyli o co wnosimy. */
  evidence: string[]
}

export const grounds: Record<DisputeGround, GroundDetails> = {
  brak_ubezpieczenia: {
    whatZusMisses: 'ZUS uważa, że w chwili powstania prawa nie było tytułu do ubezpieczenia chorobowego.',
    whatZusNeeds: 'Dowód, że płatnik zgłosił Cię do ubezpieczenia chorobowego albo że tytuł istnieje z mocy prawa.',
    claim: 'Zaskarżonej decyzji zarzucam błędne ustalenie stanu ubezpieczenia, mimo że podlegałem ubezpieczeniu chorobowemu.',
    evidence: [
      'zaświadczenie płatnika składek o zgłoszeniu do ubezpieczenia chorobowego',
      'kopia umowy albo innego dokumentu, który tworzy tytuł do ubezpieczenia',
      'wydruk z konta w PUE/eZUS z okresami podlegania ubezpieczeniu',
    ],
  },
  krotki_okres: {
    whatZusMisses: 'ZUS liczy okres ubezpieczenia inaczej niż Ty: pomija wcześniejsze tytuły albo zaczyna liczenie od nowa.',
    whatZusNeeds: 'Zestawienie wszystkich okresów ubezpieczenia chorobowego i wyjaśnienie, dlaczego należą się do wspólnego okresu.',
    claim: 'Zaskarżonej decyzji zarzucam błędne ustalenie okresu ubezpieczenia chorobowego i nieuwzględnienie wcześniejszych okresów.',
    evidence: [
      'zaświadczenia płatników z każdego okresu zatrudnienia',
      'wydruk z PUE/eZUS z pełnym zestawieniem okresów ubezpieczenia',
      'dokumenty o przerwie w ubezpieczeniu, jeśli ZUS liczy ją jako przerwanie okresu',
    ],
  },
  podstawa_wymiaru: {
    whatZusMisses: 'ZUS przyjął niższą kwotę podstawy wymiaru, niż wynika to z dokumentów płacowych.',
    whatZusNeeds: 'Dokumenty pokazujące kwotę, od której opłacano składki, i wskazanie, że podstawa została wykazana prawidłowo.',
    claim: 'Zaskarżonej decyzji zarzucam przyjęcie zaniżonej podstawy wymiaru składki, niezgodne z dokumentacją płacową.',
    evidence: [
      'zaświadczenie płatnika o wysokości podstawy wymiaru i opłaconych składkach',
      'dokumenty płacowe za okres, z którego liczy się podstawa',
      'wyjaśnienie płatnika, jeśli sam korygował dokumenty',
    ],
  },
  nieuznane_dokumenty: {
    whatZusMisses: 'ZUS uznał dokumenty za niepełne albo nieczytelne i dlatego nie potwierdził prawa do świadczenia.',
    whatZusNeeds: 'Komplet dokumentów w wersji, która nie budzi wątpliwości, plus wskazanie, które dokumenty już złożono.',
    claim: 'Zaskarżonej decyzji zarzucam uznanie dokumentów za niewystarczające, choć potwierdzają one prawo do świadczenia.',
    evidence: [
      'ponowne, czytelne zaświadczenie płatnika i kopia dokumentów już złożonych',
      'potwierdzenie złożenia dokumentów w ZUS, jeśli je przyjęto',
      'wyjaśnienie rozbieżności między dokumentami',
    ],
  },
  po_terminie: {
    whatZusMisses: 'ZUS twierdzi, że wniosek złożono za późno, więc świadczenie się nie należy albo należy w niższej stawce.',
    whatZusNeeds: 'Wykazanie, że termin został zachowany, albo że opóźnienie nie ma znaczenia dla tego świadczenia.',
    claim: 'Zaskarżonej decyzji zarzucam przyjęcie, że wniosek złożono po terminie, wbrew dokumentom potwierdzającym jego złożenie.',
    evidence: [
      'kopia wniosku z potwierdzeniem daty złożenia',
      'potwierdzenie nadania albo przyjęcia pisma przez płatnika lub ZUS',
      'korespondencja z płatnikiem o dacie przekazania dokumentów',
    ],
  },
  inne: {
    whatZusMisses: 'ZUS wskazał powód, który trzeba przeczytać dosłownie: to zdanie mówi, którego warunku brakuje.',
    whatZusNeeds: 'Dowód na ten konkretny warunek, wskazany w uzasadnieniu decyzji.',
    claim: 'Zaskarżonej decyzji zarzucam błędne ustalenie stanu faktycznego, sprzeczne z dołączonymi dokumentami.',
    evidence: [
      'dokument, który odpowiada wprost na powód podany w decyzji',
      'wyjaśnienie płatnika, jeśli decyzja opiera się na jego informacjach',
      'wszystkie dokumenty złożone w sprawie, dla porządku',
    ],
  },
}

/** Miesiąc, nie trzydzieści dni: termin liczy się od doręczenia decyzji. */
export function addMonth(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1, 1))
  target.setUTCMonth(target.getUTCMonth() + 1)
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return target.toISOString().slice(0, 10)
}

export interface AppealDeadline {
  date: string | null
  daysLeft: number | null
  missed: boolean
  /** Druga droga, gdy termin minął. */
  alternative: string
}

export function appealDeadline(answers: AppealAnswers, today = new Date().toISOString().slice(0, 10)): AppealDeadline {
  if (!answers.deliveredOn) {
    return { date: null, daysLeft: null, missed: false, alternative: '' }
  }
  const date = addMonth(answers.deliveredOn)
  const daysLeft = Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86_400_000)
  return {
    date,
    daysLeft,
    missed: daysLeft < 0,
    alternative: daysLeft < 0
      ? 'Odwołanie po terminie zwykle zostaje odrzucone, ale przy nowych dowodach zostaje wniosek o zmianę decyzji. Trzeba w nim wskazać dokumenty, których ZUS wcześniej nie miał, i wyjaśnić, dlaczego zmieniają ustalenia.'
      : '',
  }
}

export interface AppealDocumentGroup {
  title: string
  items: string[]
}

/** Lista dokumentów zależy od sporu, a nie jest uniwersalna. */
export function appealDocuments(answers: AppealAnswers): AppealDocumentGroup[] {
  const ground = grounds[answers.ground]
  const groups: AppealDocumentGroup[] = [
    { title: 'Do wniosku o odwołanie', items: ['kopia decyzji, którą zaskarżasz', 'kopia wniosku, który ZUS rozpatrzył'] },
    { title: 'Na powód podany przez ZUS', items: ground.evidence },
  ]
  if (answers.documents === 'no') {
    groups.push({
      title: 'Uzupełnij brakujące dokumenty',
      items: [
        'dokumenty, których nie miałeś przy pierwszym wniosku',
        'zaświadczenie płatnika w wersji, którą ZUS może zweryfikować',
      ],
    })
  }
  groups.push({
    title: 'Do potwierdzenia w ZUS',
    items: [
      'opłata od odwołania i ewentualne zwolnienie z kosztów — ustal z ZUS',
      'sposób doręczenia i liczba odpisów pisma — ustal z ZUS',
    ],
  })
  return groups
}

/** Pismo: zarzuty odpowiadają powodowi odmowy, nie są jednym tekstem na wszystko. */
export function appealLetter(answers: AppealAnswers, rawText = false): string[] {
  const ground = grounds[answers.ground]
  const deadline = appealDeadline(answers)
  const today = new Date().toISOString().slice(0, 10)
  const benefit = benefitList[answers.benefit].name.toLowerCase()
  const lines = [
    `${answers.place || '..............................'}, dnia ${rawText ? today : '....................'}`,
    answers.name || 'Imię i nazwisko',
    answers.address || 'Adres',
    '',
    'Zakład Ubezpieczeń Społecznych',
    'za pośrednictwem płatnika składek',
    '',
    'ODWOŁANIE OD DECYZJI',
    '',
    `Sprawa: ${benefit}`,
    `Decyzja nr ${answers.decisionNumber || '....................'}, doręczona dnia ${rawText ? answers.deliveredOn : '....................'}.`,
    '',
    'Odwołuję się od powyższej decyzji w całości.',
    '',
    'Zarzuty:',
    ground.claim,
    '',
    'Uzasadnienie:',
    `1. Decyzja wskazuje powód: ${groundLabels[answers.ground].toLowerCase()}.`,
    `2. ${ground.whatZusMisses}`,
    `3. ${ground.whatZusNeeds}`,
    `4. Wnoszę o przeprowadzenie dowodów z dokumentów wskazanych w załącznikach.`,
  ]
  if (deadline.date && !deadline.missed) {
    lines.push('', `Odwołanie składam w terminie: miesiąc od doręczenia decyzji upływa ${rawText ? deadline.date : '...'}.`)
  }
  if (deadline.missed) {
    lines.push('', 'Wnoszę także o rozważenie zmiany decyzji na podstawie nowych dowodów, które wskazuję w załącznikach.')
  }
  lines.push(
    '',
    'Wnioski dowodowe:',
    ...ground.evidence.map((item) => '- ' + item),
    '',
    'Załączniki:',
    '- kopia decyzji',
    '- kopia wniosku',
    ...ground.evidence.map((item) => '- ' + item),
    '',
    'Data i podpis: ........................................',
  )
  return lines
}

/** Co dalej po złożeniu: dwie drogi, bez oceny szans. */
export const nextSteps = [
  {
    title: 'ZUS uwzględnia odwołanie w całości albo częściowo',
    body: 'Wtedy zmienia albo uchyla decyzję i wydaje nową. Dostajesz ją pocztą. Sprawdź wtedy kwotę i okres, a jeśli nadal się nie zgadzają, wróć tutaj.',
  },
  {
    title: 'ZUS przekazuje sprawę do sądu okręgowego',
    body: 'Sąd rozpatruje odwołanie; to droga, która trwa dłużej. Terminy i przebieg sprawy zależą od sądu, więc tych liczb nie zgadujemy — potwierdź je w ZUS albo w sądzie.',
  },
]

export const appealHelpers = { groundLabels, addMonth }
