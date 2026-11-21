import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowRight, Loader2, LogOut, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
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
        <CardTitle>Twoje dane</CardTitle>
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', pesel: '', caseLabel: '' },
  })

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
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Card className="flex flex-col">
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
          <Form {...form}>
            <form
              className="space-y-5"
              noValidate
              onSubmit={form.handleSubmit((values) => manual.mutate(values))}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imię</FormLabel>
                      <FormControl>
                        <Input autoComplete="given-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwisko</FormLabel>
                      <FormControl>
                        <Input autoComplete="family-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="pesel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PESEL</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" maxLength={11} autoComplete="off" {...field} />
                    </FormControl>
                    <FormDescription>11 cyfr.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="caseLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sytuacja (opcjonalnie)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Krótko, na przykład: ciąża, jeden poród.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export function WejsciePage() {
  const citizen = useAppStore((state) => state.citizen)

  return (
    <PageContainer className="py-14 sm:py-20">
      <PageHeading
        title={citizen ? 'Jesteś w środku' : 'Wejdź do Przewodnika'}
        description={
          citizen
            ? 'Znamy twoje dane. Sprawdź je i przejdź do kalkulatora, który policzy, co ci przysługuje.'
            : 'Wybierz, jak chcesz zacząć. mObywatel wypełnia dane za ciebie, a ręczne wpisanie wystarczy, żeby policzyć świadczenia.'
        }
        crumb="Wejście"
        backTo="/"
        backLabel="Wróć na stronę startową"
      />

      <div className="mt-8">{citizen ? <SessionCard /> : <MethodChooser />}</div>
    </PageContainer>
  )
}
