import type { Assessment, BenefitCode, ParentalPool } from '@/lib/benefit-interview'
import { benefitList } from '@/lib/benefit-interview'
import type { DocumentContext } from '@/lib/benefit-document-context'
import { isFamilyBenefit } from '@/lib/benefit-document-context'
import { formatDocumentDate, getBenefitPayer, getDocumentGuide, shiftDate } from '@/lib/benefit-documents'
import type { DocumentOptions, PayerSize } from '@/lib/benefit-documents'
import type { InterviewValues } from '@/lib/interview-form'
import { parseNumber } from '@/lib/interview-form'

/**
 * Wnioski urlopowe piszemy sami, bo ZUS nie publikuje ich wzorów: to pisma do
 * pracodawcy, nie formularze urzędowe. Bierzemy wynik wywiadu, a użytkownik
 * decyduje tylko o tym, czego nie da się wyczytać z odpowiedzi.
 */
export interface LeaveCase {
  values: InterviewValues
  assessments: Assessment[]
  context: DocumentContext
  pool: ParentalPool | null
}

export interface LeaveDecision {
  id: string
  label: string
  hint: string
  type: 'text' | 'date' | 'number'
  required?: boolean
  /** Wartość podpowiedziana z wywiadu, jeśli da się ją wyliczyć. */
  prefill?: string
}

export interface LeaveCheck {
  ok: boolean
  message: string
}

export interface LeaveApplication {
  code: string
  title: string
  benefit: BenefitCode
  /** Jedno zdanie: co załatwia. */
  settles: string
  /** Kiedy trzeba złożyć. */
  when: string
  /** Co się stanie, jeśli złoży się za późno. */
  late: string
  addressee: string
  period: { start: string; end: string } | null
  days: number | null
  decisions: LeaveDecision[]
  attachments: string[]
  checks: (decisions: Record<string, string>) => LeaveCheck[]
  /** Treść pisma, linia po linii, gotowa do wydruku. */
  letter: (decisions: Record<string, string>) => string[]
  documentName: string
}

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', useGrouping: 'always' })

/** Pismo kończy się tak samo w każdym wniosku, więc składamy je z kawałków. */
const SIGNATURE = ['', 'Data i podpis: ........................................']

export function saveLeaveCase(leaveCase: LeaveCase) {
  sessionStorage.setItem('leave-case', JSON.stringify(leaveCase))
}

export function readLeaveCase(): LeaveCase | null {
  const raw = sessionStorage.getItem('leave-case')
  if (!raw) return null
  try {
    return JSON.parse(raw) as LeaveCase
  } catch {
    return null
  }
}

function optionsOf(context: DocumentContext): DocumentOptions {
  const coverage = context.insuranceEnd ? 'ended' : context.insured === 'yes' ? 'active' : 'unknown'
  return {
    role: context.role,
    employment: context.employment,
    payerSize: 'unknown' as PayerSize,
    coverage,
    maternityCase: context.takeoverDate ? 'takeover' : 'standard',
  }
}

function assess(leaveCase: LeaveCase, benefit: BenefitCode) {
  return leaveCase.assessments.find((item) => item.benefit === benefit)
}

function payable(leaveCase: LeaveCase, benefit: BenefitCode) {
  const assessment = assess(leaveCase, benefit)
  return assessment && (assessment.status === 'granted' || assessment.status === 'partially_granted')
    ? assessment
    : null
}

function weeksAndDays(days: number) {
  const weeks = Math.floor(days / 7)
  const rest = days % 7
  const weekPart = weeks === 1 ? '1 tydzień' : weeks < 5 && weeks > 0 ? `${weeks} tygodnie` : `${weeks} tygodni`
  if (!weeks) return rest === 1 ? '1 dzień' : `${rest} dni`
  return rest ? `${weekPart} i ${rest} dni` : weekPart
}

function letterHead(decisions: Record<string, string>) {
  return [
    decisions.place ? `${decisions.place}, ${formatDocumentDate(new Date().toISOString().slice(0, 10))}` : formatDocumentDate(new Date().toISOString().slice(0, 10)),
    decisions.name || 'Imię i nazwisko',
    decisions.address || 'Adres',
    '',
    decisions.employer || 'Pracodawca — nazwa i adres',
    '',
  ]
}

function attachmentsSection(documents: string[]) {
  if (!documents.length) return []
  return ['', 'Załączniki:', ...documents.map((document) => '- ' + document)]
}

