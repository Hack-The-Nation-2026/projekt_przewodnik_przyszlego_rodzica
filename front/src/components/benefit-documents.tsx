import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Building2, CalendarDays, FileText, MapPin } from 'lucide-react'
import { ApplicationDraft, DocumentField } from '@/components/application-draft'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { benefitList } from '@/lib/benefit-interview'
import type { BenefitCode } from '@/lib/benefit-interview'
import { isFamilyBenefit } from '@/lib/benefit-document-context'
import type { DocumentContext } from '@/lib/benefit-document-context'
import {
  documentEmployment, documentRoles, formatDocumentDate, getBenefitPayer, getDocumentGuide,
  leaveRegulation, payerSource, shiftDate,
} from '@/lib/benefit-documents'
import type { Coverage, DocumentOptions, Employment, MaternityCase, PayerSize, Role } from '@/lib/benefit-documents'
import { cn } from '@/lib/utils'

const benefits = Object.keys(benefitList) as BenefitCode[]
const ezus = 'https://www.zus.pl/ezus'
type Step = 'benefit' | 'situation' | 'documents'
const stepTitles: Record<Step, string> = {
  benefit: 'Wybierz świadczenie',
  situation: 'Dopasuj do swojej sytuacji',
  documents: 'Co złożyć i gdzie',
}

function SelectField<T extends string>({ name, title, value, onChange, disabled, children }: {
  name: string
  title: string
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <DocumentField name={name} title={title}>
      <Select value={value} disabled={disabled} onValueChange={(selected) => onChange(selected as T)}>
        <SelectTrigger id={name}><SelectValue /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </DocumentField>
  )
}

function routeFor(benefit: BenefitCode, options: DocumentOptions) {
  const payer = getBenefitPayer(benefit, options)
  if (benefit === 'rehabilitacyjne') {
    return {
      addressee: 'Zakład Ubezpieczeń Społecznych',
      description: 'Wniosek i dokumentację złóż w ZUS. ZUS wydaje decyzję także wtedy, gdy świadczenie wypłaca Twój płatnik składek.',
      showEzus: true,
    }
  }
  if (payer === 'zus') {
    return {
      addressee: 'Zakład Ubezpieczeń Społecznych',
      description: options.employment === 'employee' && options.coverage !== 'ended' && benefit !== 'w_wysokosci_macierzynskiego'
        ? 'ZUS ustala i wypłaca świadczenie. Przekaż dokumenty pracodawcy do uzupełnienia i przekazania do ZUS. Wniosek o urlop kieruj do pracodawcy.'
        : 'ZUS ustala i wypłaca świadczenie. Dokumenty możesz złożyć przez eZUS, w placówce ZUS lub pocztą. Zaświadczenie płatnika przekazuje płatnik.',
      showEzus: true,
    }
  }
  if (payer === 'payer') {
    return {
      addressee: options.employment === 'employee' ? 'Pracodawca' : 'Płatnik składek',
      description: 'Świadczenie ustala i wypłaca płatnik składek. Przekaż wymagane dokumenty kadrom lub właściwej osobie po stronie płatnika.',
      showEzus: false,
    }
  }
  return {
    addressee: '',
    description: 'Potwierdź u płatnika, kto wypłaca świadczenie. W czasie ubezpieczenia zasadniczo do 20 osób wypłaca ZUS, a powyżej 20 osób płatnik składek.',
    showEzus: false,
  }
}

function coverageFromContext(benefit: BenefitCode, context?: DocumentContext): Coverage {
  if (!context) return 'unknown'
  if (!context.insuranceEnd) return context.insured === 'yes' ? 'active' : 'unknown'
  const period = context.periods[benefit]
  if (period) {
    if (period.start > context.insuranceEnd) return 'ended'
    if (period.end <= context.insuranceEnd) return 'active'
    return 'unknown'
  }
  if (benefit === 'macierzynski' && context.role === 'mother') {
    if (context.extendedToBirth || context.eventDate <= context.insuranceEnd) return 'active'
    return 'ended'
  }
  return 'unknown'
}

