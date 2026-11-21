import type { BenefitCode } from '@/lib/benefit-interview'
import type { DocumentContext } from '@/lib/benefit-document-context'
import type { InterviewValues } from '@/lib/interview-form'

const zus = 'https://www.zus.pl'
const maternitySource = zus + '/pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty'
const leaveSource = 'https://eli.gov.pl/eli/DU/2025/322/ogl'
export const payerSource = zus + '/swiadczenia/zasilki/zasilek-macierzynski/postepowanie-w-sprawie-zasilkow/platnicy-zasilku'
const claimsLimit = 'Roszczenie co do zasady przedawnia się po 6 miesiącach od ostatniego dnia okresu objętego świadczeniem.'
const fileBefore = 'Jeśli nie masz umowy o pracę, złóż wniosek o wypłatę przed rozpoczęciem wnioskowanego okresu.'

export type Role = InterviewValues['role']
export type Employment = InterviewValues['employment']
export type PayerSize = 'unknown' | 'up_to_20' | 'over_20'
export type Coverage = 'unknown' | 'active' | 'ended'
export type MaternityCase = 'standard' | 'before_birth' | 'takeover'

export interface DocumentOptions {
  role: Role
  employment: Employment
  payerSize: PayerSize
  coverage: Coverage
  maternityCase: MaternityCase
}

interface SourceLink {
  label: string
  url: string
}

export interface DocumentGuide {
  form: SourceLink
  officialGuide: SourceLink
  leave?: { title: string; notice: string }
  documents: string[]
  deadlines: string[]
}

export const leaveRegulation = { label: 'Wymogi wniosków urlopowych', url: leaveSource }

const zam = { label: 'ZAM', url: zus + '/-/wniosek-zas-54?redirect=%2Fwzory-formularzy%2Fzasilki%2Fzasilek-macierzynski' }
const maternityGuide = { label: 'Lista dokumentów ZUS', url: maternitySource }
const hospital = 'Zaświadczenie ze szpitala z okresami pobytu, tygodniem ciąży przy porodzie i masą urodzeniową dziecka.'
const childInfo = 'Dane dziecka i drugiego rodzica do ZAM. Przy wniosku urlopowym przygotuj też odpis aktu urodzenia, jeśli jest wymagany i nie ma go w dokumentacji pracodawcy.'
const adoptionDocs = 'Oświadczenie o dacie przyjęcia dziecka i zaświadczenie sądu o złożeniu wniosku o przysposobienie lub poświadczona przez sąd kopia wniosku, z datą urodzenia dziecka.'
const fosterDocs = 'Prawomocne orzeczenie o umieszczeniu dziecka w rodzinie zastępczej albo umowa ze starostą. Dołącz decyzję o odroczeniu obowiązku szkolnego, jeśli dotyczy.'
const rateDeadline = 'Wniosek o stawkę 81,5% złóż w ciągu 21 dni po porodzie albo po zdarzeniu dającym prawo przy przyjęciu dziecka. Stawka nie obejmuje nieprzenoszalnej części drugiego rodzica.'
const takeoverDeadline = 'Ojciec zatrudniony na umowę o pracę składa wniosek co najmniej 14 dni przed przejęciem urlopu. Przy zwykłej rezygnacji pracownica składa swój wniosek co najmniej 7 dni przed powrotem do pracy.'
const parentalDeadline = 'Wniosek o urlop rodzicielski złóż pracodawcy co najmniej 21 dni przed początkiem danej części urlopu.'
const supplementDeadline = 'Wniosek do pracodawcy złóż co najmniej 21 dni przed końcem urlopu macierzyńskiego. Uzupełniający wykorzystuje się bezpośrednio po nim.'
const paternityDeadline = 'Wniosek o urlop ojcowski złóż pracodawcy co najmniej 7 dni przed jego rozpoczęciem.'