/** Nazwa płatnika mówi, do kogo zaadresować pismo. */
function addresseeOf(benefit: BenefitCode, options: DocumentOptions) {
  const payer = getBenefitPayer(benefit, options)
  if (payer === 'zus') return 'Zakład Ubezpieczeń Społecznych'
  if (payer === 'payer') return 'Pracodawca — płatnik zasiłku'
  return 'Pracodawca — potwierdź u niego, kto wypłaca zasiłek'
}

/** Trzy pola osobowe są w każdym wniosku, więc jedno miejsce na nie. */
function personalDecisions(): LeaveDecision[] {
  return [
    { id: 'name', label: 'Imię i nazwisko', hint: 'Tak jak w dokumentach kadrowych.', type: 'text', required: true },
    { id: 'address', label: 'Adres do korespondencji', hint: 'Adres, na który pracodawca może odpisać.', type: 'text' },
    { id: 'employer', label: 'Pracodawca — nazwa i adres', hint: 'Pełna nazwa zakładu pracy z siedzibą.', type: 'text', required: true },
    { id: 'place', label: 'Miejscowość', hint: 'Miejsce wystawienia pisma, obok daty.', type: 'text' },
  ]
}

/**
 * Lista wniosków wynikających z sytuacji, a nie katalog wszystkich możliwych.
 * Pismo powstaje z wyniku wywiadu, więc nic tu nie jest zgadywane.
 */
