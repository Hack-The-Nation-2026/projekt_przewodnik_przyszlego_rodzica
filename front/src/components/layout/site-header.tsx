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

/** Znak: kiełek, czyli dwa liście na łodydze, symbol życia i wzrostu. Łodyga jest szeroka
    u płasko ściętej stopy i z lekko wklęsłymi bokami zwęża się ku liściom, więc wygląda jak
    młody pęd wschodzący z ziemi, a nie jak patyk. Jeden biały kształt, bez drugiego koloru,
    więc działa tak samo w nagłówku i w favikonie. */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-[26px]', className)} aria-hidden focusable="false">
      <path d="M15.5 13.5C13 9 10 6 5 4.8 5.5 9.8 9.5 13 15.5 13.5Z" fill="currentColor" />
      <path d="M16.5 13.5C19 9 22 6 27 4.8 26.5 9.8 22.5 13 16.5 13.5Z" fill="currentColor" />
      <path
        d="M13.5 28.9C13.5 27.4 13.9 21.4 14.9 14.6 15.1 13.3 16.9 13.3 17.1 14.6 18.1 21.4 18.5 27.4 18.5 28.9 18.5 29.5 17.5 29.9 16 29.9 14.5 29.9 13.5 29.5 13.5 28.9Z"
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
    <header className="sticky top-0 z-40 shrink-0">
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
