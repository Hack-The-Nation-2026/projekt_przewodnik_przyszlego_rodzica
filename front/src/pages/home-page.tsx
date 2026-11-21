import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, ChevronDown, FileText, HeartHandshake, Sprout } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { useBenefits } from '@/hooks/use-benefits'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    title: 'Opisz swoją sytuację',
    body: 'Odpowiadasz na kilka pytań o pracę, ubezpieczenie i przewidywany termin porodu.',
    image: '/krok-wywiad.webp',
  },
  {
    title: 'Zobacz, co ci przysługuje',
    body: 'Liczymy zasiłki, terminy i kwoty dla Twojego przypadku, także w sytuacjach nietypowych.',
    image: '/krok-wyniki.webp',
  },
  {
    title: 'Wiedz, co dalej',
    body: 'Dostajesz listę dokumentów i informację, gdzie je złożyć: u pracodawcy albo w ZUS.',
    image: '/krok-dokumenty.webp',
  },
]

const ACTIONS = [
  { to: '/kalkulator', icon: Calculator, title: 'Policz zasiłek', body: 'Terminy i kwoty dla obojga rodziców.' },
  { to: '/dokumenty', icon: FileText, title: 'Zbierz dokumenty', body: 'Wnioski i zaświadczenia.' },
  { to: '/planowanie', icon: Sprout, title: 'Planujesz dziecko?', body: 'Lista przygotowań, zanim pojawi się data porodu.' },
  { to: '/wsparcie', icon: HeartHandshake, title: 'Znajdź wsparcie', body: 'Pomoc w trudnych sytuacjach.' },
]

export function HomePage() {
  const { data, isPending, isError, refetch } = useBenefits()

  return (
    <>
      <section
        data-scroll-section
        aria-labelledby="start-title"
        className="relative isolate overflow-hidden bg-foreground"
      >
        {/* Jedno zdjęcie w proporcji 2:1 na każdym ekranie. Na telefonie stoi nad tekstem
            w całości, na szerokim ekranie tekst leży na zdjęciu, a wysokość jest ograniczona,
            żeby pod hero zostało widać początek kolejnej sekcji. */}
        <img
          src="/rodzice-kolyska.jpg"
          alt="Mama i tata leżą z niemowlakiem na łóżku w jasnej sypialni."
          fetchPriority="high"
          className="aspect-[2/1] w-full object-cover lg:max-h-[76vh] lg:object-[50%_0%]"
        />
        <div aria-hidden className="home-hero-shade absolute inset-0 hidden lg:block" />
        <Container className="relative py-10 sm:py-12 lg:absolute lg:inset-0 lg:flex lg:items-center lg:py-0">
          <div className="w-full max-w-[39rem] text-primary-foreground [--ring:var(--primary-foreground)] lg:max-w-[32rem]">
            <h1
              id="start-title"
              className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl"
            >
              Sprawdź, co ci przysługuje w ciąży i po urodzeniu dziecka
            </h1>
            <p className="mt-4 text-base text-primary-foreground/95 sm:text-lg">
              Skrzydła Rodzica prowadzą przez zasiłek chorobowy, macierzyński i rodzicielski. Policz, kiedy
              i ile dostaniesz, oraz zobacz, jakie dokumenty złożyć.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/wejscie" className={buttonVariants({ size: 'lg' })}>
                Rozpocznij sprawdzenie
                <ArrowRight />
              </Link>
              <a
                href="#swiadczenia"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-background text-foreground hover:bg-secondary hover:text-secondary-foreground',
                )}
              >
                Zobacz świadczenia
              </a>
            </div>
          </div>
        </Container>
        <div className="absolute inset-x-0 bottom-5 hidden justify-center lg:flex">
          <a
            href="#jak-to-dziala"
            aria-label="Przewiń do sekcji Jak to działa"
            className="home-scroll-hint flex size-10 items-center justify-center rounded-full bg-background/90 text-primary shadow-lg ring-1 ring-black/5 backdrop-blur-sm hover:bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <ChevronDown aria-hidden="true" className="size-5" />
          </a>
        </div>
      </section>

      <section
        data-scroll-section
        id="jak-to-dziala"
        aria-labelledby="jak-to-dziala-title"
        className="py-14 sm:py-20"
      >
        <Container>
          <div className="flex items-center justify-between gap-4">
            <h2 id="jak-to-dziala-title" className="text-2xl font-semibold text-navy sm:text-3xl">
              Jak to działa
            </h2>
            {/* Bocian z rodziną w gnieździe: znak firmowy wyjaśnia nazwę serwisu. */}
            <img
              src="/cover.png"
              alt="Bocian rozkłada skrzydła nad rodziną siedzącą w gnieździe."
              loading="lazy"
              className="w-24 shrink-0 sm:w-36"
            />
          </div>
          <ol role="list" className="mt-6 space-y-4 sm:space-y-6">
            {STEPS.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
                <span
                  aria-hidden="true"
                  className="mt-1 flex size-9 items-center justify-center self-start rounded-full bg-primary text-base font-semibold text-primary-foreground sm:mt-0 sm:size-12 sm:self-center sm:text-lg"
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
                  <img
                    src={step.image}
                    alt=""
                    width={480}
                    height={360}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-24 shrink-0 sm:w-32 lg:w-36"
                  />
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-navy sm:text-xl">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section
        data-scroll-section
        id="swiadczenia"
        aria-labelledby="swiadczenia-title"
        className="border-t border-border bg-secondary/40 py-14 sm:py-20"
      >
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="swiadczenia-title" className="text-2xl font-semibold text-navy sm:text-3xl">
              Świadczenia
            </h2>
            <Link to="/swiadczenia" className={buttonVariants({ variant: 'outline' })}>
              Wszystkie świadczenia
              <ArrowRight />
            </Link>
          </div>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Katalog obejmuje świadczenia związane z ciążą, porodem, adopcją i opieką nad dzieckiem.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
            {isPending &&
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
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
                  <CardDescription>Spróbuj ponownie za chwilę.</CardDescription>
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
                  <CardTitle className="text-lg">{benefit.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section data-scroll-section aria-labelledby="wsparcie-title" className="py-14 sm:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <h2 id="wsparcie-title" className="text-2xl font-semibold text-navy sm:text-3xl">
              Dokumenty i wsparcie
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ACTIONS.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className={cn(
                    'rounded-lg border border-border p-5 transition-colors',
                    'hover:border-primary hover:bg-secondary/50',
                  )}
                >
                  <action.icon className="size-6 text-primary" />
                  <p className="mt-4 font-medium">{action.title}</p>
                  <p className="mt-1 text-muted-foreground">{action.body}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10 max-w-3xl border-t border-border pt-8">
            <h3 className="text-xl font-semibold text-navy sm:text-2xl">Wsparcie, gdy sytuacja jest trudna</h3>
            <p className="mt-3 text-muted-foreground">
              Urodzenie martwego dziecka, przedwczesny poród, ciężka choroba dziecka albo rodzica.
              Zbieramy miejsca i organizacje, które pomagają w takich chwilach.
            </p>
            <Link to="/wsparcie" className={cn(buttonVariants(), 'mt-5')}>
              Zobacz miejsca wsparcia
              <ArrowRight />
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
