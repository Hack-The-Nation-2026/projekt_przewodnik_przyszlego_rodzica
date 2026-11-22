import { activeChildren, asBoolean, isPlacement, parseNumber, sicknessYears } from '@/lib/interview-form'
import type { InterviewValues } from '@/lib/interview-form'

const SOCIAL_INSURANCE = 'https://eli.gov.pl/eli/DU/1999/636'
const LABOUR_CODE = 'https://eli.gov.pl/eli/DU/1974/141'

export const benefitList = {
  chorobowy_w_ciazy: {
    name: 'Zasiłek chorobowy w ciąży',
    what: 'Pieniądze za czas, w którym w ciąży nie możesz pracować i masz zwolnienie lekarskie.',
    sources: [{ title: 'Ustawa zasiłkowa, art. 4, 8–9 i 11', url: SOCIAL_INSURANCE },
      { title: 'Kodeks pracy, art. 92', url: LABOUR_CODE }],
  },
  rehabilitacyjne: {
    name: 'Świadczenie rehabilitacyjne',
    what: 'Świadczenie po wyczerpaniu zasiłku chorobowego, gdy zdrowie nadal nie pozwala wrócić do pracy.',
    sources: [{ title: 'Ustawa zasiłkowa, art. 18–19', url: SOCIAL_INSURANCE }],
  },
  w_wysokosci_macierzynskiego: {
    name: 'Zasiłek w wysokości zasiłku macierzyńskiego',
    what: 'Świadczenie wypłacane przed porodem w określonych przypadkach ustania zatrudnienia w trakcie ciąży.',
    sources: [{ title: 'Ustawa zasiłkowa, art. 30 ust. 3', url: SOCIAL_INSURANCE }],
  },
  macierzynski: {
    name: 'Zasiłek macierzyński',
    what: 'Świadczenie za okres urlopu macierzyńskiego lub urlopu na jego warunkach po przyjęciu dziecka na wychowanie.',
    sources: [{ title: 'Ustawa zasiłkowa, art. 29–31', url: SOCIAL_INSURANCE },
      { title: 'Kodeks pracy, art. 180 i 183', url: LABOUR_CODE }],
  },
  uzupelniajacy: {
    name: 'Zasiłek za uzupełniający urlop macierzyński',
    what: 'Świadczenie za dodatkowy urlop w określonych przypadkach wcześniactwa lub pobytu dziecka w szpitalu.',
    sources: [{ title: 'Ustawa zasiłkowa, art. 29a i 31', url: SOCIAL_INSURANCE },
      { title: 'Kodeks pracy, art. 180² i 183', url: LABOUR_CODE }],
  },
  rodzicielski: {
    name: 'Zasiłek za okres urlopu rodzicielskiego',
    what: 'Pieniądze za urlop po macierzyńskim. Wymiar zależy od liczby dzieci i od tego, jak podzielicie go między sobą.',
    sources: [{ title: 'Ustawa zasiłkowa, art. 29a–31', url: SOCIAL_INSURANCE },
      { title: 'Kodeks pracy, art. 182¹a–182¹g i 183', url: LABOUR_CODE }],
  },
  ojcowski: {
    name: 'Zasiłek za okres urlopu ojcowskiego',
    what: 'Dwa tygodnie urlopu dla ojca, płatne jak zasiłek macierzyński.',
    sources: [{ title: 'Ustawa zasiłkowa, art. 29a i 31', url: SOCIAL_INSURANCE },
      { title: 'Kodeks pracy, art. 182³', url: LABOUR_CODE }],
  },
} as const

export type BenefitCode = keyof typeof benefitList
type FamilyBenefit = Extract<BenefitCode, 'macierzynski' | 'uzupelniajacy' | 'rodzicielski' | 'ojcowski'>
type Parent = 'first_parent' | 'second_parent'
type Status = 'granted' | 'denied' | 'partially_granted' | 'missing_data' | 'not_applicable'

