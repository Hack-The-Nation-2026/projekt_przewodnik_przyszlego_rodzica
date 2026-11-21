import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Check, ExternalLink, FileCheck2, Loader2, Plug, ShieldCheck, Unplug } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InfoHint } from '@/components/ui/info-hint'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/app-store'
import type {
  BirthCertificateOrder,
  EzlaCertificate,
  PueSession,
  ZusLink,
  ZusProfile,
} from '@/types/api'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  useGrouping: 'always',
})
const shortDate = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeZone: 'UTC' })
const clock = new Intl.DateTimeFormat('pl-PL', { timeStyle: 'short' })

function day(value: string | null | undefined) {
  if (!value) return 'brak'
  return shortDate.format(new Date(value))
}

function money(grosze: number) {
  return currency.format(grosze / 100)
}

/** Przełącznik dwóch wariantów symulacji, np. z ubezpieczeniem i bez. */
function Toggle({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: boolean; label: string }[]
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.label}
          type="button"
          size="sm"
          variant={option.value === value ? 'default' : 'outline'}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy">{children}</dd>
    </div>
  )
}

function InsuranceSection({
  profile,
  insured,
  onInsuredChange,
  withDebt,
  onWithDebtChange,
  basis,
  onBasisChange,
  loading,
}: {
  profile: ZusProfile | undefined
  insured: boolean
  onInsuredChange: (value: boolean) => void
  withDebt: boolean
  onWithDebtChange: (value: boolean) => void
  basis: string
  onBasisChange: (value: string) => void
  loading: boolean
}) {
  return (
    <Card aria-busy={loading}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Ubezpieczenie i składki</CardTitle>
          {profile && (
            <Badge
              className={cn(
                'text-white',
                profile.insurance.insured ? 'bg-primary' : 'bg-red-600',
              )}
            >
              {profile.insurance.insured ? 'Ubezpieczona' : 'Bez ubezpieczenia'}
            </Badge>
          )}
        </div>
        <CardDescription>
          To samo, co ZUS widzi na Twoim koncie na dzień {day(profile?.as_of)}. Wybierz wariant
          i sprawdź, co się zmienia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Stan ubezpieczenia</p>
            <Toggle
              label="Stan ubezpieczenia"
              value={insured}
              onChange={onInsuredChange}
              options={[
                { value: true, label: 'Ubezpieczona' },
                { value: false, label: 'Bez ubezpieczenia' },
              ]}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Zaległości ze składek</p>
            <Toggle
              label="Zaległości ze składek"
              value={withDebt}
              options={[
                { value: false, label: 'Brak zaległości' },
                { value: true, label: 'Jest zaległość' },
              ]}
              onChange={onWithDebtChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zus-basis">Podstawa wymiaru w zł, wpisana ręcznie</Label>
          <Input
            id="zus-basis"
            inputMode="decimal"
            value={basis}
            onChange={(event) => onBasisChange(event.target.value)}
            className="max-w-48"
          />
          <p className="text-xs text-muted-foreground">
            Z niej liczymy składki i podstawę zasiłku. Nic nie jest wysyłane do ZUS.
          </p>
        </div>

        {profile ? (
          <div className="space-y-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Row label="Płatnik składek">{profile.insurance.payer}</Row>
              <Row label="Kod tytułu ubezpieczenia">
                <span className="inline-flex items-center gap-1.5">
                  {profile.insurance.title_code}
                  <InfoHint label="Kod tytułu ubezpieczenia">
                    Czterocyfrowy kod mówi, z jakiego powodu jesteś ubezpieczona. 0110 to umowa
                    o pracę.
                  </InfoHint>
                </span>
              </Row>
              <Row label="Podstawa ubezpieczenia">{profile.insurance.title_name}</Row>
              <Row label="Objęcie ubezpieczeniem">{day(profile.insurance.covered_since)}</Row>
              <Row label="Ostatnia składka">{day(profile.insurance.last_contribution)}</Row>
            </dl>
            <p className="text-sm">{profile.insurance.note}</p>

            <div className="border-t pt-5">
              <h3 className="flex items-center gap-1.5 text-base font-semibold">
                Zadłużenie na dzień {day(profile.debt.as_of)}
                <InfoHint label="Zadłużenie ze składek">
                  Stan z konta płatnika. Zasiłek wypłaca ZUS, ale zaległe składki nadal trzeba
                  uregulować.
                </InfoHint>
              </h3>
              {profile.debt.has_debt ? (
                <div className="mt-3 space-y-3">
                  <ul className="divide-y rounded-md border">
                    {profile.debt.items.map((item) => (
                      <li
                        key={item.period + item.title}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
                      >
                        <span>
                          {item.period}, {item.title}
                        </span>
                        <span className="font-semibold">{money(item.amount_grosze)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Razem</span>
                    <strong className="text-base">{money(profile.debt.total_grosze)}</strong>
                  </p>
                </div>
              ) : (
                <p className="mt-2 flex items-center gap-2 text-sm">
                  <Check className="size-4 text-primary" aria-hidden="true" />
                  Brak zaległości na ten dzień.
                </p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">{profile.debt.effect}</p>
            </div>
          </div>
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            {loading ? 'Pobieramy dane z symulowanego ZUS…' : 'Nie udało się pobrać danych.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function EzlaSection({ certificates, loading }: { certificates: EzlaCertificate[] | undefined; loading: boolean }) {
  return (
    <Card aria-busy={loading}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Zaświadczenia e-ZLA</CardTitle>
          {certificates && <Badge variant="outline">{certificates.length}</Badge>}
        </div>
        <CardDescription>
          Podgląd tego, co lekarz wystawił i przekazał do ZUS. Zwolnienie trafia tu od razu,
          bez noszenia papieru do pracodawcy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!certificates ? (
          <p role="status" className="text-sm text-muted-foreground">
            {loading ? 'Wczytujemy zaświadczenia…' : 'Nie udało się pobrać zaświadczeń.'}
          </p>
        ) : certificates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Brak zaświadczeń, bo nie ma ubezpieczenia chorobowego.
          </p>
        ) : (
          <ul className="space-y-3">
            {certificates.map((item) => (
              <li key={item.document_id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {day(item.period_from)} do {day(item.period_to)}, {item.days} dni
                    </p>
                  </div>
                  <Badge variant={item.status.startsWith('Wystawione i') ? 'default' : 'gold'}>
                    {item.status}
                  </Badge>
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-3 sm:block">
                    <dt className="text-muted-foreground">Numer dokumentu</dt>
                    <dd>{item.document_id}</dd>
                  </div>
                  <div className="flex justify-between gap-3 sm:block">
                    <dt className="text-muted-foreground">Lekarz</dt>
                    <dd>{item.doctor}</dd>
                  </div>
                  <div className="flex justify-between gap-3 sm:block">
                    <dt className="text-muted-foreground">Kod choroby</dt>
                    <dd>{item.diagnosis_code}</dd>
                  </div>
                  <div className="flex justify-between gap-3 sm:block">
                    <dt className="text-muted-foreground">Podstawa zasiłku</dt>
                    <dd>{money(item.basis_grosze)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function PueSection({ insured }: { insured: boolean }) {
  const citizen = useAppStore((state) => state.citizen)
  const [session, setSession] = useState<PueSession | null>(null)
  const pue = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<PueSession>('/zus/pue', {
        insured,
        person: citizen
          ? `${citizen.first_name} ${citizen.last_name}`
          : insured
            ? 'Osoba ubezpieczona'
            : 'Osoba bez ubezpieczenia',
      })
      return data
    },
    onSuccess: setSession,
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Konto PUE/eZUS</CardTitle>
          <InfoHint label="PUE/eZUS">
            Platforma Usług Elektronicznych to Twoje konto w ZUS. Tu logujemy się do niej tylko
            na niby.
          </InfoHint>
        </div>
        <CardDescription>
          Wgląd w okresy ubezpieczenia i dokumenty, które ZUS ma na koncie. W prawdziwej sprawie
          logujesz się przez login.gov.pl.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!session ? (
          <Button
            type="button"
            size="lg"
            onClick={() => pue.mutate()}
            disabled={pue.isPending}
            className="whitespace-normal"
          >
            {pue.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plug aria-hidden="true" />}
            {pue.isPending ? 'Łączymy z PUE/eZUS…' : 'Połącz z PUE/eZUS'}
          </Button>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-primary/10 px-4 py-3 text-sm">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              <span>
                Połączono o {clock.format(new Date(session.connected_at))}. Sesja wygasa po{' '}
                {session.valid_minutes} minutach.
              </span>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Row label="Konto">{session.person}</Row>
              <Row label="Dokumenty na koncie">{session.document_count}</Row>
              <Row label="Ostatni dokument">{day(session.last_document)}</Row>
            </dl>
            {session.periods.length > 0 ? (
              <ul className="space-y-2">
                {session.periods.map((period) => (
                  <li
                    key={period.from_date + period.payer}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border px-4 py-2 text-sm"
                  >
                    <span>
                      {day(period.from_date)} do {period.to_date ? day(period.to_date) : 'dziś'}
                    </span>
                    <span className="text-muted-foreground">
                      {period.payer}, {period.title_name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Brak okresów ubezpieczenia na koncie.</p>
            )}
            <p className="text-xs text-muted-foreground">{session.note}</p>
            <Button type="button" variant="outline" onClick={() => setSession(null)}>
              <Unplug aria-hidden="true" />
              Rozłącz
            </Button>
          </>
        )}
        {pue.isError && (
          <p role="alert" className="text-sm text-destructive">
            Nie udało się połączyć z symulowanym PUE. Spróbuj ponownie.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

const certificateSchema = z.object({
  childName: z.string().trim().min(1, 'Podaj imię i nazwisko dziecka.'),
  office: z.string().trim().min(1, 'Podaj urząd.'),
  copyType: z.enum(['skrocony', 'zupelny']),
})

type CertificateValues = z.infer<typeof certificateSchema>

function BirthCertificateSection() {
  const [order, setOrder] = useState<BirthCertificateOrder | null>(null)
  const form = useForm<CertificateValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: { childName: '', office: 'Urząd stanu cywilnego', copyType: 'skrocony' },
  })
  const copyType = useWatch({ control: form.control, name: 'copyType' })
  const submit = useMutation({
    mutationFn: async (values: CertificateValues) => {
      const { data } = await api.post<BirthCertificateOrder>('/zus/birth-certificate', {
        copy_type: values.copyType,
        office: values.office,
        child_name: values.childName,
      })
      return data
    },
    onSuccess: setOrder,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Odpis aktu urodzenia</CardTitle>
        <CardDescription>
          Wniosek o odpis skrócony albo zupełny. Odpis zupełny przydaje się, gdy urząd prosi
          o pełne dane rodziców.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {order ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 font-semibold">
              <FileCheck2 className="size-4 text-primary" aria-hidden="true" />
              Wniosek przyjęty
            </p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Row label="Numer wniosku">{order.number}</Row>
              <Row label="Rodzaj odpisu">
                {order.copy_type === 'zupelny' ? 'zupełny' : 'skrócony'}
              </Row>
              <Row label="Dziecko">{order.child_name}</Row>
              <Row label="Odbiór od">{day(order.ready_from)}</Row>
            </dl>
            <p className="text-sm text-muted-foreground">{order.note}</p>
            <Button type="button" variant="outline" onClick={() => setOrder(null)}>
              Złóż kolejny wniosek
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit((values) => submit.mutate(values))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="certificate-child">Imię i nazwisko dziecka</Label>
                <Input id="certificate-child" {...form.register('childName')} />
                {form.formState.errors.childName && (
                  <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.childName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificate-copy">Rodzaj odpisu</Label>
                <Select
                  value={copyType}
                  onValueChange={(value) => form.setValue('copyType', value as CertificateValues['copyType'])}
                >
                  <SelectTrigger id="certificate-copy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skrocony">Skrócony</SelectItem>
                    <SelectItem value="zupelny">Zupełny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate-office">Urząd</Label>
              <Input id="certificate-office" {...form.register('office')} />
              {form.formState.errors.office && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.office.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Złóż wniosek
            </Button>
            {submit.isError && (
              <p role="alert" className="text-sm text-destructive">
                Nie udało się złożyć wniosku w symulacji. Spróbuj ponownie.
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function LinksSection({ links }: { links: ZusLink[] | undefined }) {
  if (!links?.length) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>Przekierowania</CardTitle>
        <CardDescription>Oficjalne miejsca, w których załatwisz sprawę naprawdę.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 font-medium text-primary underline-offset-4 hover:underline"
              >
                <ExternalLink className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {link.label}
                  <span className="block text-sm font-normal text-muted-foreground">
                    {link.description}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/** Ekran symulacji ZUS: ubezpieczenie, składki, e-ZLA, PUE i akta urodzenia. */
export function ZusPage() {
  const [insured, setInsured] = useState(true)
  const [withDebt, setWithDebt] = useState(false)
  const [basisInput, setBasisInput] = useState('8000')
  const [basisGrosze, setBasisGrosze] = useState(800_000)

  // Pole przyjmuje kwotę po polsku: przecinek i spacje z grupowaniem tysięcy.
  function applyBasis(value: string) {
    setBasisInput(value)
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'))
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100_000) {
      setBasisGrosze(Math.round(parsed * 100))
    }
  }

  const query = { insured, with_debt: withDebt, monthly_basis_grosze: basisGrosze }
  const profile = useQuery({
    queryKey: ['zus-profile', insured, withDebt, basisGrosze],
    queryFn: async () => (await api.post<ZusProfile>('/zus/profile', query)).data,
  })
  const ezla = useQuery({
    queryKey: ['zus-ezla', insured, basisGrosze],
    queryFn: async () =>
      (await api.post<EzlaCertificate[]>('/zus/ezla', query)).data,
  })
  const links = useQuery({
    queryKey: ['zus-links'],
    queryFn: async () => (await api.get<ZusLink[]>('/zus/links')).data,
    staleTime: Infinity,
  })

  return (
    <PageContainer className="py-12 sm:py-16">
      <PageHeading
        title="Symulacja ZUS"
        description="Dane, które ZUS widzi na Twoim koncie, i wnioski, które można złożyć bez wizyty w urzędzie. Wszystko jest udawane, ale kroki są prawdziwe."
        crumb="Symulacja ZUS"
        backTo="/wejscie"
        backLabel="Wróć do wejścia"
      />

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-gold/60 bg-gold/10 p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold-foreground" aria-hidden="true" />
        <p>
          Symulacja. Nie łączymy się z systemami ZUS ani nie wysyłamy żadnych wniosków. Dane
          powstają na serwerze tej aplikacji, a Ty możesz zmieniać warianty i patrzeć, co się
          dzieje.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        <InsuranceSection
          profile={profile.data}
          insured={insured}
          onInsuredChange={setInsured}
          withDebt={withDebt}
          onWithDebtChange={setWithDebt}
          basis={basisInput}
          onBasisChange={applyBasis}
          loading={profile.isFetching}
        />
        <EzlaSection certificates={ezla.data} loading={ezla.isFetching} />
        <PueSection insured={insured} />
        <BirthCertificateSection />
        <LinksSection links={links.data} />
      </div>
    </PageContainer>
  )
}