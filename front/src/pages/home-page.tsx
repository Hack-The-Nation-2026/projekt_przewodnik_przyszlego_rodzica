import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, FileText, HeartHandshake } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { useBenefits } from '@/hooks/use-benefits'
import { cn } from '@/lib/utils'

const FACTS = [
  { value: '100%', label: 'podstawy wymiaru zasiłku chorobowego w czasie ciąży' },
  { value: '20', label: 'tygodni urlopu macierzyńskiego po urodzeniu jednego dziecka' },
  { value: '41/43', label: 'tygodni urlopu rodzicielskiego do podziału między rodziców' },
]

const STEPS = [
  {
    title: 'Opisz swoją sytuację',
    body: 'Odpowiadasz na kilka pytań o pracę, ubezpieczenie i przewidywany termin porodu.',
  },
  {
    title: 'Zobacz, co ci przysługuje',
    body: 'Liczymy zasiłki, terminy i kwoty dla Twojego przypadku, także w sytuacjach nietypowych.',
  },
  {
    title: 'Wiedz, co dalej',
    body: 'Dostajesz listę dokumentów i informację, gdzie je złożyć: u pracodawcy albo w ZUS.',
  },
]

const ACTIONS = [
  { to: '/kalkulator', icon: Calculator, title: 'Policz zasiłek', body: 'Symulacja dla obojga rodziców.' },
  { to: '/dokumenty', icon: FileText, title: 'Zbierz dokumenty', body: 'Wnioski i zaświadczenia.' },
  { to: '/wsparcie', icon: HeartHandshake, title: 'Znajdź wsparcie', body: 'Pomoc w trudnych sytuacjach.' },
]

export function HomePage() {
  const { data, isPending, isError, refetch } = useBenefits()

  return (
    <>
      <section className="border-b border-border bg-secondary/40">
        <Container className="grid items-start gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-navy sm:text-5xl">
              Sprawdź, co ci przysługuje w ciąży i po urodzeniu dziecka
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Przewodnik prowadzi przez zasiłek chorobowy, macierzyński i rodzicielski. Policz, kiedy
              i ile dostaniesz, oraz zobacz, jakie dokumenty złożyć.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/kalkulator" className={buttonVariants({ size: 'lg' })}>
                Rozpocznij sprawdzenie
                <ArrowRight />
              </Link>
              <Link to="/swiadczenia" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                Zobacz świadczenia
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Bez logowania na start. mObywatel tylko wtedy, gdy chcesz pobrać swoje dane.
            </p>
          </div>

          <Card className="bg-background">
            <CardHeader>
              <CardTitle>W skrócie</CardTitle>
              <CardDescription>Najważniejsze liczby, od których zaczyna się rozmowa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="grid grid-cols-[4.5rem_1fr] items-baseline gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <span className="font-display text-2xl font-semibold text-primary">{fact.value}</span>
                  <span className="text-sm text-muted-foreground">{fact.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <h2 className="text-2xl font-semibold text-navy sm:text-3xl">Jak to działa</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-lg border border-border p-6">
                <span className="flex size-8 items-center justify-center rounded-md bg-secondary font-display text-sm font-semibold text-secondary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-y border-border bg-muted/50 py-16">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-navy sm:text-3xl">Czego dotyczą świadczenia</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Lista pochodzi z API projektu, więc pokazuje, że front i backend już ze sobą rozmawiają.
              </p>
            </div>
            <Link to="/swiadczenia" className={buttonVariants({ variant: 'outline' })}>
              Wszystkie świadczenia
              <ArrowRight />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {isPending &&
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-5 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </CardContent>
                </Card>
              ))}

            {isError && (
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Nie udało się pobrać listy świadczeń</CardTitle>
                  <CardDescription>
                    Sprawdź, czy backend działa pod adresem z konfiguracji, i spróbuj ponownie.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => refetch()}>
                    Spróbuj ponownie
                  </Button>
                </CardContent>
              </Card>
            )}

            {data?.map((benefit) => (
              <Card key={benefit.code}>
                <CardHeader>
                  <CardTitle>{benefit.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-navy sm:text-3xl">Szybkie wejścia</h2>
              <p className="mt-2 text-muted-foreground">Skróty do tego, co rodzice sprawdzają najczęściej.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {ACTIONS.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className={cn(
                    'group rounded-lg border border-border p-5 transition-colors',
                    'hover:border-primary hover:bg-secondary/50',
                  )}
                >
                  <action.icon className="size-6 text-primary" />
                  <p className="mt-4 font-medium">{action.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{action.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-border bg-secondary/40 py-16">
        <Container className="max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-navy">Wsparcie, gdy sytuacja jest trudna</h2>
          <p className="mt-4 text-muted-foreground">
            Urodzenie martwego dziecka, przedwczesny poród, ciężka choroba dziecka albo rodzica.
            Zbieramy miejsca i organizacje, które pomagają w takich chwilach.
          </p>
          <Link to="/wsparcie" className={cn(buttonVariants(), 'mt-6')}>
            Zobacz miejsca wsparcia
            <ArrowRight />
          </Link>
        </Container>
      </section>
    </>
  )
}
