import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { ProfileMenu } from '@/components/layout/profile-menu'
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

/** Znak: roślina, czyli dwa liście na łodydze, symbol życia i wzrostu. Lewy liść jest
    duży, prawy mniejszy, tak jak we wzorcu, więc znak nie jest symetrycznym kleksem.
    Łodyga jest szeroka u płasko ściętej stopy i z lekko wklęsłymi bokami zwęża się
    ku liściom, więc wygląda jak młody pęd wschodzący z ziemi, a nie jak patyk.
    Jeden biały kształt, bez drugiego koloru, więc działa tak samo w nagłówku i w favikonie. */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-[26px]', className)} aria-hidden focusable="false">
      <path d="M15.2 13.8C12.2 7.2 7.6 3.8 3.2 3.8 3.6 9.4 8.4 13.4 15.2 13.8Z" fill="currentColor" />
      <path d="M16.6 13.8C19.4 9.8 23.2 7.2 27.4 6.2 27 10.2 23.4 13.4 16.6 13.8Z" fill="currentColor" />
      <path
        d="M13.5 28.9C13.5 27.4 13.9 21.4 14.9 14.6 15.1 13.3 16.9 13.3 17.1 14.6 18.1 21.4 18.5 27.4 18.5 28.9 18.5 29.5 17.5 29.9 16 29.9 14.5 29.9 13.5 29.5 13.5 28.9Z"
        fill="currentColor"
      />
    </svg>
  )
}

function Wordmark() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Strona główna">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-foreground text-primary">
        <LogoMark />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-display text-base font-semibold text-primary-foreground sm:text-lg">
          Przewodnik Rodzica
        </span>
        <span className="mt-0.5 hidden truncate text-[11px] text-primary-foreground/80 sm:block">
          co ci przysługuje i jak to załatwić
        </span>
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

  // Wychodzimy na stronę mObywatela i wracamy dokładnie tam, gdzie jesteśmy.
  function startMobywatelLogin() {
    const returnTo = `${location.pathname}${location.search}`
    navigate(`/mobywatel?returnTo=${encodeURIComponent(returnTo)}`)
  }

  return (
    <header className="sticky top-0 z-40 shrink-0">
      <div className="border-b border-primary-foreground/15 bg-primary text-primary-foreground shadow-sm">
        <Container className="flex h-16 items-center gap-4">
          <Wordmark />

          <nav
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            aria-label="Nawigacja główna"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-foreground/15 text-primary-foreground'
                      : 'text-primary-foreground/85 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {citizen ? (
              <ProfileMenu />
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
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground lg:hidden"
              aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </Container>

        {open && (
          <nav className="border-t border-primary-foreground/15 bg-primary lg:hidden" aria-label="Nawigacja mobilna">
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
                      isActive
                        ? 'bg-primary-foreground/15 text-primary-foreground'
                        : 'text-primary-foreground/85 hover:bg-primary-foreground/10',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {!citizen && (
                <>
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
                  <Link
                    to="/wejscie"
                    onClick={() => setOpen(false)}
                    className="mt-1 rounded-md px-3 py-2.5 text-center text-sm font-medium text-primary-foreground/85 hover:bg-primary-foreground/10"
                  >
                    Wpisz dane ręcznie
                  </Link>
                </>
              )}
            </Container>
          </nav>
        )}
      </div>
    </header>
  )
}
