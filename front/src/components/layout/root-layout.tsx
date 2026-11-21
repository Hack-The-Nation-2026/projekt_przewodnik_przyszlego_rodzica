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

// Jeden lekki ruch kółka ma jeszcze przenosić o sekcję. Więcej niż tyle pikseli
// w jednym geście to już świadome przewijanie, więc oddajemy je przeglądarce.
const LIGHT_TICK_MAX_DELTA = 160
// Drugi ruch kółka w tym czasie znaczy „kręcę dalej”, nie „stuknąłem raz”.
const GESTURE_CONFIRM_MS = 70
// Po skoku czekamy, aż gest się wypali, żeby rozmach nie przeskoczył dwóch sekcji.
const JUMP_COOLDOWN_MS = 400
// Cisza, po której uznajemy gest za zakończony.
const GESTURE_IDLE_MS = 200

function isInsideScrollable(target: EventTarget | null) {
  let node = target instanceof Element ? target : null
  while (node && node !== document.body) {
    const style = getComputedStyle(node)
    const scrolls = style.overflowY === 'auto' || style.overflowY === 'scroll'
    if (scrolls && node.scrollHeight > node.clientHeight + 4) return true
    node = node.parentElement
  }
  return false
}

/**
 * Lekki ruch kółka przenosi o sekcję, a zwykłe przewijanie zostaje swobodne.
 *
 * Jedno stuknięcie kółkiem to jedno zdarzenie `wheel` i skok do sąsiedniej sekcji
 * (znacznik `data-scroll-section` mają wszystkie sekcje strony głównej).
 * Gdy w tym samym geście przyleci drugie zdarzenie albo pierwsze jest już duże —
 * czyli użytkownik naprawdę kręci, a nie musnął rolki — przestajemy się wtrącać
 * i strona przewija się normalnie, piksel po pikselu, do końca gestu.
 *
 * Pasek przewijania, klawiatura i trackpad nie mają tu nic do rzeczy: trackpad
 * wysyła strumień drobnych zdarzeń, więc zawsze trafia w tryb swobodny.
 */
function WheelSectionJump() {
  useEffect(() => {
    let jumpTimer: number | undefined
    let idleTimer: number | undefined
    let pendingDirection = 0
    let pendingDelta = 0
    let freeGesture = false
    let cooldownUntil = 0

    const scrollToSection = (direction: number) => {
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>('[data-scroll-section]'),
      )
      if (sections.length === 0) return

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth'
      const padding =
        Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const edge = window.scrollY + padding + 4

      let current = 0
      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top + window.scrollY <= edge) current = index
      })

      const next = current + direction
      if (next < 0) {
        window.scrollTo({ top: 0, behavior })
      } else if (next >= sections.length) {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior })
      } else {
        sections[next].scrollIntoView({ behavior, block: 'start' })
      }
    }

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      if (isInsideScrollable(event.target)) return
      if (document.querySelector('[data-scroll-section]') === null) return

      const now = performance.now()

      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        freeGesture = false
      }, GESTURE_IDLE_MS)

      if (now < cooldownUntil || freeGesture) return

      if (jumpTimer !== undefined) {
        // Drugie zdarzenie w tym samym geście: to przewijanie, nie stuknięcie.
        // Oddajemy też ten ruch, który zdążyliśmy zatrzymać, żeby nic nie uciekało.
        window.clearTimeout(jumpTimer)
        jumpTimer = undefined
        freeGesture = true
        window.scrollBy({ top: pendingDelta, behavior: 'instant' })
        pendingDelta = 0
        return
      }

      if (Math.abs(event.deltaY) > LIGHT_TICK_MAX_DELTA) {
        freeGesture = true
        return
      }

      event.preventDefault()
      pendingDirection = event.deltaY > 0 ? 1 : -1
      pendingDelta = event.deltaY
      jumpTimer = window.setTimeout(() => {
        jumpTimer = undefined
        pendingDelta = 0
        scrollToSection(pendingDirection)
        cooldownUntil = performance.now() + JUMP_COOLDOWN_MS
      }, GESTURE_CONFIRM_MS)
    }

    // Chrome po wciśnięciu rolki włącza własne autoprzewijanie, które jedzie
    // zależnie od odległości kursora. Wyłączamy je, ale samego przycisku nie
    // przejmujemy: linki dalej otwierają się w nowej karcie.
    const suppressAutoscroll = (event: MouseEvent) => {
      if (event.button !== 1) return
      if (event.target instanceof Element && event.target.closest('a[href]')) return
      event.preventDefault()
    }

    const options: AddEventListenerOptions = { capture: true, passive: false }
    window.addEventListener('wheel', onWheel, options)
    document.addEventListener('mousedown', suppressAutoscroll, options)

    return () => {
      window.removeEventListener('wheel', onWheel, options)
      document.removeEventListener('mousedown', suppressAutoscroll, options)
      window.clearTimeout(jumpTimer)
      window.clearTimeout(idleTimer)
    }
  }, [])

  return null
}

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <WheelSectionJump />
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