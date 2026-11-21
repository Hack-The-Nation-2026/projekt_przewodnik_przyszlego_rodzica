import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { NotFoundPage } from '@/pages/not-found-page'
import { cn } from '@/lib/utils'

const topics = [
  { id: 'po-poronieniu', title: 'Po poronieniu lub martwym urodzeniu', summary: 'Wsparcie po stracie ciąży i formalności związane z zasiłkiem.' },
  { id: 'po-smierci-dziecka', title: 'Po śmierci dziecka', summary: 'Gdzie szukać pomocy i jak zmienia się okres wypłaty zasiłku.' },
  { id: 'wczesniak', title: 'Wcześniak lub pobyt dziecka w szpitalu', summary: 'Wsparcie dla rodziny i zasady dodatkowego urlopu.' },
  { id: 'ciezka-choroba', title: 'Ciężka choroba dziecka lub rodzica', summary: 'Pomoc rodzinie, program „Za życiem” i świadczenia przy hospitalizacji rodzica.' },
] as const

const zusMaternity = 'https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-urlopu-macierzynskiego-albo-urlopu-na-warunkach-urlopu-macierzynskiego'
const zusDocuments = 'https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty'
const zusForm = 'https://www.zus.pl/-/wniosek-zas-54?redirect=%2Fwzory-formularzy%2Fzasilki%2Fzasilek-macierzynski'

const griefSupport = [
  { name: 'Fundacja Ernesta', summary: 'Bezpłatne wsparcie psychologiczne dla osób po utracie ciąży i dla ich bliskich.', url: 'https://fundacjaernesta.pl/wsparcie-psychologiczne/' },
  { name: 'Fundacja Nagle Sami', summary: 'Wsparcie psychologiczne dla osób przeżywających żałobę.', url: 'https://naglesami.org.pl/' },
]
const prematureSupport = [
  { name: 'Fundacja Koalicja dla Wcześniaka', summary: 'Porady dla rodziców i materiały o opiece nad wcześniakami.', url: 'https://koalicjadlawczesniaka.pl/fundacja/kim-jestesmy' },
  { name: 'Fundacja Wcześniak Rodzice-Rodzicom', summary: 'Kontakty do grup rodziców wcześniaków i społeczności w różnych miastach.', url: 'https://wczesniak.pl/grupy-wsparcia/' },
  { name: 'Stowarzyszenie „Za Wcześnie”', summary: 'Dane kontaktowe stowarzyszenia, które wspiera rodziców wcześniaków.', url: 'https://spis.ngo.pl/293429-stowarzyszenie-za-wczesnie' },
]
const illnessSupport = [
  { name: 'Fundacja Gajusz — hospicjum perinatalne', summary: 'Wsparcie w Łodzi dla rodzin po rozpoznaniu ciężkiej, nieuleczalnej choroby dziecka w ciąży.', url: 'https://gajusz.org.pl/jak-pomagamy/hospicjum-perinatalne/pomoc/' },
  { name: 'Fundacja Gajusz — hospicjum domowe', summary: 'Informacje o opiece paliatywnej dla nieuleczalnie chorych dzieci w domu i o zgłoszeniu rodziny.', url: 'https://gajusz.org.pl/jak-pomagamy/hospicjum-domowe/pomoc/' },
]

const firstFifteenWeeks = 'Uwzględnia się pobyty do końca 15. tygodnia po porodzie.'
const hospitalCases = [
  { case: 'Poród przed ukończeniem 28. tygodnia ciąży', leave: firstFifteenWeeks },
  { case: 'Masa urodzeniowa 1000 g lub mniej', leave: firstFifteenWeeks },
  { case: 'Poród przed ukończeniem 28. tygodnia i masa 1000 g lub mniej', leave: 'Oba warunki dają ten sam okres uwzględniania pobytów, do końca 15. tygodnia po porodzie. Urlop ustala się raz.' },
  { case: 'Ukończony 28. tydzień ciąży, przed ukończeniem 37., masa powyżej 1000 g', leave: 'Uwzględnia się pobyty do końca 8. tygodnia po porodzie.' },
  { case: 'Poród po ukończeniu 37. tygodnia i pobyt w szpitalu', leave: 'Pobyt trwa co najmniej 2 kolejne dni i zaczyna się między 5. a 28. dniem po porodzie. Uwzględnia się pobyty od 5. dnia do końca 8. tygodnia.' },
  { case: 'Więcej niż jedno dziecko przy jednym porodzie', leave: 'Wymiar ustala się według najniższej masy urodzeniowej spośród dzieci i najdłuższej hospitalizacji.' },
]

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="inline-flex min-h-9 items-center gap-1.5 font-medium text-primary underline underline-offset-4">
      <span>{children}</span><ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
    </a>
  )
}

