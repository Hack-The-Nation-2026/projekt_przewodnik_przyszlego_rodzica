import type { Assessment, ParentalPool, SimulationResponse } from '@/lib/benefit-interview'
import { benefitList } from '@/lib/benefit-interview'
import type { DocumentContext } from '@/lib/benefit-document-context'
import { formatDocumentDate, getCalendarEvents, shiftDate } from '@/lib/benefit-documents'
import type { DocumentOptions, PayerSize } from '@/lib/benefit-documents'
import { interviewDefaults } from '@/lib/interview-form'
import type { InterviewValues } from '@/lib/interview-form'

/**
 * Tryb "jestem w trakcie urlopu", odpowiedzi o teraźniejszość, nie o plan.
 *
 * Cała reszta serwisu opowiada, co będzie albo co było. Tu chodzi o to, ile
 * jeszcze zostało i co trzeba złożyć teraz. Stan zapisujemy w przeglądarce,
 * żeby przy kolejnej wizycie nie przechodzić formularza od zera.
 */
export interface LeaveProgressAnswers {
  /** Data porodu, którą zna użytkownik. */
  eventDate: string
  /** Od kiedy trwa urlop, który jest brany teraz. */
  leaveStart: string
  /** Który urlop jest brany teraz. */
  current: 'macierzynski' | 'uzupelniajacy' | 'rodzicielski'
  /** Drugi rodzic i to, co już wykorzystał. */
  partnerEmployment: InterviewValues['partnerEmployment']
  partnerBasis: string
  partnerDaysUsed: string
  /** Łączenie urlopu z pracą. */
  workingOnLeave: boolean
  workPercent: string
  contractedPercent: string
  /** Podstawa wymiaru, żeby kwota miała z czego się policzyć. */
  basis: string
}

export const emptyProgress: LeaveProgressAnswers = {
  eventDate: '',
  leaveStart: '',
  current: 'macierzynski',
  partnerEmployment: 'unknown',
  partnerBasis: '',
  partnerDaysUsed: '',
  workingOnLeave: false,
  workPercent: '',
  contractedPercent: '100',
  basis: '',
}

const STORAGE_KEY = 'leave-progress'

export function readProgress(): LeaveProgressAnswers | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...emptyProgress, ...(JSON.parse(raw) as Partial<LeaveProgressAnswers>) } : null
  } catch {
    return null
  }
}

export function saveProgress(answers: LeaveProgressAnswers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
  } catch {
    // Prywatny tryb przeglądarki: stan zostaje do końca wizyty.
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nic do zrobienia, ustawienie i tak zniknie po zamknięciu karty.
  }
}

/** Wywiad w wersji minimalnej: reszta pól ma wartości domyślne, bo nie pytamy o przeszłość. */
export function progressValues(answers: LeaveProgressAnswers): InterviewValues {
  const partnerKnown = answers.partnerEmployment !== 'unknown'
  return {
    ...interviewDefaults,
    role: 'mother',
    birthStage: 'born',
    eventDate: answers.eventDate,
    employment: 'employee',
    insured: 'yes',
    basis: answers.basis,
    returnDate: answers.leaveStart,
    workingOnLeave: answers.workingOnLeave && !!answers.workPercent,
    workPercent: answers.workPercent,
    contractedPercent: answers.contractedPercent || '100',
    parentalDays: '',
    partnerEmployment: partnerKnown ? answers.partnerEmployment : 'unknown',
    partnerInsured: partnerKnown ? 'yes' : 'unknown',
    partnerBasis: answers.partnerBasis,
  }
}

/** Czy okno na 81,5% jeszcze jest otwarte: liczy się 21 dni od porodu. */
export function averagedWindow(answers: LeaveProgressAnswers, today = new Date().toISOString().slice(0, 10)) {
  if (!answers.eventDate) return null
  const deadline = shiftDate(answers.eventDate, 21)
  const daysLeft = Math.round((Date.parse(deadline + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86_400_000)
  return { deadline, daysLeft, open: daysLeft >= 0 }
}

export interface ProgressStep {
  date: string
  label: string
  detail: string
  missed: boolean
  daysLeft: number
}

/** Nie lista wszystkich terminów, a tylko te, które dotyczą najbliższych tygodni. */
export function nearestSteps(
  context: DocumentContext,
  assessments: Assessment[],
  horizonDays = 56,
  today = new Date().toISOString().slice(0, 10),
): ProgressStep[] {
  const options: DocumentOptions = {
    role: context.role,
    employment: context.employment,
    payerSize: 'unknown' as PayerSize,
    coverage: context.insuranceEnd ? 'ended' : 'active',
    maternityCase: context.takeoverDate ? 'takeover' : 'standard',
  }
  const steps: ProgressStep[] = []
  for (const assessment of assessments) {
    if (assessment.status !== 'granted' && assessment.status !== 'partially_granted') continue
    for (const event of getCalendarEvents(assessment.benefit, options, context)) {
      const daysLeft = Math.round((Date.parse(event.date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86_400_000)
      if (daysLeft < 0 || daysLeft > horizonDays) continue
      steps.push({
        date: event.date,
        label: event.title,
        detail: event.hint,
        missed: false,
        daysLeft,
      })
    }
  }
  return steps.sort((first, second) => first.date.localeCompare(second.date))
}

export interface ProgressSummary {
  label: string
  days: number
  gross: number | null
}

/** Podsumowanie zwrotki: które świadczenia i na ile dni wyszły z symulacji. */
export function summarize(response: SimulationResponse): ProgressSummary[] {
  return response.assessments
    .filter((item) => item.status === 'granted' || item.status === 'partially_granted')
    .map((item) => ({
      label: benefitList[item.benefit].name,
      days: item.days ?? 0,
      gross: item.gross_grosze ?? null,
    }))
}

export function poolOf(response: SimulationResponse): ParentalPool | null {
  return response.parental_pool ?? null
}

/** Ile dni urlopu drugiego rodzica jeszcze czeka, a ile już wykorzystał. */
export function partnerDays(pool: ParentalPool | null, used: number) {
  if (!pool) return null
  const exclusive = pool.exclusive_days_per_parent
  const shared = Math.max(0, pool.total_days - exclusive * 2)
  return { exclusive, shared, used, left: Math.max(0, exclusive + shared - used) }
}

export const progressHelpers = { formatDocumentDate }
