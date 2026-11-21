import { useState } from 'react'
import { ArrowRight, Calculator, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { benefitList, type BenefitCode } from '@/lib/benefit-interview'

const scenarios = {
  all: 'Wszystkie',
  pregnancy: 'Ciąża',
  birth: 'Poród',
  adoption: 'Adopcja',
  foster: 'Rodzina zastępcza',
}

type Scenario = keyof typeof scenarios

const benefitScenarios: Record<BenefitCode, Exclude<Scenario, 'all'>[]> = {
  chorobowy_w_ciazy: ['pregnancy'],
  rehabilitacyjne: ['pregnancy', 'birth'],
  w_wysokosci_macierzynskiego: ['pregnancy'],
  macierzynski: ['pregnancy', 'birth', 'adoption', 'foster'],
  uzupelniajacy: ['birth', 'adoption', 'foster'],
  rodzicielski: ['birth', 'adoption', 'foster'],
  ojcowski: ['birth', 'adoption'],
}

export function SwiadczeniaPage() {
  const [scenario, setScenario] = useState<Scenario>('all')
  const benefits = (Object.keys(benefitList) as BenefitCode[]).filter((code) =>
    scenario === 'all' || benefitScenarios[code].includes(scenario),
  )
  const placement = scenario === 'adoption' || scenario === 'foster' ? `&sytuacja=${scenario}` : ''

  return (
    <PageContainer className="space-y-8 py-12 sm:py-16">
      <PageHeading
        title="Świadczenia"
        description="Wybierz swoją sytuację i zobacz, jakie świadczenia warto sprawdzić. Kalkulator pomoże Ci ocenić uprawnienia na podstawie Twoich odpowiedzi."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtr według sytuacji">
          {(Object.keys(scenarios) as Scenario[]).map((key) => (
            <Button key={key} type="button" variant={scenario === key ? 'default' : 'outline'}
              aria-pressed={scenario === key} onClick={() => setScenario(key)}>
              {scenarios[key]}
            </Button>
          ))}
        </div>
        <Link to="/kalkulator" className={buttonVariants()}>
          <Calculator aria-hidden="true" /> Otwórz kalkulator
        </Link>
      </div>

      <p className="sr-only" role="status">Liczba świadczeń w katalogu po filtrowaniu: {benefits.length}</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {benefits.map((code) => {
          const { name, what, sources } = benefitList[code]
          return (
            <li key={code}>
              <Card className="flex h-full flex-col">
                <CardHeader className="gap-2 pb-4">
                  <h2 className="text-lg font-semibold">{name}</h2>
                  <p className="text-sm text-muted-foreground">{what}</p>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <ul className="space-y-1 text-sm">
                    {sources.map(({ title, url }) => (
                      <li key={title}><a href={url} className="text-primary underline underline-offset-2">{title}</a></li>
                    ))}
                  </ul>
                  <Link to={`/dokumenty?swiadczenie=${code}${placement}`} className={buttonVariants({ variant: 'outline' })}
                    aria-label={`Dokumenty i terminy – ${name}`}>
                    <FileText aria-hidden="true" /> Dokumenty i terminy <ArrowRight aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>
    </PageContainer>
  )
}
