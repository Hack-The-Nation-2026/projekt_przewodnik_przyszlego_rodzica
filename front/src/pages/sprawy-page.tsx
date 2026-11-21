import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Check, CircleAlert, CircleHelp, Download, FileUp, ShieldCheck, ShieldX, X } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCase, useCases, useSimulateCase } from '@/hooks/use-cases'
import { api } from '@/lib/api'
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

/** Jedno zdanie o tym, czy wniosek przeszedł tak, jak mówi decyzja. */
function Verdict({ result }: { result: CaseResult }) {
  if (result.matches === null) {
    return (
      <p className="text-muted-foreground">
        Ten wniosek nie ma zapisanej decyzji, więc pokazujemy tylko wyliczenie.
      </p>
    )
  }
  return result.matches ? (
    <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-semibold text-primary">Wynik zgadza się z decyzją</p>
        <p className="mt-1 text-muted-foreground">
          Weryfikacja ubezpieczenia i kalkulator dają to samo, co zapisano dla tej sprawy.
        </p>
      </div>
    </div>
  ) : (
    <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
      <ShieldX className="mt-0.5 size-5 shrink-0 text-red-700" aria-hidden />
      <div>
        <p className="font-semibold text-red-800">Wynik różni się od decyzji</p>
        <p className="mt-1 text-red-900/80">
          Sprawdź wiersze oznaczone na czerwono w porównaniu poniżej.
        </p>
      </div>
    </div>
  )
}

