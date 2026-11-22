import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, FileText, FileUp, ScanLine, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { benefitList } from '@/lib/benefit-interview'
import { useRecognizeSample } from '@/hooks/use-samples'
import { useSimulateCase } from '@/hooks/use-cases'
import { sha256Hex } from '@/lib/sha256'
import { cn } from '@/lib/utils'
import type { CaseResult, ZusOutcome, ZusSample } from '@/types/api'

const familyBenefits = ['macierzynski', 'uzupelniajacy', 'rodzicielski', 'ojcowski'] as const
type FamilyBenefit = (typeof familyBenefits)[number]

const outcomeCopy: Record<ZusOutcome, { label: string; tone: string }> = {
  granted: { label: 'Przyznano prawo', tone: 'bg-primary text-primary-foreground' },
  denied: { label: 'Odmowa', tone: 'bg-red-600 text-white' },
  partially_granted: { label: 'Przyznano częściowo', tone: 'bg-blue-600 text-white' },
  unknown: { label: 'W dokumencie nie ma decyzji', tone: 'bg-neutral-200 text-neutral-800' },
}

const tagLabels: Record<string, string> = {
  martwe_urodzenie: 'martwe urodzenie',
  wczesniak: 'wcześniak',
  bliznieta: 'bliźnięta',
  zaswiadczenie_za_zyciem: 'zaświadczenie za życiem',
  przyjecie_na_wychowanie: 'przyjęcie dziecka na wychowanie',
  przysposobienie: 'przysposobienie',
  rodzina_zastepcza: 'rodzina zastępcza',
  osoba_wspolpracujaca: 'osoba współpracująca',
  zadluzenie: 'zaległości składkowe',
  umowa_zlecenie: 'umowa zlecenie',
  likwidacja_pracodawcy: 'likwidacja pracodawcy',
  rezygnacja_z_urlopu: 'rezygnacja z urlopu',
  urlop_ojcowski: 'urlop ojcowski',
  dziewiec_tygodni: 'dziewięć tygodni',
  przed_terminem: 'przed przewidywanym porodem',
  po_ustaniu_ubezpieczenia: 'po ustaniu ubezpieczenia',
  brak_ubezpieczenia: 'brak ubezpieczenia',
  umowa_pozorna: 'umowa dla pozoru',
  laczenie_z_praca: 'łączenie urlopu z pracą',
  podwyzszenie_swiadczenia: 'podwyższenie do świadczenia rodzicielskiego',
  zatrudnienie_do_dnia_porodu: 'zatrudnienie do dnia porodu',
}

const simulationEmployment = {
  employee: 'employee',
  contractor: 'contractor',
  self_employed: 'self_employed',
} as const

type SampleEmployment = keyof typeof simulationEmployment

function benefitName(code: string) {
  return benefitList[code as FamilyBenefit]?.name ?? code.replaceAll('_', ' ')
}

function tagLabel(tag: string) {
  return tagLabels[tag] ?? tag.replaceAll('_', ' ')
}

function OutcomeBadge({ outcome }: { outcome: ZusOutcome }) {
  const { label, tone } = outcomeCopy[outcome]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium', tone)}>
      <BadgeCheck className="size-4" aria-hidden />
      {label}
    </span>
  )
}