function DateHints({ benefit, options, context }: { benefit: BenefitCode; options: DocumentOptions; context: DocumentContext }) {
  const hints: string[] = []
  const period = context.periods[benefit]
  if ((benefit === 'macierzynski' || benefit === 'rodzicielski') && (options.role === 'mother' || options.role === 'foster')) {
    hints.push('21. dzień od zdarzenia dla wniosku o 81,5% wypada ' + formatDocumentDate(shiftDate(context.eventDate, 21)) + '.')
  }
  if (options.employment === 'employee' && options.coverage !== 'ended') {
    if (benefit === 'macierzynski' && options.maternityCase === 'takeover' && context.takeoverDate) {
      hints.push('Wniosek ojca o przejęcie urlopu złóż do ' + formatDocumentDate(shiftDate(context.takeoverDate, -14)) + '.')
    }
    if (benefit === 'rodzicielski' && period) {
      hints.push('Wniosek o urlop rodzicielski złóż do ' + formatDocumentDate(shiftDate(period.start, -21)) + '.')
    }
    if (benefit === 'ojcowski' && period) {
      hints.push('Dla początku ojcowskiego z symulacji termin wniosku wypada ' + formatDocumentDate(shiftDate(period.start, -7)) + '.')
    }
    const end = context.periods.macierzynski?.end
    if (benefit === 'uzupelniajacy' && end) {
      hints.push('Wniosek o urlop uzupełniający złóż do ' + formatDocumentDate(shiftDate(end, -21)) + '.')
    }
  }

  if (!hints.length) return null
  return (
    <div className="space-y-1 rounded-md bg-secondary p-3">
      <p className="font-semibold">{context.forecast ? 'Daty orientacyjne z wywiadu' : 'Daty według okresów z symulacji'}</p>
      <ul className="list-disc space-y-1 pl-5">{hints.map((hint) => <li key={hint}>{hint}</li>)}</ul>
      <p className="text-muted-foreground">To przesunięcia kalendarzowe bez korekt za dni wolne. Przy zmianie okresu przelicz termin.</p>
    </div>
  )
}

