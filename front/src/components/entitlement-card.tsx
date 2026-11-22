import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarClock, CircleAlert, FileText, Printer, User } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { ReadAloud } from '@/components/accessibility/read-aloud'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDocumentDate } from '@/lib/benefit-documents'
import { cn } from '@/lib/utils'
import type { EntitlementCardData } from '@/lib/entitlement-card'
import { useA11yStore } from '@/store/a11y-store'

const legalBasis = [
  'ustawa z 25 czerwca 1999 r. o świadczeniach pieniężnych z ubezpieczenia społecznego w razie choroby i macierzyństwa',
  'Kodeks pracy, art. 180–182¹ oraz 186–189',
  'rozporządzenie Ministra Rodziny, Pracy i Polityki Społecznej z 11 marca 2025 r. w sprawie zakresu informacji o okolicznościach mających wpływ na prawo do zasiłków',
]

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm font-medium break-words" data-read>{value}</dd>
    </div>
  )
}

function BenefitRow({ benefit }: { benefit: EntitlementCardData['benefits'][number] }) {
  return (
    <li className="break-inside-avoid border-t border-neutral-300 py-2.5 first:border-t-0 first:pt-0" data-read>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-semibold">{benefit.name}</p>
        <p className="tabular-nums">
          {benefit.total ?? 'kwoty nie da się policzyć z podanych danych'}
          {benefit.monthly && (
            <span className="ml-2 text-xs text-muted-foreground">≈ {benefit.monthly} miesięcznie</span>
          )}
        </p>
      </div>
      <dl className="mt-1 grid gap-x-6 gap-y-0.5 text-xs sm:grid-cols-2">
        {benefit.measure && (
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Wymiar</dt>
            <dd>{benefit.measure}</dd>
          </div>
        )}
        {benefit.period && (
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Okres</dt>
            <dd>{benefit.period}</dd>
          </div>
        )}
        {benefit.basis && (
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Kwota z</dt>
            <dd>{benefit.basis}</dd>
          </div>
        )}
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Wypłaca</dt>
          <dd>{benefit.payer}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Formularz</dt>
          <dd>{benefit.form}</dd>
        </div>
      </dl>
      {benefit.partialNote && (
        <p className="mt-1 text-xs text-red-800">{benefit.partialNote}</p>
      )}
    </li>
  )
}

/**
 * Karta uprawnień do wydruku: jedna strona, którą zabiera się do kadr albo do ZUS.
 * Nie jest decyzją ani wnioskiem, więc nagłówek mówi wprost, skąd pochodzą dane.
 */
