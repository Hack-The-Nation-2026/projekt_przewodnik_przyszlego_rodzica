import { z } from 'zod'

const answer = z.enum(['unknown', 'yes', 'no'])
const hospitalStay = z.object({ start: z.string(), end: z.string() })
const child = z.object({
  birthDate: z.string(),
  schoolDeferred: z.boolean(),
  weight: z.string(),
  stays: z.array(hospitalStay),
})

const fields = z.object({
  role: z.enum(['mother', 'father', 'adoption', 'foster']),
  birthStage: z.enum(['expected', 'born']),
  eventDate: z.string(),
  childCount: z.string(),
  children: z.array(child),
  placementConfirmed: answer,
  adoptiveFather: answer,
  adoptionOrderDate: z.string(),
  zaZyciem: z.boolean(),
  hospitalization: answer,
  pregnancyWeeks: z.string(),

  employment: z.enum(['unknown', 'employee', 'contractor', 'self_employed', 'other']),
  insured: answer,
  arrears: answer,
  basis: z.string(),
  employmentEnded: z.boolean(),
  employmentEndDate: z.string(),
  endedDuringPregnancy: answer,
  endReason: z.enum(['unknown', 'death', 'bankruptcy', 'liquidation', 'unlawful_court_ruling', 'other']),
  extendedToBirth: z.boolean(),
  replacementEmployment: answer,

  partnerEmployment: z.enum(['unknown', 'employee', 'contractor', 'self_employed', 'other']),
  partnerInsured: answer,
  partnerBasis: z.string(),

  takingOver: answer,
  takeoverDate: z.string(),
  returnDate: z.string(),
  workingOnLeave: z.boolean(),
  workPercent: z.string(),
  contractedPercent: z.string(),
  parentalDays: z.string(),

  sickness: answer,
  sickStart: z.string(),
  sickEnd: z.string(),
  insuredDays: z.string(),
  sicknessDaysUsed: z.string(),
  waitingExempt: answer,
  sickInsured: answer,
  birthYear: z.string(),
  employerPaidFirst: z.string(),
  employerPaidSecond: z.string(),
  sickPostInsuranceExclusion: answer,

  rehabilitation: answer,
  rehabStart: z.string(),
  rehabDays: z.string(),
  sicknessExhausted: answer,
  stillUnable: answer,
  favourableRuling: answer,
  rehabExclusion: answer,
  rehabInPregnancy: z.boolean(),
  rehabInsured: answer,
  rehabPostInsurance: answer,
  rehabIndexation: z.string(),
})

const dateValue = z.iso.date().refine((value) => value >= '1900-01-01' && value <= '2199-12-31')
const unsignedDecimal = /^\d+(?:[.,]\d{1,2})?$/

