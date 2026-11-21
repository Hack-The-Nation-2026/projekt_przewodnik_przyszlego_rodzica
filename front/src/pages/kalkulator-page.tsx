import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FamilyFields, EmploymentFields, PregnancyFields } from '@/components/benefit-interview-fields'
import { Container } from '@/components/layout/container'
import { PageHeading } from '@/components/layout/page-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { api } from '@/lib/api'
import { benefitList, buildInterview } from '@/lib/benefit-interview'
import type { Assessment, BenefitCode, SimulationResponse } from '@/lib/benefit-interview'
import { interviewDefaults, interviewSchema } from '@/lib/interview-form'
import type { InterviewValues } from '@/lib/interview-form'

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })
const date = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeZone: 'UTC' })

const statusLabels = {
  granted: 'Przysługuje',
  denied: 'Nie przysługuje',
  partially_granted: 'Częściowo przysługuje',
  missing_data: 'Brakuje danych',
  not_applicable: 'Nie dotyczy',
} satisfies Record<Assessment['status'], string>

const sicknessPeriodLabels: Record<string, string> = {
  zasilek_chorobowy: 'Zasiłek chorobowy',
  wynagrodzenie_chorobowe: 'Wynagrodzenie chorobowe od pracodawcy',
}

const statusesWithPayment = new Set<Assessment['status']>(['granted', 'partially_granted'])

async function simulate(values: InterviewValues) {
  const { request, paternityRequest, supplemental, expected, returnDate } = buildInterview(values)
  const responses = await Promise.all([
    api.post<SimulationResponse>('/benefits/simulate', request),
    ...(paternityRequest ? [api.post<SimulationResponse>('/benefits/simulate', paternityRequest)] : []),
  ])
  const results = responses.flatMap(({ data }) => data.assessments)
  const assessments = new Map([...supplemental, ...results].map((item) => [item.benefit, item]))
  return { assessments, expected, returnDate, separatePaternity: !!paternityRequest }
}

function BenefitCard({ assessment }: { assessment: Assessment }) {
  const { name, sources } = benefitList[assessment.benefit]
  const active = statusesWithPayment.has(assessment.status)
  return (
    <Card>
      <CardHeader className="gap-3">
        <Badge className="w-fit" variant={active ? 'default' : 'outline'}>
          {statusLabels[assessment.status]}
        </Badge>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>{assessment.reason}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
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
        <div className="border-t pt-3 text-xs">
          <p className="mb-1 font-medium">Podstawa prawna</p>
          <ul className="space-y-1">
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
  const heading = useRef<HTMLHeadingElement>(null)
  const form = useForm<InterviewValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues: interviewDefaults,
  })
  const values = useWatch({ control: form.control, compute: (answers) => answers })
  const simulation = useMutation({ mutationFn: simulate })

  useEffect(() => {
    if (simulation.data) {
      heading.current?.focus({ preventScroll: true })
      heading.current?.scrollIntoView({ block: 'start' })
    }
  }, [simulation.data])

  return (
    <Container className="max-w-5xl py-12 sm:py-16">
      <PageHeading
        title="Kalkulator zasiłków"
        description="Odpowiedz na pytania i sprawdź, jakie świadczenia mogą Ci przysługiwać, przez ile dni i w jakiej kwocie."
        crumb="Kalkulator"
        backTo="/wejscie"
        backLabel="Wróć do wejścia"
      />

      <Form {...form}>
        <form
          className="mt-8 space-y-5"
          noValidate
          onSubmit={form.handleSubmit((data) => simulation.mutate(data))}
        >
          <fieldset disabled={simulation.isPending} className="min-w-0 space-y-5">
            <FamilyFields values={values} />
            <EmploymentFields values={values} />
            {values.role === 'mother' && <PregnancyFields values={values} />}
            <Button type="submit" disabled={simulation.isPending}>
              {simulation.isPending ? 'Sprawdzamy świadczenia…' : 'Sprawdź świadczenia'}
            </Button>
          </fieldset>
          {simulation.isError && (
            <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm">
              {isAxiosError(simulation.error) && simulation.error.response?.status === 422
                ? 'Nie można sprawdzić uprawnień dla tej kombinacji odpowiedzi. Sprawdź daty i pola formularza.'
                : 'Nie udało się pobrać wyniku. Spróbuj ponownie.'}
            </p>
          )}
        </form>
      </Form>

      {simulation.data && (
        <section className="mt-12 space-y-5" aria-labelledby="benefit-result">
          <div>
            <h2
              className="scroll-mt-24 font-serif text-3xl font-semibold focus:outline-none"
              id="benefit-result"
              ref={heading}
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
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(Object.keys(benefitList) as BenefitCode[]).map((benefit) => (
              <BenefitCard key={benefit} assessment={simulation.data.assessments.get(benefit) ?? {
                benefit, status: 'missing_data', reason: 'Dla tego świadczenia brakuje wyniku symulacji.',
              }} />
            ))}
          </div>
        </section>
      )}
    </Container>
  )
}