export function EntitlementCard({
  data,
  person,
  onPersonChange,
  className,
}: {
  data: EntitlementCardData
  person?: string
  onPersonChange?: (value: string) => void
  className?: string
}) {
  return (
    <article className={cn('space-y-4 rounded-lg border border-neutral-300 bg-white p-6 text-navy', className)}>
      <header className="space-y-2 border-b-2 border-primary pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">Skrzydła Rodzica</p>
            <h1 className="font-display text-xl font-semibold">Karta uprawnień</h1>
            <p className="text-sm text-muted-foreground">
              {data.role} · karta z {formatDocumentDate(data.generatedAt)}
            </p>
          </div>
          <p className="max-w-xs rounded-md bg-secondary p-2 text-xs font-medium" data-read>
            {data.orientationNote}
          </p>
        </div>
        <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <Label htmlFor="card-person" className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Imię lub inicjały (opcjonalnie)
            </Label>
            {onPersonChange ? (
              <Input
                id="card-person"
                value={person ?? ''}
                maxLength={80}
                autoComplete="off"
                placeholder="np. A. K."
                onChange={(event) => onPersonChange(event.target.value)}
              />
            ) : (
              <p className="text-sm font-medium">{person || '—'}</p>
            )}
          </div>
          {data.total && (
            <div className="sm:text-right">
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Suma świadczeń z karty
              </p>
              <p className="font-display text-lg font-semibold tabular-nums">{data.total}</p>
            </div>
          )}
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Sytuacja</h2>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {data.situation.map((line) => (
            <Field key={line.label} label={line.label} value={line.value} />
          ))}
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Co przysługuje</h2>
        {data.benefits.length ? (
          <ul className="space-y-0">
            {data.benefits.map((benefit) => (
              <BenefitRow key={benefit.benefit} benefit={benefit} />
            ))}
          </ul>
        ) : (
          <p className="text-sm">
            Przy podanych danych żadne z liczonych świadczeń nie wychodzi. Szczegóły i drogi wyjścia są
            w kalkulatorze.
          </p>
        )}
        {data.notGranted.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Poza kartą zostaje: {data.notGranted.join(', ')}.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Terminy</h2>
        {data.deadlines.length ? (
          <ul className="space-y-2">
            {data.deadlines.map((deadline) => (
              <li
                key={`${deadline.date}-${deadline.label}`}
                data-read
                className={cn(
                  'flex flex-wrap items-baseline gap-x-3 gap-y-1 break-inside-avoid border-l-2 pl-3',
                  deadline.missed ? 'border-red-500' : 'border-primary',
                )}
              >
                <span className="font-medium tabular-nums">{formatDocumentDate(deadline.date)}</span>
                <span className="text-sm">{deadline.label}</span>
                <span className="w-full text-xs text-muted-foreground">{deadline.detail}</span>
                {deadline.missed && (
                  <span className="w-full text-xs font-medium text-red-800">
                    Termin minął. {deadline.missedNote ?? 'Sprawdź z płatnikiem, czy wniosek jeszcze przejdzie.'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Do tych świadczeń nie ma terminu, który dałoby się wyliczyć z podanych dat.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold">Co jeszcze załatwić</h2>
        {data.documents.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {data.documents.map((document) => (
              <li key={document} data-read>{document}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Komplet dokumentów jest opisany przy wniosku.</p>
        )}
      </section>

      <footer className="space-y-1 border-t border-neutral-300 pt-3 text-[11px] text-muted-foreground">
        <p>
          <span className="font-medium">Podstawa prawna: </span>
          {legalBasis.join('; ')}.
        </p>
        <p>
          Karta nie zastępuje decyzji ZUS. To wyliczenie orientacyjne na podstawie danych wpisanych
          w kalkulatorze. Dane nie opuściły przeglądarki.
        </p>
      </footer>
    </article>
  )
}

/** Strona z kartą: wydruk, drugie podejście do imienia i powrót do wyniku. */
export function KartaPage({ data }: { data: EntitlementCardData | null }) {
  const navigate = useNavigate()
  const sheet = useRef<HTMLDivElement>(null)
  const [person, setPerson] = useState('')
  const readAloudEnabled = useA11yStore((state) => state.readAloud)

  if (!data) {
    return (
      <PageContainer className="space-y-6 py-12">
        <h1 className="font-display text-2xl font-semibold">Karta uprawnień</h1>
        <p className="text-muted-foreground">
          Karta powstaje z wyniku wywiadu, więc najpierw policz świadczenia w kalkulatorze.
        </p>
        <Link to="/kalkulator" className={buttonVariants()}>
          Przejdź do kalkulatora
        </Link>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-6 py-10">
      <div className="no-print space-y-4">
        <h1 className="font-display text-2xl font-semibold">Karta uprawnień</h1>
        <p className="max-w-2xl text-muted-foreground">
          Jedna strona dla kadr albo ZUS: co przysługuje, ile, na jak długo i do kiedy złożyć wniosek.
          Wydrukuj ją albo pokaż na telefonie.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Drukuj albo zapisz jako PDF
          </Button>
          {readAloudEnabled && <ReadAloud targetRef={sheet} label="Przeczytaj kartę" />}
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft aria-hidden="true" />
            Wróć do wyniku
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="size-4" aria-hidden="true" />
            Imię wpiszesz w karcie poniżej
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-4" aria-hidden="true" />
            Terminy, które już minęły, są oznaczone na czerwono
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="size-4" aria-hidden="true" />
            Formularze są przy każdym świadczeniu
          </span>
        </div>
      </div>

      <div ref={sheet} className="print-sheet">
        <EntitlementCard data={data} person={person} onPersonChange={setPerson} />
      </div>

      <p className="no-print flex items-start gap-2 text-sm text-muted-foreground">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Karta niczego nie wysyła. Ten sam wydruk możesz uzupełnić wnioskiem urlopowym, żeby kadry
        dostały komplet na jednej wizycie.
      </p>
    </PageContainer>
  )
}
