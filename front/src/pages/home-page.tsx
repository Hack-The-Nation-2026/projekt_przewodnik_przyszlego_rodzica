import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, FileText, HeartHandshake } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { useBenefits } from '@/hooks/use-benefits'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

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
  { to: '/kalkulator', icon: Calculator, title: 'Policz zasiłek', body: 'Terminy i kwoty dla obojga rodziców.' },
  { to: '/dokumenty', icon: FileText, title: 'Zbierz dokumenty', body: 'Wnioski i zaświadczenia.' },
  { to: '/wsparcie', icon: HeartHandshake, title: 'Znajdź wsparcie', body: 'Pomoc w trudnych sytuacjach.' },
]

export function HomePage() {
  const { data, isPending, isError, refetch } = useBenefits()
  const citizen = useAppStore((state) => state.citizen)

  // Przewijanie idzie sekcjami: gdy bieżąca sekcja nie ma już zapasu w daną stronę, jedno
  // kółko dostawia sąsiednią sekcję pod nagłówek. Sekcja wyższa od okna przewija się
  // w środku normalnie, więc długa treść na telefonie nie utyka.
  useEffect(() => {
    let lastWheelAt = 0
    let moved = false

    function handleWheel(event: WheelEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.shiftKey) return
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return

      const sections = Array.from(document.querySelectorAll<HTMLElement>('main section'))
      if (sections.length < 2) return

      const padding =
        Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const tops = sections.map(
        (section) => section.getBoundingClientRect().top + window.scrollY - padding,
      )

      // Sekcja, pod którą stoi teraz górna krawędź okna.
      let index = 0
      tops.forEach((top, position) => {
        if (window.scrollY >= top - 2) index = position
      })

      const section = sections[index]
      const sectionTop = section.getBoundingClientRect().top + window.scrollY
      const goingDown = event.deltaY > 0
      const fits = section.offsetHeight <= window.innerHeight - padding + 4

      // Sekcja mieszcząca się w oknie oddaje kółko od razu; wyższa od okna najpierw
      // przewija się do końca, a dopiero potem dostawia sąsiednią.
      const ready = goingDown
        ? fits
          ? window.scrollY >= tops[index] - 4
          : window.scrollY + window.innerHeight >= sectionTop + section.offsetHeight - 1
        : fits
          ? window.scrollY >= tops[index] - 4
          : window.scrollY <= tops[index] + 4

      if (!ready) return

      const target = tops[index + (goingDown ? 1 : -1)]
      if (target === undefined) return

      event.preventDefault()

      // Jedno kółko to jedno dostawienie, dopóki gest trwa.
      const now = performance.now()
      if (now - lastWheelAt > 200) moved = false
      lastWheelAt = now
      if (moved) return

      moved = true
      window.scrollTo({ top: Math.max(0, target) })
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <>
      <section
        aria-labelledby="start-title"
        className="relative isolate overflow-hidden bg-secondary/40"
      >
        {/* Zdjęcie zajmuje prawy skraj sekcji: dochodzi do krawędzi okna, ma skośny lewy brzeg
            i rzuca cień na treść obok. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden lg:block lg:w-[46%] xl:w-[52%] xl:max-w-[60rem]"
        >
          <div
            className="size-full"
            style={{
              filter:
                'drop-shadow(-10px 0 14px rgba(29, 43, 58, 0.32)) drop-shadow(-34px 0 46px rgba(29, 43, 58, 0.22))',
            }}
          >
            <div className="size-full" style={{ clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0 100%)' }}>
              <img
                src="/formularz.jpg"
                alt=""
                className="size-full object-cover object-[50%_38%]"
              />
            </div>
          </div>
        </div>

        <Container className="relative py-16 sm:py-24">
          <div className="max-w-2xl lg:max-w-[36rem] xl:max-w-[40rem]">
            <h1
              id="start-title"
              className="text-4xl font-semibold leading-tight text-navy sm:text-5xl lg:text-6xl"
            >
              Sprawdź, co ci przysługuje w ciąży i po urodzeniu dziecka
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground sm:mt-6 sm:text-xl">
              Przewodnik prowadzi przez zasiłek chorobowy, macierzyński i rodzicielski. Policz, kiedy
              i ile dostaniesz, oraz zobacz, jakie dokumenty złożyć.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-10">
              <Link to="/kalkulator" className={buttonVariants({ size: 'lg' })}>
                Rozpocznij sprawdzenie
                <ArrowRight />
              </Link>
              <a href="#swiadczenia" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Zobacz świadczenia
              </a>
            </div>
          </div>
        </Container>

        {/* Na wąskich ekranach to samo zdjęcie wchodzi pod tekst i domyka sekcję, z tym samym skosem. */}
        <figure className="relative lg:hidden" style={{ clipPath: 'polygon(0 0, 100% 12%, 100% 100%, 0 100%)' }}>
          <img
            src="/formularz.jpg"
            alt="Rodzice wypełniają przy kuchennym stole wniosek o zasiłek."
            className="aspect-[4/3] w-full object-cover"
          />
        </figure>
      </section>

      {citizen && (
        <div className="border-b border-border bg-primary/5">
          <Container className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
            <span className="font-medium text-navy">
              {citizen.first_name} {citizen.last_name}
            </span>
            <span className="text-muted-foreground">{citizen.case_label}</span>
            <Badge
              variant="outline"
              className={cn(
                'bg-background sm:ml-auto',
                citizen.status === 'przyznane' && 'border-primary/30 text-primary',
                citizen.status === 'odmowa' && 'border-destructive/40 text-destructive',
              )}
            >
              {citizen.status}
            </Badge>
          </Container>
        </div>
      )}

      <section aria-labelledby="jak-to-dziala-title" className="py-14 sm:py-20">
        <Container>
          <h2 id="jak-to-dziala-title" className="text-2xl font-semibold text-navy sm:text-3xl">
            Jak to działa
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-lg border border-border p-5 sm:p-6">
                <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-base font-semibold text-secondary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section
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

      <section aria-labelledby="wsparcie-title" className="py-14 sm:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <h2 id="wsparcie-title" className="text-2xl font-semibold text-navy sm:text-3xl">
              Dokumenty i wsparcie
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
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