export const interviewSchema = fields.superRefine((values, ctx) => {
  function issue(path: (string | number)[], message: string) {
    ctx.addIssue({ code: 'custom', path, message })
  }

  function date(path: (string | number)[], value: string, required = false) {
    if (!value && required) issue(path, 'Podaj datę.')
    else if (value && !dateValue.safeParse(value).success) issue(path, 'Podaj poprawną datę.')
  }

  function number(key: keyof InterviewValues, min: number, max: number, required = false, int = true) {
    const value = values[key]
    if (typeof value !== 'string') return
    if (!value && !required) return
    const parsed = parseNumber(value)
    if (parsed === undefined || parsed < min || parsed > max || (int && !Number.isInteger(parsed))) {
      issue([key], `Podaj ${int ? 'liczbę całkowitą' : 'wartość'} od ${min} do ${max}.`)
    }
  }

  date(['eventDate'], values.eventDate, true)
  number('childCount', 1, 12, true)
  number('basis', 0, 10_000_000, false, false)
  number('partnerBasis', 0, 10_000_000, false, false)
  const children = activeChildren(values)
  const placement = isPlacement(values)
  const hospital = values.hospitalization === 'yes'

  if (hospital) {
    number('pregnancyWeeks', 20, 45)
    if (!children.some((item) => item.stays.length > 0)) {
      issue(['children', 0, 'stays'], 'Dodaj co najmniej jeden pobyt dziecka w szpitalu.')
    }
  }
  children.forEach((item, index) => {
    if (placement) {
      date(['children', index, 'birthDate'], item.birthDate, true)
      if (item.birthDate > values.eventDate && values.eventDate) {
        issue(['children', index, 'birthDate'], 'Dziecko musi urodzić się przed przyjęciem na wychowanie.')
      }
    }
    if (hospital) {
      const weight = parseNumber(item.weight)
      if (item.weight && (weight === undefined || !Number.isInteger(weight) || weight < 1 || weight > 10000)) {
        issue(['children', index, 'weight'], 'Podaj wagę w gramach, od 1 do 10 000.')
      }
      item.stays.forEach((stay, stayIndex) => {
        date(['children', index, 'stays', stayIndex, 'start'], stay.start, true)
        date(['children', index, 'stays', stayIndex, 'end'], stay.end, true)
        if (stay.start && stay.end && stay.end < stay.start) {
          issue(['children', index, 'stays', stayIndex, 'end'], 'Koniec pobytu musi być po jego rozpoczęciu.')
        }
      })
    }
  })

  if (values.role === 'adoption' && values.adoptiveFather === 'yes') {
    date(['adoptionOrderDate'], values.adoptionOrderDate, true)
  }
  if (values.role === 'father' && values.takingOver === 'yes') {
    date(['takeoverDate'], values.takeoverDate, true)
  }
  if (values.employmentEnded) date(['employmentEndDate'], values.employmentEndDate, true)
  date(['returnDate'], values.returnDate, values.workingOnLeave && values.employment === 'employee')
  if (values.workingOnLeave && values.employment === 'employee') {
    number('workPercent', 0.01, 50, true, false)
    number('contractedPercent', 0.01, 100, true, false)
    number('parentalDays', 1, 469, true)
    const work = parseNumber(values.workPercent)
    const contracted = parseNumber(values.contractedPercent)
    if (work !== undefined && contracted !== undefined && work >= contracted) {
      issue(['workPercent'], 'Wpisz wymiar niższy od wymiaru z umowy.')
    }
  }

  if (values.role === 'mother' && values.sickness === 'yes') {
    date(['sickStart'], values.sickStart, true)
    date(['sickEnd'], values.sickEnd, true)
    if (values.sickStart && values.sickEnd && values.sickEnd < values.sickStart) {
      issue(['sickEnd'], 'Koniec zwolnienia musi być po jego rozpoczęciu.')
    }
    const [first, last] = sicknessYears(values)
    if (first && last && last - first > 1) issue(['sickEnd'], 'Wybierz okres obejmujący najwyżej dwa lata kalendarzowe.')
    number('insuredDays', 0, 50000)
    number('sicknessDaysUsed', 0, 270)
    if (values.employment === 'employee') {
      number('birthYear', 1900, new Date().getFullYear())
      number('employerPaidFirst', 0, 33)
      if (first && last && first !== last) number('employerPaidSecond', 0, 33)
    }
  }
  if (values.role === 'mother' && values.rehabilitation === 'yes') {
    date(['rehabStart'], values.rehabStart, true)
    number('rehabDays', 1, 730, true)
    number('rehabIndexation', 1, 10, false, false)
  }
})

export type InterviewValues = z.infer<typeof fields>
export type Answer = z.infer<typeof answer>

export const interviewDefaults: InterviewValues = {
  role: 'mother', birthStage: 'expected', eventDate: '', childCount: '1',
  children: Array.from({ length: 12 }, () => ({ birthDate: '', schoolDeferred: false, weight: '', stays: [] })),
  placementConfirmed: 'unknown', adoptiveFather: 'unknown', adoptionOrderDate: '',
  zaZyciem: false, hospitalization: 'unknown', pregnancyWeeks: '',
  employment: 'unknown', insured: 'unknown', arrears: 'unknown', basis: '',
  employmentEnded: false, employmentEndDate: '', endedDuringPregnancy: 'unknown',
  endReason: 'unknown', extendedToBirth: false, replacementEmployment: 'unknown',
  takingOver: 'unknown', takeoverDate: '', returnDate: '', workingOnLeave: false,
  partnerEmployment: 'unknown', partnerInsured: 'unknown', partnerBasis: '',
  workPercent: '', contractedPercent: '100', parentalDays: '',
  sickness: 'unknown', sickStart: '', sickEnd: '', insuredDays: '', sicknessDaysUsed: '',
  waitingExempt: 'unknown', sickInsured: 'unknown', birthYear: '', employerPaidFirst: '', employerPaidSecond: '',
  sickPostInsuranceExclusion: 'unknown', rehabilitation: 'unknown', rehabStart: '',
  rehabDays: '', sicknessExhausted: 'unknown', stillUnable: 'unknown', favourableRuling: 'unknown',
  rehabExclusion: 'unknown', rehabInPregnancy: false, rehabIndexation: '', rehabInsured: 'unknown',
  rehabPostInsurance: 'unknown',
}

export function parseNumber(value: string) {
  return unsignedDecimal.test(value.trim()) ? Number(value.trim().replace(',', '.')) : undefined
}

export function isPlacement(values: InterviewValues) {
  return values.role === 'adoption' || values.role === 'foster'
}

export function activeChildren(values: InterviewValues) {
  const count = parseNumber(values.childCount) ?? 1
  return values.children.slice(0, Math.min(12, Math.max(1, Math.floor(count))))
}

export function sicknessYears(values: InterviewValues) {
  return [Number(values.sickStart.slice(0, 4)), Number(values.sickEnd.slice(0, 4))]
}

export function asBoolean(value: Answer) {
  return value === 'unknown' ? undefined : value === 'yes'
}
