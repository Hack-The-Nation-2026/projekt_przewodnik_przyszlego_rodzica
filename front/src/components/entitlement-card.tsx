import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarClock, Check, CircleAlert, FileText, Printer, User } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { ReadAloud } from '@/components/accessibility/read-aloud'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDocumentDate } from '@/lib/benefit-documents'
import { readCardDocuments, saveCardDocuments, toggleCardDocument } from '@/lib/card-documents'
import { cn } from '@/lib/utils'
import type { EntitlementCardData } from '@/lib/entitlement-card'
import { useA11yStore } from '@/store/a11y-store'
import { useAppStore } from '@/store/app-store'

const legalBasis = [
  'ustawa z 25 czerwca 1999 r. o świadczeniach pieniężnych z ubezpieczenia społecznego w razie choroby i macierzyństwa',
  'Kodeks pracy, art. 180–182¹ oraz 186–189',
  'rozporządzenie Ministra Rodziny, Pracy i Polityki Społecznej z 11 marca 2025 r. w sprawie zakresu informacji o okolicznościach mających wpływ na prawo do zasiłków',
]

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words" data-read>{value}</dd>
    </div>
  )
}

/** Kwadrat jak w reszcie serwisu: obramowanie z tokenu, a nie znak ☐ z klawiatury. */
function DocumentMark({ has }: { has: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
        has ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background',
      )}
    >
      {has && <Check className="size-3" strokeWidth={3} />}
    </span>
  )
}

function BenefitRow({ benefit }: { benefit: EntitlementCardData['benefits'][number] }) {
  return (
    <li className="break-inside-avoid border-t border-border py-2.5 first:border-t-0 first:pt-0" data-read>
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
 * Karta uprawnień do wydruku: jedna strona z podsumowaniem uprawnień i terminów.
 * Nie jest decyzją ani wnioskiem, więc nagłówek mówi wprost, skąd pochodzą dane.
 */
export function EntitlementCard({
  data,
  person,
  onPersonChange,
  interactive = false,
  className,
}: {
  data: EntitlementCardData
  person?: string
  onPersonChange?: (value: string) => void
  /** Na ekranie karty dokumenty można odhaczać, na wydruku są tylko znaczniki. */
  interactive?: boolean
  className?: string
}) {
  const [have, setHave] = useState<string[]>(() => readCardDocuments())

  function toggle(document: string) {
    const next = toggleCardDocument(have, document)
    setHave(next)
    saveCardDocuments(next)
  }

  return (
    <article className={cn('space-y-5 rounded-xl border border-border bg-card p-6 text-foreground shadow-sm', className)}>
      <header className="space-y-3 border-b-2 border-primary pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Skrzydła Rodzica</p>
            <h1 className="font-display text-xl font-semibold">Karta uprawnień</h1>
            <p className="text-sm text-muted-foreground">
              {data.role}, karta z {formatDocumentDate(data.generatedAt)}
            </p>
          </div>
          <p className="max-w-xs rounded-lg bg-secondary p-3 text-xs font-medium" data-read>
            {data.orientationNote}
          </p>
        </div>
        <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <Label htmlFor="card-person" className="text-xs font-medium text-muted-foreground">
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
              <p className="text-xs font-medium text-muted-foreground">
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
          <>
            <p className="text-xs text-muted-foreground">
              {have.length
                ? `Masz już ${Math.min(have.length, data.documents.length)} z ${data.documents.length} dokumentów. `
                : ''}
              {interactive
                ? 'Odhacz dokumenty, które już masz. Zaznaczenia zapisują się w tej przeglądarce i pojawiają się na wydruku.'
                : 'Zaznaczony kwadrat oznacza dokument, który już masz.'}
            </p>
            <ul className="space-y-0.5">
              {data.documents.map((document) => {
                const has = have.includes(document)
                const text = (
                  <span className={cn('text-sm', has && 'text-muted-foreground')}>{document}</span>
                )
                return (
                  <li key={document} data-read>
                    {interactive ? (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={has}
                        onClick={() => toggle(document)}
                        className="flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <DocumentMark has={has} />
                        {text}
                        <span className="sr-only">{has ? 'Mam ten dokument' : 'Nie mam tego dokumentu'}</span>
                      </button>
                    ) : (
                      <span className="flex items-start gap-2.5 px-2 py-1.5">
                        <DocumentMark has={has} />
                        {text}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Komplet dokumentów jest opisany przy wniosku.</p>
        )}
      </section>

      <footer className="space-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
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
  const citizen = useAppStore((state) => state.citizen)
  // Karta i tak jest podpisana, a dane z wejścia są już znane, więc wpisujemy je
  // od razu. Kto wchodził ręcznie albo wcale, dopisze imię na karcie.
  const [person, setPerson] = useState(() =>
    citizen ? `${citizen.first_name} ${citizen.last_name}` : '',
  )
  const readAloudEnabled = useA11yStore((state) => state.readAloud)

  if (!data) {
    return (
      <PageContainer className="space-y-6 py-12">
        <h1 className="font-display text-2xl font-semibold">Karta uprawnień</h1>
        <p className="text-muted-foreground">
          Karta powstaje z wyniku sprawdzenia, więc najpierw policz świadczenia w kalkulatorze.
        </p>
        <Link to="/kalkulator" className={buttonVariants()}>
          Przejdź do kalkulatora
        </Link>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="print-page space-y-6 py-10">
      <div className="no-print space-y-4">
        <h1 className="font-display text-2xl font-semibold">Karta uprawnień</h1>
        <p className="max-w-2xl text-muted-foreground">
          Karta uprawnień na jednej stronie: co przysługuje, w jakiej wysokości, na jak długo
          i do kiedy złożyć wniosek.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Drukuj albo zapisz jako PDF
          </Button>
          {readAloudEnabled && <ReadAloud targetRef={sheet} label="Przeczytaj kartę" />}
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/kalkulator', { state: { restore: true } })}
          >
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
        <EntitlementCard data={data} person={person} onPersonChange={setPerson} interactive />
      </div>

      <p className="no-print flex items-start gap-2 text-sm text-muted-foreground">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Karta niczego nie wysyła. Ten sam wydruk możesz uzupełnić wnioskiem urlopowym, żeby kadry
        dostały komplet na jednej wizycie.
      </p>
    </PageContainer>
  )
}
