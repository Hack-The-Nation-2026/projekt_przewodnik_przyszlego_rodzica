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
 * Rolka przeskakuje o sekcję, a kółko dalej kręci swobodnie.
 *
 * Chrome po wciśnięciu środkowego przycisku włącza własne autoprzewijanie:
 * prędkość zależy od odległości kursora, więc jedno kliknięcie potrafi przelecieć
 * całą sekcję i nie da się tego wyczuć. Zamiast tego liczymy sekcję sami —
 * znacznik `data-scroll-section` ma każda sekcja strony głównej — i przewijamy
 * do niej płynnie. Shift z tym samym przyciskiem cofa o jedną sekcję.
 *
 * Zwykłe kręcenie kółkiem, przeciąganie paska i klawiatura nie przechodzą przez
 * ten komponent, bo słucha wyłącznie środkowego przycisku.
 */
function MiddleClickSectionJump() {
  useEffect(() => {
    const keepsNativeBehaviour = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      return Boolean(
        target.closest('a[href], input, textarea, select, [contenteditable="true"]'),
      )
    }

    // Chrome startuje autoprzewijanie już na wciśnięciu, więc blokujemy je tutaj,
    // a sam skok wykonujemy po puszczeniu przycisku.
    const suppressAutoscroll = (event: MouseEvent) => {
      if (event.button !== 1) return
      if (keepsNativeBehaviour(event.target)) return
      event.preventDefault()
    }

    const jump = (event: MouseEvent) => {
      if (event.button !== 1) return
      if (keepsNativeBehaviour(event.target)) return
      event.preventDefault()

      const direction = event.shiftKey ? -1 : 1
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>('[data-scroll-section]'),
      )

      if (sections.length === 0) {
        window.scrollBy({ top: direction * window.innerHeight * 0.9, behavior: 'smooth' })
        return
      }

      const padding =
        Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const edge = window.scrollY + padding + 4
      let current = 0
      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top + window.scrollY <= edge) current = index
      })

      const next = current + direction
      if (next < 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (next >= sections.length) {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
      } else {
        sections[next].scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    const options: AddEventListenerOptions = { capture: true, passive: false }
    document.addEventListener('mousedown', suppressAutoscroll, options)
    document.addEventListener('auxclick', jump, options)

    return () => {
      document.removeEventListener('mousedown', suppressAutoscroll, options)
      document.removeEventListener('auxclick', jump, options)
    }
  }, [])

  return null
}

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <MiddleClickSectionJump />
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