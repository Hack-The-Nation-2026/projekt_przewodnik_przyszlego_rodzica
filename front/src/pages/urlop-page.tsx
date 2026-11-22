import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CalendarClock, CircleAlert, Save, Sparkles, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { WeekTimeline } from '@/components/week-timeline'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChoiceSelect } from '@/components/ui/choice-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { contextFromInterview } from '@/lib/benefit-document-context'
import { buildInterview } from '@/lib/benefit-interview'
import type { ParentalPlan, SimulationResponse } from '@/lib/benefit-interview'
import { formatDocumentDate } from '@/lib/benefit-documents'
import { parseNumber } from '@/lib/interview-form'
import {
  averagedWindow, clearProgress, emptyProgress, nearestSteps, poolOf, progressValues,
  readProgress, saveProgress,
} from '@/lib/leave-progress'
import type { LeaveProgressAnswers } from '@/lib/leave-progress'
import { buildWeekTimeline, withSharedScale } from '@/lib/week-timeline'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', useGrouping: 'always' })

/** Data, na którą liczymy status. Stała na czas wizyty, żeby nie zmieniała się w trakcie renderu. */
const today = new Date().toISOString().slice(0, 10)

const currentLabels: Record<LeaveProgressAnswers['current'], string> = {
  macierzynski: 'Urlop macierzyński',
  uzupelniajacy: 'Uzupełniający urlop macierzyński',
  rodzicielski: 'Urlop rodzicielski',
}

async function simulateProgress(answers: LeaveProgressAnswers, averagedRate: boolean) {
  const values = progressValues(answers)
  const plan: ParentalPlan = { averagedRate }
  const { request } = buildInterview(values, plan)
  const { data } = await api.post<SimulationResponse>('/benefits/simulate', request)
  return data
}

function totalOf(response: SimulationResponse) {
  return response.assessments.reduce((sum, item) => sum + (item.gross_grosze ?? 0), 0)
}

