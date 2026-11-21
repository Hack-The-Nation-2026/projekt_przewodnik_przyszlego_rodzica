import type { Assessment, BenefitCode } from '@/lib/benefit-interview'
import type { InterviewValues } from '@/lib/interview-form'

export type DateRange = { start: string; end: string }

export interface DocumentContext {
  role: InterviewValues['role']
  employment: InterviewValues['employment']
  insured: InterviewValues['insured']
  eventDate: string
  forecast: boolean
  insuranceEnd?: string
  takeoverDate?: string
  endReason?: InterviewValues['endReason']
  extendedToBirth: boolean
  zaZyciem: boolean
  workingOnLeave: boolean
  periods: Partial<Record<BenefitCode, DateRange>>
}

export function isFamilyBenefit(benefit: BenefitCode) {
  return benefit === 'macierzynski' || benefit === 'uzupelniajacy' || benefit === 'rodzicielski' || benefit === 'ojcowski'
}

export function contextFromInterview(values: InterviewValues, assessments: Assessment[]): DocumentContext {
  const respondent = values.role === 'father' ? 'second_parent' : 'first_parent'
  const periods: DocumentContext['periods'] = {}
  for (const assessment of assessments) {
    if (isFamilyBenefit(assessment.benefit) && assessment.person && assessment.person !== respondent) continue
    // Wynagrodzenie chorobowe od pracodawcy nie jest okresem wniosku o zasiłek.
    const payable = assessment.periods?.filter((period) => period.kind !== 'wynagrodzenie_chorobowe')
    if (!payable?.length) continue
    periods[assessment.benefit] = {
      start: payable.reduce((start, period) => period.start < start ? period.start : start, payable[0].start),
      end: payable.reduce((end, period) => period.end > end ? period.end : end, payable[0].end),
    }
  }
  return {
    role: values.role,
    employment: values.employment,
    insured: values.insured,
    eventDate: values.eventDate,
    forecast: (values.role === 'mother' || values.role === 'father') && values.birthStage === 'expected',
    insuranceEnd: values.employmentEnded ? values.employmentEndDate : undefined,
    takeoverDate: values.role === 'father' && values.takingOver === 'yes' ? values.takeoverDate : undefined,
    endReason: values.employmentEnded && values.endedDuringPregnancy === 'yes' ? values.endReason : undefined,
    extendedToBirth: values.employmentEnded && values.employment === 'employee' && values.extendedToBirth,
    zaZyciem: values.zaZyciem,
    workingOnLeave: values.employment === 'employee' && values.workingOnLeave,
    periods,
  }
}
