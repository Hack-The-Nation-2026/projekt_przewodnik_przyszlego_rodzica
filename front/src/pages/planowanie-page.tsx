import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarPlus, CircleAlert, Info, Printer } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChoiceSelect } from '@/components/ui/choice-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { downloadIcs } from '@/lib/calendar'
import { buildPrepList, emptyPlanning, planningCalendar, prepLabels } from '@/lib/planning-mode'
import type { PlanningAnswers, PrepItem, PrepWhen } from '@/lib/planning-mode'
import { cn } from '@/lib/utils'

const whenOrder: PrepWhen[] = ['now', 'before', 'during']

function Question({ id, label, hint, children }: {
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

function PrepRow({ item }: { item: PrepItem }) {
  return (
    <li className="rounded-lg border border-border p-4">
      <p className="font-medium">
        {item.title}
        {item.unconfirmed && (
          <span className="ml-2 rounded-full bg-gold/30 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-gold-foreground">
            do potwierdzenia w ZUS
          </span>
        )}
      </p>
      <dl className="mt-2 space-y-1.5 text-sm">
        <div className="flex gap-1.5">
          <dt className="shrink-0 text-muted-foreground">Dlaczego to ma znaczenie:</dt>
          <dd>{item.why}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="shrink-0 text-muted-foreground">Jeśli nic nie zrobisz:</dt>
          <dd>{item.ifNothing}</dd>
        </div>
      </dl>
      {item.action && (
        <a
          href={item.action.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline decoration-dotted underline-offset-2"
        >
          {item.action.label}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
      )}
    </li>
  )
}

/**
 * Tryb planowania: dla ludzi, którzy dopiero myślą o dziecku i dziś nie
 * trafiliby do ZUS. Nie liczymy kwot ani tygodni, bo bez daty porodu nie da
 * się tego policzyć uczciwie — zamiast liczb jest lista przygotowań.
 */
export function PlanowaniePage() {
  const [answers, setAnswers] = useState<PlanningAnswers>(emptyPlanning)
  const items = useMemo(() => buildPrepList(answers), [answers])
  const grouped = whenOrder
    .map((when) => ({ when, items: items.filter((item) => item.when === when) }))
    .filter((group) => group.items.length > 0)

  function update(patch: Partial<PlanningAnswers>) {
    setAnswers((current) => ({ ...current, ...patch }))
  }

  function exportCalendar() {
    downloadIcs(planningCalendar(answers, items), 'przygotowania-przed-ciaza.ics')
  }

  return (
    <PageContainer className="space-y-8 py-10">
      <div className="no-print">
        <PageHeading
          title="Planujesz dziecko?"
          description="Pięć pytań o teraźniejszość, a na końcu lista przygotowań i termin, do którego warto je zamknąć. Nie liczymy kwot ani tygodni, bo bez daty porodu nie da się tego policzyć uczciwie."
        />
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-lg">Pięć pytań o teraźniejszość</CardTitle>
          <CardDescription>Odpowiedzi zmieniają listę poniżej od razu. Nic nie wysyłamy na serwer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Question id="pl-employment" label="Forma zatrudnienia" hint="To, co masz teraz, a nie to, co planujesz.">
            <ChoiceSelect
              id="pl-employment"
              value={answers.employment}
              onValueChange={(value) => update({ employment: value as PlanningAnswers['employment'] })}
              choices={[
                ['unknown', 'Nie wiem'],
                ['employee', 'Umowa o pracę'],
                ['contractor', 'Umowa zlecenia'],
                ['self_employed', 'Działalność gospodarcza'],
                ['other', 'Inny tytuł ubezpieczenia'],
              ]}
            />
          </Question>
          <Question id="pl-payer" label="Czy płatnik zgłasza Cię do ubezpieczenia chorobowego?" hint="Przy umowie zlecenia zdarza się, że zgłoszenia nie ma.">
            <ChoiceSelect
              id="pl-payer"
              value={answers.payerReports}
              onValueChange={(value) => update({ payerReports: value as PlanningAnswers['payerReports'] })}
              choices={[
                ['unknown', 'Nie wiem'],
                ['yes', 'Tak, zgłasza'],
                ['no', 'Nie zgłasza'],
              ]}
            />
          </Question>
          <Question id="pl-gaps" label="Przerwy w ubezpieczeniu w ostatnich dwóch latach" hint="Przerwa w ubezpieczeniu chorobowym skraca wymiar świadczeń.">
            <ChoiceSelect
              id="pl-gaps"
              value={answers.insuranceGaps}
              onValueChange={(value) => update({ insuranceGaps: value as PlanningAnswers['insuranceGaps'] })}
              choices={[
                ['unknown', 'Nie wiem'],
                ['none', 'Żadnych przerw'],
                ['short', 'Krótka przerwa'],
                ['long', 'Dłuższa przerwa'],
              ]}
            />
          </Question>
          <Question id="pl-business" label="Działalność gospodarcza i zaległości" hint="Zaległości wobec ZUS mogą pozbawić prawa do świadczenia.">
            <ChoiceSelect
              id="pl-business"
              value={answers.business}
              onValueChange={(value) => update({ business: value as PlanningAnswers['business'] })}
              choices={[
                ['none', 'Nie prowadzę działalności'],
                ['not_started', 'Dopiero zamierzam zacząć'],
                ['active', 'Prowadzę, bez zaległości'],
                ['active_arrears', 'Prowadzę, mam zaległości'],
                ['unknown', 'Nie wiem'],
              ]}
            />
          </Question>
          <Question id="pl-horizon" label="Za ile miesięcy planujesz dziecko" hint="Podaj przybliżenie, na przykład 12. To ustawia punkt kontrolny w kalendarzu, nie termin ustawowy.">
            <Input
              id="pl-horizon"
              inputMode="numeric"
              maxLength={3}
              placeholder="np. 12"
              value={answers.horizonMonths}
              onChange={(event) => update({ horizonMonths: event.target.value.replace(/\D/g, '') })}
            />
          </Question>
        </CardContent>
      </Card>

      <div className="print-sheet">
        <article className="space-y-5 rounded-xl border border-border bg-card p-6 text-foreground shadow-sm">
          <header className="space-y-1 border-b-2 border-primary pb-4">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Skrzydła Rodzica</p>
            <h2 className="font-display text-xl font-semibold">Lista przygotowań przed ciążą</h2>
            <p className="text-sm text-muted-foreground">
              Bez daty porodu nie podajemy kwot ani tygodni. Pozycje wynikają z Twoich odpowiedzi, a nie
              z katalogu wszystkich rad. Pozycja z napisem „do potwierdzenia w ZUS” nie ma liczby, bo
              materiał ZUS jej nie potwierdza.
            </p>
          </header>

          {grouped.length ? grouped.map((group) => (
            <section key={group.when} className="space-y-3">
              <h3 className="font-display text-base font-semibold">{prepLabels[group.when]}</h3>
              <ul className="space-y-3">
                {group.items.map((item) => <PrepRow key={item.id} item={item} />)}
              </ul>
            </section>
          )) : (
            <p className="text-sm">Odpowiedz na pytania powyżej, żeby zobaczyć listę.</p>
          )}

          <footer className="border-t border-border pt-3 text-[11px] text-muted-foreground">
            Lista przygotowań to informacja o procedurze, a nie porada prawna ani decyzja ZUS. Pozycje
            oznaczone jako „do potwierdzenia w ZUS” trzeba sprawdzić w ZUS, bo zależą od tytułu
            ubezpieczenia. Dane nie opuściły przeglądarki.
          </footer>
        </article>
      </div>

      <div className="no-print flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          Drukuj albo zapisz jako PDF
        </Button>
        <Button type="button" variant="outline" onClick={exportCalendar} disabled={!answers.horizonMonths}>
          <CalendarPlus aria-hidden="true" />
          Dodaj termin do kalendarza
        </Button>
        <Link to="/kalkulator" className={cn(buttonVariants({ variant: 'outline' }))}>
          Mam już datę porodu — policz świadczenia
        </Link>
      </div>

      <p className="no-print flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Gdy pojawi się data porodu, wróć i wypełnij formularz: wtedy ten sam serwis policzy kwoty, wymiary
        i terminy. Ta lista jest od tego, żeby trafić do tego momentu z zamkniętymi przygotowaniami.
      </p>
      <p className="no-print flex items-start gap-2 text-sm text-muted-foreground">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Świadomie nie podajemy okresów wyczekiwania ani progów kwotowych z pamięci. Jeśli czegoś nie ma
        w materiałach od ZUS, pozycja nie dostaje liczby.
      </p>
    </PageContainer>
  )
}
