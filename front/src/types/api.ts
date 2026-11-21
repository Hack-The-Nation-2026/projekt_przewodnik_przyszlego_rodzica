export interface BenefitSummary {
  code: string
  name: string
  description: string
}

export interface HealthStatus {
  status: string
}

/** Dane, które wracają z symulowanego logowania mObywatela albo z ręcznego wpisania. */
export interface Citizen {
  pesel: string
  first_name: string
  last_name: string
  case_code: string
  case_label: string
  status: string
  /** Skąd przyszły dane: mobywatel albo manual. */
  source?: string
}

/** Wejście bez logowania: to, co osoba wpisuje w formularzu. */
export interface ManualEntry {
  first_name: string
  last_name: string
  pesel: string
  case_label?: string
}

/** Konto demonstracyjne wystawiane tylko poza produkcją. */
export interface DemoAccount {
  identifier: string
  password: string
  citizen: Citizen
}

/** Symulacja ZUS: stan ubezpieczenia i zadłużenia na wybrany dzień. */
export interface ZusInsurance {
  insured: boolean
  payer: string
  title_code: string
  title_name: string
  covered_since: string | null
  last_contribution: string | null
  note: string
}

export interface ZusDebtItem {
  period: string
  title: string
  amount_grosze: number
}

export interface ZusDebt {
  as_of: string
  has_debt: boolean
  total_grosze: number
  items: ZusDebtItem[]
  effect: string
}

export interface ZusProfile {
  as_of: string
  insurance: ZusInsurance
  debt: ZusDebt
}

/** Zaświadczenie e-ZLA widoczne w symulowanym koncie. */
export interface EzlaCertificate {
  document_id: string
  issued_at: string
  doctor: string
  diagnosis_code: string
  kind: 'chorobowe' | 'opieka'
  label: string
  period_from: string
  period_to: string
  days: number
  basis_grosze: number
  status: string
}

export interface PueInsurancePeriod {
  from_date: string
  to_date: string | null
  payer: string
  title_name: string
}

/** Sesja wglądu w PUE/eZUS. */
export interface PueSession {
  connected_at: string
  valid_minutes: number
  person: string
  periods: PueInsurancePeriod[]
  document_count: number
  last_document: string | null
  note: string
}

export interface BirthCertificateOrder {
  number: string
  copy_type: 'zupelny' | 'skrocony'
  office: string
  child_name: string
  ready_from: string
  note: string
}

export interface ZusLink {
  label: string
  url: string
  description: string
}

/** Parametry kalkulatora zmieniane z panelu administracyjnego. */
export interface RateSettings {
  maternity: number
  averaged: number
  parental: number
}

export interface LeaveSettings {
  maternity_weeks_by_child_count: number[]
  parental_weeks_single: number
  parental_weeks_multiple: number
  za_zyciem_extra_weeks: number
  exclusive_weeks: number
}

export interface FeatureFlag {
  key: string
  label: string
  description: string
  enabled: boolean
}

export interface AppSettings {
  rates: RateSettings
  leave: LeaveSettings
  features: FeatureFlag[]
  updated_at: string | null
}

/** Status decyzji w zestawie spraw. Te same wartości co w kalkulatorze. */
export type CaseStatus = 'granted' | 'denied' | 'partially_granted' | 'missing_data'
export type CaseParent = 'first_parent' | 'second_parent'

export interface CaseExpectedRow {
  benefit: string
  person: CaseParent
  status: CaseStatus
  gross_grosze: number | null
}

/** Wniosek z zestawu demonstracyjnego, widoczny na liście wyboru. */
export interface CaseSummary {
  id: string
  title: string
  facts: string
  applicant_label: string
  expected: CaseExpectedRow[]
}

export interface CaseInsurance {
  covered: boolean | null
  reason: string
  rule_ids: string[]
}

export interface CaseComparisonRow {
  benefit: string
  person: CaseParent
  status: CaseStatus
  gross_grosze: number | null
  expected_status: CaseStatus
  expected_gross_grosze: number | null
  matches: boolean
}

export interface CaseUnexpectedRow {
  benefit: string
  person: CaseParent
  status: CaseStatus
  gross_grosze: number | null
}

export interface CaseAssessment {
  benefit: string
  person: CaseParent
  status: CaseStatus
  reason_code: string
  reason: string
  rule_ids: string[]
  days: number
  denied_days: number
  monthly_basis_grosze: number | null
  gross_grosze: number | null
  periods: {
    kind: string
    start: string
    end: string
    days: number
    rate_percent: number
    daily_grosze: number | null
    gross_grosze: number | null
  }[]
}

/** Wynik przejścia wniosku przez weryfikację i kalkulator. */
export interface CaseResult {
  case_id: string
  title: string
  facts: string
  applicant: {
    label: string
    employment: 'employee' | 'contractor' | 'self_employed' | 'none'
    insured: boolean | null
    insurance_kind: 'compulsory' | 'voluntary' | null
    insured_days: number | null
    waiting_period_exempt: boolean
    contribution_arrears: boolean | null
    employment_ended_in_pregnancy: boolean
    employment_end_reason: string | null
  }
  insurance: CaseInsurance
  assessments: CaseAssessment[]
  comparison: CaseComparisonRow[]
  unexpected: CaseUnexpectedRow[]
  matches: boolean | null
}

/** Wniosek do wysłania z formularza albo wgrany z pliku JSON. */
export interface CaseApplication {
  id: string
  title: string
  facts: string
  applicant: Record<string, unknown>
  request: Record<string, unknown>
  expected: CaseExpectedRow[]
}

/** Miejsce, do którego odsyła asystent: nasza podstrona albo strona instytucji. */
export interface AssistantLink {
  label: string
  href: string
  kind: 'page' | 'external'
  description: string | null
}

/** Gotowe pytanie pokazywane jako podpowiedź pod rozmową. */
export interface AssistantTopic {
  id: string
  question: string
}

/** Odpowiedź asystenta: co powiedzieć i gdzie odesłać. Kwot nie ma. */
export interface AssistantAnswer {
  topic: string | null
  answer: string
  links: AssistantLink[]
  suggestions: AssistantTopic[]
  /** Kto ułożył zdanie: katalog tematów czy model językowy. Linki zawsze z katalogu. */
  mode: 'catalog' | 'model'
}
