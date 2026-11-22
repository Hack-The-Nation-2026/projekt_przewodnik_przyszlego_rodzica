import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Calculator,
  CalendarClock,
  ChevronDown,
  FileText,
  FolderSearch,
  HeartHandshake,
  PenLine,
  ShieldAlert,
  Sprout,
} from 'lucide-react'
import { BenefitCard } from '@/components/benefit-card'
import { Container } from '@/components/layout/container'
import { buttonVariants } from '@/components/ui/button'
import { useFeature } from '@/hooks/use-settings'
import type { BenefitCode } from '@/lib/benefit-interview'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    title: 'Opisz swoją sytuację',
    body: 'Odpowiadasz na kilka pytań o pracę, ubezpieczenie i przewidywany termin porodu.',
    image: '/krok-1.webp',
  },
  {
    title: 'Zobacz, co ci przysługuje',
    body: 'Liczymy zasiłki, terminy i kwoty dla Twojego przypadku, także w sytuacjach nietypowych.',
    image: '/krok-2.webp',
  },
  {
    title: 'Wiedz, co dalej',
    body: 'Dostajesz listę dokumentów i informację, gdzie je złożyć: u pracodawcy albo w ZUS.',
    image: '/krok-3.webp',
  },
]

// Trzy świadczenia pokazane na stronie głównej. Pełny katalog stoi pod
// przyciskiem na dole sekcji i na stronie świadczeń.
const FEATURED: BenefitCode[] = ['macierzynski', 'rodzicielski', 'ojcowski']

const TOOLS = [
  {
    to: '/kalkulator',
    icon: Calculator,
    title: 'Kalkulator zasiłków',
    body: 'Policz, co przysługuje obojgu rodzicom: dni i kwoty, także w nietypowych sytuacjach.',
  },
  {
    to: '/dokumenty',
    icon: FileText,
    title: 'Dokumenty i wnioski',
    body: 'Sprawdź, który formularz wypełnić, co dołączyć i gdzie złożyć wniosek.',
  },
  {
    to: '/urlop',
    icon: CalendarClock,
    title: 'Jestem w trakcie urlopu',
    body: 'Policz, ile urlopu jeszcze zostało i co trzeba złożyć w najbliższych tygodniach.',
  },
  {
    to: '/planowanie',
    icon: Sprout,
    title: 'Planujesz dziecko?',
    body: 'Lista przygotowań i termin, do którego warto je zamknąć, zanim pojawi się data porodu.',
  },
  {
    to: '/wnioski',
    icon: PenLine,
    title: 'Kreator wniosku urlopowego',
    body: 'Ułóż pismo do pracodawcy z danych i dat z Twojego wywiadu.',
  },
  {
    to: '/sprawy',
    icon: FolderSearch,
    title: 'Sprawy',
    body: 'Wgraj przykładowy PDF z ZUS albo wybierz wniosek i zobacz, jak liczymy świadczenia.',
  },
  {
    to: '/zus',
    icon: Building2,
    title: 'Symulacja ZUS',
    body: 'Dane, które ZUS widzi na Twoim koncie, i wnioski, które można złożyć bez wizyty.',
    feature: 'zus_simulations' as const,
  },
  {
    to: '/odwolanie',
    icon: ShieldAlert,
    title: 'Dostałem decyzję odmowną',
    body: 'Diagnoza sporu, termin na odwołanie i projekt pisma na konkretny powód odmowy.',
  },
]

export function HomePage() {
  const zusEnabled = useFeature('zus_simulations')
  const tools = TOOLS.filter((tool) => !('feature' in tool) || zusEnabled)

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
          <h2 id="jak-to-dziala-title" className="text-2xl font-semibold text-navy sm:text-3xl">
            Jak to działa
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Trzy kroki: opisz swoją sytuację, zobacz wyliczenia i dowiedz się, co złożyć.
          </p>

          {/* Pionowa oś czasu: numer kroku na linii, obok ilustracja i opis.
              Linia rysuje się tylko między krokami, nigdy pod ostatnim. */}
          <ol role="list" className="mt-8 sm:mt-10">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-4 pb-10 last:pb-0 sm:gap-6 sm:pb-14"
              >
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-11 bottom-0 left-5.5 w-px -translate-x-1/2 bg-border sm:top-14 sm:left-7"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="relative z-10 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-primary text-base font-semibold text-primary-foreground ring-4 ring-background sm:size-14 sm:text-lg"
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-8 lg:gap-12">
                  <img
                    src={step.image}
                    alt=""
                    width={800}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-32 shrink-0 rounded-lg sm:w-48 lg:w-72"
                  />
                  <div className="min-w-0 max-w-2xl sm:pt-1">
                    <h3 className="text-lg font-semibold text-navy sm:text-xl lg:text-2xl">
                      {step.title}
                    </h3>
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
          <h2 id="swiadczenia-title" className="text-2xl font-semibold text-navy sm:text-3xl">
            Świadczenia
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Katalog obejmuje świadczenia związane z ciążą, porodem, adopcją i opieką nad dzieckiem.
          </p>

          <ul className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
            {FEATURED.map((code) => (
              <li key={code}>
                <BenefitCard code={code} />
              </li>
            ))}
          </ul>

          <div className="mt-8 flex justify-center">
            <Link
              to="/swiadczenia"
              className={cn(buttonVariants({ variant: 'ghost' }), 'text-primary')}
            >
              Zobacz wszystkie świadczenia
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>

      <section
        data-scroll-section
        id="narzedzia"
        aria-labelledby="narzedzia-title"
        className="py-14 sm:py-20"
      >
        <Container>
          <h2 id="narzedzia-title" className="text-2xl font-semibold text-navy sm:text-3xl">
            Z czego możesz skorzystać
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Cały serwis w skrócie: policz zasiłek, przygotuj dokumenty, zaplanuj urlop i znajdź
            wsparcie, kiedy jest trudno.
          </p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => (
              <li key={tool.to}>
                <Link
                  to={tool.to}
                  className="group flex h-full flex-col gap-4 rounded-lg bg-neutral-100 p-5 transition-colors hover:bg-secondary"
                >
                  <span className="flex size-11 items-center justify-center rounded-md bg-background text-primary">
                    <tool.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="mt-auto flex flex-col">
                    <span className="flex items-center gap-1.5 font-semibold text-navy">
                      {tool.title}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                    <span className="mt-1 text-sm text-muted-foreground">{tool.body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            to="/wsparcie"
            className="group mt-6 flex flex-col gap-4 rounded-lg bg-navy p-6 text-white transition-colors hover:bg-navy/90 sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <span className="flex max-w-2xl flex-col">
              <span className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
                <HeartHandshake className="size-6 shrink-0" aria-hidden="true" />
                Wsparcie, gdy sytuacja jest trudna
              </span>
              <span className="mt-2 text-white/85">
                Urodzenie martwego dziecka, przedwczesny poród, ciężka choroba dziecka albo rodzica.
                Zbieramy miejsca i organizacje, które pomagają w takich chwilach.
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 font-medium">
              Zobacz miejsca wsparcia
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </Container>
      </section>
    </>
  )
}
