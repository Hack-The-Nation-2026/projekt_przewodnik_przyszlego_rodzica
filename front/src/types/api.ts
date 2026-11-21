export interface BenefitSummary {
  code: string
  name: string
  description: string
}

export interface HealthStatus {
  status: string
}

/** Dane, które wracają z symulowanego logowania mObywatela. */
export interface Citizen {
  pesel: string
  first_name: string
  last_name: string
  case_code: string
  case_label: string
  status: string
}

/** Konto demonstracyjne wystawiane tylko poza produkcją. */
export interface DemoAccount {
  identifier: string
  password: string
  citizen: Citizen
}
