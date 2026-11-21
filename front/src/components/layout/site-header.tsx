import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
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

/** Znak: korona w kształcie serca na pniu, czyli rodzina i życie. Jeden biały kształt,
    bez drugiego koloru, więc działa tak samo w nagłówku i w favikonie. */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-[26px]', className)} aria-hidden focusable="false">
      <path
        d="M16 25.4C12.3 22.2 3.5 16.4 3.5 11.3 3.5 7.3 6.4 4.5 9.9 4.5 12.5 4.5 14.75 6.1 16 8.8 17.25 6.1 19.5 4.5 22.1 4.5 25.6 4.5 28.5 7.3 28.5 11.3 28.5 16.4 19.7 22.2 16 25.4ZM12.4 21.8H19.6L20.2 28.8A1.2 1.2 0 0 1 19 30H13A1.2 1.2 0 0 1 11.8 28.8Z"
        fill="currentColor"
      />
    </svg>
  )
}

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Strona główna">
      <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <LogoMark />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold text-primary">Przewodnik Rodzica</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">zasiłki i uprawnienia w ZUS</span>
      </span>
    </Link>
  )
}

/** Godło w barwach bieli i czerwieni, obok napisu na przycisku logowania.
    Sam orzeł jest biały i przezroczysty, czerwień to tło elementu, więc kafel
    trzyma ostry kształt w każdym rozmiarze. */
function EagleMark() {
  return (
    <img
      src="/orzel.png"
      alt=""
      aria-hidden
      width={20}
      height={20}
      className="size-5 rounded-[4px] bg-pl-red"
    />
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
                variant="mobywatel"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={startMobywatelLogin}
              >
                <EagleMark />
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
                  variant="mobywatel"
                  className="mt-2"
                  onClick={() => {
                    setOpen(false)
                    startMobywatelLogin()
                  }}
                >
                  <EagleMark />
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
