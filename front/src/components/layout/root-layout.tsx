import { useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

/**
 * Po każdej zmianie adresu nowy ekran startuje od góry.
 *
 * Bez tego React Router zostawia dotychczasowe przewinięcie i strona z nawigacji
 * otwiera się w środku treści. Efekt działa przed pierwszym malowaniem, więc
 * nie widać przeskoku ze starej pozycji. Adres z kotwicą nadal prowadzi do swojej
 * sekcji, bo taka jest intencja linku.
 */
function ScrollToTop() {
  const location = useLocation()

  useLayoutEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1))
      if (target) {
        target.scrollIntoView({ block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.key, location.hash])

  return null
}

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <a
        href="#tresc"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>
      <SiteHeader />
      <main id="tresc" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}