export default function BenefitDocuments({
  benefit, onBenefitChange, context, onClose,
}: {
  benefit: BenefitCode
  onBenefitChange?: (benefit: BenefitCode) => void
  context?: DocumentContext
  onClose?: () => void
}) {
  const stepHeading = useRef<HTMLHeadingElement>(null)
  const draftHeading = useRef<HTMLHeadingElement>(null)
  const draftTrigger = useRef<HTMLButtonElement>(null)
  const focusStep = useRef(false)
  const [step, setStep] = useState<Step>(onBenefitChange ? 'benefit' : 'documents')
  const [role, setRole] = useState<Role>(context?.role ?? 'mother')
  const [employment, setEmployment] = useState<Employment>(context?.employment ?? 'unknown')
  const [payerSize, setPayerSize] = useState<PayerSize>('unknown')
  const [coverageOverride, setCoverageOverride] = useState<{ benefit: BenefitCode; value: Coverage }>()
  const [maternityCase, setMaternityCase] = useState<MaternityCase>(context?.role === 'father' ? 'takeover' : 'standard')
  const [mode, setMode] = useState<'benefit' | 'leave' | null>(null)
  const scenario = role === context?.role ? context : undefined
  const coverage = coverageOverride?.benefit === benefit ? coverageOverride.value : coverageFromContext(benefit, scenario)
  const options = { role, employment, payerSize, coverage, maternityCase }
  const guide = getDocumentGuide(benefit, options, scenario)
  const route = routeFor(benefit, options)
  const useLeave = mode === 'leave' && guide.leave
  const period = isFamilyBenefit(benefit) && (scenario?.forecast || (benefit === 'macierzynski' && maternityCase === 'before_birth'))
    ? undefined : scenario?.periods[benefit]
  const rateAvailable = (benefit === 'macierzynski' || benefit === 'rodzicielski') && role !== 'father'
  const showPayerOptions = benefit !== 'w_wysokosci_macierzynskiego'
  const payerSizeApplies = employment !== 'self_employed' && coverage !== 'ended'
  const steps: Step[] = [
    ...(onBenefitChange ? ['benefit' as const] : []),
    ...(showPayerOptions ? ['situation' as const] : []),
    'documents',
  ]

  function goToStep(next: Step) {
    setMode(null)
    focusStep.current = true
    setStep(next)
  }

  useEffect(() => {
    if (!focusStep.current) return
    focusStep.current = false
    stepHeading.current?.focus({ preventScroll: true })
    stepHeading.current?.scrollIntoView({ block: 'start' })
  }, [step])

  useEffect(() => {
    if (!mode) return
    draftHeading.current?.focus({ preventScroll: true })
    draftHeading.current?.scrollIntoView({ block: 'start' })
  }, [mode])

  function closeDraft() {
    setMode(null)
    draftTrigger.current?.focus()
  }

  function toggleDraft(next: 'benefit' | 'leave', trigger: HTMLButtonElement) {
    draftTrigger.current = trigger
    setMode(mode === next ? null : next)
  }

  return (
    <section className="space-y-4" aria-labelledby="documents-title">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {onBenefitChange && <p className="text-sm font-medium text-primary">Krok {steps.indexOf(step) + 1} z {steps.length}</p>}
            {onClose && (
              <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={onClose}>
                Zamknij dokumenty
              </Button>
            )}
          </div>
          <h2 id="documents-title" ref={stepHeading} tabIndex={-1} className="scroll-mt-24 text-2xl font-semibold focus:outline-none">
            {stepTitles[step]}
          </h2>
        </CardHeader>

        {step === 'benefit' && (
          <CardContent className="space-y-5">
            <SelectField name="document-benefit" title="Świadczenie" value={benefit} onChange={(value) => {
              onBenefitChange?.(value)
              setCoverageOverride(undefined)
            }}>
              {benefits.map((key) => <SelectItem key={key} value={key}>{benefitList[key].name}</SelectItem>)}
            </SelectField>
            <Button type="button" onClick={() => goToStep(showPayerOptions ? 'situation' : 'documents')}>
              Dalej <ArrowRight aria-hidden="true" />
            </Button>
          </CardContent>
        )}

        {step === 'situation' && (
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">Podaj dane, które znasz. Na ich podstawie dobierzemy załączniki i adresata.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {isFamilyBenefit(benefit) && (
                <SelectField name="document-role" title="Sytuacja rodzinna" value={role} onChange={(value) => {
                  setRole(value)
                  setMaternityCase(value === 'father' ? 'takeover' : 'standard')
                  setCoverageOverride(undefined)
                }}>
                  {Object.entries(documentRoles).map(([key, name]) => <SelectItem key={key} value={key}>{name}</SelectItem>)}
                </SelectField>
              )}
              {benefit === 'macierzynski' && role === 'mother' && (
                <SelectField name="document-maternity-case" title="Wariant macierzyńskiego" value={maternityCase} onChange={setMaternityCase}>
                  <SelectItem value="standard">Od porodu</SelectItem>
                  <SelectItem value="before_birth">Część przed porodem</SelectItem>
                </SelectField>
              )}
              <SelectField name="document-employment" title="Tytuł ubezpieczenia" value={employment} onChange={(value) => {
                setEmployment(value)
                setPayerSize('unknown')
              }}>
                {Object.entries(documentEmployment).map(([key, name]) => <SelectItem key={key} value={key}>{name}</SelectItem>)}
              </SelectField>
            </div>
            <fieldset className="min-w-0 rounded-md border border-border px-4 pb-4">
              <legend className="px-2 text-sm font-semibold">
                Okres ubezpieczenia i płatnik <span className="font-normal text-muted-foreground">(opcjonalnie)</span>
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField name="document-coverage" title="Kiedy przypada wnioskowany okres?" value={coverage}
                  onChange={(value) => setCoverageOverride({ benefit, value })}>
                  <SelectItem value="unknown">Do ustalenia</SelectItem>
                  <SelectItem value="active">W czasie ubezpieczenia chorobowego</SelectItem>
                  <SelectItem value="ended">Po ustaniu ubezpieczenia</SelectItem>
                </SelectField>
                <SelectField name="document-payer" title="Liczba osób u płatnika zgłoszonych do ubezpieczenia chorobowego"
                  value={payerSizeApplies ? payerSize : 'not_applicable'} disabled={!payerSizeApplies}
                  onChange={(value) => {
                    if (value !== 'not_applicable') setPayerSize(value)
                  }}>
                  {payerSizeApplies ? (
                    <>
                      <SelectItem value="unknown">Nie wiem</SelectItem>
                      <SelectItem value="up_to_20">Do 20 osób</SelectItem>
                      <SelectItem value="over_20">Powyżej 20 osób</SelectItem>
                    </>
                  ) : <SelectItem value="not_applicable">Nie dotyczy</SelectItem>}
                </SelectField>
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-2">
              {onBenefitChange && <Button type="button" variant="outline" onClick={() => goToStep('benefit')}>Wstecz</Button>}
              <Button type="button" className="h-auto min-h-10 whitespace-normal" onClick={() => goToStep('documents')}>
                Pokaż dokumenty <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        )}

        {step === 'documents' && (
          <CardContent className="space-y-5 text-sm">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{benefitList[benefit].name}</h3>
              <a className={cn(buttonVariants(), 'h-auto min-h-10 whitespace-normal')}
                href={guide.form.url} target="_blank" rel="noreferrer">
                Otwórz formularz {guide.form.label} na stronie ZUS <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <div className="space-y-2 rounded-md bg-secondary p-4">
              <h4 className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary" aria-hidden="true" /> Gdzie złożyć</h4>
              {route.addressee && <p className="font-medium">{route.addressee}</p>}
              <p>{route.description}</p>
              {guide.leave && <p>Wniosek o {guide.leave.title} złóż u pracodawcy, w postaci papierowej lub elektronicznej.</p>}
              {route.showEzus && <a className="font-medium text-primary underline underline-offset-2" href={ezus}>Zaloguj się do eZUS</a>}
            </div>
            <Accordion type="single" collapsible className="rounded-md border-2 border-primary/40">
              <AccordionItem value="attachments" className="border-primary/35">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><FileText className="size-4 shrink-0 text-primary" aria-hidden="true" /> Dokumenty do przygotowania</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <ul className="list-disc space-y-1 pl-5">{guide.documents.map((document) => <li key={document}>{document}</li>)}</ul>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <a className="text-primary underline underline-offset-2" href={guide.officialGuide.url}>{guide.officialGuide.label}</a>
                    {guide.leave && <a className="text-primary underline underline-offset-2" href={leaveRegulation.url}>{leaveRegulation.label}</a>}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="deadlines" className="border-primary/35">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" /> Terminy złożenia</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <ul className="list-disc space-y-1 pl-5">{guide.deadlines.map((deadline) => <li key={deadline}>{deadline}</li>)}</ul>
                  {scenario && <DateHints benefit={benefit} options={options} context={scenario} />}
                </AccordionContent>
              </AccordionItem>
              {showPayerOptions && payerSizeApplies && (
                <AccordionItem value="payer" className="border-primary/35">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2"><Building2 className="size-4 shrink-0 text-primary" aria-hidden="true" /> Jak ustalić płatnika?</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>Sprawdź liczbę zgłoszonych na 30 listopada poprzedniego roku, a gdy tego dnia płatnik nikogo nie zgłaszał, w pierwszym miesiącu zgłoszeń. ZUS kontynuuje rozpoczętą wypłatę przez przełom roku. Szczególne tytuły mogą oznaczać wypłatę przez ZUS.</p>
                    <a className="inline-block text-primary underline underline-offset-2" href={payerSource}>Zasady ustalania płatnika w ZUS</a>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
            <div className="flex flex-wrap gap-2">
              {showPayerOptions && <Button type="button" variant="outline" onClick={() => goToStep('situation')}>Zmień dane</Button>}
              {onBenefitChange && <Button type="button" variant="outline" onClick={() => goToStep('benefit')}>Zmień świadczenie</Button>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t pt-4">
              {guide.leave && (
                <Button type="button" variant="link" className="h-auto p-0 whitespace-normal" aria-expanded={mode === 'leave'}
                  onClick={(event) => toggleDraft('leave', event.currentTarget)}>
                  Przygotuj szkic wniosku urlopowego
                </Button>
              )}
              <Button type="button" variant="link" className="h-auto p-0 whitespace-normal" aria-expanded={mode === 'benefit'}
                onClick={(event) => toggleDraft('benefit', event.currentTarget)}>
                Pomoc w wypełnieniu formularza ZUS
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {step === 'documents' && mode && (
        <Card>
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
            <h3 ref={draftHeading} tabIndex={-1} className="scroll-mt-24 text-xl font-semibold focus:outline-none">
              {useLeave ? 'Szkic wniosku urlopowego' : 'Dane do formularza ' + guide.form.label}
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={closeDraft}>Zamknij szkic</Button>
          </CardHeader>
          <CardContent>
            <ApplicationDraft key={mode} benefit={benefit} guide={guide} options={options} mode={useLeave ? 'leave' : 'benefit'}
              addressee={useLeave ? '' : route.addressee} period={period} rateAvailable={rateAvailable} />
          </CardContent>
        </Card>
      )}
    </section>
  )
}
