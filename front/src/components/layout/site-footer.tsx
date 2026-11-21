import { Link } from 'react-router-dom'
import { WingMark } from '@/components/brand/wing-mark'
import { Container } from '@/components/layout/container'
import { useFeature } from '@/hooks/use-settings'

const COLUMNS = [
  {
    title: 'Nawigacja',
    links: [
      { to: '/wejscie', label: 'Wejście i logowanie' },
      { to: '/swiadczenia', label: 'Świadczenia' },
      { to: '/kalkulator', label: 'Kalkulator' },
      { to: '/dokumenty', label: 'Dokumenty' },
      { to: '/zus', label: 'Symulacja ZUS', feature: 'zus_simulations' as const },
      { to: '/wsparcie', label: 'Wsparcie' },
    ],
  },
  {
    title: 'Informacje',
    links: [
      { to: '/panel', label: 'Panel administracyjny' },
      { to: 'https://www.zus.pl', label: 'zus.pl' },
      { to: 'https://www.gov.pl/web/rodzina/urlop-rodzicielski', label: 'gov.pl' },
    ],
  },
]

export function SiteFooter() {
  const zusEnabled = useFeature('zus_simulations')
  const columns = COLUMNS.map((column) => ({
    ...column,
    links: column.links.filter((link) => !('feature' in link) || (link.feature === 'zus_simulations' && zusEnabled)),
  }))

  return (
    <footer className="mt-20 bg-primary text-primary-foreground [--ring:var(--primary-foreground)]">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-foreground text-primary">
              <WingMark className="size-7" />
            </span>
            <p className="font-display text-lg font-semibold">Skrzydła Rodzica</p>
          </div>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/95">
            Zasiłki, terminy i dokumenty związane z ciążą i urodzeniem dziecka w jednym miejscu.
            Liczymy na podstawie ustawy zasiłkowej i Kodeksu pracy.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold">{column.title}</p>
            <ul className="mt-2 text-sm text-primary-foreground/95">
              {column.links.map((link) => (
                <li key={link.label + link.to}>
                  {link.to.startsWith('http') ? (
                    <a className="inline-block py-1 hover:text-primary-foreground" href={link.to}>
                      {link.label}
                    </a>
                  ) : (
                    <Link className="inline-block py-1 hover:text-primary-foreground" to={link.to}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-t border-primary-foreground/15">
        {/* Zapas na dole, żeby przycisk asystenta nie zasłaniał stopki. */}
        <Container className="flex flex-col gap-2 pt-4 pb-20 text-xs text-primary-foreground/95 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Serwis niezależny od Zakładu Ubezpieczeń Społecznych. Znak skrzydeł:{' '}
            <a
              className="underline underline-offset-2 hover:text-primary-foreground"
              href="https://game-icons.net"
            >
              Lorc, game-icons.net
            </a>
            ,{' '}
            <a
              className="underline underline-offset-2 hover:text-primary-foreground"
              href="https://creativecommons.org/licenses/by/3.0/"
            >
              CC BY 3.0
            </a>
            .
          </p>
          <p>HackNation 2026</p>
        </Container>
      </div>
    </footer>
  )
}