function Field({ id, label, hint, children }: {
  id: string
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="leading-snug">{label}</Label>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

/**
 * Tryb „jestem w trakcie urlopu": ile jeszcze zostało i co trzeba złożyć teraz.
 *
 * Bez tego serwis opowiada tylko o przyszłości i o przeszłości, a pytanie
 * „ile mi jeszcze zostało" ludzie zadają w środku, gdy terminy się zbliżają.
 */
export function UrlopPage() {
  const stored = useMemo(() => readProgress(), [])
  const [answers, setAnswers] = useState<LeaveProgressAnswers>(stored ?? emptyProgress)
  const [status, setStatus] = useState<{ now: SimulationResponse; wait: SimulationResponse } | null>(null)

  const simulation = useMutation({
    mutationFn: async (source: LeaveProgressAnswers) => {
      // Po minięciu terminu na 81,5% wariant „teraz" liczy się tak samo jak
      // „poczekam". Obiecywanie stawki, do której nie ma już prawa, byłoby
      // najgorszym, co ten ekran mógłby zrobić.
      const closed = averagedWindow(source)?.open === false
      const now = await simulateProgress(source, !closed)
      const wait = await simulateProgress(source, false)
      return { now, wait }
    },
    onSuccess: setStatus,
  })
  const { mutate, isPending, isError } = simulation

  useEffect(() => {
    if (stored?.eventDate) mutate(stored)
  }, [stored, mutate])

  function update(patch: Partial<LeaveProgressAnswers>) {
    setAnswers((current) => ({ ...current, ...patch }))
  }

  function submit() {
    saveProgress(answers)
    mutate(answers)
  }

  const window = averagedWindow(answers)
  const values = progressValues(answers)
  const context = status ? contextFromInterview(values, status.now.assessments) : null
  const steps = context && status ? nearestSteps(context, status.now.assessments) : []
  const share = Math.max(0, parseNumber(answers.partnerDaysUsed) ?? 0)

  const makeTimeline = (response: SimulationResponse) => buildWeekTimeline({
    values,
    context: context!,
    assessments: response.assessments,
    pool: poolOf(response),
    respondent: 'first_parent',
    secondShareDays: share,
    averagedGross: totalOf(response) || null,
    flatGross: totalOf(response) || null,
  })
  const timelines = status && context?.eventDate
    ? withSharedScale([makeTimeline(status.now), makeTimeline(status.wait)])
    : []
  const timeline = timelines[0] ?? null
  const waitTimeline = timelines[1] ?? null

  const nowTotal = status ? totalOf(status.now) : 0
  const waitTotal = status ? totalOf(status.wait) : 0
  const difference = nowTotal - waitTotal

  return (
    <PageContainer className="space-y-8 py-10">
      <PageHeading
        title="Jestem w trakcie urlopu"
        description="Podaj kilka dat, a policzymy, ile urlopu jeszcze zostało, co trzeba złożyć w najbliższych tygodniach i co się stanie, jeśli wniosek pójdzie teraz, a co, jeśli poczeka."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Twoja sprawa</CardTitle>
          <CardDescription>
            Połowę danych znamy z Twojej poprzedniej wizyty, więc pytamy tylko o teraźniejszość. Stan
            zapisuje się w tej przeglądarce i przy kolejnym wejściu status liczy się od razu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="p-event" label="Data porodu" hint="Z aktu urodzenia albo z karty ciąży.">
              <Input id="p-event" type="date" value={answers.eventDate}
                onChange={(event) => update({ eventDate: event.target.value })} />
            </Field>
            <Field id="p-start" label="Od kiedy trwa urlop" hint="Pierwszy dzień urlopu, który jest brany teraz.">
              <Input id="p-start" type="date" value={answers.leaveStart}
                onChange={(event) => update({ leaveStart: event.target.value })} />
            </Field>
            <Field id="p-current" label="Który urlop jest brany teraz" hint="Macierzyński, uzupełniający czy rodzicielski.">
              <ChoiceSelect
                id="p-current"
                value={answers.current}
                onValueChange={(value) => update({ current: value as LeaveProgressAnswers['current'] })}
                choices={(Object.keys(currentLabels) as LeaveProgressAnswers['current'][]).map(
                  (key) => [key, currentLabels[key]] as const,
                )}
              />
            </Field>
            <Field id="p-basis" label="Podstawa wymiaru" hint="Kwota z zaświadczenia od pracodawcy, w złotych. Bez niej nie policzymy kwot.">
              <Input id="p-basis" inputMode="decimal" value={answers.basis}
                onChange={(event) => update({ basis: event.target.value })} />
            </Field>
            <Field id="p-partner" label="Drugi rodzic" hint="Jeśli nie wiesz, zostaw „Nie wiem”. Wtedy nie policzymy jego tygodni.">
              <ChoiceSelect
                id="p-partner"
                value={answers.partnerEmployment}
                onValueChange={(value) => update({ partnerEmployment: value as LeaveProgressAnswers['partnerEmployment'] })}
                choices={[
                  ['unknown', 'Nie wiem'],
                  ['employee', 'Umowa o pracę'],
                  ['contractor', 'Umowa zlecenia'],
                  ['self_employed', 'Działalność gospodarcza'],
                  ['other', 'Inny tytuł ubezpieczenia'],
                ]}
              />
            </Field>
            <Field id="p-partner-days" label="Ile dni urlopu drugi rodzic już wykorzystał" hint="Liczba dni od początku jego urlopu. Wpisz 0, jeśli jeszcze nic.">
              <Input id="p-partner-days" inputMode="numeric" value={answers.partnerDaysUsed}
                onChange={(event) => update({ partnerDaysUsed: event.target.value })} />
            </Field>
            <Field id="p-partner-basis" label="Podstawa wymiaru drugiego rodzica" hint="Potrzebna tylko wtedy, gdy liczymy także jego kwoty.">
              <Input id="p-partner-basis" inputMode="decimal" value={answers.partnerBasis}
                onChange={(event) => update({ partnerBasis: event.target.value })} />
            </Field>
            <Field id="p-work" label="Wymiar pracy w czasie urlopu (procent)" hint="Wpisz, jeśli łączysz urlop z pracą. Inaczej zostaw puste.">
              <Input id="p-work" inputMode="decimal" value={answers.workPercent}
                onChange={(event) => update({ workPercent: event.target.value, workingOnLeave: !!event.target.value })} />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button type="button" onClick={submit} disabled={isPending || !answers.eventDate}>
              <Sparkles aria-hidden="true" />
              {isPending ? 'Liczymy status…' : 'Policz status'}
            </Button>
            <Button type="button" variant="outline" onClick={submit} disabled={isPending || !answers.eventDate}>
              <Save aria-hidden="true" />
              Zapisz i przelicz
            </Button>
            {stored && (
              <Button type="button" variant="ghost" onClick={() => { clearProgress(); setAnswers(emptyProgress); setStatus(null) }}>
                <Trash2 aria-hidden="true" />
                Wyczyść zapisany stan
              </Button>
            )}
          </div>
          {isError && (
            <p role="alert" className="text-sm text-destructive">
              Nie udało się przeliczyć. Sprawdź daty i podstawę wymiaru, a potem spróbuj ponownie.
            </p>
          )}
        </CardContent>
      </Card>

      {status && timeline && (
        <>
          <Card className="border-primary/40 bg-secondary/40">
            <CardHeader className="gap-1">
              <CardTitle className="font-display text-xl">Twój status</CardTitle>
              <CardDescription className="text-base text-foreground">{timeline.status}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Liczony na {formatDocumentDate(today)} z dat, które podałeś.
              {context?.forecast && ' Data porodu jest przewidywana, więc status jest szacunkowy.'}
            </CardContent>
          </Card>

          <section className="space-y-4" aria-label="Postęp urlopu">
            <WeekTimeline
              data={timeline}
              variants={waitTimeline ? [{ label: 'Jeśli poczekam do końca macierzyńskiego', data: waitTimeline }] : undefined}
            />
          </section>

          <section className="space-y-3" aria-labelledby="decyzje-title">
            <h2 id="decyzje-title" className="font-display text-xl font-semibold">Najbliższe decyzje</h2>
            {steps.length ? (
              <ul className="space-y-2">
                {steps.map((step) => (
                  <li key={`${step.date}-${step.label}`} className="flex flex-wrap items-baseline gap-x-3 border-l-2 border-primary pl-3 text-sm">
                    <span className="font-medium tabular-nums">{formatDocumentDate(step.date)}</span>
                    <span>{step.label}</span>
                    <span className="w-full text-xs text-muted-foreground">
                      {step.detail} Zostało {step.daysLeft} dni.
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                W najbliższych ośmiu tygodniach nie ma terminu, który dałoby się wyliczyć z podanych dat.
              </p>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="symulacja-title">
            <h2 id="symulacja-title" className="font-display text-xl font-semibold">Symulacja „jeśli złożę teraz”</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">
                    {window && !window.open ? 'Wniosek złożony po terminie' : 'Wniosek idzie teraz'}
                  </CardTitle>
                  <CardDescription>
                    {window && !window.open
                      ? 'Termin na 81,5% minął, więc liczymy realny wariant, a nie ten, na który jest już za późno.'
                      : 'Wariant ze stawką uśrednioną, dopóki okno 21 dni jest otwarte.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="font-display text-2xl font-semibold tabular-nums">{currency.format(nowTotal / 100)}</p>
                  <p className="mt-1 text-muted-foreground">razem za wszystkie świadczenia z symulacji</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">Wniosek czeka</CardTitle>
                  <CardDescription>Wariant bez uśredniania: macierzyński 100%, rodzicielski 70% podstawy.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="font-display text-2xl font-semibold tabular-nums">{currency.format(waitTotal / 100)}</p>
                  <p className="mt-1 text-muted-foreground">
                    {difference > 0
                      ? `Różnica na korzyść wniosku złożonego teraz: ${currency.format(difference / 100)}.`
                      : difference < 0
                        ? `Wariant bez uśredniania wypada lepiej o ${currency.format(-difference / 100)}. Sprawdź to z płatnikiem.`
                        : 'Oba warianty wychodzą tak samo przy tych danych.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {window && (
            <p className={cn(
              'flex items-start gap-2 rounded-md border p-3 text-sm',
              window.open ? 'border-primary/40 bg-secondary/40' : 'border-destructive/40 bg-destructive/5',
            )}>
              <CircleAlert className={cn('mt-0.5 size-4 shrink-0', !window.open && 'text-destructive')} aria-hidden="true" />
              <span>
                {window.open
                  ? `Termin na wniosek o stawkę 81,5% mija ${formatDocumentDate(window.deadline)}. Zostało ${window.daysLeft} dni.`
                  : `Termin na wniosek o stawkę 81,5% minął ${formatDocumentDate(window.deadline)}, czyli ${-window.daysLeft} dni temu. Zamiast obiecywać 81,5%, symulacja liczy realny wariant: 100% podstawy za macierzyński i 70% za rodzicielski.`}
              </span>
            </p>
          )}

          {answers.workingOnLeave && answers.workPercent && (
            <p className="flex items-start gap-2 rounded-md border border-border p-3 text-sm">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Łączysz urlop z pracą w wymiarze {answers.workPercent}%. Urlop wydłuża się proporcjonalnie,
                a zasiłek za ten czas jest liczony z nowej stawki. Zwróć uwagę, że wymiar pracy musi być
                niższy niż w umowie.
              </span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t pt-6">
            <Link to="/karta" className={buttonVariants({ variant: 'outline' })}>Otwórz kartę uprawnień</Link>
            <Link to="/wnioski" className={buttonVariants({ variant: 'outline' })}>Przygotuj wniosek urlopowy</Link>
            <Link to="/odwolanie" className={buttonVariants({ variant: 'ghost' })}>Dostałem decyzję odmowną</Link>
          </div>
        </>
      )}

      <p className="text-sm text-muted-foreground">
        Ten tryb nie składa wniosków i nie zmienia decyzji ZUS. Liczy to, co wynika z reguł, i pokazuje
        konsekwencje. Stan trzymamy w Twojej przeglądarce, więc nic nie opuszcza urządzenia.
      </p>
    </PageContainer>
  )
}
