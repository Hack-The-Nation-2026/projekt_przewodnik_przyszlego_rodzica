import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { A11yPanel } from '@/components/accessibility/a11y-panel'
import { WingMark } from '@/components/brand/wing-mark'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { ProfileMenu } from '@/components/layout/profile-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useFeature } from '@/hooks/use-settings'

type NavItem = { to: string; label: string; title?: string; end?: boolean }

// Bezpośrednie wejścia. Reszta serwisu siedzi w rozwijanym „Narzędzia", żeby pasek
// nie urósł w długą listę, a każda strona i sekcja pozostała w zasięgu jednego kliknięcia.
const NAV: NavItem[] = [
  { to: '/', label: 'Start', end: true },
  { to: '/swiadczenia', label: 'Świadczenia' },
  { to: '/kalkulator', label: 'Kalkulator' },
  { to: '/dokumenty', label: 'Dokumenty' },
]

// Sekcje, które istnieją tylko na stronie głównej: prowadzimy do nich kotwicą.
const HOME_SECTIONS: NavItem[] = [
  { to: '/#jak-to-dziala', label: 'Jak to działa' },
  { to: '/#narzedzia', label: 'Z czego możesz skorzystać' },
]

const TOOLS: (NavItem & { feature?: 'zus_simulations' })[] = [
  { to: '/urlop', label: 'Jestem w trakcie urlopu' },
  { to: '/planowanie', label: 'Planujesz dziecko?' },
  { to: '/wnioski', label: 'Kreator wniosku urlopowego' },
  { to: '/sprawy', label: 'Sprawy' },
  { to: '/karta', label: 'Karta uprawnień' },
  { to: '/zus', label: 'Symulacja ZUS', feature: 'zus_simulations' },
]

const NAV_TAIL: NavItem[] = [
  { to: '/wsparcie', label: 'Wsparcie' },
  { to: '/odwolanie', label: 'Odwołanie', title: 'Ścieżka po decyzji odmownej' },
  { to: '/panel', label: 'Panel', title: 'Panel administracyjny' },
]

function navLinkClass(isActive: boolean) {
  return cn(
    'rounded-md px-2 py-2 text-sm font-medium whitespace-nowrap transition-colors',
    isActive
      ? 'bg-primary-foreground/10 text-primary-foreground'
      : 'text-primary-foreground/95 hover:bg-primary-foreground/10 hover:text-primary-foreground',
  )
}

function mobileLinkClass(isActive: boolean) {
  return cn(
    'rounded-md px-3 py-2.5 text-sm font-medium',
    isActive
      ? 'bg-primary-foreground/10 text-primary-foreground'
      : 'text-primary-foreground/95 hover:bg-primary-foreground/10 hover:text-primary-foreground',
  )
}

/** Znak serwisu: para skrzydeł anioła na białym kaflu. Ten sam rysunek co w favikonie. */
function LogoMark({ className }: { className?: string }) {
  return <WingMark className={cn('size-7', className)} />
}

function Wordmark() {
  return (
    <Link to="/" className="-my-1 flex shrink-0 items-center gap-2.5 py-1" aria-label="Strona główna">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-foreground text-primary">
        <LogoMark />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-display text-base font-semibold leading-none text-primary-foreground sm:text-lg sm:leading-none">
          Skrzydła Rodzica
        </span>
        <span className="mt-0.5 hidden truncate text-[11px] leading-none text-primary-foreground/95 sm:block">
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

/** Pozycja menu mobilnego. Kotwice wiodą na stronę główną, więc nie podświetlamy ich
    jak bieżącej strony — tylko prawdziwe trasy dostają stan aktywny. */
function MobileLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  if (item.to.includes('#')) {
    return (
      <Link to={item.to} onClick={onNavigate} className={mobileLinkClass(false)}>
        {item.label}
      </Link>
    )
  }
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => mobileLinkClass(isActive)}
    >
      {item.title ?? item.label}
    </NavLink>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const citizen = useAppStore((state) => state.citizen)
  // Panel może wyłączyć ekran ZUS, wtedy link znika z obu nawigacji.
  const zusEnabled = useFeature('zus_simulations')
  const tools = TOOLS.filter((item) => item.feature !== 'zus_simulations' || zusEnabled)
  const toolsActive = tools.some((item) => item.to === location.pathname)
  const mobileGroups: { title?: string; items: NavItem[] }[] = [
    { items: NAV },
    { title: 'Na stronie głównej', items: HOME_SECTIONS },
    { title: 'Narzędzia', items: tools },
    { title: 'Więcej', items: NAV_TAIL },
  ]

  // Wychodzimy na stronę mObywatela i wracamy dokładnie tam, gdzie jesteśmy.
  function startMobywatelLogin() {
    const returnTo = `${location.pathname}${location.search}`
    navigate(`/mobywatel?returnTo=${encodeURIComponent(returnTo)}`)
  }

  return (
    <header className="sticky top-0 z-40 shrink-0" data-print-hide>
      <div className="border-b border-primary-foreground/15 bg-primary text-primary-foreground shadow-sm [--ring:var(--primary-foreground)]">
        <Container className="flex h-16 items-center gap-3 lg:gap-6">
          <Wordmark />

          <nav
            className="hidden flex-1 items-center justify-center gap-0.5 xl:flex xl:px-1"
            aria-label="Nawigacja główna"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.title}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  navLinkClass(toolsActive),
                  'inline-flex cursor-pointer items-center gap-1',
                )}
              >
                Narzędzia
                <ChevronDown aria-hidden="true" className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Na stronie głównej</DropdownMenuLabel>
                {HOME_SECTIONS.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Narzędzia</DropdownMenuLabel>
                {tools.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {NAV_TAIL.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.title}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <A11yPanel />
            {citizen ? (
              <ProfileMenu />
            ) : (
              <Button
                variant="mobywatelHeader"
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
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground xl:hidden"
              aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </Container>

        {open && (
          <nav
            className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-primary-foreground/15 bg-primary xl:hidden"
            aria-label="Nawigacja mobilna"
          >
            <Container className="flex flex-col py-2">
              {mobileGroups.map((group, index) => (
                <div key={group.title ?? `group-${index}`} className="flex flex-col">
                  {group.title && (
                    <p className="mt-2 px-3 pt-2 pb-1 text-xs font-semibold text-primary-foreground/70">
                      {group.title}
                    </p>
                  )}
                  {group.items.map((item) => (
                    <MobileLink key={item.to} item={item} onNavigate={() => setOpen(false)} />
                  ))}
                </div>
              ))}
              {!citizen && (
                <>
                  {/* Na szerokim ekranie ten sam przycisk stoi już w nagłówku. */}
                  <Button
                    variant="mobywatelHeader"
                    className="mt-2 sm:hidden"
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
