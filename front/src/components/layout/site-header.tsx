import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Compass, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

const NAV = [
  { to: '/', label: 'Start', end: true },
  { to: '/swiadczenia', label: 'Świadczenia' },
  { to: '/kalkulator', label: 'Kalkulator' },
  { to: '/dokumenty', label: 'Dokumenty' },
  { to: '/wsparcie', label: 'Wsparcie' },
  { to: '/o-projekcie', label: 'O projekcie' },
]

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Strona główna">
      <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Compass className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold text-primary">Przewodnik Rodzica</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">zasiłki i uprawnienia w ZUS</span>
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const citizen = useAppStore((state) => state.citizen)
  const signOut = useAppStore((state) => state.signOut)

  // Wychodzimy na stronę mObywatela i wracamy dokładnie tam, gdzie jesteśmy.
  function startMobywatelLogin() {
    const returnTo = `${location.pathname}${location.search}`
    navigate(`/mobywatel?returnTo=${encodeURIComponent(returnTo)}`)
  }

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-secondary bg-secondary text-secondary-foreground">
        <Container className="flex h-9 items-center justify-between text-xs">
          <p>Wyzwanie ZUS, HackNation 2026</p>
          <div className="hidden items-center gap-4 sm:flex">
            <a className="hover:underline" href="https://www.zus.pl">
              zus.pl
            </a>
            <Link className="hover:underline" to="/o-projekcie">
              Kontakt
            </Link>
          </div>
        </Container>
      </div>

      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Container className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4">
          <Wordmark />

          <nav className="hidden items-center justify-center gap-1 lg:flex" aria-label="Nawigacja główna">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-foreground/80 hover:bg-accent hover:text-primary',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center justify-self-end gap-2">
            {citizen ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm text-muted-foreground">
                  {citizen.first_name} {citizen.last_name}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Wyloguj
                </Button>
              </div>
            ) : (
              <Button
                variant="gold"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={startMobywatelLogin}
              >
                Zaloguj przez mObywatel
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </Container>

        {open && (
          <nav className="border-t border-border bg-background lg:hidden" aria-label="Nawigacja mobilna">
            <Container className="flex flex-col py-2">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2.5 text-sm font-medium',
                      isActive ? 'text-primary' : 'text-foreground/80 hover:bg-accent',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {!citizen && (
                <Button
                  variant="gold"
                  className="mt-2"
                  onClick={() => {
                    setOpen(false)
                    startMobywatelLogin()
                  }}
                >
                  Zaloguj przez mObywatel
                </Button>
              )}
            </Container>
          </nav>
        )}
      </div>
    </header>
  )
}
