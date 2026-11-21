import type { ComponentType } from 'react'
import {
  ChildDetails,
  ChildQuestions,
  EmploymentEndFields,
  EmploymentFields,
  FamilyEventFields,
  PartnerFields,
  PregnancyQuestions,
  RehabilitationFields,
  RehabilitationPaymentFields,
  ReturnFields,
  RoleFields,
  SicknessFields,
  SicknessHistoryFields,
} from '@/components/benefit-interview-fields'
import { isPlacement } from '@/lib/interview-form'
import type { InterviewValues } from '@/lib/interview-form'

type InterviewStep = {
  id: string
  title: string
  description: string
  fields: (keyof InterviewValues)[]
  Fields: ComponentType<{ values: InterviewValues }>
}

export function getInterviewSteps(values: InterviewValues): InterviewStep[] {
  const isMother = values.role === 'mother'
  const steps: InterviewStep[] = [
    {
      id: 'role', title: 'Zacznijmy od Twojej roli',
      description: 'Na tej podstawie dobierzemy pytania o Twoją sytuację.',
      fields: ['role', 'birthStage'],
      Fields: RoleFields,
    },
    {
      id: 'family', title: 'Poród lub przyjęcie dziecka',
      description: 'Podaj datę zdarzenia i liczbę dzieci.',
      fields: ['eventDate', 'childCount'],
      Fields: FamilyEventFields,
    },
    {
      id: 'child-questions', title: 'Dodatkowe informacje o dziecku',
      description: 'Te odpowiedzi pomogą nam sprawdzić dodatkowe uprawnienia.',
      fields: ['placementConfirmed', 'adoptiveFather', 'adoptionOrderDate', 'takingOver', 'takeoverDate', 'zaZyciem', 'hospitalization'],
      Fields: ChildQuestions,
    },
  ]

  if (isPlacement(values) || values.hospitalization === 'yes') {
    steps.push({
      id: 'child-details', title: 'Dane dzieci',
      description: 'Uzupełnij dane dla każdego dziecka, którego dotyczy wywiad.',
      fields: ['children', 'pregnancyWeeks'],
      Fields: ChildDetails,
    })
  }

  steps.push({
    id: 'employment', title: 'Zatrudnienie i ubezpieczenie',
    description: 'Jeśli nie wiesz, czy masz ubezpieczenie, możesz wybrać „Nie wiem”.',
    fields: [
      'employment', 'insured', 'basis', 'arrears', 'employmentEnded',
      'newContractDuringPregnancy', 'workPerformedUnderContract', 'payRaisedDuringPregnancy',
    ],
    Fields: EmploymentFields,
  })
  if (values.employmentEnded) {
    steps.push({
      id: 'employment-end', title: 'Zakończenie zatrudnienia',
      description: 'Podaj, kiedy zakończyło się lub zakończy zatrudnienie.',
      fields: ['employmentEndDate', 'endedDuringPregnancy', 'endReason', 'replacementEmployment', 'extendedToBirth'],
      Fields: EmploymentEndFields,
    })
  }
  steps.push({
    id: 'partner', title: 'Drugi rodzic',
    description: 'Uzupełnij jego dane, jeśli chcecie podzielić urlop rodzicielski.',
    fields: ['partnerEmployment', 'partnerInsured', 'partnerBasis'],
    Fields: PartnerFields,
  })
  steps.push({
    id: 'return', title: 'Powrót do pracy',
    description: 'Jeśli masz już plan powrotu, możesz go uwzględnić w symulacji.',
    fields: ['returnDate', 'workingOnLeave', 'workPercent', 'contractedPercent', 'parentalDays'],
    Fields: ReturnFields,
  })
  if (!isMother) return steps

  steps.push({
    id: 'pregnancy', title: 'Świadczenia w ciąży',
    description: 'Wybierz „Tak” przy świadczeniu, o które chcesz dopytać.',
    fields: ['sickness', 'rehabilitation'],
    Fields: PregnancyQuestions,
  })
  if (values.sickness === 'yes') {
    steps.push({
      id: 'sickness', title: 'Zwolnienie lekarskie',
      description: 'Podaj daty zwolnienia i znane Ci informacje o okresie zasiłkowym.',
      fields: ['sickStart', 'sickEnd', 'insuredDays', 'sicknessDaysUsed', 'waitingExempt'],
      Fields: SicknessFields,
    })
    if (values.employment === 'employee' || values.employmentEnded) {
      steps.push({
        id: 'sickness-history', title: 'Ubezpieczenie i wypłaty chorobowe',
        description: 'Uzupełnij informacje potrzebne do sprawdzenia, kto wypłaca świadczenie.',
        fields: ['birthYear', 'employerPaidFirst', 'employerPaidSecond', 'sickInsured', 'sickPostInsuranceExclusion'],
        Fields: SicknessHistoryFields,
      })
    }
  }
  if (values.rehabilitation === 'yes') {
    steps.push(
      {
        id: 'rehabilitation', title: 'Warunki świadczenia rehabilitacyjnego',
        description: 'Podaj początek świadczenia i informacje o niezdolności do pracy.',
        fields: ['rehabStart', 'rehabDays', 'sicknessExhausted', 'stillUnable', 'favourableRuling', 'rehabExclusion'],
        Fields: RehabilitationFields,
      },
      {
        id: 'rehabilitation-payment', title: 'Wyliczenie świadczenia rehabilitacyjnego',
        description: 'Jeśli znasz wskaźnik waloryzacji, możemy wyliczyć kwotę świadczenia.',
        fields: ['rehabInsured', 'rehabPostInsurance', 'rehabInPregnancy', 'rehabIndexation'],
        Fields: RehabilitationPaymentFields,
      },
    )
  }
  return steps
}
