import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeading } from '@/components/layout/page-heading'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function OProjekciePage() {
  return (
    <PageContainer className="space-y-8 py-12 sm:py-16">
      <PageHeading
        title="O projekcie"
        description="Skrzydła Rodzica to przewodnik po zasiłkach, urlopach i formalnościach związanych z ciążą, narodzinami i przyjęciem dziecka na wychowanie. Projekt powstał na HackNation 2026 w ramach wyzwania ZUS."
      />

      <Card>
        <CardHeader className="pb-4"><h2 className="text-xl font-semibold">Jak skorzystać z przewodnika?</h2></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Zajrzyj do katalogu, jeśli chcesz dowiedzieć się, od czego zacząć. W kalkulatorze
            odpowiedz na pytania, aby zobaczyć wstępną ocenę uprawnień, przewidywane kwoty
            oraz podział urlopu rodzicielskiego. W sekcji Dokumenty znajdziesz formularze ZUS,
            listy załączników i informacje, gdzie je złożyć.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/kalkulator" className={buttonVariants()}>Otwórz kalkulator</Link>
            <Link to="/swiadczenia" className={buttonVariants({ variant: 'outline' })}>Zobacz świadczenia</Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-4"><h2 className="text-xl font-semibold">Wyniki i symulacje</h2></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Wynik ma charakter informacyjny. Prawo do wypłaty ustala właściwy płatnik
              świadczenia. Logowanie przez mObywatel i operacje w sekcji ZUS działają
              w trybie demonstracyjnym.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4"><h2 className="text-xl font-semibold">Technologie i AI</h2></CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>Interfejs jest zbudowany w React i TypeScript, a reguły uprawnień i obliczenia działają w API napisanym w Pythonie i FastAPI.</p>
            <p>W obecnej wersji funkcje aplikacji działają bez AI. W planie jest asystent, który wskaże właściwą podstronę lub oficjalne źródło.</p>
            <a className="inline-block text-primary underline underline-offset-2"
              href="https://github.com/Hack-The-Nation-2026/projekt_przewodnik_przyszlego_rodzica">
              Repozytorium projektu na GitHubie
            </a>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
