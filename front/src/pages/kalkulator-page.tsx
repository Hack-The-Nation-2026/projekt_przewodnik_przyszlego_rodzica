import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Check, CircleAlert, CircleHelp, ClipboardList, FlaskConical, Minus, Pencil, X } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BenefitWarnings } from '@/components/benefit-warnings'
import { ParentalPlanCard } from '@/components/parental-plan'
import type { RateVariant } from '@/components/parental-plan'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { InfoHint } from '@/components/ui/info-hint'
import { api } from '@/lib/api'
import { contextFromInterview } from '@/lib/benefit-document-context'
import { benefitList, buildInterview } from '@/lib/benefit-interview'
import type { Assessment, BenefitCode, ParentalPlan, ParentalPool, SimulationResponse } from '@/lib/benefit-interview'
import { asBoolean, interviewDefaults, interviewSchema, parseNumber } from '@/lib/interview-form'
import type { InterviewValues } from '@/lib/interview-form'
import { getInterviewSteps } from '@/lib/interview-steps'
import { cn } from '@/lib/utils'

const BenefitDocuments = lazy(() => import('@/components/benefit-documents'))

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', useGrouping: 'always' })
const date = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeZone: 'UTC' })

/** Przykładowe odpowiedzi dla przycisku deweloperskiego. */
const demoAnswers: InterviewValues = {
  ...interviewDefaults,
  birthStage: 'born',
  eventDate: '2026-09-01',
  childCount: '1',
  hospitalization: 'no',
  employment: 'employee',
  insured: 'yes',
  basis: '8000',
  partnerEmployment: 'employee',
  partnerInsured: 'yes',
  partnerBasis: '6000',
  sickness: 'no',
  rehabilitation: 'no',
}

const benefitStatuses = {
  granted: { label: 'Przysługuje', icon: Check, color: 'border-primary bg-primary text-primary-foreground' },
  denied: { label: 'Nie przysługuje', icon: X, color: 'border-red-600 bg-red-600 text-white' },
  partially_granted: { label: 'Częściowo przysługuje', icon: CircleAlert, color: 'border-blue-600 bg-blue-600 text-white' },
  missing_data: { label: 'Brakuje danych', icon: CircleHelp, color: 'border-amber-400 bg-amber-300 text-amber-950' },
  not_applicable: { label: 'Nie dotyczy', icon: Minus, color: 'border-slate-500 bg-slate-500 text-white' },
} satisfies Record<Assessment['status'], { label: string; icon: typeof Check; color: string }>

const sicknessPeriodLabels: Record<string, string> = {
  zasilek_chorobowy: 'Zasiłek chorobowy',
  wynagrodzenie_chorobowe: 'Wynagrodzenie chorobowe od pracodawcy',
}

const statusesWithPayment = new Set<Assessment['status']>(['granted', 'partially_granted'])

/** Co znaczy status, prostymi słowami. */
const statusExplanations = {
  granted: 'Warunki z Twoich odpowiedzi są spełnione.',
  partially_granted: 'Część okresu się należy, resztę pomijamy. Szczegóły są w opisie karty.',
  denied: 'Przy tych odpowiedziach świadczenie się nie należy.',
  missing_data: 'Brakuje odpowiedzi, żeby to policzyć. Wróć do formularza i uzupełnij dane.',
  not_applicable: 'Ten wariant wywiadu nie obejmuje tego świadczenia.',
} satisfies Record<Assessment['status'], string>

async function simulate({ values, plan }: { values: InterviewValues; plan: ParentalPlan }) {
  const { request, paternityRequest, supplemental, expected, returnDate } = buildInterview(values, plan)
  const flatRequest = {
    ...request,
    family: {
      ...request.family,
      averaged_rate_application: undefined,
      averaged_rate_applicant: undefined,
      averaged_rate_full_period: undefined,
      averaged_shared_transfer_confirmed: undefined,
    },
  }

  const [main, flat] = await Promise.all([
    api.post<SimulationResponse>('/benefits/simulate', request),
    plan.averagedRate
      ? api.post<SimulationResponse>('/benefits/simulate', flatRequest)
      : Promise.resolve(null),
  ])
  const paternity = paternityRequest
    ? (await api.post<SimulationResponse>('/benefits/simulate', paternityRequest)).data
    : undefined

  const results = [main.data, ...(paternity ? [paternity] : [])].flatMap((item) => item.assessments)
  const all = [...supplemental, ...results]
  const assessments = new Map(all.map((item) => [item.benefit, item]))
  const parental = all.filter((item) => item.benefit === 'rodzicielski')
  if (parental.length > 1) assessments.set('rodzicielski', mergeParental(parental))

  return {
    assessments,
    documentContext: contextFromInterview(values, results),
    expected,
    returnDate,
    separatePaternity: !!paternityRequest,
    pool: main.data.parental_pool ?? null,
    averaged: parentalTotals(main.data),
    flat: parentalTotals(flat?.data ?? main.data),
  }
}

