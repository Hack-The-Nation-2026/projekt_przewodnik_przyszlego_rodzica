import type { Assessment, BenefitCode, ParentalPool } from '@/lib/benefit-interview'
import { benefitList } from '@/lib/benefit-interview'
import type { DocumentContext, DateRange } from '@/lib/benefit-document-context'
import { formatDocumentDate, getCalendarEvents, shiftDate } from '@/lib/benefit-documents'
import type { DocumentOptions, PayerSize } from '@/lib/benefit-documents'
import type { InterviewValues } from '@/lib/interview-form'
import { parseNumber } from '@/lib/interview-form'

export type Person = 'first_parent' | 'second_parent'

export interface TimelineBlock {
  benefit: BenefitCode
  label: string
  startDay: number
  days: number
  /** Nieprzenoszalne tygodnie drugiego rodzica: serce całej historii. */
  exclusiveDays: number
  rate: number | null
  gross: number | null
}

export interface TimelineLane {
  person: Person
  label: string
  blocks: TimelineBlock[]
}

export interface TimelineMarker {
  day: number
  date: string
  label: string
  detail: string
  kind: 'today' | 'birth' | 'deadline'
  missed: boolean
}

export interface TimelineWeek {
  index: number
  /** Tydzień liczony od porodu: ujemny przed porodem. */
  week: number
  startDay: number
  date: string
}

export interface WeekTimelineData {
  origin: string
  totalDays: number
  /** Ile tygodni przed porodem pokazujemy. */
  leadingWeeks: number
  forecast: boolean
  lanes: TimelineLane[]
  markers: TimelineMarker[]
  weeks: TimelineWeek[]
  /** Tydzień porodu w układzie osi, żeby dało się narysować pionową linię. */
  birthDay: number
  todayDay: number
  /** Jedno zdanie o tym, gdzie jesteśmy. Używa go też tryb „jestem w trakcie urlopu". */
  status: string
}

/** Podziałka tygodniowa dla danej długości taśmy. Wspólna dla wariantów. */
export function weeksFor(totalDays: number, eventDate: string): TimelineWeek[] {
  const weeks: TimelineWeek[] = []
  for (let week = -6; week <= Math.ceil(totalDays / 7) - 6; week += 1) {
    weeks.push({ index: weeks.length, week, startDay: week * 7, date: shiftDate(eventDate, week * 7) })
  }
  return weeks
}

/**
 * Warianty porównujemy na jednej skali, bo taśmy o różnych podziałkach nie
 * dałyby się zestawić wzrokiem: krótszy wariant wyglądałby na dłuższy.
 */
export function withSharedScale(timelines: WeekTimelineData[]): WeekTimelineData[] {
  const totalDays = Math.max(...timelines.map((item) => item.totalDays))
  return timelines.map((item) => item.totalDays === totalDays
    ? item
    : { ...item, totalDays, weeks: weeksFor(totalDays, item.origin ? shiftDate(item.origin, LEADING_DAYS) : item.origin) })
}

export interface TimelineInput {
  values: InterviewValues
  context: DocumentContext
  assessments: Assessment[]
  pool: ParentalPool | null
  respondent: Person
  secondShareDays: number
  averagedGross: number | null
  flatGross: number | null
  settings?: { exclusive_weeks: number; parental_weeks_single: number }
}

const LEADING_DAYS = 42
const TRAILING_DAYS = 365

const BLOCK_COLORS: Record<BenefitCode, { band: string; text: string }> = {
  macierzynski: { band: 'bg-primary', text: 'text-primary-foreground' },
  uzupelniajacy: { band: 'bg-primary/70', text: 'text-primary-foreground' },
  rodzicielski: { band: 'bg-gold', text: 'text-gold-foreground' },
  ojcowski: { band: 'bg-navy', text: 'text-white' },
  chorobowy_w_ciazy: { band: 'bg-muted', text: 'text-foreground' },
  rehabilitacyjne: { band: 'bg-muted', text: 'text-foreground' },
  w_wysokosci_macierzynskiego: { band: 'bg-muted', text: 'text-foreground' },
}

export function blockColor(benefit: BenefitCode) {
  return BLOCK_COLORS[benefit] ?? { band: 'bg-muted', text: 'text-foreground' }
}

function daysBetween(from: string, to: string) {
  const start = Date.parse(from + 'T00:00:00Z')
  const end = Date.parse(to + 'T00:00:00Z')
  return Math.round((end - start) / 86_400_000)
}

function optionsOf(context: DocumentContext): DocumentOptions {
  return {
    role: context.role,
    employment: context.employment,
    payerSize: 'unknown' as PayerSize,
    coverage: context.insuranceEnd ? 'ended' : context.insured === 'yes' ? 'active' : 'unknown',
    maternityCase: context.takeoverDate ? 'takeover' : 'standard',
  }
}

