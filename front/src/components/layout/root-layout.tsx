import { useEffect, useLayoutEffect } from 'react'
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

/**
 * Kliknięcie rolki nie może samo wozić po stronie.
 *
 * Chrome po wciśnięciu środkowego przycisku myszy włącza autoprzewijanie:
 * strona rusza bez udziału użytkownika i potrafi przelecieć całą sekcję.
 * Blokujemy tylko ten przycisk i tylko poza linkami i polami formularza, więc
 * otwieranie w nowej karcie, wklejanie i zwykłe przewijanie kółkiem, paskiem
 * albo klawiaturą zostają bez zmian.
 */
function MiddleClickGuard() {
  useEffect(() => {
    const keepsNativeBehaviour = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      return Boolean(
        target.closest('a[href], input, textarea, select, [contenteditable="true"]'),
      )
    }

    const block = (event: MouseEvent) => {
      if (event.button !== 1) return
      if (keepsNativeBehaviour(event.target)) return
      event.preventDefault()
    }

    const options: AddEventListenerOptions = { capture: true, passive: false }
    document.addEventListener('mousedown', block, options)
    document.addEventListener('auxclick', block, options)

    return () => {
      document.removeEventListener('mousedown', block, options)
      document.removeEventListener('auxclick', block, options)
    }
  }, [])

  return null
}

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <MiddleClickGuard />
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