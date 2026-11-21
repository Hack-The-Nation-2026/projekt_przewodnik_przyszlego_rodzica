import type { Assessment, BenefitCode } from '@/lib/benefit-interview'
import type { DocumentContext } from '@/lib/benefit-document-context'
import { isFamilyBenefit } from '@/lib/benefit-document-context'
import {
  documentEmployment, documentRoles, formatDocumentDate, getBenefitPayer, getCalendarEvents,
  getDocumentGuide,
} from '@/lib/benefit-documents'
import type { Coverage, DocumentOptions, MaternityCase, PayerSize } from '@/lib/benefit-documents'
import { benefitList } from '@/lib/benefit-interview'
import { asBoolean, isPlacement, parseNumber } from '@/lib/interview-form'
import type { InterviewValues } from '@/lib/interview-form'

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', useGrouping: 'always' })

/** Tego, czego kalkulator nie policzył, nie ma na karcie. */
export type CardOutcome = 'granted' | 'partially_granted'

export interface CardSituationLine {
  label: string
  value: string
}

export interface CardBenefit {
  benefit: BenefitCode
  name: string
  outcome: CardOutcome
  /** Kwota za cały okres, brutto. */
  total: string | null
  /** Przeliczenie na trzydzieści dni, żeby dało się porównać z kwotą z ZUS. */
  monthly: string | null
  /** Wymiar urlopu w tygodniach i dniach, gdy to urlop, inaczej liczba dni. */
  measure: string | null
  /** Okres, za który świadczenie przysługuje. */
  period: string | null
  /** Z czego wynika kwota: podstawa wymiaru i procent. */
  basis: string | null
  partialNote: string | null
  payer: string
  form: string
  formUrl: string
}

export interface CardDeadline {
  date: string
  label: string
  detail: string
  form: string
  formUrl: string
  missed: boolean
  missedNote: string | null
}

export interface EntitlementCardData {
  generatedAt: string
  /** Karta z przewidywaną datą porodu nie może wyglądać jak dokument urzędowy. */
  orientation: 'forecast' | 'confirmed'
  orientationNote: string
  role: string
  situation: CardSituationLine[]
  benefits: CardBenefit[]
  deadlines: CardDeadline[]
  documents: string[]
  /** Świadczenia, których przy tych odpowiedziach nie ma, w jednej linii. */
  notGranted: string[]
  total: string | null
}

const WEEK_BENEFITS: BenefitCode[] = ['macierzynski', 'uzupelniajacy', 'rodzicielski', 'ojcowski']

const PAYER_LABELS: Record<string, string> = {
  zus: 'ZUS',
  payer: 'Pracodawca, bo zatrudnia powyżej dwudziestu osób',
  unknown: 'Do potwierdzenia u płatnika',
}

const MISSED_NOTES: Record<string, string> = {
  'Złóż wniosek o zasiłek w stawce 81,5%':
    'Bez wniosku w terminie wraca wariant bez uśredniania: sto procent podstawy za macierzyński i siedemdziesiąt procent za rodzicielski.',
  'Złóż wniosek o urlop rodzicielski':
    'Wniosek po terminie zwykle przesuwa początek części urlopu, a nie skraca jego wymiaru. Ustal to z pracodawcą.',
  'Złóż wniosek o urlop ojcowski':
    'Urlop ojcowski przepada, jeśli nie zostanie wykorzystany do dwunastego miesiąca życia dziecka.',
  'Złóż wniosek o przejęcie urlopu przez ojca':
    'Przejęcie urlopu bez zachowania terminu wymaga zgody pracodawcy.',
  'Złóż wniosek o uzupełniający urlop macierzyński':
    'Urlop uzupełniający wykorzystuje się bezpośrednio po macierzyńskim, więc spóźniony wniosek najczęściej go zamyka.',
}

function money(grosze: number) {
  return currency.format(grosze / 100)
}

function measureOf(benefit: BenefitCode, days: number) {
  const weeks = Math.floor(days / 7)
  const rest = days % 7
  const weekPart = weeks === 1 ? '1 tydzień' : weeks < 5 && weeks > 0 ? `${weeks} tygodnie` : `${weeks} tygodni`
  if (!WEEK_BENEFITS.includes(benefit)) return days === 1 ? '1 dzień' : `${days} dni`
  if (!weeks) return rest === 1 ? '1 dzień' : `${rest} dni`
  return rest ? `${weekPart} i ${rest} dni (${days} dni)` : `${weekPart} (${days} dni)`
}

function coverageOf(context: DocumentContext): Coverage {
  if (context.insuranceEnd) return 'ended'
  return context.insured === 'yes' ? 'active' : 'unknown'
}

function optionsOf(context: DocumentContext, payerSize: PayerSize): DocumentOptions {
  const maternityCase: MaternityCase = context.takeoverDate ? 'takeover' : 'standard'
  return {
    role: context.role,
    employment: context.employment,
    payerSize,
    coverage: coverageOf(context),
    maternityCase,
  }
}

function basisNote(values: InterviewValues, assessment: Assessment) {
  const rate = assessment.periods?.find((period) => period.rate_percent)?.rate_percent
  const basis = parseNumber(values.basis)
  if (basis === undefined) return rate ? `${rate}% podstawy wymiaru` : null
  const formatted = money(Math.round(basis * 100))
  return rate ? `${formatted} × ${rate}% podstawy wymiaru` : `podstawa wymiaru ${formatted}`
}

/**
 * Karta uprawnień: jednostronicowe podsumowanie tego, co zostało policzone.
 *
 * Nie zawiera niczego, czego nie da się uzasadnić przepisem albo wynikiem kalkulatora:
 * brak porad, brak decyzji za użytkownika, brak kwot bez podstawy.
 */