type SimulationResult = Awaited<ReturnType<typeof simulate>>

/** Rodzicielski rozlicza się osobno dla każdego rodzica, a lista pokazuje jedno świadczenie. */
function mergeParental(parental: Assessment[]): Assessment {
  const active = parental.filter((item) => statusesWithPayment.has(item.status))
  const gross = parental.every((item) => item.gross_grosze != null)
    ? parental.reduce((sum, item) => sum + (item.gross_grosze ?? 0), 0)
    : null
  return {
    benefit: 'rodzicielski',
    status: active.length === parental.length ? 'granted' : active.length ? 'partially_granted' : parental[0].status,
    reason: 'Urlop dzielicie między siebie. Wymiar i kwota każdego rodzica są w karcie podziału urlopu.',
    days: parental.reduce((sum, item) => sum + (item.days ?? 0), 0),
    denied_days: parental.reduce((sum, item) => sum + (item.denied_days ?? 0), 0),
    gross_grosze: gross,
    periods: [],
  }
}

/** Wymiar i kwota zasiłku za urlop rodzicielski, w jednym wariancie stawki. */
function parentalTotals(response: SimulationResponse): RateVariant {
  const parental = response.assessments.filter((item) => item.benefit === 'rodzicielski')
  const byParent: RateVariant['byParent'] = {}
  for (const item of parental) {
    if (!item.person) continue
    byParent[item.person] = {
      days: item.days ?? 0,
      gross: item.gross_grosze ?? null,
      status: item.status,
      reason: item.reason,
    }
  }
  return {
    days: parental.reduce((sum, item) => sum + (item.days ?? 0), 0),
    gross: parental.reduce((sum, item) => sum + (item.gross_grosze ?? 0), 0),
    byParent,
  }
}

/**
 * Plan urlopu dla wysłanych odpowiedzi. Wspólną pulę dzielimy tylko wtedy,
 * gdy znamy jej wymiar i wiemy, kim jest drugi rodzic.
 */
function buildPlan(
  share: number,
  source: InterviewValues,
  pool: ParentalPool | null,
): ParentalPlan {
  const base: ParentalPlan = { averagedRate: true }
  if (!pool || source.partnerEmployment === 'unknown') return base
  if (source.workingOnLeave && source.employment === 'employee') return base
  const exclusive = pool.exclusive_days_per_parent
  const shared = Math.max(0, pool.total_days - exclusive * 2)
  const days = Math.min(Math.max(share, 0), shared)
  const basis = parseNumber(source.partnerBasis)
  return {
    averagedRate: true,
    parentalDays: {
      first_parent: exclusive + shared - days,
      second_parent: exclusive + days,
    },
    partner: {
      employment: source.partnerEmployment,
      sickness_insured: asBoolean(source.partnerInsured),
      monthly_basis_grosze: basis === undefined ? undefined : Math.round(basis * 100),
    },
  }
}