export interface Assessment {
  benefit: BenefitCode
  person?: Parent
  status: Status
  reason: string
  days?: number
  denied_days?: number
  base_days_used?: number | null
  gross_grosze?: number | null
  /** Kwota podniesienia do wysokości świadczenia rodzicielskiego, jeśli ta podstawa dała mniej. */
  net_top_up_grosze?: number | null
  periods?: { kind: string; start: string; end: string; days: number; rate_percent?: number }[]
}
export interface ParentalPool {
  total_days: number
  exclusive_days_per_parent: number
  remaining_shared_days: number
  remaining_days_by_parent: Record<Parent, number>
}
export interface SimulationResponse {
  assessments: Assessment[]
  parental_pool?: ParentalPool | null
}

/** Ustawienia planu urlopu, które użytkownik zmienia na ekranie kalkulatora. */
export interface ParentalPlan {
  /** Wyższa stawka 81,5%, gdy wniosek trafi do 21 dni po porodzie. */
  averagedRate?: boolean
  /** Dni urlopu rodzicielskiego obojga rodziców, gdy dzielicie wspólną pulę. */
  parentalDays?: Partial<Record<Parent, number>>
  /** Dane rodzica, którym nie jest osoba wypełniająca wywiad. */
  partner?: PartnerInput
}

/** Ręcznie wpisane dane drugiego rodzica. */
export interface PartnerInput {
  employment?: 'employee' | 'contractor' | 'self_employed' | 'other'
  sickness_insured?: boolean
  monthly_basis_grosze?: number
}

interface FamilyClaim {
  benefit: FamilyBenefit
  person: Parent
  start?: string
  days?: number
  work_percent?: number
}

function employerHistory(values: InterviewValues) {
  const [first, last] = sicknessYears(values)
  const birthYear = parseNumber(values.birthYear)
  const paid = [parseNumber(values.employerPaidFirst), parseNumber(values.employerPaidSecond)]
  const years = first === last ? [first] : [first, last]
  return {
    employer_paid_days_by_year: Object.fromEntries(years.flatMap((year, index) =>
      paid[index] === undefined ? [] : [[year, paid[index]]],
    )),
    employer_annual_limits_by_year: birthYear === undefined ? undefined : Object.fromEntries(
      years.map((year) => [year, year > birthYear + 50 ? 14 : 33]),
    ),
  }
}