export function buildEntitlementCard(
  values: InterviewValues,
  assessments: Assessment[],
  context: DocumentContext,
): EntitlementCardData {
  const options = optionsOf(context, 'unknown')
  const payable = assessments.filter(
    (assessment) => assessment.status === 'granted' || assessment.status === 'partially_granted',
  )
  const family = payable.filter((assessment) => isFamilyBenefit(assessment.benefit))
  const role = context.role
  const placement = isPlacement(values)

  const benefits: CardBenefit[] = payable.map((assessment) => {
    const guide = getDocumentGuide(assessment.benefit, options, context)
    const payer = getBenefitPayer(assessment.benefit, options)
    const days = assessment.days ?? 0
    const total = assessment.gross_grosze ?? null
    const start = context.periods[assessment.benefit]?.start
    const end = context.periods[assessment.benefit]?.end
    return {
      benefit: assessment.benefit,
      name: benefitList[assessment.benefit].name,
      outcome: assessment.status === 'granted' ? 'granted' : 'partially_granted',
      total: total === null ? null : money(total),
      monthly: total !== null && days > 0 ? money(Math.round((total / days) * 30)) : null,
      measure: days > 0 ? measureOf(assessment.benefit, days) : null,
      period: start && end ? `${formatDocumentDate(start)} – ${formatDocumentDate(end)}` : null,
      basis: basisNote(values, assessment),
      partialNote: assessment.status === 'partially_granted' && assessment.denied_days
        ? `Poza świadczeniem zostaje ${assessment.denied_days} dni.`
        : null,
      payer: PAYER_LABELS[payer],
      form: guide.form.label,
      formUrl: guide.form.url,
    }
  })

  const benefitsByDate: CardDeadline[] = []
  const today = new Date().toISOString().slice(0, 10)
  for (const assessment of payable) {
    const guide = getDocumentGuide(assessment.benefit, options, context)
    for (const event of getCalendarEvents(assessment.benefit, options, context)) {
      const missed = event.date < today
      const key = `${event.date}-${event.title}`
      if (benefitsByDate.some((item) => `${item.date}-${item.label}` === key)) continue
      benefitsByDate.push({
        date: event.date,
        label: event.title,
        detail: event.description,
        form: guide.form.label,
        formUrl: guide.form.url,
        missed,
        missedNote: missed ? (MISSED_NOTES[event.title] ?? null) : null,
      })
    }
  }
  benefitsByDate.sort((first, second) => first.date.localeCompare(second.date))

  const documents = [
    ...new Set(payable.flatMap((assessment) =>
      getDocumentGuide(assessment.benefit, options, context).documents)),
  ]

  const salaryStart = family
    .map((assessment) => context.periods[assessment.benefit]?.start)
    .filter((value): value is string => !!value)
    .sort()[0]
  const partnership = values.partnerEmployment === 'unknown'
    ? 'Nie podano'
    : documentEmployment[values.partnerEmployment] +
      (parseNumber(values.partnerBasis) !== undefined ? `, podstawa ${money(Math.round((parseNumber(values.partnerBasis) ?? 0) * 100))}` : '')

  const situation: CardSituationLine[] = [
    {
      label: placement ? 'Data przyjęcia dziecka' : 'Data porodu',
      value: context.eventDate
        ? `${formatDocumentDate(context.eventDate)}${context.forecast ? ' (przewidywana)' : ''}`
        : 'Nie podano',
    },
    {
      label: 'Forma zatrudnienia',
      value: documentEmployment[values.employment] +
        (values.workingOnLeave ? `, łączenie urlopu z pracą w wymiarze ${values.workPercent || 'podanym'}%` : ''),
    },
    {
      label: 'Liczba dzieci',
      value: `${values.childCount || 1}${values.zaZyciem ? ', zaświadczenie „Za życiem”' : ''}`,
    },
    { label: 'Drugi rodzic', value: partnership },
    {
      label: 'Zasiłek liczony od',
      value: salaryStart ? formatDocumentDate(salaryStart) : 'Nie da się ustalić z podanych danych',
    },
  ]

  const notGranted = assessments
    .filter((assessment) => assessment.status === 'denied' || assessment.status === 'missing_data')
    .map((assessment) => benefitList[assessment.benefit].name)

  const total = payable.every((assessment) => assessment.gross_grosze != null) && payable.length
    ? money(payable.reduce((sum, assessment) => sum + (assessment.gross_grosze ?? 0), 0))
    : null

  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    orientation: context.forecast ? 'forecast' : 'confirmed',
    orientationNote: context.forecast
      ? 'Wyliczenia orientacyjne, na podstawie podanych danych i przewidywanej daty porodu.'
      : 'Dane po porodzie, na podstawie podanych danych.',
    role: documentRoles[role],
    situation,
    benefits,
    deadlines: benefitsByDate,
    documents,
    notGranted,
    total,
  }
}

/** Karta jedzie przez sessionStorage, więc nic nie zostaje na serwerze. */
export const CARD_STORAGE_KEY = 'entitlement-card'

export function saveEntitlementCard(data: EntitlementCardData) {
  sessionStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(data))
}

export function readEntitlementCard(): EntitlementCardData | null {
  const raw = sessionStorage.getItem(CARD_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as EntitlementCardData
  } catch {
    return null
  }
}

/** Do sprawdzenia w kodzie, czy karta ma sens przy danych odpowiedziach. */
export const cardHelpers = { asBoolean, measureOf }