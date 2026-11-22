import { useState } from 'react'
import { ArrowUpRight, Calculator } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BenefitCard } from '@/components/benefit-card'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { benefitList, type BenefitCode } from '@/lib/benefit-interview'

const scenarios = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'pregnancy', label: 'Ciąża' },
  { value: 'birth', label: 'Poród' },
  { value: 'adoption', label: 'Adopcja' },
  { value: 'foster', label: 'Rodzina zastępcza' },
] as const

type Scenario = (typeof scenarios)[number]['value']
type BenefitScenario = Exclude<Scenario, 'all'>

const benefitScenarios: Record<BenefitCode, BenefitScenario[]> = {
  chorobowy_w_ciazy: ['pregnancy'],
  rehabilitacyjne: ['pregnancy', 'birth'],
  w_wysokosci_macierzynskiego: ['pregnancy'],
  macierzynski: ['pregnancy', 'birth', 'adoption', 'foster'],
  uzupelniajacy: ['birth', 'adoption', 'foster'],
  rodzicielski: ['birth', 'adoption', 'foster'],
  ojcowski: ['birth', 'adoption'],
}

const otherBenefits: {
  name: string
  description: string
  scenarios: BenefitScenario[]
  source: 'ZUS' | 'Gov.pl'
  url: string
}[] = [
  {
    name: 'Świadczenie wychowawcze 800+',
    description: 'Comiesięczne wsparcie na wychowanie dziecka do ukończenia 18 lat. ZUS przyjmuje wnioski elektronicznie.',
    scenarios: ['birth', 'adoption', 'foster'],
    source: 'ZUS',
    url: 'https://www.zus.pl/pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus',
  },
  {
    name: 'Świadczenie rodzicielskie',
    description: 'Wsparcie dla osób opiekujących się dzieckiem, którym nie przysługuje zasiłek macierzyński. Wniosek możesz złożyć przez Emp@tię.',
    scenarios: ['birth', 'adoption', 'foster'],
    source: 'Gov.pl',
    url: 'https://www.gov.pl/web/gov/uzyskaj-swiadczenie-rodzicielskie',
  },
  {
    name: 'Becikowe',
    description: 'Jednorazowa zapomoga po urodzeniu dziecka. Obowiązuje kryterium dochodowe, a o pomoc mogą ubiegać się także rodzice adopcyjni.',
    scenarios: ['birth', 'adoption'],
    source: 'Gov.pl',
    url: 'https://www.gov.pl/web/gov/uzyskaj-becikowe',
  },
  {
    name: 'Zasiłek opiekuńczy',
    description: 'Na czas, kiedy nie możesz pracować, bo opiekujesz się chorym dzieckiem lub w określonych sytuacjach zdrowym dzieckiem.',
    scenarios: ['birth', 'adoption', 'foster'],
    source: 'ZUS',
    url: 'https://www.zus.pl/swiadczenia/zasilki/zasilek-opiekunczy/niezbedne-dokumenty',
  },
  {
    name: 'Aktywny Rodzic',
    description: 'Program wspierający opiekę nad małym dzieckiem, m.in. w żłobku lub w domu. Sprawdź trzy dostępne warianty i ich warunki.',
    scenarios: ['birth', 'adoption', 'foster'],
    source: 'ZUS',
    url: 'https://www.zus.pl/aktywnyrodzic',
  },
]

function ScenarioPanel({ scenario }: { scenario: Scenario }) {
  const benefits = (Object.keys(benefitList) as BenefitCode[]).filter(
    (code) => scenario === 'all' || benefitScenarios[code].includes(scenario),
  )
  const filteredOtherBenefits = otherBenefits.filter(
    (benefit) => scenario === 'all' || benefit.scenarios.includes(scenario),
  )
  const initialRole = scenario === 'adoption' || scenario === 'foster' ? scenario : undefined

  return (
    <div className="space-y-8">
      <p className="sr-only" role="status">
        Liczba pozycji w katalogu po filtrowaniu: {benefits.length + filteredOtherBenefits.length}
      </p>

      <section className="space-y-4" aria-labelledby="calculator-benefits-title">
        <h2 id="calculator-benefits-title" className="font-display text-xl font-semibold">
          Świadczenia w kalkulatorze
        </h2>
        {benefits.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {benefits.map((code) => (
              <li key={code}>
                <BenefitCard code={code} initialRole={initialRole} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Dla tej sytuacji nie ma świadczeń w kalkulatorze. Sprawdź pozostałe zakładki.
          </p>
        )}
      </section>

      {filteredOtherBenefits.length > 0 && (
        <section className="space-y-4" aria-labelledby="other-benefits-title">
          <div className="space-y-1">
            <h2 id="other-benefits-title" className="font-display text-xl font-semibold">
              Inne świadczenia dla rodzin
            </h2>
            <p className="text-sm text-muted-foreground">
              Warunki i wnioski znajdziesz w ZUS lub na Gov.pl.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {filteredOtherBenefits.map(({ name, description, source, url }) => (
              <li key={name}>
                <Card className="flex h-full flex-col">
                  <CardHeader className="gap-2 pb-4">
                    <h3 className="text-lg font-semibold">{name}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <a href={url} className={buttonVariants({ variant: 'outline' })}
                      aria-label={`Warunki i wniosek (${source}) – ${name}`}>
                      Warunki i wniosek <ArrowUpRight aria-hidden="true" />
                    </a>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function SwiadczeniaPage() {
  const [scenario, setScenario] = useState<Scenario>('all')

  return (
    <PageContainer className="space-y-8 py-12 sm:py-16">
      <PageHeading
        title="Świadczenia"
        description="Wybierz swoją sytuację i sprawdź, które świadczenia warto rozważyć."
      />

      <section className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-border bg-secondary/40 p-5">
        <div className="min-w-0 max-w-xl space-y-1.5">
          <h2 className="font-display text-lg font-semibold">
            Sprawdź, co przysługuje w Twojej sytuacji
          </h2>
          <p className="text-sm text-muted-foreground">
            Kalkulator zbiera informacje o zatrudnieniu, ubezpieczeniu i przewidywanej dacie porodu,
            a następnie wylicza wysokość świadczeń, wymiar urlopów i terminy składania wniosków —
            odrębnie dla każdego z rodziców.
          </p>
        </div>
        <Link to="/kalkulator" className={buttonVariants({ size: 'lg' })}>
          <Calculator aria-hidden="true" /> Otwórz kalkulator
        </Link>
      </section>

      <Tabs value={scenario} onValueChange={(value) => setScenario(value as Scenario)}>
        <TabsList label="Filtr według sytuacji" className="sm:flex-nowrap">
          {scenarios.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {scenarios.map((item) => (
          <TabsContent key={item.value} value={item.value} className="mt-8">
            <ScenarioPanel scenario={item.value} />
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  )
}
