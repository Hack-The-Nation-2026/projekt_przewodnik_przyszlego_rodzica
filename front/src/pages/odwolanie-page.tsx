import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Download, Gavel, Printer, Scale, Timer } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChoiceSelect } from '@/components/ui/choice-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Term } from '@/components/glossary/term'
import { appealDeadline, appealDocuments, appealLetter, emptyAppeal, groundLabels, grounds, nextSteps } from '@/lib/appeal-path'
import type { AppealAnswers, DisputeGround } from '@/lib/appeal-path'
import { benefitList } from '@/lib/benefit-interview'
import type { BenefitCode } from '@/lib/benefit-interview'
import { formatDocumentDate } from '@/lib/benefit-documents'
import { cn } from '@/lib/utils'

const legalHelp = 'https://www.gov.pl/web/sprawiedliwosc'

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename + '.txt'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
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
 * Ścieżka po decyzji odmownej: pomaga w momencie, gdy jest już za późno na
 * wszystko poza reakcją. Nie ocenia szans i nie zastępuje porady prawnej —
 * daje diagnozę sporu, terminarz i projekt pisma na konkretny powód odmowy.
 */
export function OdwolaniePage() {
  const [answers, setAnswers] = useState<AppealAnswers>(emptyAppeal)
  const deadline = useMemo(() => appealDeadline(answers), [answers])
  const documents = useMemo(() => appealDocuments(answers), [answers])
  const letter = useMemo(() => appealLetter(answers).join('\n'), [answers])
  const ground = grounds[answers.ground]

  function update(patch: Partial<AppealAnswers>) {
    setAnswers((current) => ({ ...current, ...patch }))
  }

  return (
    <PageContainer className="space-y-8 py-10">
      <div className="no-print">
        <PageHeading
          title="Dostałem decyzję odmowną"
          description="Cztery pytania, a na końcu diagnoza sporu, termin na odwołanie i projekt pisma, które odpowiada na konkretny powód odmowy. To projekt pisma i informacja o procedurze, a nie zastępstwo prawne."
        />
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-lg">Cztery pytania o decyzję</CardTitle>
          <CardDescription>
            Termin liczy się od dnia doręczenia decyzji, a nie od daty jej wystawienia. Pytamy
            o doręczenie, bo pomyłka w tej dacie kosztuje całe odwołanie.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="od-benefit" label="Jakiej sprawy dotyczy decyzja" hint="Wybierz świadczenie, którego dotyczy odmowa.">
            <ChoiceSelect
              id="od-benefit"
              value={answers.benefit}
              onValueChange={(value) => update({ benefit: value as BenefitCode })}
              choices={(Object.keys(benefitList) as BenefitCode[]).map(
                (code) => [code, benefitList[code].name] as const,
              )}
            />
          </Field>
          <Field id="od-delivered" label="Data doręczenia decyzji" hint="Data z potwierdzenia odbioru albo z daty na kopercie, nie data wystawienia.">
            <Input id="od-delivered" type="date" value={answers.deliveredOn}
              onChange={(event) => update({ deliveredOn: event.target.value })} />
          </Field>
          <Field id="od-ground" label="Jaki powód podał ZUS" hint="Przepisz powód z uzasadnienia decyzji. Od niego zależą zarzuty i lista dokumentów.">
            <ChoiceSelect
              id="od-ground"
              value={answers.ground}
              onValueChange={(value) => update({ ground: value as DisputeGround })}
              choices={(Object.keys(groundLabels) as DisputeGround[]).map(
                (key) => [key, groundLabels[key]] as const,
              )}
            />
          </Field>
          <Field id="od-documents" label="Czy masz komplet dokumentów, które wtedy składałeś" hint="Jeśli nie, lista dokumentów dostanie osobną sekcję z uzupełnieniem.">
            <ChoiceSelect
              id="od-documents"
              value={answers.documents}
              onValueChange={(value) => update({ documents: value as AppealAnswers['documents'] })}
              choices={[
                ['unknown', 'Nie wiem'],
                ['yes', 'Tak, komplet'],
                ['no', 'Nie, brakuje dokumentów'],
              ]}
            />
          </Field>
          <Field id="od-number" label="Numer decyzji" hint="Znajdziesz go w prawym górnym rogu decyzji. Możesz zostawić puste.">
            <Input id="od-number" value={answers.decisionNumber} maxLength={60}
              onChange={(event) => update({ decisionNumber: event.target.value })} />
          </Field>
          <Field id="od-name" label="Imię i nazwisko" hint="Do nagłówka pisma.">
            <Input id="od-name" value={answers.name} maxLength={120}
              onChange={(event) => update({ name: event.target.value })} />
          </Field>
          <Field id="od-address" label="Adres" hint="Adres do korespondencji w sprawie.">
            <Input id="od-address" value={answers.address} maxLength={180}
              onChange={(event) => update({ address: event.target.value })} />
          </Field>
          <Field id="od-place" label="Miejscowość" hint="Miejsce wystawienia pisma, obok daty.">
            <Input id="od-place" value={answers.place} maxLength={80}
              onChange={(event) => update({ place: event.target.value })} />
          </Field>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Timer className="size-5" aria-hidden="true" />
            Terminarz
            {deadline.missed && (
              <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground">
                termin minął
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-base text-foreground">
            {!deadline.date
              ? 'Podaj datę doręczenia decyzji, żeby zobaczyć datę graniczną i ile dni zostało.'
              : deadline.missed
                ? `Termin minął ${formatDocumentDate(deadline.date)}. Nie kończymy na „za późno” — jest druga droga.`
                : `Odwołanie złóż do ${formatDocumentDate(deadline.date)}. Zostało ${deadline.daysLeft} dni.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Odwołanie wnosi się za pośrednictwem ZUS do sądu okręgowego w ciągu miesiąca od doręczenia
            decyzji. Termin liczy się od doręczenia, nie od wystawienia.
          </p>
          {deadline.alternative && <p className="font-medium">{deadline.alternative}</p>}
          <p>
            Jeśli opłata od odwołania jest dla Ciebie za wysoka, razem z pismem możesz poprosić sąd
            o zwolnienie z kosztów. Bezpłatna pomoc prawna:{' '}
            <a href={legalHelp} target="_blank" rel="noreferrer" className="font-medium text-primary underline decoration-dotted underline-offset-2">
              gov.pl
            </a>
            .
          </p>
        </CardContent>
      </Card>

      <section className="no-print space-y-3" aria-labelledby="diagnoza-title">
        <h2 id="diagnoza-title" className="font-display text-xl font-semibold">Diagnoza sporu</h2>
        <p className="text-sm text-muted-foreground">
          Odpowiedź ZUS sprowadzamy do jednego miejsca sporu. Przy każdym piszemy, co ZUS musiałby
          zobaczyć, żeby zmienić zdanie.
        </p>
        <Card className="p-4">
          <p className="font-medium">{groundLabels[answers.ground]}</p>
          <dl className="mt-2 space-y-2 text-sm">
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-muted-foreground">Czego ZUS nie widzi:</dt>
              <dd>{ground.whatZusMisses}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-muted-foreground">Co ZUS musiałby zobaczyć:</dt>
              <dd>{ground.whatZusNeeds}</dd>
            </div>
          </dl>
        </Card>
      </section>

      <section className="no-print space-y-3" aria-labelledby="dokumenty-title">
        <h2 id="dokumenty-title" className="font-display text-xl font-semibold">Lista dokumentów</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {documents.map((group) => (
            <Card key={group.title} className="p-4">
              <p className="font-medium">{group.title}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {group.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="no-print space-y-4">
          <h2 className="font-display text-xl font-semibold">Co dalej</h2>
          {nextSteps.map((step) => (
            <Card key={step.title} className="p-4">
              <p className="flex items-center gap-2 font-medium">
                <Scale className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {step.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </Card>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => downloadText('odwolanie-od-decyzji', letter)}>
              <Download aria-hidden="true" />
              Pobierz odwołanie
            </Button>
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Printer aria-hidden="true" />
              Wydrukuj
            </Button>
            <Link to="/kalkulator" className={cn(buttonVariants({ variant: 'ghost' }))}>
              <Gavel aria-hidden="true" />
              Sprawdź wyliczenie jeszcze raz
            </Link>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <h2 className="no-print font-display text-xl font-semibold">Projekt odwołania</h2>
          <div className="print-sheet">
            <article className="rounded-xl border border-border bg-card p-6 text-foreground shadow-sm">
              <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{letter}</pre>
            </article>
          </div>
          <p className="no-print text-sm text-muted-foreground">
            Pismo ma miejsca, które uzupełniasz sam: daty, numer decyzji, powód podany przez ZUS.
            Zarzuty i wnioski dowodowe są już dopasowane do powodu odmowy, który wskazałeś.
          </p>
          <p className="no-print text-xs text-muted-foreground">
            <Term name="odwolanie">Odwołanie</Term> to pismo, w którym nie zgadzasz się z decyzją ZUS.
            Termin liczy się od dnia doręczenia decyzji, a nie od daty jej wystawienia.
          </p>
        </div>
      </div>

      <p className="no-print flex items-start gap-2 text-sm text-muted-foreground">
        <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Odwołanie nie wymaga wzoru urzędowego: wystarczy pismo, które wskazuje decyzję, powód sporu
        i dokumenty na jego poparcie. Terminy i wnioski dopasowaliśmy do powodu odmowy, który
        wskazałeś.
      </p>
    </PageContainer>
  )
}
