import { Link } from 'react-router-dom'
import { Container } from '@/components/layout/container'
import { cn } from '@/lib/utils'

const COLUMNS = [
  {
    title: 'Przewodnik',
    links: [
      { to: '/swiadczenia', label: 'Świadczenia' },
      { to: '/kalkulator', label: 'Kalkulator' },
      { to: '/dokumenty', label: 'Dokumenty' },
      { to: '/wsparcie', label: 'Wsparcie' },
    ],
  },
  {
    title: 'Informacje',
    links: [
      { to: '/o-projekcie', label: 'O projekcie' },
      { to: '/o-projekcie', label: 'Kontakt' },
      { to: 'https://www.zus.pl', label: 'zus.pl' },
      { to: 'https://www.gov.pl/web/rodzina/urlop-rodzicielski', label: 'gov.pl' },
    ],
  },
]

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={cn('bg-green-deep text-primary-foreground', compact ? 'mt-auto' : 'mt-20')}>
      <Container
        className={cn(
          'grid md:grid-cols-[1.5fr_1fr_1fr]',
          compact ? 'grid-cols-2 gap-4 py-5' : 'gap-10 py-12',
        )}
      >
        <div className={cn(compact && 'col-span-2 md:col-span-1')}>
          <p className="font-display text-lg font-semibold">Zasiłkowy Przewodnik Przyszłego Rodzica</p>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/80">
            Prototyp przygotowany w ramach wyzwania ZUS na HackNation 2026. Dane i obliczenia mają
            charakter demonstracyjny.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold">{column.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/80">
              {column.links.map((link) => (
                <li key={link.label + link.to}>
                  {link.to.startsWith('http') ? (
                    <a className="hover:text-primary-foreground" href={link.to}>
                      {link.label}
                    </a>
                  ) : (
                    <Link className="hover:text-primary-foreground" to={link.to}>
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
        <Container className="flex flex-col gap-2 py-4 text-xs text-primary-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <p>Projekt niezwiązany oficjalnie z ZUS. Materiały ZUS wykorzystane wyłącznie na potrzeby wydarzenia.</p>
          <p>HackNation 2026</p>
        </Container>
      </div>
    </footer>
  )
}
