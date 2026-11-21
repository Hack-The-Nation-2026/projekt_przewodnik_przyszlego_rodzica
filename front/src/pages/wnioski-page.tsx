import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Check, CircleAlert, Download, FileText, Printer, Send, X,
} from 'lucide-react'
import { EntitlementCard } from '@/components/entitlement-card'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buildEntitlementCard } from '@/lib/entitlement-card'
import type { EntitlementCardData } from '@/lib/entitlement-card'
import { buildLeaveApplications, readLeaveCase } from '@/lib/leave-applications'
import type { LeaveApplication } from '@/lib/leave-applications'
import { formatDocumentDate } from '@/lib/benefit-documents'
import { cn } from '@/lib/utils'

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename + '.txt'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function initialDecisions(application: LeaveApplication) {
  const values: Record<string, string> = {}
  for (const decision of application.decisions) values[decision.id] = decision.prefill ?? ''
  return values
}

/** Ekran wyboru: tylko wnioski wynikające z sytuacji, każdy z jednym zdaniem o co chodzi. */
function ApplicationPicker({
  applications,
  onPick,
}: {
  applications: LeaveApplication[]
  onPick: (application: LeaveApplication) => void
}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {applications.map((application) => (
        <li key={application.code}>
          <button
            type="button"
            onClick={() => onPick(application)}
            className="h-full w-full rounded-lg border border-border p-5 text-left transition-colors hover:border-primary hover:bg-secondary/50"
          >
            <span className="flex items-center gap-2">
              <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="font-display text-lg font-semibold">{application.title}</span>
            </span>
            <span className="mt-2 block text-sm">{application.settles}</span>
            <span className="mt-3 block text-xs text-muted-foreground">
              <span className="font-medium">Kiedy: </span>
              {application.when}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              <span className="font-medium">Po terminie: </span>
              {application.late}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function WnioskiPage() {
  const leaveCase = useMemo(() => readLeaveCase(), [])
  const letterRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<LeaveApplication | null>(null)
  const [decisions, setDecisions] = useState<Record<string, string>>({})
  const [downloaded, setDownloaded] = useState(false)
  const [includeCard, setIncludeCard] = useState(false)
  const [sentAt, setSentAt] = useState<string | null>(null)

  const applications = useMemo(
    () => (leaveCase ? buildLeaveApplications(leaveCase) : []),
    [leaveCase],
  )
  const card = useMemo<EntitlementCardData | null>(
    () => (leaveCase ? buildEntitlementCard(leaveCase.values, leaveCase.assessments, leaveCase.context) : null),
    [leaveCase],
  )

  if (!leaveCase) {
    return (
      <PageContainer className="space-y-6 py-12">
        <h1 className="font-display text-2xl font-semibold">Kreator wniosku urlopowego</h1>
        <p className="max-w-2xl text-muted-foreground">
          Wnioski powstają z wyniku wywiadu: dane osobowe i daty przychodzą z kalkulatora, więc najpierw
          policz świadczenia.
        </p>
        <Link to="/kalkulator" className={buttonVariants()}>
          Przejdź do kalkulatora
        </Link>
      </PageContainer>
    )
  }

  if (!applications.length) {
    return (
      <PageContainer className="space-y-6 py-12">
        <h1 className="font-display text-2xl font-semibold">Kreator wniosku urlopowego</h1>
        <p className="max-w-2xl text-muted-foreground">
          Przy Twoich odpowiedziach żaden z urlopów nie wychodzi, więc nie ma czego wypełniać. Wróć do
          kalkulatora i sprawdź, czy da się poprawić odpowiedzi o ubezpieczeniu albo o dacie porodu.
        </p>
        <Link to="/kalkulator" className={buttonVariants()}>
          Wróć do kalkulatora
        </Link>
      </PageContainer>
    )
  }

  function pick(application: LeaveApplication) {
    setSelected(application)
    setDecisions(initialDecisions(application))
    setDownloaded(false)
    setIncludeCard(false)
    setSentAt(null)
  }

  function update(id: string, value: string) {
    setDecisions((current) => ({ ...current, [id]: value }))
    setSentAt(null)
  }

  const checks = selected ? selected.checks(decisions) : []
  const blocked = checks.some((check) => !check.ok)
  const letterText = selected ? selected.letter(decisions).join('\n') : ''

  function download() {
    if (!selected) return
    downloadText(selected.documentName, letterText)
    setDownloaded(true)
  }

  function printWithCard() {
    setIncludeCard(true)
    // Karta dochodzi do tego samego wydruku jako druga strona, więc drukowanie
    // uruchamiamy po przerysowaniu, żeby zdążyła wejść do dokumentu.
    setTimeout(() => window.print(), 60)
  }

  return (
    <PageContainer className="space-y-8 py-10">
      <div className="no-print">
        <PageHeading
          title="Kreator wniosku urlopowego"
          description="Wnioski o urlopy to pisma do pracodawcy, bo ZUS ich nie publikuje. Powstają z Twoich odpowiedzi: dane i daty z wywiadu, decyzje tylko te, które należą do Ciebie."
        />
      </div>

      {!selected && (
        <section className="no-print space-y-4" aria-label="Wybierz wniosek">
          <h2 className="font-display text-xl font-semibold">
            Z Twojej sytuacji wynikają {applications.length === 1 ? 'jeden wniosek' : `${applications.length} wnioski`}
          </h2>
          <ApplicationPicker applications={applications} onPick={pick} />
        </section>
      )}

      {selected && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="no-print space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelected(null)}>
                <ArrowLeft aria-hidden="true" />
                Inny wniosek
              </Button>
              <h2 className="font-display text-xl font-semibold">{selected.title}</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Co załatwia ten wniosek</CardTitle>
                <CardDescription>{selected.settles}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">Kiedy złożyć: </span>{selected.when}</p>
                <p><span className="font-medium">Po terminie: </span>{selected.late}</p>
                <p><span className="font-medium">Adresat: </span>{selected.addressee}</p>
                {selected.period && (
                  <p>
                    <span className="font-medium">Okres z symulacji: </span>
                    {formatDocumentDate(selected.period.start)} – {formatDocumentDate(selected.period.end)}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold">Uzupełnij tylko to, czego nie ma w wywiadzie</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {selected.decisions.map((decision) => (
                  <div key={decision.id} className={cn('min-w-0 space-y-1.5', decision.type === 'text' && decision.id === 'address' && 'sm:col-span-2')}>
                    <Label htmlFor={`dec-${decision.id}`} className="leading-snug">
                      {decision.label}
                      {decision.required && <span className="text-destructive"> *</span>}
                    </Label>
                    <Input
                      id={`dec-${decision.id}`}
                      type={decision.type === 'date' ? 'date' : 'text'}
                      inputMode={decision.type === 'number' ? 'numeric' : undefined}
                      value={decisions[decision.id] ?? ''}
                      onChange={(event) => update(decision.id, event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{decision.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <section aria-labelledby="checks-title" className="space-y-3">
              <h3 id="checks-title" className="font-display text-lg font-semibold">
                Sprawdzenie przed wysłaniem
              </h3>
              <p className="text-sm text-muted-foreground">
                Trzy rzeczy, które najczęściej psują wniosek: data poza dopuszczalnym zakresem, liczba dni
                niezgodna z wymiarem i sprzeczność z tym, co zadeklarował drugi rodzic.
              </p>
              <ul className="space-y-2">
                {checks.map((check, index) => (
                  <li
                    key={index}
                    className={cn(
                      'flex items-start gap-2 rounded-md border p-3 text-sm',
                      check.ok ? 'border-primary/40 bg-secondary/40' : 'border-destructive/40 bg-destructive/5',
                    )}
                  >
                    {check.ok
                      ? <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      : <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />}
                    <span>{check.message}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
              <Button type="button" onClick={download}>
                <Download aria-hidden="true" />
                Pobierz do podpisu
              </Button>
              <Button type="button" variant="outline" onClick={() => window.print()}>
                <Printer aria-hidden="true" />
                Wydrukuj
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={blocked}
                onClick={() => setSentAt(new Date().toLocaleString('pl-PL'))}
              >
                <Send aria-hidden="true" />
                Wyślij do pracodawcy
              </Button>
            </div>
            {blocked && (
              <p className="flex items-start gap-2 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Popraw to, co podświetlone wyżej. Wysyłka jest zablokowana, dopóki wniosek nie zgadza się z
                wymiarem i datami z symulacji.
              </p>
            )}
            {sentAt && (
              <p role="status" className="rounded-md border border-primary/40 bg-secondary/40 p-3 text-sm">
                Symulacja wysyłki z {sentAt}. W tej wersji nic nie wyszło z przeglądarki: pobierz wniosek
                i złóż go w kadrach albo przez swój system pracowniczy.
              </p>
            )}

            {downloaded && (
              <div className="rounded-md border border-gold bg-gold/10 p-4 text-sm">
                <p className="font-medium">Dodaj kartę uprawnień jako drugą stronę tego samego wydruku.</p>
                <p className="mt-1 text-muted-foreground">
                  Idziesz do kadr z pismem i podsumowaniem: widać na nim wymiar, kwoty i terminy. Jedna
                  wizyta zamiast trzech.
                </p>
                <Button type="button" className="mt-3" variant="gold" onClick={printWithCard}>
                  <Printer aria-hidden="true" />
                  Drukuj wniosek i kartę razem
                </Button>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <h3 className="no-print font-display text-lg font-semibold">Podgląd pisma</h3>
            <div className="print-sheet" ref={letterRef}>
              <article className="rounded-lg border border-neutral-300 bg-white p-6 text-navy">
                <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{letterText}</pre>
              </article>
              {includeCard && card && (
                <div className="mt-6 break-before-page">
                  <EntitlementCard data={card} />
                </div>
              )}
            </div>
            <p className="no-print text-sm text-muted-foreground">
              Podgląd pokazuje dokładnie to, co wydrukujesz. Zmiana pola w formularzu od razu zmienia pismo.
            </p>
          </div>
        </div>
      )}

      <p className="no-print flex items-start gap-2 text-sm text-muted-foreground">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Wnioski są projektem pisma, nie wzorem urzędowym. Terminy i wymiary policzył kalkulator, ale
        ostateczną decyzję podejmuje pracodawca albo ZUS.
      </p>
    </PageContainer>
  )
}