/**
 * Pasy dla obojga rodziców.
 *
 * Macierzyński i uzupełniający rysujemy z okresów symulacji, a rodzicielski
 * z puli i podziału, bo symulacja zwraca go już zsumowanego dla obojga.
 * Urlopy układamy jeden po drugim: tak wygląda typowy plan i tak można
 * porównać warianty bez zgadywania, kto zaczyna.
 */
export function buildWeekTimeline(input: TimelineInput): WeekTimelineData {
  const { context, pool, respondent, secondShareDays, settings } = input
  const eventDate = context.eventDate
  const today = new Date().toISOString().slice(0, 10)
  const exclusiveDays = pool?.exclusive_days_per_parent ?? (settings?.exclusive_weeks ?? 9) * 7
  const sharedTotal = pool ? Math.max(0, pool.total_days - exclusiveDays * 2) : 0
  const secondShare = Math.min(secondShareDays, sharedTotal)
  const other: Person = respondent === 'first_parent' ? 'second_parent' : 'first_parent'
  const lanes: TimelineLane[] = []
  const respondentLabel = 'Pierwszy rodzic'
  const otherLabel = 'Drugi rodzic'

  function assessmentOf(benefit: BenefitCode) {
    return input.assessments.find((item) => item.benefit === benefit)
  }
  function range(benefit: BenefitCode): DateRange | undefined {
    return context.periods[benefit]
  }
  function block(
    benefit: BenefitCode,
    range: DateRange | undefined,
    days: number,
    exclusive = 0,
    gross: number | null = null,
    rate: number | null = null,
  ): TimelineBlock | null {
    if (!range || days <= 0) return null
    return {
      benefit,
      label: benefitList[benefit].name,
      startDay: daysBetween(eventDate, range.start),
      days,
      exclusiveDays: exclusive,
      rate,
      gross,
    }
  }

  const ownBlocks: TimelineBlock[] = []
  const maternity = assessmentOf('macierzynski')
  const maternityRange = range('macierzynski')
  if (maternityRange) {
    ownBlocks.push({
      benefit: 'macierzynski',
      label: benefitList.macierzynski.name,
      startDay: daysBetween(eventDate, maternityRange.start),
      days: daysBetween(maternityRange.start, maternityRange.end) + 1,
      exclusiveDays: 0,
      rate: maternity?.periods?.find((period) => period.rate_percent)?.rate_percent ?? null,
      gross: maternity?.gross_grosze ?? null,
    })
  }
  const supplementary = block(
    'uzupelniajacy',
    range('uzupelniajacy'),
    range('uzupelniajacy') ? daysBetween(range('uzupelniajacy')!.start, range('uzupelniajacy')!.end) + 1 : 0,
    0,
    assessmentOf('uzupelniajacy')?.gross_grosze ?? null,
  )
  if (supplementary) ownBlocks.push(supplementary)

  // Rodzicielski wywiadu może zaczynać się po macierzyńskim albo po uzupełniającym.
  const parentalRange = range('rodzicielski')
  if (parentalRange && pool) {
    const ownDays = exclusiveDays + (sharedTotal - secondShare)
    ownBlocks.push({
      benefit: 'rodzicielski',
      label: benefitList.rodzicielski.name,
      startDay: daysBetween(eventDate, parentalRange.start),
      days: ownDays,
      exclusiveDays,
      rate: assessmentOf('rodzicielski')?.periods?.find((period) => period.rate_percent)?.rate_percent ?? null,
      gross: input.averagedGross ?? assessmentOf('rodzicielski')?.gross_grosze ?? null,
    })
  } else if (parentalRange) {
    const days = daysBetween(parentalRange.start, parentalRange.end) + 1
    ownBlocks.push({
      benefit: 'rodzicielski',
      label: benefitList.rodzicielski.name,
      startDay: daysBetween(eventDate, parentalRange.start),
      days,
      exclusiveDays: 0,
      rate: null,
      gross: assessmentOf('rodzicielski')?.gross_grosze ?? null,
    })
  }

  if (context.role === 'father' && context.takeoverDate) {
    // Ojciec przejmuje macierzyński, więc macierzyński stoi na jego pasie.
    lanes.push({ person: respondent, label: respondentLabel, blocks: ownBlocks })
  } else {
    lanes.push({ person: respondent, label: respondentLabel, blocks: ownBlocks })
  }

  const otherBlocks: TimelineBlock[] = []
  if (pool && (sharedTotal - secondShare >= 0)) {
    const ownParentalEnd = ownBlocks.find((item) => item.benefit === 'rodzicielski')
    const startDay = ownParentalEnd ? ownParentalEnd.startDay + ownParentalEnd.days : 0
    const otherDays = exclusiveDays + secondShare
    if (otherDays > 0) {
      otherBlocks.push({
        benefit: 'rodzicielski',
        label: benefitList.rodzicielski.name,
        startDay,
        days: otherDays,
        exclusiveDays,
        rate: null,
        gross: null,
      })
    }
  }
  // Ojcowski stoi na pasie ojca, bo jest tylko dla niego.
  if (context.role !== 'father') {
    const paternityRange = range('ojcowski')
    if (paternityRange) {
      otherBlocks.push({
        benefit: 'ojcowski',
        label: benefitList.ojcowski.name,
        startDay: daysBetween(eventDate, paternityRange.start),
        days: 14,
        exclusiveDays: 0,
        rate: 100,
        gross: null,
      })
    }
  }
  lanes.push({ person: other, label: otherLabel, blocks: otherBlocks })

  // Taśma musi pomieścić najdłuższy pas, inaczej ostatni blok ucieka za prawą krawędź.
  const latestDay = Math.max(
    TRAILING_DAYS,
    ...lanes.flatMap((lane) => lane.blocks.map((item) => item.startDay + item.days)),
  )
  // `latestDay` liczy się od porodu, a `totalDays` od początku taśmy, czyli od szóstego tygodnia przed porodem.
  const totalDays = latestDay + LEADING_DAYS + 14

  const markers: TimelineMarker[] = [
    { day: 0, date: eventDate, label: 'Poród', detail: context.forecast ? 'Przewidywana data porodu.' : 'Data porodu z wywiadu.', kind: 'birth', missed: false },
  ]
  const todayDay = daysBetween(eventDate, today)
  if (todayDay >= -LEADING_DAYS && todayDay <= totalDays - LEADING_DAYS) {
    markers.push({ day: todayDay, date: today, label: 'Dziś', detail: 'Dzień, na który liczy się status urlopu.', kind: 'today', missed: false })
  }
  const options = optionsOf(context)
  for (const assessment of input.assessments) {
    if (assessment.status !== 'granted' && assessment.status !== 'partially_granted') continue
    for (const event of getCalendarEvents(assessment.benefit, options, context)) {
      const day = daysBetween(eventDate, event.date)
      if (day < -LEADING_DAYS || day > totalDays - LEADING_DAYS) continue
      if (markers.some((marker) => marker.date === event.date && marker.label === event.title)) continue
      markers.push({
        day,
        date: event.date,
        label: event.title,
        detail: event.hint,
        kind: 'deadline',
        missed: event.date < today,
      })
    }
  }
  markers.sort((first, second) => first.day - second.day)

  const weeks = weeksFor(totalDays, eventDate)

  return {
    origin: shiftDate(eventDate, -LEADING_DAYS),
    totalDays,
    leadingWeeks: 6,
    forecast: context.forecast,
    lanes,
    markers,
    weeks,
    birthDay: 0,
    todayDay,
    status: statusSentence(input, { ownBlocks, otherBlocks, exclusiveDays }),
  }
}