export function buildLeaveApplications(leaveCase: LeaveCase): LeaveApplication[] {
  const { values, context, pool } = leaveCase
  const options = optionsOf(context)
  const applications: LeaveApplication[] = []

  function guide(benefit: BenefitCode) {
    return getDocumentGuide(benefit, options, context)
  }
  function period(benefit: BenefitCode) {
    const range = context.periods[benefit]
    return range ? { start: range.start, end: range.end } : null
  }
  function startDecision(benefit: BenefitCode, hint: string): LeaveDecision {
    const range = period(benefit)
    return {
      id: 'start',
      label: 'Pierwszy dzień urlopu',
      hint,
      type: 'date',
      required: true,
      prefill: range?.start,
    }
  }
  /** Data musi trafić w okres, który policzył kalkulator. Poza nim wniosek się nie broni. */
  function startCheck(range: { start: string; end: string } | null) {
    return (decisions: Record<string, string>): LeaveCheck[] => {
      if (!decisions.start) return [{ ok: false, message: 'Podaj pierwszy dzień urlopu.' }]
      if (!range) return [{ ok: true, message: 'Nie mamy okresu z symulacji, więc datę ustal z pracodawcą.' }]
      if (decisions.start < range.start || decisions.start > range.end) {
        return [{
          ok: false,
          message: `Symulacja liczy ten urlop od ${formatDocumentDate(range.start)} do ${formatDocumentDate(range.end)}. Data poza tym zakresem nie zgadza się z wyliczeniem, a wniosek ma je potwierdzać.`,
        }]
      }
      return [{
        ok: true,
        message: `Data mieści się w okresie z symulacji: ${formatDocumentDate(range.start)} – ${formatDocumentDate(range.end)}.`,
      }]
    }
  }

  const father = values.role === 'father'

  const maternity = payable(leaveCase, 'macierzynski')
  if (maternity) {
    const range = period('macierzynski')
    const documents = guide('macierzynski').documents
    applications.push({
      code: 'macierzynski',
      title: 'Wniosek o urlop macierzyński',
      benefit: 'macierzynski',
      settles: 'Ustala pierwszy dzień urlopu macierzyńskiego, za który ZUS wypłaca zasiłek.',
      when: 'Najpóźniej w dniu rozpoczęcia urlopu, a przy porodzie najczęściej zaraz po urodzeniu dziecka.',
      late: 'Urlopu nie da się rozpocząć wstecz, więc spóźniony wniosek przesuwa początek wypłaty i obniża kwotę za pominięte dni.',
      addressee: addresseeOf('macierzynski', options),
      period: range,
      days: maternity.days ?? null,
      decisions: [...personalDecisions(), startDecision('macierzynski', 'Zwykle jest to data porodu. Możesz wskazać też dzień z karty ciąży.')],
      attachments: documents,
      checks: startCheck(range),
      letter: (decisions) => [
        ...letterHead(decisions),
        'WNIOSEK O UDZIELENIE URLOPU MACIERZYŃSKIEGO',
        '',
        'Na podstawie art. 180 § 1 Kodeksu pracy wnoszę o udzielenie mi urlopu macierzyńskiego'
          + (maternity.days ? ` w wymiarze ${weeksAndDays(maternity.days)},` : ',')
          + ` od ${decisions.start ? formatDocumentDate(decisions.start) : '...'}.`,
        '',
        values.role === 'adoption' || values.role === 'foster'
          ? 'Dziecko zostało przyjęte na wychowanie, a urlop przysługuje na warunkach urlopu macierzyńskiego.'
          : 'Uzasadnienie: urodzenie dziecka.',
        ...attachmentsSection(documents),
        ...SIGNATURE,
      ],
      documentName: 'wniosek-urlop-macierzynski',
    })
  }

  const parental = payable(leaveCase, 'rodzicielski')
  if (parental) {
    const range = period('rodzicielski')
    const documents = guide('rodzicielski').documents
    const exclusive = pool?.exclusive_days_per_parent ?? 0
    applications.push({
      code: 'rodzicielski',
      title: 'Wniosek o urlop rodzicielski',
      benefit: 'rodzicielski',
      settles: 'Ustala wymiar i termin urlopu po macierzyńskim. Urlop można dzielić na części.',
      when: 'Co najmniej 21 dni przed początkiem danej części urlopu.',
      late: 'Wniosek po terminie zwykle przesuwa początek części urlopu, a nie skraca jego wymiaru. Ustal nowy termin z pracodawcą.',
      addressee: addresseeOf('rodzicielski', options),
      period: range,
      days: parental.days ?? null,
      decisions: [
        ...personalDecisions(),
        startDecision('rodzicielski', 'Pierwszy dzień po zakończeniu macierzyńskiego albo dzień wskazany w planie urlopu.'),
        {
          id: 'days',
          label: 'Liczba dni, o które wnosisz',
          hint: pool
            ? `Z symulacji wychodzi ${parental.days ?? 0} dni. Cała pula dla obojga rodziców to ${pool.total_days} dni, a ${exclusive} dni każdego z Was jest nieprzenoszalne.`
            : 'Liczba dni urlopu, który chcesz wykorzystać w tym wniosku.',
          type: 'number',
          prefill: parental.days ? String(parental.days) : '',
        },
      ],
      attachments: documents,
      checks: (decisions) => {
        const result: LeaveCheck[] = [...startCheck(range)(decisions)]
        const days = parseNumber(decisions.days)
        if (days === undefined) return result
        if (parental.days && days !== parental.days) {
          result.push({
            ok: false,
            message: `Wpisujesz ${days} dni, a symulacja policzyła ${parental.days} dni przy Twoich odpowiedziach. Zmień liczbę dni albo wróć do kalkulatora i popraw odpowiedzi.`,
          })
        } else {
          result.push({ ok: true, message: `Liczba dni zgadza się z wymiarem z symulacji: ${days}.` })
        }
        if (exclusive && days < exclusive) {
          result.push({
            ok: false,
            message: `Twoje ${exclusive} dni urlopu jest nieprzenoszalne. Nie można wnieść o mniej, bo reszta przepadnie i nie przejdzie na drugiego rodzica.`,
          })
        }
        return result
      },
      letter: (decisions) => {
        const days = parseNumber(decisions.days)
        return [
          ...letterHead(decisions),
          'WNIOSEK O UDZIELENIE URLOPU RODZICIELSKIEGO',
          '',
          'Na podstawie art. 182¹a Kodeksu pracy wnoszę o udzielenie mi urlopu rodzicielskiego'
            + (days ? ` w wymiarze ${weeksAndDays(days)},` : ',')
            + ` od ${decisions.start ? formatDocumentDate(decisions.start) : '...'}.`,
          '',
          'Urlop zamierzam wykorzystać w jednej części, bezpośrednio po urlopie macierzyńskim.',
          ...attachmentsSection(documents),
          ...SIGNATURE,
        ]
      },
      documentName: 'wniosek-urlop-rodzicielski',
    })
  }

  const paternity = payable(leaveCase, 'ojcowski')
  if (paternity) {
    const range = period('ojcowski')
    const documents = guide('ojcowski').documents
    const limit = shiftDate(context.eventDate, 365)
    applications.push({
      code: 'ojcowski',
      title: 'Wniosek o urlop ojcowski',
      benefit: 'ojcowski',
      settles: 'Dwa tygodnie urlopu dla ojca, płatne jak zasiłek macierzyński.',
      when: 'Co najmniej 7 dni przed rozpoczęciem urlopu, nie później niż do dwunastego miesiąca życia dziecka.',
      late: 'Urlop ojcowski przepada, jeśli nie zostanie wykorzystany do dwunastego miesiąca życia dziecka.',
      addressee: addresseeOf('ojcowski', options),
      period: range,
      days: paternity.days ?? 14,
      decisions: [...personalDecisions(), startDecision('ojcowski', 'Możesz wskazać dowolny dzień przed dwunastym miesiącem życia dziecka.')],
      attachments: documents,
      checks: (decisions) => {
        const result: LeaveCheck[] = [...startCheck(range)(decisions)]
        if (decisions.start && decisions.start > limit) {
          result.push({
            ok: false,
            message: `Urlop ojcowski trzeba wykorzystać do ${formatDocumentDate(limit)}, czyli do dwunastego miesiąca życia dziecka. Ta data jest późniejsza.`,
          })
        } else if (decisions.start) {
          result.push({ ok: true, message: `Urlop kończy się przed ${formatDocumentDate(limit)}.` })
        }
        return result
      },
      letter: (decisions) => [
        ...letterHead(decisions),
        'WNIOSEK O UDZIELENIE URLOPU OJCOWSKIEGO',
        '',
        'Na podstawie art. 182³ Kodeksu pracy wnoszę o udzielenie mi dwutygodniowego urlopu ojcowskiego'
          + ` od ${decisions.start ? formatDocumentDate(decisions.start) : '...'}.`,
        ...attachmentsSection(documents),
        ...SIGNATURE,
      ],
      documentName: 'wniosek-urlop-ojcowski',
    })
  }

  const supplementary = payable(leaveCase, 'uzupelniajacy')
  if (supplementary) {
    const range = period('uzupelniajacy')
    const documents = guide('uzupelniajacy').documents
    applications.push({
      code: 'uzupelniajacy',
      title: 'Wniosek o uzupełniający urlop macierzyński',
      benefit: 'uzupelniajacy',
      settles: 'Dodatkowy urlop przy wcześniactwie albo po pobycie dziecka w szpitalu.',
      when: 'Co najmniej 21 dni przed końcem urlopu macierzyńskiego, bo urlop uzupełniający wykorzystuje się bezpośrednio po nim.',
      late: 'Urlop uzupełniający wykorzystuje się bezpośrednio po macierzyńskim, więc spóźniony wniosek najczęściej go zamyka.',
      addressee: addresseeOf('uzupelniajacy', options),
      period: range,
      days: supplementary.days ?? null,
      decisions: [...personalDecisions(), startDecision('uzupelniajacy', 'Pierwszy dzień po zakończeniu urlopu macierzyńskiego.')],
      attachments: documents,
      checks: startCheck(range),
      letter: (decisions) => [
        ...letterHead(decisions),
        'WNIOSEK O UDZIELENIE UZUPEŁNIAJĄCEGO URLOPU MACIERZYŃSKIEGO',
        '',
        'Na podstawie art. 180² Kodeksu pracy wnoszę o udzielenie mi uzupełniającego urlopu macierzyńskiego'
          + (supplementary.days ? ` w wymiarze ${weeksAndDays(supplementary.days)},` : ',')
          + ` bezpośrednio po urlopie macierzyńskim, od ${decisions.start ? formatDocumentDate(decisions.start) : '...'}.`,
        '',
        'Urlop jest związany z pobytem dziecka w szpitalu, na który załączam zaświadczenie.',
        ...attachmentsSection(documents),
        ...SIGNATURE,
      ],
      documentName: 'wniosek-urlop-uzupelniajacy',
    })
  }

  if (father && maternity && values.takingOver === 'yes') {
    const range = period('macierzynski')
    const documents = guide('macierzynski').documents
    applications.push({
      code: 'przejecie',
      title: 'Wniosek o przejęcie urlopu macierzyńskiego',
      benefit: 'macierzynski',
      settles: 'Ustala, od kiedy ojciec przejmuje opiekę i pozostałą część urlopu macierzyńskiego.',
      when: 'Co najmniej 14 dni przed przejęciem urlopu. Matka składa wtedy swój wniosek o rezygnację na 7 dni przed powrotem do pracy.',
      late: 'Bez zachowania terminu przejęcie wymaga zgody pracodawcy, a wypłata może się przesunąć.',
      addressee: addresseeOf('macierzynski', options),
      period: range,
      days: maternity.days ?? null,
      decisions: [
        ...personalDecisions(),
        {
          id: 'start',
          label: 'Dzień przejęcia opieki',
          hint: 'Dzień, od którego przejmujesz opiekę nad dzieckiem i pozostały urlop macierzyński.',
          type: 'date',
          required: true,
          prefill: values.takeoverDate || range?.start,
        },
      ],
      attachments: documents,
      checks: startCheck(range),
      letter: (decisions) => [
        ...letterHead(decisions),
        'WNIOSEK O PRZEJĘCIE URLOPU MACIERZYŃSKIEGO',
        '',
        'Na podstawie art. 180 § 5 Kodeksu pracy wnoszę o przejęcie opieki nad dzieckiem i pozostałej części'
          + ` urlopu macierzyńskiego od ${decisions.start ? formatDocumentDate(decisions.start) : '...'}.`,
        '',
        'Oświadczam, że matka dziecka zaprzestaje opieki nad dzieckiem, a drugi z rodziców wyraża na to zgodę.',
        ...attachmentsSection(documents),
        ...SIGNATURE,
      ],
      documentName: 'wniosek-przejecie-urlopu',
    })
  }

  if (values.workingOnLeave && values.employment === 'employee' && parental) {
    const range = period('rodzicielski')
    const documents = guide('rodzicielski').documents
    applications.push({
      code: 'obnizenie',
      title: 'Wniosek o łączenie urlopu rodzicielskiego z pracą',
      benefit: 'rodzicielski',
      settles: 'Obniża wymiar czasu pracy w czasie urlopu rodzicielskiego i wydłuża urlop proporcjonalnie.',
      when: 'Razem z wnioskiem o urlop rodzicielski, co najmniej 21 dni przed początkiem urlopu.',
      late: 'Bez wniosku urlop nie wydłuży się, więc nie odzyskasz proporcjonalnej części wymiaru.',
      addressee: addresseeOf('rodzicielski', options),
      period: range,
      days: parental.days ?? null,
      decisions: [
        ...personalDecisions(),
        startDecision('rodzicielski', 'Pierwszy dzień urlopu połączonego z pracą.'),
        {
          id: 'work',
          label: 'Wymiar czasu pracy w czasie urlopu (w procentach)',
          hint: 'Z symulacji: ' + (values.workPercent || 'podany') + '% wymiaru. Wniosek o obniżenie może dotyczyć wyłącznie części wymiaru.',
          type: 'number',
          prefill: values.workPercent,
        },
      ],
      attachments: documents,
      checks: (decisions) => {
        const result: LeaveCheck[] = [...startCheck(range)(decisions)]
        const work = parseNumber(decisions.work)
        const contracted = parseNumber(values.contractedPercent)
        if (work !== undefined && contracted !== undefined && work >= contracted) {
          result.push({
            ok: false,
            message: `Wymiar pracy musi być niższy niż ${contracted}% z umowy. Inaczej to nie łączenie urlopu z pracą, a zwykła praca.`,
          })
        } else if (work !== undefined) {
          result.push({ ok: true, message: `Wymiar ${work}% jest niższy od wymiaru z umowy.` })
        }
        return result
      },
      letter: (decisions) => [
        ...letterHead(decisions),
        'WNIOSEK O ŁĄCZENIE URLOPU RODZICIELSKIEGO Z PRACĄ',
        '',
        'Na podstawie art. 182¹e Kodeksu pracy wnoszę o wykonywanie pracy w obniżonym wymiarze czasu pracy'
          + (decisions.work ? ` w wymiarze ${decisions.work}%` : '')
          + ` w czasie urlopu rodzicielskiego od ${decisions.start ? formatDocumentDate(decisions.start) : '...'}.`,
        '',
        'W związku z obniżeniem wymiaru pracy wnoszę o proporcjonalne wydłużenie urlopu rodzicielskiego.',
        ...attachmentsSection(documents),
        ...SIGNATURE,
      ],
      documentName: 'wniosek-laczenie-z-praca',
    })
  }

  return applications
}

/** Karta jako druga strona tego samego wydruku: jedna wizyta w kadrach zamiast trzech. */
export function benefitAmountLine(assessment: Assessment | null) {
  if (!assessment || assessment.gross_grosze == null) return null
  return currency.format(assessment.gross_grosze / 100)
}

export function caseSummaryLines(leaveCase: LeaveCase) {
  const lines: string[] = []
  for (const assessment of leaveCase.assessments) {
    if (!isFamilyBenefit(assessment.benefit)) continue
    if (assessment.status !== 'granted' && assessment.status !== 'partially_granted') continue
    const range = leaveCase.context.periods[assessment.benefit]
    lines.push(
      benefitList[assessment.benefit].name
        + (assessment.days ? ` — ${weeksAndDays(assessment.days)}` : '')
        + (range ? `, ${formatDocumentDate(range.start)} – ${formatDocumentDate(range.end)}` : ''),
    )
  }
  return lines
}
