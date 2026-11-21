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