export const documentRoles: Record<Role, string> = {
  mother: 'Matka dziecka',
  father: 'Ojciec dziecka',
  adoption: 'Rodzic adopcyjny',
  foster: 'Rodzic zastępczy',
}
export const documentEmployment: Record<Employment, string> = {
  unknown: 'Nie wiem',
  employee: 'Umowa o pracę',
  contractor: 'Umowa zlecenia',
  self_employed: 'Działalność gospodarcza',
  other: 'Inny tytuł ubezpieczenia',
}

export function getBenefitPayer(benefit: BenefitCode, options: DocumentOptions) {
  if (benefit === 'w_wysokosci_macierzynskiego' || options.employment === 'self_employed' || options.coverage === 'ended') return 'zus'
  if (options.payerSize === 'up_to_20') return 'zus'
  if (options.payerSize === 'over_20' && options.coverage === 'active') return 'payer'
  return 'unknown'
}

export function getDocumentGuide(benefit: BenefitCode, options: DocumentOptions, context?: DocumentContext): DocumentGuide {
  const { role, coverage, employment, maternityCase } = options
  const placement = role === 'adoption' || role === 'foster'
  const childDocs = role === 'adoption' ? adoptionDocs : role === 'foster' ? fosterDocs : childInfo
  const payer = getBenefitPayer(benefit, options)
  const payerCertificate = employment === 'employee' ? 'Z-3' : employment === 'contractor' ? 'Z-3a' : 'Z-3 albo Z-3a, zależnie od tytułu ubezpieczenia'
  const certificate = payer === 'payer' || employment === 'self_employed' ? [] : [
    (payer === 'unknown' ? 'Jeśli świadczenie wypłaca ZUS: ' : '') +
      'zaświadczenie płatnika składek ' + payerCertificate + ', przekazywane przez płatnika.',
  ]
  const postInsurance = coverage === 'ended' ? ['Oświadczenie Z-10 za okres po ustaniu ubezpieczenia.'] : []
  const nonEmployeeDeadline = employment === 'employee' ? [] : [fileBefore]
  const employee = employment === 'employee' || employment === 'unknown'
  const leaveAllowed = employee && coverage !== 'ended'
  const afterEmploymentBirth = benefit === 'macierzynski' && role === 'mother' && coverage === 'ended'
    ? [
      'Zaświadczenie lekarskie potwierdzające ciążę w czasie zatrudnienia, jeśli prawo wynika z ustania zatrudnienia w ciąży.',
      context?.endReason === 'unlawful_court_ruling'
        ? 'Prawomocne orzeczenie sądu potwierdzające rozwiązanie stosunku pracy z naruszeniem prawa.'
        : 'W zależności od przyczyny ustania pracy: dokument potwierdzający tę przyczynę lub prawomocne orzeczenie sądu. Przy umowie przedłużonej do porodu sprawdź dane u płatnika.',
    ]
    : []

  if (benefit === 'chorobowy_w_ciazy') {
    return {
      form: { label: 'ZAS-53', url: zus + '/pl/-/zaswiadczenie-zas-53?redirect=%2Fpl%2Fwzory-formularzy%2Fzasilki%2Fzasilek-chorobowy' },
      officialGuide: { label: 'Lista dokumentów ZUS', url: zus + '/pl/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/niezbedne-dokumenty' },
      documents: [
        'e-ZLA z kodem B albo e-ZLA i odrębne zaświadczenie potwierdzające ciążę. Jeśli zwolnienie jest tylko na papierze, przekaż je płatnikowi.',
        payer === 'payer' ? 'Przy e-ZLA udostępnionym płatnikowi zwykle nie składasz osobnego wniosku.'
          : 'Gdy wypłaca ZUS, zgłoszeniem może być ZAS-53, wydruk e-ZLA albo zaświadczenie płatnika zależnie od sytuacji. Przy działalności złóż ZAS-53.',
        ...certificate, ...postInsurance,
      ],
      deadlines: ['Przekaż wymagane dokumenty po wystawieniu zwolnienia.', claimsLimit],
    }
  }
  if (benefit === 'rehabilitacyjne') {
    return {
      form: { label: 'ZNp-7', url: zus + '/-/oswiadczenie-zus-np-7' },
      officialGuide: { label: 'Lista dokumentów ZUS', url: zus + '/swiadczenia/zasilki/swiadczenie-rehabilitacyjne/z-ubezpieczenia-chorobowego/niezbedne-dokumenty' },
      documents: [
        'Wniosek ZNp-7 oraz OL-9 od lekarza leczącego.',
        'Wywiad zawodowy OL-10 z miejsca pracy, poza wyjątkami takimi jak działalność, kolejny okres świadczenia lub niezdolność powstała po ustaniu ubezpieczenia.',
        ...certificate.map((item) => item + ' Dotychczasowe zaświadczenie wystarczy, jeśli dane się nie zmieniły.'),
        ...postInsurance,
      ],
      deadlines: ['Złóż komplet w ZUS co najmniej 6 tygodni przed wyczerpaniem okresu zasiłkowego, aby zachować ciągłość wypłat.', claimsLimit],
    }
  }
  if (benefit === 'w_wysokosci_macierzynskiego') {
    return {
      form: { label: 'ZAS-55', url: zus + '/-/wnioski-zas-55' },
      officialGuide: { label: 'Instrukcja złożenia w ZUS', url: zus + '/-/jak-uzyskac-zasilek-w-wysokosci-zasilku-macierzynskiego' },
      documents: [
        'Wniosek ZAS-55 z oświadczeniem o braku zapewnionego innego zatrudnienia.',
        'Zaświadczenie lekarskie potwierdzające ciążę w czasie zatrudnienia.',
        'Świadectwo pracy lub inny dokument potwierdzający ustanie stosunku pracy z powodu śmierci pracodawcy, upadłości albo likwidacji.',
        'Zaświadczenie płatnika Z-3 do ustalenia podstawy świadczenia.',
      ],
      deadlines: ['Wniosek dotyczy okresu po ustaniu zatrudnienia do dnia przed porodem.', claimsLimit],
    }
  }
  if (benefit === 'uzupelniajacy') {
    return {
      form: zam,
      officialGuide: maternityGuide,
      leave: leaveAllowed ? { title: 'uzupełniający urlop macierzyński', notice: supplementDeadline } : undefined,
      documents: [
        hospital,
        'Oświadczenie, że drugi rodzic nie skorzysta z urlopu uzupełniającego ani odpowiadającego mu zasiłku.',
        'Jeśli poprzedni okres pobierał drugi rodzic, dołącz potwierdzenie okresu wypłaty przez jego płatnika i dokumenty dotyczące dziecka.',
        employment === 'employee' ? 'Wniosek o urlop i potwierdzenie okresu jego udzielenia przez pracodawcę, jeśli wypłaca ZUS.'
          : 'Wniosek ZAM o wypłatę za wnioskowany okres, gdy nie korzystasz z urlopu pracowniczego.',
        ...(placement ? [childDocs] : []), ...certificate,
      ],
      deadlines: [
        ...(employee ? [supplementDeadline] : []),
        ...(employment === 'employee' ? [] : ['Poza umową o pracę złóż ZAM przed zakończeniem podstawowego okresu pobierania macierzyńskiego. Podaj datę jego zakończenia.']),
      ],
    }
  }
  if (benefit === 'rodzicielski') {
    return {
      form: zam,
      officialGuide: maternityGuide,
      leave: leaveAllowed ? { title: 'urlop rodzicielski', notice: parentalDeadline } : undefined,
      documents: [
        childDocs,
        'Informacja o wykorzystanych okresach i częściach oraz oświadczenie o tym, czy i kiedy drugi rodzic będzie korzystał w tym samym czasie.',
        context?.zaZyciem ? 'Zaświadczenie „Za życiem”: kopia do wniosku o urlop w zwiększonym wymiarze oraz oświadczenie o posiadaniu zaświadczenia do zasiłku.'
          : 'Jeśli korzystasz ze zwiększonego wymiaru, dołącz dokument dotyczący zaświadczenia „Za życiem”.',
        'Jeśli ZUS wypłaca zasiłek pracownikowi, płatnik potwierdza okres udzielonego urlopu.',
        'Jeśli poprzedni okres pobierał drugi rodzic, przygotuj potwierdzenie okresu, liczby części i stawki jego zasiłku.',
        ...(context?.workingOnLeave ? ['Potwierdzenie od pracodawcy okresu i wymiaru pracy, także w części o wydłużonym wymiarze urlopu, jeżeli dotyczy.'] : []),
        ...certificate,
      ],
      deadlines: [
        ...(employee ? [parentalDeadline] : []), ...nonEmployeeDeadline,
        ...((role === 'mother' || placement) ? [rateDeadline] : []),
        ...(context?.workingOnLeave ? ['Przy łączeniu z pracą złóż również wniosek o łączenie urlopu z pracą co najmniej 21 dni przed jej rozpoczęciem.'] : []),
      ],
    }
  }
  if (benefit === 'ojcowski') {
    return {
      form: zam,
      officialGuide: maternityGuide,
      leave: leaveAllowed ? { title: 'urlop ojcowski', notice: paternityDeadline } : undefined,
      documents: [
        role === 'adoption' ? 'Prawomocne postanowienie sądu o przysposobieniu dziecka.' : childDocs,
        'Oświadczenie o tym, czy i w jakim zakresie wykorzystano już ojcowski lub pobrano za ten okres zasiłek z innego tytułu.',
        'Jeśli ZUS wypłaca zasiłek pracownikowi, płatnik potwierdza okres udzielonego urlopu.',
        ...certificate,
      ],
      deadlines: [
        ...(employee ? [paternityDeadline] : []), ...nonEmployeeDeadline,
        'Ojcowski należy wykorzystać przed ukończeniem przez dziecko 12 miesięcy albo, przy adopcji, w ciągu 12 miesięcy od uprawomocnienia postanowienia, przed ukończeniem 14 lat przez dziecko.',
      ],
    }
  }

  const transfer = maternityCase === 'takeover'
  const beforeBirth = maternityCase === 'before_birth'
  const leave = !leaveAllowed ? undefined
    : transfer ? { title: 'pozostałą część urlopu macierzyńskiego', notice: takeoverDeadline }
      : beforeBirth ? { title: 'część urlopu macierzyńskiego przed porodem', notice: 'Złóż przed rozpoczęciem urlopu wraz z zaświadczeniem o przewidywanej dacie porodu.' }
        : placement ? { title: 'urlop na warunkach urlopu macierzyńskiego', notice: 'Złóż pracodawcy w ciągu 7 dni od zdarzenia dającego prawo do urlopu.' }
          : undefined

  return {
    form: zam,
    officialGuide: maternityGuide,
    leave,
    documents: [
      beforeBirth ? 'Zaświadczenie lekarskie o przewidywanej dacie porodu.' : childDocs,
      ...(transfer ? [
        'Wniosek ojca, oświadczenie matki o rezygnacji z pozostałego okresu i informacja o okresie wykorzystanym przed porodem.',
        'Jeśli wypłacają różni płatnicy, przygotuj potwierdzenie okresu i stawki zasiłku wypłacanego matce.',
      ] : []),
      ...(leaveAllowed && role === 'mother' && maternityCase === 'standard'
        ? ['Urlop macierzyński pracownicy rozpoczyna się z dniem porodu. Zgłoś urodzenie pracodawcy, aby ustalił urlop i przekazał wymagane dane.'] : []),
      ...afterEmploymentBirth, ...certificate,
    ],
    deadlines: [
      ...(leave ? [leave.notice] : []),
      ...(transfer && employment !== 'employee' ? ['Przy przejęciu zasiłku poza umową o pracę złóż ZAM przed rozpoczęciem pobierania.'] : []),
      ...(role === 'mother' || placement ? [rateDeadline] : []),
      claimsLimit,
    ],
  }
}

export const formatDocumentDate = (value: string) =>
  new Intl.DateTimeFormat('pl-PL', { timeZone: 'UTC', dateStyle: 'long' }).format(new Date(value + 'T00:00:00Z'))

export function shiftDate(value: string, days: number) {
  const date = new Date(value + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