function Organizations({ entries }: { entries: { name: string; summary: string; url: string }[] }) {
  return (
    <section aria-labelledby="organizations-title" className="space-y-3">
      <h2 id="organizations-title" className="text-2xl font-semibold">Gdzie szukać pomocy</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {entries.map(({ name, summary, url }) => (
          <li key={name} className="rounded-lg border border-input bg-background px-4 py-3">
            <h3><SourceLink href={url}>{name}</SourceLink></h3>
            <p className="text-sm text-muted-foreground">{summary}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Guidance({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader><h2 className="text-xl font-semibold">{title}</h2></CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed">{children}</CardContent>
    </Card>
  )
}

function LossGuidance({ pregnancyLoss }: { pregnancyLoss: boolean }) {
  return (
    <Guidance title="Zasiłek macierzyński po stracie">
      {pregnancyLoss ? (
        <>
          <p>Po martwym urodzeniu ubezpieczonej matce przysługuje zasiłek macierzyński za <strong>8 tygodni (56 dni)</strong>.</p>
          <p>Jeżeli sporządzono akt urodzenia z adnotacją o martwym urodzeniu, przygotuj ten dokument. W pozostałych przypadkach poproś o zaświadczenie o martwym urodzeniu na podstawie dokumentacji medycznej. Można je wystawić również po poronieniu, niezależnie od czasu trwania ciąży.</p>
        </>
      ) : (
        <>
          <p>Jeśli dziecko zmarło przed ukończeniem 8 tygodni życia, ubezpieczonej matce przysługuje zasiłek za <strong>8 tygodni po porodzie, co najmniej jednak za 7 dni od dnia śmierci dziecka</strong>.</p>
          <p>Jeśli dziecko zmarło po ukończeniu 8 tygodni życia w trakcie pobierania zasiłku, przysługuje on przez 7 dni od dnia śmierci. Gdy przy jednym porodzie urodziło się więcej dzieci, wymiar zależy od liczby dzieci pozostających przy życiu.</p>
        </>
      )}
      <p>Jeśli zasiłek wypłaca ZUS, skorzystaj z formularza ZAM. Jeśli wypłaca go pracodawca lub inny płatnik składek, przekaż dokumenty płatnikowi.</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <SourceLink href={zusMaternity}>ZUS o zasiłku po stracie</SourceLink>
        <SourceLink href={zusDocuments}>Dokumenty wymagane przez ZUS</SourceLink>
        <SourceLink href={zusForm}>Formularz ZAM</SourceLink>
      </div>
    </Guidance>
  )
}

function HospitalGuidance() {
  return (
    <Guidance title="Uzupełniający urlop macierzyński">
      <p>Tydzień uwzględnionego pobytu w szpitalu daje tydzień urlopu. Pobyt w odpowiednim przedziale sumuje się i zaokrągla w górę do pełnych tygodni.</p>
      <dl className="divide-y divide-border rounded-md border border-input bg-background px-4">
        {hospitalCases.map(({ case: situation, leave }) => (
          <div key={situation} className="grid gap-1.5 py-3 sm:grid-cols-2 sm:gap-5">
            <dt className="font-semibold">{situation}</dt>
            <dd className="text-muted-foreground">{leave}</dd>
          </div>
        ))}
      </dl>
      <p>Jeśli składasz wniosek o urlop do pracodawcy, zrób to co najmniej <strong>21 dni przed końcem urlopu macierzyńskiego</strong>. Przygotuj zaświadczenie ze szpitala i oświadczenie dotyczące korzystania z urlopu lub zasiłku przez drugiego rodzica.</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <SourceLink href="https://www.gov.pl/web/rodzina/uzupelniajacy-urlop-macierzynski">Zasady i dokumenty na gov.pl</SourceLink>
        <SourceLink href={zusForm}>Formularz ZAM</SourceLink>
        <Link to="/kalkulator" className={cn(buttonVariants({ variant: 'outline' }), 'h-auto whitespace-normal')}>
          Sprawdź okres w kalkulatorze
        </Link>
      </div>
    </Guidance>
  )
}

function IllnessGuidance() {
  return (
    <div className="space-y-4">
      <Guidance title="Gdy choruje dziecko">
        <p>Jeśli dziecko ma zaświadczenie „Za życiem”, sprawdź uprawnienie do dłuższego urlopu rodzicielskiego. Możesz też zapytać w lokalnym ośrodku pomocy społecznej o bezpłatne wsparcie asystenta rodziny.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <SourceLink href="https://www.gov.pl/web/zdrowie/informator-za-zyciem-1">Informator „Za życiem”</SourceLink>
          <SourceLink href="https://www.gov.pl/web/gov/skorzystaj-z-pomocy-w-opiece-nad-dziecmi-oraz-w-ich-wychowaniu">Jak uzyskać pomoc asystenta rodziny</SourceLink>
        </div>
      </Guidance>
      <Guidance title="Gdy rodzic trafia do szpitala">
        <p>Jeśli matka przebywa w szpitalu i nie może opiekować się dzieckiem, ubezpieczony ojciec albo inny ubezpieczony członek najbliższej rodziny może sprawdzić prawo do świadczenia za czas opieki. ZUS rozróżnia sytuację przed wykorzystaniem 8 tygodni zasiłku macierzyńskiego przez matkę i po tym okresie.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <SourceLink href="https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-opiekunczy/niezbedne-dokumenty">ZUS o dokumentach do zasiłku opiekuńczego</SourceLink>
          <SourceLink href="https://www.zus.pl/-/jak-uzyskac-zasilek-macierzynski-w-zwiazku-z-pobytem-matki-dziecka-w-szpitalu">ZUS o przejęciu zasiłku macierzyńskiego</SourceLink>
        </div>
      </Guidance>
    </div>
  )
}

export function WsparciePage() {
  const { topic } = useParams()
  const selected = topics.find((item) => item.id === topic)
  if (topic && !selected) return <NotFoundPage />

  return (
    <PageContainer className="space-y-7 py-12 sm:py-16">
      <PageHeading title={selected?.title ?? 'Wsparcie w trudnych sytuacjach'} crumb="Wsparcie"
        description={selected?.summary ?? 'Wybierz sytuację, żeby zobaczyć, gdzie szukać pomocy i jakie dokumenty mogą się przydać.'} />

      {selected ? (
        <>
          <Link to="/wsparcie" className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0')}>
            <ArrowLeft aria-hidden="true" /> Wróć do wyboru sytuacji
          </Link>
          {selected.id === 'wczesniak' ? (
            <>
              <Organizations entries={prematureSupport} />
              <HospitalGuidance />
            </>
          ) : selected.id === 'ciezka-choroba' ? (
            <>
              <Organizations entries={illnessSupport} />
              <IllnessGuidance />
            </>
          ) : (
            <>
              <Organizations entries={griefSupport} />
              <LossGuidance pregnancyLoss={selected.id === 'po-poronieniu'} />
            </>
          )}
        </>
      ) : (
        <nav aria-label="Sytuacje, w których możesz otrzymać wsparcie">
          <ul className="grid gap-4 sm:grid-cols-2">
            {topics.map(({ id, title, summary }) => (
              <li key={id}>
                <Link to={'/wsparcie/' + id}
                  className="flex h-full items-start gap-4 rounded-lg border border-input bg-neutral-100 p-5 hover:bg-secondary">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
                  </div>
                  <ArrowRight className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </PageContainer>
  )
}