/** Rozpoznanie mówi, co to za sprawa, ale kwot nie zgaduje. O nie prosi w formularzu. */
function SampleSimulation({ sample, onResult }: { sample: ZusSample; onResult: (result: CaseResult) => void }) {
  const simulate = useSimulateCase()
  const claims = sample.benefits.filter((code): code is FamilyBenefit =>
    (familyBenefits as readonly string[]).includes(code),
  )
  const selected = claims.length ? claims : (['macierzynski'] as FamilyBenefit[])
  /*
   * Liczymy świadczenie główne, bo tylko o nim wiemy, czy sprawa skończyła się
   * przyznaniem. Pozostałe wymagają danych, których sam dokument nie podaje
   * (choćby pobytu w szpitalu przy wcześniaku), więc byłyby zgadywaniem.
   */
  const primary = selected[0]
  const rest = selected.slice(1)
  const [eventDate, setEventDate] = useState('')
  const [basis, setBasis] = useState('6000')
  const [insuredDays, setInsuredDays] = useState('365')
  const [employment, setEmployment] = useState<SampleEmployment>(
    sample.applicant.employment === 'none' ? 'employee' : sample.applicant.employment,
  )
  const [insured, setInsured] = useState<'yes' | 'no' | 'unknown'>(
    sample.applicant.insured === false ? 'no' : 'yes',
  )
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    const event = sample.tags.includes('rodzina_zastepcza')
      ? 'foster_care'
      : sample.tags.includes('przyjecie_na_wychowanie')
        ? 'adoption'
        : 'birth'
    const basisGrosze = Math.round(Number(basis.replace(',', '.')) * 100)
    const outcome = sample.outcome
    simulate.mutate(
      {
        id: sample.id,
        title: sample.title,
        facts: sample.facts,
        applicant: {
          label: sample.applicant.label,
          employment,
          insured: insured === 'unknown' ? null : insured === 'yes',
          insurance_kind: null,
          insured_days: Number(insuredDays) > 0 ? Math.round(Number(insuredDays)) : null,
          waiting_period_exempt: false,
          contribution_arrears: null,
          employment_ended_in_pregnancy: false,
          employment_end_reason: null,
        },
        request: {
          family: {
            event,
            event_date: eventDate,
            children: [
              {
                birth_date: eventDate,
                stillborn: sample.tags.includes('martwe_urodzenie'),
              },
            ],
            first_parent: {
              employment: simulationEmployment[employment],
              sickness_insured: insured !== 'no',
              monthly_basis_grosze: Number.isFinite(basisGrosze) ? basisGrosze : null,
            },
            za_zyciem: sample.tags.includes('zaswiadczenie_za_zyciem'),
            claims: [{ benefit: primary }],
          },
        },
        expected:
          outcome === 'unknown'
            ? []
            : [{ benefit: primary, person: 'first_parent', status: outcome, gross_grosze: null }],
      },
      {
        onSuccess: onResult,
        onError: () => setError('Kalkulator odrzucił te dane. Sprawdź datę i podstawę wymiaru.'),
      },
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <p className="font-semibold">Uzupełnij dane, których potrzebuje wyliczenie</p>
        <p className="text-sm text-muted-foreground">
          Rozpoznanie mówi, jakiej sprawy dotyczy dokument. Datę i podstawę wymiaru wpisz z pisma,
          żeby wyliczenie ruszyło na Twoich danych.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sample-event-date">Data porodu lub przyjęcia dziecka</Label>
          <Input
            id="sample-event-date"
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sample-basis">Podstawa wymiaru (zł)</Label>
          <Input
            id="sample-basis"
            inputMode="decimal"
            value={basis}
            onChange={(event) => setBasis(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sample-employment">Tytuł ubezpieczenia</Label>
          <Select value={employment} onValueChange={(value) => setEmployment(value as typeof employment)}>
            <SelectTrigger id="sample-employment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">umowa o pracę</SelectItem>
              <SelectItem value="contractor">umowa zlecenie</SelectItem>
              <SelectItem value="self_employed">działalność gospodarcza</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sample-insured">Ubezpieczenie chorobowe</Label>
          <Select value={insured} onValueChange={(value) => setInsured(value as typeof insured)}>
            <SelectTrigger id="sample-insured">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">podlega ubezpieczeniu</SelectItem>
              <SelectItem value="no">nie podlega</SelectItem>
              <SelectItem value="unknown">nie wiem</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sample-insured-days">Okres ubezpieczenia (dni)</Label>
          <Input
            id="sample-insured-days"
            inputMode="numeric"
            value={insuredDays}
            onChange={(event) => setInsuredDays(event.target.value)}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Liczone świadczenie: {benefitName(primary)}
        {rest.length > 0 && `. W dokumencie są też: ${rest.map(benefitName).join(', ')}.`}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={submit} disabled={!eventDate || simulate.isPending}>
          {simulate.isPending ? 'Liczę…' : 'Sprawdź ubezpieczenie i policz'}
        </Button>
        {!eventDate && <span className="text-sm text-muted-foreground">Podaj datę, żeby policzyć.</span>}
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}
    </div>
  )
}

function SampleCard({ sample, onResult }: { sample: ZusSample; onResult: (result: CaseResult) => void }) {
  return (
    <Card className="border-primary/40">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{sample.title}</CardTitle>
            <CardDescription className="mt-1">
              {sample.file_name}, {sample.pages} stron
            </CardDescription>
          </div>
          <OutcomeBadge outcome={sample.outcome} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{sample.facts}</p>
        {sample.evidence && (
          <blockquote className="border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">
            Zapis w dokumencie: „{sample.evidence}”
          </blockquote>
        )}
        {sample.forms.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Formularze z dokumentu</p>
            <div className="flex flex-wrap gap-2">
              {sample.forms.map((form) => (
                <Badge key={form} variant="outline">
                  <FileText className="size-3.5" aria-hidden />
                  {form}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {sample.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sample.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tagLabel(tag)}
              </Badge>
            ))}
          </div>
        )}
        {sample.duplicate_of && (
          <p className="text-sm text-muted-foreground">
            Ten dokument występuje w kilku wersjach, więc liczymy go raz.
          </p>
        )}
        {sample.benefits.some((code) => (familyBenefits as readonly string[]).includes(code)) ? (
          <SampleSimulation sample={sample} onResult={onResult} />
        ) : (
          <div className="space-y-2 rounded-lg border border-border p-4">
            <p className="font-semibold">Ten dokument dotyczy zasiłku chorobowego</p>
            <p className="text-sm text-muted-foreground">
              Dokument nie zawiera wniosku o urlop, więc nie ma czego rozdzielać. Niezdolność do
              pracy policzysz w kalkulatorze, podając okres zwolnienia.
            </p>
            <Link
              to="/kalkulator"
              className={cn(buttonVariants({ variant: 'outline' }), 'h-auto min-h-10 whitespace-normal')}
            >
              Przejdź do kalkulatora
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Rozpoznanie dokumentu: wgranie PDF-a z ZUS. Odcisk SHA-256 liczy przeglądarka,
 * więc do backendu idzie tylko skrót, a sam dokument zostaje na urządzeniu.
 */
export function SampleRecognition({ onResult }: { onResult: (result: CaseResult) => void }) {
  const recognize = useRecognizeSample()
  const input = useRef<HTMLInputElement>(null)
  const [sample, setSample] = useState<ZusSample | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setMessage(null)
    setSample(null)
    try {
      const digest = await sha256Hex(file)
      recognize.mutate(
        { sha256: digest, file_name: file.name },
        {
          onSuccess: (data) => {
            setSample(data.sample)
            setMessage(data.hint)
          },
          onError: () => setError('Nie udało się sprawdzić pliku. Sprawdź, czy backend działa.'),
        },
      )
    } catch (digestError) {
      setError(digestError instanceof Error ? digestError.message : 'Nie udało się policzyć odcisku pliku.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="size-5" aria-hidden />
          Wgraj dokument z ZUS
        </CardTitle>
        <CardDescription>
          Wgraj PDF z ZUS albo z PUE. Odcisk pliku liczymy w przeglądarce, więc dokument nie
          opuszcza urządzenia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button type="button" variant="outline" onClick={() => input.current?.click()}>
          <FileUp className="size-4" aria-hidden />
          Wgraj PDF
        </Button>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-label="PDF z ZUS"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
            event.target.value = ''
          }}
        />
        {recognize.isPending && <p className="text-muted-foreground">Rozpoznaję dokument…</p>}
        {message && (
          <p
            className={cn(
              'rounded-md p-3 text-sm',
              sample ? 'bg-secondary' : 'border border-amber-300 bg-amber-50 text-amber-950',
            )}
          >
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">
            <X className="mr-1 inline size-4 align-[-2px]" aria-hidden />
            {error}
          </p>
        )}
      </CardContent>
      {sample && (
        <CardContent>
          <SampleCard sample={sample} onResult={onResult} />
        </CardContent>
      )}
    </Card>
  )
}
