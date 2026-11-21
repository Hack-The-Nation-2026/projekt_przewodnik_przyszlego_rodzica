import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ReactNode } from 'react'
import { ArrowRight, Loader2, LogOut, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Container } from '@/components/layout/container'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/app-store'
import type { Citizen, ManualEntry } from '@/types/api'
import { cn } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().trim().min(1, 'Podaj imię.'),
  lastName: z.string().trim().min(1, 'Podaj nazwisko.'),
  pesel: z.string().trim().regex(/^\d{11}$/, 'PESEL to 11 cyfr.'),
  caseLabel: z.string().trim().max(140, 'Maksymalnie 140 znaków.').optional(),
})

type FormValues = z.infer<typeof schema>

function describeFailure(error: unknown) {
  if (!axios.isAxiosError(error)) return 'Nie udało się zapisać danych.'
  if (!error.response) return 'Nie udało się połączyć z serwerem. Spróbuj ponownie.'
  const detail = (error.response.data as { detail?: unknown } | undefined)?.detail
  return typeof detail === 'string' ? detail : 'Sprawdź wpisane dane i spróbuj ponownie.'
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy">{value}</dd>
    </div>
  )
}

/** Zasłaniamy środek numeru, tak jak robią to banki i ZUS. */
function maskPesel(pesel: string) {
  return pesel.length === 11 ? `${pesel.slice(0, 3)}•••••${pesel.slice(-3)}` : pesel
}

/** Ekran po wejściu: pokazuje, co o osobie wiemy, i prowadzi dalej. */
function SessionCard() {
  const citizen = useAppStore((state) => state.citizen)
  const signOut = useAppStore((state) => state.signOut)
  if (!citizen) return null

  const fromMobywatel = citizen.source !== 'manual'

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Twoje dane</CardTitle>
          <Badge
            variant="outline"
            className={cn(
              fromMobywatel ? 'border-primary/30 text-primary' : 'text-muted-foreground',
            )}
          >
            {fromMobywatel ? 'Dane z mObywatela' : 'Dane wpisane ręcznie'}
          </Badge>
        </div>
        <CardDescription>
          {fromMobywatel
            ? 'Te dane przyszły z twojego konta. Możesz iść dalej.'
            : 'Pracujemy na tym, co wpisałeś. Możesz iść dalej albo poprawić dane.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <DataRow label="Imię i nazwisko" value={`${citizen.first_name} ${citizen.last_name}`} />
          <DataRow label="PESEL" value={maskPesel(citizen.pesel)} />
          <DataRow label="Sprawa" value={citizen.case_label} />
          <DataRow label="Status" value={citizen.status} />
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/kalkulator" className={buttonVariants({ size: 'lg' })}>
            Przejdź dalej
            <ArrowRight />
          </Link>
          <Button variant="outline" size="lg" onClick={signOut}>
            <LogOut />
            Wyloguj
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MethodChooser() {
  const signIn = useAppStore((state) => state.signIn)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const manual = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: ManualEntry = {
        first_name: values.firstName,
        last_name: values.lastName,
        pesel: values.pesel,
        case_label: values.caseLabel || undefined,
      }
      const { data } = await api.post<Citizen>('/auth/manual', payload)
      return data
    },
    onSuccess: (citizen) => signIn(citizen),
  })

  const failure = manual.isError ? describeFailure(manual.error) : null

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card className="flex flex-col border-primary/30">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Zaloguj przez mObywatel</CardTitle>
              <Badge className="bg-primary text-primary-foreground">Zalecane</Badge>
            </div>
            <CardDescription>
              Najkrótsza droga. Dane i status sprawy wczytamy z twojego konta, więc nie musisz
              niczego przepisywać.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              to="/mobywatel?returnTo=/wejscie"
              className={cn(buttonVariants({ variant: 'mobywatel', size: 'lg' }), 'w-full')}
            >
              <Smartphone />
              Zaloguj przez mObywatel
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Wpisz dane ręcznie</CardTitle>
            <CardDescription>
              Nie masz mObywatela albo wolisz się nie logować? Wystarczy imię, nazwisko i PESEL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" noValidate onSubmit={handleSubmit((values) => manual.mutate(values))}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Imię" htmlFor="first-name" error={errors.firstName?.message}>
                  <Input
                    id="first-name"
                    autoComplete="given-name"
                    aria-invalid={Boolean(errors.firstName)}
                    {...register('firstName')}
                  />
                </Field>
                <Field label="Nazwisko" htmlFor="last-name" error={errors.lastName?.message}>
                  <Input
                    id="last-name"
                    autoComplete="family-name"
                    aria-invalid={Boolean(errors.lastName)}
                    {...register('lastName')}
                  />
                </Field>
              </div>

              <Field
                label="PESEL"
                htmlFor="pesel"
                hint="11 cyfr, na przykład 44051401359."
                error={errors.pesel?.message}
              >
                <Input
                  id="pesel"
                  inputMode="numeric"
                  maxLength={11}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.pesel)}
                  {...register('pesel')}
                />
              </Field>

              <Field
                label="Sytuacja (opcjonalnie)"
                htmlFor="case-label"
                hint="Krótko, na przykład: ciąża, jeden poród."
                error={errors.caseLabel?.message}
              >
                <Input id="case-label" {...register('caseLabel')} />
              </Field>

              {failure && (
                <p role="alert" className="rounded-md bg-destructive/8 p-3 text-sm text-destructive">
                  {failure}
                </p>
              )}

              <Button type="submit" size="lg" disabled={manual.isPending} className="w-full">
                {manual.isPending && <Loader2 className="animate-spin" />}
                {manual.isPending ? 'Zapisuję…' : 'Wejdź z tymi danymi'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function WejsciePage() {
  const citizen = useAppStore((state) => state.citizen)

  return (
    <Container className="max-w-4xl py-14 sm:py-20">
      <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
        {citizen ? 'Jesteś w środku' : 'Wejdź do Przewodnika'}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        {citizen
          ? 'Znamy twoje dane. Sprawdź je i przejdź do kalkulatora, który policzy, co ci przysługuje.'
          : 'Wybierz, jak chcesz zacząć. mObywatel wypełnia dane za ciebie, a ręczne wpisanie wystarczy, żeby policzyć świadczenia.'}
      </p>

      <div className="mt-8">{citizen ? <SessionCard /> : <MethodChooser />}</div>
    </Container>
  )
}
