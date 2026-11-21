import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MousePointerClick } from 'lucide-react'

/**
 * Przycisk powrotu, który staje po lewej stronie tytułu podstrony.
 *
 * Wracamy historią, gdy użytkownik naprawdę przyszedł z innej strony, a gdy wszedł
 * w adres bezpośrednio, idziemy na adres zapasowy, żeby przycisk nigdy nie był martwy.
 * Pod kursorem strzałka ustępuje ikonie kliknięcia, więc od razu widać, że to przycisk.
 */
export function BackLink({ to, label = 'Wróć' }: { to: string; label?: string }) {
  const navigate = useNavigate()
  const cameFromAnotherPage = window.history.length > 1

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => (cameFromAnotherPage ? navigate(-1) : navigate(to))}
      className="group relative inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-muted-foreground transition-colors hover:bg-neutral-200 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <ArrowLeft className="size-4 transition-opacity group-hover:opacity-0" />
      <MousePointerClick
        aria-hidden
        className="absolute inset-0 m-auto size-4 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </button>
  )
}
