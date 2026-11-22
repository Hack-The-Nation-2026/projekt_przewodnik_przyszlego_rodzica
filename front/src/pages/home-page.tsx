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
    body: 'Odpowiadasz na kilka pytań o pracę, ubezpieczenie i przewidywany termin porodu. Nie musisz znać żadnego przepisu.',
    image: '/krok-1.webp',
  },
  {
    title: 'Zobacz, co ci przysługuje',
    body: 'Liczymy zasiłki, terminy i kwoty dla Twojego przypadku, osobno dla mamy i taty. Także przy wcześniactwie, adopcji i umowie zlecenie.',
    image: '/krok-2.webp',
  },
  {
    title: 'Wiedz, co dalej',
    body: 'Dostajesz listę dokumentów i wiesz, gdzie je złożyć: u pracodawcy albo w ZUS. Do tego terminy, których nie warto przegapić.',
    image: '/krok-3.webp',
  },
]

// Trzy świadczenia pokazane na stronie głównej. Pełny katalog stoi pod
// przyciskiem na dole sekcji i na stronie świadczeń.
const FEATURED: BenefitCode[] = ['macierzynski', 'rodzicielski', 'ojcowski']

const TOOLS = [
  { to: '/kalkulator', icon: Calculator, title: 'Kalkulator zasiłków', body: 'Kwoty i terminy dla obojga rodziców.' },
  { to: '/dokumenty', icon: FileText, title: 'Dokumenty i wnioski', body: 'Formularz, załączniki, miejsce złożenia.' },
  { to: '/urlop', icon: CalendarClock, title: 'Jestem w trakcie urlopu', body: 'Ile urlopu zostało i co złożyć.' },
  { to: '/planowanie', icon: Sprout, title: 'Planujesz dziecko?', body: 'Lista przygotowań przed ciążą.' },
  { to: '/wnioski', icon: PenLine, title: 'Kreator wniosku urlopowego', body: 'Pismo do pracodawcy z Twoich danych.' },
  { to: '/sprawy', icon: FolderSearch, title: 'Sprawy', body: 'Porównaj wniosek z decyzją ZUS.' },
  { to: '/zus', icon: Building2, title: 'Symulacja ZUS', body: 'Twoje konto i wnioski bez wizyty.', feature: 'zus_simulations' as const },
  { to: '/odwolanie', icon: ShieldAlert, title: 'Dostałem decyzję odmowną', body: 'Termin na odwołanie i projekt pisma.' },
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
              Sprawdź, co ci przysługuje
            </h1>
            <p className="mt-4 text-base text-primary-foreground/95 sm:text-lg">
              Skrzydła Rodzica prowadzą przez zasiłki i dokumenty związane z ciążą, porodem i opieką
              nad dzieckiem, dla mamy i taty. Także wtedy, gdy poród przebiega inaczej niż zakładano,
              czyli przy wcześniactwie, gdy dziecko wymaga leczenia, przy adopcji i w rodzinie
              zastępczej.
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
            Trzy kroki: opisujesz sytuację, dostajesz wyliczenia i wiesz, co złożyć.
          </p>

          {/* Trzy kroki obok siebie, żeby ilustracje były duże. Na węższych ekranach
              układają się w kolumnę i zdjęcie zajmuje całą szerokość. */}
          <ol role="list" className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex flex-col">
                <img
                  src={step.image}
                  alt=""
                  width={800}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <div className="mt-5 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-navy">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">{step.body}</p>
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
            Zasiłki związane z ciążą, porodem, adopcją i opieką nad dzieckiem.
          </p>

          <ul className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
            {FEATURED.map((code) => (
              <li key={code}>
                <BenefitCard code={code} showSources={false} />
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
            Policz zasiłek, przygotuj dokumenty, zaplanuj urlop albo znajdź wsparcie.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => (
              <li key={tool.to}>
                <Link
                  to={tool.to}
                  className="group flex h-full flex-col gap-3 rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-secondary"
                >
                  <span className="flex size-10 items-center justify-center rounded-md bg-background text-primary">
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
            className="group mt-5 flex flex-col gap-4 rounded-lg bg-navy p-6 text-white transition-colors hover:bg-navy/90 sm:flex-row sm:items-center sm:justify-between sm:p-7"
          >
            <span className="flex max-w-2xl flex-col">
              <span className="flex items-center gap-2 text-xl font-semibold">
                <HeartHandshake className="size-6 shrink-0" aria-hidden="true" />
                Wsparcie, gdy sytuacja jest trudna
              </span>
              <span className="mt-2 text-white/85">
                Urodzenie martwego dziecka, przedwczesny poród, ciężka choroba dziecka albo rodzica.
                Miejsca i organizacje, które pomagają.
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
