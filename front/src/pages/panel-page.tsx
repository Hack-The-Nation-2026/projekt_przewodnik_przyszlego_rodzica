import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoHint } from '@/components/ui/info-hint'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useResetSettings, useSaveSettings, useSettings } from '@/hooks/use-settings'
import type { AppSettings } from '@/types/api'

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })
const stamp = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })

const PREVIEW_BIRTH = '2026-05-04'
const PREVIEW_BASIS_GROSZE = 600_000

interface PreviewRow {
  benefit: string
  days: number | null
  gross_grosze: number | null
}

async function previewResult() {
  const { data } = await api.post<{ assessments: PreviewRow[] }>('/benefits/simulate', {
    family: {
      event_date: PREVIEW_BIRTH,
      first_parent: {
        employment: 'employee',
        sickness_insured: true,
        monthly_basis_grosze: PREVIEW_BASIS_GROSZE,
      },
      claims: [{ benefit: 'macierzynski' }, { benefit: 'rodzicielski', days: 70 }],
    },
  })
  return data.assessments
}

function NumberField({
  id,
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        {hint && <InfoHint label={label}>{hint}</InfoHint>}
      </div>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isNaN(value) ? '' : value}
          onChange={(event) => onChange(event.target.value === '' ? Number.NaN : Number(event.target.value))}
          className={cn('h-11', suffix && 'pr-10')}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-secondary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span
        className={cn(
          'mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
          checked ? 'border-primary bg-primary' : 'border-input bg-secondary',
        )}
      >
        <span
          className={cn(
            'block size-4 rounded-full bg-primary-foreground shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
      </span>
      <span className="ml-auto hidden shrink-0 text-xs font-medium text-muted-foreground sm:block">
        {checked ? 'włączona' : 'wyłączona'}
      </span>
    </button>
  )
}

export function PanelPage() {
  const { data, isPending, isError, refetch } = useSettings()
  const save = useSaveSettings()
  const reset = useResetSettings()
  const [draft, setDraft] = useState<AppSettings | null>(null)
  const [loaded, setLoaded] = useState<AppSettings | null>(null)
  const [newFeature, setNewFeature] = useState({ key: '', label: '' })

  // Zapisany zestaw wchodzi do formularza w trakcie renderu: ponowny render jest tańszy
  // niż efekt, a porównanie referencji wystarcza, bo React Query daje nowy obiekt
  // dopiero po pobraniu albo zapisie.
  if (data && data !== loaded) {
    setLoaded(data)
    setDraft(structuredClone(data))
  }

  const preview = useQuery({
    queryKey: ['settings-preview', data],
    queryFn: () => previewResult(),
    enabled: Boolean(data),
  })

  if (isPending || !draft) {
    return (
      <PageContainer className="py-12 sm:py-16">
        <PageHeading title="Panel administracyjny" />
        <p className="mt-6 flex items-center gap-2 text-muted-foreground" role="status">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Wczytujemy parametry.
        </p>
      </PageContainer>
    )
  }

  if (isError) {
    return (
      <PageContainer className="py-12 sm:py-16">
        <PageHeading title="Panel administracyjny" />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Nie udało się pobrać parametrów</CardTitle>
            <CardDescription>Sprawdź, czy backend odpowiada, i spróbuj ponownie.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => refetch()}>
              Spróbuj ponownie
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const valid =
    Object.values(draft.rates).every((rate) => Number.isFinite(rate) && rate > 0 && rate <= 100) &&
    draft.leave.maternity_weeks_by_child_count.every(
      (weeks) => Number.isInteger(weeks) && weeks >= 1 && weeks <= 104,
    ) &&
    [draft.leave.parental_weeks_single, draft.leave.parental_weeks_multiple].every(
      (weeks) => Number.isInteger(weeks) && weeks >= 1 && weeks <= 104,
    ) &&
    [draft.leave.za_zyciem_extra_weeks, draft.leave.exclusive_weeks].every(
      (weeks) => Number.isInteger(weeks) && weeks >= 0 && weeks <= 104,
    )

  const dirty = data ? JSON.stringify(draft) !== JSON.stringify(data) : false

  function updateRate(key: keyof AppSettings['rates'], value: number) {
    setDraft((current) => (current ? { ...current, rates: { ...current.rates, [key]: value } } : current))
  }

  function updateLeave<K extends keyof AppSettings['leave']>(
    key: K,
    value: AppSettings['leave'][K],
  ) {
    setDraft((current) => (current ? { ...current, leave: { ...current.leave, [key]: value } } : current))
  }

  function updateMaternityWeeks(index: number, weeks: number) {
    setDraft((current) => {
      if (!current) return current
      const next = [...current.leave.maternity_weeks_by_child_count]
      next[index] = weeks
      return { ...current, leave: { ...current.leave, maternity_weeks_by_child_count: next } }
    })
  }

  function toggleFeature(key: string, enabled: boolean) {
    setDraft((current) =>
      current
        ? {
            ...current,
            features: current.features.map((flag) => (flag.key === key ? { ...flag, enabled } : flag)),
          }
        : current,
    )
  }

  function addFeature() {
    const key = newFeature.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
    const label = newFeature.label.trim()
    if (!/^[a-z][a-z0-9_]*$/.test(key) || !label) return
    setDraft((current) =>
      current && !current.features.some((flag) => flag.key === key)
        ? {
            ...current,
            features: [...current.features, { key, label, description: '', enabled: false }],
          }
        : current,
    )
    setNewFeature({ key: '', label: '' })
  }

  function removeFeature(key: string) {
    setDraft((current) =>
      current ? { ...current, features: current.features.filter((flag) => flag.key !== key) } : current,
    )
  }

  const previewRows = preview.data ?? []
  const maternity = previewRows.find((row) => row.benefit === 'macierzynski')
  const parental = previewRows.find((row) => row.benefit === 'rodzicielski')

  return (
    <PageContainer className="py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          title="Panel administracyjny"
          description="Parametry kalkulatora i funkcje serwisu. Zapis działa od razu na wynik, bez wdrożenia nowej wersji."
        />
        <p className="text-sm text-muted-foreground">
          {data?.updated_at ? `Ostatnia zmiana: ${stamp.format(new Date(data.updated_at))}` : 'Wartości domyślne'}
        </p>
      </div>

      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Panel demonstracyjny: w produkcji wymagałby logowania i roli administratora.
      </p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stopy procentowe</CardTitle>
            <CardDescription>
              Procent podstawy wymiaru, od którego liczymy kwoty zasiłku.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <NumberField
              id="rate-maternity"
              label="Zasiłek macierzyński"
              hint="Podstawa za urlop macierzyński i uzupełniający."
              value={draft.rates.maternity}
              min={1}
              max={100}
              step={0.5}
              suffix="%"
              onChange={(value) => updateRate('maternity', value)}
            />
            <NumberField
              id="rate-averaged"
              label="Wniosek w 21 dni"
              hint="Stawka za pełny okres, gdy wniosek o urlop rodzicielski trafi do 21 dni od porodu."
              value={draft.rates.averaged}
              min={1}
              max={100}
              step={0.1}
              suffix="%"
              onChange={(value) => updateRate('averaged', value)}
            />
            <NumberField
              id="rate-parental"
              label="Urlop rodzicielski"
              hint="Stawka po 21 dniach oraz za dziewięć tygodni nieprzenoszalnych drugiego rodzica."
              value={draft.rates.parental}
              min={1}
              max={100}
              step={0.5}
              suffix="%"
              onChange={(value) => updateRate('parental', value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wymiary urlopów</CardTitle>
            <CardDescription>Maksymalny wymiar urlopów w tygodniach.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium">Zasiłek macierzyński według liczby dzieci</p>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {draft.leave.maternity_weeks_by_child_count.map((weeks, index) => (
                  <NumberField
                    key={index}
                    id={`maternity-weeks-${index}`}
                    label={index === 4 ? '5 i więcej' : index === 0 ? '1 dziecko' : `${index + 1} dzieci`}
                    value={weeks}
                    min={1}
                    max={104}
                    onChange={(value) => updateMaternityWeeks(index, value)}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField
                id="parental-single"
                label="Rodzicielski, jedno dziecko"
                value={draft.leave.parental_weeks_single}
                min={1}
                max={104}
                onChange={(value) => updateLeave('parental_weeks_single', value)}
              />
              <NumberField
                id="parental-multiple"
                label="Rodzicielski, więcej dzieci"
                value={draft.leave.parental_weeks_multiple}
                min={1}
                max={104}
                onChange={(value) => updateLeave('parental_weeks_multiple', value)}
              />
              <NumberField
                id="za-zyciem"
                label="Dodatek „Za życiem”"
                hint="Ile tygodni dochodzi do urlopu rodzicielskiego przy zaświadczeniu „Za życiem”."
                value={draft.leave.za_zyciem_extra_weeks}
                min={0}
                max={104}
                onChange={(value) => updateLeave('za_zyciem_extra_weeks', value)}
              />
              <NumberField
                id="exclusive-weeks"
                label="Tygodnie nieprzenoszalne"
                hint="Tygodnie zarezerwowane dla każdego z rodziców, zawsze po stawce rodzicielskiego."
                value={draft.leave.exclusive_weeks}
                min={0}
                max={52}
                onChange={(value) => updateLeave('exclusive_weeks', value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funkcje</CardTitle>
            <CardDescription>
              Wyłączenie funkcji chowa ją w serwisie, ale nie usuwa danych ani kodu. Można dopisać
              nową funkcję i odczytać jej stan w API pod podanym kluczem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {draft.features.map((flag) => (
              <div key={flag.key} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Switch
                    label={flag.label}
                    description={flag.description || `Klucz w API: ${flag.key}`}
                    checked={flag.enabled}
                    onChange={(enabled) => toggleFeature(flag.key, enabled)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Usuń funkcję ${flag.label}`}
                  className="mt-2 text-muted-foreground"
                  onClick={() => removeFeature(flag.key)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-end">
              <div className="space-y-1.5 sm:w-44">
                <Label htmlFor="feature-key">Klucz</Label>
                <Input
                  id="feature-key"
                  value={newFeature.key}
                  placeholder="np. nowy_ekran"
                  onChange={(event) => setNewFeature((state) => ({ ...state, key: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:flex-1">
                <Label htmlFor="feature-label">Nazwa funkcji</Label>
                <Input
                  id="feature-label"
                  value={newFeature.label}
                  placeholder="Co ta funkcja robi"
                  onChange={(event) => setNewFeature((state) => ({ ...state, label: event.target.value }))}
                />
              </div>
              <Button type="button" variant="outline" onClick={addFeature} disabled={!newFeature.key || !newFeature.label}>
                Dodaj
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Podgląd wyniku</CardTitle>
            <CardDescription>
              Przeliczenie dla jednego rodzica, podstawa 6 000 zł brutto. Liczy się z zapisanych
              parametrów, więc po zapisie od razu widać różnicę.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {preview.isPending && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Liczymy podgląd.
              </p>
            )}
            {preview.data && (
              <dl className="grid gap-3 text-base sm:grid-cols-2">
                <div className="flex items-baseline justify-between gap-4 sm:block">
                  <dt className="text-muted-foreground">Macierzyński ({maternity?.days ?? 0} dni)</dt>
                  <dd className="font-semibold text-primary">
                    {currency.format((maternity?.gross_grosze ?? 0) / 100)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 sm:block">
                  <dt className="text-muted-foreground">Rodzicielski ({parental?.days ?? 0} dni)</dt>
                  <dd className="font-semibold text-navy">
                    {currency.format((parental?.gross_grosze ?? 0) / 100)}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 z-10 mt-6 border-t bg-background/95 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="font-semibold"
            disabled={!dirty || !valid || save.isPending}
            onClick={() => draft && save.mutate(draft)}
          >
            {save.isPending ? <Loader2 className="animate-spin" /> : <Check />}
            Zapisz zmiany
          </Button>
          <Button
            variant="outline"
            disabled={reset.isPending}
            onClick={() => reset.mutate()}
          >
            <RotateCcw />
            Przywróć domyślne
          </Button>
          <p className="text-sm" role="status">
            {!valid
              ? 'Popraw zaznaczone wartości: stopy od 1 do 100%, wymiary w tygodniach.'
              : save.isSuccess && !dirty
                ? 'Zapisane. Kalkulator liczy już z nowych parametrów.'
                : 'Zmiany czekają na zapis.'}
          </p>
        </div>
      </div>
    </PageContainer>
  )
}