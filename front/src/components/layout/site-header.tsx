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

/** Znak: duże serce z mniejszym sercem w środku, czyli rodzic i dziecko.
    Mniejszy kształt jest bursztynowy, więc akcent zostaje widoczny także w favikonie. */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-5', className)} aria-hidden focusable="false">
      <path
        d="M16 21.6C12.8 18.8 5.4 13.8 5.4 9.5 5.4 6.1 7.9 3.7 10.9 3.7 13.1 3.7 15 5.1 16 7.4 17 5.1 18.9 3.7 21.1 3.7 24.1 3.7 26.6 6.1 26.6 9.5 26.6 13.8 19.2 18.8 16 21.6Z"
        fill="currentColor"
      />
      <path
        d="M16 16.2C14.6 15.1 12.1 13.4 12.1 12.1 12.1 10.8 13 9.6 14.2 9.6 15.2 9.6 15.8 10.3 16 11.9 16.2 10.3 16.8 9.6 17.8 9.6 19 9.6 19.9 10.8 19.9 12.1 19.9 13.4 17.4 15.1 16 16.2Z"
        fill="var(--color-gold)"
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
