import { type ReactNode, useState } from 'react'
import { Check, CircleAlert, CircleHelp, ShieldCheck, ShieldX, X } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { SampleRecognition } from '@/components/sample-recognition'
import { cn } from '@/lib/utils'
import type { CaseAssessment, CaseParent, CaseResult, CaseStatus } from '@/types/api'

const currency = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  useGrouping: 'always',
})
const number = new Intl.NumberFormat('pl-PL')

/** Kwoty przychodzą w groszach, a na ekranie mają być złotówki. */
function money(grosze: number | null) {
  return grosze === null ? '—' : currency.format(grosze / 100)
}

const statusCopy = {
  granted: { label: 'Przysługuje', icon: Check, tone: 'bg-primary text-primary-foreground' },
  partially_granted: {
    label: 'Częściowo',
    icon: CircleAlert,
    tone: 'bg-blue-600 text-white',
  },
  denied: { label: 'Nie przysługuje', icon: X, tone: 'bg-red-600 text-white' },
  missing_data: {
    label: 'Brakuje danych',
    icon: CircleHelp,
    tone: 'bg-amber-300 text-amber-950',
  },
} satisfies Record<CaseStatus, { label: string; icon: typeof Check; tone: string }>

const benefitLabels: Record<string, string> = {
  macierzynski: 'Zasiłek macierzyński',
  rodzicielski: 'Zasiłek za urlop rodzicielski',
  uzupelniajacy: 'Uzupełniający urlop macierzyński',
  ojcowski: 'Urlop ojcowski',
  chorobowy_w_ciazy: 'Zasiłek chorobowy w ciąży',
  w_wysokosci_macierzynskiego: 'Zasiłek w wysokości macierzyńskiego',
  rehabilitacyjne: 'Świadczenie rehabilitacyjne',
  podwyzszenie_macierzynskiego: 'Podwyższenie do świadczenia rodzicielskiego',
  wynagrodzenie_chorobowe: 'Wynagrodzenie chorobowe od pracodawcy',
  zasilek_chorobowy: 'Zasiłek chorobowy',
}

const employmentLabels: Record<string, string> = {
  employee: 'umowa o pracę',
  contractor: 'umowa cywilnoprawna',
  self_employed: 'działalność gospodarcza',
  none: 'brak tytułu do ubezpieczenia',
}

const insuranceKindLabels: Record<string, string> = {
  compulsory: 'obowiązkowe',
  voluntary: 'dobrowolne',
}

const parentLabels: Record<CaseParent, string> = {
  first_parent: 'pierwszy rodzic',
  second_parent: 'drugi rodzic',
}

function benefitLabel(code: string) {
  return benefitLabels[code] ?? code
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const { label, icon: Icon, tone } = statusCopy[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium',
        tone,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </span>
  )
}

/** Sekcja wyniku oddzielona kreską, żeby całość czytała się jak jedno pismo, nie stos kart. */
function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-3 border-t border-border pt-6', className)}>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/** Jedno zdanie o tym, czy wyliczenie zgadza się z decyzją zapisaną w dokumencie. */
function Verdict({ result }: { result: CaseResult }) {
  if (result.matches === null) {
    return (
      <p className="text-muted-foreground">
        Dokument nie zawiera decyzji, więc pokazujemy samo wyliczenie.
      </p>
    )
  }
  return result.matches ? (
    <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-semibold text-primary">Wyliczenie zgadza się z decyzją</p>
        <p className="mt-1 text-muted-foreground">
          Weryfikacja ubezpieczenia i kalkulator dają to samo, co zapisano w dokumencie.
        </p>
      </div>
    </div>
  ) : (
    <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
      <ShieldX className="mt-0.5 size-5 shrink-0 text-red-700" aria-hidden />
      <div>
        <p className="font-semibold text-red-800">Wyliczenie różni się od decyzji</p>
        <p className="mt-1 text-red-900/80">
          Sprawdź wiersze oznaczone na czerwono w porównaniu poniżej.
        </p>
      </div>
    </div>
  )
}