function BenefitCard({ assessment, onShowDocuments }: {
  assessment: Assessment
  onShowDocuments: (benefit: BenefitCode) => void
}) {
  const { name, what, sources } = benefitList[assessment.benefit]
  const active = statusesWithPayment.has(assessment.status)
  const { label, icon: StatusIcon, color } = benefitStatuses[assessment.status]
  const deniedDays = assessment.denied_days ?? 0
  const showDays = !!assessment.days || (!!deniedDays && assessment.status === 'partially_granted')
  const showAmount = assessment.gross_grosze != null || active
  return (
    <Card className="flex flex-col md:row-span-3 md:grid md:grid-rows-subgrid">
      {/* Karta zajmuje trzy wiersze siatki: treść, podstawę prawną i przycisk.
          Subgrid trzyma te trzy wiersze wspólne z kartą obok, więc gdy jednej
          brakuje okresu czy kwoty, podstawa prawna i przycisk i tak stają na
          tej samej wysokości co u sąsiada. */}
      <div>
      {/* Pasek statusu sam zaokrągla górne rogi. Karta nie może przycinać
          zawartości, bo chowałyby się w niej dymki z wyjaśnieniami. */}
      <div className={cn('flex items-center gap-1.5 rounded-t-lg border-b px-4 py-1.5 text-xs font-semibold', color)}>
        <StatusIcon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
        <InfoHint label={label} align="end" className="ml-auto">
          {statusExplanations[assessment.status]}
        </InfoHint>
      </div>
      <CardHeader className="gap-1.5 p-4 pb-2.5">
        <div className="flex items-start gap-1.5">
          <CardTitle className="text-base">{name}</CardTitle>
          <InfoHint label={name}>{what}</InfoHint>
        </div>
        <CardDescription>{assessment.reason}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 px-4 pb-2 pt-0">
        {(showDays || showAmount) && (
          <dl className="grid gap-2 sm:grid-cols-2">
            {showDays && (
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  Okres świadczenia
                  <InfoHint label="Okres świadczenia">
                    Liczba dni, za które świadczenie należy się przy Twoich odpowiedziach.
                  </InfoHint>
                </dt>
                <dd className="mt-0.5 text-sm font-medium">
                  {assessment.days ? (assessment.days === 1 ? '1 dzień' : `${assessment.days} dni`) : '—'}
                </dd>
                {!!deniedDays && assessment.status === 'partially_granted' && (
                  <dd className="text-xs text-muted-foreground">Odmowa za {deniedDays} dni</dd>
                )}
              </div>
            )}
            {showAmount && (
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {assessment.periods?.some((period) => period.kind === 'wynagrodzenie_chorobowe')
                    ? 'Łączna kwota brutto z wynagrodzeniem chorobowym'
                    : 'Łączna kwota brutto'}
                  <InfoHint label="Łączna kwota brutto">
                    Suma za cały okres, przed podatkiem i składką zdrowotną.
                  </InfoHint>
                </dt>
                <dd className="mt-0.5 text-sm font-medium">
                  {assessment.gross_grosze == null
                    ? 'Brakuje danych do wyliczenia'
                    : currency.format(assessment.gross_grosze / 100)}
                </dd>
              </div>
            )}
          </dl>
        )}
        {!!assessment.periods?.length && (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {assessment.periods.map(({ kind, start, end }) => (
              <li key={`${kind}-${start}-${end}`}>
                {sicknessPeriodLabels[kind] && <span className="block font-medium">{sicknessPeriodLabels[kind]}</span>}
                {date.format(new Date(start))} – {date.format(new Date(end))}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      </div>
      <div className="mx-4 border-t pt-2 text-xs">
        <p className="mb-1 flex items-center gap-1.5 font-medium">
          Podstawa prawna
          <InfoHint label="Podstawa prawna">
            Przepisy, z których wynika wyliczenie. Każdy link prowadzi do tekstu ustawy.
          </InfoHint>
        </p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {sources.map(({ url, title }) => (
            <li key={title}>
              <a className="text-primary underline underline-offset-2" href={url}>{title}</a>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-4 pt-2 pb-4">
        <Button
          type="button"
          variant="ghost"
          aria-haspopup="dialog"
          aria-label={`Dokumenty i terminy — ${name}`}
          onClick={() => onShowDocuments(assessment.benefit)}
          className="w-full font-semibold text-primary hover:bg-primary/10 hover:text-primary"
        >
          <ClipboardList aria-hidden="true" />
          Dokumenty i terminy
        </Button>
      </div>
    </Card>
  )
}

export function KalkulatorPage() {
  const resultHeading = useRef<HTMLHeadingElement>(null)
  const stepHeading = useRef<HTMLHeadingElement>(null)
  const focusNextStep = useRef(false)
  const scrolledFor = useRef<InterviewValues | null>(null)
  const [stepId, setStepId] = useState('role')
  const [sent, setSent] = useState('')
  const [submitted, setSubmitted] = useState<InterviewValues | null>(null)
  const [secondShareDays, setSecondShareDays] = useState(0)
  const [documentBenefit, setDocumentBenefit] = useState<BenefitCode | null>(null)
  const form = useForm<InterviewValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues: interviewDefaults,
  })
  const values = useWatch({ control: form.control, compute: (answers) => answers })
  // React Query czyści dane mutacji na czas nowego żądania. Ostatni wynik
  // trzymamy osobno, bo bez tego karty znikają na moment po każdym ruchu
  // suwaka, a strona skacze razem z nimi.
  const [result, setResult] = useState<SimulationResult | null>(null)
  const simulation = useMutation({ mutationFn: simulate, onSuccess: setResult })
  const { mutate } = simulation
  const steps = getInterviewSteps(values)
  const stepIndex = Math.max(0, steps.findIndex(({ id }) => id === stepId))
  const step = steps[stepIndex]
  const nextStep = steps[stepIndex + 1]

  const pool = result?.pool ?? null
  const sharedTotal = pool ? Math.max(0, pool.total_days - 2 * pool.exclusive_days_per_parent) : 0
  const secondShare = Math.min(secondShareDays, sharedTotal)
  const workingOnLeave = !!values.workingOnLeave && values.employment === 'employee'
  const respondent = values.role === 'father' ? 'second_parent' : 'first_parent'

  function goToStep(id: string) {
    focusNextStep.current = true
    setStepId(id)
  }

  function editAnswers() {
    goToStep(steps[0].id)
    setDocumentBenefit(null)
    setSubmitted(null)
    setSecondShareDays(0)
    simulation.reset()
    setResult(null)
  }

  function showDocuments(benefit: BenefitCode) {
    setDocumentBenefit(benefit)
  }

  function closeDocuments() {
    setDocumentBenefit(null)
  }

  function submitAnswers(data: InterviewValues) {
    setSent('')
    setSubmitted(data)
    setSecondShareDays(0)
    mutate({ values: data, plan: buildPlan(0, data, pool) })
  }

  async function advance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!nextStep) {
      await form.handleSubmit(submitAnswers, (errors) => {
        const invalidStep = steps.find(({ fields }) => fields.some((field) => errors[field]))
        if (invalidStep && invalidStep.id !== step.id) goToStep(invalidStep.id)
      })(event)
    } else if (await form.trigger(step.fields, { shouldFocus: true })) {
      goToStep(nextStep.id)
    }
  }

  useEffect(() => {
    if (focusNextStep.current && stepHeading.current) {
      focusNextStep.current = false
      stepHeading.current.focus({ preventScroll: true })
      stepHeading.current.scrollIntoView({ block: 'start' })
    }
  }, [stepId, simulation.isSuccess])

  // Przewijamy do wyniku raz na wysłanie wywiadu, nie po każdym ruchu suwaka.
  useEffect(() => {
    if (!result || !submitted || scrolledFor.current === submitted) return
    scrolledFor.current = submitted
    resultHeading.current?.focus({ preventScroll: true })
    resultHeading.current?.scrollIntoView({ block: 'start' })
  }, [result, submitted])

  // Każda zmiana suwaka przelicza wynik, ale dopiero po krótkiej pauzie w przeciąganiu.
  useEffect(() => {
    if (!submitted) return
    const plan = buildPlan(secondShareDays, submitted, pool)
    const signature = JSON.stringify(plan)
    if (signature === sent) return
    const timer = setTimeout(() => {
      setSent(signature)
      mutate({ values: submitted, plan })
    }, 200)
    return () => clearTimeout(timer)
  }, [submitted, secondShareDays, pool, sent, mutate])

  return (
    <PageContainer className="py-12 sm:py-16">
      <PageHeading
        title="Kalkulator zasiłków"
        description="Odpowiedz na pytania i sprawdź, jakie świadczenia mogą Ci przysługiwać, przez ile dni i w jakiej kwocie."
        crumb="Kalkulator"
      />

      {import.meta.env.DEV && !result && (
        <div className="mt-8 rounded-lg border-2 border-dashed border-fuchsia-600 bg-fuchsia-50 p-3">
          <Button
            type="button"
            size="lg"
            className="w-full bg-fuchsia-600 text-white hover:bg-fuchsia-700"
            onClick={() => {
              form.reset(demoAnswers)
              submitAnswers(demoAnswers)
            }}
          >
            <FlaskConical aria-hidden="true" />
            DEV: wypełnij przykład i pokaż wynik
          </Button>
          <p className="mt-2 text-center text-xs font-semibold tracking-wide text-fuchsia-700 uppercase">
            Tylko w trybie deweloperskim, przed oddaniem usuń
          </p>
        </div>
      )}

      {!result && (
        <Form {...form}>
          <form className="mt-8 space-y-5" noValidate onSubmit={advance} aria-labelledby="interview-step">
            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-primary" id="interview-progress">
                  Krok {stepIndex + 1} z {steps.length}
                </p>
                <progress
                  className="mb-3 h-2 w-full overflow-hidden rounded-full accent-primary"
                  value={stepIndex + 1}
                  max={steps.length}
                  aria-labelledby="interview-progress"
                />
                <h2
                  id="interview-step"
                  ref={stepHeading}
                  tabIndex={-1}
                  className="scroll-mt-24 text-2xl font-semibold focus:outline-none"
                >
                  {step.title}
                </h2>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <fieldset disabled={simulation.isPending} className="min-w-0 space-y-5">
                  <div key={step.id} className="space-y-5"><step.Fields values={values} /></div>
                  <div className="flex flex-wrap items-center gap-3 border-t pt-5">
                    {stepIndex > 0 && (
                      <Button type="button" variant="outline" onClick={() => goToStep(steps[stepIndex - 1].id)}>
                        Wstecz
                      </Button>
                    )}
                    <Button type="submit" disabled={simulation.isPending}>
                      {nextStep ? 'Dalej' : simulation.isPending ? 'Sprawdzamy świadczenia…' : 'Sprawdź świadczenia'}
                    </Button>
                  </div>
                </fieldset>
              </CardContent>
            </Card>
            {simulation.isError && (
              <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm">
                {isAxiosError(simulation.error) && simulation.error.response?.status === 422
                  ? 'Nie można sprawdzić uprawnień dla tej kombinacji odpowiedzi. Sprawdź daty i pola formularza.'
                  : 'Nie udało się pobrać wyniku. Spróbuj ponownie.'}
              </p>
            )}
          </form>
        </Form>
      )}

      {result && (
        <section className="mt-12 space-y-5" aria-labelledby="benefit-result">
          <div>
            <h2
              className="scroll-mt-24 text-3xl font-semibold focus:outline-none"
              id="benefit-result"
              ref={resultHeading}
              tabIndex={-1}
            >
              Wynik wywiadu
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {result.expected
                ? 'Wstępna symulacja z przewidywaną datą porodu, na podstawie ostatnio wysłanych odpowiedzi.'
                : 'Symulacja na podstawie ostatnio wysłanych odpowiedzi.'}
            </p>
            {result.separatePaternity && (
              <p className="mt-1 text-sm text-muted-foreground">
                Ojcowski jest liczony jako osobny wariant. Przy wyborze terminów uwzględnij pozostałe urlopy.
              </p>
            )}
            {result.returnDate && (
              <p className="mt-1 text-sm text-muted-foreground">
                Planowany powrót do pracy {date.format(new Date(result.returnDate))}.
              </p>
            )}
            <Button className="mt-4 font-semibold" size="lg" type="button" onClick={editAnswers}>
              <Pencil aria-hidden="true" />
              Edytuj odpowiedzi
            </Button>
          </div>
          {submitted && <BenefitWarnings values={submitted} maternityStatus={result.assessments.get('macierzynski')?.status} />}
          {result.pool && result.pool.total_days > 0 && (
            <ParentalPlanCard
              pool={result.pool}
              respondent={respondent}
              secondShareDays={secondShare}
              onSecondShareChange={setSecondShareDays}
              averaged={result.averaged}
              flat={result.flat}
              zaZyciem={values.zaZyciem}
              workingOnLeave={workingOnLeave}
              partnerKnown={values.partnerEmployment !== 'unknown'}
              extendedDays={result.averaged.byParent[respondent]?.days}
              busy={simulation.isPending}
            />
          )}

          <p className="text-sm text-muted-foreground">
            Status na górze karty mówi, czy świadczenie przysługuje przy Twoich odpowiedziach.
            Kwoty podajemy brutto, za cały okres.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {(Object.keys(benefitList) as BenefitCode[]).map((benefit) => (
              <BenefitCard
                key={benefit}
                assessment={result.assessments.get(benefit) ?? {
                  benefit, status: 'missing_data', reason: 'Dla tego świadczenia brakuje wyniku symulacji.',
                }}
                onShowDocuments={showDocuments}
              />
            ))}
          </div>
          <Dialog
            open={documentBenefit !== null}
            onClose={closeDocuments}
            title={documentBenefit ? `Dokumenty i terminy — ${benefitList[documentBenefit].name}` : 'Dokumenty i terminy'}
          >
            {documentBenefit && (
              <Suspense fallback={<p role="status" className="py-8 text-center text-sm">Wczytujemy dokumenty…</p>}>
                <BenefitDocuments
                  key={documentBenefit}
                  benefit={documentBenefit}
                  context={result.documentContext}
                  plain
                />
              </Suspense>
            )}
          </Dialog>
        </section>
      )}
    </PageContainer>
  )
}