function InsuranceCard({ result }: { result: CaseResult }) {
  const { covered, reason, rule_ids } = result.insurance
  const tone =
    covered === true
      ? 'border-primary/30 bg-primary/5'
      : covered === false
        ? 'border-red-300 bg-red-50'
        : 'border-amber-300 bg-amber-50'
  const Icon = covered === false ? ShieldX : ShieldCheck
  const label =
    covered === true
      ? 'Osoba podlega ubezpieczeniu chorobowemu'
      : covered === false
        ? 'Brak podstawy do zasiłku'
        : 'Nie da się tego rozstrzygnąć z danych'

  return (
    <Card className={cn('border', tone)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-5" aria-hidden />
          Weryfikacja ubezpieczenia
        </CardTitle>
        <CardDescription className="text-base">{result.applicant.label}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-lg font-medium">{label}</p>
        <p className="text-muted-foreground">{reason}</p>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Tytuł</dt>
            <dd className="font-medium">
              {employmentLabels[result.applicant.employment] ?? result.applicant.employment}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Rodzaj ubezpieczenia</dt>
            <dd className="font-medium">
              {result.applicant.insurance_kind
                ? (insuranceKindLabels[result.applicant.insurance_kind] ??
                  result.applicant.insurance_kind)
                : 'nie podano'}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Okres ubezpieczenia</dt>
            <dd className="font-medium">
              {result.applicant.insured_days === null
                ? 'nie podano'
                : `${number.format(result.applicant.insured_days)} dni`}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">
          Podstawa: {rule_ids.join(', ')}
        </p>
      </CardContent>
    </Card>
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
          <div className="min-w-0 flex-1">
            <p className="font-medium">{benefitLabel(row.benefit)}</p>
            <p className="text-sm text-muted-foreground">
              {parentLabels[row.person]}
              {row.denied_days > 0 && ` · poza limitem: ${row.denied_days} dni`}
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
  if (result.comparison.length === 0) return null
  return (
    <ul className="space-y-3">
      {result.comparison.map((row) => (
        <li
          key={`${row.benefit}-${row.person}`}
          className={cn(
            'rounded-md border p-4',
            row.matches ? 'border-neutral-200' : 'border-red-300 bg-red-50',
          )}
        >
          <p className="font-medium">{benefitLabel(row.benefit)}</p>
          <p className="text-sm text-muted-foreground">{parentLabels[row.person]}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Figure label="Decyzja" status={row.expected_status} amount={row.expected_gross_grosze} />
            <Figure label="Kalkulator" status={row.status} amount={row.gross_grosze} />
          </div>
          <p
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 text-sm font-medium',
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

function ResultView({ result, source }: { result: CaseResult; source: string }) {
  return (
    <section aria-labelledby="case-result" className="space-y-6">
      <div>
        <h2 id="case-result" className="font-display text-2xl font-semibold text-navy">
          {result.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Źródło: {source}</p>
        <p className="mt-3 max-w-2xl text-muted-foreground">{result.facts}</p>
      </div>

      <Verdict result={result} />
      <InsuranceCard result={result} />

      {result.comparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Porównanie z decyzją</CardTitle>
            <CardDescription>
              Po lewej to, co zapisano dla sprawy. Po prawej wynik kalkulatora na tych samych
              danych.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComparisonList result={result} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Świadczenia z kalkulatora</CardTitle>
          <CardDescription>
            Kwoty brutto. Okresy liczone w dniach kalendarzowych.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssessmentsList assessments={result.assessments} />
        </CardContent>
      </Card>
    </section>
  )
}

/** Odczyt pliku JSON i wysłanie go na ten sam endpoint co wnioski z zestawu. */
function UploadCard({
  onDownload,
  onResult,
}: {
  onDownload: (() => void) | null
  onResult: (result: CaseResult) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const simulate = useSimulateCase()
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      simulate.mutate(parsed as Parameters<typeof simulate.mutate>[0], {
        onSuccess: onResult,
        onError: (mutationError) => {
          if (isAxiosError(mutationError)) {
            const detail = mutationError.response?.data?.detail
            setError(
              typeof detail === 'string'
                ? detail
                : 'Plik nie ma kształtu wniosku, którego oczekuje kalkulator.',
            )
            return
          }
          setError('Nie udało się odczytać pliku.')
        },
      })
    } catch {
      setError('Plik nie jest poprawnym JSON-em.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wgraj własny wniosek</CardTitle>
        <CardDescription>
          Plik JSON w tym samym formacie, co wnioski z zestawu. Nic nie zapisujemy na serwerze.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => input.current?.click()}>
            <FileUp className="size-4" aria-hidden />
            Wybierz plik JSON
          </Button>
          {onDownload && (
            <Button type="button" variant="ghost" onClick={onDownload}>
              <Download className="size-4" aria-hidden />
              Pobierz wzór z wybranego wniosku
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Plik JSON z wnioskiem"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
            event.target.value = ''
          }}
        />
        {simulate.isPending && <p className="text-muted-foreground">Liczę wgrany wniosek…</p>}
        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function SprawyPage() {
  const cases = useCases()
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<CaseResult | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const selectedId = chosenId ?? cases.data?.[0]?.id ?? null
  const selected = useCase(selectedId)

  async function downloadApplication() {
    if (!selectedId) return
    setDownloadError(null)
    try {
      const { data } = await api.get(`/cases/${selectedId}/application`)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedId}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('Nie udało się przygotować pliku do pobrania.')
    }
  }

  const source = uploaded ? 'wgrany plik' : 'zestaw demonstracyjny'

  return (
    <PageContainer className="space-y-8 py-10">
      <PageHeading
        title="Sprawy"
        description="Wybierz wniosek z zestawu albo wgraj własny plik JSON. Najpierw sprawdzamy ubezpieczenie, potem liczymy świadczenia na tych samych danych."
      />

      <Card>
        <CardHeader>
          <CardTitle>Wnioski w zestawie</CardTitle>
          <CardDescription>
            Dziesięć spraw z różnymi tytułami ubezpieczenia. Każda ma zapisaną decyzję, z którą
            porównujemy wyliczenie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.isPending && <Skeleton className="h-24 w-full" />}
          {cases.isError && (
            <p role="alert" className="text-red-800">
              Nie udało się wczytać listy wniosków. Sprawdź, czy backend działa.
            </p>
          )}
          {cases.data && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {cases.data.map((item) => {
                const active = item.id === selectedId && !uploaded
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setUploaded(null)
                        setChosenId(item.id)
                      }}
                      className={cn(
                        'flex h-full w-full flex-col gap-1 rounded-lg border p-4 text-left transition-colors',
                        'hover:border-primary/60 hover:bg-primary/5',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        active ? 'border-primary bg-primary/5' : 'border-neutral-200 bg-background',
                      )}
                    >
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {item.id} · {item.applicant_label}
                      </span>
                      <span className="font-semibold">{item.title}</span>
                      <span className="text-sm text-muted-foreground">{item.facts}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <UploadCard
        onDownload={selectedId ? downloadApplication : null}
        onResult={(result) => setUploaded(result)}
      />
      {downloadError && (
        <p role="alert" className="text-red-800">
          {downloadError}
        </p>
      )}

      {uploaded && <ResultView result={uploaded} source={source} />}

      {!uploaded && selected.isPending && <Skeleton className="h-64 w-full" />}
      {!uploaded && selected.isError && (
        <p role="alert" className="text-red-800">
          Nie udało się policzyć wybranego wniosku.
        </p>
      )}
      {!uploaded && selected.data && <ResultView result={selected.data} source={source} />}

      <p className="max-w-2xl text-sm text-muted-foreground">
        Wnioski w zestawie są wymyślone. Regulamin zadania nie pozwala publikować prawdziwych
        dokumentów ZUS, więc żadna sprawa nie pochodzi ze skanów.
      </p>
    </PageContainer>
  )
}