/** Jedno zdanie na górze: bez niego taśma jest tylko obrazkiem. */
function statusSentence(
  input: TimelineInput,
  data: { ownBlocks: TimelineBlock[]; otherBlocks: TimelineBlock[]; exclusiveDays: number },
) {
  const todayDay = daysBetween(input.context.eventDate, new Date().toISOString().slice(0, 10))
  const blocks = [...data.ownBlocks].sort((first, second) => first.startDay - second.startDay)
  const active = blocks.find((item) => todayDay >= item.startDay && todayDay < item.startDay + item.days)
  if (active) {
    const week = Math.floor((todayDay - active.startDay) / 7) + 1
    const left = active.startDay + active.days - todayDay
    return `Jesteś w ${week}. tygodniu: ${active.label.toLowerCase()}. Zostało ${left} dni, czyli ${Math.floor(left / 7)} tygodni i ${left % 7} dni.`
  }
  if (input.context.forecast && todayDay < 0) {
    return `Do przewidywanej daty porodu zostało ${-todayDay} dni. Taśma pokazuje plan na przewidywanej dacie i dostaje znacznik „szacunkowe”.`
  }
  const next = blocks.find((item) => item.startDay > todayDay)
  if (next) return `Najbliższy okres to ${next.label.toLowerCase()}, od ${formatDocumentDate(shiftDate(input.context.eventDate, next.startDay))}.`
  return `Wszystkie okresy z symulacji wypadają w przeszłości. Sprawdź, czy podana data porodu jest aktualna.`
}

/** Warianty do porównania: całość u jednego rodzica, podział, łączenie z pracą. */
export function timelineVariants(input: TimelineInput, shares: number[]) {
  return shares.map((share) => ({
    share,
    label: share === 0 ? 'Pierwszy rodzic bierze całość' : `Drugi rodzic bierze ${Math.round(share / 7)} tygodni`,
    timeline: buildWeekTimeline({ ...input, secondShareDays: share }),
  }))
}

export const timelineHelpers = { daysBetween, blockColor, parseNumber }