export function buildInterview(values: InterviewValues, plan: ParentalPlan = {}) {
  const mother = values.role === 'mother'
  const father = values.role === 'father'
  const placement = isPlacement(values)
  const adoption = values.role === 'adoption'
  const workingOnLeave = values.workingOnLeave && values.employment === 'employee'
  const insured = asBoolean(values.insured)
  const endDate = values.employmentEnded ? values.employmentEndDate : undefined
  const endedDuringPregnancy = mother && endDate ? asBoolean(values.endedDuringPregnancy) : false
  const endReason = endedDuringPregnancy === true && values.endReason !== 'unknown' ? values.endReason : undefined
  const basis = parseNumber(values.basis)
  const person = {
    employment: values.employment === 'unknown' ? undefined : values.employment,
    sickness_insured: insured,
    contribution_arrears_above_threshold:
      values.employment === 'self_employed' ? asBoolean(values.arrears) : undefined,
    monthly_basis_grosze: basis === undefined ? undefined : Math.round(basis * 100),
    employment_ended_during_pregnancy: endedDuringPregnancy,
    employment_extended_to_birth: mother && !!endDate && values.employment === 'employee' && values.extendedToBirth,
    employment_end_reason: endReason,
    contractual_work_percent: workingOnLeave ? parseNumber(values.contractedPercent) : undefined,
  }
  const expected = !placement && values.birthStage === 'expected'
  const parent: Parent = father ? 'second_parent' : 'first_parent'
  const otherParent: Parent = father ? 'first_parent' : 'second_parent'
  const partner = plan.partner
  const partnerPerson = partner ? {
    employment: partner.employment,
    sickness_insured: partner.sickness_insured,
    monthly_basis_grosze: partner.monthly_basis_grosze,
  } : undefined
  const maternity = !father || values.takingOver === 'yes'
  const paternity = father || (adoption && values.adoptiveFather === 'yes')
  const respondentDays = plan.parentalDays?.[parent]
  const partnerDays = plan.parentalDays?.[otherParent]
  const claims: FamilyClaim[] = [
    ...(maternity ? [{ benefit: 'macierzynski' as const, person: parent }] : []),
    { benefit: 'uzupelniajacy', person: parent },
    {
      benefit: 'rodzicielski', person: parent,
      ...(workingOnLeave ? {
        start: values.returnDate,
        days: parseNumber(values.parentalDays),
        work_percent: parseNumber(values.workPercent),
        // Przy tym samym wymiarze pracy w całym okresie wydłużenie liczy się z tej samej stawki.
        extension_work_percent: parseNumber(values.workPercent),
      } : respondentDays !== undefined ? { days: respondentDays } : {}),
    },
    ...(partnerDays !== undefined
      ? [{ benefit: 'rodzicielski' as const, person: otherParent, days: partnerDays }]
      : []),
  ]

  const request = {
    family: {
      event: adoption ? 'adoption' : placement ? 'foster_care' : 'birth',
      event_date: expected ? undefined : values.eventDate,
      expected_birth_date: expected ? values.eventDate : undefined,
      first_parent: father ? (partnerPerson ?? {}) : person,
      second_parent: father ? person : partnerPerson,
      adoption_proceeding: adoption ? asBoolean(values.placementConfirmed) : undefined,
      non_professional_foster_care: values.role === 'foster' ? asBoolean(values.placementConfirmed) : undefined,
      maternity_transfer: father && maternity ? values.takeoverDate : undefined,
      transfer_care_confirmed: father && maternity ? true : undefined,
      za_zyciem: values.zaZyciem,
      ...(plan.averagedRate && values.eventDate
        ? {
            averaged_rate_application: values.eventDate,
            // Wniosek o 81,5% składa ten rodzic, który urodził albo przyjął dziecko.
            averaged_rate_applicant: 'first_parent' as const,
            averaged_rate_full_period: true,
            averaged_shared_transfer_confirmed: plan.parentalDays ? true : undefined,
          }
        : {}),
      pregnancy_weeks_at_birth: values.hospitalization === 'yes' ? parseNumber(values.pregnancyWeeks) : undefined,
      children: activeChildren(values).map(({ birthDate, schoolDeferred, weight, stays, stillborn, deathDate }) => ({
        birth_date: placement ? birthDate : undefined,
        school_start_deferred: values.role === 'foster' && schoolDeferred,
        stillborn: !placement && stillborn,
        death_date: !placement && deathDate ? deathDate : undefined,
        birth_weight_g: values.hospitalization === 'yes' ? parseNumber(weight) : undefined,
        hospital_stays: values.hospitalization === 'yes' ? stays
          : values.hospitalization === 'no' ? [] : undefined,
      })),
      claims,
    },
    pregnancy_sickness: mother && values.sickness === 'yes' ? {
      person: {
        ...person,
        sickness_insured: endDate ? asBoolean(values.sickInsured) : insured,
      },
      incapacity: { start: values.sickStart, end: values.sickEnd },
      covered_days_before_incapacity: parseNumber(values.insuredDays),
      sickness_days_used: parseNumber(values.sicknessDaysUsed),
      waiting_period_exempt: asBoolean(values.waitingExempt),
      insurance_ended_on: endDate,
      post_insurance_exclusion_applies: endDate ? asBoolean(values.sickPostInsuranceExclusion) : undefined,
      ...(values.employment === 'employee' ? employerHistory(values) : {}),
    } : undefined,
    rehabilitation: mother && values.rehabilitation === 'yes' ? {
      person: {
        ...person,
        sickness_insured: endDate ? asBoolean(values.rehabInsured) : insured,
      },
      start: values.rehabStart,
      days: parseNumber(values.rehabDays),
      sickness_pool_exhausted: asBoolean(values.sicknessExhausted),
      still_unable_to_work: asBoolean(values.stillUnable),
      favourable_medical_ruling: asBoolean(values.favourableRuling),
      exclusion_applies: asBoolean(values.rehabExclusion),
      eligible_after_insurance_ended: endDate ? asBoolean(values.rehabPostInsurance) : undefined,
      incapacity_during_pregnancy: values.rehabInPregnancy,
      indexation_factor: parseNumber(values.rehabIndexation),
    } : undefined,
    post_employment: endedDuringPregnancy === true ? {
      person,
      last_employment_day: endDate,
      birth_date: values.eventDate,
      replacement_employment_provided: asBoolean(values.replacementEmployment),
    } : undefined,
  }

  const supplemental: Assessment[] = []
  function add(benefit: BenefitCode, status: Status, reason: string) {
    supplemental.push({ benefit, status, reason })
  }
  function missingHealth(benefit: BenefitCode, assessed: boolean, declined: boolean, description: string) {
    if (!assessed) {
      add(benefit, !mother || declined ? 'not_applicable' : 'missing_data', !mother
        ? 'Ta część wywiadu dotyczy osoby, która była lub jest w ciąży.'
        : description)
    }
  }
  missingHealth('chorobowy_w_ciazy', !!request.pregnancy_sickness, values.sickness === 'no',
    values.sickness === 'no' ? 'Nie wskazano zwolnienia w ciąży.' : 'Potwierdź zwolnienie w ciąży, aby sprawdzić to świadczenie.')
  missingHealth('rehabilitacyjne', !!request.rehabilitation, values.rehabilitation === 'no',
    values.rehabilitation === 'no' ? 'Ten wariant nie obejmuje świadczenia rehabilitacyjnego.'
      : 'Podaj dane o dalszej niezdolności do pracy i orzeczeniu.')
  if (!request.post_employment) {
    add('w_wysokosci_macierzynskiego', mother && endDate && endedDuringPregnancy === undefined ? 'missing_data' : 'not_applicable',
      mother && endDate && endedDuringPregnancy === undefined
        ? 'Potwierdź, czy zatrudnienie ustało w trakcie ciąży.'
        : 'Nie wskazano ustania zatrudnienia w trakcie ciąży w wybranym scenariuszu.')
  }
  if (!maternity) {
    add('macierzynski', values.takingOver === 'no' ? 'not_applicable' : 'missing_data',
      values.takingOver === 'no' ? 'Nie wskazano przejęcia macierzyńskiego od matki.'
        : 'Podaj, czy przejmujesz opiekę i pozostały okres macierzyńskiego od matki.')
  }
  if (!paternity) {
    add('ojcowski', adoption && values.adoptiveFather === 'unknown' ? 'missing_data' : 'not_applicable',
      adoption && values.adoptiveFather === 'unknown' ? 'Potwierdź, czy jesteś ojcem adopcyjnym.'
        : 'Ojcowski dotyczy ojca biologicznego albo adopcyjnego.')
  }

  const paternityRequest = paternity ? {
    family: {
      ...request.family,
      maternity_transfer: undefined,
      transfer_care_confirmed: undefined,
      averaged_rate_application: undefined,
      averaged_rate_full_period: undefined,
      averaged_shared_transfer_confirmed: undefined,
      adoption_order_date: adoption ? values.adoptionOrderDate : undefined,
      paternity_eligible_parent: parent,
      claims: [{ benefit: 'ojcowski', person: parent }],
    },
  } : undefined

  return {
    request,
    paternityRequest,
    supplemental,
    expected,
    parent,
    returnDate: workingOnLeave ? undefined : values.returnDate || undefined,
  }
}
