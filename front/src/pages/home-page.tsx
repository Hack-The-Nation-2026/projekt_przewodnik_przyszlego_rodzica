import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, FileText, HeartHandshake } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { SiteFooter } from '@/components/layout/site-footer'
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

const PANELS = [
  { id: 'start-panel', label: 'Start' },
  { id: 'swiadczenia-panel', label: 'Świadczenia' },
  { id: 'wsparcie-panel', label: 'Dokumenty i wsparcie' },
]

export function HomePage() {
  const { data, isPending, isError, refetch } = useBenefits()
  const citizen = useAppStore((state) => state.citizen)
  const panelsRef = useRef<HTMLDivElement>(null)
  const [activePanel, setActivePanel] = useState(PANELS[0].id)

  useEffect(() => {
    const scroller = panelsRef.current
    if (!scroller) return

    let lastWheelAt = 0
    let movement = 0
    let moved = false

    function handleWheel(event: WheelEvent) {
      if (!scroller || event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
        return
      }

      const now = performance.now()
      if (now - lastWheelAt > 160) {
        moved = false
        movement = 0
      }
      lastWheelAt = now

      // A trackpad emits several events per gesture. Advance at most one panel per gesture.
      if (moved) {
        event.preventDefault()
        return
      }

      const sections = [...scroller.querySelectorAll<HTMLElement>(':scope > section')]
      const nextIndex = sections.findIndex((section) => section.offsetTop > scroller.scrollTop + 1)
      const index = nextIndex === -1 ? sections.length - 1 : nextIndex - 1
      const current = sections[index]
      if (!current) return

      const goingDown = event.deltaY > 0
      const roomInPanel = goingDown
        ? current.offsetTop + current.offsetHeight - scroller.clientHeight - scroller.scrollTop
        : scroller.scrollTop - current.offsetTop
      const target = sections[index + (goingDown ? 1 : -1)]

      // Content taller than the viewport can scroll normally within its panel.
      if (!target || roomInPanel > 1) return

      event.preventDefault()
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1
      movement += event.deltaY * units
      if (Math.abs(movement) < 10) return

      moved = true
      scroller.scrollTo({ top: target.offsetTop })
    }

    scroller.addEventListener('wheel', handleWheel, { passive: false })
    return () => scroller.removeEventListener('wheel', handleWheel)
  }, [])

  function updateActivePanel() {
    const scroller = panelsRef.current
    if (!scroller) return

    const midpoint = scroller.scrollTop + scroller.clientHeight / 2
    const panel = Array.from(scroller.children).find(
      (child) => child instanceof HTMLElement && child.offsetTop + child.offsetHeight > midpoint,
    )
    if (panel) setActivePanel(panel.id)
  }

  function goToPanel(id: string) {
    const scroller = panelsRef.current
    const panel = document.getElementById(id)
    if (scroller && panel) scroller.scrollTo({ top: panel.offsetTop })
  }

  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Panele strony głównej" className="shrink-0 border-b border-border bg-background">
        <Container className="flex items-center gap-1 py-1.5 sm:gap-2">
          {PANELS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-controls={id}
              aria-current={activePanel === id ? 'location' : undefined}
              onClick={() => goToPanel(id)}
              className={cn(
                'min-h-10 rounded-md px-2.5 text-left text-xs font-medium sm:px-3 sm:text-sm',
                activePanel === id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
              )}
            >
              {label}
            </button>
          ))}
        </Container>
      </nav>

      <div
        ref={panelsRef}
        onScroll={updateActivePanel}
        tabIndex={0}
        role="region"
        aria-label="Treść paneli strony głównej"
        className="relative min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto motion-safe:scroll-smooth"
      >
        <section
          id="start-panel"
          aria-labelledby="start-title"
          className="flex min-h-full snap-start snap-always flex-col bg-secondary/40"
        >
          <div className="relative isolate flex flex-1 flex-col justify-center">
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
                <div
                  className="size-full"
                  style={{ clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0 100%)' }}
                >
                  <img
                    src="/formularz.jpg"
                    alt=""
                    className="size-full object-cover object-[50%_38%]"
                  />
                </div>
              </div>
            </div>

            <Container className="relative py-6 sm:py-12">
              <div className="max-w-2xl lg:max-w-[28rem] xl:max-w-[30rem]">
                <h1 id="start-title" className="text-3xl font-semibold leading-tight text-navy sm:text-5xl">
                  Sprawdź, co ci przysługuje w ciąży i po urodzeniu dziecka
                </h1>
                <p className="mt-3 max-w-xl text-muted-foreground sm:mt-5 sm:text-lg">
                  Przewodnik prowadzi przez zasiłek chorobowy, macierzyński i rodzicielski. Policz, kiedy
                  i ile dostaniesz, oraz zobacz, jakie dokumenty złożyć.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
                  <Link to="/kalkulator" className={buttonVariants({ className: 'sm:h-11 sm:px-6 sm:text-base' })}>
                    Rozpocznij sprawdzenie
                    <ArrowRight />
                  </Link>
                  <Button
                    variant="outline"
                    className="sm:h-11 sm:px-6 sm:text-base"
                    onClick={() => goToPanel('swiadczenia-panel')}
                  >
                    Zobacz świadczenia
                  </Button>
                </div>
              </div>
            </Container>

            <figure
              className="aspect-[4/3] max-h-[38svh] overflow-hidden lg:hidden"
              style={{ clipPath: 'polygon(0 0, 100% 12%, 100% 100%, 0 100%)' }}
            >
              <img
                src="/formularz.jpg"
                alt="Rodzice wypełniają przy kuchennym stole wniosek o zasiłek."
                className="size-full object-cover"
              />
            </figure>
          </div>

          {citizen && (
            <div className="border-y border-border bg-primary/5">
              <Container className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                <span className="text-sm font-medium text-navy">
                  {citizen.first_name} {citizen.last_name}
                </span>
                <span className="text-sm text-muted-foreground">{citizen.case_label}</span>
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
        </section>

        <section
          id="swiadczenia-panel"
          aria-labelledby="swiadczenia-title"
          className="flex min-h-full snap-start snap-always flex-col justify-center gap-5 bg-background py-6 sm:gap-12 sm:py-12"
        >
          <Container>
            <h2 className="text-2xl font-semibold text-navy sm:text-3xl">Jak to działa</h2>
            <ol className="mt-4 grid gap-2 md:mt-8 md:grid-cols-3 md:gap-6">
              {STEPS.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-lg border border-border p-3 md:block md:p-6">
                  <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-sm font-semibold text-secondary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold md:mt-4 md:text-lg">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground md:mt-2">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>

          <Container>
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
              <h2 id="swiadczenia-title" className="text-2xl font-semibold text-navy sm:text-3xl">
                Świadczenia
              </h2>
              <Link to="/swiadczenia" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Wszystkie świadczenia
                <ArrowRight />
              </Link>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Katalog obejmuje świadczenia związane z ciążą, porodem, adopcją i opieką nad dzieckiem.
            </p>

            <div className="mt-4 grid gap-2 md:mt-8 md:grid-cols-3 md:gap-6">
              {isPending &&
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="px-3 pt-3 pb-2 md:px-6 md:pt-6 md:pb-4">
                      <Skeleton className="h-5 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-2 px-3 pb-3 md:px-6 md:pb-6">
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
                  <CardHeader className="px-3 pt-3 pb-1 md:px-6 md:pt-6 md:pb-4">
                    <CardTitle className="text-base md:text-lg">{benefit.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section
          id="wsparcie-panel"
          aria-labelledby="wsparcie-title"
          className="flex min-h-full snap-start snap-always flex-col bg-secondary/40"
        >
          <Container className="py-8 sm:py-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
              <div>
                <h2 id="wsparcie-title" className="text-2xl font-semibold text-navy sm:text-3xl">
                  Dokumenty i wsparcie
                </h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
                {ACTIONS.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border border-border p-3 transition-colors sm:block sm:p-5',
                      'hover:border-primary hover:bg-secondary/50',
                    )}
                  >
                    <action.icon className="size-6 shrink-0 text-primary" />
                    <div className="sm:mt-4">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-muted-foreground sm:mt-1">{action.body}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-8 max-w-3xl border-t border-border pt-6">
              <h3 className="text-xl font-semibold text-navy">Wsparcie, gdy sytuacja jest trudna</h3>
              <p className="mt-2 text-muted-foreground">
                Urodzenie martwego dziecka, przedwczesny poród, ciężka choroba dziecka albo rodzica.
                Zbieramy miejsca i organizacje, które pomagają w takich chwilach.
              </p>
              <Link to="/wsparcie" className={cn(buttonVariants(), 'mt-4')}>
                Zobacz miejsca wsparcia
                <ArrowRight />
              </Link>
            </div>
          </Container>
          <SiteFooter compact />
        </section>
      </div>
    </div>
  )
}
