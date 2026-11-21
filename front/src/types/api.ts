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