function InsurancePanel({ result }: { result: CaseResult }) {
  const { covered, reason, rule_ids } = result.insurance
  const tone =
    covered === true
      ? 'bg-primary/10 text-primary'
      : covered === false
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-900'
  const label =
    covered === true
      ? 'Osoba podlega ubezpieczeniu chorobowemu'
      : covered === false
        ? 'Brak podstawy do zasiłku'
        : 'Nie da się tego rozstrzygnąć z danych'

  return (
    <Panel title="Weryfikacja ubezpieczenia">
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium', tone)}>
        {label}
      </span>
      <p className="text-muted-foreground">{reason}</p>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Osoba</dt>
          <dd className="font-medium">{result.applicant.label}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Tytuł</dt>
          <dd className="font-medium">
            {employmentLabels[result.applicant.employment] ?? result.applicant.employment}
          </dd>
        </div>
        {result.applicant.insurance_kind && (
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Rodzaj ubezpieczenia</dt>
            <dd className="font-medium">
              {insuranceKindLabels[result.applicant.insurance_kind] ?? result.applicant.insurance_kind}
            </dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Okres ubezpieczenia</dt>
          <dd className="font-medium">
            {result.applicant.insured_days === null
              ? 'nie podano'
              : `${number.format(result.applicant.insured_days)} dni`}
          </dd>
        </div>
      </dl>
      {rule_ids.length > 0 && (
        <p className="text-sm text-muted-foreground">Reguły ubezpieczenia: {rule_ids.join(', ')}</p>
      )}
    </Panel>
  )
}

function AssessmentsList({ assessments }: { assessments: CaseAssessment[] }) {
  return (
    <ul className="divide-y">
      {assessments.map((row) => (
        <li
          key={`${row.benefit}-${row.person}`}
          className="flex flex-wrap items-baseline gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0"
        >
          <div className="w-full sm:min-w-0 sm:flex-1">
            <p className="font-medium">{benefitLabel(row.benefit)}</p>
            <p className="text-sm text-muted-foreground">
              {parentLabels[row.person]}
              {row.denied_days > 0 && `, poza limitem: ${row.denied_days} dni`}
            </p>
          </div>
          <StatusBadge status={row.status} />
          <span className="text-sm text-muted-foreground tabular-nums">
            {row.days ? `${row.days} dni` : 'brak dni'}
          </span>
          <span className="min-w-[7rem] text-right font-medium tabular-nums">
            {money(row.gross_grosze)}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Para status i kwota w jednym miejscu, żeby porównanie czytało się bez tabeli. */
function Figure({ label, status, amount }: { label: string; status: CaseStatus; amount: number | null }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <StatusBadge status={status} />
        <span className="font-medium tabular-nums">{money(amount)}</span>
      </div>
    </div>
  )
}

function ComparisonList({ result }: { result: CaseResult }) {
  return (
    <ul className="divide-y">
      {result.comparison.map((row) => (
        <li
          key={`${row.benefit}-${row.person}`}
          className={cn(
            'space-y-3 border-l-2 py-4 pl-4 first:pt-0 last:pb-0',
            row.matches ? 'border-transparent' : 'border-red-400',
          )}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-medium">{benefitLabel(row.benefit)}</p>
            <p className="text-sm text-muted-foreground">{parentLabels[row.person]}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Figure label="Decyzja" status={row.expected_status} amount={row.expected_gross_grosze} />
            <Figure label="Kalkulator" status={row.status} amount={row.gross_grosze} />
          </div>
          <p
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-medium',
              row.matches ? 'text-primary' : 'text-red-700',
            )}
          >
            {row.matches ? (
              <>
                <Check className="size-4" aria-hidden />
                zgadza się
              </>
            ) : (
              <>
                <X className="size-4" aria-hidden />
                różnica
              </>
            )}
          </p>
        </li>
      ))}
    </ul>
  )
}

function ResultView({ result }: { result: CaseResult }) {
  /* Bez decyzji w dokumencie nie ma z czym porównywać, więc zostaje samo wyliczenie. */
  const hasDecision = result.comparison.length > 0
  return (
    <section aria-labelledby="case-result" className="space-y-6">
      <div className="space-y-3">
        <h2 id="case-result" className="font-display text-xl font-semibold text-navy">
          Wynik sprawdzenia
        </h2>
        <Verdict result={result} />
      </div>

      <InsurancePanel result={result} />

      {hasDecision && (
        <Panel
          title="Porównanie z decyzją"
          description="Po lewej to, co zapisano w dokumencie. Po prawej wynik kalkulatora na tych samych danych."
        >
          <ComparisonList result={result} />
        </Panel>
      )}

      {hasDecision && result.unexpected.length > 0 && (
        <section className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-amber-950">
            <CircleAlert className="size-5" aria-hidden />
            Kalkulator policzył więcej niż decyzja
          </h3>
          <p className="text-sm text-amber-900/80">
            Te pozycje nie mają odpowiednika w zapisanej decyzji, więc wynik nie jest zgodny.
          </p>
          <ul className="space-y-2">
            {result.unexpected.map((row) => (
              <li
                key={`${row.benefit}-${row.person}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
              >
                <span className="font-medium">{benefitLabel(row.benefit)}</span>
                <span className="text-sm text-muted-foreground">{parentLabels[row.person]}</span>
                <StatusBadge status={row.status} />
                <span className="tabular-nums">{money(row.gross_grosze)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Panel title="Świadczenia z kalkulatora" description="Kwoty brutto. Okresy liczone w dniach kalendarzowych.">
        <AssessmentsList assessments={result.assessments} />
      </Panel>
    </section>
  )
}

export function SprawyPage() {
  const [result, setResult] = useState<CaseResult | null>(null)

  return (
    <PageContainer className="space-y-8 py-10">
      <PageHeading
        title="Sprawy"
        description="Wgraj dokument z ZUS, a sprawdzimy ubezpieczenie i policzymy świadczenia na danych z pisma."
      />

      <SampleRecognition onResult={setResult} />

      {result && <ResultView result={result} />}
    </PageContainer>
  )
}
