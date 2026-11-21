import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUpRight, CalendarDays, FileText, MapPin } from 'lucide-react'
import { ApplicationDraft, DocumentField } from '@/components/application-draft'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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

const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
const benefits = Object.keys(benefitList) as BenefitCode[]
const ezus = 'https://www.zus.pl/ezus'

function SelectField<T extends string>({ name, title, value, onChange, children }: {
  name: string
  title: string
  value: T
  onChange: (value: T) => void
  children: ReactNode
}) {
  return (
    <DocumentField name={name} title={title}>
      <select className={selectClass} id={name} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {children}
      </select>
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
  onBenefitChange: (benefit: BenefitCode) => void
  context?: DocumentContext
  onClose?: () => void
}) {
  const checklistHeading = useRef<HTMLHeadingElement>(null)
  const draftDetails = useRef<HTMLDetailsElement>(null)
  const draftToggle = useRef<HTMLElement>(null)
  const [role, setRole] = useState<Role>(context?.role ?? 'mother')
  const [employment, setEmployment] = useState<Employment>(context?.employment ?? 'unknown')
  const [payerSize, setPayerSize] = useState<PayerSize>('unknown')
  const [coverageOverride, setCoverageOverride] = useState<{ benefit: BenefitCode; value: Coverage }>()
  const [maternityCase, setMaternityCase] = useState<MaternityCase>(context?.role === 'father' ? 'takeover' : 'standard')
  const [mode, setMode] = useState<'benefit' | 'leave'>('benefit')
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

  function showChecklist() {
    checklistHeading.current?.focus({ preventScroll: true })
    checklistHeading.current?.scrollIntoView({ block: 'start' })
  }

  function openDraft() {
    if (draftDetails.current) draftDetails.current.open = true
    draftToggle.current?.focus({ preventScroll: true })
    draftToggle.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <section className="space-y-4" aria-labelledby="documents-title">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <h2 id="documents-title" className="text-2xl font-semibold">Co złożyć i gdzie</h2>
          {onClose && <Button type="button" variant="outline" size="sm" onClick={onClose}>Zamknij dokumenty</Button>}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <SelectField name="document-benefit" title="Świadczenie" value={benefit} onChange={(value) => {
            onBenefitChange(value)
            setCoverageOverride(undefined)
            setMode('benefit')
          }}>
            {benefits.map((key) => <option key={key} value={key}>{benefitList[key].name}</option>)}
          </SelectField>
          {isFamilyBenefit(benefit) && (
            <SelectField name="document-role" title="Sytuacja rodzinna" value={role} onChange={(value) => {
              setRole(value)
              setMaternityCase(value === 'father' ? 'takeover' : 'standard')
              setCoverageOverride(undefined)
            }}>
              {Object.entries(documentRoles).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
            </SelectField>
          )}
          {benefit === 'macierzynski' && (role === 'mother' || role === 'father') && (
            <SelectField name="document-maternity-case" title="Wariant macierzyńskiego" value={maternityCase} onChange={setMaternityCase}>
              {role === 'mother' && <option value="standard">Od porodu</option>}
              {role === 'mother' && <option value="before_birth">Część przed porodem</option>}
              {role === 'father' && <option value="takeover">Przejęcie po rezygnacji matki</option>}
            </SelectField>
          )}
          {showPayerOptions && (
            <SelectField name="document-employment" title="Tytuł ubezpieczenia" value={employment} onChange={(value) => {
              setEmployment(value)
              setPayerSize('unknown')
            }}>
              {Object.entries(documentEmployment).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
            </SelectField>
          )}
          {showPayerOptions && (
            <SelectField name="document-coverage" title="Kiedy przypada wnioskowany okres?" value={coverage}
              onChange={(value) => setCoverageOverride({ benefit, value })}>
              <option value="unknown">Do ustalenia</option>
              <option value="active">W czasie ubezpieczenia chorobowego</option>
              <option value="ended">Po ustaniu ubezpieczenia</option>
            </SelectField>
          )}
          {showPayerOptions && employment !== 'self_employed' && coverage !== 'ended' && (
            <SelectField name="document-payer" title="Liczba osób u płatnika zgłoszonych do ubezpieczenia chorobowego" value={payerSize} onChange={setPayerSize}>
              <option value="unknown">Nie wiem</option>
              <option value="up_to_20">Do 20 osób</option>
              <option value="over_20">Powyżej 20 osób</option>
            </SelectField>
          )}
          <div className="space-y-3 border-t pt-4 sm:col-span-2">
            <p className="text-sm" role="status">
              <strong>Adresat wniosku o świadczenie</strong>
              <span className="block">{route.addressee || 'Do potwierdzenia u płatnika składek'}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <a className={cn(buttonVariants(), 'h-auto min-h-10 whitespace-normal')}
                href={guide.form.url} target="_blank" rel="noreferrer">
                Otwórz formularz {guide.form.label} na stronie ZUS <ArrowUpRight aria-hidden="true" />
              </a>
              <Button type="button" variant="outline" className="h-auto min-h-10 whitespace-normal" onClick={showChecklist}>
                Pokaż dokumenty i terminy <ArrowDown aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 ref={checklistHeading} tabIndex={-1} className="scroll-mt-24 text-xl font-semibold focus:outline-none">
            {benefitList[benefit].name}
          </h3>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary" aria-hidden="true" /> Gdzie złożyć</h4>
            <p>{route.description}</p>
            {guide.leave && <p>Wniosek o {guide.leave.title} złóż u pracodawcy, w postaci papierowej lub elektronicznej.</p>}
            {route.showEzus && <a className="font-medium text-primary underline underline-offset-2" href={ezus}>Przejdź do eZUS</a>}
            {showPayerOptions && employment !== 'self_employed' && coverage !== 'ended' && (
              <details>
                <summary className="w-fit cursor-pointer font-medium text-primary">Jak ustalić liczbę i płatnika?</summary>
                <p className="mt-1">Sprawdź liczbę zgłoszonych na 30 listopada poprzedniego roku, a gdy tego dnia płatnik nikogo nie zgłaszał, w pierwszym miesiącu zgłoszeń. ZUS kontynuuje rozpoczętą wypłatę przez przełom roku. Szczególne tytuły mogą oznaczać wypłatę przez ZUS.</p>
                <a className="mt-1 inline-block text-primary underline underline-offset-2" href={payerSource}>Zasady ustalania płatnika w ZUS</a>
              </details>
            )}
          </div>
          <div className="space-y-2 border-t pt-4">
            <h4 className="flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-primary" aria-hidden="true" /> Kiedy złożyć</h4>
            <ul className="list-disc space-y-1 pl-5">{guide.deadlines.map((deadline) => <li key={deadline}>{deadline}</li>)}</ul>
            {scenario && <DateHints benefit={benefit} options={options} context={scenario} />}
          </div>
          <div className="space-y-2 border-t pt-4">
            <h4 className="flex items-center gap-2 font-semibold"><FileText className="size-4 text-primary" aria-hidden="true" /> Co przygotować</h4>
            <ul className="list-disc space-y-1 pl-5">{guide.documents.map((document) => <li key={document}>{document}</li>)}</ul>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
              <a className="text-primary underline underline-offset-2" href={guide.officialGuide.url}>{guide.officialGuide.label}</a>
              {guide.leave && <a className="text-primary underline underline-offset-2" href={leaveRegulation.url}>{leaveRegulation.label}</a>}
            </div>
          </div>
          <Button type="button" variant="outline" className="h-auto min-h-10 whitespace-normal" onClick={openDraft}>
            Przygotuj szkic wniosku <ArrowDown aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-xl font-semibold">Przygotuj szkic</h3></CardHeader>
        <CardContent>
          <details key={benefit} ref={draftDetails} className="space-y-4">
            <summary ref={draftToggle} className="w-fit cursor-pointer scroll-mt-24 font-medium text-primary">Otwórz symulację wypełniania wniosku</summary>
            {guide.leave && (
              <SelectField name="document-mode" title="Rodzaj wniosku" value={mode} onChange={setMode}>
                <option value="benefit">Wniosek o świadczenie ({guide.form.label})</option>
                <option value="leave">Wniosek o urlop do pracodawcy</option>
              </SelectField>
            )}
            <ApplicationDraft key={[benefit, role, maternityCase, coverage, employment, useLeave ? 'leave' : 'benefit'].join('-')}
              benefit={benefit} guide={guide} options={options} mode={useLeave ? 'leave' : 'benefit'}
              addressee={useLeave ? '' : route.addressee} period={period} rateAvailable={rateAvailable} />
          </details>
        </CardContent>
      </Card>
    </section>
  )
}
