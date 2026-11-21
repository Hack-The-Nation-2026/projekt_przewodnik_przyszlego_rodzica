import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Check, CircleAlert, CircleHelp, Minus, Pencil, X } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ParentalPlanCard } from '@/components/parental-plan'
import type { RateVariant } from '@/components/parental-plan'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { api } from '@/lib/api'
import { benefitList, buildInterview } from '@/lib/benefit-interview'
import type { Assessment, BenefitCode, ParentalPlan, ParentalPool, SimulationResponse } from '@/lib/benefit-interview'
import { asBoolean, interviewDefaults, interviewSchema, parseNumber } from '@/lib/interview-form'
import type { InterviewValues } from '@/lib/interview-form'
import { getInterviewSteps } from '@/lib/interview-steps'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })
const date = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeZone: 'UTC' })

const benefitStatuses = {
  granted: { label: 'Przysługuje', icon: Check, color: 'border-green-200 bg-green-100 text-green-900' },
  denied: { label: 'Nie przysługuje', icon: X, color: 'border-red-200 bg-red-100 text-red-900' },
  partially_granted: { label: 'Częściowo przysługuje', icon: CircleAlert, color: 'border-blue-200 bg-blue-100 text-blue-900' },
  missing_data: { label: 'Brakuje danych', icon: CircleHelp, color: 'border-amber-200 bg-amber-100 text-amber-950' },
  not_applicable: { label: 'Nie dotyczy', icon: Minus, color: 'border-slate-300 bg-slate-200 text-slate-800' },
} satisfies Record<Assessment['status'], { label: string; icon: typeof Check; color: string }>

const sicknessPeriodLabels: Record<string, string> = {
  zasilek_chorobowy: 'Zasiłek chorobowy',
  wynagrodzenie_chorobowe: 'Wynagrodzenie chorobowe od pracodawcy',
}

const statusesWithPayment = new Set<Assessment['status']>(['granted', 'partially_granted'])

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
    expected,
    returnDate,
    separatePaternity: !!paternityRequest,
    pool: main.data.parental_pool ?? null,
    averaged: parentalTotals(main.data),
    flat: parentalTotals(flat?.data ?? main.data),
  }
}

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

function BenefitCard({ assessment }: { assessment: Assessment }) {
  const { name, sources } = benefitList[assessment.benefit]
  const active = statusesWithPayment.has(assessment.status)
  const { label, icon: StatusIcon, color } = benefitStatuses[assessment.status]
  return (
    <Card>
      <CardHeader className="gap-1.5 p-4 pb-2.5">
        <Badge variant="outline" className={cn('mb-0.5 w-fit gap-1.5 px-2.5 py-1 text-sm font-semibold', color)}>
          <StatusIcon className="size-4 shrink-0" aria-hidden="true" />
          {label}
        </Badge>
        <CardTitle className="text-base">{name}</CardTitle>
        <CardDescription>{assessment.reason}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 p-4 pt-0">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Okres świadczenia</dt>
            <dd className="mt-0.5 text-sm font-medium">
              {assessment.days ? (assessment.days === 1 ? '1 dzień' : `${assessment.days} dni`) : '—'}
            </dd>
            {!!assessment.denied_days && assessment.status === 'partially_granted' && (
              <dd className="text-xs text-muted-foreground">Odmowa za {assessment.denied_days} dni</dd>
            )}
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {assessment.periods?.some((period) => period.kind === 'wynagrodzenie_chorobowe')
                ? 'Łączna kwota brutto z wynagrodzeniem chorobowym'
                : 'Łączna kwota brutto'}
            </dt>
            <dd className="mt-0.5 text-sm font-medium">
              {assessment.gross_grosze == null
                ? (active ? 'Brakuje danych do wyliczenia' : '—')
                : currency.format(assessment.gross_grosze / 100)}
            </dd>
          </div>
        </dl>
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
        <div className="border-t pt-2 text-xs">
          <p className="mb-1 font-medium">Podstawa prawna</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {sources.map(({ url, title }) => (
              <li key={title}>
                <a className="text-primary underline underline-offset-2" href={url}>{title}</a>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
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
  const form = useForm<InterviewValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues: interviewDefaults,
  })
  const values = useWatch({ control: form.control, compute: (answers) => answers })
  const simulation = useMutation({ mutationFn: simulate })
  const { mutate } = simulation
  const steps = getInterviewSteps(values)
  const stepIndex = Math.max(0, steps.findIndex(({ id }) => id === stepId))
  const step = steps[stepIndex]
  const nextStep = steps[stepIndex + 1]

  const pool = simulation.data?.pool ?? null
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
    setSubmitted(null)
    setSecondShareDays(0)
    simulation.reset()
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
    if (!simulation.data || !submitted || scrolledFor.current === submitted) return
    scrolledFor.current = submitted
    resultHeading.current?.focus({ preventScroll: true })
    resultHeading.current?.scrollIntoView({ block: 'start' })
  }, [simulation.data, submitted])

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
        backTo="/wejscie"
        backLabel="Wróć do wejścia"
      />

      {!simulation.data && (
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

      {simulation.data && (
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
              {simulation.data.expected
                ? 'Wstępna symulacja z przewidywaną datą porodu, na podstawie ostatnio wysłanych odpowiedzi.'
                : 'Symulacja na podstawie ostatnio wysłanych odpowiedzi.'}
            </p>
            {simulation.data.separatePaternity && (
              <p className="mt-1 text-sm text-muted-foreground">
                Ojcowski jest liczony jako osobny wariant. Przy wyborze terminów uwzględnij pozostałe urlopy.
              </p>
            )}
            {simulation.data.returnDate && (
              <p className="mt-1 text-sm text-muted-foreground">
                Planowany powrót do pracy {date.format(new Date(simulation.data.returnDate))}.
              </p>
            )}
            <Button className="mt-4 font-semibold" size="lg" type="button" onClick={editAnswers}>
              <Pencil aria-hidden="true" />
              Edytuj odpowiedzi
            </Button>
          </div>
          {simulation.data.pool && simulation.data.pool.total_days > 0 && (
            <ParentalPlanCard
              pool={simulation.data.pool}
              respondent={respondent}
              secondShareDays={secondShare}
              onSecondShareChange={setSecondShareDays}
              averaged={simulation.data.averaged}
              flat={simulation.data.flat}
              zaZyciem={values.zaZyciem}
              workingOnLeave={workingOnLeave}
              partnerKnown={values.partnerEmployment !== 'unknown'}
              extendedDays={simulation.data.averaged.byParent[respondent]?.days}
              busy={simulation.isPending}
            />
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {(Object.keys(benefitList) as BenefitCode[]).map((benefit) => (
              <BenefitCard key={benefit} assessment={simulation.data.assessments.get(benefit) ?? {
                benefit, status: 'missing_data', reason: 'Dla tego świadczenia brakuje wyniku symulacji.',
              }} />
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  )
}
